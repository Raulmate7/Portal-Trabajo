import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';
import { getBlogPosts } from '@/lib/blog';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  // Eliminar caracteres de control incompatibles con la especificación XML 1.0 (Vector 28)
  return String(unsafe)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]/g, '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
}

export async function GET() {
  try {
    const posts = await getBlogPosts();
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Filtrar posts publicados en las últimas 48 horas (requisito estricto de Google News)
    let newsPosts = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate >= fortyEightHoursAgo;
    });

    // Fallback: Si no hay posts en las últimas 48 horas, mostrar los 3 más recientes
    // para evitar que el sitemap esté vacío y asegurar la validación inicial de Search Console.
    if (newsPosts.length === 0) {
      newsPosts = posts.slice(0, 3);
    }

    const newsNodes = newsPosts.map((post) => {
      const postUrl = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
      const postTitle = escapeXml(post.title);
      let isoDate: string;
      try {
        const d = new Date(post.date);
        isoDate = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
      } catch {
        isoDate = new Date().toISOString();
      }

      return `
  <url>
    <loc>${escapeXml(postUrl)}</loc>
    <news:news>
      <news:publication>
        <news:name>Portal Trabajo IT</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${isoDate}</news:publication_date>
      <news:title>${postTitle}</news:title>
    </news:news>
  </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsNodes}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800', // 30 minutos
      },
    });
  } catch (error) {
    console.error("Error generating news sitemap:", error);
    return new Response("Error generating News Sitemap", { status: 500 });
  }
}
