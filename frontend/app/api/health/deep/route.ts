import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { isLegalConfigComplete } from '@/lib/legalConfig';

export const dynamic = 'force-dynamic';

function safeCompareSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.HEALTH_CHECK_SECRET || process.env.CRON_SECRET || '';
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Health check secret not configured' }, { status: 503 });
  }

  const headerSecret =
    request.headers.get('x-health-secret') ||
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();

  if (!headerSecret || !safeCompareSecret(headerSecret, expectedSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    const dbLatencyMs = Date.now() - startedAt;

    const freshnessRes = await client.query(
      'SELECT MAX(created_at) AS latest_job_at, COUNT(*) AS active_jobs FROM jobs WHERE is_active = TRUE'
    );
    const row = freshnessRes.rows?.[0] || {};
    const latestJobAt = row.latest_job_at ? new Date(row.latest_job_at) : null;
    const activeJobs = Number(row.active_jobs || 0);

    const maxAgeHours = 48;
    const ageHours = latestJobAt ? (Date.now() - latestJobAt.getTime()) / (1000 * 60 * 60) : null;
    const isFresh = ageHours !== null && ageHours <= maxAgeHours;

    // SEC-062: Verificación de coherencia de entorno Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const isProd = process.env.NODE_ENV === 'production' && siteUrl.startsWith('https://');
    const stripeConfigOk =
      Boolean(stripeKey && stripeWebhookSecret && stripeWebhookSecret.startsWith('whsec_')) &&
      (!isProd || stripeKey.startsWith('sk_live_'));

    const legalConfigOk = isLegalConfigComplete();
    const healthy = dbLatencyMs < 2000 && activeJobs > 0 && isFresh && stripeConfigOk;

    return NextResponse.json(
      {
        status: healthy ? 'ok' : 'degraded',
        db_latency_ms: dbLatencyMs,
        active_jobs: activeJobs,
        latest_job_at: latestJobAt ? latestJobAt.toISOString() : null,
        freshness_hours: ageHours !== null ? Number(ageHours.toFixed(2)) : null,
        stripe_config_ok: stripeConfigOk,
        legal_config_ok: legalConfigOk,
        timestamp: new Date().toISOString(),
      },
      {
        status: healthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        db_latency_ms: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } finally {
    client.release();
  }
}
