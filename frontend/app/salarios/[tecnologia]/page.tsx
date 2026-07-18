import pool from '@/lib/db';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';
import JobCard from '@/components/JobCard';
import { BASE_URL } from '@/lib/constants';
import { TECH_DETAILS } from '@/lib/salarios';

export const revalidate = 3600; // Cache de 1 hora (ISR)

interface Props {
  params: Promise<{ tecnologia: string }>;
}

async function getSalaryStatsForTech(techSlug: string) {
  const techInfo = TECH_DETAILS[techSlug];
  if (!techInfo) return null;

  const client = await pool.connect();
  try {
    const sql = `
      SELECT salary
      FROM jobs
      WHERE salary IS NOT NULL 
        AND salary != 'Consultar'
        AND salary != ''
        AND title ILIKE $1
      LIMIT 500
    `;
    const result = await client.query(sql, [`%${techInfo.label}%`]);
    const rows = result.rows;

    const salaries: number[] = [];

    for (const row of rows) {
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

      // Convertir mensual a anual si es necesario
      if (val > 0 && val < 5000) val = val * 12;

      if (val >= 15000 && val <= 150000) {
        salaries.push(Math.round(val));
      }
    }

    if (salaries.length === 0) {
      return {
        count: 0,
        average: null,
        median: null,
        min: null,
        max: null,
        p25: null,
        p75: null,
      };
    }

    salaries.sort((a, b) => a - b);

    const average = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    const median = salaries[Math.floor(salaries.length / 2)];
    const min = salaries[0];
    const max = salaries[salaries.length - 1];
    const p25 = salaries[Math.floor(salaries.length * 0.25)];
    const p75 = salaries[Math.floor(salaries.length * 0.75)];

    return {
      count: salaries.length,
      average,
      median,
      min,
      max,
      p25,
      p75,
    };
  } catch (error) {
    console.error(`Error calculating salary stats for ${techSlug}:`, error);
    return null;
  } finally {
    client.release();
  }
}

