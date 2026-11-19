import pool from '@/lib/db';
import { getJobSlug } from '@/lib/slug';
import { BASE_URL, buildUrlSetXml, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 900; // 15 min

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT id, title, title_es, company, location, created_at, updated_at
      FROM jobs
      WHERE is_active = TRUE
        AND COALESCE(updated_at, created_at) >= NOW() - INTERVAL 48 HOUR
      ORDER BY created_at DESC
      LIMIT 5000
    `);

    const entries = (res.rows || []).map((job: any) => {
      const slug = getJobSlug(job);
      return {
        url: `${BASE_URL}/job/${slug}`,
        lastModified: job.updated_at || job.created_at,
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      };
    });

    return xmlResponse(buildUrlSetXml(entries), 900);
  } catch (error) {
    console.error('Error generating sitemaps/jobs-today.xml:', error);
    return xmlResponse(buildUrlSetXml([]), 300);
  } finally {
    client.release();
  }
}
