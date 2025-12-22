import { supabase } from '@/lib/supabase';

export async function GET() {
  // ⚠️ Asegúrate de que este es tu dominio real
  const baseUrl = 'https://portal-trabajo.vercel.app'; 

  // 1. Recuperamos las ofertas para el mapa (limitamos a 2000 recientes)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);

  // 2. Generamos el XML de las ofertas individuales
  const jobUrls = jobs?.map((job) => `
    <url>
      <loc>${baseUrl}/oferta/${job.id}</loc>
      <lastmod>${new Date(job.created_at).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`).join('') || '';

  // 3. (NUEVO) Generamos el XML de las Categorías Principales
  // Estas son las páginas que más tráfico te traerán
  const sectors = [
    'informatica-tecnologia',
    'backend',
    'frontend',
    'data',
    'cloud',
    'mobile',
    'inteligencia-artificial'
  ];

  const sectorUrls = sectors.map((sector) => `
    <url>
      <loc>${baseUrl}/trabajos/${sector}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>`).join('');

  // 4. Montamos el XML final
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      ${sectorUrls}
      ${jobUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
