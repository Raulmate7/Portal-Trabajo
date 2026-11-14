import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { getClientIp, unsubscribeLinkLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function getUnsubscribeSecret(): string | null {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  return secret && secret.trim().length > 0 ? secret.trim() : null;
}

function verifyUnsubscribeToken(email: string, token: string): boolean {
  const secret = getUnsubscribeSecret();
  if (!secret || !email || !token) return false;

  const cleanEmail = email.trim().toLowerCase();
  const expectedHash = crypto.createHmac('sha256', secret).update(cleanEmail).digest('hex');

  if (token.length !== expectedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
}

function getSafeSiteBaseUrl(): string {
  const candidate = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://portalempleoit.com'
  ).trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'))) {
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch {}
  return 'https://portalempleoit.com';
}

// Handler GET: Redirige a la página de confirmación para evitar que crawlers o prefetch de clientes de correo cancelen la suscripción
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const baseUrl = getSafeSiteBaseUrl();

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

      // SEC-025: Rate limiting distribuido por IP y por hash del correo normalizado contra Email Bombing
      const clientIp = getClientIp(request);
      const ipLimit = await unsubscribeLinkLimiter.limitAsync(clientIp);
      if (!ipLimit.success) {
        return NextResponse.json(
          { success: false, error: 'Has superado el límite de solicitudes. Inténtalo de nuevo en 15 minutos.' },
          { status: 429 }
        );
      }
      const emailHash = crypto.createHash('sha256').update(email).digest('hex');
      const emailLimit = await unsubscribeLinkLimiter.limitKeyAsync(`email_${emailHash}`);
      if (!emailLimit.success) {
        return NextResponse.json(
          { success: false, error: 'Ya hemos enviado un enlace recientemente a este correo. Revisa tu bandeja o espera 15 minutos.' },
          { status: 429 }
        );
      }

      // Verificación Turnstile si está habilitada en el servidor
      const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
      if (turnstileSecret) {
        const tsToken = (body.turnstileToken || body['cf-turnstile-response'] || '').toString().trim();
        if (!tsToken) {
          return NextResponse.json(
            { success: false, error: 'Completa la verificación anti-bot antes de solicitar el enlace.' },
            { status: 400 }
          );
        }
        const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret: turnstileSecret, response: tsToken, remoteip: clientIp }),
          signal: AbortSignal.timeout(5000),
        }).then(r => r.json()).catch(() => ({ success: false }));
        if (!tsRes?.success) {
          return NextResponse.json(
            { success: false, error: 'Verificación anti-bot inválida.' },
            { status: 403 }
          );
        }
      }

      const secret = getUnsubscribeSecret();
      if (!secret) {
        console.error('❌ Configuración incompleta: falta UNSUBSCRIBE_SECRET o CRON_SECRET para emitir enlaces de baja.');
        return NextResponse.json(
          { success: false, error: 'Servicio de cancelación temporalmente no disponible.' },
          { status: 503 }
        );
      }
      const linkToken = crypto.createHmac('sha256', secret).update(email).digest('hex');
      const baseUrl = getSafeSiteBaseUrl();
      const unsubLink = `${baseUrl}/darse-de-baja?email=${encodeURIComponent(email)}&token=${linkToken}`;
      const escapeHtml = (val: string) =>
        val
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      const safeEmailHtml = escapeHtml(email);
      const safeUnsubLinkHtml = escapeHtml(unsubLink);
      const safeBaseUrlHtml = escapeHtml(baseUrl);

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
                    Has solicitado darte de baja de las alertas de empleo para <strong>${safeEmailHtml}</strong>.
                  </p>
                  <div style="margin: 24px 0;">
                    <a href="${safeUnsubLinkHtml}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                      Confirmar baja en 1 clic →
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                    Si no has solicitado darte de baja, puedes ignorar este mensaje con total tranquilidad.<br/>
                    Portal Trabajo IT · <a href="${safeBaseUrlHtml}/privacy" style="color: #4f46e5;">Política de Privacidad</a>
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
      // LEG-013: Baja integral multi-tabla + lista de supresión (Art. 7.3 y 21 RGPD)
      try {
        await client.query(
          "UPDATE subscribers SET is_active = FALSE, marketing_accepted = FALSE, unsubscribed_at = NOW(), status = 'unsubscribed' WHERE email = $1",
          [email]
        );
      } catch {
        await client.query(
          "UPDATE subscribers SET tech_keywords = NULL, location_pref = NULL WHERE email = $1",
          [email]
        ).catch(() => {});
      }

      // Desactivar registros vinculados en tablas auxiliares
      const auxQueries = [
        "UPDATE alerts SET is_active = FALSE WHERE email = $1",
        "UPDATE saved_jobs_reminders SET is_active = FALSE WHERE email = $1",
        "UPDATE streak_reminders SET is_active = FALSE WHERE email = $1",
        "UPDATE premium_leads SET status = 'unsubscribed' WHERE email = $1",
      ];
      for (const q of auxQueries) {
        try {
          await client.query(q, [email]);
        } catch {}
      }

      // Registrar en lista de supresión interna y audit log de consentimiento
      const unsubEmailHash = crypto.createHash('sha256').update(email).digest('hex');
      try {
        await client.query(
          "INSERT INTO email_suppression_list (email_hash, reason, created_at) VALUES ($1, 'unsubscribe', NOW())",
          [unsubEmailHash]
        );
      } catch {}
      try {
        await client.query(
          "INSERT INTO consent_audit_log (email_hash, action, marketing_accepted, created_at) VALUES ($1, 'unsubscribe', FALSE, NOW())",
          [unsubEmailHash]
        );
      } catch {}

      try {
        await client.query("DELETE FROM email_tracking WHERE email = $1", [email]);
      } catch {}

      const [localPart, domainPart] = email.split('@');
      const masked = localPart && domainPart ? `${localPart.slice(0, 2)}***@${domainPart}` : '***';
      console.log(`📭 Suscriptor dado de baja integralmente: ${masked}`);
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true, message: 'Tu suscripción ha sido cancelada correctamente.' });
  } catch (error: any) {
    console.error('Error al procesar la baja de suscripción:', error);
    return NextResponse.json({ success: false, error: 'Error interno al procesar la cancelación.' }, { status: 500 });
  }
}
