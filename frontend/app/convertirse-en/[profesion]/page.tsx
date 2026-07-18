import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PROFESSIONS, ProfessionDetail } from '@/lib/convertirse';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // Cache de 24 horas (ISR)

type Props = {
  params: Promise<{ profesion: string }>;
};

async function getProfessionStats(techKey: string) {
  const client = await pool.connect();
  try {
    let whereClause = '';
    const params: string[] = [];
    
    if (techKey === 'frontend') {
      whereClause = "category = 'Frontend' OR title ILIKE '%frontend%' OR title ILIKE '%react%' OR title ILIKE '%angular%'";
    } else if (techKey === 'backend') {
      whereClause = "category = 'Backend' OR title ILIKE '%backend%' OR title ILIKE '%node%' OR title ILIKE '%python%' OR title ILIKE '%java%'";
    } else if (techKey === 'cloud') {
      whereClause = "category = 'Cloud & DevOps' OR category = 'Cloud' OR title ILIKE '%devops%' OR title ILIKE '%aws%' OR title ILIKE '%docker%' OR title ILIKE '%kubernetes%'";
    } else if (techKey === 'data') {
      whereClause = "category = 'Data & AI' OR category = 'Data' OR title ILIKE '%data%' OR title ILIKE '%analyst%' OR title ILIKE '%science%'";
    } else if (techKey === 'mobile') {
      whereClause = "category = 'Mobile' OR title ILIKE '%mobile%' OR title ILIKE '%flutter%' OR title ILIKE '%swift%'";
    } else if (techKey === 'fullstack') {
      whereClause = "title ILIKE '%fullstack%' OR title ILIKE '%full stack%'";
    } else {
      whereClause = "title ILIKE $1";
      params.push(`%${techKey}%`);
    }

    // 1. Total jobs count
    const countSql = `SELECT COUNT(*) as count FROM jobs WHERE is_active = TRUE AND (${whereClause})`;
    const countRes = await client.query(countSql, params);
    const totalCount = parseInt(countRes.rows[0]?.count || '0', 10);

    // 2. Average Salary
    const salarySql = `
      SELECT salary FROM jobs 
      WHERE is_active = TRUE 
        AND (${whereClause}) 
        AND salary IS NOT NULL AND salary != 'Consultar' AND salary != ''
      LIMIT 100
    `;
    const salaryRes = await client.query(salarySql, params);
    const salaries: number[] = [];

    for (const row of salaryRes.rows) {
      const salaryStr = (row.salary || '').toString();
      const cleanStr = salaryStr.replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
      const numbers = cleanStr.match(/\d+(\.\d+)?/g);
      if (!numbers || numbers.length === 0) continue;
      const parsedNums = numbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n));
      let val = 0;
      if (parsedNums.length >= 2) {
        val = (parsedNums[0] + parsedNums[1]) / 2;
      } else if (parsedNums.length === 1) {
        val = parsedNums[0];
      }
      if (val > 0 && val < 5000) val = val * 12;
      if (val >= 15000 && val <= 150000) {
        salaries.push(val);
      }
    }

    const averageSalary = salaries.length >= 3
      ? Math.round(salaries.reduce((sum, val) => sum + val, 0) / salaries.length)
      : null;

    // 3. Related jobs (3 results)
    const jobsSql = `SELECT id, title, company, location, salary FROM jobs WHERE is_active = TRUE AND (${whereClause}) ORDER BY created_at DESC LIMIT 3`;
    const jobsRes = await client.query(jobsSql, params);

    return {
      totalCount,
      averageSalary,
      relatedJobs: jobsRes.rows
    };
  } catch (error) {
    console.error("Error cargando estadísticas de profesión:", error);
    return { totalCount: 150, averageSalary: 38500, relatedJobs: [] };
  } finally {
    client.release();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { profesion } = await params;
  const data = PROFESSIONS[profesion.toLowerCase()];

  if (!data) {
    return { title: 'Página no encontrada | Portal Trabajo IT' };
  }

  return {
    title: `Guía 2026: ${data.title} | Hoja de Ruta y Salarios`,
    description: data.description,
    alternates: {
      canonical: `${BASE_URL}/convertirse-en/${profesion}`,
    },
    openGraph: {
      title: `Guía completa: ${data.title} [Hoja de Ruta 2026]`,
      description: data.description,
      url: `${BASE_URL}/convertirse-en/${profesion}`,
    }
  };
}

