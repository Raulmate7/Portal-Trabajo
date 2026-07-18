import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import PushSubscribe from "@/components/PushSubscribe";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 900; // Cache 15 minutos

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getJobsOfToday() {
  const client = await pool.connect();
  try {
    // Ofertas indexadas en las últimas 24 horas
    const sql = `
      SELECT id, title, title_es, company, location, salary, salary_min, salary_max, created_at, url_source, description_snippet, category, is_featured FROM jobs 
      WHERE is_active = TRUE 
        AND created_at >= NOW() - INTERVAL 1 DAY
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const res = await client.query(sql);
    return res.rows;
  } catch (error) {
    console.error("Error loading jobs of today:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "Ofertas de Empleo IT de Hoy | Nuevas Vacantes de Programación";
  const description = "Revisa las ofertas de trabajo en tecnología y desarrollo de software publicadas en las últimas 24 horas. Mantente al día de las últimas novedades.";
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/ofertas-hoy`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/ofertas-hoy`,
    }
  };
}

export default async function JobsTodayPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const jobs = await getJobsOfToday();

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Jobs Posted Today' : 'Ofertas de Hoy' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden shadow-xl text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 uppercase tracking-widest">
            🟢 {isEnglish ? 'New Openings Today' : 'Vacantes Nuevas de Hoy'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'Tech Jobs Posted Today' : 'Ofertas de Empleo IT Publicadas Hoy'}
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Find all technology opportunities and developer roles indexated in our portal in the last 24 hours.'
              : 'Listado completo de ofertas de programación, sistemas, datos y cloud indexadas en nuestro portal en las últimas 24 horas.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed p-6">
                <span className="text-4xl">⏰</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4">
                  {isEnglish ? 'No new offers yet today' : 'No hay ofertas nuevas hoy'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isEnglish 
                    ? 'Our scrapers run every 6 hours. Check back soon for new openings!'
                    : 'Nuestros scrapers se ejecutan automáticamente cada 6 horas. Vuelve en un rato para ver nuevas ofertas.'}
                </p>
                <Link href={isEnglish ? '/?lang=en' : '/'} className="inline-block mt-6 text-sm font-semibold text-indigo-650 hover:underline">
                  {isEnglish ? 'Browse all active jobs →' : 'Buscar todas las ofertas activas →'}
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
            <SubscribeForm location="Ofertas IT de Hoy" />
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
