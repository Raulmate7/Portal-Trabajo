import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '@/lib/db';
import { getClientIp } from '@/lib/rate-limit';
import {
  createAndPersistUserSession,
  getCurrentUser,
  hashPassword,
  USER_SESSION_COOKIE_NAME,
  verifyPassword,
} from '@/lib/userAuth';
import { syncEmailNotificationPreference } from '@/lib/emailSync';

export const dynamic = 'force-dynamic';

const patchMeSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  techKeywords: z.string().max(500).optional(),
  locationPref: z.string().max(100).optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  techKeywordsJson: z.string().max(4000).nullable().optional(),
  currentPassword: z.string().min(1).max(128).optional(),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
    .max(128)
    .refine((val) => /[a-zA-Z]/.test(val) && /\d/.test(val), {
      message: 'La nueva contraseña debe incluir al menos una letra y un número.',
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    const strict = request.nextUrl.searchParams.get('strict') === '1';
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: strict ? 401 : 200 }
    );
  }

  const client = await pool.connect();
  try {
    let subscriberPrefs: any = null;
    try {
      const subRes = await client.query(
        `SELECT tech_keywords, location_pref, frequency, tech_keywords_json, referrals_count
         FROM subscribers
         WHERE email = $1
         LIMIT 1`,
        [user.email]
      );
      if (subRes.rows && subRes.rows.length > 0) {
        subscriberPrefs = subRes.rows[0];
      }
    } catch {}

    let savedJobsCount = 0;
    try {
      const savedRes = await client.query(
        'SELECT COUNT(*) AS total FROM user_saved_jobs WHERE user_id = $1',
        [user.id]
      );
      savedJobsCount = Number(savedRes.rows[0]?.total || 0);
    } catch {}

    return NextResponse.json({
      authenticated: true,
      user: {
        uuid: user.uuid,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        emailConsentUpdatedAt: user.emailConsentUpdatedAt,
      },
      preferences: subscriberPrefs || {
        tech_keywords: '',
        location_pref: 'Remoto/España',
        frequency: 'weekly',
        tech_keywords_json: null,
        referrals_count: 0,
      },
      savedJobsCount,
    });
  } finally {
    client.release();
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Sesión no válida o expirada.' }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsed = patchMeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const clientIp = getClientIp(request);
  const client = await pool.connect();

  try {
    let rotatedSessionToken: { token: string; maxAgeSeconds: number } | null = null;

    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Debes indicar tu contraseña actual para cambiarla.' },
          { status: 400 }
        );
      }

      const passRes = await client.query('SELECT password_hash, session_version FROM users WHERE id = $1 LIMIT 1', [
        user.id,
      ]);
      const currentHash = String(passRes.rows[0]?.password_hash || '');
      const valid = await verifyPassword(data.currentPassword, currentHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'La contraseña actual no es correcta.' },
          { status: 403 }
        );
      }

      const newHash = await hashPassword(data.newPassword);
      const nextVersion = Number(passRes.rows[0]?.session_version || user.sessionVersion) + 1;
      await client.query(
        'UPDATE users SET password_hash = $1, session_version = $2 WHERE id = $3',
        [newHash, nextVersion, user.id]
      );
      await client.query('UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1', [user.id]);

      const newSession = await createAndPersistUserSession({
        userId: user.id,
        sessionVersion: nextVersion,
        rememberMe: true,
        clientIp,
        userAgent: request.headers.get('user-agent'),
      });
      rotatedSessionToken = { token: newSession.token, maxAgeSeconds: newSession.maxAgeSeconds };
    }

    if (data.fullName !== undefined) {
      await client.query('UPDATE users SET full_name = $1 WHERE id = $2', [data.fullName, user.id]);
    }

    const nextEmailPref =
      data.emailNotificationsEnabled !== undefined
        ? data.emailNotificationsEnabled
        : user.emailNotificationsEnabled;

    if (data.emailNotificationsEnabled !== undefined) {
      await client.query(
        'UPDATE users SET email_notifications_enabled = $1, email_consent_updated_at = NOW() WHERE id = $2',
        [data.emailNotificationsEnabled, user.id]
      );
    }

    if (
      data.emailNotificationsEnabled !== undefined ||
      data.techKeywords !== undefined ||
      data.locationPref !== undefined ||
      data.frequency !== undefined ||
      data.techKeywordsJson !== undefined
    ) {
      await syncEmailNotificationPreference({
        client,
        userId: user.id,
        email: user.email,
        enabled: nextEmailPref,
        clientIp,
        action:
          data.emailNotificationsEnabled === true
            ? 'profile_opt_in_emails'
            : data.emailNotificationsEnabled === false
            ? 'profile_opt_out_emails'
            : 'profile_update_alert_preferences',
        techKeywords: data.techKeywords,
        locationPref: data.locationPref,
        frequency: data.frequency,
        techKeywordsJson: data.techKeywordsJson,
      });
    }

    const response = NextResponse.json({
      success: true,
      emailNotificationsEnabled: nextEmailPref,
      message: 'Preferencias actualizadas correctamente.',
    });

    if (rotatedSessionToken) {
      response.cookies.set(USER_SESSION_COOKIE_NAME, rotatedSessionToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: rotatedSessionToken.maxAgeSeconds,
      });
    }

    return response;
  } catch (error) {
    console.error('Error en PATCH /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el perfil.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const currentPassword = typeof rawBody.currentPassword === 'string' ? rawBody.currentPassword : '';
  if (!currentPassword) {
    return NextResponse.json(
      { success: false, error: 'Confirma tu contraseña para eliminar tu cuenta.' },
      { status: 400 }
    );
  }

  const clientIp = getClientIp(request);
  const client = await pool.connect();

  try {
    const passRes = await client.query('SELECT password_hash FROM users WHERE id = $1 LIMIT 1', [user.id]);
    const currentHash = String(passRes.rows[0]?.password_hash || '');
    const valid = await verifyPassword(currentPassword, currentHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'La contraseña introducida no es correcta.' },
        { status: 403 }
      );
    }

    const emailHash = crypto.createHash('sha256').update(user.email).digest('hex');
    const ipSalt = process.env.APP_SECRET || 'consent_salt_v1';
    const ipHash = crypto.createHash('sha256').update(`${clientIp}:${ipSalt}`).digest('hex');

    await client.query('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM user_password_resets WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM user_saved_jobs WHERE user_id = $1', [user.id]);
    await client.query('DELETE FROM subscribers WHERE email = $1', [user.email]);
    await client.query(
      `INSERT IGNORE INTO email_suppression_list (email_hash, reason, created_at)
       VALUES ($1, 'account_deleted_gdpr', NOW())`,
      [emailHash]
    );
    await client.query(
      `INSERT INTO consent_audit_log (email_hash, action, policy_version, marketing_accepted, ip_hash, created_at)
       VALUES ($1, 'account_deleted_gdpr', 'v2026.11', FALSE, $2, NOW())`,
      [emailHash, ipHash]
    );
    await client.query('DELETE FROM users WHERE id = $1', [user.id]);

    const response = NextResponse.json({
      success: true,
      message: 'Tu cuenta y datos personales han sido eliminados de forma permanente.',
    });
    response.cookies.set(USER_SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('Error en DELETE /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al eliminar la cuenta.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
