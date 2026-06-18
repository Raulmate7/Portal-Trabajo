import pool from './db';

export interface FilterOptions {
  query?: string;
  location?: string;
  minSalary?: number;
  modality?: string; // 'remoto' | 'hibrido' | 'presencial'
  dateRange?: string; // '24h' | 'week' | 'month'
  experience?: string; // 'junior' | 'mid' | 'senior'
}

export async function getJobs(filters: FilterOptions, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE (is_featured = FALSE OR is_featured IS NULL) AND is_active = TRUE";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.query && filters.query.trim()) {
      sql += ` AND (title ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${filters.query.trim()}%`);
      paramIndex++;
    }

    if (filters.location && filters.location.trim()) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${filters.location.trim()}%`);
      paramIndex++;
    }

    if (filters.minSalary) {
      sql += ` AND (salary_min >= $${paramIndex} OR (salary_min IS NULL AND salary_max >= $${paramIndex}))`;
      params.push(filters.minSalary);
      paramIndex++;
    }

    if (filters.modality) {
      if (filters.modality === 'remoto') {
        sql += ` AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%')`;
      } else if (filters.modality === 'hibrido') {
        sql += ` AND (location ILIKE '%hibrido%' OR location ILIKE '%híbrido%' OR location ILIKE '%hybrid%')`;
      } else if (filters.modality === 'presencial') {
        sql += ` AND (location NOT ILIKE '%remoto%' AND location NOT ILIKE '%remote%' AND location NOT ILIKE '%teletrabajo%' AND location NOT ILIKE '%hibrido%' AND location NOT ILIKE '%híbrido%' AND location NOT ILIKE '%hybrid%')`;
      }
    }

    if (filters.dateRange) {
      if (filters.dateRange === '24h') {
        sql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`;
      } else if (filters.dateRange === 'week') {
        sql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
      } else if (filters.dateRange === 'month') {
        sql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
      }
    }

    if (filters.experience) {
      if (filters.experience === 'junior') {
        sql += ` AND (title ILIKE '%junior%' OR title ILIKE '%jr%' OR title ILIKE '%sin experiencia%' OR description_snippet ILIKE '%junior%' OR description_snippet ILIKE '%jr%' OR description_snippet ILIKE '%sin experiencia%')`;
      } else if (filters.experience === 'mid') {
        sql += ` AND (title ILIKE '%mid%' OR title ILIKE '%semi-senior%' OR title ILIKE '%semisenior%' OR description_snippet ILIKE '%mid%' OR description_snippet ILIKE '%semi-senior%' OR description_snippet ILIKE '%semisenior%')`;
      } else if (filters.experience === 'senior') {
        sql += ` AND (title ILIKE '%senior%' OR title ILIKE '%sr%' OR title ILIKE '%lead%' OR title ILIKE '%principal%' OR description_snippet ILIKE '%senior%' OR description_snippet ILIKE '%sr%' OR description_snippet ILIKE '%lead%' OR description_snippet ILIKE '%principal%')`;
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error BD in getJobs:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function getFeaturedJobs(filters: FilterOptions, limit: number = 3) {
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE is_featured = TRUE AND is_active = TRUE";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.query && filters.query.trim()) {
      sql += ` AND (title ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${filters.query.trim()}%`);
      paramIndex++;
    }

    if (filters.location && filters.location.trim()) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${filters.location.trim()}%`);
      paramIndex++;
    }

    if (filters.minSalary) {
      sql += ` AND (salary_min >= $${paramIndex} OR (salary_min IS NULL AND salary_max >= $${paramIndex}))`;
      params.push(filters.minSalary);
      paramIndex++;
    }

    if (filters.modality) {
      if (filters.modality === 'remoto') {
        sql += ` AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%')`;
      } else if (filters.modality === 'hibrido') {
        sql += ` AND (location ILIKE '%hibrido%' OR location ILIKE '%híbrido%' OR location ILIKE '%hybrid%')`;
      } else if (filters.modality === 'presencial') {
        sql += ` AND (location NOT ILIKE '%remoto%' AND location NOT ILIKE '%remote%' AND location NOT ILIKE '%teletrabajo%' AND location NOT ILIKE '%hibrido%' AND location NOT ILIKE '%híbrido%' AND location NOT ILIKE '%hybrid%')`;
      }
    }

    if (filters.dateRange) {
      if (filters.dateRange === '24h') {
        sql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`;
      } else if (filters.dateRange === 'week') {
        sql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
      } else if (filters.dateRange === 'month') {
        sql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
      }
    }

    if (filters.experience) {
      if (filters.experience === 'junior') {
        sql += ` AND (title ILIKE '%junior%' OR title ILIKE '%jr%' OR title ILIKE '%sin experiencia%' OR description_snippet ILIKE '%junior%' OR description_snippet ILIKE '%jr%' OR description_snippet ILIKE '%sin experiencia%')`;
      } else if (filters.experience === 'mid') {
        sql += ` AND (title ILIKE '%mid%' OR title ILIKE '%semi-senior%' OR title ILIKE '%semisenior%' OR description_snippet ILIKE '%mid%' OR description_snippet ILIKE '%semi-senior%' OR description_snippet ILIKE '%semisenior%')`;
      } else if (filters.experience === 'senior') {
        sql += ` AND (title ILIKE '%senior%' OR title ILIKE '%sr%' OR title ILIKE '%lead%' OR title ILIKE '%principal%' OR description_snippet ILIKE '%senior%' OR description_snippet ILIKE '%sr%' OR description_snippet ILIKE '%lead%' OR description_snippet ILIKE '%principal%')`;
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error BD in getFeaturedJobs:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function getJobsCount() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE AND (is_featured = FALSE OR is_featured IS NULL)");
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error counting jobs:", error);
    return 0;
  } finally {
    client.release();
  }
}

export async function getJobOfTheDay() {
  const client = await pool.connect();
  try {
    // Buscar una oferta destacada o con salario alto
    const res = await client.query(`
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
        AND salary_min >= 35000 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    if (res.rows.length > 0) return res.rows[0];
    
    // Fallback a cualquier oferta activa
    const fallbackRes = await client.query(`
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return fallbackRes.rows[0] || null;
  } catch (error) {
    console.error("Error fetching job of the day:", error);
    return null;
  } finally {
    client.release();
  }
}

export async function getTrendingTech() {
  const client = await pool.connect();
  try {
    // Calcular ofertas por categoría o tecnología en los últimos 7 días
    const res = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM jobs 
      WHERE is_active = TRUE 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND category IS NOT NULL 
        AND category != 'Otros'
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 3
    `);
    
    // Si no hay suficientes ofertas en los últimos 7 días, hacemos consulta global
    if (res.rows.length < 3) {
      const globalRes = await client.query(`
        SELECT category, COUNT(*) as count 
        FROM jobs 
        WHERE is_active = TRUE 
          AND category IS NOT NULL 
          AND category != 'Otros'
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 3
      `);
      return globalRes.rows;
    }
    
    return res.rows;
  } catch (error) {
    console.error("Error fetching trending tech:", error);
    return [];
  } finally {
    client.release();
  }
}
