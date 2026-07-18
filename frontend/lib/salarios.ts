import pool from './db';

export interface TechDetail {
  label: string;
  icon: string;
  desc: string;
  baseAvg: number;
}

export interface CityDetail {
  label: string;
  factor: number;
}

export interface LevelDetail {
  label: string;
  factor: number;
  keywords: string[];
  desc: string;
}

export const TECH_DETAILS: Record<string, TechDetail> = {
  'react': { label: 'React', icon: '⚛️', desc: 'Desarrollador/a Frontend experto en React, hooks, estado y componentes.', baseAvg: 41000 },
  'node': { label: 'Node.js', icon: '🟩', desc: 'Desarrollador/a Backend enfocado en Node.js, Express, NestJS y APIs.', baseAvg: 43000 },
  'python': { label: 'Python', icon: '🐍', desc: 'Programador/a Python para ciencia de datos, inteligencia artificial o desarrollo backend.', baseAvg: 44000 },
  'java': { label: 'Java', icon: '☕', desc: 'Desarrollador/a Java Enterprise, Spring Boot y microservicios.', baseAvg: 45000 },
  'typescript': { label: 'TypeScript', icon: '🔷', desc: 'Desarrollador/a de software especializado en tipado estático con TypeScript.', baseAvg: 43000 },
  'aws': { label: 'AWS', icon: '☁️', desc: 'Ingeniero/a Cloud de Amazon Web Services, infraestructura y serverless.', baseAvg: 48000 },
  'docker': { label: 'Docker', icon: '🐳', desc: 'Ingeniero/a DevOps enfocado en contenerización con Docker, CI/CD y despliegue.', baseAvg: 47000 },
  'flutter': { label: 'Flutter', icon: '📱', desc: 'Desarrollador/a Mobile de aplicaciones nativas híbridas con Flutter y Dart.', baseAvg: 39000 },
  'csharp': { label: 'C# / .NET', icon: '🔵', desc: 'Programador/a C# y arquitectura .NET para aplicaciones robustas.', baseAvg: 42000 },
  'php': { label: 'PHP', icon: '🐘', desc: 'Desarrollador/a web con PHP, Laravel o Symfony.', baseAvg: 36000 },
  'sql': { label: 'SQL', icon: '🗃️', desc: 'Analista de datos o Administrador de Bases de Datos (DBA) especialista en SQL.', baseAvg: 38000 },
  'go': { label: 'Go', icon: '🐹', desc: 'Desarrollador/a Go (Golang) para backend, microservicios y sistemas de alta concurrencia.', baseAvg: 46000 },
  'rust': { label: 'Rust', icon: '🦀', desc: 'Programador/a Rust enfocado en rendimiento, seguridad de memoria y sistemas críticos.', baseAvg: 50000 },
  'ruby': { label: 'Ruby', icon: '💎', desc: 'Desarrollador/a Ruby, principalmente enfocado en Ruby on Rails.', baseAvg: 41000 },
  'scala': { label: 'Scala', icon: '🔴', desc: 'Programador/a Scala para procesamiento de datos distribuido y backend funcional.', baseAvg: 48000 },
  'elixir': { label: 'Elixir', icon: '💧', desc: 'Desarrollador/a Elixir y Phoenix para sistemas distribuidos y tolerantes a fallos.', baseAvg: 45000 },
  'salesforce': { label: 'Salesforce', icon: '☁️', desc: 'Desarrollador/a o Administrador/a Salesforce, Apex, Visualforce y LWC.', baseAvg: 38000 },
  'cybersecurity': { label: 'Ciberseguridad', icon: '🛡️', desc: 'Especialista en ciberseguridad, seguridad de la información, auditoría y hacking ético.', baseAvg: 44000 },
  'terraform': { label: 'Terraform', icon: '🏗️', desc: 'Ingeniero/a DevOps especializado en Infraestructura como Código (IaC) con Terraform.', baseAvg: 48000 },
  'cobol': { label: 'COBOL', icon: '💾', desc: 'Programador/a COBOL para sistemas heredados, banca y gran empresa.', baseAvg: 36000 },
};

export const DISPLAY_CITIES: Record<string, CityDetail> = {
  'madrid': { label: 'Madrid', factor: 1.05 },
  'barcelona': { label: 'Barcelona', factor: 1.02 },
  'valencia': { label: 'Valencia', factor: 0.92 },
  'sevilla': { label: 'Sevilla', factor: 0.88 },
  'bilbao': { label: 'Bilbao', factor: 0.98 },
  'malaga': { label: 'Málaga', factor: 0.95 },
  'zaragoza': { label: 'Zaragoza', factor: 0.89 },
  'alicante': { label: 'Alicante', factor: 0.90 },
  'vigo': { label: 'Vigo', factor: 0.88 },
  'coruna': { label: 'A Coruña', factor: 0.92 },
  'granada': { label: 'Granada', factor: 0.85 },
  'remoto': { label: 'Remoto', factor: 1.10 },
};

