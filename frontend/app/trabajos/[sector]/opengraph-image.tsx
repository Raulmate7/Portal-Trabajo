import { ImageResponse } from 'next/og';
import pool from '@/lib/db';

export const alt = 'Ofertas de Empleo IT';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

type Props = {
  params: Promise<{ sector: string }>;
};

const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

const displayNameMap: Record<string, string> = {
  'react': 'React',
  'angular': 'Angular',
  'vue': 'Vue',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'php': 'PHP',
  'csharp': 'C#',
  'ruby': 'Ruby',
  'go': 'Go',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'aws': 'AWS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'nextjs': 'Next.js',
  'flutter': 'Flutter',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'sql': 'SQL',
  'salesforce': 'Salesforce',
  'cybersecurity': 'Ciberseguridad',
  'ciberseguridad': 'Ciberseguridad',
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data',
  'cloud': 'Cloud',
  'mobile': 'Mobile'
};

const EXPERIENCE_SUFFIXES: Record<string, { keywords: string[]; label: string }> = {
  'junior': {
    keywords: ['junior', 'jr', 'junior developer', 'trainee', 'becario', 'prácticas', 'entry level', 'sin experiencia'],
    label: 'Junior'
  },
  'senior': {
    keywords: ['senior', 'sr', 'lead', 'principal', 'tech lead', 'staff'],
    label: 'Senior'
  },
  'sin-experiencia': {
    keywords: ['sin experiencia', 'entry level', 'trainee', 'becario', 'prácticas', 'junior'],
    label: 'Sin Experiencia'
  },
};

function parseSector(sectorSlug: string) {
  let tec = sectorSlug;
  let ciudad = '';
  let experiencia = '';

  for (const suffix of Object.keys(EXPERIENCE_SUFFIXES)) {
    if (tec.endsWith(`-${suffix}`)) {
      experiencia = suffix;
      tec = tec.slice(0, -(suffix.length + 1));
      break;
    }
  }

  const enIndex = tec.indexOf('-en-');
  if (enIndex !== -1) {
    const afterEn = tec.substring(enIndex + 4);
    tec = tec.substring(0, enIndex);
    ciudad = afterEn.replace(/-/g, ' ');
  } else if (tec.endsWith('-remoto')) {
    tec = tec.replace('-remoto', '');
    ciudad = 'remoto';
  }

  const dbCategory = categoryMap[tec];
  return { tec, ciudad, experiencia, dbCategory };
}

async function getJobsData(tec: string, ciudad: string, dbCategory: string | undefined, experiencia: string) {
  const client = await pool.connect();
  try {
    let sql = "SELECT salary, location, title, description_snippet FROM jobs WHERE is_active = TRUE";
    const paramsQuery: any[] = [];
    let paramIndex = 1;

    if (dbCategory) {
      sql += ` AND category = $${paramIndex}`;
      paramsQuery.push(dbCategory);
      paramIndex++;
    } else if (tec !== 'informatica-tecnologia') {
      if (tec === 'nextjs') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%nextjs%', '%next.js%', '%next-js%');
        paramIndex += 3;
      } else if (tec === 'csharp') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%c#%', '%c-sharp%', '%csharp%');
        paramIndex += 3;
      } else if (tec === 'cybersecurity' || tec === 'ciberseguridad') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%cybersecurity%', '%ciberseguridad%', '%seguridad%');
        paramIndex += 3;
      } else {
        sql += ` AND title ILIKE $${paramIndex}`;
        paramsQuery.push(`%${tec}%`);
        paramIndex++;
      }
    }

    if (ciudad) {
      if (ciudad.toLowerCase() === 'remoto') {
        sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2} OR location ILIKE $${paramIndex + 3})`;
        paramsQuery.push('%remoto%', '%remote%', '%worldwide%', '%teletrabajo%');
        paramIndex += 4;
      } else {
        sql += ` AND location ILIKE $${paramIndex}`;
        paramsQuery.push(`%${ciudad}%`);
        paramIndex++;
      }
    }

    if (experiencia && EXPERIENCE_SUFFIXES[experiencia]) {
      const expKeywords = EXPERIENCE_SUFFIXES[experiencia].keywords;
      const expConditions = expKeywords.map(() => {
        const cond = `(title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
        paramIndex++;
        return cond;
      }).join(' OR ');
      sql += ` AND (${expConditions})`;
      paramsQuery.push(...expKeywords.map(k => `%${k}%`));
    }

    const result = await client.query(sql, paramsQuery);
    return result.rows;
  } catch (error) {
    console.error("Error loading jobs for dynamic OG category:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function Image({ params }: Props) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const { tec, ciudad, experiencia, dbCategory } = parseSector(sectorSlug);
  const jobs = await getJobsData(tec, ciudad, dbCategory, experiencia);

  const totalJobs = jobs.length;

  // Compute stats
  let countWithSalary = 0;
  let sumSalary = 0;

  for (const job of jobs) {
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

  const averageSalary = countWithSalary > 0 
    ? `${Math.round(sumSalary / countWithSalary).toLocaleString('es-ES')}€` 
    : 'N/D';

  const categoriaBonita = displayNameMap[tec] || dbCategory || tec.replace(/-/g, ' ');
  const expLabel = experiencia ? ` ${EXPERIENCE_SUFFIXES[experiencia]?.label || ''}` : '';
  const locLabel = ciudad 
    ? (ciudad === 'remoto' ? 'en Remoto' : `en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}`) 
    : 'en España';

  const title = `Empleo de ${categoriaBonita}${expLabel}`;

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

        {/* Titulo y localización */}
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
            Ofertas de Empleo {locLabel}
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
            Explorar Canal →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
