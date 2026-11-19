import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 1800; // Cache 30 minutos

export async function GET() {
  let totalOlderActive = 0;
  let latestJobDate = new Date().toISOString();

  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT
        COUNT(*) AS older_count,
        MAX(COALESCE(updated_at, created_at)) AS latest_created
      FROM jobs
      WHERE is_active = TRUE
        AND COALESCE(updated_at, created_at) < NOW() - INTERVAL 48 HOUR
    `);
    totalOlderActive = Number(res.rows?.[0]?.older_count || 0);
    if (res.rows?.[0]?.latest_created) {
      latestJobDate = new Date(res.rows[0].latest_created).toISOString();
    }
  } catch (err) {
    console.error('Error querying sitemap.xml index:', err);
  } finally {
    client.release();
  }

  const shardCount = Math.max(1, Math.ceil(totalOlderActive / 10000));
  const jobActiveShards = Array.from({ length: shardCount }, (_, i) => `
  <sitemap>
    <loc>${BASE_URL}/sitemaps/jobs-active/${i + 1}.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemaps/jobs-today.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>${jobActiveShards}
  <sitemap>
    <loc>${BASE_URL}/sitemaps/cities.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/categories-pseo.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/salaries.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/companies.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/editorial.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-images.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-news.xml</loc>
    <lastmod>${latestJobDate}</lastmod>
  </sitemap>
</sitemapindex>`.trim();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