export const DISPLAY_LEVELS: Record<string, LevelDetail> = {
  'junior': {
    label: 'Junior',
    factor: 0.72,
    keywords: ['junior', 'jr', 'junior developer', 'trainee', 'becario', 'prácticas', 'entry level', 'sin experiencia'],
    desc: 'Profesionales en sus primeros 0-2 años de trayectoria. Requieren mentoría y se enfocan en asimilar buenas prácticas y resolver tareas delimitadas.'
  },
  'mid': {
    label: 'Mid',
    factor: 1.00,
    keywords: ['mid', 'semisenior', 'semi-senior', 'ssr', 'intermediate', '2 años', '3 años', '4 años'],
    desc: 'Profesionales con 2-5 años de experiencia. Tienen autonomía, resuelven problemas de complejidad media y colaboran activamente en decisiones de arquitectura.'
  },
  'senior': {
    label: 'Senior',
    factor: 1.38,
    keywords: ['senior', 'sr', 'lead', 'principal', 'tech lead', 'staff', '5 años', '6 años', '7 años'],
    desc: 'Profesionales con más de 5 años de experiencia contrastada. Diseñan sistemas complejos, guían a perfiles más jóvenes e impactan directamente en decisiones técnicas del negocio.'
  }
};

export interface SalaryData {
  count: number;
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  p25: number | null;
  p75: number | null;
  message?: string;
}

export async function calculateSalaryStats(tech: string, location: string, experience: string): Promise<SalaryData> {
  const cleanTech = (tech || '').toLowerCase().trim();
  const cleanLocation = (location || '').toLowerCase().trim();
  const cleanExperience = (experience || '').toLowerCase().trim();

  const client = await pool.connect();
  try {
    let sql = `
      SELECT salary, title
      FROM jobs
      WHERE salary IS NOT NULL 
        AND salary != 'Consultar'
        AND salary != ''
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (cleanTech) {
      sql += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${cleanTech}%`);
      paramIndex++;
    }

    if (cleanLocation) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${cleanLocation}%`);
      paramIndex++;
    }

    // Filtrar por experiencia si se especifica
    if (cleanExperience === 'junior') {
      sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
      params.push('%junior%', '%jr%');
      paramIndex += 2;
    } else if (cleanExperience === 'senior') {
      sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
      params.push('%senior%', '%sr%');
      paramIndex += 2;
    }

    sql += ` LIMIT 500`;

    const result = await client.query(sql, params);
    const rows = result.rows;

    // Procesar los salarios extraídos de texto libre
    const salaries: number[] = [];

    for (const row of rows) {
      const salaryStr = (row.salary || '').toString();
      const cleanStr = salaryStr.replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
      const numbers = cleanStr.match(/\d+(\.\d+)?/g);
      if (!numbers || numbers.length === 0) continue;

      const parsedNums = numbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n));

      let val = 0;
      if (parsedNums.length >= 2) {
        val = (parsedNums[0] + parsedNums[1]) / 2;
      } else if (parsedNums.length === 1) {
        val = parsedNums[0];
      }

      // Convertir mensual a anual si el valor parece mensual (< 5000)
      if (val > 0 && val < 5000) val = val * 12;

      // Rango razonable de salarios IT en España (15k – 150k)
      if (val >= 15000 && val <= 150000) {
        salaries.push(Math.round(val));
      }
    }

    if (salaries.length === 0) {
      return {
        count: 0,
        average: null,
        median: null,
        min: null,
        max: null,
        p25: null,
        p75: null,
        message: 'No hay suficientes datos salariales para este filtro.',
      };
    }

    salaries.sort((a, b) => a - b);

    const average = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    const median = salaries[Math.floor(salaries.length / 2)];
    const min = salaries[0];
    const max = salaries[salaries.length - 1];
    const p25 = salaries[Math.floor(salaries.length * 0.25)];
    const p75 = salaries[Math.floor(salaries.length * 0.75)];

    return {
      count: salaries.length,
      average,
      median,
      min,
      max,
      p25,
      p75,
    };
  } catch (error) {
    console.error('Error in calculateSalaryStats:', error);
    return {
      count: 0,
      average: null,
      median: null,
      min: null,
      max: null,
      p25: null,
      p75: null,
      message: 'Error interno del servidor al calcular salarios.',
    };
  } finally {
    client.release();
  }
}
