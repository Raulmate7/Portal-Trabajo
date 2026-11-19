import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import JobCard from '@/components/JobCard';
import AdBanner from '@/components/AdBanner';
import { BASE_URL, safeJsonLdString } from '@/lib/constants';
import { PSEO_ROLES, queryPseoMatrix } from '@/lib/pseoMatrix';

export const revalidate = 3600;

interface Props {
  params: Promise<{ rol: string }>;
}

export async function generateStaticParams() {
  return Object.keys(PSEO_ROLES).map((rol) => ({ rol }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rol } = await params;
  const data = await queryPseoMatrix(rol, 'freelance');
  if (!data) return { title: 'Página no encontrada' };

  const now = new Date();
  const mes = now.toLocaleDateString('es-ES', { month: 'long' });
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
  const year = now.getFullYear();
  const countPrefix = data.totalCount > 0 ? `${data.totalCount} ` : '';

  const title = `${countPrefix}Proyectos y Empleo Freelance ${data.role.label} [${mesCap} ${year}]`;
  const description = `Encuentra proyectos freelance y contratos B2B/Autónomo para ${data.role.roleTitle}. ${data.totalCount} oportunidades activas (${data.remotePct}% en remoto).`;
  const canonicalUrl = `${BASE_URL}/trabajo-freelance-it/${data.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: data.isIndexable, follow: true },
    openGraph: { title, description, url: canonicalUrl, type: 'website' },
  };
}

export default async function FreelanceRolePage({ params }: Props) {
  const { rol } = await params;
  const data = await queryPseoMatrix(rol, 'freelance');
  if (!data) notFound();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Trabajo Freelance IT', href: '/trabajo-freelance-it' },
    { label: `Freelance ${data.role.label}`, href: `/trabajo-freelance-it/${data.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Hay demanda de ${data.role.roleTitle} freelance en España?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Actualmente contamos con ${data.totalCount} proyectos freelance y contractor activos para ${data.role.label}, con un ${data.remotePct}% de modalidad 100% remota.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(faqSchema) }} />
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
            Freelance &amp; Contractor B2B
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Trabajo Freelance para {data.role.roleTitle}
          </h1>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            Proyectos independientes, contratos por horas/día y colaboraciones autónomas en <strong>{data.role.label}</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Proyectos activos</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.totalCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Compensación media</div>
              <div className="text-2xl font-extrabold text-indigo-700 mt-1">
                {data.avgSalary ? `${data.avgSalary.toLocaleString('es-ES')}€/año eq.` : 'Según tarifa/día'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Modalidad remota</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{data.remotePct}%</div>
            </div>
          </div>
        </header>

        <AdBanner slot="freelance-role-top" />

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Contratos Freelance de {data.role.label} abiertos
          </h2>
          {data.jobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {data.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
              No hay contratos freelance específicos publicados hoy para {data.role.label}. Puedes consultar todas las vacantes en{' '}
              <Link href={`/trabajos/${data.slug}-remoto`} className="text-indigo-600 font-semibold underline">
                {data.role.label} en remoto
              </Link>
              .
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
