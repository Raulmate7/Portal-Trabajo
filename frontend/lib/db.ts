import mysql from 'mysql2/promise';

/**
 * Pool de conexiones MySQL con capa de traducción y soporte opcional de proxy HTTP
 * para saltar cortafuegos y bloqueos de puertos externos (ej. puerto 3306 en Raiola).
 */
const useProxy = !!process.env.DB_PROXY_URL;
const proxyUrl = process.env.DB_PROXY_URL || 'https://mail.portalempleoit.com/db_proxy.php';
const proxyToken = process.env.DB_PROXY_TOKEN || '';
if (useProxy && !proxyToken) {
  console.warn('⚠️ Warning: DB_PROXY_URL is set but DB_PROXY_TOKEN is empty.');
}

// ─── Caché In-Memory con TTL ──────────────────────────────────────────────────
// Reduce las llamadas al proxy para queries frecuentes de solo-lectura.
// El TTL por defecto es de 5 minutos. La caché se comparte dentro del mismo
// proceso serverless mientras Vercel mantenga la instancia activa.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const queryCache = new Map<string, CacheEntry>();

/** Normaliza una query SQL para usarla como clave de caché */
function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * VULN-28: Determina si una query es cacheable de forma segura.
 * Solo se cachean SELECTs de tablas de catálogo estáticas públicas (ej. sectors)
 * que no contengan PII ni dependan de estados mutables de usuario/administración.
 */
const CACHEABLE_STATIC_TABLES = ['sectors'];

function isCacheable(sql: string, params: any[]): boolean {
  const s = sql.trim().toLowerCase();
  if (!s.startsWith('select')) return false;
  // No cachear si tiene parámetros (queries dinámicas por ID/ciudad etc.)
  if (params && params.length > 0) return false;
  
  // Rechazar terminantemente tablas con PII o transacciones mutables
  const hasSensitiveTables = /\b(from|join)\s+`?(subscribers|premium_leads|email_tracking|alerts|sponsored_jobs|company_reviews|review_reports|job_reactions|newsletter_sponsors)`?\b/i.test(s);
  if (hasSensitiveTables) return false;

  // Solo admitir si referencia explícitamente alguna tabla de la lista blanca estática
  const hasAllowedTable = CACHEABLE_STATIC_TABLES.some(table => 
    new RegExp(`\\b(from|join)\\s+\`?${table}\`?\\b`, 'i').test(s)
  );
  return hasAllowedTable;
}

function getCached(key: string): any | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    queryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any): void {
  // Limpiar entradas expiradas si la caché crece demasiado
  if (queryCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of queryCache.entries()) {
      if (now > v.expiresAt) queryCache.delete(k);
    }
  }
  queryCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
// ─────────────────────────────────────────────────────────────────────────────

let poolConnection: mysql.Pool | null = null;
if (!useProxy) {
  const connectionLimit = Number(process.env.MYSQL_CONNECTION_LIMIT) || 25;
  const connectionString = process.env.DATABASE_URL;
  // VULN-14: Forzar cifrado TLS/SSL en conexiones directas para prevenir sniffing de credenciales y datos en tránsito
  const sslOptions = process.env.NODE_ENV === 'production' || process.env.MYSQL_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

  poolConnection = connectionString
    ? mysql.createPool({
        uri: connectionString,
        connectionLimit,
        queueLimit: 50, // Límite defensivo para prevenir desbordamiento de memoria por colas ilimitadas
        waitForConnections: true,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        ssl: sslOptions,
      })
    : mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: Number(process.env.MYSQL_PORT) || 3306,
        connectionLimit,
        queueLimit: 50,
        waitForConnections: true,
        idleTimeout: 30000,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        ssl: sslOptions,
      });
}


// Códigos de error típicos de fallos de conexión
const CONNECTION_ERRORS = [
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ER_ACCESS_DENIED_ERROR',
  'PROTOCOL_CONNECTION_LOST',
  'HANDSHAKE_TIMEOUT'
];

/**
 * Helper interno para traducir y ejecutar consultas SQL de formato Postgres a MySQL.
 */
