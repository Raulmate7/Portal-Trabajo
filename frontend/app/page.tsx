import { Metadata } from "next";
import { BASE_URL , safeJsonLdString } from "@/lib/constants";
import Link from "next/link";
import pool from "@/lib/db";
import SearchFilters from "./components/SearchFilters";
import AdBanner from "@/components/AdBanner";
import SubscribeForm from "@/components/SubscribeForm";
import FeaturedJobCard from "@/components/FeaturedJobCard";
import JobCard from "@/components/JobCard";
import PushSubscribe from "@/components/PushSubscribe";
import { Suspense } from "react";
import { headers } from "next/headers";
import { getJobs, getFeaturedJobs, getJobsCount, getFilteredJobsCount, getJobOfTheDay, getTrendingTech } from "@/lib/jobs";
import LoadMoreJobs from "@/components/LoadMoreJobs";
import { RecentlyViewedList } from "@/components/RecentlyViewed";
import { JobOfTheDayWidget, TrendingTechWidget, ReferralWidget } from "@/components/Widgets";
import { getLatestBlogPosts } from "@/lib/blog";

export const revalidate = 300; // Cache de 5 minutos para reducir consultas frecuentes a BD

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
      let sectorSlug = '';
      if (citySlug) {
        sectorSlug = citySlug === 'remoto'
          ? `${techSlug}-remoto`
          : `${techSlug}-en-${citySlug}`;
      } else {
        sectorSlug = techSlug;
      }
      
      canonicalUrl = isEnglish 
        ? `${BASE_URL}/en/trabajos/${sectorSlug}` 
        : `${BASE_URL}/trabajos/${sectorSlug}`;

      metadata.alternates = {
        canonical: canonicalUrl,
        languages: {
          'es-ES': `${BASE_URL}/trabajos/${sectorSlug}`,
          'en': `${BASE_URL}/en/trabajos/${sectorSlug}`,
          'x-default': `${BASE_URL}/trabajos/${sectorSlug}`,
        },
        types: {
          'application/rss+xml': `${BASE_URL}/feed.xml`,
        },
      };
      return metadata;
    } else {
      // Búsqueda libre sin tecnología conocida: canonical apunta a la home para no desperdiciar crawl budget
      // y se marca la página como no indexable para evitar que Google indexe queries basura/spam.
      canonicalUrl = isEnglish ? `${BASE_URL}/?lang=en` : `${BASE_URL}/`;
      metadata.alternates = {
        canonical: canonicalUrl,
        languages: {
          'es-ES': `${BASE_URL}/`,
          'en': `${BASE_URL}/en`,
          'x-default': `${BASE_URL}/`,
        },
        types: {
          'application/rss+xml': `${BASE_URL}/feed.xml`,
        },
      };
      metadata.robots = { index: false, follow: true };
      return metadata;
    }
  } else if (isEnglish) {
    canonicalUrl = `${BASE_URL}/en`;
  }

  const baseLangUrl = `${BASE_URL}/`;

  const metadataAlternates: any = {
    canonical: canonicalUrl,
    languages: {
      'es-ES': baseLangUrl,
      'en': `${BASE_URL}/en`,
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
  const withSalary = resolvedParams.with_salary === '1';
  const sort = resolvedParams.sort === 'salary' ? 'salary' : 'recent';

  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  let lang: 'es' | 'en' = resolvedParams.lang === 'en' ? 'en' : resolvedParams.lang === 'es' ? 'es' : 'es';
  if (resolvedParams.lang !== 'en' && resolvedParams.lang !== 'es') {
    const reqHeaders = await headers();
    const acceptLang = (reqHeaders.get('accept-language') || '').toLowerCase();
    if (acceptLang.split(',')[0]?.trim().startsWith('en')) {
      lang = 'en';
    }
  }
  const isEnglish = lang === 'en';

  const filters = {
    query: q,
    location: loc,
    minSalary,
    withSalary,
    sort,
    modality,
    dateRange,
    experience
  } as const;

  // Carga de datos concurrentes en el servidor
  const [jobs, featuredJobs, totalJobs, filteredCount, jobOfTheDay, trendingTech, lastPosts] = await Promise.all([
    getJobs(filters, validPage),
    getFeaturedJobs(filters),
    getJobsCount(),
    getFilteredJobsCount(filters),
    getJobOfTheDay(),
    getTrendingTech(),
    getLatestBlogPosts(3),
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
    'description': 'Agregador de empleo tecnológico en España. Vacantes de React, Python, Java, DevOps, Data Science y más. Actualizado cada 6 horas.',
    'sameAs': [
      'https://t.me/PortalDeTrabajo',
      'https://www.linkedin.com/company/portal-trabajo-it',
      'https://www.pinterest.es/portalempleoit',
      'https://www.threads.net/@portalempleoit',
      'https://mastodon.social/@portalempleoit',
      'https://www.youtube.com/@PortalEmpleoIT',
    ]
  };

  const queryParam = isEnglish ? '?lang=en' : '';
  const isPaged = validPage > 1;
  const hasNextPage = jobs.length === 20;

  const faqItems = [
    {
      question: isEnglish ? 'What is IT Job Portal?' : '¿Qué es Portal Trabajo IT?',
      answer: isEnglish 
        ? 'It is a smart technology job aggregator in Spain. We compile and categorize open positions in real time for React, Python, Java, DevOps, etc.' 
        : 'Es un agregador inteligente de empleo tecnológico en España. Recopilamos y categorizamos ofertas en tiempo real de React, Python, Java, DevOps, etc.'
    },
    {
      question: isEnglish ? 'How often are the job offers updated?' : '¿Cómo se actualizan las ofertas de empleo?',
      answer: isEnglish 
        ? 'Our platform updates the database automatically every 6 hours to ensure no expired offers are shown and the newest postings are available.' 
        : 'Nuestro portal actualiza la base de datos de manera automatizada cada 6 horas para asegurar que no haya ofertas caducadas y se muestren las más recientes.'
    },
    {
      question: isEnglish ? 'Is it free to apply or post job offers?' : '¿Es gratuito publicar ofertas o postularse?',
      answer: isEnglish 
        ? 'Yes, applying and posting job offers is 100% free (subject to brief admin review to ensure quality).' 
        : 'Sí, tanto postularse como publicar ofertas es 100% gratuito (sujeto a una breve revisión previa para garantizar la calidad).'
    }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(faqJsonLd) }}
      />

      {/* Hero Section Technical Luxury */}
      <div className="bg-[#090C10] text-white border-b border-white/[0.08] relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.14),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          {totalJobs > 0 && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-slate-300 text-xs font-mono tabular-nums mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              {isEnglish ? (
                <><strong className="text-white font-semibold">{totalJobs.toLocaleString('es-ES')}</strong> active tech openings</>
              ) : (
                <><strong className="text-white font-semibold">{totalJobs.toLocaleString('es-ES')}</strong> ofertas tech activas</>
              )}
            </span>
          )}

          <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight text-white">
            {isEnglish ? (
              <>IT Job <span className="text-indigo-400">Portal</span></>
            ) : (
              <>Portal Empleo <span className="text-indigo-400">IT</span></>
            )}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto mb-7 text-sm md:text-base leading-relaxed">
            {isEnglish
              ? 'Your specialized technology job aggregator. Verified national and remote openings updated in real time.'
              : 'Tu agregador especializado en empleo tecnológico. Vacantes verificadas en España y remoto actualizadas en tiempo real.'}
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            <a
              href="https://t.me/PortalDeTrabajo"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn-press bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] text-white font-medium text-xs sm:text-sm py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.828.94z" />
              </svg>
              {isEnglish ? 'Telegram Channel' : 'Canal Telegram'}
            </a>
            {/* Talento Premium oculto temporalmente */}
            <Link
              href={`/publicar-oferta${queryParam}`}
              className="ui-btn-press bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium text-xs sm:text-sm py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {isEnglish ? 'Post a Job' : 'Publicar Oferta'}
            </Link>
          </div>

          <div className="mt-7 flex justify-center">
            <div className="w-full max-w-md text-left">
              <PushSubscribe />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Layout de 2 Columnas */}
      <div className="max-w-7xl mx-auto px-4 py-8 -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* COLUMNA PRINCIPAL (Filtros + Listado) */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<div className="h-24 ui-card rounded-xl animate-pulse" />}>
              <SearchFilters />
            </Suspense>

            {/* Leaderboard Banner */}
            <div className="my-4">
              <AdBanner variant="leaderboard" />
            </div>

            {/* Ofertas Destacadas */}
            {featuredJobs.length > 0 && (
              <div className="space-y-3 pt-1">
                <h2 className="font-mono text-xs font-semibold text-[var(--status-amber)] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-amber)]" aria-hidden="true" />
                  {isEnglish ? 'Featured Jobs' : 'Ofertas Destacadas'}
                </h2>
                <div className="grid grid-cols-1 gap-3.5">
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
              <div className="flex justify-between items-center pt-1">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)] font-mono tabular-nums">
                  {jobs.length === 0
                    ? (isEnglish ? "No results" : "Sin resultados")
                    : (isEnglish
                        ? `${filteredCount.toLocaleString('es-ES')} matching offers`
                        : `${filteredCount.toLocaleString('es-ES')} ofertas encontradas`)}
                </h2>
              </div>

              {(q || loc) && (
                <div className="ui-card rounded-xl p-5 border-[var(--border-accent)] bg-[var(--accent-tint)] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] text-base">
                      {isEnglish ? `Don't miss any offers ${q ? 'for '+q : ''} ${loc ? 'in '+loc : ''}` : `No te pierdas nuevas ofertas ${q ? 'de '+q : ''} ${loc ? 'en '+loc : ''}`}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                      {isEnglish ? 'Create a custom alert and receive new vacancies in your inbox.' : 'Crea una alerta personalizada y recibe nuevas vacantes en tu correo antes que nadie.'}
                    </p>
                  </div>
                  <div className="w-full md:w-auto">
                    <SubscribeForm
                      location={loc || "España"}
                      defaultTech={q || undefined}
                      defaultLocation={loc || undefined}
                    />
                  </div>
                </div>
              )}

              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job: any, index: number) => (
                    <div key={job.id}>
                      {/* CTA Newsletter in-feed */}
                      {index === 6 && (
                        <div className="my-5">
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
                          <AdBanner variant="infeed" />
                        </div>
                      )}
                      {/* Segundo AdSense inline in-feed */}
                      {index === 15 && (
                        <div className="my-4">
                          <AdBanner variant="infeed" />
                        </div>
                      )}

                      <JobCard
                        job={job}
                        lang={lang}
                        prefetch={index < 5}
                        variant="feed"
                      />
                    </div>
                  ))}

                  {/* Carga Incremental client-side */}
                  <LoadMoreJobs lang={lang} initiallyHasMore={hasNextPage} />
                </div>
              ) : (
                <div className="ui-card rounded-xl text-center py-14 px-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                  </div>
                  <p className="text-base text-[var(--text-primary)] font-semibold">
                    {isEnglish ? 'No offers were found matching your criteria.' : 'No se encontraron ofertas con esos filtros.'}
                  </p>
                  <p className="text-[var(--text-secondary)] mt-1.5 text-sm max-w-sm mx-auto leading-relaxed">
                    {isEnglish
                      ? 'Try clearing some filters or searching for general keywords like React, Node or Python.'
                      : 'Intenta limpiar algunos filtros avanzados o buscar términos generales como React, Java o Python.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA LATERAL (Widgets de Retención) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-5">

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

      {/* SECCIÓN EDITORIAL INFERIOR E-E-A-T */}
      <div className="bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] mt-12 py-14">
        <div className="max-w-7xl mx-auto px-4 space-y-14">

          {/* 1. ¿Por qué Portal Trabajo IT? & Estadísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {isEnglish ? 'Why search for job offers on Portal Trabajo IT?' : '¿Por qué buscar ofertas de empleo en Portal Trabajo IT?'}
              </h2>
              <p>
                {isEnglish
                  ? 'Portal Trabajo IT is not just another job portal. We are a specialized technology job aggregator that indexes, cleans, and deduplicates hundreds of vacancies daily from major IT boards and software companies in Spain. Our mission is to save you time and offer complete salary transparency.'
                  : 'Portal Trabajo IT no es un portal de empleo más. Somos un agregador de ofertas de trabajo especializado en tecnología que rastrea, limpia y deduplica cientos de vacantes diariamente procedentes de las principales bolsas de empleo y empresas de software en España. Nuestra misión es ahorrarte tiempo y ofrecerte transparencia salarial.'}
              </p>
              <p>
                {isEnglish
                  ? 'We analyze the description of each job listing to extract exact technologies (React, Java, Python, AWS...) and experience levels (Junior, Mid, Senior). This allows you to apply highly granular filters and discover the jobs that match your technical profile. Additionally, we provide real-time salary calculations to give you negotiation leverage.'
                  : 'Analizamos la descripción de cada vacante para extraer las tecnologías requeridas (React, Java, Python, AWS...) y clasificar el nivel de experiencia (Junior, Mid, Senior). Esto te permite aplicar filtros de búsqueda avanzados y encontrar puestos alineados a tu perfil. También calculamos salarios promedio en tiempo real para darte herramientas en tus negociaciones.'}
              </p>
            </div>

            {/* 2. Estadísticas en tiempo real */}
            <div className="ui-card rounded-xl p-6 flex flex-col justify-center gap-4 text-center">
              <h3 className="font-mono text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                {isEnglish ? 'Live Portal Stats' : 'Estadísticas en Tiempo Real'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-subtle)]">
                  <span className="font-mono tabular-nums text-2xl font-bold text-[var(--text-primary)] block">{totalJobs.toLocaleString('es-ES')}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    {isEnglish ? 'Offers Today' : 'Ofertas Activas'}
                  </span>
                </div>
                <div className="bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-subtle)]">
                  <span className="font-mono tabular-nums text-2xl font-bold text-[var(--accent-primary)] block">100% IT</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    {isEnglish ? 'Verified Tech' : 'Empleo Tech'}
                  </span>
                </div>
              </div>
              <p className="font-mono text-[11px] text-[var(--text-muted)] m-0">
                {isEnglish ? 'Updated automatically every 6 hours' : 'Actualización automática cada 6 horas'}
              </p>
            </div>
          </div>

          {/* 3. Tecnologías más buscadas */}
          <div className="border-t border-[var(--border-subtle)] pt-8">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              {isEnglish ? 'Most Searched IT Categories in Spain' : 'Tecnologías y Categorías más buscadas en España'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'React Developer', slug: 'react' },
                { label: 'Angular', slug: 'angular' },
                { label: 'Vue.js', slug: 'vue' },
                { label: 'Node.js Developer', slug: 'node' },
                { label: 'Python Developer', slug: 'python' },
                { label: 'Java Developer', slug: 'java' },
                { label: 'TypeScript', slug: 'typescript' },
                { label: 'DevOps / Cloud', slug: 'cloud' },
                { label: 'AWS', slug: 'aws' },
                { label: 'Docker / Kubernetes', slug: 'docker' },
                { label: 'PHP / Laravel', slug: 'php' },
                { label: 'SQL / Databases', slug: 'sql' },
                { label: 'C# / .NET', slug: 'csharp' },
                { label: 'Flutter Developer', slug: 'flutter' }
              ].map((tech) => (
                <Link
                  key={tech.slug}
                  href={`/trabajos/${tech.slug}${queryParam}`}
                  className="font-mono text-xs bg-[var(--bg-subtle)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-primary)] text-[var(--text-secondary)] px-3 py-1.5 rounded-md font-medium border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors"
                >
                  {tech.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 4. Últimos artículos del Blog */}
          {lastPosts && lastPosts.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] pt-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {isEnglish ? 'Latest Career & IT Guides' : 'Últimas Guías de Carrera e Informática'}
                </h3>
                <Link href={`/blog${queryParam}`} className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                  {isEnglish ? 'View Blog →' : 'Ver todo el Blog →'}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lastPosts.map((post: any) => (
                  <div key={post.slug} className="ui-card ui-card-interactive p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-semibold text-[var(--accent-primary)] uppercase tracking-widest">
                        {post.category || (isEnglish ? 'Career' : 'Orientación')}
                      </span>
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base mt-2 mb-1.5 line-clamp-2">
                        <Link href={`/blog/${post.slug}${queryParam}`} className="hover:text-[var(--accent-primary)] transition-colors">
                          {post.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>
                    <Link
                      href={`/blog/${post.slug}${queryParam}`}
                      className="text-xs font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                    >
                      {isEnglish ? 'Read article' : 'Leer artículo'} →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Preguntas Frecuentes (FAQ Visual para SEO y E-E-A-T) */}
          <div className="border-t border-[var(--border-subtle)] pt-8">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5">
              {isEnglish ? 'Frequently Asked Questions' : 'Preguntas Frecuentes sobre Portal Trabajo'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {faqItems.map((item, idx) => (
                <div key={idx} className="ui-card p-5 rounded-xl flex flex-col justify-start">
                  <h4 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base mb-2">
                    {item.question}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
