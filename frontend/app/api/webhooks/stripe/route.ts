import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';
import { generateReportToken } from '@/lib/reportToken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

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
    console.error(`❌ Error de verificación de Webhook: ${err.message}`);
    return NextResponse.json({ error: `Error de Webhook: ${err.message}` }, { status: 400 });
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

    // Vulnerabilidad 3: Comprobación estricta de divisa (Prevenir manipulación de moneda a divisas de menor valor)
    if (session.currency && session.currency.toLowerCase() !== 'eur') {
      console.warn(`⚠️ Moneda no admitida (${session.currency}) en la sesión ${session.id}. Se requiere EUR.`);
      return NextResponse.json({ error: 'Moneda no autorizada' }, { status: 400 });
    }

    const type = session.metadata?.type;

    // --- Caso A: Patrocinio directo de Newsletter ---
    if (type === 'newsletter_sponsor') {
      const sponsorId = session.metadata?.sponsorId;
      // Validar importe mínimo esperado (49.00€ = 4900 céntimos)
      if (session.amount_total && session.amount_total < 4900) {
        console.warn(`⚠️ Monto insuficiente para newsletter_sponsor: recibido ${session.amount_total}, esperado 4900.`);
        return NextResponse.json({ error: 'Importe de pago insuficiente' }, { status: 400 });
      }

      if (sponsorId) {
        console.log(`💎 Pago verificado para Patrocinio de Newsletter. ID Sponsor: ${sponsorId}`);
        const client = await pool.connect();
        try {
          // Idempotencia y bloqueo para evitar concurrencia
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
        } catch (dbErr) {
          console.error(`❌ Error en la base de datos al activar patrocinador ID ${sponsorId}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
    } 
    // --- Caso B: Suscripción de Candidato Premium ---
    else if (type === 'premium_candidate') {
      // Validar importe mínimo esperado (4.99€ = 499 céntimos)
      if (session.amount_total && session.amount_total < 499) {
        console.warn(`⚠️ Monto insuficiente para candidato premium: recibido ${session.amount_total}, esperado 499.`);
        return NextResponse.json({ error: 'Importe de suscripción insuficiente' }, { status: 400 });
      }

      const email = (session.metadata?.email || session.customer_details?.email || '').toLowerCase().trim();
      if (email) {
        console.log(`🥇 Suscripción confirmada para Candidato Premium: ${email}`);
        const client = await pool.connect();
        try {
          // Upsert seguro con bloqueo y actualización de estado
          const checkSub = await client.query(
            "SELECT id, is_premium FROM subscribers WHERE email = $1 LIMIT 1 FOR UPDATE",
            [email]
          );
          if (checkSub.rows && checkSub.rows.length > 0) {
            await client.query(
              "UPDATE subscribers SET is_premium = TRUE WHERE email = $1",
              [email]
            );
          } else {
            await client.query(
              `INSERT INTO subscribers (email, is_premium, frequency, created_at, tech_keywords)
               VALUES ($1, TRUE, 'daily', NOW(), 'todas')`,
              [email]
            );
            console.log(`✅ Nuevo suscriptor creado directamente con rango premium: ${email}`);
          }
          console.log(`✅ Suscriptor ${email} actualizado a premium.`);
        } catch (dbErr) {
          console.error(`❌ Error en la base de datos al actualizar premium candidate ${email}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
    } 
    // --- Caso C: Compra de Informe de Mercado IT (Vulnerabilidad 1, 2 y 3) ---
    else if (type === 'market_report') {
      const customerEmail = (session.customer_details?.email || session.metadata?.email || '').toLowerCase().trim();
      const plan = session.metadata?.plan || 'full';
      const expectedReportAmount = plan === 'enterprise' ? 4900 : 990;

      if (session.amount_total && session.amount_total < expectedReportAmount) {
        console.warn(`⚠️ Monto insuficiente para Informe de Mercado (${plan}): recibido ${session.amount_total}, esperado ${expectedReportAmount}`);
        return NextResponse.json({ error: 'Importe de informe insuficiente' }, { status: 400 });
      }

      console.log(`📊 Pago verificado para Informe de Mercado IT (${plan}) de: ${customerEmail}`);

      // Enviar correo de entrega con enlace autenticado y token firmado criptográficamente
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && customerEmail) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
          const downloadToken = generateReportToken(customerEmail, plan, session.id);
          const reportDownloadUrl = `${baseUrl}/api/checkout/report/download?token=${downloadToken}`;
          const reportViewerUrl = `${baseUrl}/informe-mercado-it?session_id=${session.id}`;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
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
          console.log(`📧 Correo de entrega del informe enviado a ${customerEmail}`);
        } catch (mailErr) {
          console.error("Error enviando email con el informe de mercado:", mailErr);
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

      if (session.amount_total && session.amount_total < expectedJobAmount) {
        console.warn(`⚠️ Monto insuficiente para activar oferta ID ${jobId} (Plan ${plan}): recibido ${session.amount_total}, esperado ${expectedJobAmount}`);
        return NextResponse.json({ error: 'Importe de activación insuficiente' }, { status: 400 });
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

          let days = 30;
          if (plan === 'destacado_basico') {
            days = 15;
          }

          if (isAlreadyFeatured) {
            console.log(`ℹ️ Oferta ID ${jobId} ya estaba activada y destacada previamente. Omitiendo recálculo de días.`);
          } else {
            // Activar la oferta, marcarla como destacada y establecer expiración de destacado
            const query = `
              UPDATE jobs 
              SET is_active = TRUE, 
                  is_featured = TRUE,
                  featured_expires_at = DATE_ADD(NOW(), INTERVAL ${days} DAY),
                  plan = $2
              WHERE id = $1
            `;
            await client.query(query, [jobId, plan]);
            console.log(`✅ Oferta ID ${jobId} activada y destacada exitosamente por ${days} días con el Plan ${plan}.`);
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
              console.error("Error vinculando oferta pagada a sponsored_jobs:", sponErr);
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

              const isSelfReferral = 
                (payerEmail && recruiterCanonical === payerCanonical) ||
                (recruiterDomain && !publicDomains.has(recruiterDomain) && recruiterDomain === payerDomain);

              if (isSelfReferral) {
                console.warn(`⚠️ Intento de auto-comisión denegado: el reclutador (${recruiterEmail}) coincide o comparte dominio corporativo con el pagador (${payerEmail}).`);
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
                  await client.query(
                    `INSERT INTO recruiter_affiliates (recruiter_email, affiliate_code, referred_company_name, commission_paid, created_at)
                     VALUES ($1, $2, $3, FALSE, NOW())`,
                    [recruiterEmail, affiliateCode.toUpperCase(), companyName]
                  );
                  console.log(`✅ Afiliado B2B registrado con éxito para el reclutador ${recruiterEmail} y la empresa ${companyName}.`);
                }
              }
            }
          }

          await client.query('COMMIT');
        } catch (dbErr) {
          try {
            await client.query('ROLLBACK');
          } catch {}
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

  // 3. Vulnerabilidad 4: Revocación de Candidato Premium por Cancelación o Impago de Suscripción
  else if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
    let customerEmail = '';

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
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
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      customerEmail = (invoice.customer_email || '').toLowerCase().trim();
    }

    if (customerEmail) {
      console.log(`⚠️ Desactivando rango Candidato Premium por cancelación o impago: ${customerEmail}`);
      const client = await pool.connect();
      try {
        await client.query(
          "UPDATE subscribers SET is_premium = FALSE WHERE email = $1",
          [customerEmail]
        );
        console.log(`✅ Suscriptor ${customerEmail} revocado exitosamente a cuenta estándar.`);
      } catch (err) {
        console.error('Error revocando suscripción premium en base de datos:', err);
      } finally {
        client.release();
      }
    }
  }

  return NextResponse.json({ received: true });
}
