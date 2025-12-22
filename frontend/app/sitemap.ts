import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ⚠️ CAMBIA ESTO POR TU URL REAL (ej: https://empleo-it.vercel.app)
  const baseUrl = 'https://portal-trabajo.vercel.app';

  // 1. Obtener todas las ofertas de la base de datos (ID y fecha)
  // Limitamos a las últimas 5000 para no saturar si crece mucho
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  // 2. Generar las URLs de las ofertas
  const jobUrls = jobs?.map((job) => ({
    url: `${baseUrl}/oferta/${job.id}`,
    lastModified: new Date(job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })) ?? [];

  // 3. Devolver la lista completa (Páginas estáticas + Ofertas)
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/trabajos/informatica-tecnologia`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...jobUrls,
  ];
}
