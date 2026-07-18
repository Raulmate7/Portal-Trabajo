import { ImageResponse } from 'next/og';

// Edge Runtime: se sirve desde el CDN de Vercel más cercano al crawler.
// No importamos 'pool' (mysql2) ya que no es compatible con Edge.
// En su lugar llamamos directamente al proxy HTTP.
export const runtime = 'edge';
export const revalidate = 86400; // Cache 24 horas (CDN)


export const alt = 'Oferta de Empleo IT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const PROXY_URL = process.env.DB_PROXY_URL || 'https://mail.portalempleoit.com/db_proxy.php';
const PROXY_TOKEN = process.env.DB_PROXY_TOKEN || 'a6f021f1d19d675b8e998a44d187764d';

/** Extrae el ID numérico de un slug como "developer-react-acme-123" → 123 */
function extractNumericId(slug: string): string | null {
  // Formato: cualquier-texto-NUMEROID al final
  const match = slug.match(/(\d+)$/);
  return match ? match[1] : slug; // Si no hay match, intentar usar el slug tal cual
}

async function getJobById(id: string) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': PROXY_TOKEN,
      },
      body: JSON.stringify({
        sql: 'SELECT title, title_es, company, location, salary FROM jobs WHERE id = ?',
        params: [id],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = extractNumericId(id);

  const job = numericId ? await getJobById(numericId) : null;

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
