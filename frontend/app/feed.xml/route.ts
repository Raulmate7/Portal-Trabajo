import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT id, title, company, location, description_snippet, created_at FROM jobs ORDER BY created_at DESC LIMIT 100"
    );
    const jobs = res.rows;
    
    const feedItems = jobs.map((job: any) => `
    <item>
      <title><![CDATA[${job.title} - ${job.company}]]></title>
      <link>https://portal-trabajo.vercel.app/job/${job.id}</link>
      <guid>https://portal-trabajo.vercel.app/job/${job.id}</guid>
      <description><![CDATA[${job.description_snippet || 'Ver detalles de la oferta de empleo en Portal Trabajo IT.'}]]></description>
      <pubDate>${new Date(job.created_at).toUTCString()}</pubDate>
      <source url="https://portal-trabajo.vercel.app">Portal Trabajo IT</source>
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Portal Trabajo IT | Ofertas de Empleo Tech</title>
    <link>https://portal-trabajo.vercel.app</link>
    <description>Agregador de ofertas de empleo para programadores en España. Vacantes de Java, Python, React, DevOps y más.</description>
    <language>es-ES</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://portal-trabajo.vercel.app/feed.xml" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return new Response("Error generating RSS Feed", { status: 500 });
  } finally {
    client.release();
  }
}
