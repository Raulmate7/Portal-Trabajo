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
    const jobId = session.metadata?.jobId;
    const plan = session.metadata?.plan || 'destacado_30d';

    if (jobId) {
      console.log(`💰 Pago confirmado para la oferta ID: ${jobId} (Plan: ${plan})`);

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
      } catch (dbErr) {
        console.error(`❌ Error en la base de datos al activar oferta ID ${jobId}:`, dbErr);
        return NextResponse.json({ error: 'Error interno en la BD' }, { status: 500 });
      } finally {
        client.release();
      }
    } else {
      console.warn('⚠️ No se encontró la metadata "jobId" en la sesión de Stripe Checkout.');
    }
  }

  return NextResponse.json({ received: true });
}
