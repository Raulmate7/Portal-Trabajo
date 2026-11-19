import pool from '@/lib/db';
import { getJobSlug } from '@/lib/slug';
import { BASE_URL, buildUrlSetXml, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 3600; // 1h

export async function GET(
  _req: Request,
  context: { params: Promise<{ page: string }> }
) {
  const { page: rawPage } = await context.params;
  const pageNum = Math.max(1, parseInt(rawPage.replace(/\.xml$/i, ''), 10) || 1);
  const limit = 10000;
  const offset = (pageNum - 1) * limit;

  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, title, title_es, company, location, created_at, updated_at
       FROM jobs
       WHERE is_active = TRUE
         AND COALESCE(updated_at, created_at) < NOW() - INTERVAL 48 HOUR
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const entries = (res.rows || []).map((job: any) => {
      const jobDate = new Date(job.updated_at || job.created_at);
      const isOld = jobDate.getTime() < thirtyDaysAgo;
      return {
        url: `${BASE_URL}/job/${getJobSlug(job)}`,
        lastModified: jobDate,
        changeFrequency: (isOld ? 'weekly' : 'daily') as 'weekly' | 'daily',
        priority: isOld ? 0.5 : 0.8,
      };
    });

    return xmlResponse(buildUrlSetXml(entries), 3600);
  } catch (error) {
    console.error(`Error generating sitemaps/jobs-active/${pageNum}.xml:`, error);
    return xmlResponse(buildUrlSetXml([]), 300);
  } finally {
    client.release();
  }
}
