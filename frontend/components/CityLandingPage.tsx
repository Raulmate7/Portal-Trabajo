import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import PushSubscribe from "@/components/PushSubscribe";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600; // Cache de 1 hora

interface Props {
  citySlug: string;
  cityName: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

// 1. Obtener ofertas locales con paginación
async function getCityJobs(city: string, page: number = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
        AND location ILIKE $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await client.query(sql, [`%${city}%`, limit, offset]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching jobs for ${city}:`, error);
    return [];
  } finally {
    client.release();
  }
}

// 2. Obtener estadísticas locales
async function getCityStats(city: string) {
  const client = await pool.connect();
  try {
    const totalRes = await client.query(`
      SELECT COUNT(*) as count
      FROM jobs 
      WHERE is_active = TRUE 
        AND location ILIKE $1
    `, [`%${city}%`]);
    
    // Calcular salario medio en la ciudad
    const salaryRes = await client.query(`
      SELECT AVG((salary_min + salary_max) / 2) as avg_sal
      FROM jobs
      WHERE is_active = TRUE
        AND location ILIKE $1
        AND salary_min IS NOT NULL
        AND salary_max IS NOT NULL
        AND salary_min >= 12000
        AND salary_max <= 150000
    `, [`%${city}%`]);
    
    const count = parseInt(totalRes.rows[0]?.count || '0', 10);
    const avgSalary = salaryRes.rows[0]?.avg_sal ? Math.round(parseFloat(salaryRes.rows[0].avg_sal)) : null;

    return {
      total: count,
      avgSalary: avgSalary
    };
  } catch (error) {
    console.error(`Error fetching stats for ${city}:`, error);
    return { total: 0, avgSalary: null };
  } finally {
    client.release();
  }
}

// 3. Editorial dinámico por ciudad
function getCityEditorial(cityName: string, totalCount: number, averageSalary: number | null, isEnglish: boolean) {
  if (isEnglish) {
    const salaryText = averageSalary 
      ? `The estimated average tech salary in ${cityName} is ${averageSalary.toLocaleString('es-ES')}€ gross per year, showing a highly competitive job market.`
      : `Tech salaries in ${cityName} vary widely depending on experience, seniority, and specific roles.`;
      
    return (
      <div className="text-gray-700 leading-relaxed text-sm md:text-base space-y-4">
        <p>
          Are you looking for job opportunities in the technology sector in <strong className="text-indigo-900">{cityName}</strong>? You have come to the right place. {cityName} is one of the main tech hubs in southern Europe, hosting thousands of startups, multinational corporate offices, and software development agencies.
        </p>
        <p>
          Currently, our portal lists <strong className="text-indigo-900">{totalCount} active job offers</strong> in this region. {salaryText} The local tech ecosystem stands out for its high demand in roles like Software Engineers (React, Node, Java, Python), DevOps Specialists, Cloud Architects, and Data Scientists.
        </p>
        <p>
          Whether you are looking for an on-site position in a modern tech office, a hybrid schedule with flexible hours, or a local team, we update our job board every 6 hours to bring you the latest hiring options. Explore the listings below and apply today to boost your career.
        </p>
      </div>
    );
  }

  const salaryText = averageSalary 
    ? `El salario medio tecnológico estimado en ${cityName} se sitúa en los ${averageSalary.toLocaleString('es-ES')}€ brutos anuales, reflejando un mercado laboral dinámico y competitivo.`
    : `Las bandas salariales en la provincia de ${cityName} varían de forma importante según los niveles de experiencia, perfiles y las tecnologías solicitadas.`;

  return (
    <div className="text-gray-700 leading-relaxed text-sm md:text-base space-y-4">
      <p>
        ¿Estás buscando dar el siguiente salto en tu carrera tecnológica en la zona de <strong className="text-indigo-900">{cityName}</strong>? Has llegado al portal idóneo. {cityName} se consolida año tras año como uno de los motores de empleo e innovación del sector tecnológico nacional, concentrando un gran tejido de startups innovadoras y sedes de grandes multinacionales.
      </p>
      <p>
        Actualmente recopilamos un total de <strong className="text-indigo-900">{totalCount} ofertas de empleo activas</strong> en la región. {salaryText} El ecosistema local destaca por una alta demanda en especialidades como Ingeniería de Software (React, Node, Java, Python), perfiles DevOps/Cloud, administradores de sistemas y analistas de datos.
      </p>
      <p>
        Tanto si buscas un puesto 100% presencial en oficinas modernas en el centro de la ciudad, un modelo híbrido flexible con teletrabajo o un proyecto estable a largo plazo, actualizamos nuestros listados cada 6 horas para que no te pierdas nada. Te invitamos a explorar las vacantes disponibles abajo y postularte hoy mismo.
      </p>
    </div>
  );
}

export default async function CityLandingPage({ citySlug, cityName, searchParams }: Props) {
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const lang = searchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const [jobs, stats] = await Promise.all([
    getCityJobs(cityName, validPage),
    getCityStats(cityName),
  ]);

  const queryParam = isEnglish ? '?lang=en' : '';
  const isPaged = validPage > 1;
  const hasNextPage = jobs.length === 20; // 20 por página
  const prevUrl = isPaged ? `${BASE_URL}/trabajo-${citySlug}${validPage > 2 ? `?page=${validPage - 1}` : ''}${isEnglish ? (validPage > 2 ? '&lang=en' : '?lang=en') : ''}` : null;
  const nextUrl = hasNextPage ? `${BASE_URL}/trabajo-${citySlug}?page=${validPage + 1}${isEnglish ? '&lang=en' : ''}` : null;

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Jobs' : 'Trabajos', href: `/trabajos/informatica-tecnologia${queryParam}` },
    { label: isEnglish ? `Jobs in ${cityName}` : `Empleo en ${cityName}` }
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

  const faqItems = [
    {
      question: isEnglish 
        ? `Are there active job offers in ${cityName} currently?` 
        : `¿Hay ofertas de empleo en ${cityName} actualmente?`,
      answer: isEnglish 
        ? `Yes, currently we have ${stats.total} active job offers in ${cityName} on our portal. You can find opportunities in frontend, backend, data, and cloud.` 
        : `Sí, actualmente contamos con ${stats.total} ofertas de trabajo activas en ${cityName} y alrededores en nuestro portal. Puedes filtrar y encontrar vacantes de frontend, backend, sistemas y datos.`
    },
    stats.avgSalary ? {
      question: isEnglish 
        ? `What is the average tech salary in ${cityName}?` 
        : `¿Cuál es el salario medio tecnológico en ${cityName}?`,
      answer: isEnglish 
        ? `The estimated average salary for a tech professional in ${cityName} is approximately ${stats.avgSalary.toLocaleString('es-ES')}€ gross per year, calculated based on active offers that specify a salary range.` 
        : `El salario medio estimado para un profesional tecnológico en la zona de ${cityName} es de aproximadamente ${stats.avgSalary.toLocaleString('es-ES')}€ brutos anuales, obtenido de las ofertas que publican sueldo.`
    } : null,
    {
      question: isEnglish 
        ? `Which tech profiles are most demanded in ${cityName}?` 
        : `¿Qué perfiles tecnológicos son los más buscados en ${cityName}?`,
      answer: isEnglish 
        ? `The most sought-after profiles include software developers (React, TypeScript, Java), DevOps engineers, system administrators, and QA specialists.` 
        : `Entre los perfiles más demandados en ${cityName} se encuentran desarrolladores de software (React, TypeScript, Java), ingenieros cloud, DevOps, y perfiles de análisis de datos.`
    }
  ].filter(Boolean) as { question: string; answer: string }[];

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
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      {/* Hero Section Premium */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 z-0" />
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/25 via-transparent to-transparent z-0" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            📍 {isEnglish ? `Jobs in ${cityName}` : `Empleo en ${cityName}`}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            {isEnglish ? `Tech and Programming Jobs in ` : `Trabajo de Informática y Desarrollo en `}
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">{cityName}</span>
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed mb-8">
            {isEnglish 
              ? `Find your next role in React, Python, Java, DevOps, Cloud, and Data in ${cityName}. We compile active opportunities daily.`
              : `Encuentra ofertas en programación, sistemas, datos y gestión en ${cityName}. Recopilamos oportunidades activas a diario.`
            }
          </p>

          {/* Estadísticas de la ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-white">{stats.total}</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">
                {isEnglish ? 'Active vacancies' : 'Vacantes activas'}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm">
              <p className="text-3xl font-extrabold text-white">
                {stats.avgSalary ? `${stats.avgSalary.toLocaleString('es-ES')}€` : '38.500€'}
              </p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">
                {isEnglish ? 'Estimated average salary' : 'Salario medio estimado'}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm col-span-1 sm:col-span-2 md:col-span-1">
              <p className="text-3xl font-extrabold text-white">Cada 6h</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">
                {isEnglish ? 'Update rate' : 'Frecuencia de actualización'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enlaces Rápidos a Tecnologías de esta ciudad (Interlinking SEO) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h3 className="text-2xl font-extrabold text-gray-900">
            {isEnglish ? `Search Jobs in ${cityName} by Tech` : `Buscar empleo en ${cityName} por tecnología 🔍`}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {isEnglish 
              ? `Access direct listings for the most popular technical profiles in the ${cityName} tech hub.` 
              : `Accede directamente a los listados específicos de las especialidades más demandadas en el mercado informático de ${cityName}.`
            }
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { name: 'React', slug: 'react', emoji: '⚛️' },
            { name: 'Node.js', slug: 'node', emoji: '🟢' },
            { name: 'Python', slug: 'python', emoji: '🐍' },
            { name: 'TypeScript', slug: 'typescript', emoji: '🟦' },
            { name: 'Java', slug: 'java', emoji: '☕' },
            { name: 'DevOps', slug: 'devops', emoji: 'cloud' },
            { name: 'Backend', slug: 'backend', emoji: '⚙️' },
            { name: 'Frontend', slug: 'frontend', emoji: '🎨' },
          ].map((tech) => (
            <Link
              key={tech.slug}
              href={`/trabajos/${tech.slug}-en-${citySlug}${queryParam}`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{tech.emoji}</span>
              <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {tech.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Layout Principal de Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-150">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Columna de Ofertas */}
          <div className="lg:col-span-3 space-y-6">
            
            <Breadcrumbs items={breadcrumbItems} />

            {/* Editorial por Ciudad */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm">
              <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-center gap-2">
                <span>📝</span> {isEnglish ? `The Tech Job Market in ${cityName}` : `El Mercado Laboral Tecnológico en ${cityName}`}
              </h2>
              {getCityEditorial(cityName, stats.total, stats.avgSalary, isEnglish)}
            </div>

            <h3 className="text-xl font-bold text-gray-900 pt-4 flex items-center gap-2">
              <span>💼</span> {isEnglish ? `Recent Tech Offers in ${cityName}` : `Ofertas de Empleo IT Recientes en ${cityName}`}
            </h3>
            
            {jobs && jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {jobs.flatMap((job: any, index: number) => {
                    const card = <JobCard key={job.id} job={job} lang={lang} prefetch={index < 5} />;
                    if (index === 3) {
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

                {/* Controles de Paginación */}
                <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                  {validPage > 1 ? (
                    <Link
                      href={`/trabajo-${citySlug}?page=${validPage - 1}${isEnglish ? '&lang=en' : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      {isEnglish ? '← Previous' : '← Anterior'}
                    </Link>
                  ) : (
                    <div />
                  )}
                  <span className="text-sm text-gray-500 font-medium font-sans">
                    {isEnglish ? `Page ${validPage}` : `Página ${validPage}`}
                  </span>
                  {jobs.length === 20 ? (
                    <Link
                      href={`/trabajo-${citySlug}?page=${validPage + 1}${isEnglish ? '&lang=en' : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      {isEnglish ? 'Next →' : 'Siguiente →'}
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                <span className="text-4xl">🤷‍♂️</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4">
                  {isEnglish ? 'No job offers available right now' : `No hay ofertas de empleo en ${cityName} ahora mismo`}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isEnglish ? 'Check back soon for new openings.' : 'Vuelve más tarde para ver nuevas ofertas publicadas.'}
                </p>
                <Link href={isEnglish ? '/?lang=en' : '/'} className="inline-block mt-6 text-sm font-semibold text-indigo-600 hover:underline">
                  {isEnglish ? 'Go back to main search →' : 'Volver al buscador principal &rarr;'}
                </Link>
              </div>
            )}

            {/* FAQ Visual para SEO y E-E-A-T */}
            {faqItems.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span>❓</span> {isEnglish ? `Frequently Asked Questions about ${cityName} IT Jobs` : `Preguntas Frecuentes sobre el Empleo IT en ${cityName}`}
                </h2>
                <div className="space-y-6 divide-y divide-gray-100">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                      <h3 className="text-base font-bold text-gray-850 mb-2">{item.question}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed m-0">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <SubscribeForm location={cityName} />
            <PushSubscribe />
            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
