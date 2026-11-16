import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '@/lib/db';
import { getClientIp, userLoginLimiter } from '@/lib/rate-limit';
import {
  createAndPersistUserSession,
  ensureUserAuthTables,
  USER_SESSION_COOKIE_NAME,
  verifyPassword,
} from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email('Introduce un correo electrónico válido.').max(255),
  password: z.string().min(1, 'Introduce tu contraseña.').max(128),
  rememberMe: z.boolean().optional().default(true),
});

// Hash dummy precalculado para igualar tiempos ante cuentas inexistentes (anti-enumeración)
const DUMMY_HASH =
  'scrypt:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = await userLoginLimiter.limitAsync(clientIp);
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Credenciales inválidas.' },
        { status: 400 }
      );
    }

    const cleanEmail = parsed.data.email.toLowerCase();
    const emailKey = `email_${crypto.createHash('sha256').update(cleanEmail).digest('hex')}`;
    const emailLimit = await userLoginLimiter.limitKeyAsync(emailKey);
    if (!emailLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Inténtalo en 15 minutos.' },
        { status: 429 }
      );
    }

    await ensureUserAuthTables();

    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT id, uuid, email, password_hash, full_name, role, email_verified,
                email_notifications_enabled, session_version, is_active
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [cleanEmail]
      );

      if (!res.rows || res.rows.length === 0) {
        await verifyPassword(parsed.data.password, DUMMY_HASH);
        return NextResponse.json(
          { success: false, error: 'Correo electrónico o contraseña incorrectos.' },
          { status: 401 }
        );
      }

      const user = res.rows[0];
      const validPassword = await verifyPassword(parsed.data.password, String(user.password_hash || ''));
      if (!validPassword || !user.is_active) {
        return NextResponse.json(
          { success: false, error: 'Correo electrónico o contraseña incorrectos.' },
          { status: 401 }
        );
      }

      // SEC-026: Resetear solo el contador por cuenta, nunca el límite global por IP
      await userLoginLimiter.resetAsync(emailKey);

      await client.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const session = await createAndPersistUserSession({
        userId: Number(user.id),
        sessionVersion: Number(user.session_version || 1),
        rememberMe: parsed.data.rememberMe,
        clientIp,
        userAgent: request.headers.get('user-agent'),
      });

      const response = NextResponse.json({
        success: true,
        user: {
          uuid: String(user.uuid),
          email: String(user.email),
          fullName: user.full_name ? String(user.full_name) : null,
          role: user.role || 'candidate',
          emailVerified: Boolean(user.email_verified),
          emailNotificationsEnabled: Boolean(user.email_notifications_enabled),
        },
      });

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
    console.error('Error en /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al iniciar sesión.' },
      { status: 500 }
    );
  }
}
