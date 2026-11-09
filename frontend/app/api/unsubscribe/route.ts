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

// Handler POST: Confirmación explícita con token HMAC verificado (soporta RFC 8058 One-Click, form submit y solicitud de enlace)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const text = await request.text().catch(() => '');
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      body = await request.json().catch(async () => {
        const text = await request.text().catch(() => '');
        if (text) {
          const params = new URLSearchParams(text);
          return Object.fromEntries(params.entries());
        }
        return {};
      });
    }

    const email = ((body.email as string) || searchParams.get('email') || '').trim().toLowerCase();
    const token = ((body.token as string) || searchParams.get('token') || '').trim();

    // Soporte para solicitar enlace directo de baja cuando el usuario no conserva el token
    if (body.action === 'request_link') {
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !EMAIL_REGEX.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Por favor, introduce un correo electrónico válido.' },
          { status: 400 }
        );
      }

      const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || 'portal_unsub_secret_fallback';
      const linkToken = crypto.createHmac('sha256', secret).update(email).digest('hex');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('host') || 'portalempleoit.com';
      const unsubLink = `${protocol}://${host}/darse-de-baja?email=${encodeURIComponent(email)}&token=${linkToken}`;

      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'Portal Trabajo IT <alertas@portalempleoit.com>',
              to: email,
              subject: 'Enlace para cancelar tu suscripción — Portal Trabajo IT',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
                  <h2 style="color: #4338ca; margin-top: 0;">Portal Trabajo IT</h2>
                  <p style="color: #374151; font-size: 15px;">Hola,</p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.5;">
                    Has solicitado darte de baja de las alertas de empleo para <strong>${email}</strong>.
                  </p>
                  <div style="margin: 24px 0;">
                    <a href="${unsubLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                      Confirmar baja en 1 clic →
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                    Si no has solicitado darte de baja, puedes ignorar este mensaje con total tranquilidad.<br/>
                    Portal Trabajo IT · <a href="${protocol}://${host}/privacy" style="color: #4f46e5;">Política de Privacidad</a>
                  </p>
                </div>
              `,
            }),
          });
        } catch (emailErr) {
          console.error('Error enviando enlace de baja por Resend:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Si este correo está suscrito en nuestra lista, te hemos enviado un enlace para cancelar la suscripción con 1 clic en tu bandeja de entrada.',
      });
    }

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
