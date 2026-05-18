import Link from "next/link";
import pool from "@/lib/db";
import SearchFilters from "./components/SearchFilters";
import FeaturedJobCard from "@/components/FeaturedJobCard";
import AdBanner from "@/components/AdBanner";
import { Suspense } from "react";

// Forzar renderizado dinámico para que siempre lea datos frescos de la BD
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getJobs(query: string, location: string) {
  try {
    const client = await pool.connect();

    let sql = "SELECT * FROM jobs WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (query && query.trim()) {
      // Buscamos en title, company y description_snippet (insensible a mayúsculas)
      sql += ` AND (title ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${query.trim()}%`);
      paramIndex++;
    }

    if (location && location.trim()) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location.trim()}%`);
      paramIndex++;
    }

    sql += " ORDER BY created_at DESC LIMIT 50";

    const result = await client.query(sql, params);
    client.release();
    return result.rows;
  } catch (error) {
    console.error("Error BD:", error);
    return [];
  }
}

export default async function Home({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const loc = typeof resolvedParams.location === 'string' ? resolvedParams.location : '';

  const jobs = await getJobs(q, loc);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Portal Empleo IT</h1>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://t.me/PortalDeTrabajo" target="_blank" className="bg-white text-indigo-900 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors">
              ✈️ Ver en Telegram
            </a>
            <Link href="/talento-premium" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-full hover:from-amber-300 hover:to-yellow-400 transition-all">
              ⭐ Talento Premium
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 -mt-6">
        <Suspense fallback={<div className="h-24 bg-white rounded-xl shadow animate-pulse"></div>}>
          <SearchFilters />
        </Suspense>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {jobs.length === 0 ? "Sin resultados" : `Resultados: ${jobs.length}`}
            </h2>
          </div>

          {/* Ofertas Patrocinadas (Featured) — las primeras 2 ofertas se muestran como destacadas */}
          {jobs.length > 0 && (
            <div className="space-y-5 mb-6">
              {jobs.slice(0, 2).map((job) => (
                <FeaturedJobCard key={`featured-${job.id}`} job={job} />
              ))}
            </div>
          )}

          {jobs.length > 0 ? (
            jobs.slice(2).map((job, index) => (
              <div key={job.id}>
                {/* Banner de afiliado entre las ofertas (después de la 5ª oferta) */}
                {index === 4 && (
                  <div className="mb-4">
                    <AdBanner variant="inline" />
                  </div>
                )}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="w-full">
                      <Link href={`/job/${job.id}`}>
                        <h2 className="text-xl font-semibold text-indigo-900 hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h2>
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
            ))
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
