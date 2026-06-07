import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 60;

// Tipos
interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at: string;
}

const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

const displayNameMap: Record<string, string> = {
  'react': 'React',
  'angular': 'Angular',
  'vue': 'Vue',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'php': 'PHP',
  'csharp': 'C#',
  'ruby': 'Ruby',
  'go': 'Go',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'aws': 'AWS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'nextjs': 'Next.js',
  'flutter': 'Flutter',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'sql': 'SQL',
  'salesforce': 'Salesforce',
  'cybersecurity': 'Ciberseguridad',
  'ciberseguridad': 'Ciberseguridad',
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data',
  'cloud': 'Cloud',
  'mobile': 'Mobile'
};

const adMap: Record<string, { title: string, text: string, link: string }> = {
  'backend': { 
    title: '¿Quieres ser experto en Java/Spring?', 
    text: 'Las empresas pagan +40k a los seniors. Fórmate aquí.', 
    link: 'https://trk.udemy.com/9VMAEj' 
  },
  'data': { 
    title: 'Domina el Big Data y PowerBI', 
    text: 'El perfil más demandado de 2026.', 
    link: 'https://trk.udemy.com/9VMAEj'
  }
};

type Params = Promise<{ sector: string }>;

function parseSector(sectorSlug: string) {
  let tec = sectorSlug;
  let ciudad = '';
  
  const enIndex = sectorSlug.indexOf('-en-');
  if (enIndex !== -1) {
    tec = sectorSlug.substring(0, enIndex);
    ciudad = sectorSlug.substring(enIndex + 4).replace(/-/g, ' ');
  } else if (sectorSlug.endsWith('-remoto')) {
    tec = sectorSlug.replace('-remoto', '');
    ciudad = 'remoto';
  }

  const dbCategory = categoryMap[tec];
  return { tec, ciudad, dbCategory };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const { tec, ciudad, dbCategory } = parseSector(sectorSlug);
  
  const categoriaBonita = displayNameMap[tec] || dbCategory || tec.replace(/-/g, ' ');
  const tituloCategoria = categoriaBonita;
  
  let tituloSeo = `Ofertas de trabajo de ${tituloCategoria}`;
  let descSeo = `Encuentra las mejores vacantes de ${tituloCategoria}`;
  
  if (ciudad) {
    const ciudadBonita = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
    tituloSeo += ` en ${ciudadBonita}`;
    descSeo += ` en ${ciudadBonita}`;
  }
  
  return {
    title: `${tituloSeo} en España | Portal Trabajo`,
    description: `${descSeo} actualizadas hoy. Recopilamos ofertas de las mejores empresas tecnológicas.`,
    openGraph: {
      title: `${tituloSeo} - Vacantes Urgentes`,
      description: `Listado actualizado de ${descSeo.toLowerCase()}.`,
    }
  };
}

