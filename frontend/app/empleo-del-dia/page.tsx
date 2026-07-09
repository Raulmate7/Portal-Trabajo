import { Metadata } from 'next';
import Link from 'next/link';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';
import { getJobOfTheDay } from '@/lib/jobs';
import { getJobSlug } from '@/lib/slug';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import PushSubscribe from '@/components/PushSubscribe';
import ShareButton from '@/components/ShareButton';
import CompanyLogo from '@/components/CompanyLogo';
import Breadcrumbs from '@/components/Breadcrumbs';
import ApplyButton from '@/components/ApplyButton';
import SaveJobButton from '@/components/SaveJobButton';

export const revalidate = 3600; // Actualizar cada hora

export async function generateMetadata(): Promise<Metadata> {
  const job = await getJobOfTheDay();
  const title = job
    ? `${job.title_es || job.title} en ${job.company} — Oferta del Día | Portal Trabajo IT`
    : 'Oferta de Empleo IT del Día | Portal Trabajo IT';
  const description = job
    ? `La mejor oferta de empleo tech de hoy: ${job.title_es || job.title} en ${job.company} (${job.location}). Descúbrela en Portal Trabajo IT.`
    : 'Descubre la mejor oferta de empleo IT del día en nuestro portal de trabajo para programadores en España.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/empleo-del-dia`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/empleo-del-dia`,
      siteName: 'Portal Trabajo IT',
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Oferta de empleo IT del día en Portal Trabajo IT',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og-image.png`],
    },
  };
}

async function getRecentJobs(excludeId: number | string, limit = 6) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, title, title_es, company, location, category, salary, created_at
       FROM jobs
       WHERE is_active = TRUE AND id != $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [excludeId, limit]
    );
    return res.rows;
  } catch {
    return [];
  } finally {
    client.release();
  }
}

export default async function EmpleoDelDiaPage() {
  const job = await getJobOfTheDay();

  const jsonLd = job
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title_es || job.title,
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company,
        },
        jobLocation: {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'ES' },
        },
        datePosted: job.created_at,
        description: job.description_snippet || `Oferta de empleo para ${job.title_es || job.title} en ${job.company}.`,
        url: `${BASE_URL}/empleo-del-dia`,
      }
    : null;

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Oferta del Día' },
  ];

  if (!job) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center py-20">
          <span className="text-6xl block mb-4">🔥</span>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Cargando la Oferta del Día…</h1>
          <p className="text-gray-500 mb-6">Vuelve en unos minutos. Actualizamos la selección cada hora.</p>
          <Link href="/trabajos/informatica-tecnologia" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Ver todas las ofertas
          </Link>
        </div>
      </main>
    );
  }

  const jobSlug = getJobSlug(job);
  const detailUrl = `/job/${jobSlug}`;
  const displayTitle = job.title_es || job.title;
  const recentJobs = await getRecentJobs(job.id, 6);
  const jobUrl = `${BASE_URL}/empleo-del-dia`;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Card — Oferta del Día */}
        <div className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 rounded-3xl overflow-hidden shadow-2xl mb-8 p-8 md:p-12">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full filter blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6 shadow-md">
              🔥 Oferta del Día
            </span>

            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Logo */}
              <div className="shrink-0 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm overflow-hidden">
                <CompanyLogo company={job.company} size={12} />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
                  {displayTitle}
                </h1>
                <div className="flex flex-wrap gap-3 text-indigo-200 text-sm mb-4">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    🏢 {job.company}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    📍 {job.location}
                  </span>
                  {job.category && (
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                      💼 {job.category}
                    </span>
                  )}
                  {job.salary && job.salary !== 'Consultar' && (
                    <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full font-bold backdrop-blur-sm">
                      💰 {job.salary}
                    </span>
                  )}
                </div>

                {job.description_snippet && (
                  <p className="text-indigo-200 text-sm leading-relaxed line-clamp-3 mb-6 max-w-2xl">
                    {job.description_snippet}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 items-center">
                  <ApplyButton url={job.url_source} company={job.company} title={displayTitle} lang="es" />
                  <Link
                    href={detailUrl}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-xl transition-all backdrop-blur-sm"
                  >
                    Ver Detalles
                  </Link>
                  <SaveJobButton job={job} variant="detail" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ← Ad banner debajo del hero */}
        <div className="mb-8">
          <AdBanner variant="inline" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">

            {/* Compartir en RRSS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                📢 Comparte esta oferta
              </h2>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                ¿Conoces a alguien que encaje perfectamente en este puesto? Comparte la oferta del día en tus redes y ayúdale a encontrar su próximo empleo tech.
              </p>
              <div className="flex flex-wrap gap-3">
                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0077b5] hover:bg-[#006097] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 Oferta del Día: ${displayTitle} en ${job.company} (${job.location}) — ${jobUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter / X
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🔥 Oferta del Día IT: ${displayTitle} en ${job.company} — ${jobUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#25d366] hover:bg-[#1da851] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>

                <ShareButton url={jobUrl} title={`🔥 ${displayTitle} en ${job.company}`} />
              </div>
            </div>

            {/* Por qué es la Oferta del Día */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                ⭐ ¿Por qué es la Oferta del Día?
              </h2>
              <ul className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 text-base mt-0.5">✔</span>
                  <span>Ha sido destacada entre <strong>miles de ofertas activas</strong> en base a su relevancia y atractivo salarial.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 text-base mt-0.5">✔</span>
                  <span>Empresa con <strong>alta reputación</strong> en el mercado tecnológico español.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 text-base mt-0.5">✔</span>
                  <span>Posición <strong>activa y en abierto</strong> – publicada recientemente y con alta demanda.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 text-base mt-0.5">✔</span>
                  <span>Ideal para perfiles tech que buscan <strong>crecer profesionalmente</strong> en el sector IT.</span>
                </li>
              </ul>
              <div className="mt-6 pt-5 border-t border-gray-100">
                <Link
                  href={detailUrl}
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-colors"
                >
                  Ver descripción completa y postularme →
                </Link>
              </div>
            </div>

            {/* Ad multiplex */}
            <AdBanner variant="multiplex" />

            {/* Más Ofertas Recientes */}
            {recentJobs.length > 0 && (
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">
                  💼 Otras ofertas recientes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentJobs.map((rj: any) => {
                    const rjSlug = getJobSlug(rj);
                    const rjTitle = rj.title_es || rj.title;
                    return (
                      <Link
                        key={rj.id}
                        href={`/job/${rjSlug}`}
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <CompanyLogo company={rj.company} size={8} />
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm line-clamp-2 leading-tight">
                              {rjTitle}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{rj.company} · {rj.location}</p>
                            {rj.salary && rj.salary !== 'Consultar' && (
                              <span className="inline-block mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                💰 {rj.salary}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-5 text-center">
                  <Link href="/trabajos/informatica-tecnologia" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md text-sm">
                    Ver todas las ofertas IT →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SubscribeForm location={job.location || 'España'} />
            <PushSubscribe />

            {/* Vuelve mañana */}
            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-200/40 rounded-2xl p-5 text-center">
              <span className="text-3xl block mb-3">📅</span>
              <h3 className="font-extrabold text-gray-900 text-sm mb-2">¡Vuelve mañana!</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                Cada día seleccionamos la mejor oferta tech activa. Activa las notificaciones push para no perdértelas.
              </p>
              <Link href="/" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                Ver más ofertas hoy →
              </Link>
            </div>

            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
