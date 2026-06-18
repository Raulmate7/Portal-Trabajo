import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';
 
export default function robots(): MetadataRoute.Robots {

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Rutas privadas o sin valor SEO
          '/api/',
          '/ofertas-guardadas',
          // Páginas paginadas (no deben indexarse)
          '/*?page=',
          '/*?*page=',
          // Parámetros de búsqueda dinámica del homepage:
          // Generan miles de URLs sin valor SEO que desperdician crawl budget.
          // El contenido SEO está en /trabajos/[sector] (páginas estáticas programáticas).
          '/*?q=',
          '/*?*q=',
          '/*?modality=',
          '/*?*modality=',
          '/*?min_salary=',
          '/*?*min_salary=',
          '/*?experience=',
          '/*?*experience=',
          '/*?date_range=',
          '/*?*date_range=',
        ],
      },
      {
        // Bloquear bots de IA / scrapers
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'cohere-ai',
        ],
        disallow: '/'
      }
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-images.xml`
    ],
  }
}
