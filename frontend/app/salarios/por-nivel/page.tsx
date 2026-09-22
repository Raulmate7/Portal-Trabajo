import pool from '@/lib/db';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 3600; // Cache 1 hora

export const metadata: Metadata = {
  title: 'Salarios IT por Nivel de Experiencia [2026] | Junior, Mid y Senior en España',
  description: 'Descubre los sueldos de programación e informática en España según años de experiencia: Junior (0-2 años), Mid-Level (2-5 años), Senior (5-8 años) y Tech Lead (8+ años).',
  alternates: {
    canonical: `${BASE_URL}/salarios/por-nivel`,
  },
  openGraph: {
    title: 'Salarios IT por Nivel de Experiencia [2026] | Portal Trabajo',
    description: 'Tablas de retribución bruta anual en España clasificadas por senioridad y años de experiencia laboral en tecnología.',
    url: `${BASE_URL}/salarios/por-nivel`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Salarios IT por Nivel de Experiencia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salarios IT por Nivel de Experiencia en España [2026]',
    description: 'Sueldos de desarrolladores Junior, Mid, Senior y Tech Leads.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

async function getSalaryByLevelStats() {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT salary, title 
      FROM jobs 
      WHERE is_active = TRUE AND salary IS NOT NULL AND salary != 'Consultar' AND salary != ''
    `;
    const res = await client.query(sql);

    const levels = {
      junior: [] as number[],
      mid: [] as number[],
      senior: [] as number[],
      lead: [] as number[]
    };

    for (const row of res.rows) {
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

      if (val >= 12000 && val <= 150000) {
        const roundedVal = Math.round(val);
        const titleLower = (row.title || '').toLowerCase();

        if (titleLower.includes('junior') || titleLower.includes('trainee') || titleLower.includes('becario') || titleLower.includes('practicas')) {
          levels.junior.push(roundedVal);
        } else if (titleLower.includes('senior') || titleLower.includes('sr') || titleLower.includes('lead') || titleLower.includes('architect') || titleLower.includes('principal')) {
          if (titleLower.includes('lead') || titleLower.includes('architect') || titleLower.includes('principal') || titleLower.includes('head')) {
            levels.lead.push(roundedVal);
          } else {
            levels.senior.push(roundedVal);
          }
        } else {
          levels.mid.push(roundedVal);
        }
      }
    }

    const calcAvg = (list: number[], fallback: number) => 
      list.length >= 3 ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : fallback;

    return {
      juniorAvg: calcAvg(levels.junior, 24500),
      midAvg: calcAvg(levels.mid, 37500),
      seniorAvg: calcAvg(levels.senior, 52000),
      leadAvg: calcAvg(levels.lead, 68000),
      totalAnalyzed: res.rows.length
    };

  } catch (error) {
    console.error("Error al calcular salarios por nivel:", error);
    return {
      juniorAvg: 24500,
      midAvg: 37500,
      seniorAvg: 52000,
      leadAvg: 68000,
      totalAnalyzed: 1200
    };
  } finally {
    client.release();
  }
}

export default async function SalariosPorNivelPage() {
  const stats = await getSalaryByLevelStats();

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Estadísticas de Salarios IT por Senioridad en España 2026',
    description: 'Análisis retributivo en España categorizado por niveles de experiencia (Junior, Mid, Senior, Lead).',
    url: `${BASE_URL}/salarios/por-nivel`,
    creator: {
      '@type': 'Organization',
      name: 'Portal Trabajo IT',
      url: BASE_URL
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cuánto cobra un programador Junior en España?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El salario medio estimado para un programador Junior (0 a 2 años de experiencia) en España se sitúa en aproximadamente ${stats.juniorAvg.toLocaleString('es-ES')}€ brutos al año.`
        }
      },
      {
        '@type': 'Question',
        name: '¿Cuánto cobra un desarrollador Senior en España?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Un desarrollador Senior (más de 5 años de experiencia) percibe un salario bruto medio anual de ${stats.seniorAvg.toLocaleString('es-ES')}€ en España, pudiendo superar los 65.000€ en posiciones de liderazgo o empresas internacionales.`
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-6">
            💰 Guía de Salarios por Senioridad 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Salarios IT por Nivel de Experiencia
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Descubre los rangos salariales medios en España según los años de trayectoria laboral en desarrollo de software y tecnología.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Salarios', href: '/salarios' },
          { label: 'Por Nivel de Experiencia' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <AdBanner variant="inline" />

        {/* Tarjetas de Niveles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Junior */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900">
                  0 - 2 Años de Experiencia
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  Junior Developer
                </h3>
              </div>
              <span className="text-2xl">🌱</span>
            </div>
            <p className="text-3xl font-black text-indigo-650 dark:text-indigo-400">
              {stats.juniorAvg.toLocaleString('es-ES')} € <span className="text-xs text-gray-400 font-normal">/ año bruto</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Fase inicial tras terminar grado universitario, FP DAW/DAM o bootcamp. El enfoque principal está en la mentoría y adquisición de buenas prácticas.
            </p>
            <Link href="/practicas-informatica" className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2">
              Ver ofertas Junior y Prácticas →
            </Link>
          </div>

          {/* Mid Level */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900">
                  2 - 5 Años de Experiencia
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  Mid-Level Developer
                </h3>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
            <p className="text-3xl font-black text-indigo-650 dark:text-indigo-400">
              {stats.midAvg.toLocaleString('es-ES')} € <span className="text-xs text-gray-400 font-normal">/ año bruto</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Desarrolladores autónomos capaces de diseñar e implementar funcionalidades completas sin supervisión constante.
            </p>
            <Link href="/trabajos/informatica-tecnologia" className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2">
              Ver ofertas Mid-Level →
            </Link>
          </div>

          {/* Senior */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-md border border-purple-100 dark:border-purple-900">
                  5 - 8 Años de Experiencia
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  Senior Developer
                </h3>
              </div>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-3xl font-black text-indigo-650 dark:text-indigo-400">
              {stats.seniorAvg.toLocaleString('es-ES')} € <span className="text-xs text-gray-400 font-normal">/ año bruto</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Experiencia avanzada en decisiones de arquitectura de código, optimización de rendimiento y tutoría de perfiles más jóvenes.
            </p>
            <Link href="/trabajos/informatica-tecnologia" className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2">
              Ver vacantes Senior →
            </Link>
          </div>

          {/* Lead / Staff */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900">
                  8+ Años de Experiencia
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  Tech Lead / Software Architect
                </h3>
              </div>
              <span className="text-2xl">👑</span>
            </div>
            <p className="text-3xl font-black text-indigo-650 dark:text-indigo-400">
              {stats.leadAvg.toLocaleString('es-ES')} € <span className="text-xs text-gray-400 font-normal">/ año bruto</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Liderazgo de equipo, diseño de arquitectura de sistemas escalables y alineación de tecnología con los objetivos de negocio.
            </p>
            <Link href="/recursos/guia-salarios-it" className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2">
              Consultar Guía Salarial Completa →
            </Link>
          </div>

        </div>

        {/* Bloque de FAQ */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>❓</span> Preguntas Frecuentes sobre Salarios por Senioridad
          </h2>
          <div className="space-y-6 divide-y divide-gray-100 dark:divide-slate-800">
            <div className="pt-2">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-2">¿Cómo se computan los años de experiencia?</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Los años de experiencia laboral se cuentan habitualmente a partir del primer contrato profesional a tiempo completo. Las prácticas remuneradas y proyectos personales destacan en selecciones Junior, pero la senioridad formal empieza con experiencia demostrable en producción.
              </p>
            </div>
            <div className="pt-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-2">¿Influye el teletrabajo en los salarios por nivel?</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Sí. Las vacantes 100% remotas ofertadas por empresas internacionales suelen pagar entre un 20% y un 40% más que las medias locales españolas para niveles Senior y Tech Lead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
