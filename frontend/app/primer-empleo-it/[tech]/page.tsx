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
  params: Promise<{ tech: string }>;
}

export async function generateStaticParams() {
  return Object.keys(PSEO_ROLES).map((tech) => ({ tech }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tech } = await params;
  const data = await queryPseoMatrix(tech, 'junior');
  if (!data) return { title: 'Página no encontrada' };

  const now = new Date();
  const mes = now.toLocaleDateString('es-ES', { month: 'long' });
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
  const year = now.getFullYear();
  const salPart = data.avgSalary ? ` · Media: ${data.avgSalary.toLocaleString('es-ES')}€` : '';
  const countPrefix = data.totalCount > 0 ? `${data.totalCount} ` : '';

  const title = `${countPrefix}Ofertas Primer Empleo IT ${data.role.label} [${mesCap} ${year}${salPart}]`;
  const description = `Encuentra ${data.totalCount} vacantes Junior, Trainee y sin experiencia en ${data.role.label} en España. ${data.remotePct}% en remoto${data.avgSalary ? `, sueldo medio estimado de ${data.avgSalary.toLocaleString('es-ES')}€/año` : ''}.`;
  const canonicalUrl = `${BASE_URL}/primer-empleo-it/${data.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: data.isIndexable, follow: true },
    openGraph: { title, description, url: canonicalUrl, type: 'website' },
  };
}

export default async function PrimerEmpleoTechPage({ params }: Props) {
  const { tech } = await params;
  const data = await queryPseoMatrix(tech, 'junior');
  if (!data) notFound();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Empleos IT', href: `/trabajos/${data.slug}` },
    { label: `Primer Empleo ${data.role.label}`, href: `/primer-empleo-it/${data.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Cuántas ofertas Junior o de primer empleo en ${data.role.label} hay activas?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Actualmente hay ${data.totalCount} vacantes activas orientadas a perfiles Junior, Trainee o primer empleo en ${data.role.label} en España, con un ${data.remotePct}% de posiciones en modalidad remota.`,
        },
      },
      {
        '@type': 'Question',
        name: `¿Cuál es el salario inicial de un ${data.role.roleTitle} Junior en España?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: data.avgSalary
            ? `El salario medio detectado en ofertas Junior de ${data.role.label} se sitúa alrededor de ${data.avgSalary.toLocaleString('es-ES')}€ brutos anuales${data.p25 ? ` (banda de entrada desde ${data.p25.toLocaleString('es-ES')}€)` : ''}.`
            : `Las bandas iniciales para perfiles Junior de ${data.role.label} en España suelen arrancar entre 20.000€ y 28.000€ brutos anuales según ciudad y empresa.`,
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
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-3">
            Primer Empleo IT &amp; Junior
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Primer Empleo en {data.role.label} en España
          </h1>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            Vacantes activas para perfiles Junior, Trainee, prácticas y sin experiencia en <strong>{data.role.label}</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Ofertas Junior activas</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.totalCount}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Salario medio Junior</div>
              <div className="text-2xl font-extrabold text-indigo-700 mt-1">
                {data.avgSalary ? `${data.avgSalary.toLocaleString('es-ES')}€/año` : '22.000€ - 28.000€'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase">Teletrabajo</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{data.remotePct}%</div>
            </div>
          </div>
        </header>

        <AdBanner slot="primer-empleo-top" />

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Vacantes Junior de {data.role.label} disponibles ahora
          </h2>
          {data.jobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {data.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
              No hay vacantes etiquetadas explícitamente como Junior hoy. Explora todas las ofertas de{' '}
              <Link href={`/trabajos/${data.slug}`} className="text-indigo-600 font-semibold underline">
                {data.role.label} en España
              </Link>
              .
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Recursos relacionados para {data.role.label}</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/trabajos/${data.slug}`} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800">
              Todas las ofertas {data.role.label}
            </Link>
            <Link href={`/salarios/${data.slug}`} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800">
              Salarios {data.role.label}
            </Link>
            <Link href={`/cuanto-gana-un-${data.slug}-en-espana`} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800">
              Guía salarial {data.role.roleTitle}
            </Link>
            <Link href={`/empresas-remotas/${data.slug}`} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800">
              Empresas remotas {data.role.label}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
