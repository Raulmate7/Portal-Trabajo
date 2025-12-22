import { supabase } from '@/lib/supabase';

export async function GET() {
  const baseUrl = 'https://tu-proyecto.vercel.app'; // <--- CAMBIA ESTO

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  const jobUrls = jobs?.map((job) => `
    <url>
      <loc>${baseUrl}/oferta/${job.id}</loc>
      <lastmod>${new Date(job.created_at).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`).join('') || '';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${baseUrl}/trabajos/informatica-tecnologia</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>0.9</priority>
      </url>
      ${jobUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
