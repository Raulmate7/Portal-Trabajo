import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function verifyUnsubscribeToken(email: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  if (!secret || !email || !token) return false;

  const cleanEmail = email.trim().toLowerCase();
  const expectedHash = crypto.createHmac('sha256', secret).update(cleanEmail).digest('hex');

  if (token.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
}

// Handler GET: Redirige a la página de confirmación para evitar que crawlers o prefetch de clientes de correo cancelen la suscripción
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host') || 'portalempleoit.com';
  const baseUrl = `${protocol}://${host}`;

  const redirectUrl = new URL('/darse-de-baja', baseUrl);
  if (email) redirectUrl.searchParams.set('email', email);
  if (token) redirectUrl.searchParams.set('token', token);

  return NextResponse.redirect(redirectUrl.toString());
}

// Handler POST: Confirmación explícita con token HMAC verificado (soporta RFC 8058 One-Click y form submit)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const email = ((body.email as string) || searchParams.get('email') || '').trim().toLowerCase();
    const token = ((body.token as string) || searchParams.get('token') || '').trim();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Falta el correo del suscriptor.' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Falta el token de seguridad de baja.' }, { status: 400 });
    }

    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ success: false, error: 'Token de seguridad inválido o caducado.' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      // Vector 25: Cumplimiento estricto del derecho de supresión RGPD (Borrado físico prioritario + neutralización defensiva)
      try {
        await client.query("DELETE FROM subscribers WHERE email = $1", [email]);
      } catch (delErr) {
        console.warn('DELETE no admitido directamente en el proxy/motor, aplicando neutralización de datos RGPD:', delErr);
        await client.query(
          "UPDATE subscribers SET email = CONCAT('unsubscribed_', id, '@deleted.local'), tech_keywords = NULL, location_pref = NULL WHERE email = $1",
          [email]
        );
      }
      try {
        await client.query("DELETE FROM email_tracking WHERE email = $1", [email]);
      } catch {}
      const safeLogEmail = email.replace(/[\r\n\x00-\x1f]/g, '');
      console.log(`📭 Suscriptor dado de baja con token verificado: ${safeLogEmail}`);
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true, message: 'Tu suscripción ha sido cancelada correctamente.' });
  } catch (error: any) {
    console.error('Error al procesar la baja de suscripción:', error);
    return NextResponse.json({ success: false, error: 'Error interno al procesar la cancelación.' }, { status: 500 });
  }
}