async function executeQuery(conn: mysql.Pool | mysql.PoolConnection | null, sql: string, params: any[] = []) {
  let mysqlParams: any[] = [];
  let hasPgPlaceholders = false;
  
  // 1. Traducir marcadores de PostgreSQL ($1, $2, etc.) a marcadores de MySQL (?) de forma segura (ignorando strings)
  let mysqlSql = '';
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (inString) {
      if (char === stringChar) {
        // VULN-12: Contar si el número de barras invertidas precedentes es par o impar para manejar '\\'
        let backslashCount = 0;
        let k = i - 1;
        while (k >= 0 && sql[k] === '\\') {
          backslashCount++;
          k--;
        }
        if (backslashCount % 2 === 0) {
          inString = false;
        }
      }
      mysqlSql += char;
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
        mysqlSql += char;
      } else if (char === '$') {
        let j = i + 1;
        let numStr = '';
        while (j < sql.length && sql[j] >= '0' && sql[j] <= '9') {
          numStr += sql[j];
          j++;
        }
        if (numStr.length > 0) {
          hasPgPlaceholders = true;
          const pgIndex = parseInt(numStr, 10) - 1;
          if (params && pgIndex >= 0 && pgIndex < params.length) {
            mysqlParams.push(params[pgIndex]);
          } else {
            mysqlParams.push(null);
          }
          mysqlSql += '?';
          i = j - 1; // Avanzar el índice
        } else {
          mysqlSql += char;
        }
      } else if (
        // VULN-18: Traducir ILIKE a LIKE únicamente fuera de cadenas literales
        sql.substring(i, i + 5).toUpperCase() === 'ILIKE' &&
        (i === 0 || !/[a-zA-Z0-9_]/.test(sql[i - 1])) &&
        (i + 5 >= sql.length || !/[a-zA-Z0-9_]/.test(sql[i + 5]))
      ) {
        mysqlSql += 'LIKE';
        i += 4; // Avanzar el índice saltando 'ILIKE'
      } else {
        mysqlSql += char;
      }
    }
  }

  // VULN-13: Solo asignar params directamente si la consulta no usaba marcadores $N
  if (!hasPgPlaceholders && params && params.length > 0) {
    mysqlParams = params;
  }

  if (useProxy) {
    // Si la consulta es un comando de control transaccional, resolver inmediatamente como no-op
    // dado que el proxy HTTP es sin estado (cada petición HTTP es una conexión PDO aislada).
    const normalizedUpper = mysqlSql.trim().toUpperCase();
    if (
      normalizedUpper === 'START TRANSACTION' ||
      normalizedUpper === 'COMMIT' ||
      normalizedUpper === 'ROLLBACK' ||
      normalizedUpper === 'BEGIN'
    ) {
      return { rows: [] };
    }

    // 3. Ejecutar a través de Proxy HTTP (Raiola db_proxy.php)
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Proxy-Token': proxyToken,
        },
        body: JSON.stringify({ sql: mysqlSql, params: mysqlParams }),
        cache: 'no-store', // Evitar almacenamiento en Next.js Data Cache para operaciones de base de datos
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Proxy status ${response.status}: ${errText}`);
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'Unknown proxy error');
      }

      return {
        rows: resJson.rows || [],
      };
    } catch (error: any) {
      console.error('❌ Error de consulta en MySQL vía Proxy:', error);
      // VULN-06: Propagar el error en lugar de suprimirlo silenciosamente con { rows: [] }
      // Esto previene bypasses de autorización y pérdida silenciosa de datos (Fail-Closed)
      throw error;
    }
  } else if (conn) {
    // Ejecución directa de mysql2: Priorizar conn.execute (server-side prepared statements) cuando hay parámetros
    try {
      let rows: any;
      if (mysqlParams && mysqlParams.length > 0) {
        try {
          const [result] = await conn.execute(mysqlSql, mysqlParams);
          rows = result;
        } catch (execErr: any) {
          // Fallback a conn.query si la consulta particular no es preparable en el motor
          const [result] = await conn.query(mysqlSql, mysqlParams);
          rows = result;
        }
      } else {
        const [result] = await conn.query(mysqlSql);
        rows = result;
      }
      return {
        rows: rows as any[],
      };
    } catch (error: any) {
      console.error('❌ Error de consulta directa en MySQL:', error);
      throw error;
    }
  }
  return { rows: [] };
}

const pool = {
  // Método directo de consulta en el pool
  async query(sql: string, params: any[] = []) {
    // Intentar servir desde caché in-memory para queries frecuentes sin parámetros
    if (isCacheable(sql, params)) {
      const cacheKey = normalizeSql(sql);
      const cached = getCached(cacheKey);
      if (cached) {
        return cached;
      }
      const result = await executeQuery(poolConnection, sql, params);
      setCache(cacheKey, result);
      return result;
    }

    return await executeQuery(poolConnection, sql, params);
  },


  // Método connect para adquirir un cliente de forma compatible con PG
  async connect() {
    if (useProxy) {
      // Si usamos proxy, no hay "conexión física" real. Retornamos un cliente mock.
      return {
        async query(sql: string, params: any[] = []) {
          return executeQuery(null, sql, params);
        },
        release() {
          // No hace falta liberar nada
        }
      };
    }
    
    const connection = await poolConnection!.getConnection();
    return {
      async query(sql: string, params: any[] = []) {
        return executeQuery(connection, sql, params);
      },
      release() {
        connection.release();
      }
    };
  },
  
  // Método para cerrar el pool
  async end() {
    if (poolConnection) {
      try {
        await poolConnection.end();
      } catch (e) {}
    }
  }
};

export default pool;
