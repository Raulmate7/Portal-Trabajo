import { ImageResponse } from 'next/og';
import pool from '@/lib/db';

export const alt = 'Empleo IT y Salarios';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

type Props = {
  params: Promise<{ slug: string }>;
};

async function getCompanyData(slug: string) {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT company, salary, location FROM jobs 
      WHERE REGEXP_REPLACE(LOWER(company), '[^a-z0-9]+', '-') = $1 
         OR LOWER(company) = REPLACE($1, '-', ' ')
      ORDER BY created_at DESC
    `;
    const res = await client.query(sql, [slug]);
    return res.rows;
  } catch (error) {
    console.error("Error loading company jobs for OG Image:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const jobs = await getCompanyData(slug);

  const companyName = jobs.length > 0 ? jobs[0].company : 'Empresa Tecnológica';
  const totalJobs = jobs.length;

  // Compute stats
  let countWithSalary = 0;
  let sumSalary = 0;
  let remoteCount = 0;

  for (const job of jobs) {
    const text = `${job.title || ''} ${job.location || ''}`.toLowerCase();
    if (text.includes('remoto') || text.includes('teletrabajo') || text.includes('remote')) {
      remoteCount++;
    }

    if (job.salary) {
      const cleanStr = job.salary.replace(/\./g, '').replace(/\s/g, '');
      const numbers = cleanStr.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const parsedNums = numbers.map((n: string) => parseInt(n));
        let val = 0;
        if (parsedNums.length >= 2) {
          val = (parsedNums[0] + parsedNums[1]) / 2;
        } else {
          val = parsedNums[0];
        }

        if (val > 0 && val < 5000) {
          val = val * 12;
        }

        if (val >= 12000 && val <= 150000) {
          sumSalary += val;
          countWithSalary++;
        }
      }
    }
  }

  const averageSalary = countWithSalary > 0 ? `${Math.round(sumSalary / countWithSalary).toLocaleString('es-ES')}€` : 'N/D';
  const remoteRatio = totalJobs > 0 ? `${Math.round((remoteCount / totalJobs) * 100)}%` : '0%';

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
            background: 'rgba(139, 92, 246, 0.1)',
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
          <span style={{ fontSize: '32px' }}>🏢</span>
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
            PORTAL TRABAJO IT · EMPRESAS
          </span>
        </div>

        {/* Titulo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '1000px',
            margin: '20px 0',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#818cf8',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Perfil y Estadísticas
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
            Trabajar en {companyName}
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 28px',
              minWidth: '220px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', marginBottom: '4px' }}>
              💰 Salario Medio
            </span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>
              {averageSalary}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 28px',
              minWidth: '220px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', marginBottom: '4px' }}>
              🌐 Teletrabajo
            </span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#a78bfa' }}>
              {remoteRatio}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 28px',
              minWidth: '220px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', marginBottom: '4px' }}>
              💼 Ofertas Activas
            </span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
              {totalJobs} {totalJobs === 1 ? 'vacante' : 'vacantes'}
            </span>
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
            Ver Ofertas →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
