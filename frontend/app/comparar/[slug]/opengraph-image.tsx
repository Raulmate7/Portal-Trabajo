import { ImageResponse } from 'next/og';
import pool from '@/lib/db';

export const alt = 'Comparativa de Mercado IT en España';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400;

type Props = {
  params: Promise<{ slug: string }>;
};

const CITY_KEYS = new Set(['madrid', 'barcelona', 'valencia', 'malaga', 'bilbao', 'sevilla', 'remoto']);

const LABELS: Record<string, string> = {
  react: 'React', angular: 'Angular', vue: 'Vue', node: 'Node.js', python: 'Python',
  java: 'Java', php: 'PHP', csharp: 'C# / .NET', go: 'Go', rust: 'Rust',
  aws: 'AWS', azure: 'Azure', gcp: 'Google Cloud', kubernetes: 'Kubernetes',
  typescript: 'TypeScript', javascript: 'JavaScript', flutter: 'Flutter',
  kotlin: 'Kotlin', swift: 'Swift', sql: 'SQL', docker: 'Docker',
  nextjs: 'Next.js', devops: 'DevOps', sre: 'SRE', terraform: 'Terraform',
  madrid: 'Madrid', barcelona: 'Barcelona', valencia: 'Valencia',
  malaga: 'Málaga', bilbao: 'Bilbao', sevilla: 'Sevilla', remoto: 'Remoto',
};

async function getEntityMetrics(rawKey: string) {
  const key = rawKey.toLowerCase();
  const label = LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
  const isCity = CITY_KEYS.has(key);
  const pattern = `%${key === 'remoto' ? 'remoto' : label}%`;

  const client = await pool.connect();
  try {
    const cond = isCity
      ? `(location ILIKE $1 OR title ILIKE $2)`
      : `(title ILIKE $1 OR description_snippet ILIKE $2)`;

    const res = await client.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' THEN 1 ELSE 0 END) AS remote_cnt
       FROM jobs
       WHERE is_active = TRUE AND ${cond}`,
      [pattern, pattern]
    );
    const total = parseInt(res.rows[0]?.total || '0', 10);
    const remoteCnt = parseInt(res.rows[0]?.remote_cnt || '0', 10);
    const remotePct = total > 0 ? Math.round((remoteCnt / total) * 100) : 0;

    const salRes = await client.query(
      `SELECT salary_min, salary_max, salary
       FROM jobs
       WHERE is_active = TRUE AND ${cond}
         AND ((salary_min IS NOT NULL AND salary_min > 0) OR (salary IS NOT NULL AND salary != 'Consultar' AND salary != ''))
       LIMIT 150`,
      [pattern, pattern]
    );

    const salaries: number[] = [];
    for (const r of salRes.rows) {
      let val = 0;
      const sMin = r.salary_min ? Number(r.salary_min) : 0;
      const sMax = r.salary_max ? Number(r.salary_max) : 0;
      if (sMin > 0 && sMax >= sMin) val = (sMin + sMax) / 2;
      else if (sMin > 0) val = sMin;
      else {
        const clean = (r.salary || '').toString().replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
        const nums = clean.match(/\d+(\.\d+)?/g);
        if (!nums) continue;
        const parsed = nums.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n));
        if (parsed.length >= 2) val = (parsed[0] + parsed[1]) / 2;
        else if (parsed.length === 1) val = parsed[0];
      }
      if (val > 0 && val < 5000) val *= 12;
      if (val >= 15000 && val <= 150000) salaries.push(Math.round(val));
    }
    const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 41000;
    return { label, total, remotePct, avgSalary };
  } catch {
    return { label, total: 0, remotePct: 0, avgSalary: 41000 };
  } finally {
    client.release();
  }
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const parts = slug.split('-vs-');
  const k1 = parts[0] || 'python';
  const k2 = parts[1] || 'java';
  const [m1, m2] = await Promise.all([getEntityMetrics(k1), getEntityMetrics(k2)]);
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
          background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #311042 100%)',
          padding: '60px 68px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(167, 139, 250, 0.16)',
              border: '1px solid rgba(167, 139, 250, 0.45)',
              borderRadius: '999px',
              padding: '8px 22px',
              color: '#c4b5fd',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {`COMPARATIVA MERCADO IT · ${year}`}
          </div>
          <div style={{ display: 'flex', color: '#94a3b8', fontSize: '22px', fontWeight: 600 }}>
            Portal Empleo IT España
          </div>
        </div>

        {/* Versus Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', width: '100%' }}>
          <span style={{ fontSize: '64px', fontWeight: 800, color: '#38bdf8' }}>{m1.label}</span>
          <span
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#fbbf24',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: '999px',
              padding: '10px 22px',
            }}
          >
            VS
          </span>
          <span style={{ fontSize: '64px', fontWeight: 800, color: '#34d399' }}>{m2.label}</span>
        </div>

        {/* Comparison Cards */}
        <div style={{ display: 'flex', gap: '28px', width: '100%' }}>
          {[
            { data: m1, accent: '#38bdf8' },
            { data: m2, accent: '#34d399' },
          ].map(({ data, accent }) => (
            <div
              key={data.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${accent}55`,
                borderRadius: '20px',
                padding: '28px 32px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', color: '#94a3b8', fontWeight: 600 }}>Salario medio</span>
                <span style={{ fontSize: '34px', fontWeight: 800, color: '#fbbf24' }}>
                  {`${data.avgSalary.toLocaleString('es-ES')}€`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', color: '#94a3b8', fontWeight: 600 }}>Ofertas activas</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: accent }}>
                  {data.total.toLocaleString('es-ES')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', color: '#94a3b8', fontWeight: 600 }}>Teletrabajo</span>
                <span style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff' }}>
                  {`${data.remotePct}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