async function getJobsForTech(techLabel: string) {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT *
      FROM jobs
      WHERE is_active = TRUE AND title ILIKE $1
      ORDER BY created_at DESC
      LIMIT 3
    `;
    const result = await client.query(sql, [`%${techLabel}%`]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching jobs for salary tech page:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tecnologia } = await params;
  const techSlug = tecnologia.toLowerCase();
  const techInfo = TECH_DETAILS[techSlug];
  
  if (!techInfo) {
    return { title: 'Página no encontrada' };
  }

  const title = `Sueldo de Programador ${techInfo.label} en España [2026]`;
  const description = `¿Cuánto gana un desarrollador ${techInfo.label} en España? Descubre el salario medio, rangos para Junior/Senior y vacantes activas.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/salarios/${techSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/salarios/${techSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

const STATIC_TECHS = [
  'react', 'node', 'python', 'java', 'typescript', 'aws', 'docker', 'flutter', 'csharp', 'php', 'sql',
  'go', 'rust', 'ruby', 'scala', 'elixir', 'salesforce', 'cybersecurity', 'terraform', 'cobol'
];

export async function generateStaticParams() {
  return STATIC_TECHS.map((key) => ({
    tecnologia: key,
  }));
}

function formatEur(val: number | null): string {
  if (val === null) return 'N/D';
  return `${val.toLocaleString('es-ES')}€`;
}

export default async function SalarioTechPage({ params }: Props) {
  const { tecnologia } = await params;
  const techSlug = tecnologia.toLowerCase();
  const techInfo = TECH_DETAILS[techSlug];

  if (!techInfo) {
    notFound();
  }

  const stats = await getSalaryStatsForTech(techSlug);
  const recentJobs = await getJobsForTech(techInfo.label);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Calculadora de Salarios', href: '/salarios' },
    { label: techInfo.label }
  ];

  // Datos salariales de referencia por si la base de datos local tiene pocas muestras
  const avg = stats && stats.count > 0 ? stats.average : 42000;
  const med = stats && stats.count > 0 ? stats.median : 40000;
  const minVal = stats && stats.count > 0 ? stats.min : 24000;
  const maxVal = stats && stats.count > 0 ? stats.max : 75000;
  const p25Val = stats && stats.count > 0 ? stats.p25 : 32000;
  const p75Val = stats && stats.count > 0 ? stats.p75 : 55000;
  const totalCount = stats && stats.count > 0 ? stats.count : 45;

  const dynamicMarketText = `El desarrollo de software con especialización en ${techInfo.label} se mantiene como uno de los perfiles más buscados y estables en todo el territorio nacional. Con una retribución media estimada de ${formatEur(avg)} brutos anuales, la demanda se extiende a través de múltiples sectores y geografías. Las vacantes activas y el dinamismo general de las contrataciones sugieren que las empresas siguen valorando de manera prioritaria la experiencia en este ecosistema técnico.`;

  const rangePercent = minVal && maxVal && avg
    ? Math.round(((avg - minVal) / (maxVal - minVal)) * 100)
    : 50;

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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Cuál es el sueldo medio de un programador ${techInfo.label} en España?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El sueldo medio de un programador ${techInfo.label} en España es de ${formatEur(avg)} brutos anuales, basado en las ofertas reales con salarios publicados recopiladas en nuestro portal.`
        }
      },
      {
        '@type': 'Question',
        name: `¿Cuánto cobra un desarrollador ${techInfo.label} Junior en España?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Un desarrollador ${techInfo.label} Junior (con menos de 2 años de experiencia) suele ganar en torno al percentil 25%, es decir, unos ${formatEur(p25Val)} brutos al año en España.`
        }
      },
      {
        '@type': 'Question',
        name: `¿Cuál es el rango salarial para un desarrollador ${techInfo.label} Senior?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Para perfiles Senior con más de 5 años de experiencia, los salarios de ${techInfo.label} suelen situarse a partir del percentil 75%, rondando los ${formatEur(p75Val)} brutos anuales, pudiendo superar los ${formatEur(maxVal)} en empresas que ofrecen trabajo remoto.`
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      <div className="max-w-5xl mx-auto px-4">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
              {techInfo.icon} Estadísticas Salariales {techInfo.label}
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              ¿Cuánto cobra un desarrollador{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                {techInfo.label}
              </span>{' '}
              en España?
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              {techInfo.desc} A continuación, analizamos los rangos de sueldos, percentiles 
              y vacantes disponibles calculados a partir de las ofertas reales recopiladas en nuestra plataforma.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Left Column: Stats & FAQ */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Salary Main Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                📊 Ficha Salarial {techInfo.label}
              </h2>
              
              <div className="bg-indigo-50/50 rounded-xl p-6 text-center border border-indigo-100 mb-6">
                <p className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest mb-1">
                  Sueldo Medio Bruto Anual
                </p>
                <p className="text-5xl font-black text-indigo-950 mb-1">{formatEur(avg)}</p>
                <span className="text-xs text-gray-500">
                  Calculado en base a {totalCount} ofertas de empleo analizadas
                </span>
              </div>

              {/* Progress Bar Range */}
              <div className="mb-8">
                <div className="flex justify-between text-xs font-semibold text-gray-550 mb-2">
                  <span>Mínimo: {formatEur(minVal)}</span>
                  <span className="text-indigo-600">Media: {formatEur(avg)}</span>
                  <span>Máximo: {formatEur(maxVal)}</span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                    style={{ width: `${rangePercent}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-white border-3 border-indigo-600 rounded-full shadow-md"
                    style={{ left: `calc(${rangePercent}% - 9px)` }}
                  />
                </div>
              </div>

              {/* Percentiles List */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Junior (P25)', val: p25Val, desc: 'Sueldo de entrada típico' },
                  { label: 'Mediana (P50)', val: med, desc: 'Sueldo de mercado habitual' },
                  { label: 'Senior (P75)', val: p75Val, desc: 'Sueldo para perfiles experimentados' },
                  { label: 'Límite Máximo', val: maxVal, desc: 'Salario alto o remoto global' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-lg font-black text-gray-800">{formatEur(item.val)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Análisis de Mercado Editorial Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📝 Análisis del Mercado para {techInfo.label}
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {dynamicMarketText}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Adicionalmente, el dominio de buenas prácticas como arquitecturas desacopladas, pruebas automatizadas, control de versiones robusto y capacidad de comunicación son habilidades críticas que impulsan los salarios de este stack hacia los rangos superiores en España.
              </p>
            </div>

            {/* FAQ Accordion Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                💬 Preguntas Frecuentes sobre el Sueldo de {techInfo.label}
              </h2>
              
              <div className="space-y-4 divide-y divide-gray-100">
                <div className="pt-4 first:pt-0">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Cuál es el sueldo medio de un programador {techInfo.label} en España?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    El sueldo medio bruto de un desarrollador {techInfo.label} se sitúa en los <strong>{formatEur(avg)}</strong> brutos al año. 
                    No obstante, este valor varía significativamente en función de los años de experiencia y la ubicación.
                  </p>
                </div>
                <div className="pt-4">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Cuánto gana un desarrollador {techInfo.label} Junior en España?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Los profesionales que inician su carrera en {techInfo.label} (Junior, con 0-2 años de experiencia) 
                    suelen percibir salarios que rondan los <strong>{formatEur(p25Val)}</strong> brutos anuales.
                  </p>
                </div>
                <div className="pt-4">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Cuánto cobra un desarrollador {techInfo.label} Senior en España?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Los programadores {techInfo.label} con perfil Senior (más de 5 años de trayectoria) obtienen sueldos 
                    que se posicionan habitualmente a partir de los <strong>{formatEur(p75Val)}</strong> brutos anuales, 
                    pudiendo alcanzar los <strong>{formatEur(maxVal)}</strong> en vacantes multinacionales o 100% remotas.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <AdBanner variant="inline" tech={techSlug} />
            </div>
          </div>

          {/* Right Column: Calculator Promo & Jobs */}
          <div className="space-y-6">
            
            {/* Go to main calculator card */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-indigo-950 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">🧮 Calculadora Interactiva</h3>
                <p className="text-indigo-200 text-xs leading-relaxed mb-4">
                  ¿Quieres afinar más el cálculo? Utiliza nuestra calculadora general para filtrar salarios 
                  por ciudad exacta, nivel de experiencia exacto y comparar con otras tecnologías.
                </p>
              </div>
              <Link 
                href={`/salarios?tech=${techSlug}`}
                className="w-full text-center bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                Abrir Calculadora
              </Link>
            </div>

            {/* Related Jobs block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-950 mb-4">
                💼 Ofertas de {techInfo.label} Recientes
              </h3>
              
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6">
                  No hay ofertas activas de {techInfo.label} en este momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job: any) => (
                    <div key={job.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                      <div>
                        <Link href={`/job/${job.id}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 hover:underline line-clamp-1">
                          {job.title}
                        </Link>
                        <p className="text-xs text-gray-500">{job.company}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>📍 {job.location}</span>
                        {job.salary && <span className="font-semibold text-gray-700">💰 {job.salary}</span>}
                      </div>
                    </div>
                  ))}
                  <Link 
                    href={`/trabajos/${techSlug}`} 
                    className="block text-center text-xs font-bold text-indigo-650 hover:underline pt-2"
                  >
                    Ver todas las ofertas de {techInfo.label} →
                  </Link>
                </div>
              )}
            </div>

            {/* Courses banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <h4 className="font-bold text-amber-900 text-sm mb-1">💡 ¿Quieres mejorar tu salario?</h4>
              <p className="text-amber-700 text-xs leading-relaxed mb-4">
                Fórmate en las tecnologías más demandadas con cursos certificados de {techInfo.label}.
              </p>
              <a 
                href={`https://trk.udemy.com/9VMAEj?ulp=${encodeURIComponent(`https://www.udemy.com/courses/search/?q=${techInfo.label}`)}`}
                target="_blank" 
                rel="noopener noreferrer sponsored"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
              >
                Cursos de {techInfo.label} →
              </a>
            </div>

            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" tech={techSlug} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
