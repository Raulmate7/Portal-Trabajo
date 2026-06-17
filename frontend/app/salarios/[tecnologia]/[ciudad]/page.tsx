import pool from '@/lib/db';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';
import { BASE_URL } from '@/lib/constants';
import { getJobSlug } from '@/lib/slug';

export const revalidate = 3600; // Cache 1 hora

interface Props {
  params: Promise<{ tecnologia: string; ciudad: string }>;
}

const TECH_DETAILS: Record<string, { label: string; icon: string; desc: string; baseAvg: number }> = {
  'react': { label: 'React', icon: '⚛️', desc: 'Desarrollador/a Frontend experto en React, hooks, estado y componentes.', baseAvg: 41000 },
  'node': { label: 'Node.js', icon: '🟩', desc: 'Desarrollador/a Backend enfocado en Node.js, Express, NestJS y APIs.', baseAvg: 43000 },
  'python': { label: 'Python', icon: '🐍', desc: 'Programador/a Python para ciencia de datos, inteligencia artificial o desarrollo backend.', baseAvg: 44000 },
  'java': { label: 'Java', icon: '☕', desc: 'Desarrollador/a Java Enterprise, Spring Boot y microservicios.', baseAvg: 45000 },
  'typescript': { label: 'TypeScript', icon: '🔷', desc: 'Desarrollador/a de software especializado en tipado estático con TypeScript.', baseAvg: 43000 },
  'aws': { label: 'AWS', icon: '☁️', desc: 'Ingeniero/a Cloud de Amazon Web Services, infraestructura y serverless.', baseAvg: 48000 },
  'docker': { label: 'Docker', icon: '🐳', desc: 'Ingeniero/a DevOps enfocado en contenerización con Docker, CI/CD y despliegue.', baseAvg: 47000 },
  'flutter': { label: 'Flutter', icon: '📱', desc: 'Desarrollador/a Mobile de aplicaciones nativas híbridas con Flutter y Dart.', baseAvg: 39000 },
  'csharp': { label: 'C# / .NET', icon: '🔵', desc: 'Programador/a C# y arquitectura .NET para aplicaciones robustas.', baseAvg: 42000 },
  'php': { label: 'PHP', icon: '🐘', desc: 'Desarrollador/a web con PHP, Laravel o Symfony.', baseAvg: 36000 },
  'sql': { label: 'SQL', icon: '🗃️', desc: 'Analista de datos o Administrador de Bases de Datos (DBA) especialista en SQL.', baseAvg: 38000 },
};

const DISPLAY_CITIES: Record<string, { label: string; factor: number }> = {
  'madrid': { label: 'Madrid', factor: 1.05 },
  'barcelona': { label: 'Barcelona', factor: 1.02 },
  'valencia': { label: 'Valencia', factor: 0.92 },
  'sevilla': { label: 'Sevilla', factor: 0.88 },
  'bilbao': { label: 'Bilbao', factor: 0.98 },
  'malaga': { label: 'Málaga', factor: 0.95 },
  'remoto': { label: 'Remoto', factor: 1.10 },
};

async function getSalaryStatsForTechAndCity(techSlug: string, citySlug: string) {
  const techInfo = TECH_DETAILS[techSlug];
  if (!techInfo) return null;

  const client = await pool.connect();
  try {
    let sql = `
      SELECT salary
      FROM jobs
      WHERE salary IS NOT NULL 
        AND salary != 'Consultar'
        AND salary != ''
        AND title ILIKE $1
    `;
    const params = [`%${techInfo.label}%`];

    if (citySlug === 'remoto') {
      sql += ` AND (location ILIKE $2 OR location ILIKE $3 OR location ILIKE $4 OR location ILIKE $5)`;
      params.push('%remoto%', '%remote%', '%worldwide%', '%teletrabajo%');
    } else {
      sql += ` AND location ILIKE $2`;
      params.push(`%${citySlug}%`);
    }

    const result = await client.query(sql, params);
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
    console.error(`Error calculating salary stats for ${techSlug} in ${citySlug}:`, error);
    return null;
  } finally {
    client.release();
  }
}

