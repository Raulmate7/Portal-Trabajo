import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  const isStaging =
    !BASE_URL.includes('portalempleoit.com') &&
    !BASE_URL.includes('localhost') &&
    !BASE_URL.includes('127.0.0.1');

  if (isStaging) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Rutas privadas o sin valor SEO (SEC-065, SEO-028)
          '/api/',
          '/admin',
          '/login',
          '/registro',
          '/recuperar-password',
          '/gracias',
          '/darse-de-baja',
          '/perfil',
          '/ofertas-guardadas',
          '/mi-perfil',
          '/empresa-dashboard',
          '/redirect/',
          '/ref/',
          // Parámetros de búsqueda dinámica y ordenación (SEO-020: permitir ?page=, SEO-037):
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
          '/*?sort=',
          '/*?*sort=',
          '/*?with_salary=',
          '/*?*with_salary=',
          '/*?location=',
          '/*?*location=',
        ],
      },
      {
        userAgent: ['OAI-SearchBot', 'PerplexityBot'],
        allow: ['/', '/salarios', '/tendencias', '/noticias', '/trabajos', '/job'],
        disallow: ['/api/', '/admin', '/redirect/', '/ref/'],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-images.xml`,
      `${BASE_URL}/sitemap-news.xml`,
    ],
  };
}
