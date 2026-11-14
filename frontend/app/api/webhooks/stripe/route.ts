import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import stripe from '@/lib/stripe';
import pool from '@/lib/db';
import { generateReportToken } from '@/lib/reportToken';
import { logSecurityEvent } from '@/lib/securityLogger';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Normaliza una dirección de correo eliminando tags de subaddressing (+tag)
 * y unificando el dominio para prevenir fraude de auto-comisión con alias.
 */
function getCanonicalEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.toLowerCase().trim().split('@');
  let cleanLocal = local.split('+')[0];
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    cleanLocal = cleanLocal.replace(/\./g, '');
  }
  return `${cleanLocal}@${domain}`;
}

/**
 * RGPD Art. 5.1.c y Art. 32: Enmascaramiento de correos en registros de servidor para prevenir fugas de PII
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Falta la firma de Stripe o el Webhook Secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    await logSecurityEvent('SECURITY_CRITICAL', 'stripe_webhook_invalid_signature', { message: err?.message });
    console.error(`❌ Error de verificación de Webhook: ${err.message}`);
    return NextResponse.json({ error: `Error de Webhook: ${err.message}` }, { status: 400 });
  }

  // SEC-034: Idempotencia atómica estricta mediante PRIMARY KEY en stripe_processed_events (sin DDL en runtime)
  const eventClient = await pool.connect();
  try {
    const insertRes = await eventClient.query(
      "INSERT INTO stripe_processed_events (event_id, event_type, created_at) VALUES ($1, $2, NOW())",
      [event.id, event.type]
    );
    if (insertRes.rowCount !== 1) {
      console.error(`Error inesperado al registrar idempotencia para evento ${event.id}: rowCount=${insertRes.rowCount}`);
      return NextResponse.json({ error: 'Error de base de datos registrando idempotencia' }, { status: 500 });
    }
  } catch (dupErr: any) {
    const errMsg = (dupErr?.message || '').toLowerCase();
    if (
      errMsg.includes('duplicate') ||
      errMsg.includes('1062') ||
      errMsg.includes('er_dup_entry') ||
      errMsg.includes('unique')
    ) {
      console.log(`ℹ️ Evento Stripe ${event.id} ya procesado previamente. Retornando 200 OK.`);
      return NextResponse.json({ received: true, deduplicated: true });
    }
    console.error('Error registrando idempotencia de evento Stripe:', dupErr);
    return NextResponse.json({ error: 'Error de base de datos registrando idempotencia' }, { status: 500 });
  } finally {
    eventClient.release();
  }

  // 1. Manejo de pagos completados (Inmediatos o confirmación de Asíncronos)
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Vulnerabilidad 1: Comprobar explícitamente que el estado del pago sea 'paid'
    // Para métodos asíncronos (SEPA, transferencias, Boleto), checkout.session.completed llega como 'unpaid'
    if (session.payment_status !== 'paid') {
      console.log(`⏳ Sesión ${session.id} pendiente de cobro efectivo (payment_status: ${session.payment_status}). Esperando confirmación.`);
      return NextResponse.json({ received: true });
    }

    // VULN-07: Comprobación estricta de divisa (requiere explícitamente 'eur' y previene valores nulos/manipulados)
    // VULN-04: Retornar HTTP 200 para evitar tormenta de reintentos infinitos de Stripe ante pagos inválidos
    if (!session.currency || session.currency.toLowerCase() !== 'eur') {
      console.warn(`⚠️ Moneda no admitida o ausente (${session.currency}) en la sesión ${session.id}. Se requiere EUR.`);
      return NextResponse.json({ received: true, status: 'rejected_unauthorized_currency' });
    }

    const type = session.metadata?.type;

    // --- Caso A: Patrocinio directo de Newsletter ---
    if (type === 'newsletter_sponsor') {
      const sponsorId = session.metadata?.sponsorId;
      // VULN-04: Validar importe mínimo esperado (49.00€ = 4900 céntimos) sin devolver 400 para evitar tormenta de reintentos
      if (session.amount_total && session.amount_total < 4900) {
        console.warn(`🚨 DISCREPANCIA FINANCIERA: Monto insuficiente para newsletter_sponsor: recibido ${session.amount_total}, esperado 4900.`);
        return NextResponse.json({ received: true, status: 'rejected_underpaid' });
      }

      if (sponsorId) {
        console.log(`💎 Pago verificado para Patrocinio de Newsletter. ID Sponsor: ${sponsorId}`);
        const client = await pool.connect();
        try {
          // VULN-03: Bloque transaccional explícito START TRANSACTION / COMMIT para que FOR UPDATE sea efectivo
          await client.query('START TRANSACTION');
          const sponsorRes = await client.query(
            "SELECT status FROM newsletter_sponsors WHERE id = $1 LIMIT 1 FOR UPDATE",
            [sponsorId]
          );
          if (sponsorRes.rows && sponsorRes.rows[0]?.status === 'aprobado') {
            console.log(`ℹ️ Patrocinador ID ${sponsorId} ya estaba aprobado previamente. Omitiendo duplicación.`);
          } else {
            await client.query(
              "UPDATE newsletter_sponsors SET status = 'aprobado' WHERE id = $1",
              [sponsorId]
            );
            console.log(`✅ Patrocinio de newsletter con ID ${sponsorId} marcado como aprobado.`);
          }
          await client.query('COMMIT');
        } catch (dbErr) {
          try { await client.query('ROLLBACK'); } catch {}
          try { await pool.query("DELETE FROM stripe_processed_events WHERE event_id = $1", [event.id]); } catch {}
          console.error(`❌ Error en la base de datos al activar patrocinador ID ${sponsorId}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
    } 
    // --- Caso B: Suscripción de Candidato Premium ---
    else if (type === 'premium_candidate') {
      // VULN-04: Validar importe mínimo esperado (4.99€ = 499 céntimos) sin provocar tormenta de reintentos
      if (session.amount_total && session.amount_total < 499) {
        console.warn(`🚨 DISCREPANCIA FINANCIERA: Monto insuficiente para candidato premium: recibido ${session.amount_total}, esperado 499.`);
        return NextResponse.json({ received: true, status: 'rejected_underpaid' });
      }

      const email = (session.metadata?.email || session.customer_details?.email || '').toLowerCase().trim();
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : (session.subscription as any)?.id || null;
      const customerId = typeof session.customer === 'string' 
        ? session.customer 
        : (session.customer as any)?.id || null;

      if (email) {
        console.log(`🥇 Suscripción confirmada para Candidato Premium: ${maskEmail(email)}`);
        const client = await pool.connect();
        try {
          // VULN-03: Bloque transaccional explícito START TRANSACTION / COMMIT para exclusión mutua
          // VULN-32: Almacenar stripe_customer_id y stripe_subscription_id para gestión de ciclo de vida
          await client.query('START TRANSACTION');
          const checkSub = await client.query(
            "SELECT id, is_premium FROM subscribers WHERE email = $1 LIMIT 1 FOR UPDATE",
            [email]
          );
          if (checkSub.rows && checkSub.rows.length > 0) {
            try {
              await client.query(
                "UPDATE subscribers SET is_premium = TRUE, stripe_customer_id = COALESCE($2, stripe_customer_id), stripe_subscription_id = COALESCE($3, stripe_subscription_id) WHERE email = $1",
                [email, customerId, subscriptionId]
              );
            } catch (updErr: any) {
              const msg = (updErr?.message || '').toLowerCase();
              if (msg.includes('unknown column') || msg.includes('er_bad_field_error')) {
                await client.query(
                  "UPDATE subscribers SET is_premium = TRUE WHERE email = $1",
                  [email]
                );
              } else {
                throw updErr;
              }
            }
          } else {
            try {
              await client.query(
                `INSERT INTO subscribers (email, is_premium, frequency, created_at, tech_keywords, stripe_customer_id, stripe_subscription_id)
                 VALUES ($1, TRUE, 'daily', NOW(), 'todas', $2, $3)`,
                [email, customerId, subscriptionId]
              );
            } catch (insErr: any) {
              const msg = (insErr?.message || '').toLowerCase();
              if (msg.includes('unknown column') || msg.includes('er_bad_field_error')) {
                await client.query(
                  `INSERT INTO subscribers (email, is_premium, frequency, created_at, tech_keywords)
                   VALUES ($1, TRUE, 'daily', NOW(), 'todas')`,
                  [email]
                );
              } else {
                throw insErr;
              }
            }
            console.log(`✅ Nuevo suscriptor creado directamente con rango premium: ${maskEmail(email)}`);
          }
          await client.query('COMMIT');
          console.log(`✅ Suscriptor ${maskEmail(email)} actualizado a premium con suscripción vinculada.`);
        } catch (dbErr) {
          try { await client.query('ROLLBACK'); } catch {}
          try { await pool.query("DELETE FROM stripe_processed_events WHERE event_id = $1", [event.id]); } catch {}
          console.error(`❌ Error en la base de datos al actualizar premium candidate ${maskEmail(email)}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
    } 
    // --- Caso C: Compra de Informe de Mercado IT ---
    else if (type === 'market_report') {
      const customerEmail = (session.customer_details?.email || session.metadata?.email || '').toLowerCase().trim();
      const plan = session.metadata?.plan || 'full';
      const expectedReportAmount = plan === 'enterprise' ? 4900 : 990;

      // VULN-04: Mitigación de tormenta de reintentos por 400
      if (session.amount_total && session.amount_total < expectedReportAmount) {
        console.warn(`🚨 DISCREPANCIA FINANCIERA: Monto insuficiente para Informe de Mercado (${plan}): recibido ${session.amount_total}, esperado ${expectedReportAmount}`);
        return NextResponse.json({ received: true, status: 'rejected_underpaid' });
      }

      console.log(`📊 Pago verificado para Informe de Mercado IT (${plan}) de: ${maskEmail(customerEmail)}`);

      // VULN-05: Timeout estricto de 4 segundos con AbortController para prevenir que la API de Resend exceda los 10s de Stripe
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && customerEmail) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
          const downloadToken = generateReportToken(customerEmail, plan, session.id);
          const reportDownloadUrl = `${baseUrl}/api/checkout/report/download?token=${downloadToken}`;
          const reportViewerUrl = `${baseUrl}/informe-mercado-it?session_id=${session.id}`;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'Portal Trabajo IT <alertas@portalempleoit.com>',
              to: customerEmail,
              subject: 'Tu Informe de Mercado IT 2026 — Portal Trabajo IT',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
                  <h2 style="color: #4f46e5; margin-top: 0;">Portal Trabajo IT</h2>
                  <p style="color: #374151; font-size: 15px;">Hola,</p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.5;">
                    ¡Gracias por tu compra! Tu <strong>Informe de Mercado IT 2026 (${plan === 'enterprise' ? 'Edición Empresas / Custom' : 'Edición Completa'})</strong> ya está disponible para su descarga segura.
                  </p>
                  <div style="margin: 24px 0;">
                    <a href="${reportDownloadUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                      📥 Descargar Dataset del Informe (JSON Oficial) →
                    </a>
                  </div>
                  <p style="color: #4b5563; font-size: 13px;">
                    También puedes acceder a la consulta online verificada en cualquier momento desde este enlace: <a href="${reportViewerUrl}" style="color: #4f46e5;">Ver informe en la web</a>
                  </p>
                  <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                    El enlace de descarga directa es personal y está firmado criptográficamente para tu correo (${customerEmail}).
                  </p>
                </div>
              `
            })
          });
          console.log(`📧 Correo de entrega del informe enviado a ${maskEmail(customerEmail)}`);
        } catch (mailErr: any) {
          console.error("Error enviando email con el informe de mercado:", mailErr?.message || mailErr);
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }
    // --- Caso D: Oferta de trabajo destacada estándar ---
    else {
      const jobId = session.metadata?.jobId;
      const plan = session.metadata?.plan || 'destacado_30d';

      // Validar importe según el plan solicitado
      let expectedJobAmount = 1900;
      if (plan === 'destacado_basico') expectedJobAmount = 900;
      else if (plan === 'destacado_enterprise') expectedJobAmount = 4900;

      // VULN-04: Mitigación de tormenta de reintentos por 400
      if (session.amount_total && session.amount_total < expectedJobAmount) {
        console.warn(`🚨 DISCREPANCIA FINANCIERA: Monto insuficiente para activar oferta ID ${jobId} (Plan ${plan}): recibido ${session.amount_total}, esperado ${expectedJobAmount}`);
        return NextResponse.json({ received: true, status: 'rejected_underpaid' });
      }

      if (jobId) {
        console.log(`💰 Pago verificado para la oferta ID: ${jobId} (Plan: ${plan})`);
        const client = await pool.connect();
        try {
          await client.query('START TRANSACTION');

          // Idempotencia y exclusión mutua contra race conditions (FOR UPDATE)
          const checkJobRes = await client.query(
            "SELECT id, is_active, is_featured, company, title, location, salary, description_snippet, url_source FROM jobs WHERE id = $1 LIMIT 1 FOR UPDATE",
            [jobId]
          );

          if (!checkJobRes.rows || checkJobRes.rows.length === 0) {
            console.warn(`⚠️ Oferta ID ${jobId} no encontrada en la base de datos.`);
            await client.query('ROLLBACK');
            return NextResponse.json({ received: true });
          }

          const existingJob = checkJobRes.rows[0];
          const isAlreadyFeatured = Boolean(existingJob.is_featured);

          const intervalDays = plan === 'destacado_basico' ? 15 : 30;
          // VULN-01: Se elimina la interpolación dinámica de cadenas en SQL. Se utiliza un literal estricto validado por whitelist.
          const intervalClause = intervalDays === 15 ? 'INTERVAL 15 DAY' : 'INTERVAL 30 DAY';

          if (isAlreadyFeatured) {
            console.log(`ℹ️ Oferta ID ${jobId} ya estaba activada y destacada previamente. Omitiendo recálculo de días.`);
          } else {
            // Activar la oferta, marcarla como destacada y establecer expiración de destacado
            const query = `
              UPDATE jobs 
              SET is_active = TRUE, 
                  is_featured = TRUE,
                  featured_expires_at = DATE_ADD(NOW(), ${intervalClause}),
                  plan = $2
              WHERE id = $1
            `;
            await client.query(query, [jobId, plan]);
            console.log(`✅ Oferta ID ${jobId} activada y destacada exitosamente por ${intervalDays} días con el Plan ${plan}.`);
          }

          const payerEmail = (
            session.customer_details?.email || 
            session.customer_email || 
            session.metadata?.company_email ||
            ''
          ).toLowerCase().trim();

          // Vincular de forma segura a sponsored_jobs para el panel del reclutador (Vector 13 & 15)
          if (payerEmail && existingJob.url_source) {
            try {
              const checkSpon = await client.query(
                "SELECT id FROM sponsored_jobs WHERE company_email = $1 AND job_url = $2 LIMIT 1 FOR UPDATE",
                [payerEmail, existingJob.url_source]
              );
              if (!checkSpon.rows || checkSpon.rows.length === 0) {
                await client.query(
                  `INSERT INTO sponsored_jobs (company_name, company_email, job_title, job_location, job_salary, job_description, job_url, plan, status, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aprobado', NOW())`,
                  [
                    existingJob.company,
                    payerEmail,
                    existingJob.title,
                    existingJob.location || 'Remoto',
                    existingJob.salary || 'Consultar',
                    existingJob.description_snippet || '',
                    existingJob.url_source,
                    plan
                  ]
                );
              } else {
                await client.query(
                  "UPDATE sponsored_jobs SET status = 'aprobado', plan = $1 WHERE id = $2",
                  [plan, checkSpon.rows[0].id]
                );
              }
            } catch (sponErr) {
              // VULN-06: No silenciar errores de vinculación. Propagar para que el rollback transaccional garantice consistencia
              console.error("❌ Fallo crítico vinculando oferta pagada a sponsored_jobs. Abortando transacción:", sponErr);
              throw sponErr;
            }
          }

          // Guardar registro de afiliado si existía un código promocional
          const affiliateCode = (session.metadata?.affiliate_code || '').trim();
          if (affiliateCode && /^RECR-[A-Z0-9]{4,12}$/i.test(affiliateCode)) {
            console.log(`🤝 Evaluando conversión de afiliado B2B. Código: ${affiliateCode}`);
            const recruiterRes = await client.query(
              "SELECT recruiter_email FROM recruiter_affiliates WHERE affiliate_code = $1 LIMIT 1 FOR UPDATE",
              [affiliateCode.toUpperCase()]
            );

            if (recruiterRes.rows && recruiterRes.rows.length > 0) {
              const recruiterEmail = (recruiterRes.rows[0].recruiter_email || '').toLowerCase().trim();
              const payerEmail = (
                session.customer_details?.email || 
                session.customer_email || 
                ''
              ).toLowerCase().trim();

              // Mitigación de fraude de auto-adjudicación por alias o dominio
              const recruiterCanonical = getCanonicalEmail(recruiterEmail);
              const payerCanonical = getCanonicalEmail(payerEmail);
              const recruiterDomain = recruiterEmail.split('@')[1] || '';
              const payerDomain = payerEmail.split('@')[1] || '';
              const publicDomains = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'proton.me', 'protonmail.com']);

              // SEC-035: Igualdad exacta de identidad local tras normalización (sin coincidencia por subcadena)
              const recruiterLocal = (recruiterEmail.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const payerLocal = (payerEmail.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const isSameLocalIdentity = Boolean(recruiterLocal && payerLocal && recruiterLocal === payerLocal);

              const isSelfReferral = 
                (payerEmail && recruiterCanonical === payerCanonical) ||
                (recruiterDomain && !publicDomains.has(recruiterDomain) && recruiterDomain === payerDomain) ||
                isSameLocalIdentity;

              if (isSelfReferral) {
                console.warn(`⚠️ Intento de auto-comisión denegado: el reclutador (${recruiterEmail}) coincide o comparte dominio corporativo/identidad con el pagador (${payerEmail}).`);
              } else {
                const companyName = existingJob.company || 'Empresa Referida';

                // Idempotencia para la comisión del afiliado con FOR UPDATE
                const checkExistingAff = await client.query(
                  "SELECT id FROM recruiter_affiliates WHERE affiliate_code = $1 AND referred_company_name = $2 LIMIT 1 FOR UPDATE",
                  [affiliateCode.toUpperCase(), companyName]
                );

                if (checkExistingAff.rows && checkExistingAff.rows.length > 0) {
                  console.log(`ℹ️ La comisión de afiliado para la empresa ${companyName} y código ${affiliateCode} ya fue registrada previamente.`);
                } else {
                  try {
                    await client.query(
                      `INSERT INTO recruiter_affiliates (recruiter_email, affiliate_code, referred_company_name, commission_paid, created_at)
                       VALUES ($1, $2, $3, FALSE, NOW())`,
                      [recruiterEmail, affiliateCode.toUpperCase(), companyName]
                    );
                    console.log(`✅ Afiliado B2B registrado con éxito para el reclutador ${maskEmail(recruiterEmail)} y la empresa ${companyName}.`);
                  } catch (affErr) {
                    console.warn(`⚠️ Error al registrar comisión de afiliado (omitido para no abortar activación):`, affErr);
                  }
                }
              }
            }
          }

          await client.query('COMMIT');
        } catch (dbErr) {
          try {
            await client.query('ROLLBACK');
          } catch {}
          try { await pool.query("DELETE FROM stripe_processed_events WHERE event_id = $1", [event.id]); } catch {}
          console.error(`❌ Error en la base de datos al activar oferta ID ${jobId}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      } else {
        console.warn('⚠️ No se encontró la metadata en la sesión de Stripe Checkout.');
      }
    }
  }

  // 2. Manejo de fallos en pagos asíncronos (Asegurar que la oferta permanezca inactiva)
  else if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const jobId = session.metadata?.jobId;
    if (jobId) {
      console.warn(`❌ Pago asíncrono fallido para la oferta ID: ${jobId}. Asegurando desactivación.`);
      const client = await pool.connect();
      try {
        await client.query(
          "UPDATE jobs SET is_active = FALSE, is_featured = FALSE WHERE id = $1",
          [jobId]
        );
      } catch (e) {
        console.error("Error marcando oferta fallida como inactiva:", e);
      } finally {
        client.release();
      }
    }
  }

  // 3. SEC-033: Ciclo de vida de suscripción, renovaciones (invoice.payment_succeeded) y revocación por cancelación/impago
  else if (
    event.type === 'customer.subscription.deleted' ||
    event.type === 'invoice.payment_failed' ||
    event.type === 'invoice.payment_succeeded'
  ) {
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      let customerEmail = '';
      if (customerId) {
        try {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          if (customer && !customer.deleted && customer.email) {
            customerEmail = customer.email.toLowerCase().trim();
          }
        } catch (custErr) {
          console.error('Error recuperando cliente en Stripe para revocación:', custErr);
        }
      }

      const metadataEmail = (subscription.metadata?.email || '').toLowerCase().trim();
      const targetEmails = Array.from(new Set([customerEmail, metadataEmail].filter(Boolean)));

      if (targetEmails.length > 0 || customerId) {
        console.log(`⚠️ Desactivando rango Candidato Premium por cancelación de suscripción: ${targetEmails.map(maskEmail).join(', ')}`);
        const client = await pool.connect();
        try {
          if (customerId) {
            try {
              await client.query("UPDATE subscribers SET is_premium = FALSE WHERE stripe_customer_id = $1", [customerId]);
            } catch {}
          }
          for (const target of targetEmails) {
            await client.query("UPDATE subscribers SET is_premium = FALSE WHERE email = $1", [target]);
          }
        } catch (err) {
          console.error('Error revocando suscripción premium en base de datos:', err);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
      return NextResponse.json({ received: true });
    }

    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    const customerEmail = (invoice.customer_email || '').toLowerCase().trim();

    if (event.type === 'invoice.payment_succeeded') {
      if (customerId || customerEmail) {
        const client = await pool.connect();
        try {
          if (customerId) {
            try {
              await client.query("UPDATE subscribers SET is_premium = TRUE WHERE stripe_customer_id = $1", [customerId]);
            } catch {}
          }
          if (customerEmail) {
            await client.query("UPDATE subscribers SET is_premium = TRUE WHERE email = $1", [customerEmail]);
          }
          console.log(`✅ Suscripción premium confirmada/renovada tras invoice.payment_succeeded (${maskEmail(customerEmail)}).`);
        } catch (err) {
          console.error('Error renovando suscripción premium en invoice.payment_succeeded:', err);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
      return NextResponse.json({ received: true });
    }

    // invoice.payment_failed: respetar periodo de gracia durante Smart Retries si aún quedan reintentos
    const attemptCount = invoice.attempt_count || 0;
    const hasPendingRetry = invoice.next_payment_attempt !== null && attemptCount < 3;
    if (hasPendingRetry) {
      console.warn(`⏳ Fallo transitorio en factura (intento ${attemptCount}) para ${maskEmail(customerEmail)}. Manteniendo estado past_due en periodo de gracia.`);
      return NextResponse.json({ received: true, status: 'past_due_grace' });
    }

    if (customerId || customerEmail) {
      console.log(`⚠️ Desactivando rango Candidato Premium por impago definitivo de factura: ${maskEmail(customerEmail)}`);
      const client = await pool.connect();
      try {
        if (customerId) {
          try {
            await client.query("UPDATE subscribers SET is_premium = FALSE WHERE stripe_customer_id = $1", [customerId]);
          } catch {}
        }
        if (customerEmail) {
          await client.query("UPDATE subscribers SET is_premium = FALSE WHERE email = $1", [customerEmail]);
        }
      } catch (err) {
        console.error('Error revocando suscripción premium en base de datos por impago:', err);
        return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
      } finally {
        client.release();
      }
    }
  }

  // 4. SEC-033: Manejo de reembolsos (charge.refunded) y disputas/contracargos (charge.dispute.created)
  else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    let targetCharge: Stripe.Charge | null = null;
    let shouldRevoke = event.type === 'charge.dispute.created';

    if (event.type === 'charge.refunded') {
      targetCharge = event.data.object as Stripe.Charge;
      shouldRevoke = Boolean(targetCharge.refunded || (targetCharge.amount > 0 && targetCharge.amount_refunded >= targetCharge.amount));
    } else {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      if (chargeId) {
        try {
          targetCharge = await stripe.charges.retrieve(chargeId);
        } catch (chargeErr) {
          console.error('Error recuperando charge asociado a disputa:', chargeErr);
        }
      }
    }

    if (shouldRevoke && targetCharge) {
      const customerId = typeof targetCharge.customer === 'string' ? targetCharge.customer : targetCharge.customer?.id;
      const paymentIntentId = typeof targetCharge.payment_intent === 'string' ? targetCharge.payment_intent : targetCharge.payment_intent?.id;
      const statusLabel = event.type === 'charge.dispute.created' ? 'disputa' : 'reembolsado';

      let session: Stripe.Checkout.Session | null = null;
      if (paymentIntentId) {
        try {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
          session = sessions.data[0] || null;
        } catch (sessErr) {
          console.error('Error recuperando sesión Checkout para reversión financiera:', sessErr);
        }
      }

      const targetEmail = (
        session?.customer_details?.email ||
        session?.metadata?.email ||
        targetCharge.billing_details?.email ||
        targetCharge.receipt_email ||
        ''
      ).toLowerCase().trim();

      const client = await pool.connect();
      try {
        if (session?.metadata?.type === 'sponsored_job' && session.metadata?.jobId) {
          await client.query("UPDATE jobs SET is_active = FALSE, is_featured = FALSE WHERE id = $1", [session.metadata.jobId]);
        } else if (session?.metadata?.type === 'newsletter_sponsor' && session.metadata?.sponsorId) {
          await client.query("UPDATE newsletter_sponsors SET status = $2 WHERE id = $1", [session.metadata.sponsorId, statusLabel]);
        } else if (session?.metadata?.type === 'market_report' && session.id) {
          await client.query("UPDATE report_downloads SET download_count = COALESCE(max_downloads, 5) WHERE session_id = $1", [session.id]);
        }

        if (customerId) {
          try {
            await client.query("UPDATE subscribers SET is_premium = FALSE WHERE stripe_customer_id = $1", [customerId]);
          } catch {}
        }
        if (targetEmail) {
          await client.query("UPDATE subscribers SET is_premium = FALSE WHERE email = $1", [targetEmail]);
        }
        console.warn(`🚨 Privilegios revocados por ${event.type} (cliente: ${maskEmail(targetEmail)}, sesión: ${session?.id || 'n/a'}).`);
      } catch (revokeErr) {
        console.error(`Error revocando privilegios tras ${event.type}:`, revokeErr);
        return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
      } finally {
        client.release();
      }
    }
  }

  return NextResponse.json({ received: true });
}