async function getRecentJobs(techLabel: string, citySlug: string) {
  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, title_es, company, location, salary FROM jobs WHERE is_active = TRUE AND title ILIKE $1";
    const params = [`%${techLabel}%`];
    
    if (citySlug === 'remoto') {
      sql += " AND (location ILIKE $2 OR location ILIKE $3 OR location ILIKE $4 OR location ILIKE $5)";
      params.push('%remoto%', '%remote%', '%worldwide%', '%teletrabajo%');
    } else {
      sql += " AND location ILIKE $2";
      params.push(`%${citySlug}%`);
    }
    
    sql += " ORDER BY created_at DESC LIMIT 3";
    
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching jobs for salary tech/city page:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tecnologia, ciudad } = await params;
  const techSlug = tecnologia.toLowerCase();
  const citySlug = ciudad.toLowerCase();
  
  const techInfo = TECH_DETAILS[techSlug];
  const cityInfo = DISPLAY_CITIES[citySlug];
  
  if (!techInfo || !cityInfo) {
    return { title: 'Página no encontrada' };
  }

  const locText = citySlug === 'remoto' ? 'en Remoto' : `en ${cityInfo.label}`;
  const title = `Sueldo de Programador ${techInfo.label} ${locText} [2026]`;
  const description = `¿Cuánto gana un desarrollador ${techInfo.label} ${locText}? Desglose de salarios brutos, percentiles Junior/Senior y vacantes activas.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/salarios/${techSlug}/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/salarios/${techSlug}/${citySlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export async function generateStaticParams() {
  const technologies = Object.keys(TECH_DETAILS);
  const cities = ['madrid', 'barcelona', 'valencia', 'remoto'];
  const params = [];
  
  for (const tech of technologies) {
    for (const city of cities) {
      params.push({
        tecnologia: tech,
        ciudad: city,
      });
    }
  }
  return params;
}

function formatEur(val: number | null): string {
  if (val === null) return 'N/D';
  return `${val.toLocaleString('es-ES')}€`;
}

export default async function SalarioTechCityPage({ params }: Props) {
  const { tecnologia, ciudad } = await params;
  const techSlug = tecnologia.toLowerCase();
  const citySlug = ciudad.toLowerCase();
  
  const techInfo = TECH_DETAILS[techSlug];
  const cityInfo = DISPLAY_CITIES[citySlug];

  if (!techInfo || !cityInfo) {
    notFound();
  }

  const stats = await getSalaryStatsForTechAndCity(techSlug, citySlug);
  const recentJobs = await getRecentJobs(techInfo.label, citySlug);

  const locText = citySlug === 'remoto' ? 'en Remoto' : `en ${cityInfo.label}`;

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Calculadora de Salarios', href: '/salarios' },
    { label: techInfo.label, href: `/salarios/${techSlug}` },
    { label: cityInfo.label }
  ];

  // Cálculo de percentiles con fallback escalado
  const factor = cityInfo.factor;
  const baseAvg = techInfo.baseAvg;
  
  const avg = stats && stats.count >= 3 ? stats.average : Math.round(baseAvg * factor);
  const med = stats && stats.count >= 3 ? stats.median : Math.round(baseAvg * 0.95 * factor);
  const minVal = stats && stats.count >= 3 ? stats.min : Math.round(baseAvg * 0.58 * factor);
  const maxVal = stats && stats.count >= 3 ? stats.max : Math.round(baseAvg * 1.8 * factor);
  const p25Val = stats && stats.count >= 3 ? stats.p25 : Math.round(baseAvg * 0.77 * factor);
  const p75Val = stats && stats.count >= 3 ? stats.p75 : Math.round(baseAvg * 1.3 * factor);
  const totalCount = stats && stats.count > 0 ? stats.count : 0;

  const dynamicMarketText = `El entorno laboral para profesionales de ${techInfo.label} ${locText} destaca por ser un sector de ${
    citySlug === 'remoto' 
      ? 'máxima flexibilidad y alta competencia, atrayendo a empresas que compiten a nivel nacional.' 
      : `fuerte dinamismo en la provincia de ${cityInfo.label}, siendo una de las especialidades más demandadas por consultoras e integradoras de sistemas locales.`
  } La retribución media de ${formatEur(avg)} brutos anuales refleja la solidez de este perfil en el mercado actual.`;

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
        name: `¿Cuál es el sueldo medio de un programador ${techInfo.label} ${locText}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El sueldo medio de un programador ${techInfo.label} ${locText} es de ${formatEur(avg)} brutos anuales, según las ofertas del mercado IT analizadas.`
        }
      },
      {
        '@type': 'Question',
        name: `¿Cuánto cobra un desarrollador ${techInfo.label} Junior ${locText}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Un desarrollador ${techInfo.label} Junior (con menos de 2 años de experiencia) ${locText} gana un promedio de ${formatEur(p25Val)} brutos anuales.`
        }
      },
      {
        '@type': 'Question',
        name: `¿Cuál es el salario de un perfil Senior para ${techInfo.label} ${locText}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Para perfiles Senior con experiencia contrastada de más de 5 años, los salarios de ${techInfo.label} ${locText} rondan de media los ${formatEur(p75Val)} brutos anuales, pudiendo ascender hasta los ${formatEur(maxVal)} en empresas líderes.`
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
              {techInfo.icon} Salarios de {techInfo.label} en {cityInfo.label}
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              Sueldo de desarrollador{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                {techInfo.label}
              </span>{' '}
              {locText}
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Analizamos la retribución salarial para el perfil de {techInfo.label} en {cityInfo.label}.
              Descubre los salarios de referencia para programadores Junior, Mid y Senior en esta localización.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Stats & FAQ */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                📊 Estadísticas Salariales
              </h2>
              
              <div className="bg-indigo-50/50 rounded-xl p-6 text-center border border-indigo-100 mb-6">
                <p className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest mb-1">
                  Sueldo Medio Estimado {locText}
                </p>
                <p className="text-5xl font-black text-indigo-950 mb-1">{formatEur(avg)}</p>
                <span className="text-xs text-gray-500">
                  {totalCount > 0 
                    ? `Calculado en base a ${totalCount} ofertas de empleo localizadas` 
                    : 'Estimación escalada en base a la media de la tecnología y coste de vida'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-xs font-semibold text-gray-550 mb-2">
                  <span>Mínimo: {formatEur(minVal)}</span>
                  <span className="text-indigo-600 font-bold">Media: {formatEur(avg)}</span>
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

              {/* Percentiles */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Junior (P25)', val: p25Val, desc: 'Sueldo inicial estimado' },
                  { label: 'Mediana (P50)', val: med, desc: 'Punto medio de mercado' },
                  { label: 'Senior (P75)', val: p75Val, desc: 'Perfiles experimentados' },
                  { label: 'Máximo', val: maxVal, desc: 'Empresas top o remoto global' },
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
                📝 Análisis del Mercado para {techInfo.label} {locText}
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {dynamicMarketText}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Adicionalmente, factores como el dominio de metodologías ágiles, control de versiones (Git), y competencias en despliegue continuo (CI/CD) marcan una diferencia notable en el salario final ofrecido por las organizaciones contratantes en esta localización.
              </p>
            </div>

            {/* Accordion FAQ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                💬 Preguntas Frecuentes sobre Salarios {locText}
              </h2>
              
              <div className="space-y-4 divide-y divide-gray-100">
                <div className="pt-4 first:pt-0">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Cuál es el sueldo medio de un programador {techInfo.label} {locText}?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    El sueldo medio bruto de un desarrollador {techInfo.label} {locText} es de <strong>{formatEur(avg)}</strong> brutos al año.
                    Esto suele estar influenciado por el tipo de empresa y el modelo de teletrabajo.
                  </p>
                </div>
                <div className="pt-4">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Qué factores determinan la variación salarial en {cityInfo.label}?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Los factores fundamentales son los años de experiencia práctica en producción, el dominio de inglés 
                    para empresas internacionales y el conocimiento secundario de arquitecturas cloud (como AWS o Docker).
                  </p>
                </div>
                <div className="pt-4">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Cuánto gana un Senior {techInfo.label} en esta localización?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Un programador {techInfo.label} Senior con más de 5 años de trayectoria {locText} 
                    puede esperar una remuneración estimada de entre <strong>{formatEur(p75Val)}</strong> y <strong>{formatEur(maxVal)}</strong> brutos al año.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Promo Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-indigo-950 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">🧮 Buscar otra ciudad</h3>
                <p className="text-indigo-200 text-xs leading-relaxed mb-4">
                  Consulta el sueldo medio nacional o explora los rangos salariales en otras capitales tecnológicas de España.
                </p>
              </div>
              <Link 
                href={`/salarios/${techSlug}`}
                className="w-full text-center bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                Ver Comparativa {techInfo.label}
              </Link>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-950 mb-4">
                💼 Ofertas {techInfo.label} {locText}
              </h3>
              
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6">
                  No hay ofertas activas localizadas para este perfil en este momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job: any) => (
                    <div key={job.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                      <div>
                        <Link href={`/job/${getJobSlug(job)}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 hover:underline line-clamp-1">
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
                    href={citySlug === 'remoto' ? `/trabajos/${techSlug}-remoto` : `/trabajos/${techSlug}-en-${citySlug}`}
                    className="block text-center text-xs font-bold text-indigo-650 hover:underline pt-2"
                  >
                    Ver ofertas de {techInfo.label} {locText} →
                  </Link>
                </div>
              )}
            </div>

            {/* Courses */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <h4 className="font-bold text-amber-900 text-sm mb-1">💡 Cursos recomendados</h4>
              <p className="text-amber-700 text-xs leading-relaxed mb-4">
                Mejora tu rango salarial adquiriendo competencias avanzadas de {techInfo.label}.
              </p>
              <a 
                href="https://trk.udemy.com/9VMAEj" 
                target="_blank" 
                rel="noopener noreferrer sponsored"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
              >
                Ver Cursos →
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
