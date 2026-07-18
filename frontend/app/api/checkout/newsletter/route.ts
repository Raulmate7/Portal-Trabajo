import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_name, company_email, plan = 'newsletter_sponsorship' } = body;

    if (!company_name || !company_email) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Insertar registro pendiente en newsletter_sponsors
    const client = await pool.connect();
    let sponsorId: number;
    try {
      const res = await client.query(
        `INSERT INTO newsletter_sponsors (company_name, company_email, plan, status, created_at)
         VALUES ($1, $2, $3, 'pendiente', NOW()) RETURNING id`,
        [company_name.trim(), company_email.trim().toLowerCase(), plan]
      );
      sponsorId = res.rows[0].id;
    } finally {
      client.release();
    }

    // 2. Determinar precio y datos del producto
    const unitAmount = 4900; // 49€ por patrocinio de newsletter
    const planName = 'Patrocinio de Newsletter - Portal Trabajo IT';
    const planDesc = `Inclusión destacada de tu empresa/producto/oferta en el boletín semanal enviado a más de 8.700 ingenieros.`;

    // 3. Crear sesión de Stripe Checkout
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

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
      success_url: `${baseUrl}/publicidad?success=true&sponsor_id=${sponsorId}`,
      cancel_url: `${baseUrl}/publicidad?canceled=true`,
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
