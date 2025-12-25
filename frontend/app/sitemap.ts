import { MetadataRoute } from 'next'
import { Pool } from "pg";

// 1. FORZAMOS QUE SEA DINÁMICO (Soluciona errores de Build)
export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ⚠️ CAMBIA ESTO POR TU URL REAL DE VERCEL (Ej: https://portal-trabajo-beta.vercel.app)
// Si no lo cambias, Google indexará enlaces rotos.
const BASE_URL = 'https://portal-trabajo.vercel.app'; 

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

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...jobUrls,
  ]
}
