import { MetadataRoute } from 'next'
import { Pool } from "pg";

// Configuración de la BD (Igual que en tu página principal)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// URL BASE DE TU WEB (¡CÁMBIALA POR LA TUYA REAL!)
const BASE_URL = 'https://portal-trabajo.vercel.app'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs = [];

  try {
    const client = await pool.connect();
    // Pedimos las últimas 5000 ofertas (id y fecha)
    const res = await client.query("SELECT id, created_at FROM jobs ORDER BY created_at DESC LIMIT 5000");
    client.release();
    jobs = res.rows;
  } catch (error) {
    console.error("Error generando sitemap:", error);
  }

  // Mapeamos las ofertas al formato que exige Google
  const jobUrls = jobs.map((job) => ({
    url: `${BASE_URL}/job/${job.id}`,
    lastModified: new Date(job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8, // Prioridad alta, pero menos que la home
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1, // La home es lo más importante
    },
    ...jobUrls,
  ]
}
