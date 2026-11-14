import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { getClientIp, subscribeLimiter } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await subscribeLimiter.limitAsync(clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Espera unos segundos.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = (body.email as string || '').trim().toLowerCase();
    const source = (body.source as string || 'web').trim().slice(0, 50);
    const privacyAccepted = body.privacy_accepted === true || body.privacy_accepted === 'true';
    const marketingAccepted = body.marketing_accepted === true || body.marketing_accepted === 'true';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Por favor, proporciona un correo electrónico válido.' },
        { status: 400 }
      );
    }

    const emailHash = crypto.createHash('sha256').update(email).digest('hex');
    const emailLimit = await subscribeLimiter.limitKeyAsync(`email_${emailHash}`);
    if (!emailLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes para este correo. Espera un minuto.' },
        { status: 429 }
      );
    }

    // RGPD Art. 6.1.a y Art. 7: Consentimiento expreso obligatorio
    if (!privacyAccepted) {
      return NextResponse.json(
        { success: false, error: 'Debes aceptar la Política de Privacidad para activar el servicio.' },
        { status: 400 }
      );
    }

    // SEC-052: Verificación anti-bot Turnstile cuando TURNSTILE_SECRET_KEY está configurada
    const turnstileOk = await verifyTurnstileToken(body.turnstileToken || body['cf-turnstile-response'], clientIp);
    if (!turnstileOk) {
      return NextResponse.json(
        { success: false, error: 'Verificación anti-bot inválida o ausente.' },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      const checkRes = await client.query(
        "SELECT id FROM subscribers WHERE email = $1 LIMIT 1",
        [email]
      );

      if (checkRes.rows && checkRes.rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Recordatorio registrado correctamente.'
        });
      }

      // Guardar con frecuencia puntual para recordatorios de guardado o racha
      const frequency = source.includes('reminder') ? 'once' : 'weekly';
      const techKeywords = 'todas';

      // RGPD Art. 7.1: Trazabilidad del consentimiento y Double Opt-In opcional
      const consentIpHash = crypto.createHash('sha256').update(clientIp + (process.env.APP_SECRET || 'consent_salt_v1')).digest('hex');
      const consentPolicyVersion = 'v2026.11';
      const requireDoubleOptIn = process.env.DOUBLE_OPT_IN_REQUIRED === 'true';
      const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.APP_SECRET || '';
      const optInToken = requireDoubleOptIn && secret
        ? crypto.createHmac('sha256', secret).update(`confirm:${email}`).digest('hex')
        : null;
      const initialActive = !requireDoubleOptIn;
      const initialStatus = requireDoubleOptIn ? 'pending_confirmation' : 'active';

      try {
        await client.query(
          `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, source, is_active, status, created_at, consent_timestamp, consent_ip_hash, consent_policy_version, marketing_accepted, consent_alerts_at, consent_marketing_at)
           VALUES ($1, $2, 'Remoto/España', $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, NOW(), ${marketingAccepted ? 'NOW()' : 'NULL'})`,
          [email, techKeywords, frequency, source, initialActive, initialStatus, consentIpHash, consentPolicyVersion, marketingAccepted]
        );
      } catch (insertErr: any) {
        const msg = (insertErr?.message || '').toLowerCase();
        if (msg.includes('unknown column') || msg.includes('er_bad_field_error')) {
          await client.query(
            `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, created_at)
             VALUES ($1, $2, 'Remoto/España', $3, NOW())`,
            [email, techKeywords, frequency]
          );
        } else {
          throw insertErr;
        }
      }

      try {
        await client.query(
          "INSERT INTO consent_audit_log (email_hash, action, policy_version, marketing_accepted, ip_hash, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
          [emailHash, requireDoubleOptIn ? 'subscribe_pending_doi' : 'subscribe_active', consentPolicyVersion, marketingAccepted, consentIpHash]
        );
      } catch {}

      if (requireDoubleOptIn && optInToken && process.env.RESEND_API_KEY) {
        const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portalempleoit.com').replace(/\/+$/, '');
        const confirmUrl = `${baseUrl}/api/subscribe/confirm?email=${encodeURIComponent(email)}&token=${optInToken}`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Portal Trabajo IT <no-reply@portalempleoit.com>',
            to: email,
            subject: 'Confirma tu suscripción a Portal Trabajo IT',
            html: `<p>Hola, pulsa en el siguiente enlace para confirmar tu correo y activar tus alertas: <a href="${confirmUrl}">Confirmar suscripción</a></p>`,
          }),
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        doubleOptInPending: requireDoubleOptIn,
        message: requireDoubleOptIn
          ? 'Te hemos enviado un correo de confirmación para activar tus alertas.'
          : 'Recordatorio registrado con éxito.',
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error en /api/subscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

