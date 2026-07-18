import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import PushSubscribe from "@/components/PushSubscribe";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

interface Props {
  countryKey: string;
  countryName: string;
  countryNameEn: string;
  sqlFilter: string;
  sqlParams: string[];
  page: number;
  lang: string;
}

// Obtener ofertas remotas por país
async function getRemoteCountryJobs(sqlFilter: string, sqlParams: string[], page: number = 1) {
  const limit = 30;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    const sql = `
      SELECT id, title, title_es, company, location, salary, created_at, url_source, description_snippet, category, is_featured FROM jobs 
      WHERE is_active = TRUE 
        AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' OR location ILIKE '%anywhere%' OR location ILIKE '%worldwide%')
        AND (${sqlFilter})
      ORDER BY created_at DESC 
      LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}
    `;
    const result = await client.query(sql, [...sqlParams, limit, offset]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching remote jobs for country filter:`, error);
    return [];
  } finally {
    client.release();
  }
}

// Obtener estadísticas de remoto por país
async function getRemoteCountryStats(sqlFilter: string, sqlParams: string[]) {
  const client = await pool.connect();
  try {
    const totalRes = await client.query(`
      SELECT COUNT(*) as count
      FROM jobs 
      WHERE is_active = TRUE 
        AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' OR location ILIKE '%anywhere%' OR location ILIKE '%worldwide%')
        AND (${sqlFilter})
    `, sqlParams);
    
    const salaryRes = await client.query(`
      SELECT AVG((salary_min + salary_max) / 2) as avg_sal
      FROM jobs
      WHERE is_active = TRUE
        AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' OR location ILIKE '%anywhere%' OR location ILIKE '%worldwide%')
        AND (${sqlFilter})
        AND salary_min IS NOT NULL
        AND salary_max IS NOT NULL
        AND salary_min >= 15000
        AND salary_max <= 150000
    `, sqlParams);
    
    const count = parseInt(totalRes.rows[0]?.count || '0', 10);
    const avgSalary = salaryRes.rows[0]?.avg_sal ? Math.round(parseFloat(salaryRes.rows[0].avg_sal)) : null;

    return {
      total: count,
      avgSalary: avgSalary
    };
  } catch (error) {
    console.error("Error fetching remote country stats:", error);
    return { total: 0, avgSalary: null };
  } finally {
    client.release();
  }
}

export async function generateRemoteCountryMetadata(
  countryKey: string, 
  countryName: string, 
  countryNameEn: string,
  sqlFilter: string, 
  sqlParams: string[], 
  page: number, 
  lang: string
): Promise<Metadata> {
  const isPaged = page > 1;
  const isEnglish = lang === 'en';
  const stats = await getRemoteCountryStats(sqlFilter, sqlParams);

  const title = isEnglish
    ? `Remote IT Jobs in ${countryNameEn}${isPaged ? ` - Page ${page}` : ''} [2026] | IT Job Portal`
    : `Trabajo Remoto IT en ${countryName}${isPaged ? ` - Página ${page}` : ''} [2026] | Portal Trabajo`;

  const description = isEnglish
    ? `Find active remote jobs for candidates residing in Spain or worldwide working for companies in ${countryNameEn}. Browse ${stats.total} listings.`
    : `Encuentra ofertas de empleo 100% remoto para trabajar en empresas de ${countryName}. Trabaja desde España para el extranjero. ${stats.total} vacantes.`;

  const canonicalUrl = `${BASE_URL}/trabajo-remoto-${countryKey}`;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'es-ES': `${BASE_URL}/trabajo-remoto-${countryKey}`,
        'en': `${BASE_URL}/trabajo-remoto-${countryKey}?lang=en`,
        'x-default': `${BASE_URL}/trabajo-remoto-${countryKey}`,
      }
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    }
  };

  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

export default async function RemoteCountryLandingPage({
  countryKey,
  countryName,
  countryNameEn,
  sqlFilter,
  sqlParams,
  page,
  lang
}: Props) {
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const isEnglish = lang === 'en';

  const [jobs, stats] = await Promise.all([
    getRemoteCountryJobs(sqlFilter, sqlParams, validPage),
    getRemoteCountryStats(sqlFilter, sqlParams),
  ]);

  const isPaged = validPage > 1;
  const hasNextPage = validPage * 30 < stats.total;
  
  const queryParam = isEnglish ? '?lang=en' : '';
  const prevUrl = isPaged ? `/trabajo-remoto-${countryKey}${validPage > 2 ? `?page=${validPage - 1}` : ''}${isEnglish ? (validPage > 2 ? '&lang=en' : '?lang=en') : ''}` : null;
  const nextUrl = hasNextPage ? `/trabajo-remoto-${countryKey}?page=${validPage + 1}${isEnglish ? '&lang=en' : ''}` : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {prevUrl && <link rel="prev" href={`${BASE_URL}${prevUrl}`} />}
      {nextUrl && <link rel="next" href={`${BASE_URL}${nextUrl}`} />}

      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-violet-950 z-0" />
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/35 via-transparent to-transparent z-0" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            🌍 {isEnglish ? 'International Remote Work' : 'Teletrabajo Internacional'}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            {isEnglish ? (
              <>Remote Tech Jobs in <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{countryNameEn}</span></>
            ) : (
              <>Trabajo Remoto IT en <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{countryName}</span></>
            )}
          </h2>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed mb-8">
            {isEnglish
              ? `Find developer and tech vacancies to work 100% remotely for companies located in ${countryNameEn}. Earn in foreign currency or work for top startups.`
              : `Encuentra ofertas de empleo tecnológico en remoto para incorporarte a empresas de ${countryName}. Trabaja desde España para proyectos internacionales de primer nivel.`}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors">
              <p className="text-3xl font-extrabold text-white">{stats.total}</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">
                {isEnglish ? 'Active Openings' : 'Vacantes Activas'}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors">
              <p className="text-3xl font-extrabold text-white">
                {stats.avgSalary ? `${stats.avgSalary.toLocaleString('es-ES')}€` : '48.000€'}
              </p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">
                {isEnglish ? 'Estimated Avg Salary' : 'Salario Medio Estimado'}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors">
              <p className="text-3xl font-extrabold text-white">Cada 6h</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">
                {isEnglish ? 'Updates frequency' : 'Actualización de ofertas'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Resultados de Ofertas */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>💼</span> {isEnglish ? `Active openings from ${countryNameEn}` : `Ofertas de empleo activas en ${countryName}`}
              </h3>
              <Link href={isEnglish ? '/trabajo-remoto?lang=en' : '/trabajo-remoto'} className="text-xs font-bold text-indigo-650 hover:underline">
                {isEnglish ? '← View all remote jobs' : '← Ver todo el trabajo remoto'}
              </Link>
            </div>
            
            {jobs && jobs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {jobs.map((job: any, index: number) => (
                    <JobCard key={job.id} job={job} prefetch={index < 5} />
                  ))}
                </div>

                {/* Controles de Paginación */}
                <div className="flex justify-between items-center pt-8">
                  {isPaged ? (
                    <Link
                      href={`/trabajo-remoto-${countryKey}?page=${validPage - 1}${isEnglish ? '&lang=en' : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      ← {isEnglish ? 'Previous' : 'Anterior'}
                    </Link>
                  ) : (
                    <div />
                  )}
                  <span className="text-sm text-gray-500 font-medium font-sans">Página {validPage}</span>
                  {hasNextPage ? (
                    <Link
                      href={`/trabajo-remoto-${countryKey}?page=${validPage + 1}${isEnglish ? '&lang=en' : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      {isEnglish ? 'Next →' : 'Siguiente →'}
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                <span className="text-4xl">🤷‍♂️</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4">
                  {isEnglish ? 'No vacancies available' : 'No hay ofertas disponibles'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isEnglish 
                    ? 'Check back later for new updates or check general remote opportunities.'
                    : 'Prueba a buscar en el listado general de teletrabajo.'}
                </p>
                <Link href={isEnglish ? '/trabajo-remoto?lang=en' : '/trabajo-remoto'} className="inline-block mt-6 text-sm font-semibold text-indigo-650 hover:underline">
                  {isEnglish ? 'View general remote jobs →' : 'Ver ofertas generales de remoto →'}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <SubscribeForm location={`${isEnglish ? countryNameEn : countryName} Remoto`} defaultLocation="remoto" />
            <PushSubscribe />
            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
