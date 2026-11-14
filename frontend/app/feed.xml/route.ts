import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';
import { getJobSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

function cleanCdata(text: string | null | undefined): string {
  if (!text) return '';
  // Eliminar caracteres de control incompatibles con la especificación XML 1.0 (Vector 28)
  const clean = String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]/g, '');
  return clean.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function escapeXml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';           // tecnología: react, python, etc.
  const category = searchParams.get('category') || ''; // Backend, Frontend, Data & AI, etc.
  const location = searchParams.get('location') || ''; // remoto, madrid, etc.

  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, company, location, description_snippet, created_at, salary FROM jobs WHERE is_active = TRUE";
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
    const selfUrl = new URL('/feed.xml', BASE_URL);
    if (q) selfUrl.searchParams.set('q', q);
    if (category) selfUrl.searchParams.set('category', category);
    if (location) selfUrl.searchParams.set('location', location);

    const feedItems = jobs.map((job: any) => {
      const salaryText = job.salary && job.salary !== 'Consultar' ? ` | 💰 ${job.salary}` : '';
      const desc = job.description_snippet
        ? job.description_snippet.replace(/\[Fuente:.*?\]/, '').trim()
        : 'Ver detalles de la oferta de empleo en Portal Trabajo IT.';

      // Enriquecer la descripción
      const fullDescription = `📍 ${job.location || 'Remoto'} · ${desc}`;
      const safeTitle = `${job.title || 'Oferta'} — ${job.company || 'Empresa'}${salaryText}`;
      const itemDate = new Date(job.created_at);
      const pubDate = !isNaN(itemDate.getTime()) ? itemDate.toUTCString() : new Date().toUTCString();

      const jobUrl = `${BASE_URL}/job/${getJobSlug(job)}`;
      return `
    <item>
      <title><![CDATA[${cleanCdata(safeTitle)}]]></title>
      <link>${escapeXml(jobUrl)}</link>
      <guid isPermaLink="true">${escapeXml(jobUrl)}</guid>
      <description><![CDATA[${cleanCdata(fullDescription)}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${cleanCdata(job.location || 'Remoto')}]]></category>
      <source url="${escapeXml(BASE_URL)}">Portal Trabajo IT</source>
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(BASE_URL)}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>es-ES</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl.toString())}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(`${BASE_URL}/og-image.png`)}</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${escapeXml(BASE_URL)}</link>
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
