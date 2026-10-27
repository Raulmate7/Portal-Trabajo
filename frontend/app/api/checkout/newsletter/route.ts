import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';
import crypto from 'crypto';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkoutLimiter.limit(ip);
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const body = await request.json();
    const { company_name, company_email, plan = 'newsletter_sponsorship' } = body;

    if (!company_name || !company_email) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Insertar registro pendiente en newsletter_sponsors con ref única
    const client = await pool.connect();
    let sponsorId: number;
    const clientRef = `pending_${crypto.randomUUID()}`;
    try {
      await client.query(
        `INSERT INTO newsletter_sponsors (company_name, company_email, plan, status, stripe_session_id, created_at)
         VALUES ($1, $2, $3, 'pendiente', $4, NOW())`,
        [company_name.trim(), company_email.trim().toLowerCase(), plan, clientRef]
      );
      const res = await client.query(
        `SELECT id FROM newsletter_sponsors WHERE stripe_session_id = $1 LIMIT 1`,
        [clientRef]
      );
      if (!res.rows || res.rows.length === 0) {
        throw new Error('No se pudo recuperar el ID del patrocinador recién creado');
      }
      sponsorId = Number(res.rows[0].id);
    } finally {
      client.release();
    }

    // 2. Determinar precio y datos del producto
    const unitAmount = 4900; // 49€ por patrocinio de newsletter
    const planName = 'Patrocinio de Newsletter - Portal Trabajo IT';
    const planDesc = `Inclusión destacada de tu empresa/producto/oferta en el boletín semanal enviado a más de 8.700 ingenieros.`;

    // 3. Crear sesión de Stripe Checkout usando BASE_URL seguro
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: planName,
              description: planDesc,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/publicidad?success=true&sponsor_id=${sponsorId}`,
      cancel_url: `${BASE_URL}/publicidad?canceled=true`,
      metadata: {
        sponsorId: String(sponsorId),
        company_email: String(company_email.trim().toLowerCase()),
        type: 'newsletter_sponsor',
      },
    });

    // Actualizar session_id en la BD para rastrear
    const updateClient = await pool.connect();
    try {
      await updateClient.query(
        "UPDATE newsletter_sponsors SET stripe_session_id = $1 WHERE id = $2",
        [session.id, sponsorId]
      );
    } finally {
      updateClient.release();
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Newsletter Checkout Session:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
