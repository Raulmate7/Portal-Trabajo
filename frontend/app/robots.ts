import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

const DISALLOW_PRIVATE_ROUTES = [
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
];

// Bloqueo estricto de facetas, ordenación y parámetros de tracking (permite ?page= exclusivamente)
const DISALLOW_FACET_PARAMS = [
  '/*?q=',
  '/*?*q=',
  '/*?modality=',
  '/*?*modality=',
  '/*?min_salary=',
  '/*?*min_salary=',
  '/*?max_salary=',
  '/*?*max_salary=',
  '/*?experience=',
  '/*?*experience=',
  '/*?date_range=',
  '/*?*date_range=',
  '/*?sort=',
  '/*?*sort=',
  '/*?order=',
  '/*?*order=',
  '/*?with_salary=',
  '/*?*with_salary=',
  '/*?location=',
  '/*?*location=',
  '/*?ubicacion=',
  '/*?*ubicacion=',
  '/*?scope=',
  '/*?*scope=',
  '/*?utm_',
  '/*?*utm_',
  '/*?fbclid=',
  '/*?*fbclid=',
  '/*?gclid=',
  '/*?*gclid=',
];

const ALLOW_PUBLIC_ASSETS = [
  '/',
  '/_next/static/',
  '/_next/image',
  '/api/company-logo',
];

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
        allow: ALLOW_PUBLIC_ASSETS,
        disallow: [...DISALLOW_PRIVATE_ROUTES, ...DISALLOW_FACET_PARAMS],
      },
      {
        // Bots de búsqueda con IA: heredan explícitamente las restricciones de facetas (RFC 9309)
        userAgent: ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
        allow: [
          '/',
          '/en',
          '/salarios',
          '/tendencias',
          '/noticias',
          '/trabajos',
          '/trabajo-',
          '/job',
          '/glosario',
          '/entrevistas',
          '/comparar',
          '/llms.txt',
          '/_next/static/',
          '/_next/image',
        ],
        disallow: [...DISALLOW_PRIVATE_ROUTES, ...DISALLOW_FACET_PARAMS],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-images.xml`,
      `${BASE_URL}/sitemap-news.xml`,
    ],
  };
}
