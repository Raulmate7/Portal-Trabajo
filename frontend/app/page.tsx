import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import Link from "next/link";
import pool from "@/lib/db";
import SearchFilters from "./components/SearchFilters";
import AdBanner from "@/components/AdBanner";
import FeaturedJobCard from "@/components/FeaturedJobCard";
import PushSubscribe from "@/components/PushSubscribe";
import { Suspense } from "react";

// Caching ISR (Incremental Static Regeneration) de 5 minutos para maximizar rendimiento y Core Web Vitals
export const revalidate = 300;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getJobs(query: string, location: string, page: number = 1) {
  const limit = 50;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE (is_featured = FALSE OR is_featured IS NULL) AND is_active = TRUE";
    const params: any[] = [];
    let paramIndex = 1;

    if (query && query.trim()) {
      sql += ` AND (title ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${query.trim()}%`);
      paramIndex++;
    }

    if (location && location.trim()) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location.trim()}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error BD:", error);
    return [];
  } finally {
    client.release();
  }
}

async function getFeaturedJobs(query: string, location: string) {
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE is_featured = TRUE AND is_active = TRUE";
    const params: any[] = [];
    let paramIndex = 1;

    if (query && query.trim()) {
      sql += ` AND (title ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${query.trim()}%`);
      paramIndex++;
    }

    if (location && location.trim()) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location.trim()}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT 3`;
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    return [];
  } finally {
    client.release();
  }
}

async function getJobsCount() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE");
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error counting jobs:", error);
    return 0;
  } finally {
    client.release();
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : '';
  const loc = typeof resolvedParams.location === 'string' ? resolvedParams.location.trim() : '';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;

  const metadata: Metadata = {};

  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  if (!q && !loc) {
    if (isPaged) {
      metadata.title = `Página ${page} | Portal Trabajo IT`;
      metadata.alternates = { canonical: BASE_URL };
      return metadata;
    }
    return {}; // Usa metadatos globales por defecto de layout.tsx
  }

  let titleText = 'Ofertas de Empleo';
  if (q) {
    titleText += ` de ${q}`;
  }
  if (loc) {
    const formattedLoc = loc.charAt(0).toUpperCase() + loc.slice(1);
    titleText += ` en ${formattedLoc}`;
  }
  if (isPaged) {
    titleText += ` - Página ${page}`;
  }

  const descText = `Encuentra las mejores ofertas de trabajo y vacantes${q ? ` de ${q}` : ''}${loc ? ` en ${loc}` : ''} en España actualizadas hoy.${isPaged ? ` (Página ${page})` : ''}`;
  const canonicalUrl = `${BASE_URL}/?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`;

  metadata.title = `${titleText} | Portal Trabajo IT`;
  metadata.description = descText;
  metadata.alternates = {
    canonical: canonicalUrl,
  };
  metadata.openGraph = {
    title: `${titleText} | Portal Trabajo IT`,
    description: descText,
    url: canonicalUrl,
  };
  metadata.twitter = {
    card: 'summary_large_image',
    title: `${titleText} | Portal Trabajo IT`,
    description: descText,
  };

  return metadata;
}

export default async function Home({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const loc = typeof resolvedParams.location === 'string' ? resolvedParams.location : '';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  // Realizamos las consultas en paralelo
  const [jobs, featuredJobs, totalJobs] = await Promise.all([
    getJobs(q, loc, validPage),
    getFeaturedJobs(q, loc),
    getJobsCount()
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
    'logo': `${BASE_URL}/favicon.ico`,
    'sameAs': [
      'https://t.me/PortalDeTrabajo'
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Hero Section Premium con Degradado y Estadísticas en Vivo */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-850 text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]"></div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          
          {/* Badge de Ofertas Activas */}
          {totalJobs > 0 && (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm animate-pulse">
              ✨ Más de <strong className="text-white font-bold">{totalJobs}</strong> ofertas de empleo tecnológico activas
            </span>
          )}
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Portal Empleo <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">IT</span>
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto mb-8 text-sm md:text-base leading-relaxed">
            Tu agregador tecnológico de confianza. Consigue las mejores vacantes nacionales e internacionales actualizadas en tiempo real.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5">
            <a href="https://t.me/PortalDeTrabajo" target="_blank" className="bg-white text-indigo-900 font-extrabold py-2.5 px-6 rounded-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-950/20 flex items-center gap-2">
              <span>✈️</span> Ver en Telegram
            </a>
            <Link href="/talento-premium" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-extrabold py-2.5 px-6 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center gap-2">
              <span>⭐</span> Talento Premium
            </Link>
            <Link href="/publicar-oferta" className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 font-extrabold py-2.5 px-6 rounded-xl hover:from-green-300 hover:to-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 flex items-center gap-2">
              <span>🏢</span> Publicar Oferta
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-md text-left">
              <PushSubscribe />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 -mt-8 relative z-20">
        <Suspense fallback={<div className="h-24 bg-white rounded-xl shadow animate-pulse"></div>}>
          <SearchFilters />
        </Suspense>

        <div className="mt-8 space-y-6">
          
          {/* Ofertas Destacadas / Patrocinadas */}
          {featuredJobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                ⭐ Ofertas Destacadas
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {featuredJobs.map((job) => (
                  <FeaturedJobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <h2 className="text-xl font-bold text-gray-800">
              {jobs.length === 0 ? "Sin resultados" : `${jobs.length} ofertas recientes`}
            </h2>
          </div>

          {jobs.length > 0 ? (
            <>
              {jobs.map((job, index) => (
                <div key={job.id}>
                  {/* Banner de afiliado entre las ofertas (después de la 5ª oferta) */}
                  {index === 4 && (
                    <div className="my-4">
                      <AdBanner variant="inline" />
                    </div>
                  )}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="w-full">
                        <Link href={`/job/${job.id}`}>
                          <h3 className="text-xl font-semibold text-indigo-900 hover:text-indigo-600 transition-colors">
                            {job.title}
                          </h3>
                        </Link>
                        <p className="text-gray-600 font-medium mt-1">{job.company}</p>
                        
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded hover:bg-indigo-50 text-indigo-600 font-medium border border-gray-200"
                          >
                            📍 {job.location}
                          </a>
                          <span className="bg-gray-50 px-2 py-1 rounded">💰 {job.salary || "Consultar"}</span>
                          <span className="bg-gray-50 px-2 py-1 rounded">📅 {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <Link 
                        href={`/job/${job.id}`}
                        className="px-5 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors text-center shrink-0"
                      >
                        Ver oferta
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Controles de Paginación */}
              <div className="flex justify-between items-center pt-6">
                {validPage > 1 ? (
                  <Link
                    href={`/?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&page=${validPage - 1}`}
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
                    href={`/?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&page=${validPage + 1}`}
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
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-lg text-gray-800 font-medium">No se encontraron ofertas.</p>
              <p className="text-gray-500 mt-2">Intenta buscar palabras que veas en el título (ej: "Junior", "Java", "Python").</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
