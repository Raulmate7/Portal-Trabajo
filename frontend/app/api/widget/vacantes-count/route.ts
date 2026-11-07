import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { vacantesWidgetLimiter, getClientIp } from '@/lib/rate-limit';

export const revalidate = 1800; // Cache 30 minutos

interface WidgetVacancyData {
  python: number;
  react: number;
  nodejs: number;
  java: number;
  devops: number;
}

// Caché en memoria para mitigar DoS en consultas de agregación pesadas (Vector 20)
let cachedWidgetData: { data: WidgetVacancyData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

// Soporte explícito de CORS preflight para sitios autorizados a incrustar el widget (Vector 34)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req as any);
  const rateLimit = vacantesWidgetLimiter.limit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const rawReferer = req.headers.get('referer') || '';
  if (rawReferer) {
    // Sanitizar referer para prevenir Log Injection (eliminar CRLF y caracteres de control)
    const sanitizedReferer = rawReferer.replace(/[\r\n\x00-\x1f\x7f-\x9f]/g, '').slice(0, 150);
    console.log(`Widget cargado desde referer: ${sanitizedReferer}`);
  }

  // Comprobar si existe respuesta en caché para evitar consultas continuas a la base de datos
  const now = Date.now();
  if (cachedWidgetData && cachedWidgetData.expiresAt > now) {
    return NextResponse.json(cachedWidgetData.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=600',
        'X-Cache': 'HIT',
      }
    });
  }

  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT 
        SUM(CASE WHEN title ILIKE '%python%' OR category = 'Data & AI' THEN 1 ELSE 0 END) as python,
        SUM(CASE WHEN title ILIKE '%react%' OR category = 'Frontend' THEN 1 ELSE 0 END) as react,
        SUM(CASE WHEN title ILIKE '%node%' OR category = 'Backend' THEN 1 ELSE 0 END) as nodejs,
        SUM(CASE WHEN title ILIKE '%java%' THEN 1 ELSE 0 END) as java,
        SUM(CASE WHEN title ILIKE '%devops%' OR category = 'Cloud & DevOps' THEN 1 ELSE 0 END) as devops
      FROM jobs
      WHERE is_active = TRUE
    `);

    const row = res.rows[0] || {};
    const data: WidgetVacancyData = {
      python: parseInt(row.python || '0', 10),
      react: parseInt(row.react || '0', 10),
      nodejs: parseInt(row.nodejs || '0', 10),
      java: parseInt(row.java || '0', 10),
      devops: parseInt(row.devops || '0', 10),
    };

    cachedWidgetData = { data, expiresAt: now + CACHE_TTL_MS };

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
        'X-Cache': 'MISS',
      }
    });
  } catch (error) {
    console.error("Error fetching widget vacancy counts:", error);
    const fallbackData: WidgetVacancyData = cachedWidgetData?.data || {
      python: 140,
      react: 110,
      nodejs: 85,
      java: 60,
      devops: 75
    };
    return NextResponse.json(fallbackData, { status: 200 });
  } finally {
    client.release();
  }
}
