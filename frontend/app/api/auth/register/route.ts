import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '@/lib/db';
import { getClientIp, userRegisterLimiter } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { hashClientIp } from '@/lib/ipHash';
import {
  createAndPersistUserSession,
  ensureUserAuthTables,
  hashPassword,
  USER_SESSION_COOKIE_NAME,
} from '@/lib/userAuth';
import { syncEmailNotificationPreference } from '@/lib/emailSync';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Introduce tu nombre (mínimo 2 caracteres).').max(120),
  email: z.string().trim().email('Introduce un correo electrónico válido.').max(255),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128)
    .refine((val) => /[a-zA-Z]/.test(val) && /\d/.test(val), {
      message: 'La contraseña debe incluir al menos una letra y un número.',
    }),
  role: z.enum(['candidate', 'company', 'recruiter']).optional().default('candidate'),
  privacyAccepted: z.literal(true, {
    error: 'Debes aceptar la Política de Privacidad y los Términos de Uso.',
  }),
  wantsEmails: z.boolean().optional().default(false),
  techKeywords: z.string().max(500).optional(),
  locationPref: z.string().max(100).optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
  turnstileToken: z.string().optional(),
  'cf-turnstile-response': z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = await userRegisterLimiter.limitAsync(clientIp);
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos de registro desde tu red. Espera unos minutos.' },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Datos de registro inválidos.';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const data = parsed.data;
    const cleanEmail = data.email.toLowerCase();

    const tsToken = data.turnstileToken || data['cf-turnstile-response'];
    const turnstileOk = await verifyTurnstileToken(tsToken, clientIp);
    if (!turnstileOk) {
      return NextResponse.json(
        { success: false, error: 'Verificación de seguridad anti-bot inválida o ausente.' },
        { status: 403 }
      );
    }

    await ensureUserAuthTables();

    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [cleanEmail]);
      if (existing.rows && existing.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión para continuar.',
          },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(data.password);
      const userUuid = crypto.randomUUID();
      const consentIpHash = hashClientIp(clientIp);
      const emailHash = crypto.createHash('sha256').update(cleanEmail).digest('hex');

      const insertRes = await client.query(
        `INSERT INTO users (
           uuid, email, password_hash, full_name, role, email_verified,
           email_notifications_enabled, email_consent_updated_at,
           privacy_policy_version, consent_ip_hash, session_version, last_login_at, is_active
         )
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, NOW(), 'v2026.11', $7, 1, NOW(), TRUE)`,
        [userUuid, cleanEmail, passwordHash, data.fullName, data.role, data.wantsEmails, consentIpHash]
      );

      let userId = Number((insertRes as any).insertId || 0);
      if (!userId) {
        const lookup = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [cleanEmail]);
        userId = Number(lookup.rows[0]?.id || 0);
      }

      await syncEmailNotificationPreference({
        client,
        userId,
        email: cleanEmail,
        enabled: data.wantsEmails,
        clientIp,
        action: data.wantsEmails ? 'register_opt_in_emails' : 'register_opt_out_emails',
        techKeywords: data.techKeywords,
        locationPref: data.locationPref,
        frequency: data.frequency,
      });

      try {
        await client.query(
          'INSERT INTO consent_audit_log (email_hash, action, policy_version, marketing_accepted, ip_hash, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [emailHash, 'register_account', 'v2026.11', data.wantsEmails, consentIpHash]
        );
      } catch {}

      const session = await createAndPersistUserSession({
        userId,
        sessionVersion: 1,
        rememberMe: true,
        clientIp,
        userAgent: request.headers.get('user-agent'),
      });

      const response = NextResponse.json(
        {
          success: true,
          message: data.wantsEmails
            ? 'Cuenta creada correctamente con las alertas de correo activadas.'
            : 'Cuenta creada correctamente. No recibirás correos electrónicos promocionales ni alertas salvo que los actives en tu perfil.',
          user: {
            uuid: userUuid,
            email: cleanEmail,
            fullName: data.fullName,
            role: data.role,
            emailNotificationsEnabled: data.wantsEmails,
          },
        },
        { status: 201 }
      );

      response.cookies.set(USER_SESSION_COOKIE_NAME, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: session.maxAgeSeconds,
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al crear la cuenta.' },
      { status: 500 }
    );
  }
}
