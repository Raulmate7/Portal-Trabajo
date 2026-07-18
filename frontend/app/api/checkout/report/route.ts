import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, type = 'full' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Por favor, proporciona un correo válido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    let unitAmount = 990; // 9.99€ (Reporte Completo)
    let productName = 'Informe de Mercado IT Completo - Portal Trabajo IT';
    let productDesc = 'Estadísticas detalladas de salarios reales, ciudades y stacks tecnológicos en España (PDF completo).';

    if (type === 'enterprise') {
      unitAmount = 4900; // 49€ (Reporte de Empresa)
      productName = 'Informe de Mercado IT Custom (Empresas) - Portal Trabajo IT';
      productDesc = 'Datos históricos completos, segmentación tecnológica específica de tu competencia e informes de contratación en España.';
    }

    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: cleanEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/informe-mercado-it?checkout_success=true&email=${encodeURIComponent(cleanEmail)}&plan=${type}`,
      cancel_url: `${baseUrl}/informe-mercado-it?checkout_canceled=true`,
      metadata: {
        email: cleanEmail,
        plan: type,
        type: 'market_report',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Market Report Session:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
