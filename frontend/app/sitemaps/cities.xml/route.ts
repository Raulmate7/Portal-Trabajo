import pool from '@/lib/db';
import { BASE_URL, buildUrlSetXml, STRUCTURAL_FALLBACK_DATE, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 3600;

const DEDICATED_CITIES = ['madrid', 'barcelona', 'valencia', 'malaga', 'sevilla', 'bilbao', 'zaragoza'];

export async function GET() {
  const client = await pool.connect();
  try {
    const metricsRes = await client.query(`
      SELECT city_slug, active_count, last_job_created_at
      FROM seo_category_metrics
      WHERE route_type = 'city_hub' AND active_count >= 3
      ORDER BY active_count DESC
    `).catch(() => ({ rows: [] as any[] }));

    const rows = metricsRes.rows || [];
    const entries = rows.length > 0
      ? rows
          .filter((r: any) => r.city_slug === 'remoto' || DEDICATED_CITIES.includes(r.city_slug))
          .map((r: any) => ({
            url: r.city_slug === 'remoto' ? `${BASE_URL}/trabajo-remoto` : `${BASE_URL}/trabajo-${r.city_slug}`,
            lastModified: r.last_job_created_at || STRUCTURAL_FALLBACK_DATE,
            changeFrequency: 'daily' as const,
            priority: 0.9,
          }))
      : [
          { url: `${BASE_URL}/trabajo-remoto`, lastModified: STRUCTURAL_FALLBACK_DATE, changeFrequency: 'daily' as const, priority: 0.9 },
          ...DEDICATED_CITIES.map((c) => ({
            url: `${BASE_URL}/trabajo-${c}`,
            lastModified: STRUCTURAL_FALLBACK_DATE,
            changeFrequency: 'daily' as const,
            priority: 0.9,
          })),
        ];

    return xmlResponse(buildUrlSetXml(entries), 3600);
  } finally {
    client.release();
  }
}
