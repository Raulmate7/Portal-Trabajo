import { NextResponse } from 'next/server';
import Stripe from 'stripe';
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
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = (email || '').toString().trim().toLowerCase();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 120) {
      return NextResponse.json({ error: 'Por favor, proporciona un correo válido.' }, { status: 400 });
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
      success_url: `${BASE_URL}/referidos?checkout_success=true`,
      cancel_url: `${BASE_URL}/referidos?checkout_canceled=true`,
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
