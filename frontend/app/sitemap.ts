import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pon aquí la URL que te da Vercel (la que termina en .vercel.app)
  const baseUrl = 'https://tu-proyecto.vercel.app'; 

  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    const jobUrls = jobs?.map((job) => ({
      url: `${baseUrl}/oferta/${job.id}`,
      lastModified: new Date(job.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) ?? [];

    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${baseUrl}/trabajos/informatica-tecnologia`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
      ...jobUrls,
    ];
  } catch (error) {
    return [{ url: baseUrl, lastModified: new Date() }];
  }
}
