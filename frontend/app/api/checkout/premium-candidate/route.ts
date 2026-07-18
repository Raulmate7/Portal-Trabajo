import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Por favor, proporciona un correo válido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Determinar urls de retorno
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Crear sesión de Stripe Checkout en modo Suscripción
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
      success_url: `${baseUrl}/referidos?checkout_success=true&email=${encodeURIComponent(cleanEmail)}`,
      cancel_url: `${baseUrl}/referidos?checkout_canceled=true`,
      metadata: {
        email: cleanEmail,
        type: 'premium_candidate',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Premium Candidate Session:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
