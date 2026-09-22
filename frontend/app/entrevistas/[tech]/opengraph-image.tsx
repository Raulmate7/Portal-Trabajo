import { ImageResponse } from 'next/og';
import { getInterviewTech } from '@/lib/entrevistas';

export const alt = 'Preguntas de Entrevista Técnica | Portal Trabajo IT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400; // Cache 24h

export default async function Image({ params }: { params: Promise<{ tech: string }> }) {
  const { tech } = await params;
  const item = getInterviewTech(tech);

  const techName = item ? item.name : tech.toUpperCase();
  const emoji = item ? item.emoji : '💻';
  const qCount = item ? item.questions.length : 20;

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
          padding: '70px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Cabecera / Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>{emoji}</span>
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
            PORTAL TRABAJO IT · ENTREVISTAS
          </span>
        </div>

        {/* Título Principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1050px' }}>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#fbbf24',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Preguntas y Respuestas Técnicas 2026
          </span>
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: 'white',
              margin: 0,
            }}
          >
            {qCount}+ Preguntas de Entrevista Técnica de {techName}
          </h1>
          <p style={{ fontSize: '22px', color: '#94a3b8', margin: 0 }}>
            Junior, Mid y Senior · Respuestas detalladas con ejemplos de código
          </p>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '14px',
              padding: '14px 24px',
              color: '#818cf8',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            ✅ Respuestas explicadas paso a paso
          </div>
          <div
            style={{
              marginLeft: 'auto',
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Preparar Entrevista →
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
