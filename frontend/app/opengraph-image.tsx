import { ImageResponse } from 'next/og';
import pool from '@/lib/db';

export const alt = 'Portal Trabajo IT — Ofertas de Empleo Tecnológico';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400; // Cache 24 horas (CDN)


async function getJobsCount() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE");
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error loading jobs count for Home OG Image:", error);
    return 0;
  } finally {
    client.release();
  }
}

export default async function Image() {
  const totalJobs = await getJobsCount();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2e1065 100%)',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Decoraciones de fondo */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            filter: 'blur(50px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.1)',
            filter: 'blur(40px)',
          }}
        />

        {/* Cabecera / Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '36px' }}>🚀</span>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 900,
              letterSpacing: '1px',
              background: 'linear-gradient(to right, #818cf8, #c084fc)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            PORTAL TRABAJO IT
          </span>
        </div>

        {/* Sección principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '1000px',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#fbbf24',
              textTransform: 'uppercase',
              letterSpacing: '3px',
            }}
          >
            Agregador de Empleo de Programación
          </span>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: 'white',
              margin: 0,
              padding: 0,
            }}
          >
            Encuentra tu próximo puesto tecnológico en España
          </h1>
        </div>

        {/* Fila inferior con el recuento total y stacks */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            width: '100%',
          }}
        >
          {totalJobs > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: '16px',
                padding: '16px 28px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24' }}>
                ✨ {totalJobs} vacantes activas hoy
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 28px',
              color: '#e2e8f0',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            React · Java · Python · Node · Cloud
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '20px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            Buscar Trabajo →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
