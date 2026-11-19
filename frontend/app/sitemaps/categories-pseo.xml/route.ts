import pool from '@/lib/db';
import { BASE_URL, buildUrlSetXml, SitemapUrlEntry, STRUCTURAL_FALLBACK_DATE, xmlResponse } from '@/lib/sitemaps';
import { PSEO_ROLES } from '@/lib/pseoMatrix';

export const revalidate = 3600;

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT slug, city_slug, active_count, remote_pct, last_job_created_at
      FROM seo_category_metrics
      WHERE route_type = 'jobs_sector' AND active_count >= 5
      ORDER BY active_count DESC
      LIMIT 7500
    `).catch(() => ({ rows: [] as any[] }));

    const rows = res.rows || [];
    const entries: SitemapUrlEntry[] = [];
    const seen = new Set<string>();

    for (const r of rows) {
      const isBaseTech = !r.city_slug;
      const sectorUrl = `${BASE_URL}/trabajos/${r.slug}`;
      if (!seen.has(sectorUrl)) {
        seen.add(sectorUrl);
        entries.push({
          url: sectorUrl,
          lastModified: r.last_job_created_at || STRUCTURAL_FALLBACK_DATE,
          changeFrequency: 'daily',
          priority: isBaseTech ? 0.85 : 0.8,
          ...(isBaseTech ? {
            alternates: {
              'es-ES': sectorUrl,
              'en': `${BASE_URL}/en/trabajos/${r.slug}`,
              'x-default': sectorUrl,
            },
          } : {}),
        });
      }

      if (isBaseTech && PSEO_ROLES[r.slug]) {
        const guiaUrl = `${BASE_URL}/cuanto-gana-un-${r.slug}-en-espana`;
        if (!seen.has(guiaUrl)) {
          seen.add(guiaUrl);
          entries.push({
            url: guiaUrl,
            lastModified: r.last_job_created_at || STRUCTURAL_FALLBACK_DATE,
            changeFrequency: 'weekly',
            priority: 0.78,
          });
        }
        if (Number(r.remote_pct || 0) > 0 && Number(r.active_count || 0) >= 10) {
          const remUrl = `${BASE_URL}/empresas-remotas/${r.slug}`;
          if (!seen.has(remUrl)) {
            seen.add(remUrl);
            entries.push({
              url: remUrl,
              lastModified: r.last_job_created_at || STRUCTURAL_FALLBACK_DATE,
              changeFrequency: 'daily',
              priority: 0.75,
            });
          }
        }
      }
    }

    // Asegurar páginas pilar principales incluso antes de la primera ejecución del agregador
    if (entries.length === 0) {
      for (const base of ['informatica-tecnologia', 'backend', 'frontend', 'data', 'cloud', 'mobile', 'react', 'python', 'java', 'node']) {
        entries.push({
          url: `${BASE_URL}/trabajos/${base}`,
          lastModified: STRUCTURAL_FALLBACK_DATE,
          changeFrequency: 'daily' as const,
          priority: 0.85,
          alternates: {
            'es-ES': `${BASE_URL}/trabajos/${base}`,
            'en': `${BASE_URL}/en/trabajos/${base}`,
            'x-default': `${BASE_URL}/trabajos/${base}`,
          },
        });
      }
    }

    return xmlResponse(buildUrlSetXml(entries), 3600);
  } finally {
    client.release();
  }
}
