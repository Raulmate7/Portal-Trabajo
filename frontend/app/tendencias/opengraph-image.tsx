import { ImageResponse } from 'next/og';
import pool from '@/lib/db';

export const alt = 'Tendencias del Mercado Laboral IT en España';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400;

async function getMarketSnapshot() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' THEN 1 ELSE 0 END) AS remote_cnt,
        SUM(CASE WHEN title ILIKE '%python%' OR description_snippet ILIKE '%python%' THEN 1 ELSE 0 END) AS python_cnt,
        SUM(CASE WHEN title ILIKE '%react%' OR description_snippet ILIKE '%react%' THEN 1 ELSE 0 END) AS react_cnt,
        SUM(CASE WHEN title ILIKE '%java%' OR description_snippet ILIKE '%java%' THEN 1 ELSE 0 END) AS java_cnt,
        SUM(CASE WHEN title ILIKE '%aws%' OR description_snippet ILIKE '%aws%' THEN 1 ELSE 0 END) AS aws_cnt
      FROM jobs
      WHERE is_active = TRUE
    `);
    const row = res.rows[0] || {};
    const total = parseInt(row.total || '0', 10);
    const remoteCnt = parseInt(row.remote_cnt || '0', 10);
    const remotePct = total > 0 ? Math.round((remoteCnt / total) * 100) : 0;

    const stacks = [
      { name: 'Python', count: parseInt(row.python_cnt || '0', 10) },
      { name: 'React', count: parseInt(row.react_cnt || '0', 10) },
      { name: 'Java', count: parseInt(row.java_cnt || '0', 10) },
      { name: 'AWS', count: parseInt(row.aws_cnt || '0', 10) },
    ]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { total, remotePct, stacks };
  } catch {
    return {
      total: 0,
      remotePct: 35,
      stacks: [
        { name: 'Python', count: 0 },
        { name: 'Java', count: 0 },
        { name: 'React', count: 0 },
      ],
    };
  } finally {
    client.release();
  }
}

export default async function Image() {
  const snapshot = await getMarketSnapshot();
  const now = new Date();
  const mes = now.toLocaleDateString('es-ES', { month: 'long' });
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
  const year = now.getFullYear();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(52, 211, 153, 0.14)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              borderRadius: '999px',
              padding: '10px 22px',
              color: '#34d399',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {`PULSO DEL MERCADO IT · ${mesCap.toUpperCase()} ${year}`}
          </div>
          <div style={{ display: 'flex', color: '#cbd5e1', fontSize: '22px', fontWeight: 600 }}>
            Portal Empleo IT España
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', fontSize: '46px', fontWeight: 800, color: '#ffffff' }}>
            Tendencias de Empleo Tecnológico en España
          </div>
          <div style={{ display: 'flex', fontSize: '26px', color: '#94a3b8' }}>
            Vacantes activas en tiempo real, teletrabajo y tecnologías más demandadas
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              borderRadius: '20px',
              padding: '24px 28px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>VACANTES ACTIVAS</span>
            <span style={{ fontSize: '52px', fontWeight: 800, color: '#ffffff' }}>
              {`+${snapshot.total.toLocaleString('es-ES')}`}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: '24px 28px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>TASA TELETRABAJO</span>
            <span style={{ fontSize: '52px', fontWeight: 800, color: '#ffffff' }}>
              {`${snapshot.remotePct}%`}
            </span>
          </div>

          <div
            style={{
              flex: 1.3,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              borderRadius: '20px',
              padding: '24px 28px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#c4b5fd' }}>TOP STACKS DEMANDADOS</span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {snapshot.stacks.map((s) => (
                <span
                  key={s.name}
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'rgba(167, 139, 250, 0.18)',
                    borderRadius: '10px',
                    padding: '6px 14px',
                  }}
                >
                  {s.count > 0 ? `${s.name} (${s.count})` : s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
