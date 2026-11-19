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
  const data = await queryPseoMatrix(rol, 'salary_guide');
  if (!data) return { title: 'Página no encontrada' };

  const year = new Date().getFullYear();
  const avgTxt = data.avgSalary ? `${data.avgSalary.toLocaleString('es-ES')}€/año` : '42.000€/año';
  const title = `¿Cuánto gana un ${data.role.roleTitle} en España? [${year}]: Media ${avgTxt}`;
  const description = `Guía salarial ${year} para ${data.role.roleTitle} en España. Sueldo medio real: ${avgTxt}${data.p25 && data.p75 ? ` (Junior P25: ${data.p25.toLocaleString('es-ES')}€ · Senior P75: ${data.p75.toLocaleString('es-ES')}€)` : ''}. ${data.totalCount} vacantes activas.`;
  const canonicalUrl = `${BASE_URL}/cuanto-gana-un-${data.slug}-en-espana`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: data.isIndexable, follow: true },
    openGraph: { title, description, url: canonicalUrl, type: 'article' },
  };
}

export default async function CuantoGanaRolPage({ params }: Props) {
  const { rol } = await params;
  const data = await queryPseoMatrix(rol, 'salary_guide');
  if (!data) notFound();

  const avg = data.avgSalary || 42000;
  const junior = data.p25 || Math.round(avg * 0.68);
  const mid = data.insights?.salaryMedian || avg;
  const senior = data.p75 || Math.round(avg * 1.32);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Salarios IT', href: '/salarios' },
    { label: `¿Cuánto gana un ${data.role.roleTitle}?`, href: `/cuanto-gana-un-${data.slug}-en-espana` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Cuánto gana un ${data.role.roleTitle} en España en ${new Date().getFullYear()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El sueldo bruto anual medio de un ${data.role.roleTitle} en España es de ${avg.toLocaleString('es-ES')}€. Los perfiles Junior (P25) parten alrededor de ${junior.toLocaleString('es-ES')}€, mientras que los perfiles Senior (P75) superan los ${senior.toLocaleString('es-ES')}€.`,
        },
      },
      {
        '@type': 'Question',
        name: `¿Cuál es el salario neto mensual aproximado de un ${data.role.roleTitle}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Con un salario bruto medio de ${avg.toLocaleString('es-ES')}€ anuales en 12 pagas, la retribución neta mensual estimada ronda los ${Math.round((avg * 0.75) / 12).toLocaleString('es-ES')}€/mes (sujeto a situación personal y comunidad autónoma).`,
        },
      },
    ],
  };

  const occupationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Occupation',
    name: data.role.roleTitle,
    occupationLocation: { '@type': 'Country', name: 'Spain' },
    estimatedSalary: [
      {
        '@type': 'MonetaryAmountDistribution',
        name: 'Salario Bruto Anual',
        currency: 'EUR',
        duration: 'P1Y',
        percentile25: junior,
        median: mid,
        percentile75: senior,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(occupationJsonLd) }} />
      <div className="max-w-5xl mx-auto space-y-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Answer-First AEO Header */}
        <header className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-3">
            Guía Salarial España {new Date().getFullYear()}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            ¿Cuánto gana un {data.role.roleTitle} en España?
          </h1>
          <p className="mt-4 text-lg text-slate-700 leading-relaxed">
            Un <strong>{data.role.roleTitle}</strong> en España cobra de media{' '}
            <strong className="text-indigo-700">{avg.toLocaleString('es-ES')}€ brutos al año</strong>{' '}
            (unos <strong>{Math.round(avg / 12).toLocaleString('es-ES')}€ brutos/mes</strong> en 12 pagas), según el análisis de{' '}
            <strong>{data.totalCount} ofertas activas</strong> en el mercado español.
          </p>
        </header>

        {/* Tabla AEO por experiencia */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Desglose salarial por nivel de experiencia ({data.role.label})
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 pr-4">Nivel</th>
                <th className="py-3 px-4">Bruto Anual</th>
                <th className="py-3 pl-4">Bruto Mensual (12 pagas)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="py-3 pr-4 font-semibold">Junior (0-2 años · P25)</td>
                <td className="py-3 px-4 font-bold text-sky-700">{junior.toLocaleString('es-ES')}€</td>
                <td className="py-3 pl-4">{Math.round(junior / 12).toLocaleString('es-ES')}€/mes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold">Mid-Level (2-5 años · Mediana)</td>
                <td className="py-3 px-4 font-bold text-indigo-700">{mid.toLocaleString('es-ES')}€</td>
                <td className="py-3 pl-4">{Math.round(mid / 12).toLocaleString('es-ES')}€/mes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold">Senior / Lead (+5 años · P75)</td>
                <td className="py-3 px-4 font-bold text-emerald-700">{senior.toLocaleString('es-ES')}€</td>
                <td className="py-3 pl-4">{Math.round(senior / 12).toLocaleString('es-ES')}€/mes</td>
              </tr>
            </tbody>
          </table>
        </section>

        <AdBanner slot="cuanto-gana-mid" />

        {data.jobs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Ofertas activas de {data.role.label} ({data.totalCount})
              </h2>
              <Link href={`/trabajos/${data.slug}`} className="text-sm font-semibold text-indigo-600 hover:underline">
                Ver todas &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {data.jobs.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
