import { NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap/0.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap/1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap/2.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap/3.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-images.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-news.xml</loc>
  </sitemap>
</sitemapindex>`.trim();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
    },
  });
}
