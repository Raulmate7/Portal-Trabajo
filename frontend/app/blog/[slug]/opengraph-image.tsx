import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';

export const alt = 'Blog de Empleo IT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400; // Cache 24 horas (CDN)


type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post ? post.title : 'Blog de Empleo Tech';
  const author = post ? post.author : 'Equipo Portal Empleo';
  const date = post ? new Date(post.date).toLocaleDateString('es-ES') : '';

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
            background: 'rgba(219, 39, 119, 0.1)',
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
          <span style={{ fontSize: '32px' }}>📝</span>
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
            PORTAL TRABAJO IT · BLOG
          </span>
        </div>

        {/* Contenido Principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '1000px',
            margin: '40px 0',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.2,
              color: 'white',
              margin: 0,
              padding: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Fila inferior con info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            width: '100%',
          }}
        >
          {date && (
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
              <span style={{ marginRight: '8px' }}>📅</span>
              {date}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#a5b4fc',
            }}
          >
            <span style={{ marginRight: '8px' }}>✍️</span>
            {author}
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
            Leer Artículo →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
