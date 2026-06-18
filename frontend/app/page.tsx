import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import Link from "next/link";
import pool from "@/lib/db";
import SearchFilters from "./components/SearchFilters";
import AdBanner from "@/components/AdBanner";
import SubscribeForm from "@/components/SubscribeForm";
import FeaturedJobCard from "@/components/FeaturedJobCard";
import PushSubscribe from "@/components/PushSubscribe";
import CompanyLogo from "@/components/CompanyLogo";
import { Suspense } from "react";
import { getJobSlug } from "@/lib/slug";
import { getJobs, getFeaturedJobs, getJobsCount, getJobOfTheDay, getTrendingTech } from "@/lib/jobs";
import LoadMoreJobs from "@/components/LoadMoreJobs";
import { RecentlyViewedList } from "@/components/RecentlyViewed";
import { JobOfTheDayWidget, TrendingTechWidget, ReferralWidget } from "@/components/Widgets";

export const revalidate = 60; // Reducimos para actualizar los widgets con mayor frecuencia

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : '';
  const loc = typeof resolvedParams.location === 'string' ? resolvedParams.location.trim() : '';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  let totalJobs = 0;
  if (!q && !loc) {
    totalJobs = await getJobsCount();
  } else {
    const client = await pool.connect();
    try {
      let countSql = "SELECT COUNT(*) FROM jobs WHERE is_active = TRUE AND (is_featured = FALSE OR is_featured IS NULL)";
      const countParams: any[] = [];
      let paramIdx = 1;
      if (q) {
        countSql += ` AND (title LIKE $${paramIdx} OR company LIKE $${paramIdx} OR description_snippet LIKE $${paramIdx})`;
        countParams.push(`%${q}%`);
        paramIdx++;
      }
      if (loc) {
        countSql += ` AND location LIKE $${paramIdx}`;
        countParams.push(`%${loc}%`);
      }
      const countRes = await client.query(countSql, countParams);
      totalJobs = parseInt(countRes.rows[0].count || '0', 10);
    } catch {
      totalJobs = 500;
    } finally {
      client.release();
    }
  }

  const limit = 20;
  const hasNextPage = page * limit < totalJobs;

  const metadata: Metadata = {};

  // Las páginas paginadas no deben indexarse (evitar contenido duplicado)
  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  // Mapa de tecnologías conocidas a sus slugs de ruta programática
  const KNOWN_TECH_SLUGS: Record<string, string> = {
    'react': 'react', 'angular': 'angular', 'vue': 'vue', 'node': 'node', 'node.js': 'node',
    'python': 'python', 'java': 'java', 'php': 'php', 'c#': 'csharp', 'ruby': 'ruby',
    'go': 'go', 'javascript': 'javascript', 'typescript': 'typescript', 'aws': 'aws',
    'docker': 'docker', 'kubernetes': 'kubernetes', 'backend': 'backend', 'frontend': 'frontend',
    'data': 'data', 'cloud': 'cloud', 'mobile': 'mobile', 'nextjs': 'nextjs', 'next.js': 'nextjs',
    'flutter': 'flutter', 'kotlin': 'kotlin', 'swift': 'swift', 'sql': 'sql',
    'fullstack': 'fullstack', 'devops': 'cloud', 'cybersecurity': 'cybersecurity',
  };
  const KNOWN_CITY_SLUGS: Record<string, string> = {
    'madrid': 'madrid', 'barcelona': 'barcelona', 'valencia': 'valencia', 'sevilla': 'sevilla',
    'bilbao': 'bilbao', 'malaga': 'malaga', 'málaga': 'malaga', 'zaragoza': 'zaragoza',
    'alicante': 'alicante', 'granada': 'granada', 'remoto': 'remoto', 'remote': 'remoto',
    'teletrabajo': 'remoto',
  };

  const queryParam = isEnglish ? '&lang=en' : '';
  let canonicalUrl = `${BASE_URL}/`;

  if (q || loc) {
    const techSlug = KNOWN_TECH_SLUGS[q.toLowerCase().trim()];
    const citySlug = KNOWN_CITY_SLUGS[loc.toLowerCase().trim()];

    if (techSlug) {
      // La búsqueda coincide con una tecnología conocida: apuntar a la página programática canónica
      if (citySlug) {
        // /trabajos/react-en-madrid o /trabajos/react-remoto
        const programmaticPath = citySlug === 'remoto'
          ? `/trabajos/${techSlug}-remoto`
          : `/trabajos/${techSlug}-en-${citySlug}`;
        canonicalUrl = isEnglish ? `${BASE_URL}${programmaticPath}?lang=en` : `${BASE_URL}${programmaticPath}`;
      } else {
        // /trabajos/react
        canonicalUrl = isEnglish ? `${BASE_URL}/trabajos/${techSlug}?lang=en` : `${BASE_URL}/trabajos/${techSlug}`;
      }
    } else {
      // Búsqueda libre sin tecnología conocida: canonical a la URL de búsqueda
      canonicalUrl = `${BASE_URL}/?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}${queryParam}`;
    }
  } else if (isEnglish) {
    canonicalUrl = `${BASE_URL}/?lang=en`;
  }

  const baseLangUrl = q || loc 
    ? `${BASE_URL}/?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}` 
    : `${BASE_URL}/`;

  const metadataAlternates: any = {
    canonical: canonicalUrl,
    languages: {
      'es-ES': baseLangUrl,
      'en': `${baseLangUrl}${q || loc ? '&' : '?'}lang=en`,
      'x-default': baseLangUrl,
    },
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
    },
  };

  metadata.alternates = metadataAlternates;

  if (!q && !loc) {
    if (isPaged) {
      metadata.title = isEnglish ? `Page ${page} | IT Job Portal` : `Página ${page} | Portal Trabajo IT`;
      metadata.alternates = {
        canonical: isEnglish ? `${BASE_URL}/?lang=en` : `${BASE_URL}/`,
        languages: {
          'es-ES': `${BASE_URL}/`,
          'en': `${BASE_URL}/?lang=en`,
          'x-default': `${BASE_URL}/`,
        },
        types: {
          'application/rss+xml': `${BASE_URL}/feed.xml`,
        },
      };
      return metadata;
    }
    return metadata;
  }

  let titleText = isEnglish ? 'Job Offers' : 'Ofertas de Empleo';
  if (q) {
    titleText += isEnglish ? ` for ${q}` : ` de ${q}`;
  }
  if (loc) {
    const formattedLoc = loc.charAt(0).toUpperCase() + loc.slice(1);
    titleText += isEnglish ? ` in ${formattedLoc}` : ` en ${formattedLoc}`;
  }
  if (isPaged) {
    titleText += isEnglish ? ` - Page ${page}` : ` - Página ${page}`;
  }

  const descText = isEnglish
    ? `Find the best IT job offers and vacancies ${q ? `for ${q}` : ''} ${loc ? `in ${loc}` : ''} in Spain updated today.${isPaged ? ` (Page ${page})` : ''}`
    : `Encuentra las mejores ofertas de trabajo y vacantes${q ? ` de ${q}` : ''}${loc ? ` en ${loc}` : ''} en España actualizadas hoy.${isPaged ? ` (Página ${page})` : ''}`;

  metadata.title = isEnglish ? `${titleText} | IT Job Portal` : `${titleText} | Portal Trabajo IT`;
  metadata.description = descText;
  metadata.openGraph = {
    title: isEnglish ? `${titleText} | IT Job Portal` : `${titleText} | Portal Trabajo IT`,
    description: descText,
    url: canonicalUrl,
  };
  metadata.twitter = {
    card: 'summary_large_image',
    title: isEnglish ? `${titleText} | IT Job Portal` : `${titleText} | Portal Trabajo IT`,
    description: descText,
  };

  return metadata;
}