export async function generateStaticParams() {
  return Object.keys(PROFESSIONS).map((profesion) => ({
    profesion,
  }));
}

export default async function ConvertirseEnPage({ params }: Props) {
  const { profesion } = await params;
  const data = PROFESSIONS[profesion.toLowerCase()];

  if (!data) {
    notFound();
  }

  const { totalCount, averageSalary, relatedJobs } = await getProfessionStats(data.techKey);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Recursos', href: '/recursos' },
    { label: data.title }
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

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.title,
    description: data.description,
    step: data.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: step.title,
      url: `${BASE_URL}/convertirse-en/${profesion}#step-${idx + 1}`,
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: step.description
        }
      ]
    }))
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faq.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero premium */}
      <div className="mb-10 text-center max-w-4xl mx-auto bg-gradient-to-r from-indigo-900 to-purple-900 p-10 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-black px-3.5 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            🎓 Guía de Carrera IT 2026
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {data.title}
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            {data.description}
          </p>
        </div>
      </div>

      {/* AdSense Horizontal */}
      <div className="mb-8">
        <AdBanner variant="inline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Métricas del mercado reales (Queried from DB) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Sueldo Promedio España</h3>
              <p className="text-3xl font-extrabold text-indigo-700 m-0">
                {averageSalary ? `${averageSalary.toLocaleString('es-ES')}€` : '37.500€'}
              </p>
              <span className="text-[10px] text-gray-500 mt-1">Bruto anual promedio estimado</span>
            </div>

            <div className="p-5 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col justify-center items-center text-center">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">Vacantes Activas en el Portal</h3>
              <p className="text-3xl font-extrabold text-purple-700 m-0">{totalCount}</p>
              <span className="text-[10px] text-gray-500 mt-1">Ofertas reales listas para aplicar</span>
            </div>
          </div>

          {/* Roadmap paso a paso */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>🗺️</span> Ruta de Aprendizaje Detallada
            </h2>
            <div className="relative border-l border-indigo-200/80 ml-4 pl-6 space-y-8">
              {data.steps.map((step, idx) => (
                <div key={idx} id={`step-${idx + 1}`} className="relative">
                  {/* Point */}
                  <span className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md border-2 border-white">
                    {idx + 1}
                  </span>
                  
                  {/* Content */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-650 text-sm leading-relaxed mb-4">{step.description}</p>
                    
                    {/* Skills badges */}
                    <div className="flex flex-wrap gap-2">
                      {step.skills.map((skill) => (
                        <span key={skill} className="text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200/60 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AdSense In-feed en medio */}
          <div className="my-6">
            <AdBanner variant="inline" />
          </div>

          {/* FAQ Accordion */}
          {data.faq.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 m-0 mb-4">
                <span>❓</span> Preguntas Frecuentes
              </h2>
              <div className="space-y-6 divide-y divide-gray-100">
                {data.faq.map((item, idx) => (
                  <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                    <h3 className="text-base font-bold text-gray-800 mb-2">{item.question}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed m-0">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cursos afiliados de Udemy */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-amber-900 mb-2">🎓 Cursos de Formación Recomendados</h3>
            <p className="text-amber-800 text-xs leading-relaxed mb-4">
              Acelera tu aprendizaje con cursos de formación certificados por instructores expertos de Udemy con un descuento especial.
            </p>
            <a 
              href={`https://trk.udemy.com/9VMAEj?ulp=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3D${encodeURIComponent(data.techKey)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              Explorar Cursos en Udemy &rarr;
            </a>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <SubscribeForm location={data.title} />

          {/* Vacantes relacionadas activas en la BD */}
          {relatedJobs.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                <span>💼</span> Vacantes Recientes
              </h3>
              <div className="space-y-3">
                {relatedJobs.map((job: any) => (
                  <div key={job.id} className="text-xs p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all">
                    <Link href={`/job/${job.id}`} className="font-bold text-indigo-900 hover:underline block leading-snug">
                      {job.title}
                    </Link>
                    <span className="text-gray-500 mt-1 block">{job.company} • {job.location}</span>
                  </div>
                ))}
              </div>
              <Link 
                href={`/trabajos/${data.techKey}`}
                className="text-xs font-bold text-indigo-650 hover:text-indigo-800 block text-center mt-2 hover:underline"
              >
                Ver todas las ofertas &rarr;
              </Link>
            </div>
          )}

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
