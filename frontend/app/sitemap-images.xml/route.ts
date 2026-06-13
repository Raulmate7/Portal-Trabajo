import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

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
      SELECT id, title, company 
      FROM jobs 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT 5000
    `);
    const jobs = res.rows;

    // 2. Construir nodos de ofertas
    const urlNodes = jobs.map((job: any) => {
      const jobUrl = `${BASE_URL}/job/${job.id}`;
      const imageUrl = `${BASE_URL}/job/${job.id}/opengraph-image`;
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

    // 3. Construir nodos para tecnologías populares
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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}</loc>
    <image:image>
      <image:loc>${BASE_URL}/og-image.png</image:loc>
      <image:title>Portal Trabajo IT — Ofertas de Empleo Tecnológico</image:title>
    </image:image>
  </url>${sectorNodes}${urlNodes}
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
