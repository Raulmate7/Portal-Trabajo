import { unstable_cache } from 'next/cache';
import pool from './db';

export interface FilterOptions {
  query?: string;
  location?: string;
  minSalary?: number;
  modality?: string; // 'remoto' | 'hibrido' | 'presencial'
  dateRange?: string; // '24h' | 'week' | 'month'
  experience?: string; // 'junior' | 'mid' | 'senior'
  beforeCreatedAt?: string;
  beforeId?: string;
}

function buildBooleanFulltextQuery(raw: string): string {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[+\-><()~*"@]+/g, '').trim())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return '';
  return tokens.map((t) => `+${t}*`).join(' ');
}

export function buildJobFiltersWhere(
  filters: FilterOptions,
  startParamIndex: number = 1,
  useFulltext: boolean = true
): { whereSql: string; params: any[]; nextIndex: number } {
  let whereSql = '';
  const params: any[] = [];
  let paramIndex = startParamIndex;

  if (filters.query && filters.query.trim()) {
    const ft = useFulltext ? buildBooleanFulltextQuery(filters.query) : '';
    if (ft) {
      whereSql += ` AND MATCH(title, company, description_snippet) AGAINST ($${paramIndex} IN BOOLEAN MODE)`;
      params.push(ft);
      paramIndex++;
    } else {
      const qLike = `%${filters.query.trim().toLowerCase()}%`;
      whereSql += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(company) LIKE $${paramIndex} OR LOWER(COALESCE(description_snippet, '')) LIKE $${paramIndex})`;
      params.push(qLike);
      paramIndex++;
    }
  }

  if (filters.location && filters.location.trim()) {
    whereSql += ` AND LOWER(location) LIKE $${paramIndex}`;
    params.push(`%${filters.location.trim().toLowerCase()}%`);
    paramIndex++;
  }

  if (filters.minSalary) {
    whereSql += ` AND (salary_min >= $${paramIndex} OR (salary_min IS NULL AND salary_max >= $${paramIndex}))`;
    params.push(filters.minSalary);
    paramIndex++;
  }

  if (filters.modality) {
    if (filters.modality === 'remoto') {
      whereSql += ` AND (work_mode = 'remote' OR LOWER(location) LIKE '%remoto%' OR LOWER(location) LIKE '%remote%' OR LOWER(location) LIKE '%teletrabajo%')`;
    } else if (filters.modality === 'hibrido') {
      whereSql += ` AND (work_mode = 'hybrid' OR LOWER(location) LIKE '%hibrido%' OR LOWER(location) LIKE '%híbrido%' OR LOWER(location) LIKE '%hybrid%')`;
    } else if (filters.modality === 'presencial') {
      whereSql += ` AND (work_mode = 'onsite' OR (LOWER(location) NOT LIKE '%remoto%' AND LOWER(location) NOT LIKE '%remote%' AND LOWER(location) NOT LIKE '%teletrabajo%' AND LOWER(location) NOT LIKE '%hibrido%' AND LOWER(location) NOT LIKE '%híbrido%' AND LOWER(location) NOT LIKE '%hybrid%'))`;
    }
  }

  if (filters.dateRange) {
    if (filters.dateRange === '24h') {
      whereSql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`;
    } else if (filters.dateRange === 'week') {
      whereSql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    } else if (filters.dateRange === 'month') {
      whereSql += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }
  }

  if (filters.experience) {
    if (filters.experience === 'junior') {
      whereSql += ` AND (LOWER(title) LIKE '%junior%' OR LOWER(title) LIKE '%jr%' OR LOWER(title) LIKE '%sin experiencia%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%junior%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%jr%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%sin experiencia%')`;
    } else if (filters.experience === 'mid') {
      whereSql += ` AND (LOWER(title) LIKE '%mid%' OR LOWER(title) LIKE '%semi-senior%' OR LOWER(title) LIKE '%semisenior%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%mid%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%semi-senior%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%semisenior%')`;
    } else if (filters.experience === 'senior') {
      whereSql += ` AND (LOWER(title) LIKE '%senior%' OR LOWER(title) LIKE '%sr%' OR LOWER(title) LIKE '%lead%' OR LOWER(title) LIKE '%principal%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%senior%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%sr%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%lead%' OR LOWER(COALESCE(description_snippet, '')) LIKE '%principal%')`;
    }
  }

  return { whereSql, params, nextIndex: paramIndex };
}

