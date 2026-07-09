import pool from '@/lib/db';
import JobCard from '@/components/JobCard';
import Search from '@/components/Search';
import LocationFilter from '@/components/LocationFilter';
import ScopeTabs from '@/components/ScopeTabs';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import PushSubscribe from '@/components/PushSubscribe';
import Link from 'next/link';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';
import { getJobSlug } from '@/lib/slug';
import Breadcrumbs from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;

  const metadata: Metadata = {
    title: `Ofertas de Empleo Informática y Tecnología en España${isPaged ? ` - Página ${page}` : ''} [2026] | Portal Trabajo IT`,
    description: `Encuentra las mejores ofertas de trabajo en informática y tecnología en España. Vacantes de programación, desarrollo de software, DevOps, Data Science, Cloud y más.${isPaged ? ` (Página ${page})` : ''}`,
    alternates: {
      canonical: `${BASE_URL}/trabajos/informatica-tecnologia`,
    },
    openGraph: {
      title: `Ofertas de Empleo IT en España — Vacantes Actualizadas${isPaged ? ` (Página ${page})` : ''}`,
      description: 'Listado actualizado de ofertas de trabajo para programadores y profesionales IT en España. Java, Python, React, DevOps y más.',
      url: `${BASE_URL}/trabajos/informatica-tecnologia`,
    },
  };

  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

async function getJobs(scopeFilter: string, locationFilter?: string, queryFilter?: string, page: number = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE is_active = TRUE";
    const params: any[] = [];
    let paramIndex = 1;

    // 1. LÓGICA DE PAÍS (ESPAÑA vs GLOBAL)
    if (scopeFilter === 'espana') {
      sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2} OR location ILIKE $${paramIndex + 3} OR location ILIKE $${paramIndex + 4} OR location ILIKE $${paramIndex + 5} OR location ILIKE $${paramIndex + 6} OR location ILIKE $${paramIndex + 7} OR location = $${paramIndex + 8})`;
      params.push('%Madrid%', '%Barcelona%', '%Valencia%', '%Sevilla%', '%Bilbao%', '%Spain%', '%España%', '%Málaga%', 'Remoto');
      paramIndex += 9;
    }

    // 2. Filtro de Ubicación (Sidebar manual)
    if (locationFilter) {
      if (locationFilter === 'Remoto') {
        sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1})`;
        params.push('%Remoto%', '%Remote%');
        paramIndex += 2;
      } else {
        sql += ` AND location ILIKE $${paramIndex}`;
        params.push(`%${locationFilter}%`);
        paramIndex++;
      }
    }

    // 3. Filtro de Texto (Buscador Superior)
    if (queryFilter) {
      sql += ` AND (title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${queryFilter}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error cargando ofertas:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;

  const locationFilter = searchParams.ubicacion as string | undefined;
  const queryFilter = searchParams.q as string | undefined;
  const scopeFilter = (searchParams.scope as string) || 'espana';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  const jobs = await getJobs(scopeFilter, locationFilter, queryFilter, validPage);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Trabajos de Informática y Tecnología' }
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? `${BASE_URL}${item.href}` : undefined
    }))
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ofertas de Empleo Informática y Tecnología',
    description: 'Listado de ofertas de trabajo activas de informática y tecnología en España',
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job: any, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/job/${getJobSlug(job)}`,
      name: `${job.title} - ${job.company}`
    }))
  };

  const faqItems = [
    {
      question: '¿Qué tipos de puestos de trabajo de informática hay en España?',
      answer: 'Hay una amplia variedad de vacantes disponibles, desde desarrolladores de software (frontend, backend, full stack) hasta roles en ciberseguridad, administración de sistemas, ciencia de datos e inteligencia artificial.'
    },
    {
      question: '¿Cuál es el salario medio en el sector informático y tecnológico?',
      answer: 'El salario varía según la experiencia y el rol, con salarios iniciales para perfiles junior desde 22.000€ brutos anuales, y superando los 50.000€ a 70.000€ brutos anuales para perfiles senior y directores técnicos.'
    },
    {
      question: '¿Hay opciones de teletrabajo en informática en España?',
      answer: 'Sí, el sector tecnológico e informático lidera las opciones de trabajo remoto en España. Muchas empresas ofrecen esquemas 100% remotos o modelos híbridos flexibles.'
    }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        
        {/* Buscador de Sector */}
        <div className="mb-6 max-w-md">
          <Search placeholder="Filtrar ofertas en este sector (ej: React)..." />
        </div>

        {/* --- PESTAÑAS DE ALCANCE --- */}
        <ScopeTabs />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* --- SIDEBAR --- */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <LocationFilter />
            </div>

            <SubscribeForm 
              location={locationFilter || (scopeFilter === 'espana' ? 'España' : 'Todo el mundo')} 
              defaultTech={queryFilter || undefined}
              defaultLocation={locationFilter || undefined}
            />
            <PushSubscribe />

            <div className="lg:sticky lg:top-24">
              {/* Banner de afiliado: herramientas para devs */}
              <AdBanner variant="sidebar" />
            </div>
          </aside>

          {/* --- RESULTADOS --- */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                <>
                  {jobs.map((job: any, index: number) => (
                    <JobCard key={job.id} job={job} prefetch={index < 5} />
                  ))}

                  {/* Controles de Paginación */}
                  <div className="flex justify-between items-center pt-6">
                    {validPage > 1 ? (
                      <Link
                        href={`/trabajos/informatica-tecnologia?scope=${scopeFilter}&ubicacion=${encodeURIComponent(locationFilter || '')}&q=${encodeURIComponent(queryFilter || '')}&page=${validPage - 1}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ← Anterior
                      </Link>
                    ) : (
                      <div />
                    )}
                    <span className="text-sm text-gray-600">Página {validPage}</span>
                    {jobs.length === 20 ? (
                      <Link
                        href={`/trabajos/informatica-tecnologia?scope=${scopeFilter}&ubicacion=${encodeURIComponent(locationFilter || '')}&q=${encodeURIComponent(queryFilter || '')}&page=${validPage + 1}`}
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
                <div className="text-center py-24 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🤷‍♂️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    No hay ofertas en {scopeFilter === 'espana' ? 'España' : 'Global'}
                  </h3>
                  <p className="mt-1 text-gray-500 max-w-sm mx-auto">
                    {scopeFilter === 'espana' 
                      ? 'Prueba a cambiar a la pestaña "Global" o busca otra tecnología.' 
                      : 'Intenta buscar algo más general.'}
                  </p>
                  <div className="mt-6">
                    {scopeFilter === 'espana' ? (
                       <Link href="?scope=global" className="text-indigo-600 font-semibold hover:underline">
                         Ver ofertas Globales &rarr;
                       </Link>
                    ) : (
                       <Link href="/trabajos/informatica-tecnologia?scope=global" className="text-indigo-600 hover:underline">
                         Limpiar búsqueda
                       </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FAQ Visual para SEO y E-E-A-T */}
        <div className="mt-12 bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>❓</span> Preguntas Frecuentes sobre Empleo de Informática y Tecnología
          </h2>
          <div className="space-y-6 divide-y divide-gray-150">
            {faqItems.map((item, idx) => (
              <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                <h3 className="text-base font-bold text-gray-850 mb-2">{item.question}</h3>
                <p className="text-sm text-gray-605 leading-relaxed m-0">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
