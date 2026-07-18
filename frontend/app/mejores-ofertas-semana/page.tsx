import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import PushSubscribe from "@/components/PushSubscribe";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 1800; // Cache 30 minutos

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getBestJobsOfTheWeek() {
  const client = await pool.connect();
  try {
    // Ofertas destacadas o de salarios altos (>= 45k) en los últimos 7 días
    const sql = `
      SELECT id, title, title_es, company, location, salary, salary_min, salary_max, created_at, url_source, description_snippet, category, is_featured FROM jobs 
      WHERE is_active = TRUE 
        AND created_at >= NOW() - INTERVAL 7 DAY
        AND (is_featured = TRUE OR salary_min >= 45000 OR (salary_max >= 50000 AND salary_min >= 35000))
      ORDER BY is_featured DESC, salary_min DESC, created_at DESC
      LIMIT 40
    `;
    const res = await client.query(sql);
    return res.rows;
  } catch (error) {
    console.error("Error loading best jobs of the week:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "Las Mejores Ofertas de Empleo IT de la Semana | Portal Trabajo IT";
  const description = "Recopilación exclusiva de las mejores ofertas de trabajo para desarrolladores, DevOps, Data y Cloud en España. Puestos destacados y salarios premium.";
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/mejores-ofertas-semana`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/mejores-ofertas-semana`,
    }
  };
}

export default async function BestJobsWeekPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const jobs = await getBestJobsOfTheWeek();

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Best Jobs of the Week' : 'Mejores Ofertas de la Semana' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden shadow-xl text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4 uppercase tracking-widest animate-pulse">
            ⭐ Selección Premium IT
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'Best Tech Jobs of the Week' : 'Mejores Ofertas de Empleo IT de la Semana'}
          </h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Hand-picked featured vacancies or high-paying roles published during the last 7 days.'
              : 'Selección de vacantes destacadas, patrocinadas o con bandas salariales superiores a 45.000€ publicadas en los últimos 7 días.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed p-6">
                <span className="text-4xl">💎</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4">
                  {isEnglish ? 'No premium offers right now' : 'Sin ofertas destacadas esta semana'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isEnglish 
                    ? 'Check back later or browse all active listings.'
                    : 'Las ofertas destacadas se actualizan a lo largo del día. Revisa el buscador general.'}
                </p>
                <Link href={isEnglish ? '/?lang=en' : '/'} className="inline-block mt-6 text-sm font-semibold text-indigo-600 hover:underline">
                  {isEnglish ? 'Go to Job Search →' : 'Ir al buscador general →'}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.flatMap((job: any, index: number) => {
                  const card = <JobCard key={job.id} job={job} lang={lang} />;
                  if (index === 6) {
                    return [
                      <div key={`ad-inline-${job.id}`} className="col-span-full my-2">
                        <AdBanner variant="inline" />
                      </div>,
                      card
                    ];
                  }
                  return [card];
                })}
              </div>
            )}
            
            <div className="mt-8">
              <AdBanner variant="multiplex" />
            </div>
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <SubscribeForm location="Mejores Ofertas IT" />
            <PushSubscribe />
            <div className="sticky top-24">
              <AdBanner variant="sidebar" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
