import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';
 
export default function robots(): MetadataRoute.Robots {

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/ofertas-guardadas',
        '/*?page=',
        '/*?*page='
      ]
    },
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-images.xml`
    ],
  }
}
