import mysql from 'mysql2/promise';

/**
 * Pool de conexiones MySQL con capa de traducción automática para compatibilidad
 * con sintaxis de consultas PostgreSQL y resiliencia ante fallos de conexión
 * durante la fase de compilación estática de Next.js (prerendering).
 */
const connectionString = process.env.DATABASE_URL;

const poolConnection = connectionString
  ? mysql.createPool(connectionString)
  : mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.MYSQL_PORT) || 3306,
      connectionLimit: 15,
      idleTimeout: 30000,
      connectTimeout: 10000,
    });

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
async function executeQuery(conn: mysql.Pool | mysql.PoolConnection, sql: string, params: any[] = []) {
  let mysqlParams: any[] = [];
  
  // 1. Traducir marcadores de PostgreSQL ($1, $2, etc.) a marcadores de MySQL (?)
  let mysqlSql = sql.replace(/\$(\d+)/g, (match, numStr) => {
    const pgIndex = parseInt(numStr, 10) - 1;
    if (params && pgIndex >= 0 && pgIndex < params.length) {
      mysqlParams.push(params[pgIndex]);
    } else {
      mysqlParams.push(null);
    }
    return '?';
  });

  if (mysqlParams.length === 0 && params && params.length > 0) {
    mysqlParams = params;
  }

  // 2. Traducir operador ILIKE a LIKE (MySQL es case-insensitive por defecto)
  mysqlSql = mysqlSql.replace(/\bILIKE\b/gi, 'LIKE');

  // 3. Ejecutar consulta
  try {
    const [rows] = await conn.query(mysqlSql, mysqlParams);
    return {
      rows: rows as any[],
    };
  } catch (error: any) {
    // Si es un fallo de conexión durante la compilación, degradamos graciosamente
    if (CONNECTION_ERRORS.includes(error.code)) {
      console.warn('⚠️ Fallo de conexión de base de datos en executeQuery(). Retornando vacío para compilación estática:', error.message);
      return { rows: [] };
    }
    
    console.error('❌ Error de consulta en MySQL Traducida:', {
      originalSql: sql,
      translatedSql: mysqlSql,
      params: mysqlParams,
      error
    });
    throw error;
  }
}

const pool = {
  // Método directo de consulta en el pool con tolerancia a caídas de conexión
  async query(sql: string, params: any[] = []) {
    try {
      return await executeQuery(poolConnection, sql, params);
    } catch (error: any) {
      if (CONNECTION_ERRORS.includes(error.code)) {
        console.warn('⚠️ Base de datos inaccesible en query(). Devolviendo filas vacías:', error.message);
        return { rows: [] };
      }
      throw error;
    }
  },

  // Método connect para adquirir un cliente del pool de forma compatible con PG
  async connect() {
    try {
      const connection = await poolConnection.getConnection();
      return {
        async query(sql: string, params: any[] = []) {
          return executeQuery(connection, sql, params);
        },
        release() {
          connection.release();
        }
      };
    } catch (error: any) {
      // Si la conexión falla (ej: durante el "next build" en GitHub Actions),
      // devolvemos un cliente mock para evitar abortar el proceso de prerendering.
      if (CONNECTION_ERRORS.includes(error.code)) {
        console.warn('⚠️ Base de datos inaccesible en connect(). Creando cliente mock para Next.js build:', error.message);
        return {
          async query(sql: string, params: any[] = []) {
            return { rows: [] };
          },
          release() {
            // No hacer nada
          }
        };
      }
      throw error;
    }
  },
  
  // Método para cerrar el pool
  async end() {
    try {
      await poolConnection.end();
    } catch (e) {
      // Ignorar fallos al cerrar si no estaba conectado
    }
  }
};

export default pool;