async function getJobs(tec: string, ciudad: string, dbCategory: string | undefined, page: number = 1) {
  const limit = 50;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE 1=1";
    const paramsQuery: any[] = [];
    let paramIndex = 1;

    if (dbCategory) {
      sql += ` AND category = $${paramIndex}`;
      paramsQuery.push(dbCategory);
      paramIndex++;
    } else if (tec !== 'informatica-tecnologia') {
      if (tec === 'nextjs') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%nextjs%', '%next.js%', '%next-js%');
        paramIndex += 3;
      } else if (tec === 'csharp') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%c#%', '%c-sharp%', '%csharp%');
        paramIndex += 3;
      } else if (tec === 'cybersecurity' || tec === 'ciberseguridad') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%cybersecurity%', '%ciberseguridad%', '%seguridad%');
        paramIndex += 3;
      } else {
        sql += ` AND title ILIKE $${paramIndex}`;
        paramsQuery.push(`%${tec}%`);
        paramIndex++;
      }
    }

    if (ciudad) {
      sql += ` AND location ILIKE $${paramIndex}`;
      paramsQuery.push(`%${ciudad}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    paramsQuery.push(limit, offset);

    const result = await client.query(sql, paramsQuery);
    return result.rows;
  } catch (error) {
    console.error("Error cargando ofertas de BD:", error);
    return [];
  } finally {
    client.release();
  }
}

async function getFallbackJobs(tec: string, ciudad: string, dbCategory: string | undefined, page: number = 1) {
  // 1. Si buscó en una ciudad, probar en remoto
  if (ciudad && ciudad !== 'remoto') {
    const remoteJobs = await getJobs(tec, 'remoto', dbCategory, page);
    if (remoteJobs.length > 0) {
      return { jobs: remoteJobs, type: 'remote' };
    }
  }

  // 2. Probar a nivel nacional (sin restricción de ciudad)
  if (ciudad) {
    const nationalJobs = await getJobs(tec, '', dbCategory, page);
    if (nationalJobs.length > 0) {
      return { jobs: nationalJobs, type: 'national' };
    }
  }

  // 3. Probar ofertas recientes generales de la misma categoría o tecnología
  if (tec !== 'informatica-tecnologia') {
    const generalJobs = await getJobs('informatica-tecnologia', '', undefined, page);
    if (generalJobs.length > 0) {
      return { jobs: generalJobs, type: 'general' };
    }
  }

  return { jobs: [], type: 'none' };
}

const BASE_URL = 'https://portal-trabajo.vercel.app';

function calculateStats(jobs: any[]) {
  let countWithSalary = 0;
  let sumSalary = 0;
  
  for (const job of jobs) {
    if (!job.salary) continue;
    const cleanStr = job.salary.replace(/\./g, '').replace(/\s/g, '');
    const numbers = cleanStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) continue;
    
    const parsedNums = numbers.map((n: string) => parseInt(n));
    let val = 0;
    if (parsedNums.length >= 2) {
      val = (parsedNums[0] + parsedNums[1]) / 2;
    } else {
      val = parsedNums[0];
    }
    
    if (val > 0 && val < 5000) {
      val = val * 12;
    }
    
    if (val >= 12000 && val <= 150000) {
      sumSalary += val;
      countWithSalary++;
    }
  }
  
  const averageSalary = countWithSalary > 0 ? Math.round(sumSalary / countWithSalary) : null;
  return {
    averageSalary,
    totalCount: jobs.length,
  };
}

export default async function SectorPage({ 
  params, 
  searchParams 
}: { 
  params: Params; 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  
  const { tec, ciudad, dbCategory } = parseSector(sectorSlug);
  
  let jobs = await getJobs(tec, ciudad, dbCategory, validPage);
  let isFallback = false;
  let fallbackType = '';

  if (jobs.length === 0) {
    const fallbackResult = await getFallbackJobs(tec, ciudad, dbCategory, validPage);
    jobs = fallbackResult.jobs;
    isFallback = jobs.length > 0;
    fallbackType = fallbackResult.type;
  }
  
  const ad = adMap[tec];
  
  const categoriaBonita = displayNameMap[tec] || dbCategory || tec.replace(/-/g, ' ');
  const tituloMostrado = ciudad 
    ? `${categoriaBonita} en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` 
    : categoriaBonita;

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Trabajos', href: '/trabajos/informatica-tecnologia' },
    { label: tituloMostrado }
  ];

  const stats = calculateStats(jobs);

  const CIUDADES_POPULARES = ['madrid', 'barcelona', 'valencia', 'remoto'];
  const TECNOLOGIAS_POPULARES = ['react', 'node', 'python', 'java', 'backend', 'frontend', 'data', 'cloud', 'mobile'];

  const relatedLinks: { label: string, href: string }[] = [];
  if (ciudad) {
    for (const t of TECNOLOGIAS_POPULARES) {
      if (t !== tec) {
        const tLabel = t.charAt(0).toUpperCase() + t.slice(1);
        const cLabel = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
        relatedLinks.push({
          label: `${tLabel} en ${cLabel}`,
          href: ciudad === 'remoto' ? `/trabajos/${t}-remoto` : `/trabajos/${t}-en-${ciudad.replace(/\s+/g, '-')}`
        });
      }
    }
  } else {
    for (const c of CIUDADES_POPULARES) {
      const tLabel = tec.charAt(0).toUpperCase() + tec.slice(1);
      const cLabel = c.charAt(0).toUpperCase() + c.slice(1);
      relatedLinks.push({
        label: `${tLabel} en ${cLabel}`,
        href: c === 'remoto' ? `/trabajos/${tec}-remoto` : `/trabajos/${tec}-en-${c}`
      });
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? `${BASE_URL}${item.href}` : undefined
    }))
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Ofertas de empleo de ${tituloMostrado}`,
    description: `Listado de ofertas de trabajo para ${tituloMostrado} en España`,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/job/${job.id}`,
      name: `${job.title} - ${job.company}`
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />
      
      <h1 className="text-3xl font-bold mb-4 capitalize text-gray-900">
        Ofertas de {tituloMostrado}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="md:col-span-2 flex flex-col justify-center">
          <p className="text-gray-700 leading-relaxed m-0">
            Si buscas empleo de <strong>{categoriaBonita}</strong>{ciudad ? ` en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` : ' en España'}, estás en el lugar indicado. 
            Actualmente contamos con <strong>{jobs.length} ofertas activas</strong>. 
            El perfil de {categoriaBonita} es uno de los más demandados en el sector tecnológico actual.
            Explora las vacantes a continuación, que incluyen opciones tanto presenciales en oficina como en formato híbrido o 100% remoto.
          </p>
        </div>
        <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider m-0 mb-1">Estadísticas de la categoría</h3>
          <p className="text-3xl font-extrabold text-indigo-700 m-0">
            {stats.averageSalary ? `${stats.averageSalary.toLocaleString('es-ES')}€` : 'N/A'}
          </p>
          <span className="text-xs text-gray-500 mt-1">Salario medio anual estimado</span>
          <span className="text-[10px] text-gray-400 mt-2">Basado en ofertas actuales con sueldo visible</span>
        </div>
      </div>

      {ad && !ciudad && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-lg font-bold text-indigo-900">{ad.title}</h3>
          <p className="text-indigo-700 mb-3">{ad.text}</p>
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            Ver Curso Recomendado →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {isFallback && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold m-0">No encontramos ofertas de {categoriaBonita} en {ciudad === 'remoto' ? 'remoto' : ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}.</p>
                <p className="text-amber-800 text-xs mt-1 mb-0 leading-relaxed">
                  {fallbackType === 'remote' && `Te mostramos ofertas para ${categoriaBonita} 100% en remoto como alternativa:`}
                  {fallbackType === 'national' && `Te mostramos ofertas para ${categoriaBonita} en otras ciudades de España:`}
                  {fallbackType === 'general' && `No hay ofertas activas de esta categoría. Te sugerimos las ofertas de empleo IT generales más recientes:`}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs && jobs.length > 0 ? (
              <>
                {jobs.flatMap((job, index) => {
                  const card = <JobCard key={job.id} job={job as Job} />;
                  if (index === 4) {
                    return [
                      <div key={`ad-inline-${job.id}`} className="col-span-full my-2">
                        <AdBanner variant="inline" />
                      </div>,
                      card
                    ];
                  }
                  return [card];
                })}
                
                <div className="col-span-full flex justify-between items-center pt-6">
                  {validPage > 1 ? (
                    <Link
                      href={`/trabajos/${sector}?page=${validPage - 1}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ← Anterior
                    </Link>
                  ) : (
                    <div />
                  )}
                  <span className="text-sm text-gray-600">Página {validPage}</span>
                  {jobs.length === 50 ? (
                    <Link
                      href={`/trabajos/${sector}?page=${validPage + 1}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Siguiente →
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No hay ofertas de {tituloMostrado} ahora mismo.</p>
                <p className="text-sm text-gray-400 mt-2">Vuelve mañana a las 08:00.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <SubscribeForm location={ciudad ? ciudad : tec} />
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>

      {relatedLinks.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Búsquedas populares relacionadas</h2>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link, idx) => (
              <Link 
                key={idx}
                href={link.href}
                className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-3 py-2 rounded-lg font-medium transition-colors border border-gray-200"
              >
                🔍 Ofertas de {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
