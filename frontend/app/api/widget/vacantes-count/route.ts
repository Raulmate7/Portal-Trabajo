import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { vacantesWidgetLimiter, getClientIp } from '@/lib/rate-limit';

export const revalidate = 1800; // Cache 30 minutos

export async function GET(req: NextRequest) {
  const ip = getClientIp(req as any);
  const rateLimit = vacantesWidgetLimiter.limit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const referer = req.headers.get('referer') || '';
  if (referer) {
    // Solo un console.log para monitorizar de dónde nos están embebiendo
    console.log(`Widget cargado desde referer: ${referer}`);
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
    return NextResponse.json({
      python: parseInt(row.python || '0', 10),
      react: parseInt(row.react || '0', 10),
      nodejs: parseInt(row.nodejs || '0', 10),
      java: parseInt(row.java || '0', 10),
      devops: parseInt(row.devops || '0', 10),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      }
    });
  } catch (error) {
    console.error("Error fetching widget vacancy counts:", error);
    return NextResponse.json({ python: 140, react: 110, nodejs: 85, java: 60, devops: 75 }, { status: 200 });
  } finally {
    client.release();
  }
}