export default async function Home({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  
  // Parámetros de búsqueda general
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const loc = typeof resolvedParams.location === 'string' ? resolvedParams.location : '';
  
  // Parámetros de búsqueda avanzada
  const minSalaryStr = typeof resolvedParams.min_salary === 'string' ? resolvedParams.min_salary : '';
  const minSalary = minSalaryStr ? parseInt(minSalaryStr, 10) : undefined;
  const modality = typeof resolvedParams.modality === 'string' ? resolvedParams.modality : undefined;
  const dateRange = typeof resolvedParams.date_range === 'string' ? resolvedParams.date_range : undefined;
  const experience = typeof resolvedParams.experience === 'string' ? resolvedParams.experience : undefined;

  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const lang = resolvedParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const filters = {
    query: q,
    location: loc,
    minSalary,
    modality,
    dateRange,
    experience
  };

  // Carga de datos concurrentes en el servidor
  const [jobs, featuredJobs, totalJobs, jobOfTheDay, trendingTech] = await Promise.all([
    getJobs(filters, validPage),
    getFeaturedJobs(filters),
    getJobsCount(),
    getJobOfTheDay(),
    getTrendingTech()
  ]);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Portal Trabajo IT',
    'url': BASE_URL,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${BASE_URL}/?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Portal Trabajo IT',
    'url': BASE_URL,
    'logo': `${BASE_URL}/logo.png`,
    'sameAs': [
      'https://t.me/PortalDeTrabajo'
    ]
  };

  const queryParam = isEnglish ? '?lang=en' : '';
  const isPaged = validPage > 1;
  const hasNextPage = jobs.length === 20;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      
      {/* Hero Section Premium */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]"></div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          
          {totalJobs > 0 && (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm animate-pulse">
              {isEnglish ? (
                <>✨ More than <strong className="text-white font-bold">{totalJobs}</strong> active tech job openings</>
              ) : (
                <>✨ Más de <strong className="text-white font-bold">{totalJobs}</strong> ofertas de empleo tecnológico activas</>
              )}
            </span>
          )}
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            {isEnglish ? (
              <>IT Job <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">Portal</span></>
            ) : (
              <>Portal Empleo <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">IT</span></>
            )}
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto mb-8 text-sm md:text-base leading-relaxed">
            {isEnglish 
              ? 'Your trusted technology aggregator. Get the best national and international job openings updated in real time.'
              : 'Tu agregador tecnológico de confianza. Consigue las mejores vacantes nacionales e internacionales actualizadas en tiempo real.'}
          </p>

          <div className="flex flex-wrap justify-center gap-3.5">
            <a href="https://t.me/PortalDeTrabajo" target="_blank" className="bg-white text-indigo-900 font-extrabold py-2.5 px-6 rounded-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-950/20 flex items-center gap-2">
              <span>✈️</span> {isEnglish ? 'View on Telegram' : 'Ver en Telegram'}
            </a>
            <Link href={`/talento-premium${queryParam}`} className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-extrabold py-2.5 px-6 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center gap-2">
              <span>⭐</span> {isEnglish ? 'Premium Talent' : 'Talento Premium'}
            </Link>
            <Link href={`/publicar-oferta${queryParam}`} className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 font-extrabold py-2.5 px-6 rounded-xl hover:from-green-300 hover:to-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 flex items-center gap-2">
              <span>🏢</span> {isEnglish ? 'Post a Job' : 'Publicar Oferta'}
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-md text-left">
              <PushSubscribe />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Layout de 2 Columnas */}
      <div className="max-w-7xl mx-auto px-4 py-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA PRINCIPAL (Filtros + Listado) */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<div className="h-24 bg-white rounded-2xl shadow animate-pulse"></div>}>
              <SearchFilters />
            </Suspense>

            {/* Ofertas Destacadas */}
            {featuredJobs.length > 0 && (
              <div className="space-y-4 pt-2">
                <h2 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                  ⭐ {isEnglish ? 'Featured Jobs' : 'Ofertas Destacadas'}
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {featuredJobs.map((job: any) => (
                    <FeaturedJobCard key={job.id} job={job} lang={lang} />
                  ))}
                </div>
              </div>
            )}

            {/* Anuncio AdSense Inline */}
            <div className="my-4">
              <AdBanner variant="inline" />
            </div>

            {/* Listado Reciente */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pt-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {jobs.length === 0 
                    ? (isEnglish ? "No results" : "Sin resultados") 
                    : (isEnglish ? `${jobs.length} recent offers` : `${jobs.length} ofertas recientes`)}
                </h2>
              </div>

              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job: any, index: number) => {
                    const jobSlug = getJobSlug(job);
                    const detailUrl = `/job/${jobSlug}${queryParam}`;
                    const displayJobTitle = isEnglish ? job.title : (job.title_es || job.title);
                    
                    return (
                      <div key={job.id}>
                        {/* CTA Newsletter in-feed */}
                        {index === 6 && (
                          <div className="my-6">
                            <SubscribeForm 
                              location={loc || "España"} 
                              defaultTech={q || undefined}
                              defaultLocation={loc || undefined}
                            />
                          </div>
                        )}
                        {/* AdSense inline in-feed */}
                        {index === 5 && (
                          <div className="my-4">
                            <AdBanner variant="inline" />
                          </div>
                        )}
                        {/* Segundo AdSense inline in-feed */}
                        {index === 15 && (
                          <div className="my-4">
                            <AdBanner variant="inline" />
                          </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800/80 hover:shadow-md transition-shadow">
                          <div className="flex gap-4 items-start">
                            <CompanyLogo company={job.company} size={12} />
                            <div className="flex-grow w-full flex flex-col md:flex-row justify-between md:items-start gap-4">
                              <div className="w-full">
                                <Link href={detailUrl}>
                                  <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-400 hover:text-indigo-650 dark:hover:text-indigo-300 transition-colors">
                                    {displayJobTitle}
                                  </h3>
                                </Link>
                                <p className="text-gray-650 dark:text-slate-350 font-medium mt-1">{job.company}</p>
                                
                                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500 dark:text-slate-400">
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-gray-50 dark:bg-slate-850 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-medium border border-gray-200 dark:border-slate-800"
                                  >
                                    📍 {job.location}
                                  </a>
                                  <span className="bg-gray-50 dark:bg-slate-850 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">💰 {job.salary || (isEnglish ? "Negotiable" : "Consultar")}</span>
                                  <span className="bg-gray-50 dark:bg-slate-850 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">📅 {new Date(job.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <Link 
                                href={detailUrl}
                                className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 dark:text-indigo-300 font-semibold rounded-lg transition-colors text-center shrink-0 cursor-pointer"
                              >
                                {isEnglish ? 'View offer' : 'Ver oferta'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Carga Incremental client-side */}
                  <LoadMoreJobs lang={lang} initiallyHasMore={hasNextPage} />
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800/80 shadow-sm">
                  <span className="text-5xl block mb-4">📭</span>
                  <p className="text-lg text-gray-800 dark:text-slate-200 font-medium">
                    {isEnglish ? 'No offers were found matching your criteria.' : 'No se encontraron ofertas con esos filtros.'}
                  </p>
                  <p className="text-gray-450 dark:text-slate-500 mt-2 text-sm max-w-sm mx-auto leading-relaxed">
                    {isEnglish 
                      ? 'Try clearing some filters or searching for general keywords like React, Node or Python.'
                      : 'Intenta limpiar algunos filtros avanzados o buscar términos generales como React, Java o Python.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA LATERAL (Widgets de Retención y AdSense Sticky) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-20 space-y-6">
              
              {/* Widget: Boletín de Empleo */}
              <div className="hidden lg:block">
                <SubscribeForm 
                  location={loc || "España"} 
                  defaultTech={q || undefined}
                  defaultLocation={loc || undefined}
                />
              </div>

              {/* Widget: Oferta del Día */}
              <JobOfTheDayWidget job={jobOfTheDay} lang={lang} />

              {/* Widget: Programa de Referidos */}
              <ReferralWidget lang={lang} />

              {/* Widget: Categorías en Tendencia */}
              <TrendingTechWidget trends={trendingTech} lang={lang} />

              {/* Widget: Vistos Recientemente (LocalStorage client-side) */}
              <RecentlyViewedList lang={lang} />

              {/* Banner Publicitario Sticky de Alto RPM */}
              <div className="pt-2">
                <AdBanner variant="sidebar" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
