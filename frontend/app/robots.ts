import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  // ⚠️ CAMBIA ESTO POR TU URL REAL
  const BASE_URL = 'https://portal-trabajo.vercel.app'; 

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
