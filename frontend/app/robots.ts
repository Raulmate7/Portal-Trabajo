import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://portal-trabajo.vercel.app'; // <--- Pon tu dominio real aquí

  return {
    rules: {
      userAgent: '*',     // Todos los robots son bienvenidos
      allow: '/',         // Pueden ver toda la web
      disallow: '/api/',  // No queremos que cotilleen la API interna (opcional)
    },
    sitemap: `${baseUrl}/sitemap.xml`, // Le indicamos dónde está el mapa
  };
}
