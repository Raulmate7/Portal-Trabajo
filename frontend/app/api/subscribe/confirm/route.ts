import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Confirmación Double Opt-In (Art. 7.1 RGPD, LEG-015).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  const token = (searchParams.get('token') || '').trim();
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.APP_SECRET || '';

  if (!email || !token || !secret) {
    return NextResponse.json({ success: false, error: 'Enlace de confirmación inválido.' }, { status: 400 });
  }

  const expected = crypto.createHmac('sha256', secret).update(`confirm:${email}`).digest('hex');
  if (token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    return NextResponse.json({ success: false, error: 'Token de confirmación inválido o manipulado.' }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      "UPDATE subscribers SET is_active = TRUE, status = 'active', confirmed_at = NOW() WHERE email = $1",
      [email]
    );
    const emailHash = crypto.createHash('sha256').update(email).digest('hex');
    await client.query(
      "INSERT INTO consent_audit_log (email_hash, action, policy_version, created_at) VALUES ($1, 'double_opt_in_confirmed', 'v2026.11', NOW())",
      [emailHash]
    ).catch(() => {});
  } finally {
    client.release();
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portalempleoit.com').replace(/\/+$/, '');
  return NextResponse.redirect(`${baseUrl}/?confirmed=true`);
}
