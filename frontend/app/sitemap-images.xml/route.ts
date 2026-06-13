import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';
import { BLOG_POSTS } from '@/lib/blog';
import { getJobSlug, slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
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
  const client = await pool.connect();
  try {
    // 1. Obtener las últimas 5000 ofertas de trabajo activas
    const res = await client.query(`
      SELECT id, title, title_es, company, location 
      FROM jobs 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT 5000
    `);
    const jobs = res.rows;

    // 2. Obtener empresas activas
    const compRes = await client.query(`
      SELECT DISTINCT company 
      FROM jobs 
      WHERE is_active = TRUE AND company IS NOT NULL AND company != 'Desconocida' AND company != ''
      LIMIT 1000
    `);
    const companies = compRes.rows;

    // 3. Construir nodos de ofertas
    const urlNodes = jobs.map((job: any) => {
      const jobSlug = getJobSlug(job);
      const jobUrl = `${BASE_URL}/job/${jobSlug}`;
      const imageUrl = `${BASE_URL}/job/${jobSlug}/opengraph-image`;
      const titleText = escapeXml(`${job.title} en ${job.company}`);

      return `
  <url>
    <loc>${jobUrl}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${titleText}</image:title>
    </image:image>
  </url>`;
    }).join('');

    // 4. Construir nodos para tecnologías populares
    const TECNOLOGIAS = ['react', 'node', 'python', 'java', 'typescript', 'aws', 'docker', 'flutter', 'csharp', 'php', 'sql'];
    const sectorNodes = TECNOLOGIAS.map((tech) => {
      const sectorUrl = `${BASE_URL}/trabajos/${tech}`;
      const imageUrl = `${BASE_URL}/trabajos/${tech}/opengraph-image`;
      const titleText = escapeXml(`Empleo de ${tech.toUpperCase()}`);

      return `
  <url>
    <loc>${sectorUrl}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${titleText}</image:title>
    </image:image>
  </url>`;
    }).join('');

    // 5. Construir nodos para empresas
    const companyNodes = companies.map((c: any) => {
      const companySlug = slugify(c.company);
      const companyUrl = `${BASE_URL}/empresas/${companySlug}`;
      const imageUrl = `${BASE_URL}/empresas/${companySlug}/opengraph-image`;
      const titleText = escapeXml(`Ofertas de empleo de tecnología en ${c.company}`);

      return `
  <url>
    <loc>${companyUrl}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${titleText}</image:title>
    </image:image>
  </url>`;
    }).join('');

    // 6. Construir nodos para posts del blog
    const blogNodes = BLOG_POSTS.map((post) => {
      const blogUrl = `${BASE_URL}/blog/${post.slug}`;
      const imageUrl = `${BASE_URL}/blog/${post.slug}/opengraph-image`;
      const titleText = escapeXml(post.title);

      return `
  <url>
    <loc>${blogUrl}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${titleText}</image:title>
    </image:image>
  </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}</loc>
    <image:image>
      <image:loc>${BASE_URL}/og-image.png</image:loc>
      <image:title>Portal Trabajo IT — Ofertas de Empleo Tecnológico</image:title>
    </image:image>
  </url>${sectorNodes}${urlNodes}${companyNodes}${blogNodes}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=14400, s-maxage=14400', // 4 horas
      },
    });
  } catch (error) {
    console.error("Error generating image sitemap:", error);
    return new Response("Error generating Image Sitemap", { status: 500 });
  } finally {
    client.release();
  }
}
