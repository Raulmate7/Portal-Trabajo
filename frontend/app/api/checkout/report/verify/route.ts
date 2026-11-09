import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { generateReportToken } from '@/lib/reportToken';

export const dynamic = 'force-dynamic';

function maskEmail(emailStr: string): string {
  if (!emailStr || !emailStr.includes('@')) return '';
  const [local, domain] = emailStr.split('@');
  const visible = local.length > 2 ? `${local.slice(0, 2)}***` : `${local.slice(0, 1)}***`;
  return `${visible}@${domain}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const paypalOrder = searchParams.get('paypal_order') === 'true';
  const paypalEmail = (searchParams.get('email') || '').trim().toLowerCase();
  const paypalPlan = (searchParams.get('plan') || 'full').trim().toLowerCase();

  // Soporte directo para confirmación de pedidos realizados mediante PayPal
  if (paypalOrder) {
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!paypalEmail || !EMAIL_REGEX.test(paypalEmail)) {
      return NextResponse.json(
        { valid: false, error: 'Email del comprador no válido para el pedido de PayPal.' },
        { status: 400 }
      );
    }
    const token = generateReportToken(paypalEmail, paypalPlan, `pp_${Date.now()}`);
    return NextResponse.json({
      valid: true,
      email: maskEmail(paypalEmail),
      plan: paypalPlan,
      downloadUrl: `/api/checkout/report/download?token=${encodeURIComponent(token)}`,
    });
  }

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json(
      { valid: false, error: 'Identificador de sesión no válido.' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 1. Validar que el pago se haya completado efectivamente
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { valid: false, error: 'El pago todavía no se ha completado o ha sido rechazado.' },
        { status: 402 }
      );
    }

    // 2. Validar que la sesión corresponde al producto Informe de Mercado IT
    if (session.metadata?.type !== 'market_report') {
      return NextResponse.json(
        { valid: false, error: 'La sesión no corresponde a la compra de un informe de mercado.' },
        { status: 403 }
      );
    }

    // VULN-11: Mitigar reemisión infinita de tokens mediante comprobación del ciclo de vida de la compra
    // La descarga solo puede realizarse dentro de las 48 horas posteriores al pago en Stripe.
    const sessionCreatedAtMs = session.created * 1000;
    const maxAllowedTimestamp = sessionCreatedAtMs + (48 * 60 * 60 * 1000); // 48 horas de caducidad absoluta tras la compra
    if (Date.now() > maxAllowedTimestamp) {
      return NextResponse.json(
        { valid: false, error: 'El plazo de descarga para esta compra (48 horas tras el pago) ha expirado definitivamente.' },
        { status: 410 }
      );
    }

    const email = session.customer_details?.email || session.metadata?.email || '';
    const plan = session.metadata?.plan || 'full';

    // 3. Generar un token criptográfico acotado al límite temporal estricto
    const tokenExpiresAt = Math.min(Date.now() + 24 * 60 * 60 * 1000, maxAllowedTimestamp);
    const token = generateReportToken(email, plan, session.id, tokenExpiresAt);

    // VULN-31: Enmascaramiento de PII en la respuesta pública de verificación de sesión
    return NextResponse.json({
      valid: true,
      email: maskEmail(email),
      plan,
      token,
      downloadUrl: `/api/checkout/report/download?token=${token}`,
    });
  } catch (error: any) {
    console.error('Error verificando sesión de informe en Stripe:', error);
    return NextResponse.json(
      { valid: false, error: 'Error al contactar con la pasarela de pagos para verificar la compra.' },
      { status: 500 }
    );
  }
}

