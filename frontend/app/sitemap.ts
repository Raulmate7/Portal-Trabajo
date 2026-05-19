import { MetadataRoute } from 'next'
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://portal-trabajo.vercel.app';

const SECTOR_PAGES = [
  '/trabajos/informatica-tecnologia',
  '/trabajos/backend',
  '/trabajos/frontend',
  '/trabajos/data',
  '/trabajos/cloud',
  '/trabajos/mobile',
  '/publicar-oferta',
  '/talento-premium',
  // SEO Programático
  '/trabajos/frontend-en-madrid',
  '/trabajos/backend-en-madrid',
  '/trabajos/frontend-en-barcelona',
  '/trabajos/backend-en-barcelona',
  '/trabajos/data-en-madrid',
  '/trabajos/react-remoto',
  '/trabajos/python-remoto',
  '/trabajos/node-remoto',
  '/trabajos/java-remoto'
]; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs = [];

  try {
    // Intentamos conectar con timeout para que no se cuelgue
    const client = await pool.connect();
    // Cogemos las últimas 2000 ofertas para no sobrecargar
    const res = await client.query("SELECT id, created_at FROM jobs ORDER BY created_at DESC LIMIT 2000");
    client.release();
    jobs = res.rows;
  } catch (error) {
    console.error("⚠️ Error generando sitemap (BD):", error);
    // Si falla la BD, devolvemos al menos la página principal para que no de error 500
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ];
  }

  const jobUrls = jobs.map((job) => ({
    url: `${BASE_URL}/job/${job.id}`,
    lastModified: new Date(job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const sectorUrls = SECTOR_PAGES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...sectorUrls,
    ...jobUrls,
  ]
}
