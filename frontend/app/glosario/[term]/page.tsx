import { GLOSSARY_TERMS } from '@/lib/glosario';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';
import AuthorBox from '@/components/AuthorBox';
import pool from '@/lib/db';
import JobCard from '@/components/JobCard';

export const revalidate = 3600; // Cache por 1 hora

type Props = {
  params: Promise<{ term: string }>;
};

async function getGlossaryTechData(tech: string) {
  const client = await pool.connect();
  try {
    // 1. Obtener salario medio
    const salaryRes = await client.query(`
      SELECT AVG((salary_min + salary_max) / 2) as avg_sal
      FROM jobs
      WHERE is_active = TRUE
        AND (title ILIKE $1 OR category ILIKE $1)
        AND salary_min IS NOT NULL
        AND salary_max IS NOT NULL
        AND salary_min >= 12000
        AND salary_max <= 150000
    `, [`%${tech}%`]);
    
    // 2. Obtener 5 trabajos más recientes
    const jobsRes = await client.query(`
      SELECT * FROM jobs
      WHERE is_active = TRUE
        AND (title ILIKE $1 OR category ILIKE $1)
      ORDER BY created_at DESC
      LIMIT 5
    `, [`%${tech}%`]);

    return {
      averageSalary: salaryRes.rows[0]?.avg_sal ? Math.round(parseFloat(salaryRes.rows[0].avg_sal)) : null,
      jobs: jobsRes.rows
    };
  } catch (error) {
    console.error(`Error fetching glossary tech data for ${tech}:`, error);
    return { averageSalary: null, jobs: [] };
  } finally {
    client.release();
  }
}

export async function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({
    term: t.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term } = await params;
  const item = GLOSSARY_TERMS.find((t) => t.slug === term);

  if (!item) {
    return { title: 'Término no encontrado | Portal Trabajo IT' };
  }

  return {
    title: `¿Qué es ${item.term}? | Glosario Tecnológico IT`,
    description: `${item.definition.slice(0, 150)}... Descubre qué significa este término y su relevancia en el mercado laboral informático.`,
    alternates: {
      canonical: `${BASE_URL}/glosario/${term}`,
      languages: {
        'es-ES': `${BASE_URL}/glosario/${term}`,
        'en': `${BASE_URL}/glosario/${term}?lang=en`,
        'x-default': `${BASE_URL}/glosario/${term}`,
      }
    },
    openGraph: {
      title: `¿Qué es ${item.term}? | Diccionario para Programadores`,
      description: item.definition,
      url: `${BASE_URL}/glosario/${term}`,
    }
  };
}

export default async function GlossaryDetailPage({ params }: Props) {
  const { term } = await params;
  const item = GLOSSARY_TERMS.find((t) => t.slug === term);

  if (!item) {
    notFound();
  }

  const techData = item.linkedJobsSlug 
    ? await getGlossaryTechData(item.linkedJobsSlug)
    : { averageSalary: null, jobs: [] };

  // Schema DefinedTerm
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': item.term,
    'description': item.definition,
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': 'Glosario Tecnológico IT',
      'url': `${BASE_URL}/glosario`
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }} 
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Link href="/glosario" className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-indigo-100 text-xs font-bold uppercase tracking-wider mb-6 bg-indigo-500/10 border border-indigo-400/20 px-3.5 py-1.5 rounded-full">
            ← Volver al Glosario
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {item.term}
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto">
            Definición técnica y relevancia del concepto en el empleo de tecnología en España.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-200/90 mt-6 border-t border-indigo-500/20 pt-4 max-w-xs mx-auto">
            <span>📅 Actualizado: Hoy</span>
            <span className="text-indigo-500/30">•</span>
            <span>👤 Supervisor: <Link href="/sobre-nosotros" className="font-semibold text-white hover:text-indigo-200 hover:underline">Raúl M.</Link></span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Glosario', href: '/glosario' },
          { label: item.term }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Ad unit */}
          <AdBanner variant="inline" />

          {/* Definición */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span>📖</span> Definición
            </h2>
            <p className="text-gray-750 leading-relaxed text-sm md:text-base font-medium">
              {item.definition}
            </p>
          </div>

          {/* Relevancia en el mercado laboral */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span>💼</span> Relevancia en el Mercado Laboral IT
            </h2>
            <p className="text-gray-650 leading-relaxed text-sm">
              {item.relevance}
            </p>
          </div>

          <AuthorBox 
            author="Equipo Portal Empleo" 
            date="2026-07-01" 
            slug={term} 
          />

          {/* Ofertas Relacionadas Dinámicas */}
          {techData.jobs.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>💼</span> Últimas Ofertas de Empleo de {item.term.split(' (')[0]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {techData.jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              <div className="text-center pt-2">
                <Link 
                  href={`/trabajos/${item.linkedJobsSlug}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-indigo-650 hover:text-indigo-850 hover:underline"
                >
                  Ver todas las ofertas de {item.term.split(' (')[0]} →
                </Link>
              </div>
            </div>
          )}

          {/* Ad unit inferior */}
          <AdBanner variant="inline" />

        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Widget de Salario Medio Dinámico */}
          {techData.averageSalary && (
            <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center text-center shadow-sm">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider m-0 mb-1">
                Salario Medio Estimado
              </h3>
              <p className="text-3xl font-extrabold text-indigo-700 m-0">
                {techData.averageSalary.toLocaleString('es-ES')}€
              </p>
              <span className="text-[10px] text-gray-500 mt-1">
                Brutos anuales en España
              </span>
              <span className="text-[9px] text-gray-400 mt-2">
                Calculado en base a vacantes reales de la categoría
              </span>
              {item.linkedSalariesSlug && (
                <Link
                  href={`/salarios/${item.linkedSalariesSlug}`}
                  className="text-[11px] font-extrabold text-indigo-650 hover:text-indigo-800 hover:underline mt-3"
                >
                  Ver informe completo →
                </Link>
              )}
            </div>
          )}

          {/* Enlaces rápidos a listados relacionados */}
          {(item.linkedJobsSlug || item.linkedSalariesSlug) && (
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
                <span>🔗</span> Recursos Relacionados
              </h3>
              <p className="text-xs text-gray-500">Consulta salarios y vacantes de empleo asociadas a este concepto técnico.</p>
              
              <div className="space-y-2.5">
                {item.linkedJobsSlug && (
                  <Link 
                    href={`/trabajos/${item.linkedJobsSlug}`}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center block text-sm transition-colors shadow-sm"
                  >
                    Ver ofertas de empleo
                  </Link>
                )}
                {item.linkedSalariesSlug && (
                  <Link 
                    href={`/salarios/${item.linkedSalariesSlug}`}
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-center block text-sm transition-colors border border-indigo-100/50"
                  >
                    Ver salario medio
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Sidebar Sticky Ad */}
          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>

        </div>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
