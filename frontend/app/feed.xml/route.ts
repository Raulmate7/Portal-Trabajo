import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';           // tecnología: react, python, etc.
  const category = searchParams.get('category') || ''; // Backend, Frontend, Data & AI, etc.
  const location = searchParams.get('location') || ''; // remoto, madrid, etc.

  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, company, location, description_snippet, created_at, salary FROM jobs WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (q.trim()) {
      sql += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (category.trim()) {
      sql += ` AND category ILIKE $${paramIndex}`;
      params.push(`%${category.trim()}%`);
      paramIndex++;
    }

    if (location.trim()) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location.trim()}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;
    const res = await client.query(sql, params);
    const jobs = res.rows;

    // Construir título y descripción del feed según filtros activos
    const feedFilters = [q, category, location].filter(Boolean).join(', ');
    const feedTitle = feedFilters
      ? `Portal Trabajo IT | Ofertas de ${feedFilters}`
      : 'Portal Trabajo IT | Ofertas de Empleo Tech España';
    const feedDescription = feedFilters
      ? `Vacantes de ${feedFilters} para programadores en España. Actualizado en tiempo real.`
      : 'Agregador de ofertas de empleo para programadores en España. Vacantes de Java, Python, React, DevOps y más.';

    // Construir la URL canónica del feed con sus params
    const selfUrl = new URL('/feed.xml', 'https://portal-trabajo.vercel.app');
    if (q) selfUrl.searchParams.set('q', q);
    if (category) selfUrl.searchParams.set('category', category);
    if (location) selfUrl.searchParams.set('location', location);

    const feedItems = jobs.map((job: any) => {
      const salaryText = job.salary && job.salary !== 'Consultar' ? ` | 💰 ${job.salary}` : '';
      const desc = job.description_snippet
        ? job.description_snippet.replace(/\[Fuente:.*?\]/, '').trim()
        : 'Ver detalles de la oferta de empleo en Portal Trabajo IT.';

      return `
    <item>
      <title><![CDATA[${job.title} — ${job.company}${salaryText}]]></title>
      <link>https://portal-trabajo.vercel.app/job/${job.id}</link>
      <guid isPermaLink="true">https://portal-trabajo.vercel.app/job/${job.id}</guid>
      <description><![CDATA[📍 ${job.location} · ${desc}]]></description>
      <pubDate>${new Date(job.created_at).toUTCString()}</pubDate>
      <category><![CDATA[${job.location}]]></category>
      <source url="https://portal-trabajo.vercel.app">Portal Trabajo IT</source>
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>https://portal-trabajo.vercel.app</link>
    <description>${feedDescription}</description>
    <language>es-ES</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${selfUrl.toString()}" rel="self" type="application/rss+xml" />
    <image>
      <url>https://portal-trabajo.vercel.app/og-image.png</url>
      <title>${feedTitle}</title>
      <link>https://portal-trabajo.vercel.app</link>
    </image>
    ${feedItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return new Response("Error generating RSS Feed", { status: 500 });
  } finally {
    client.release();
  }
}
