import { ImageResponse } from 'next/og';
import { GLOSSARY_TERMS } from '@/lib/glosario';

export const alt = 'Glosario Tecnológico IT | Portal Trabajo';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400; // Cache 24h

export default async function Image({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const item = GLOSSARY_TERMS.find((t) => t.slug === term);

  const termName = item ? item.term : term.toUpperCase();
  const definitionSnippet = item 
    ? (item.definition.length > 120 ? item.definition.slice(0, 120) + '...' : item.definition)
    : 'Diccionario de términos tecnológicos para programadores.';

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
          background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #180e29 100%)',
          padding: '70px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Cabecera / Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>📖</span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '1px',
              background: 'linear-gradient(to right, #818cf8, #c084fc)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            GLOSARIO TRABAJO IT
          </span>
        </div>

        {/* Título y Definición */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1050px' }}>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#38bdf8',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            ¿Qué es y qué significa?
          </span>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: 'white',
              margin: 0,
            }}
          >
            {termName}
          </h1>
          <p style={{ fontSize: '22px', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
            "{definitionSnippet}"
          </p>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '14px',
              padding: '14px 24px',
              color: '#38bdf8',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            💡 Definición técnica + Vacantes de Empleo
          </div>
          <div
            style={{
              marginLeft: 'auto',
              background: 'linear-gradient(to right, #0284c7, #4f46e5)',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Leer Definición →
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
