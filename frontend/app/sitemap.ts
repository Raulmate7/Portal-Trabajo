import { MetadataRoute } from 'next'
import pool from '@/lib/db';
import { BLOG_POSTS } from '@/lib/blog';
import { GLOSSARY_TERMS } from '@/lib/glosario';
import { BASE_URL } from '@/lib/constants';
import { getJobSlug, slugify } from '@/lib/slug';

export const revalidate = 7200; // Cache por 2 horas

// Fecha límite de lanzamiento del portal — se usa como lastModified de páginas estáticas
// para no reportar "hoy" a Googlebot (evita re-crawls innecesarios de crawl budget).
// Actualizar manualmente solo cuando haya cambios estructurales significativos.
const SITE_LAST_STRUCTURAL_UPDATE = new Date('2026-07-01');

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
  '/trabajo-remoto-usa',
  '/trabajo-remoto-uk',
  '/trabajo-remoto-alemania',
  '/trabajo-remoto-europa',
  '/mejores-ofertas-semana',
  '/ofertas-hoy',
  '/trabajo-madrid',
  '/trabajo-barcelona',
  '/trabajo-valencia',
  '/trabajo-malaga',
  '/trabajo-sevilla',
  '/trabajo-bilbao',
  '/trabajo-zaragoza',
  '/trabajos/empresas-internacionales',
  '/trabajos/ingles-requerido',
  '/sobre-nosotros',
  '/faq',
  '/orientacion-profesional',
  '/glosario',
  '/noticias',
  '/tendencias',
  '/recursos',
  '/empleo-del-dia',
  '/newsletter',
  '/entrevistas',
  '/entrevistas/react',
  '/entrevistas/python',
  '/entrevistas/java',
  '/entrevistas/typescript',
  '/entrevistas/node',
  '/entrevistas/aws',
  '/entrevistas/docker',
  '/entrevistas/angular',
  '/entrevistas/vue',
  '/entrevistas/php',
  '/entrevistas/go',
  '/entrevistas/sql',
  '/entrevistas/csharp',
  '/ranking-empresas-it',
  '/comparar-ofertas',
  '/recursos/plantillas-cv',
  '/recursos/guia-entrevistas',
  '/recursos/portfolio',
  '/informe-mercado-it',
  '/afiliados-empresa',
  '/precios',
  '/publicidad',
  '/mapa-empleo',
  '/trabajo-freelance-it',
  '/practicas-informatica',
  '/trabajo-media-jornada-it',
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

const COMPARATIVAS = [
  'react-vs-angular',
  'vue-vs-react',
  'python-vs-java',
  'javascript-vs-typescript',
  'node-vs-python',
  'go-vs-rust',
  'aws-vs-kubernetes',
  'python-vs-go',
  'kotlin-vs-swift',
  'php-vs-node',
  'csharp-vs-java',
  'vue-vs-angular',
  'docker-vs-kubernetes',
  'react-vs-vue',
  'typescript-vs-javascript',
  'node-vs-go',
  'python-vs-rust',
  'aws-vs-azure',
  'devops-vs-sre',
  'terraform-vs-ansible',
  'react-native-vs-flutter',
  'flutter-vs-react-native',
  'java-vs-kotlin',
  'php-vs-laravel',
  'sql-vs-nosql',
  'mysql-vs-postgresql',
  'mongodb-vs-postgresql',
  'scrum-vs-kanban',
  'nextjs-vs-react',
  'angular-vs-react',
  'java-vs-spring-boot',
  'csharp-vs-net',
  'rust-vs-go',
  'elixir-vs-ruby',
  'scala-vs-java',
  'aws-vs-terraform',
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

const CONTRACT_KEYWORDS: Record<string, string[]> = {
  'contrato-indefinido': ['indefinido', 'contrato indefinido', 'puesto estable', 'permanente', 'permanent'],
  'contrato-temporal': ['temporal', 'contrato temporal', 'obra y servicio', 'temporary'],
  'contrato-practicas': ['practicas', 'beca', 'becario', 'trainee', 'internship', 'en prácticas'],
  'freelance': ['freelance', 'autonomo', 'autónomo', 'contractor']
};

function detectContractForSitemap(title: string, snippet: string | null): string[] {
  const matched: string[] = [];
  const text = `${title} ${snippet || ''}`.toLowerCase();
  
  for (const [key, keywords] of Object.entries(CONTRACT_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.push(key);
        break;
      }
    }
  }
  return matched;
}

