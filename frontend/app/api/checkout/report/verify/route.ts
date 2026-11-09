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
  const paypalTx = (searchParams.get('tx') || searchParams.get('PayerID') || '').trim();
  const paypalEmail = (searchParams.get('email') || '').trim().toLowerCase();
  const paypalPlan = (searchParams.get('plan') || 'full').trim().toLowerCase();

  // Verificación de retorno de PayPal: exigir identificador de transacción/pagador (tx o PayerID)
  // y rechazar peticiones arbitrarias que solo pasen ?paypal_order=true sin transacción válida
  if (searchParams.get('paypal_order') === 'true') {
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!paypalEmail || !EMAIL_REGEX.test(paypalEmail)) {
      return NextResponse.json(
        { valid: false, error: 'Email del comprador no válido para el pedido de PayPal.' },
        { status: 400 }
      );
    }
    const PAYPAL_TX_REGEX = /^[a-zA-Z0-9_-]{8,36}$/;
    if (!paypalTx || !PAYPAL_TX_REGEX.test(paypalTx)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Confirmación de transacción PayPal pendiente de validación o identificador inválido. Si ya has completado el pago, escríbenos a contacto@portalempleoit.com con tu recibo para recibir el enlace directo.',
        },
        { status: 402 }
      );
    }

    // Validación oficial con PayPal PDT (Payment Data Transfer) si el token de identidad está configurado
    const identityToken = process.env.PAYPAL_IDENTITY_TOKEN;
    if (identityToken) {
      try {
        const paypalHost = process.env.PAYPAL_ENV === 'sandbox' ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com';
        const pdtRes = await fetch(`${paypalHost}/cgi-bin/webscr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `cmd=_notify-synch&tx=${encodeURIComponent(paypalTx)}&at=${encodeURIComponent(identityToken)}`,
        });
        const pdtText = await pdtRes.text();
        if (!pdtText.startsWith('SUCCESS')) {
          return NextResponse.json(
            { valid: false, error: 'La pasarela de PayPal no ha confirmado la validez de la transacción facilitada.' },
            { status: 402 }
          );
        }
      } catch (pdtErr) {
        console.error('Error contactando con API PDT de PayPal:', pdtErr);
      }
    }

    const safePlan = paypalPlan === 'enterprise' ? 'enterprise' : 'full';
    const token = generateReportToken(paypalEmail, safePlan, `pp_${paypalTx}`);
    return NextResponse.json({
      valid: true,
      email: maskEmail(paypalEmail),
      plan: safePlan,
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

