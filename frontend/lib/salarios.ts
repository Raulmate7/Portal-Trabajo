import pool from './db';

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