// 1. Exportamos los IDs de los sitemaps disponibles dinámicamente
export async function generateSitemaps() {
  return [
    { id: 0 }, // Sitemap Principal: Páginas base, categorías dinámicas, salarios y blog
    { id: 1 }, // Sitemap Ofertas Recientes (Bloque 1: últimas 8.000 ofertas)
    { id: 2 }, // Sitemap Ofertas Anteriores (Bloque 2: ofertas de la 8.001 a la 16.000)
    { id: 3 }, // Sitemap de Empresas
  ];
}

// 2. Función sitemap() que recibe el id específico
export default async function sitemap({ id }: { id: number | string }): Promise<MetadataRoute.Sitemap> {
  const sitemapId = typeof id === 'string' ? parseInt(id, 10) : id;
  const client = await pool.connect();

  try {
    // ----------------------------------------------------
    // SITEMAP 0: Páginas Base, Categorías Dinámicas, Salarios, Blog
    // ----------------------------------------------------
    if (sitemapId === 0) {
      // Obtenemos solo las últimas 8.000 ofertas de empleo para detectar combinaciones dinámicas activas rápidamente
      const jobsRes = await client.query("SELECT title, category, location, salary_min, salary_max, LEFT(description_snippet, 300) AS description_snippet FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 8000");
      const jobs = jobsRes.rows;

      const pageCounts = new Map<string, number>();
      
      const incrementCount = (path: string) => {
        pageCounts.set(path, (pageCounts.get(path) || 0) + 1);
      };

      for (const job of jobs) {
        const techs = detectTechForSitemap(job.title || '', job.category || null);
        const city = detectCityForSitemap(job.location);
        const exps = detectExperienceForSitemap(job.title || '', job.description_snippet || null);
        const contracts = detectContractForSitemap(job.title || '', job.description_snippet || null);
        const isHybrid = isHybridJob(job.title || '', job.description_snippet || null, job.location);
        
        const min = job.salary_min ? Math.round(parseFloat(job.salary_min.toString())) : null;
        const max = job.salary_max ? Math.round(parseFloat(job.salary_max.toString())) : null;

        for (const tech of techs) {
          // 1. Página principal de la tecnología (ej: /trabajos/react)
          incrementCount(`/trabajos/${tech}`);
          
          // 2. Combinación de tecnología y ciudad/remoto (ej: /trabajos/react-remoto)
          if (city) {
            if (city === 'remoto') {
              incrementCount(`/trabajos/${tech}-remoto`);
            } else {
              incrementCount(`/trabajos/${tech}-en-${city}`);
            }
          }
          
          // 3. Permutaciones de experiencia
          for (const exp of exps) {
            incrementCount(`/trabajos/${tech}-${exp}`);
            if (city) {
              if (city === 'remoto') {
                incrementCount(`/trabajos/${tech}-${exp}-remoto`);
              } else {
                incrementCount(`/trabajos/${tech}-${exp}-en-${city}`);
              }
            }
          }

          // 4. Permutaciones de modalidad híbrida
          if (isHybrid) {
            incrementCount(`/trabajos/${tech}-hibrido`);
            if (city && city !== 'remoto') {
              incrementCount(`/trabajos/${tech}-hibrido-en-${city}`);
            }
          }

          // 5. Permutaciones de tipo de contrato
          for (const contract of contracts) {
            incrementCount(`/trabajos/${tech}-${contract}`);
            if (city) {
              if (city === 'remoto') {
                incrementCount(`/trabajos/${tech}-${contract}-remoto`);
              } else {
                incrementCount(`/trabajos/${tech}-${contract}-en-${city}`);
              }
            }
          }

          // 6. Permutaciones de rango salarial
          if (min) {
            if (min >= 30000) {
              incrementCount(`/trabajos/${tech}-salario-mas-de-30k`);
              if (city) {
                if (city === 'remoto') incrementCount(`/trabajos/${tech}-salario-mas-de-30k-remoto`);
                else incrementCount(`/trabajos/${tech}-en-${city}-salario-mas-de-30k`);
              }
            }
            if (min >= 40000) {
              incrementCount(`/trabajos/${tech}-salario-mas-de-40k`);
              if (city) {
                if (city === 'remoto') incrementCount(`/trabajos/${tech}-salario-mas-de-40k-remoto`);
                else incrementCount(`/trabajos/${tech}-en-${city}-salario-mas-de-40k`);
              }
            }
            if (min >= 50000) {
              incrementCount(`/trabajos/${tech}-salario-mas-de-50k`);
              if (city) {
                if (city === 'remoto') incrementCount(`/trabajos/${tech}-salario-mas-de-50k-remoto`);
                else incrementCount(`/trabajos/${tech}-en-${city}-salario-mas-de-50k`);
              }
            }
          }
          if (min && max) {
            const minK = Math.round(min / 1000);
            const maxK = Math.round(max / 1000);
            
            if (minK >= 30 && maxK <= 50) {
              incrementCount(`/trabajos/${tech}-salario-30k-50k`);
              if (city) {
                if (city === 'remoto') incrementCount(`/trabajos/${tech}-salario-30k-50k-remoto`);
                else incrementCount(`/trabajos/${tech}-en-${city}-salario-30k-50k`);
              }
            }
            if (minK >= 40 && maxK <= 60) {
              incrementCount(`/trabajos/${tech}-salario-40k-60k`);
              if (city) {
                if (city === 'remoto') incrementCount(`/trabajos/${tech}-salario-40k-60k-remoto`);
                else incrementCount(`/trabajos/${tech}-en-${city}-salario-40k-60k`);
              }
            }
          }
        }
      }

      // Excluir del sitemap combinaciones dinámicas con menos de 5 ofertas de empleo (evita thin content)
      const activeProgrammaticPages = Array.from(pageCounts.keys()).filter((path) => {
        const count = pageCounts.get(path) || 0;
        return count >= 5;
      });

      // Generar subpáginas de empresas contratantes para las tecnologías activas
      const activeCompaniesSubpages: string[] = [];
      for (const path of activeProgrammaticPages) {
        if (path.startsWith('/trabajos/')) {
          const parts = path.split('/');
          if (parts.length === 3) {
            const sector = parts[2];
            const isBaseSector = !sector.includes('-en-') && !sector.endsWith('-remoto') && !sector.includes('-junior') && !sector.includes('-senior') && !sector.includes('-salario') && !sector.includes('-contrato') && !sector.includes('-hibrido');
            if (isBaseSector) {
              activeCompaniesSubpages.push(`/trabajos/${sector}/empresas`);
            }
          }
        }
      }

      // 7. Empleadores por sector (Oportunidad 1.2)
      const activeEmployersPages: string[] = [];
      const technologies = [
        'react', 'node', 'python', 'java', 'typescript', 'javascript', 'aws', 'docker', 'kubernetes', 'backend', 'frontend', 'fullstack'
      ];
      for (const tech of technologies) {
        activeEmployersPages.push(`/empleadores/${tech}`);
      }

      // 8. Convertirse en (Oportunidad 1.5)
      const activeConvertirsePages: string[] = [];
      const professions = [
        'frontend-developer', 'backend-developer', 'devops-engineer', 'data-scientist', 'mobile-developer', 'fullstack-developer'
      ];
      for (const prof of professions) {
        activeConvertirsePages.push(`/convertirse-en/${prof}`);
      }

      // 9. Query news/trends posts from the database (Oportunidad 1.3)
      let newsUrls: any[] = [];
      try {
        const newsRes = await client.query("SELECT slug, date FROM blog_posts WHERE slug LIKE 'tendencias-%' OR author = 'Sistema de Tendencias IT' ORDER BY date DESC");
        newsUrls = newsRes.rows.map((row: any) => ({
          url: `${BASE_URL}/noticias/${row.slug}`,
          lastModified: new Date(row.date),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      } catch (e) {
        console.error("Error querying sitemap news:", e);
      }

      const sectorPages = [
        ...BASE_PAGES, 
        ...activeProgrammaticPages, 
        ...activeCompaniesSubpages,
        ...activeEmployersPages,
        ...activeConvertirsePages
      ];
      const sectorUrls = sectorPages.map((path) => {
        const isSectorBasePage = path.startsWith('/trabajos/') && !path.endsWith('/empresas');
        const alternates = isSectorBasePage
          ? {
              languages: {
                'es-ES': `${BASE_URL}${path}`,
                'en': `${BASE_URL}${path.replace('/trabajos/', '/en/trabajos/')}`,
                'x-default': `${BASE_URL}${path}`,
              }
            }
          : (path.startsWith('/trabajos/') || path.startsWith('/talento-premium') || path.startsWith('/trabajo-')
            ? {
                languages: {
                  'es-ES': `${BASE_URL}${path}`,
                  'en': `${BASE_URL}${path}?lang=en`,
                  'x-default': `${BASE_URL}${path}`,
                }
              }
            : undefined);

        // Páginas estáticas base del portal
        if (BASE_PAGES.includes(path)) {
          return {
            url: `${BASE_URL}${path}`,
            lastModified: SITE_LAST_STRUCTURAL_UPDATE,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
            alternates,
          };
        }

        const count = pageCounts.get(path) || 0;
        const isConsolidated = count >= 5;

        return {
          url: `${BASE_URL}${path}`,
          lastModified: new Date(),
          changeFrequency: (isConsolidated ? 'daily' : 'weekly') as 'daily' | 'weekly',
          priority: isConsolidated ? 0.85 : 0.6,
          alternates,
        };
      });

      const blogUrls = BLOG_POSTS.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

      const SALARIOS_TECNOLOGIAS = [
        'react', 'node', 'python', 'java', 'typescript', 'aws', 'docker', 'flutter', 'csharp', 'php', 'sql',
        'go', 'rust', 'ruby', 'scala', 'elixir', 'salesforce', 'cybersecurity', 'terraform', 'cobol'
      ];
      const SALARIOS_CIUDADES = [
        'madrid', 'barcelona', 'valencia', 'remoto',
        'sevilla', 'bilbao', 'malaga', 'zaragoza', 'alicante', 'vigo', 'coruna', 'granada'
      ];
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
          lastModified: SITE_LAST_STRUCTURAL_UPDATE,
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        })),
        ...SALARIOS_TECNOLOGIAS.flatMap(tech => 
          SALARIOS_CIUDADES.map(city => ({
            url: `${BASE_URL}/salarios/${tech}/${city}`,
            lastModified: SITE_LAST_STRUCTURAL_UPDATE,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
          }))
        ),
        ...SALARIOS_TECNOLOGIAS.flatMap(tech => 
          SALARIOS_CIUDADES.flatMap(city =>
            SALARIOS_NIVELES.map(level => ({
              url: `${BASE_URL}/salarios/${tech}/${city}/${level}`,
              lastModified: SITE_LAST_STRUCTURAL_UPDATE,
              changeFrequency: 'monthly' as const,
              priority: 0.75,
            }))
          )
        )
      ];

      const glossaryUrls = GLOSSARY_TERMS.map((term) => ({
        url: `${BASE_URL}/glosario/${term.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));

      const comparisonUrls = COMPARATIVAS.map((slug) => ({
        url: `${BASE_URL}/comparar/${slug}`,
        lastModified: SITE_LAST_STRUCTURAL_UPDATE,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

      return [
        {
          url: BASE_URL,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 1.0,
          alternates: {
            languages: {
              'es-ES': BASE_URL,
              'en': `${BASE_URL}/en`,
              'x-default': BASE_URL,
            }
          }
        },
        ...sectorUrls,
        ...blogUrls,
        ...salaryUrls,
        ...glossaryUrls,
        ...comparisonUrls,
        ...newsUrls,
      ];
    }

    // ----------------------------------------------------
    // SITEMAP 1: Ofertas Recientes (Bloque 1: 1 - 8000)
    // ----------------------------------------------------
    if (sitemapId === 1) {
      const jobsRes = await client.query(
        "SELECT id, title, company, location, created_at FROM jobs WHERE is_active = TRUE AND created_at >= NOW() - INTERVAL 30 DAY ORDER BY created_at DESC LIMIT 8000 OFFSET 0"
      );
      const jobs = jobsRes.rows;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return jobs.map((job: any) => {
        const jobDate = new Date(job.created_at);
        const isOld = jobDate < thirtyDaysAgo;
        const jobSlug = getJobSlug(job);
        return {
          url: `${BASE_URL}/job/${jobSlug}`,
          lastModified: jobDate,
          changeFrequency: (isOld ? 'never' : 'monthly') as 'never' | 'monthly',
          priority: isOld ? 0.4 : 0.8,
          alternates: {
            languages: {
              'es-ES': `${BASE_URL}/job/${jobSlug}`,
              'en': `${BASE_URL}/job/${jobSlug}?lang=en`,
              'x-default': `${BASE_URL}/job/${jobSlug}`,
            }
          }
        };
      });
    }

    // ----------------------------------------------------
    // SITEMAP 2: Ofertas Anteriores (Bloque 2: 8001 - 16000)
    // ----------------------------------------------------
    if (sitemapId === 2) {
      const jobsRes = await client.query(
        "SELECT id, title, company, location, created_at FROM jobs WHERE is_active = TRUE AND created_at >= NOW() - INTERVAL 30 DAY ORDER BY created_at DESC LIMIT 8000 OFFSET 8000"
      );
      const jobs = jobsRes.rows;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return jobs.map((job: any) => {
        const jobDate = new Date(job.created_at);
        const isOld = jobDate < thirtyDaysAgo;
        const jobSlug = getJobSlug(job);
        return {
          url: `${BASE_URL}/job/${jobSlug}`,
          lastModified: jobDate,
          changeFrequency: (isOld ? 'never' : 'monthly') as 'never' | 'monthly',
          priority: isOld ? 0.4 : 0.8,
          alternates: {
            languages: {
              'es-ES': `${BASE_URL}/job/${jobSlug}`,
              'en': `${BASE_URL}/job/${jobSlug}?lang=en`,
              'x-default': `${BASE_URL}/job/${jobSlug}`,
            }
          }
        };
      });
    }

    // ----------------------------------------------------
    // SITEMAP 3: Páginas de Empresas
    // ----------------------------------------------------
    if (sitemapId === 3) {
      const compRes = await client.query(
        "SELECT DISTINCT company, category FROM jobs WHERE company IS NOT NULL AND company != 'Desconocida'"
      );
      const rows = compRes.rows;

      const companySlugs: string[] = Array.from(new Set(rows.map((r: any) => slugify(r.company))));
      const companyUrls = companySlugs.map((slug: string) => ({
        url: `${BASE_URL}/empresas/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.55,
        alternates: {
          languages: {
            'es-ES': `${BASE_URL}/empresas/${slug}`,
            'en': `${BASE_URL}/empresas/${slug}?lang=en`,
            'x-default': `${BASE_URL}/empresas/${slug}`,
          }
        }
      }));

      const categorySlugMap: Record<string, string> = {
        'Backend': 'backend',
        'Frontend': 'frontend',
        'Data & AI': 'data-ai',
        'Cloud & DevOps': 'cloud-devops',
        'Mobile': 'mobile',
        'Otros': 'otros'
      };

      const categoryUrls = rows.map((r: any) => {
        const companySlug = slugify(r.company);
        const catSlug = r.category ? categorySlugMap[r.category] : null;
        if (!catSlug) return null;
        return {
          url: `${BASE_URL}/empresas/${companySlug}/${catSlug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.55,
          alternates: {
            languages: {
              'es-ES': `${BASE_URL}/empresas/${companySlug}/${catSlug}`,
              'en': `${BASE_URL}/empresas/${companySlug}/${catSlug}?lang=en`,
              'x-default': `${BASE_URL}/empresas/${companySlug}/${catSlug}`,
            }
          }
        };
      }).filter(Boolean) as any[];

      return [...companyUrls, ...categoryUrls];
    }

    // Retornamos array vacío para IDs no válidos
    return [];

  } catch (error) {
    console.error(`⚠️ Error generando sitemap id=${sitemapId} desde la BD:`, error);
    return [];
  } finally {
    client.release();
  }
}
