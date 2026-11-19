import pool from '@/lib/db';
import { slugify } from '@/lib/slug';
import { BASE_URL, buildUrlSetXml, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 7200;

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'Backend': 'backend',
  'Frontend': 'frontend',
  'Data & AI': 'data-ai',
  'Cloud & DevOps': 'cloud-devops',
  'Mobile': 'mobile',
  'Otros': 'otros',
};

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT company, category, MAX(COALESCE(updated_at, created_at)) AS last_mod
      FROM jobs
      WHERE is_active = TRUE
        AND company IS NOT NULL
        AND company != 'Desconocida'
        AND company != ''
      GROUP BY company, category
      ORDER BY last_mod DESC
      LIMIT 8000
    `);

    const companyMap = new Map<string, Date>();
    const entries: any[] = [];

    for (const row of res.rows || []) {
      const cSlug = slugify(row.company);
      if (!cSlug) continue;
      const modDate = new Date(row.last_mod);
      const prev = companyMap.get(cSlug);
      if (!prev || modDate > prev) {
        companyMap.set(cSlug, modDate);
      }
      const catSlug = row.category ? CATEGORY_SLUG_MAP[row.category] : null;
      if (catSlug) {
        entries.push({
          url: `${BASE_URL}/empresas/${cSlug}/${catSlug}`,
          lastModified: modDate,
          changeFrequency: 'weekly' as const,
          priority: 0.55,
        });
      }
    }

    const companyEntries = Array.from(companyMap.entries()).map(([cSlug, modDate]) => ({
      url: `${BASE_URL}/empresas/${cSlug}`,
      lastModified: modDate,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    }));

    return xmlResponse(buildUrlSetXml([...companyEntries, ...entries].slice(0, 10000)), 7200);
  } catch (error) {
    console.error('Error generating sitemaps/companies.xml:', error);
    return xmlResponse(buildUrlSetXml([]), 300);
  } finally {
    client.release();
  }
}
