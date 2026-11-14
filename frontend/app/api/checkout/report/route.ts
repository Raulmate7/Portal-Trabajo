import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/constants';
import { isValidApiOrigin } from '@/lib/urlSafety';

export async function POST(request: Request) {
  // VULN-30: Validación estricta de origen permitido (CORS/CSRF prevention)
  if (!isValidApiOrigin(request, BASE_URL)) {
    return NextResponse.json({ error: 'Origen de petición no autorizado' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkoutLimiter.limitAsync(ip);
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, type = 'full', waiver_accepted } = body;

    if (waiver_accepted === false) {
      return NextResponse.json(
        { error: 'Debes aceptar la renuncia al derecho de desistimiento de 14 días para la entrega digital inmediata (Art. 103.m TRLGDCU).' },
        { status: 400 }
      );
    }

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = (email || '').toString().trim().toLowerCase();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 120) {
      return NextResponse.json({ error: 'Por favor, proporciona un correo válido.' }, { status: 400 });
    }

    const selectedType = type === 'enterprise' ? 'enterprise' : 'full';
    
    let unitAmount = 999; // 9,99€ IVA incluido (Reporte Completo)
    let productName = 'Informe de Mercado IT Completo - Portal Trabajo IT';
    let productDesc = 'Estadísticas detalladas de salarios reales, ciudades y stacks tecnológicos en España (PDF completo, IVA incluido).';

    if (selectedType === 'enterprise') {
      unitAmount = 4900; // 49€ + IVA (Reporte de Empresa)
      productName = 'Informe de Mercado IT Custom (Empresas) - Portal Trabajo IT';
      productDesc = 'Datos históricos completos, segmentación tecnológica específica de tu competencia e informes de contratación en España (+21% IVA aplicable).';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: cleanEmail,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      invoice_creation: { enabled: true },
      consent_collection: { terms_of_service: 'required' },
      ...(process.env.STRIPE_AUTOMATIC_TAX === 'true' ? { automatic_tax: { enabled: true } } : {}),
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
      success_url: `${BASE_URL}/informe-mercado-it?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/informe-mercado-it?checkout_canceled=true`,
      metadata: {
        email: cleanEmail,
        plan: selectedType,
        type: 'market_report',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Market Report Session:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud del informe' }, { status: 500 });
  }
}
