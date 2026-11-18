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
const PROXY_TOKEN = process.env.DB_PROXY_TOKEN || '';

/** Extrae de forma robusta el ID (numérico o UUID) de un slug o identificador */
function extractJobId(slugOrId: string): string {
  if (!slugOrId) return '';
  const trimmed = slugOrId.trim();

  // 1. Si contiene un UUID v4 (ej. titulo-empresa-550e8400-e29b-41d4-a716-446655440000 o directo)
  const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];

  // 2. Si tiene formato con sufijo numérico (ej. developer-react-acme-123 → 123)
  const numericSuffixMatch = trimmed.match(/-(\d+)$/);
  if (numericSuffixMatch) return numericSuffixMatch[1];

  // 3. Si es un entero directo o ID simple
  if (/^\d+$/.test(trimmed)) return trimmed;

  return trimmed;
}

async function getJobById(id: string) {
  if (!PROXY_TOKEN || !id) {
    return null;
  }
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
  const resolvedId = extractJobId(id);

  let job = resolvedId ? await getJobById(resolvedId) : null;
  // Fallback si el ID guardado en BD era el slug completo
  if (!job && resolvedId !== id) {
    job = await getJobById(id);
  }

  const safeText = (v: unknown, fallback: string, maxLen: number) => {
    const cleaned = String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    return (cleaned || fallback).slice(0, maxLen);
  };

  const title = job ? safeText(job.title_es || job.title, 'Oferta de Empleo IT', 110) : 'Oferta de Empleo IT';
  const company = job ? safeText(job.company, 'Portal Trabajo IT', 60) : 'Portal Trabajo IT';
  const location = job ? safeText(job.location, 'España', 50) : 'España';
  const salary = job && job.salary && job.salary !== 'Consultar' ? safeText(job.salary, 'Sueldo Competitivo', 40) : 'Sueldo Competitivo';

  try {
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
          {/* Cabecera / Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#a5b4fc',
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
            Postularse
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#0f172a',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            padding: '60px',
          }}
        >
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#a5b4fc' }}>PORTAL TRABAJO IT</div>
          <div style={{ fontSize: '28px', marginTop: '20px', textAlign: 'center' }}>Ofertas de Empleo Tecnológico en España</div>
        </div>
      ),
      { ...size }
    );
  }
}
