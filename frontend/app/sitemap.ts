import { MetadataRoute } from 'next'
import pool from '@/lib/db';
import { BLOG_POSTS } from '@/lib/blog';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://portal-trabajo.vercel.app';

const BASE_PAGES = [
  '/trabajos/informatica-tecnologia',
  '/trabajos/backend',
  '/trabajos/frontend',
  '/trabajos/data',
  '/trabajos/cloud',
  '/trabajos/mobile',
  '/empresas',
  '/publicar-oferta',
  '/talento-premium',
  '/blog',
];

const TECNOLOGIAS = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'php', 'csharp', 'ruby', 'go', 
  'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'backend', 'frontend', 
  'data', 'cloud', 'mobile', 'nextjs', 'flutter', 'kotlin', 'swift', 'sql', 'salesforce', 
  'cybersecurity', 'ciberseguridad'
];

const CIUDADES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga', 'zaragoza', 'alicante', 
  'murcia', 'gijon', 'oviedo', 'vigo', 'coruna', 'granada', 'san-sebastian', 'pamplona', 
  'valladolid', 'remoto'
];

function detectTechForSitemap(title: string, category: string | null): string[] {
  const matched: string[] = [];
  const text = `${title} ${category || ''}`.toLowerCase();
  
  for (const tec of TECNOLOGIAS) {
    if (tec === 'csharp' && (text.includes('c#') || text.includes('c-sharp') || text.includes('csharp'))) {
      matched.push('csharp');
      continue;
    }
    if (tec === 'nextjs' && (text.includes('next.js') || text.includes('nextjs') || text.includes('next-js'))) {
      matched.push('nextjs');
      continue;
    }
    if (category && category.toLowerCase().includes(tec)) {
      matched.push(tec);
      continue;
    }
    const regex = new RegExp(`\\b${tec}\\b`, 'i');
    if (regex.test(text)) {
      matched.push(tec);
    }
  }
  
  if (category === 'Backend') matched.push('backend');
  if (category === 'Frontend') matched.push('frontend');
  if (category === 'Data & AI' || category === 'Data') matched.push('data');
  if (category === 'Cloud & DevOps' || category === 'Cloud') matched.push('cloud');
  if (category === 'Mobile') matched.push('mobile');
  
  return Array.from(new Set(matched));
}

function detectCityForSitemap(location: string | null): string | null {
  if (!location) return null;
  const locLower = location.toLowerCase();
  
  if (locLower.includes('remoto') || locLower.includes('teletrabajo') || locLower.includes('remote')) {
    return 'remoto';
  }
  
  for (const ciudad of CIUDADES) {
    if (ciudad === 'remoto') continue;
    if (locLower.includes(ciudad.replace(/-/g, ' '))) {
      return ciudad;
    }
  }
  return null;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '')       // Elimina caracteres especiales
    .replace(/\-\-+/g, '-')         // Evita guiones dobles
    .replace(/^-+/, '')             // Quita guión inicial
    .replace(/-+$/, '');            // Quita guión final
}

function detectExperienceForSitemap(title: string, snippet: string | null): string[] {
  const matched: string[] = [];
  const text = `${title} ${snippet || ''}`.toLowerCase();
  
  if (text.includes('junior') || text.includes(' jr ') || text.includes('trainee') || text.includes('becario') || text.includes('prácticas') || text.includes('sin experiencia')) {
    matched.push('junior');
    matched.push('sin-experiencia');
  }
  
  if (text.includes('senior') || text.includes(' sr ') || text.includes('lead') || text.includes('principal') || text.includes('staff')) {
    matched.push('senior');
  }
  
  return Array.from(new Set(matched));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs: any[] = [];
  let companies: any[] = [];

  try {
    // 1. Cogemos las últimas 2000 ofertas para no sobrecargar (con más campos para detectar tecnologías/ciudades activas)
    const jobsRes = await pool.query("SELECT id, title, category, location, description_snippet, created_at FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 2000");
    jobs = jobsRes.rows;
    // 2. Extraemos marcas únicas
    const compRes = await pool.query("SELECT DISTINCT company FROM jobs WHERE company IS NOT NULL AND company != 'Desconocida'");
    companies = compRes.rows;
  } catch (error) {
    console.error("⚠️ Error generando sitemap desde la BD:", error);
    // Dejamos arrays vacíos para que el resto del sitemap se genere correctamente
  }

  // Detectar dinámicamente qué combinaciones de sector/ciudad tienen ofertas de empleo activas
  const activeProgrammaticPages = new Set<string>();
  for (const job of jobs) {
    const techs = detectTechForSitemap(job.title || '', job.category || null);
    const city = detectCityForSitemap(job.location);
    const exps = detectExperienceForSitemap(job.title || '', job.description_snippet || null);
    
    for (const tech of techs) {
      // 1. Añadir la página principal de la tecnología (ej: /trabajos/react)
      activeProgrammaticPages.add(`/trabajos/${tech}`);
      
      // 2. Si tiene ciudad o remoto, añadir la combinación (ej: /trabajos/react-remoto)
      if (city) {
        if (city === 'remoto') {
          activeProgrammaticPages.add(`/trabajos/${tech}-remoto`);
        } else {
          activeProgrammaticPages.add(`/trabajos/${tech}-en-${city}`);
        }
      }
      
      // 3. Añadir permutaciones de experiencia
      for (const exp of exps) {
        activeProgrammaticPages.add(`/trabajos/${tech}-${exp}`);
        if (city) {
          if (city === 'remoto') {
            activeProgrammaticPages.add(`/trabajos/${tech}-${exp}-remoto`);
          } else {
            activeProgrammaticPages.add(`/trabajos/${tech}-${exp}-en-${city}`);
          }
        }
      }
    }
  }

  const sectorPages = [...BASE_PAGES, ...Array.from(activeProgrammaticPages)];

  const jobUrls = jobs.map((job) => ({
    url: `${BASE_URL}/job/${job.id}`,
    lastModified: new Date(job.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const sectorUrls = sectorPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const companyUrls = companies.map((c) => ({
    url: `${BASE_URL}/empresas/${slugify(c.company)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const blogUrls = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...sectorUrls,
    ...jobUrls,
    ...companyUrls,
    ...blogUrls,
  ]
}
