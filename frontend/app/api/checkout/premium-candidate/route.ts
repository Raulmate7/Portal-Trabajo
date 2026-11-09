import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import pool from '@/lib/db';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/constants';
import { isValidApiOrigin } from '@/lib/urlSafety';

export async function POST(request: Request) {
  // VULN-30: Validación estricta de origen permitido (CORS/CSRF prevention)
  if (!isValidApiOrigin(request, BASE_URL)) {
    return NextResponse.json({ error: 'Origen de petición no autorizado' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkoutLimiter.limit(ip);
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = (email || '').toString().trim().toLowerCase();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 120) {
      return NextResponse.json({ error: 'Por favor, proporciona un correo válido.' }, { status: 400 });
    }

    // VULN-18: Comprobar suscripción activa previa para evitar facturación duplicada concurrente
    const client = await pool.connect();
    try {
      const existingSub = await client.query(
        "SELECT id, is_premium FROM subscribers WHERE email = $1 LIMIT 1",
        [cleanEmail]
      );
      if (existingSub.rows && existingSub.rows.length > 0 && existingSub.rows[0].is_premium) {
        return NextResponse.json(
          { error: 'Esta dirección de correo ya cuenta con una suscripción activa a Candidato Premium.' },
          { status: 409 }
        );
      }
    } finally {
      client.release();
    }

    // Crear sesión de Stripe Checkout en modo Suscripción usando BASE_URL seguro
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: cleanEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acceso Candidato Premium - Portal Trabajo IT',
              description: 'Alertas de empleo instantáneas, visualización prioritaria de ofertas 24h antes, y acceso completo a salarios históricos.',
            },
            unit_amount: 499, // 4.99€ al mes
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${BASE_URL}/talento-premium?checkout_success=true`,
      cancel_url: `${BASE_URL}/talento-premium?checkout_canceled=true`,
      metadata: {
        email: cleanEmail,
        type: 'premium_candidate',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Premium Candidate Session:', error);
    return NextResponse.json({ error: 'Error al procesar la suscripción de candidato' }, { status: 500 });
  }
}