async function queryJobsWithFilterFallback(
  baseSelect: string,
  filters: FilterOptions,
  tailBuilder: (startIdx: number) => { tailSql: string; tailParams: any[] }
) {
  const client = await pool.connect();
  try {
    const attempt = async (useFulltext: boolean) => {
      const { whereSql, params, nextIndex } = buildJobFiltersWhere(filters, 1, useFulltext);
      const { tailSql, tailParams } = tailBuilder(nextIndex);
      const result = await client.query(`${baseSelect}${whereSql}${tailSql}`, [...params, ...tailParams]);
      return result.rows;
    };

    try {
      return await attempt(true);
    } catch {
      // Fallback seguro si el entorno aún no tiene FULLTEXT INDEX o columna work_mode migrada
      const { whereSql, params, nextIndex } = buildJobFiltersWhere(
        { ...filters, modality: undefined },
        1,
        false
      );
      let safeWhere = whereSql;
      if (filters.modality === 'remoto') {
        safeWhere += ` AND (LOWER(location) LIKE '%remoto%' OR LOWER(location) LIKE '%remote%' OR LOWER(location) LIKE '%teletrabajo%')`;
      } else if (filters.modality === 'hibrido') {
        safeWhere += ` AND (LOWER(location) LIKE '%hibrido%' OR LOWER(location) LIKE '%híbrido%' OR LOWER(location) LIKE '%hybrid%')`;
      } else if (filters.modality === 'presencial') {
        safeWhere += ` AND (LOWER(location) NOT LIKE '%remoto%' AND LOWER(location) NOT LIKE '%remote%' AND LOWER(location) NOT LIKE '%teletrabajo%' AND LOWER(location) NOT LIKE '%hibrido%' AND LOWER(location) NOT LIKE '%híbrido%' AND LOWER(location) NOT LIKE '%hybrid%')`;
      }
      const { tailSql, tailParams } = tailBuilder(nextIndex);
      const result = await client.query(`${baseSelect}${safeWhere}${tailSql}`, [...params, ...tailParams]);
      return result.rows;
    }
  } catch (error) {
    console.error("Error BD in jobs query:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function getJobs(filters: FilterOptions, page: number = 1, limit: number = 20) {
  // SEC-029 & FUNC-040: Limitar OFFSET máximo a 50 páginas (1000 filas) y soportar paginación keyset por cursor
  const safePage = Math.max(1, Math.min(50, isNaN(page) ? 1 : page));
  const safeLimit = Math.max(1, Math.min(100, isNaN(limit) ? 20 : limit));
  const offset = (safePage - 1) * safeLimit;
  const baseSelect = "SELECT id, title, title_es, company, location, salary, salary_min, salary_max, created_at, url_source, description_snippet, category, is_featured FROM jobs WHERE (is_featured = FALSE OR is_featured IS NULL) AND is_active = TRUE";

  return queryJobsWithFilterFallback(baseSelect, filters, (paramIndex) => {
    if (filters.beforeCreatedAt) {
      if (filters.beforeId) {
        return {
          tailSql: ` AND (created_at < $${paramIndex} OR (created_at = $${paramIndex} AND id < $${paramIndex + 1})) ORDER BY created_at DESC, id DESC LIMIT $${paramIndex + 2}`,
          tailParams: [filters.beforeCreatedAt, filters.beforeId, safeLimit],
        };
      }
      return {
        tailSql: ` AND created_at < $${paramIndex} ORDER BY created_at DESC, id DESC LIMIT $${paramIndex + 1}`,
        tailParams: [filters.beforeCreatedAt, safeLimit],
      };
    }
    return {
      tailSql: ` ORDER BY created_at DESC, id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      tailParams: [safeLimit, offset],
    };
  });
}

export async function getFeaturedJobs(filters: FilterOptions, limit: number = 3) {
  const safeLimit = Math.max(1, Math.min(20, isNaN(limit) ? 3 : limit));
  const baseSelect = "SELECT id, title, title_es, company, location, salary, salary_min, salary_max, created_at, url_source, description_snippet, category, is_featured FROM jobs WHERE is_featured = TRUE AND is_active = TRUE";

  return queryJobsWithFilterFallback(baseSelect, filters, (paramIndex) => ({
    tailSql: ` ORDER BY created_at DESC LIMIT $${paramIndex}`,
    tailParams: [safeLimit],
  }));
}

const getCachedTotalActiveJobsCount = unstable_cache(
  async () => {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT COUNT(*) AS count FROM jobs WHERE is_active = TRUE");
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error("Error counting jobs:", error);
      return 0;
    } finally {
      client.release();
    }
  },
  ['jobs-active-count'],
  { revalidate: 180, tags: ['jobs-count'] }
);

export async function getJobsCount(filters?: FilterOptions) {
  if (!filters || (!filters.query && !filters.location && !filters.minSalary && !filters.modality && !filters.dateRange && !filters.experience)) {
    return getCachedTotalActiveJobsCount();
  }
  const rows = await queryJobsWithFilterFallback(
    "SELECT COUNT(*) AS count FROM jobs WHERE is_active = TRUE",
    filters,
    () => ({ tailSql: '', tailParams: [] })
  );
  return rows[0]?.count ? parseInt(rows[0].count, 10) : 0;
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
