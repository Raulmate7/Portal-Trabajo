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
  params: Promise<{ tecnologia: string; ciudad: string; nivel: string }>;
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
  'go': { label: 'Go', icon: '🐹', desc: 'Desarrollador/a Go (Golang) para backend, microservicios y sistemas de alta concurrencia.', baseAvg: 46000 },
  'rust': { label: 'Rust', icon: '🦀', desc: 'Programador/a Rust enfocado en rendimiento, seguridad de memoria y sistemas críticos.', baseAvg: 50000 },
  'ruby': { label: 'Ruby', icon: '💎', desc: 'Desarrollador/a Ruby, principalmente enfocado en Ruby on Rails.', baseAvg: 41000 },
  'scala': { label: 'Scala', icon: '🔴', desc: 'Programador/a Scala para procesamiento de datos distribuido y backend funcional.', baseAvg: 48000 },
  'elixir': { label: 'Elixir', icon: '💧', desc: 'Desarrollador/a Elixir y Phoenix para sistemas distribuidos y tolerantes a fallos.', baseAvg: 45000 },
  'salesforce': { label: 'Salesforce', icon: '☁️', desc: 'Desarrollador/a o Administrador/a Salesforce, Apex, Visualforce y LWC.', baseAvg: 38000 },
  'cybersecurity': { label: 'Ciberseguridad', icon: '🛡️', desc: 'Especialista en ciberseguridad, seguridad de la información, auditoría y hacking ético.', baseAvg: 44000 },
  'terraform': { label: 'Terraform', icon: '🏗️', desc: 'Ingeniero/a DevOps especializado en Infraestructura como Código (IaC) con Terraform.', baseAvg: 48000 },
  'cobol': { label: 'COBOL', icon: '💾', desc: 'Programador/a COBOL para sistemas heredados, banca y gran empresa.', baseAvg: 36000 },
};

const DISPLAY_CITIES: Record<string, { label: string; factor: number }> = {
  'madrid': { label: 'Madrid', factor: 1.05 },
  'barcelona': { label: 'Barcelona', factor: 1.02 },
  'valencia': { label: 'Valencia', factor: 0.92 },
  'sevilla': { label: 'Sevilla', factor: 0.88 },
  'bilbao': { label: 'Bilbao', factor: 0.98 },
  'malaga': { label: 'Málaga', factor: 0.95 },
  'zaragoza': { label: 'Zaragoza', factor: 0.89 },
  'alicante': { label: 'Alicante', factor: 0.90 },
  'vigo': { label: 'Vigo', factor: 0.88 },
  'coruna': { label: 'A Coruña', factor: 0.92 },
  'granada': { label: 'Granada', factor: 0.85 },
  'remoto': { label: 'Remoto', factor: 1.10 },
};

const DISPLAY_LEVELS: Record<string, { label: string; factor: number; keywords: string[]; desc: string }> = {
  'junior': {
    label: 'Junior',
    factor: 0.72,
    keywords: ['junior', 'jr', 'junior developer', 'trainee', 'becario', 'prácticas', 'entry level', 'sin experiencia'],
    desc: 'Profesionales en sus primeros 0-2 años de trayectoria. Requieren mentoría y se enfocan en asimilar buenas prácticas y resolver tareas delimitadas.'
  },
  'mid': {
    label: 'Mid',
    factor: 1.00,
    keywords: ['mid', 'semisenior', 'semi-senior', 'ssr', 'intermediate', '2 años', '3 años', '4 años'],
    desc: 'Profesionales con 2-5 años de experiencia. Tienen autonomía, resuelven problemas de complejidad media y colaboran activamente en decisiones de arquitectura.'
  },
  'senior': {
    label: 'Senior',
    factor: 1.38,
    keywords: ['senior', 'sr', 'lead', 'principal', 'tech lead', 'staff', '5 años', '6 años', '7 años'],
    desc: 'Profesionales con más de 5 años de experiencia contrastada. Diseñan sistemas complejos, guían a perfiles más jóvenes e impactan directamente en decisiones técnicas del negocio.'
  }
};

