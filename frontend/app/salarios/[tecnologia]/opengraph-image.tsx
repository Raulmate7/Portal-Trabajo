import { ImageResponse } from 'next/og';
import pool from '@/lib/db';
import { TECH_DETAILS } from '@/lib/salarios';

export const alt = 'Radiografía Salarial IT en España';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400;

type Props = {
  params: Promise<{ tecnologia: string }>;
};

async function getStats(techSlug: string) {
  const techInfo = TECH_DETAILS[techSlug];
  const label = techInfo?.label || techSlug.toUpperCase();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT salary, salary_min, salary_max
       FROM jobs
       WHERE title ILIKE $1
         AND (
           (salary_min IS NOT NULL AND salary_min > 0)
           OR (salary IS NOT NULL AND salary != 'Consultar' AND salary != '')
         )
       LIMIT 500`,
      [`%${label}%`]
    );

    const salaries: number[] = [];
    for (const row of res.rows) {
      let val = 0;
      const sMin = row.salary_min ? Number(row.salary_min) : 0;
      const sMax = row.salary_max ? Number(row.salary_max) : 0;
      if (sMin > 0 && sMax >= sMin) {
        val = (sMin + sMax) / 2;
      } else if (sMin > 0) {
        val = sMin;
      } else {
        const cleanStr = (row.salary || '').toString().replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
        const numbers = cleanStr.match(/\d+(\.\d+)?/g);
        if (!numbers || numbers.length === 0) continue;
        const parsed = numbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n));
        if (parsed.length >= 2) val = (parsed[0] + parsed[1]) / 2;
        else if (parsed.length === 1) val = parsed[0];
      }
      if (val > 0 && val < 5000) val *= 12;
      if (val >= 15000 && val <= 150000) salaries.push(Math.round(val));
    }

    if (salaries.length === 0) {
      return { label, count: 0, average: 42000, p25: 28000, median: 40000, p75: 56000 };
    }
    salaries.sort((a, b) => a - b);
    const average = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    return {
      label,
      count: salaries.length,
      average,
      p25: salaries[Math.floor(salaries.length * 0.25)],
      median: salaries[Math.floor(salaries.length * 0.5)],
      p75: salaries[Math.floor(salaries.length * 0.75)],
    };
  } catch {
    return { label, count: 0, average: 42000, p25: 28000, median: 40000, p75: 56000 };
  } finally {
    client.release();
  }
}

export default async function Image({ params }: Props) {
  const { tecnologia } = await params;
  const stats = await getStats(tecnologia.toLowerCase());
  const year = new Date().getFullYear();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #2e1065 100%)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(251, 191, 36, 0.14)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: '999px',
              padding: '10px 22px',
              color: '#fbbf24',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {`PORTAL EMPLEO IT · SALARIOS ${year}`}
          </div>
          <div style={{ display: 'flex', color: '#cbd5e1', fontSize: '22px', fontWeight: 600 }}>
            {stats.count > 0 ? `Basado en ${stats.count} ofertas reales` : 'Datos del mercado español'}
          </div>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', fontSize: '42px', fontWeight: 700, color: '#e2e8f0' }}>
            {`Sueldo ${stats.label} en España`}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px' }}>
            <span style={{ fontSize: '104px', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
              {`${stats.average.toLocaleString('es-ES')}€`}
            </span>
            <span style={{ fontSize: '34px', fontWeight: 600, color: '#94a3b8' }}>
              / año bruto medio
            </span>
          </div>
        </div>

        {/* Percentiles */}
        <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
          {[
            { title: 'P25 · JUNIOR', value: `${stats.p25.toLocaleString('es-ES')}€`, accent: '#38bdf8' },
            { title: 'MEDIANA (P50)', value: `${stats.median.toLocaleString('es-ES')}€`, accent: '#a78bfa' },
            { title: 'P75 · SENIOR', value: `${stats.p75.toLocaleString('es-ES')}€`, accent: '#34d399' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '18px',
                padding: '22px 26px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 700, color: item.accent, letterSpacing: '0.06em' }}>
                {item.title}
              </span>
              <span style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
