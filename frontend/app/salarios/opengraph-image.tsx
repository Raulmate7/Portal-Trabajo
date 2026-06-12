import { ImageResponse } from 'next/og';
import pool from '@/lib/db';

export const alt = 'Calculadora de Salarios IT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

async function getAverageITSalary() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT salary FROM jobs WHERE is_active = TRUE AND salary IS NOT NULL AND salary != 'Consultar'");
    const jobs = res.rows;
    
    let countWithSalary = 0;
    let sumSalary = 0;

    for (const job of jobs) {
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

    const averageSalary = countWithSalary > 0 ? Math.round(sumSalary / countWithSalary) : 38500;
    return { averageSalary, totalCount: countWithSalary };
  } catch (error) {
    console.error("Error calculating average salary for OG:", error);
    return { averageSalary: 38500, totalCount: 0 };
  } finally {
    client.release();
  }
}

export default async function Image() {
  const { averageSalary, totalCount } = await getAverageITSalary();

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
            background: 'rgba(251, 191, 36, 0.12)',
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
            background: 'rgba(99, 102, 241, 0.15)',
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
          <span style={{ fontSize: '32px' }}>💰</span>
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
            PORTAL TRABAJO IT · SALARIOS
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
              fontWeight: 750,
              color: '#fbbf24',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
            }}
          >
            Calculadora de Salarios IT
          </span>
          <h1
            style={{
              fontSize: '54px',
              fontWeight: 900,
              lineHeight: 1.2,
              color: 'white',
              margin: 0,
              padding: 0,
            }}
          >
            ¿Cuánto cobran los programadores en España?
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
              minWidth: '240px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', marginBottom: '4px' }}>
              📊 Salario Medio IT España
            </span>
            <span style={{ fontSize: '30px', fontWeight: 800, color: '#fbbf24' }}>
              {averageSalary.toLocaleString('es-ES')}€/año
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
              minWidth: '240px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', marginBottom: '4px' }}>
              🔎 Muestra de Estudio
            </span>
            <span style={{ fontSize: '30px', fontWeight: 800, color: '#818cf8' }}>
              {totalCount > 0 ? `${totalCount.toLocaleString('es-ES')} ofertas` : 'Miles de ofertas'}
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
            Calcular mi Sueldo →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
