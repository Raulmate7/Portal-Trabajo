import pool from '@/lib/db';
import { TECH_DETAILS } from '@/lib/salarios';
import { BASE_URL, buildUrlSetXml, STRUCTURAL_FALLBACK_DATE, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 7200;

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT tech_slug, city_slug, seniority_slug, salary_sample_count, last_job_created_at
      FROM seo_category_metrics
      WHERE route_type = 'salary' AND salary_sample_count >= 5
      ORDER BY salary_sample_count DESC
      LIMIT 5000
    `).catch(() => ({ rows: [] as any[] }));

    const entries = [
      {
        url: `${BASE_URL}/salarios`,
        lastModified: STRUCTURAL_FALLBACK_DATE,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/salarios/por-nivel`,
        lastModified: STRUCTURAL_FALLBACK_DATE,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/salarios/por-empresa`,
        lastModified: STRUCTURAL_FALLBACK_DATE,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ];

    const seen = new Set(entries.map((e) => e.url));
    for (const row of res.rows || []) {
      if (!row.tech_slug || !TECH_DETAILS[row.tech_slug]) continue;
      let path = `/salarios/${row.tech_slug}`;
      if (row.city_slug) path += `/${row.city_slug}`;
      if (row.seniority_slug && ['junior', 'mid', 'senior'].includes(row.seniority_slug)) {
        path += `/${row.seniority_slug}`;
      }
      const fullUrl = `${BASE_URL}${path}`;
      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);
      entries.push({
        url: fullUrl,
        lastModified: row.last_job_created_at || STRUCTURAL_FALLBACK_DATE,
        changeFrequency: 'weekly' as const,
        priority: row.seniority_slug ? 0.75 : 0.8,
      });
    }

    return xmlResponse(buildUrlSetXml(entries), 7200);
  } finally {
    client.release();
  }
}
