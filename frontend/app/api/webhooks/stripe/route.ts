import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  // Manejar el evento checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const type = session.metadata?.type;

    if (type === 'newsletter_sponsor') {
      const sponsorId = session.metadata?.sponsorId;
      if (sponsorId) {
        console.log(`💎 Pago verificado para Patrocinio de Newsletter. ID Sponsor: ${sponsorId}`);
        const client = await pool.connect();
        try {
          await client.query(
            "UPDATE newsletter_sponsors SET status = 'aprobado' WHERE id = $1",
            [sponsorId]
          );
          console.log(`✅ Patrocinio de newsletter con ID ${sponsorId} marcado como aprobado.`);
        } catch (dbErr) {
          console.error(`❌ Error en la base de datos al activar patrocinador ID ${sponsorId}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
    } else if (type === 'premium_candidate') {
      const email = session.metadata?.email;
      if (email) {
        console.log(`🥇 Suscripción confirmada para Candidato Premium: ${email}`);
        const client = await pool.connect();
        try {
          await client.query(
            "UPDATE subscribers SET is_premium = TRUE WHERE email = $1",
            [email]
          );
          console.log(`✅ Suscriptor ${email} actualizado a premium.`);
        } catch (dbErr) {
          console.error(`❌ Error en la base de datos al actualizar premium candidate ${email}:`, dbErr);
          return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
        } finally {
          client.release();
        }
      }
    } else {
      // Es una oferta de trabajo destacada estándar
      const jobId = session.metadata?.jobId;
      const plan = session.metadata?.plan || 'destacado_30d';

      if (jobId) {
        console.log(`💰 Pago verificado para la oferta ID: ${jobId} (Plan: ${plan})`);
        const client = await pool.connect();
        try {
          let days = 30;
          if (plan === 'destacado_basico') {
            days = 15;
          }

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

          // Guardar registro de afiliado si existía un código promocional
          const affiliateCode = session.metadata?.affiliate_code;
          if (affiliateCode) {
            console.log(`🤝 Registrando conversión de afiliado B2B. Código: ${affiliateCode}`);
            // Obtener el email del reclutador del afiliado
            const recruiterRes = await client.query(
              "SELECT recruiter_email FROM recruiter_affiliates WHERE affiliate_code = $1 LIMIT 1",
              [affiliateCode]
            );
            if (recruiterRes.rows && recruiterRes.rows.length > 0) {
              const recruiterEmail = recruiterRes.rows[0].recruiter_email;
              
              // Obtener el nombre de la empresa de la oferta
              const companyRes = await client.query(
                "SELECT company FROM jobs WHERE id = $1 LIMIT 1",
                [jobId]
              );
              const companyName = companyRes.rows && companyRes.rows.length > 0 ? companyRes.rows[0].company : 'Empresa Referida';

              // Insertar registro de comisión referida en la tabla
              await client.query(
                `INSERT INTO recruiter_affiliates (recruiter_email, affiliate_code, referred_company_name, commission_paid, created_at)
                 VALUES ($1, $2, $3, FALSE, NOW())`,
                [recruiterEmail, affiliateCode, companyName]
              );
              console.log(`✅ Afiliado B2B registrado con éxito para el reclutador ${recruiterEmail} y la empresa ${companyName}.`);
            }
          }
        } catch (dbErr) {
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

  return NextResponse.json({ received: true });
}
