import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateReportToken } from '@/lib/reportToken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json(
      { valid: false, error: 'Identificador de sesión de Stripe no válido.' },
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

    const email = session.customer_details?.email || session.metadata?.email || '';
    const plan = session.metadata?.plan || 'full';

    // 3. Generar un token criptográfico efímero y seguro para autorizar la descarga del dataset
    const token = generateReportToken(email, plan, session.id);

    return NextResponse.json({
      valid: true,
      email,
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

