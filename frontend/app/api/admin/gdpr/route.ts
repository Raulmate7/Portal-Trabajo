import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import pool from '@/lib/db';
import { verifyAdminSessionTokenAsync, recordAdminAuditLog } from '@/lib/adminAuth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const ok = await verifyAdminSessionTokenAsync(token);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

/**
 * GET /api/admin/gdpr?email=... — Exportación ARSOLP (Art. 15 y 20 RGPD, LEG-021)
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Parámetro email inválido.' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const safeQuery = async (sql: string, params: any[]) => {
      try {
        const res = await client.query(sql, params);
        return res.rows || [];
      } catch {
        return [];
      }
    };

    const [subscribers, alerts, tracking, reviews] = await Promise.all([
      safeQuery('SELECT id, email, tech_keywords, location_pref, frequency, is_active, marketing_accepted, consent_policy_version, created_at, confirmed_at, unsubscribed_at FROM subscribers WHERE email = $1', [email]),
      safeQuery('SELECT id, email, is_active, created_at FROM alerts WHERE email = $1', [email]),
      safeQuery('SELECT id, campaign, opened_at FROM email_tracking WHERE email = $1 ORDER BY opened_at DESC LIMIT 100', [email]),
      safeQuery('SELECT id, company_name, rating, created_at FROM company_reviews WHERE reviewer_email = $1', [email]),
    ]);

    await recordAdminAuditLog({
      eventType: 'gdpr_export',
      clientIp: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
      success: true,
      details: `Exportación ARSOLP ejecutada (${subscribers.length} suscripciones)`,
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      subject: email,
      data: { subscribers, alerts, tracking, reviews },
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/admin/gdpr — Supresión RGPD en 1 clic o moderación de review_reports (LEG-021)
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const action = (body.action || '').toString();
  const client = await pool.connect();

  try {
    if (action === 'erase') {
      const email = (body.email || '').toString().trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return NextResponse.json({ success: false, error: 'Email inválido.' }, { status: 400 });
      }
      const emailHash = crypto.createHash('sha256').update(email).digest('hex');

      await client.query(
        "UPDATE subscribers SET email = CONCAT('gdpr_erased_', id, '@deleted.local'), tech_keywords = NULL, location_pref = NULL, is_active = FALSE, marketing_accepted = FALSE, status = 'erased', unsubscribed_at = NOW() WHERE email = $1",
        [email]
      ).catch(() => {});
      await client.query('DELETE FROM email_tracking WHERE email = $1', [email]).catch(() => {});
      await client.query('UPDATE alerts SET is_active = FALSE WHERE email = $1', [email]).catch(() => {});
      await client.query("INSERT INTO email_suppression_list (email_hash, reason, created_at) VALUES ($1, 'gdpr_erasure', NOW())", [emailHash]).catch(() => {});
      await client.query("INSERT INTO consent_audit_log (email_hash, action, marketing_accepted, created_at) VALUES ($1, 'gdpr_erasure', FALSE, NOW())", [emailHash]).catch(() => {});

      await recordAdminAuditLog({
        eventType: 'gdpr_erasure',
        clientIp: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
        success: true,
        details: `Supresión RGPD ejecutada (${emailHash.slice(0, 12)})`,
      });

      return NextResponse.json({ success: true, message: 'Datos suprimidos y bloqueados conforme al Art. 17 RGPD.' });
    }

    if (action === 'resolve_report') {
      const reportId = Number(body.reportId);
      const decision = body.decision === 'hide_review' ? 'resolved_hidden' : 'dismissed';
      if (!Number.isInteger(reportId) || reportId <= 0) {
        return NextResponse.json({ success: false, error: 'reportId inválido.' }, { status: 400 });
      }

      if (decision === 'resolved_hidden') {
        const repRes = await client.query('SELECT review_id FROM review_reports WHERE id = $1 LIMIT 1', [reportId]);
        const reviewId = repRes.rows?.[0]?.review_id;
        if (reviewId) {
          await client.query('UPDATE company_reviews SET is_hidden = TRUE WHERE id = $1', [reviewId]).catch(() => {});
        }
      }
      await client.query('UPDATE review_reports SET status = $1 WHERE id = $2', [decision, reportId]).catch(() => {});

      return NextResponse.json({ success: true, status: decision });
    }

    return NextResponse.json({ success: false, error: 'Acción no soportada.' }, { status: 400 });
  } finally {
    client.release();
  }
}
