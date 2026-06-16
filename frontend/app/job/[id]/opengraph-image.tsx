import { ImageResponse } from 'next/og';
import pool from '@/lib/db';
import { getNumericId } from '@/lib/slug';

export const alt = 'Oferta de Empleo IT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = getNumericId(id);

  let job = null;
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT title, company, location, salary FROM jobs WHERE id = $1",
      [numericId]
    );
    job = res.rows[0];
  } catch (error) {
    console.error("Error cargando oferta para OG Image:", error);
  } finally {
    client.release();
  }

  const title = job ? (job.title_es || job.title) : 'Oferta de Empleo IT';
  const company = job ? job.company : 'Portal Trabajo IT';
  const location = job ? job.location : 'España';
  const salary = job && job.salary && job.salary !== 'Consultar' ? job.salary : 'Sueldo Competitivo';

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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
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
          <span style={{ fontSize: '32px' }}>🚀</span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '1px',
              background: 'linear-gradient(to right, #818cf8, #c084fc)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            PORTAL TRABAJO IT
          </span>
        </div>

        {/* Cuerpo principal (Detalle del Puesto) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '1000px',
            margin: '40px 0',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#fbbf24',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {company}
          </span>
          <h1
            style={{
              fontSize: '60px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: 'white',
              margin: 0,
              padding: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Fila inferior con metadatos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#e2e8f0',
            }}
          >
            <span style={{ marginRight: '8px' }}>📍</span>
            {location}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#fbbf24',
            }}
          >
            <span style={{ marginRight: '8px' }}>💰</span>
            {salary}
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              borderRadius: '12px',
              padding: '12px 28px',
              fontSize: '20px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            Postularse →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
