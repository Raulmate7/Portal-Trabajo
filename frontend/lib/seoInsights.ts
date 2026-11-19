import pool from '@/lib/db';

export interface ProgrammaticMarketInsights {
  activeCount: number;
  new72hCount: number;
  historical180dCount: number;
  salarySampleCount: number;
  salaryAvg: number | null;
  salaryMedian: number | null;
  salaryP25: number | null;
  salaryP75: number | null;
  remotePct: number;
  hybridPct: number;
  onsitePct: number;
  topCompanies: Array<{ name: string; slug: string; count: number; avgSalary: number | null }>;
  relatedSkills: Array<{ skill: string; slug: string; pct: number }>;
  lastJobCreatedAt: Date | null;
  isIndexable: boolean;
  includeInSitemap: boolean;
}

export async function getProgrammaticMarketInsights(slug: string): Promise<ProgrammaticMarketInsights | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT * FROM seo_category_metrics WHERE slug = $1 LIMIT 1',
      [slug.toLowerCase()]
    );
    const row = res.rows?.[0];
    if (!row) return null;

    const activeCount = Number(row.active_count || 0);
    const historical180dCount = Number(row.historical_180d_count || 0);

    return {
      activeCount,
      new72hCount: Number(row.new_72h_count || 0),
      historical180dCount,
      salarySampleCount: Number(row.salary_sample_count || 0),
      salaryAvg: row.salary_avg ? Number(row.salary_avg) : null,
      salaryMedian: row.salary_median ? Number(row.salary_median) : null,
      salaryP25: row.salary_p25 ? Number(row.salary_p25) : null,
      salaryP75: row.salary_p75 ? Number(row.salary_p75) : null,
      remotePct: Number(row.remote_pct || 0),
      hybridPct: Number(row.hybrid_pct || 0),
      onsitePct: Number(row.onsite_pct || 0),
      topCompanies: typeof row.top_companies_json === 'string'
        ? JSON.parse(row.top_companies_json)
        : (row.top_companies_json || []),
      relatedSkills: typeof row.related_skills_json === 'string'
        ? JSON.parse(row.related_skills_json)
        : (row.related_skills_json || []),
      lastJobCreatedAt: row.last_job_created_at ? new Date(row.last_job_created_at) : null,
      isIndexable: activeCount >= 5 || (activeCount >= 3 && historical180dCount >= 10),
      includeInSitemap: activeCount >= 5,
    };
  } catch {
    return null;
  } finally {
    client.release();
  }
}

/**
 * Filtra un listado de slugs de /trabajos/[slug] devolviendo un Set con los que tienen
 * >= 5 ofertas activas en seo_category_metrics. Si la tabla está vacía, devuelve null
 * para que el caller conserve los enlaces por defecto sin romper entornos sin agregador.
 */
export async function getIndexableSectorSlugsSet(slugs: string[]): Promise<Set<string> | null> {
  const cleanSlugs = Array.from(new Set(slugs.map((s) => s.toLowerCase().trim()).filter(Boolean)));
  if (cleanSlugs.length === 0) return new Set();

  const client = await pool.connect();
  try {
    const check = await client.query(`SELECT 1 FROM seo_category_metrics LIMIT 1`).catch(() => ({ rows: [] as any[] }));
    if (!check.rows || check.rows.length === 0) {
      return null;
    }

    const placeholders = cleanSlugs.map((_, idx) => `$${idx + 1}`).join(', ');
    const res = await client.query(
      `SELECT slug FROM seo_category_metrics WHERE route_type = 'jobs_sector' AND active_count >= 5 AND slug IN (${placeholders})`,
      cleanSlugs
    );
    return new Set((res.rows || []).map((r: any) => String(r.slug).toLowerCase()));
  } catch {
    return null;
  } finally {
    client.release();
  }
}
