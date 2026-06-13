import { MetadataRoute } from 'next'
import pool from '@/lib/db';
import { BLOG_POSTS } from '@/lib/blog';
import { BASE_URL } from '@/lib/constants';
import { getJobSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

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
  '/trabajo-remoto',
  '/trabajos/empresas-internacionales',
  '/trabajos/ingles-requerido',
];

const TECNOLOGIAS = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'php', 'csharp', 'ruby', 'go', 
  'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'backend', 'frontend', 
  'data', 'cloud', 'mobile', 'nextjs', 'flutter', 'kotlin', 'swift', 'sql', 'salesforce', 
  'cybersecurity', 'ciberseguridad',
  'desarrollador-fullstack', 'fullstack', 'devops-engineer', 'scrum-master', 
  'product-manager', 'data-analyst', 'qa-engineer', 'ux-designer',
  'rust', 'scala', 'elixir', 'terraform', 'haskell', 'erlang', 'cobol'
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
    if ((tec === 'desarrollador-fullstack' || tec === 'fullstack') && (text.includes('fullstack') || text.includes('full stack') || text.includes('full-stack'))) {
      matched.push(tec);
      continue;
    }
    if ((tec === 'devops-engineer' || tec === 'devops') && (text.includes('devops') || text.includes('dev ops') || text.includes('dev-ops') || text.includes('site reliability'))) {
      matched.push(tec);
      continue;
    }
    if ((tec === 'data-analyst' || tec === 'analista-datos') && (text.includes('data analyst') || text.includes('analista de datos') || text.includes('data-analyst'))) {
      matched.push(tec);
      continue;
    }
    if (tec === 'scrum-master' && (text.includes('scrum master') || text.includes('scrum-master'))) {
      matched.push('scrum-master');
      continue;
    }
    if (tec === 'product-manager' && (text.includes('product manager') || text.includes('product-manager'))) {
      matched.push('product-manager');
      continue;
    }
    if (tec === 'qa-engineer' && (text.includes('qa') || text.includes('tester') || text.includes('calidad') || text.includes('test engineer'))) {
      matched.push('qa-engineer');
      continue;
    }
    if (tec === 'ux-designer' && (text.includes('ux') || text.includes('diseñador ux') || text.includes('diseño ux') || text.includes('ux-designer'))) {
      matched.push('ux-designer');
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

function isHybridJob(title: string, descriptionSnippet: string | null, location: string | null): boolean {
  const text = `${title} ${descriptionSnippet || ''} ${location || ''}`.toLowerCase();
  return text.includes('híbrido') || text.includes('hibrido') || text.includes('hybrid') || text.includes('semipresencial') || text.includes('semi-presencial');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let jobs: any[] = [];
  let companies: any[] = [];

  try {
    // 1. Cogemos las últimas 25000 ofertas para no sobrecargar (con más campos para detectar tecnologías/ciudades activas)
    const jobsRes = await pool.query("SELECT id, title, title_es, company, category, location, description_snippet, created_at FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 25000");
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
    const isHybrid = isHybridJob(job.title || '', job.description_snippet || null, job.location);
    
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

      // 4. Añadir permutaciones de modalidad híbrida
      if (isHybrid) {
        activeProgrammaticPages.add(`/trabajos/${tech}-hibrido`);
        if (city && city !== 'remoto') {
          activeProgrammaticPages.add(`/trabajos/${tech}-hibrido-en-${city}`);
        }
      }
    }
  }

  const sectorPages = [...BASE_PAGES, ...Array.from(activeProgrammaticPages)];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const jobUrls = jobs.map((job) => {
    const jobDate = new Date(job.created_at);
    const isOld = jobDate < thirtyDaysAgo;
    const jobSlug = getJobSlug(job);
    return {
      url: `${BASE_URL}/job/${jobSlug}`,
      lastModified: jobDate,
      changeFrequency: (isOld ? 'never' : 'monthly') as 'never' | 'monthly',
      priority: isOld ? 0.4 : 0.8,
    };
  });

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

  const SALARIOS_TECNOLOGIAS = ['react', 'node', 'python', 'java', 'typescript', 'aws', 'docker', 'flutter', 'csharp', 'php', 'sql'];
  const SALARIOS_CIUDADES = ['madrid', 'barcelona', 'valencia', 'remoto'];
  const SALARIOS_NIVELES = ['junior', 'mid', 'senior'];

  const salaryUrls = [
    {
      url: `${BASE_URL}/salarios`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    ...SALARIOS_TECNOLOGIAS.map(tech => ({
      url: `${BASE_URL}/salarios/${tech}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...SALARIOS_TECNOLOGIAS.flatMap(tech => 
      SALARIOS_CIUDADES.map(city => ({
        url: `${BASE_URL}/salarios/${tech}/${city}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    ),
    ...SALARIOS_TECNOLOGIAS.flatMap(tech => 
      SALARIOS_CIUDADES.flatMap(city =>
        SALARIOS_NIVELES.map(level => ({
          url: `${BASE_URL}/salarios/${tech}/${city}/${level}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.75,
        }))
      )
    )
  ];

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
    ...salaryUrls,
  ]
}
