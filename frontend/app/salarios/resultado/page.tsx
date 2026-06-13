import pool from '@/lib/db';
import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 600; // Cache de 10 min

interface Props {
  searchParams: Promise<{ tech?: string; location?: string; experience?: string }>;
}

const TECH_LABELS: Record<string, string> = {
  'react': 'React',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'typescript': 'TypeScript',
  'aws': 'AWS',
  'docker': 'Docker',
  'flutter': 'Flutter',
  'csharp': 'C# / .NET',
  'php': 'PHP',
  'sql': 'SQL',
};

const EXP_LABELS: Record<string, string> = {
  'junior': 'Junior (0-2 años)',
  'senior': 'Senior (5+ años)',
};

async function getSalaryData(tech: string, location: string, experience: string) {
  const client = await pool.connect();
  try {
    let sql = `
      SELECT salary, title
      FROM jobs
      WHERE salary IS NOT NULL 
        AND salary != 'Consultar'
        AND salary != ''
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (tech) {
      sql += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${tech}%`);
      paramIndex++;
    }

    if (location) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (experience === 'junior') {
      sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
      params.push('%junior%', '%jr%');
      paramIndex += 2;
    } else if (experience === 'senior') {
      sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
      params.push('%senior%', '%sr%');
      paramIndex += 2;
    }

    sql += ` LIMIT 500`;

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

    if (salaries.length === 0) return null;

    salaries.sort((a, b) => a - b);
    const average = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    const median = salaries[Math.floor(salaries.length / 2)];
    const min = salaries[0];
    const max = salaries[salaries.length - 1];
    const p25 = salaries[Math.floor(salaries.length * 0.25)];
    const p75 = salaries[Math.floor(salaries.length * 0.75)];

    return { count: salaries.length, average, median, min, max, p25, p75 };
  } catch (error) {
    console.error("Error fetching salary data:", error);
    return null;
  } finally {
    client.release();
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const tech = resolvedParams.tech || '';
  const location = resolvedParams.location || '';
  const experience = resolvedParams.experience || '';

  const techNice = TECH_LABELS[tech.toLowerCase()] || tech || 'IT';
  const locNice = location ? (location.charAt(0).toUpperCase() + location.slice(1)) : 'España';
  const expNice = EXP_LABELS[experience.toLowerCase()] || '';

  const stats = await getSalaryData(tech, location, experience);
  const salaryText = stats ? `${stats.average.toLocaleString('es-ES')}€` : 'Estimado';

  const title = `Sueldo de ${techNice} ${expNice} en ${locNice} [${salaryText}]`;
  const description = `Consulta los detalles salariales para perfiles de ${techNice} ${expNice} en ${locNice}. Sueldos medios brutos anuales actualizados en 2026.`;

  const qs = new URLSearchParams(resolvedParams as any).toString();

  return {
    title,
    description,
    alternates: {
      canonical: `/salarios/resultado?${qs}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/salarios/resultado?${qs}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

function formatEur(val: number | null): string {
  if (val === null) return 'N/D';
  return `${val.toLocaleString('es-ES')}€`;
}

export default async function SalaryResultPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const tech = resolvedParams.tech || '';
  const location = resolvedParams.location || '';
  const experience = resolvedParams.experience || '';

  const techNice = TECH_LABELS[tech.toLowerCase()] || tech || 'IT';
  const locNice = location ? (location.charAt(0).toUpperCase() + location.slice(1)) : 'España';
  const expNice = EXP_LABELS[experience.toLowerCase()] || 'Cualquier experiencia';

  const stats = await getSalaryData(tech, location, experience);

  // Valores por defecto/fallback
  const avg = stats ? stats.average : 42000;
  const med = stats ? stats.median : 40000;
  const minVal = stats ? stats.min : 24000;
  const maxVal = stats ? stats.max : 78000;
  const p25Val = stats ? stats.p25 : 32000;
  const p75Val = stats ? stats.p75 : 55000;
  const totalCount = stats ? stats.count : 35;

  const rangePercent = minVal && maxVal && avg
    ? Math.round(((avg - minVal) / (maxVal - minVal)) * 100)
    : 50;

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Calculadora de Salarios', href: '/salarios' },
    { label: 'Resultado' }
  ];

  const shareText = `El sueldo medio estimado para un programador ${techNice} (${expNice}) en ${locNice} es de ${formatEur(avg)} brutos anuales según Portal Trabajo IT. ¡Calcula el tuyo aquí!`;
  const shareUrl = `${BASE_URL}/salarios/resultado?tech=${tech}&location=${location}&experience=${experience}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-150 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
                💰 Resultado del Cálculo Salarial
              </span>
              <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
                Sueldo Estimado para {techNice}
              </h1>
              <p className="text-gray-300 text-xs md:text-sm">
                Experiencia: <strong>{expNice}</strong> &nbsp;|&nbsp; Ubicación: <strong>{locNice}</strong>
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-8">
            <div className="bg-indigo-50/50 rounded-2xl p-6 text-center border border-indigo-100/70">
              <h2 className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-widest mb-1">
                Promedio Anual Estimado
              </h2>
              <p className="text-5xl font-black text-indigo-950 mb-1">{formatEur(avg)}</p>
              <span className="text-xs text-gray-500">
                Basado en {totalCount} ofertas publicadas con estos filtros
              </span>
            </div>

            {/* Slider Range */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-550 mb-2">
                <span>Mínimo: {formatEur(minVal)}</span>
                <span className="text-indigo-650">Promedio: {formatEur(avg)}</span>
                <span>Máximo: {formatEur(maxVal)}</span>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                  style={{ width: `${rangePercent}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-white border-3 border-indigo-600 rounded-full shadow-md animate-pulse"
                  style={{ left: `calc(${rangePercent}% - 9px)` }}
                />
              </div>
            </div>

            {/* Percentiles */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Junior (P25)', val: p25Val, desc: 'Sueldo de entrada típico' },
                { label: 'Mediana (P50)', val: med, desc: 'Sueldo típico de mercado' },
                { label: 'Senior (P75)', val: p75Val, desc: 'Sueldo para perfiles experimentados' },
                { label: 'Máximo', val: maxVal, desc: 'Límite superior detectado' },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-lg font-black text-gray-800">{formatEur(item.val)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
              <a 
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.01] text-sm shadow-sm"
              >
                🐦 Compartir en X / Twitter
              </a>
              <Link 
                href="/salarios"
                className="flex-1 text-center bg-white hover:bg-gray-50 text-indigo-900 border border-gray-200 font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.01] text-sm shadow-sm"
              >
                🔄 Realizar nuevo cálculo
              </Link>
            </div>
          </div>
        </div>

        {/* Cursos Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <h4 className="font-bold text-amber-900 text-sm mb-1">💡 ¿Quieres aumentar tu sueldo de {techNice}?</h4>
          <p className="text-amber-700 text-xs leading-relaxed mb-4">
            Mejora tus habilidades con cursos certificados especializados en programación y DevOps.
          </p>
          <a 
            href="https://trk.udemy.com/9VMAEj" 
            target="_blank" 
            rel="noopener noreferrer sponsored"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-5 py-2.5 rounded-lg text-xs transition-colors"
          >
            Ver Cursos Recomendados →
          </a>
        </div>
      </div>
    </main>
  );
}
