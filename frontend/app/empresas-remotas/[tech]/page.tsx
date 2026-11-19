import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import JobCard from '@/components/JobCard';
import AdBanner from '@/components/AdBanner';
import { BASE_URL, safeJsonLdString } from '@/lib/constants';
import { slugify } from '@/lib/slug';
import { PSEO_ROLES, queryPseoMatrix } from '@/lib/pseoMatrix';

export const revalidate = 3600;

interface Props {
  params: Promise<{ tech: string }>;
}

export async function generateStaticParams() {
  return Object.keys(PSEO_ROLES).map((tech) => ({ tech }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tech } = await params;
  const data = await queryPseoMatrix(tech, 'remote_companies');
  if (!data) return { title: 'Página no encontrada' };

  const year = new Date().getFullYear();
  const title = `Empresas Remotas que contratan ${data.role.label} [${year}] (${data.totalCount} vacantes)`;
  const description = `Descubre las ${data.topCompanies.length} principales empresas con teletrabajo para ${data.role.label}. ${data.totalCount} vacantes remotas activas${data.avgSalary ? ` y sueldo medio de ${data.avgSalary.toLocaleString('es-ES')}€/año` : ''}.`;
  const canonicalUrl = `${BASE_URL}/empresas-remotas/${data.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: data.isIndexable, follow: true },
    openGraph: { title, description, url: canonicalUrl, type: 'website' },
  };
}

export default async function EmpresasRemotasTechPage({ params }: Props) {
  const { tech } = await params;
  const data = await queryPseoMatrix(tech, 'remote_companies');
  if (!data) notFound();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Empresas Remotas', href: '/empresas-remotas' },
    { label: data.role.label, href: `/empresas-remotas/${data.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Qué empresas contratan ${data.role.label} en remoto?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: data.topCompanies.length > 0
            ? `Entre las empresas activas con vacantes remotas de ${data.role.label} destacan ${data.topCompanies.slice(0, 5).map((c) => c.name).join(', ')}.`
            : `Contamos con ${data.totalCount} ofertas remotas activas de ${data.role.label} en España y Europa.`,
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
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-3">
            Teletrabajo 100% IT
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Empresas Remotas con Empleo de {data.role.label}
          </h1>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            Ranking en tiempo real de compañías que publican vacantes en remoto para perfiles <strong>{data.role.label}</strong>.
          </p>
        </header>

        {data.topCompanies.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Top empresas contratando en remoto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.topCompanies.map((comp) => (
                <Link
                  key={comp.name}
                  href={`/empresas/${slugify(comp.name)}`}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition bg-slate-50/60"
                >
                  <div className="font-bold text-slate-900">{comp.name}</div>
                  <div className="text-sm text-indigo-700 font-semibold mt-1">{comp.count} ofertas remotas</div>
                  {comp.avgSalary && (
                    <div className="text-xs text-slate-500 mt-1">Media: {comp.avgSalary.toLocaleString('es-ES')}€/año</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <AdBanner slot="empresas-remotas-mid" />

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Últimas vacantes remotas en {data.role.label} ({data.totalCount})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {data.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