async function getSalaryStatsForTechCityAndLevel(techSlug: string, citySlug: string, levelSlug: string) {
  const techInfo = TECH_DETAILS[techSlug];
  const levelInfo = DISPLAY_LEVELS[levelSlug];
  if (!techInfo || !levelInfo) return null;

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
    let paramIndex = 2;

    if (citySlug === 'remoto') {
      sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2} OR location ILIKE $${paramIndex + 3})`;
      params.push('%remoto%', '%remote%', '%worldwide%', '%teletrabajo%');
      paramIndex += 4;
    } else {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${citySlug}%`);
      paramIndex++;
    }

    const levelConditions = levelInfo.keywords.map(() => {
      const cond = `(title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      paramIndex++;
      return cond;
    }).join(' OR ');
    
    sql += ` AND (${levelConditions})`;
    params.push(...levelInfo.keywords.map(k => `%${k}%`));

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
    console.error(`Error calculating salary stats for ${techSlug} in ${citySlug} for level ${levelSlug}:`, error);
    return null;
  } finally {
    client.release();
  }
}

async function getRecentJobs(techLabel: string, citySlug: string, levelSlug: string) {
  const levelInfo = DISPLAY_LEVELS[levelSlug];
  if (!levelInfo) return [];

  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, title_es, company, location, salary FROM jobs WHERE is_active = TRUE AND title ILIKE $1";
    const params = [`%${techLabel}%`];
    let paramIndex = 2;
    
    if (citySlug === 'remoto') {
      sql += " AND (location ILIKE $2 OR location ILIKE $3 OR location ILIKE $4 OR location ILIKE $5)";
      params.push('%remoto%', '%remote%', '%worldwide%', '%teletrabajo%');
      paramIndex += 4;
    } else {
      sql += " AND location ILIKE $2";
      params.push(`%${citySlug}%`);
      paramIndex++;
    }

    const levelConditions = levelInfo.keywords.map(() => {
      const cond = `(title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      paramIndex++;
      return cond;
    }).join(' OR ');
    
    sql += ` AND (${levelConditions})`;
    params.push(...levelInfo.keywords.map(k => `%${k}%`));
    
    sql += " ORDER BY created_at DESC LIMIT 3";
    
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching jobs for level salary page:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tecnologia, ciudad, nivel } = await params;
  const techSlug = tecnologia.toLowerCase();
  const citySlug = ciudad.toLowerCase();
  const levelSlug = nivel.toLowerCase();
  
  const techInfo = TECH_DETAILS[techSlug];
  const cityInfo = DISPLAY_CITIES[citySlug];
  const levelInfo = DISPLAY_LEVELS[levelSlug];
  
  if (!techInfo || !cityInfo || !levelInfo) {
    return { title: 'Página no encontrada' };
  }

  const locText = citySlug === 'remoto' ? 'en Remoto' : `en ${cityInfo.label}`;
  const title = `Sueldo de Programador ${techInfo.label} ${levelInfo.label} ${locText} [2026]`;
  const description = `¿Cuánto cobra un desarrollador ${techInfo.label} de nivel ${levelInfo.label.toLowerCase()} ${locText}? Rangos de sueldo, percentiles y vacantes activas.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/salarios/${techSlug}/${citySlug}/${levelSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/salarios/${techSlug}/${citySlug}/${levelSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

const STATIC_TECHS = ['react', 'node', 'python', 'java', 'typescript', 'aws', 'php'];

export async function generateStaticParams() {
  const cities = ['madrid', 'barcelona', 'valencia', 'remoto'];
  const levels = ['junior', 'mid', 'senior'];
  const params = [];
  
  for (const tech of STATIC_TECHS) {
    for (const city of cities) {
      for (const level of levels) {
        params.push({
          tecnologia: tech,
          ciudad: city,
          nivel: level,
        });
      }
    }
  }
  return params;
}

function formatEur(val: number | null): string {
  if (val === null) return 'N/D';
  return `${val.toLocaleString('es-ES')}€`;
}

export default async function SalarioTechCityLevelPage({ params }: Props) {
  const { tecnologia, ciudad, nivel } = await params;
  const techSlug = tecnologia.toLowerCase();
  const citySlug = ciudad.toLowerCase();
  const levelSlug = nivel.toLowerCase();
  
  const techInfo = TECH_DETAILS[techSlug];
  const cityInfo = DISPLAY_CITIES[citySlug];
  const levelInfo = DISPLAY_LEVELS[levelSlug];

  if (!techInfo || !cityInfo || !levelInfo) {
    notFound();
  }

  const stats = await getSalaryStatsForTechCityAndLevel(techSlug, citySlug, levelSlug);
  const recentJobs = await getRecentJobs(techInfo.label, citySlug, levelSlug);

  const locText = citySlug === 'remoto' ? 'en Remoto' : `en ${cityInfo.label}`;

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Calculadora de Salarios', href: '/salarios' },
    { label: techInfo.label, href: `/salarios/${techSlug}` },
    { label: cityInfo.label, href: `/salarios/${techSlug}/${citySlug}` },
    { label: levelInfo.label }
  ];

  // Cálculo de percentiles con fallback escalado por tecnología, ubicación y nivel
  const factor = cityInfo.factor;
  const levelFactor = levelInfo.factor;
  const baseAvg = techInfo.baseAvg * levelFactor;
  
  const avg = stats && stats.count >= 3 ? stats.average : Math.round(baseAvg * factor);
  const med = stats && stats.count >= 3 ? stats.median : Math.round(baseAvg * 0.96 * factor);
  const minVal = stats && stats.count >= 3 ? stats.min : Math.round(baseAvg * 0.75 * factor);
  const maxVal = stats && stats.count >= 3 ? stats.max : Math.round(baseAvg * 1.35 * factor);
  const p25Val = stats && stats.count >= 3 ? stats.p25 : Math.round(baseAvg * 0.88 * factor);
  const p75Val = stats && stats.count >= 3 ? stats.p75 : Math.round(baseAvg * 1.15 * factor);
  const totalCount = stats && stats.count > 0 ? stats.count : 0;

  const dynamicMarketText = `El mercado de trabajo para desarrolladores de ${techInfo.label} ${locText} se encuentra en una fase de ${
    citySlug === 'remoto' 
      ? 'alta expansión nacional con excelente flexibilidad para conciliar'
      : `crecimiento constante en la región de ${cityInfo.label}, impulsado por empresas de producto y consultorías`
  }. Un perfil de experiencia ${levelInfo.label.toLowerCase()} en esta tecnología suele enfrentarse a un mercado con ${
    levelSlug === 'junior' 
      ? 'oportunidades enfocadas en formación inicial, requiriendo conocimiento de bases y proactividad.' 
      : levelSlug === 'mid' 
        ? 'buena demanda de autonomía técnica, donde el dominio de frameworks secundarios y buenas prácticas de desarrollo es clave.'
        : 'alta competencia y salarios muy atractivos, donde la capacidad de arquitectura, liderazgo técnico y comunicación directa de valor marca la diferencia.'
  }`;

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
        name: `¿Cuál es el salario medio de un programador ${techInfo.label} ${levelInfo.label} ${locText}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El salario medio de un programador ${techInfo.label} ${levelInfo.label} ${locText} es de aproximadamente ${formatEur(avg)} brutos anuales.`
        }
      },
      {
        '@type': 'Question',
        name: `¿Cuánto puede ganar como mínimo y máximo un perfil ${levelInfo.label} de ${techInfo.label} ${locText}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El rango salarial estimado va desde un mínimo de ${formatEur(minVal)} hasta los ${formatEur(maxVal)} brutos al año.`
        }
      },
      {
        '@type': 'Question',
        name: `¿Qué responsabilidades se esperan de un programador ${techInfo.label} ${levelInfo.label}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: levelInfo.desc
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
              {techInfo.icon} Salario Nivel {levelInfo.label} — {cityInfo.label}
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              Sueldo {techInfo.label}{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                {levelInfo.label}
              </span>{' '}
              {locText}
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Analizamos la retribución salarial específica para el perfil de <strong>{techInfo.label} {levelInfo.label}</strong> {locText}. 
              Encuentra los rangos salariales estimados, percentiles de mercado y ofertas de empleo activas.
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
                📊 Desglose Salarial {levelInfo.label}
              </h2>
              
              <div className="bg-indigo-50/50 rounded-xl p-6 text-center border border-indigo-100 mb-6">
                <p className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest mb-1">
                  Sueldo Medio Anual Estimado
                </p>
                <p className="text-5xl font-black text-indigo-950 mb-1">{formatEur(avg)}</p>
                <span className="text-xs text-gray-500">
                  {totalCount > 0 
                    ? `Calculado en base a ${totalCount} ofertas de nivel ${levelInfo.label.toLowerCase()} localizadas` 
                    : `Estimación basada en el factor ${levelInfo.label} de la tecnología con coste de vida local`}
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
                  { label: 'Rango Inferior (P25)', val: p25Val, desc: 'Sueldo de entrada para este rango' },
                  { label: 'Mediana (P50)', val: med, desc: 'Valor del mercado intermedio' },
                  { label: 'Rango Superior (P75)', val: p75Val, desc: 'Profesionales altamente capacitados' },
                  { label: 'Límite Máximo', val: maxVal, desc: 'Sueldos en empresas top de producto' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                     <p className="text-lg font-black text-gray-800">{formatEur(item.val)}</p>
                     <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Editorial Content about seniority */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📝 ¿Qué define a un perfil {techInfo.label} {levelInfo.label}?
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {levelInfo.desc}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {dynamicMarketText}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                El sueldo de un programador {techInfo.label} {levelInfo.label} {locText} varía según la solidez de sus conocimientos técnicos prácticos, su facilidad para comprender requisitos de negocio, su capacidad de comunicación y la solidez técnica demostrada en entrevistas y proyectos anteriores.
              </p>
            </div>

            {/* Accordion FAQ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                💬 Preguntas Frecuentes sobre el Sueldo {techInfo.label} {levelInfo.label}
              </h2>
              
              <div className="space-y-4 divide-y divide-gray-100">
                <div className="pt-4 first:pt-0">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Es {formatEur(avg)} un salario competitivo para {techInfo.label} {levelInfo.label} {locText}?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Sí, se sitúa plenamente dentro del rango de remuneraciones del sector IT en España para profesionales con esta experiencia y tecnología en {cityInfo.label}. Las empresas que ofrecen opciones de teletrabajo o que están en mercados globales suelen pagar en la parte alta de la horquilla.
                  </p>
                </div>
                <div className="pt-4">
                  <h3 className="text-base font-bold text-indigo-950 mb-2">
                    ¿Cómo aumentar el rango salarial en este nivel?
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    La especialización en arquitecturas robustas, bases de datos avanzadas, liderazgo técnico de microproyectos, metodologías ágiles y un nivel fluido de inglés para trabajar con equipos internacionales son los factores que más aumentan los salarios para este nivel de experiencia.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <AdBanner variant="inline" tech={techSlug} experience={levelSlug} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Navigation levels */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                🔄 Cambiar Nivel de Experiencia
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(DISPLAY_LEVELS).map(([lKey, lVal]) => {
                  const isActive = lKey === levelSlug;
                  return (
                    <Link
                      key={lKey}
                      href={`/salarios/${techSlug}/${citySlug}/${lKey}`}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100'
                      }`}
                    >
                      {techInfo.label} {lVal.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Navigation Cities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                📍 Otras Localidades
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(DISPLAY_CITIES).map(([cKey, cVal]) => {
                  const isActive = cKey === citySlug;
                  return (
                    <Link
                      key={cKey}
                      href={`/salarios/${techSlug}/${cKey}/${levelSlug}`}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100'
                      }`}
                    >
                      {cVal.label} ({levelInfo.label})
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-950 mb-4">
                💼 Ofertas {techInfo.label} {levelInfo.label}
              </h3>
              
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-6">
                  No hay ofertas activas localizadas con estos filtros concretos.
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
                </div>
              )}
              <div className="border-t border-gray-100 mt-4 pt-4 text-center">
                <Link 
                  href={
                    citySlug === 'remoto' 
                      ? `/trabajos/${techSlug}-${levelSlug}-remoto` 
                      : `/trabajos/${techSlug}-${levelSlug}-en-${citySlug}`
                  }
                  className="inline-block text-xs font-bold text-indigo-650 hover:underline"
                >
                  Ver ofertas {techInfo.label} {levelInfo.label} →
                </Link>
              </div>
            </div>

            {/* Courses */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <h4 className="font-bold text-amber-900 text-sm mb-1">💡 Potencia tu Carrera</h4>
              <p className="text-amber-700 text-xs leading-relaxed mb-4">
                Formación continua para subir de rango y alcanzar el nivel superior como {techInfo.label}.
              </p>
              <a 
                href={`https://trk.udemy.com/9VMAEj?ulp=${encodeURIComponent(`https://www.udemy.com/courses/search/?q=${techInfo.label}`)}`}
                target="_blank" 
                rel="noopener noreferrer sponsored"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
              >
                Ver Cursos Online →
              </a>
            </div>

            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" tech={techSlug} experience={levelSlug} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
