import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '@/lib/db';
import { getClientIp, passwordResetLimiter } from '@/lib/rate-limit';
import { ensureUserAuthTables } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

const forgotSchema = z.object({
  email: z.string().trim().email('Introduce un correo electrónico válido.').max(255),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = await passwordResetLimiter.limitAsync(clientIp);
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Has superado el límite de solicitudes. Espera 15 minutos.' },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = forgotSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Correo inválido.' },
        { status: 400 }
      );
    }

    const cleanEmail = parsed.data.email.toLowerCase();
    const emailHash = crypto.createHash('sha256').update(cleanEmail).digest('hex');
    const emailLimit = await passwordResetLimiter.limitKeyAsync(`reset_${emailHash}`);
    if (!emailLimit.success) {
      return NextResponse.json(
        { success: true, message: 'Si existe una cuenta con ese correo, te enviaremos instrucciones de recuperación.' }
      );
    }

    await ensureUserAuthTables();

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT id, full_name, is_active FROM users WHERE email = $1 LIMIT 1',
        [cleanEmail]
      );

      if (res.rows && res.rows.length > 0 && res.rows[0].is_active) {
        const userId = Number(res.rows[0].id);
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutos

        await client.query(
          `INSERT INTO user_password_resets (token_hash, user_id, expires_at, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [tokenHash, userId, expiresAt]
        );

        const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portalempleoit.com').replace(/\/+$/, '');
        const resetUrl = `${baseUrl}/recuperar-password?token=${encodeURIComponent(rawToken)}`;

        if (process.env.RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'Portal Trabajo IT <no-reply@portalempleoit.com>',
              to: cleanEmail,
              subject: 'Restablecer contraseña — Portal Trabajo IT',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                  <h2 style="color: #4338ca; margin-top: 0;">Recuperación de contraseña</h2>
                  <p style="color: #374151; font-size: 14px; line-height: 1.5;">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Portal Trabajo IT</strong>.
                    Este enlace caduca en 30 minutos y solo puede usarse una vez.
                  </p>
                  <p style="margin: 24px 0;">
                    <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                      Restablecer mi contraseña
                    </a>
                  </p>
                  <p style="color: #6b7280; font-size: 12px;">
                    Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                  </p>
                </div>
              `,
            }),
          }).catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña.',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en /api/auth/forgot-password:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al procesar la solicitud.' },
      { status: 500 }
    );
  }
}
