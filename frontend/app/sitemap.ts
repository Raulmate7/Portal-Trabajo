import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://portal-trabajo.vercel.app/'; // OJO: Tu dominio real se pondrá aquí automático si usas variables, pero por ahora pon tu URL de Vercel si la sabes, o dejalo así

  // Las rutas estáticas básicas
  const routes = [
    '',
    '/trabajos/informatica-tecnologia',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // Generamos rutas para las principales ciudades tecnológicas
  // (Esto es SEO Programático: crear páginas que la gente busca)
  const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Remoto', 'Bilbao', 'Malaga'];
  
  const cityRoutes = cities.map((city) => ({
    url: `${baseUrl}/trabajos/informatica-tecnologia?ubicacion=${city}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  return [...routes, ...cityRoutes];
}
