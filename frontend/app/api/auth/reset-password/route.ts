import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '@/lib/db';
import { ensureUserAuthTables, hashPassword } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

const resetSchema = z.object({
  token: z.string().trim().min(32).max(128),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128)
    .refine((val) => /[a-zA-Z]/.test(val) && /\d/.test(val), {
      message: 'La contraseña debe incluir al menos una letra y un número.',
    }),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = resetSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos.' },
        { status: 400 }
      );
    }

    await ensureUserAuthTables();

    const tokenHash = crypto.createHash('sha256').update(parsed.data.token).digest('hex');
    const client = await pool.connect();

    try {
      const res = await client.query(
        'SELECT user_id, expires_at, used_at FROM user_password_resets WHERE token_hash = $1 LIMIT 1',
        [tokenHash]
      );

      if (!res.rows || res.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'El enlace de recuperación no es válido.' },
          { status: 400 }
        );
      }

      const row = res.rows[0];
      if (row.used_at || Number(row.expires_at) < Date.now()) {
        return NextResponse.json(
          { success: false, error: 'El enlace de recuperación ha caducado o ya fue utilizado.' },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(parsed.data.newPassword);
      const userId = Number(row.user_id);

      await client.query(
        'UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2',
        [newHash, userId]
      );
      await client.query('UPDATE user_password_resets SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
      await client.query('UPDATE user_sessions SET revoked = TRUE WHERE user_id = $1', [userId]);

      return NextResponse.json({
        success: true,
        message: 'Tu contraseña se ha actualizado correctamente. Ya puedes iniciar sesión.',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en /api/auth/reset-password:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al restablecer la contraseña.' },
      { status: 500 }
    );
  }
}
