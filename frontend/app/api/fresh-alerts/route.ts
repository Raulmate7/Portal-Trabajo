import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { freshAlertsLimiter, getClientIp } from '@/lib/rate-limit';

const freshAlertsCache = new Map<string, { count: number; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req as any);
  const rateLimit = await freshAlertsLimiter.limitAsync(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const keywordsParam = searchParams.get('keywords') || '';

  // SEC-030: Limitar a máximo 5 keywords limpias de entre 2 y 30 caracteres
  const kws = Array.from(
    new Set(
      keywordsParam
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length >= 2 && k.length <= 30 && /^[\p{L}\p{N}.+#\s-]+$/u.test(k))
    )
  ).slice(0, 5);

  if (kws.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const cacheKey = kws.slice().sort().join('|');
  const now = Date.now();
  const cached = freshAlertsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({ count: cached.count, cached: true });
  }

  try {
    const keywordConditions = kws.map((_, i) => `title LIKE $${i + 1}`).join(' OR ');
    const query = `
      SELECT COUNT(*) as count
      FROM jobs
      WHERE created_at > NOW() - INTERVAL 2 HOUR
        AND is_active = TRUE
        AND (${keywordConditions})
    `;

    const res = await pool.query(query, kws.map(k => `%${k}%`));
    const count = parseInt(res.rows[0]?.count || '0', 10);

    if (freshAlertsCache.size > 500) {
      for (const [k, v] of freshAlertsCache.entries()) {
        if (v.expiresAt <= now) freshAlertsCache.delete(k);
      }
    }
    freshAlertsCache.set(cacheKey, { count, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json({ count });
  } catch (e: any) {
    console.error("Error in fresh-alerts API:", e);
    return NextResponse.json({ error: 'Error al consultar las alertas recientes' }, { status: 500 });
  }
}
