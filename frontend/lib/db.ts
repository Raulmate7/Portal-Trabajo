import mysql from 'mysql2/promise';

/**
 * Pool de conexiones MySQL con capa de traducción y soporte opcional de proxy HTTP
 * para saltar cortafuegos y bloqueos de puertos externos (ej. puerto 3306 en Raiola).
 */
const useProxy = !!process.env.DB_PROXY_URL;
const proxyUrl = process.env.DB_PROXY_URL || 'https://mail.portalempleoit.com/db_proxy.php';
const proxyToken = process.env.DB_PROXY_TOKEN || 'a6f021f1d19d675b8e998a44d187764d';

let poolConnection: mysql.Pool | null = null;
if (!useProxy) {
  const connectionString = process.env.DATABASE_URL;
  poolConnection = connectionString
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

  if (useProxy) {
    // 3. Ejecutar a través de Proxy HTTP (Raiola db_proxy.php)
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Proxy-Token': proxyToken,
        },
        body: JSON.stringify({ sql: mysqlSql, params: mysqlParams }),
        next: { revalidate: 300 } // Caché de Next.js
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
      return { rows: [] };
    }
  } else if (conn) {
    // Ejecución directa de mysql2
    try {
      const [rows] = await conn.query(mysqlSql, mysqlParams);
      return {
        rows: rows as any[],
      };
    } catch (error: any) {
      if (CONNECTION_ERRORS.includes(error.code)) {
        console.warn('⚠️ Fallo de conexión de base de datos en executeQuery(). Retornando vacío:', error.message);
        return { rows: [] };
      }
      throw error;
    }
  }
  return { rows: [] };
}

const pool = {
  // Método directo de consulta en el pool
  async query(sql: string, params: any[] = []) {
    try {
      return await executeQuery(poolConnection, sql, params);
    } catch (error: any) {
      if (CONNECTION_ERRORS.includes(error?.code)) {
        console.warn('⚠️ Base de datos inaccesible en query(). Devolviendo filas vacías:', error.message);
        return { rows: [] };
      }
      throw error;
    }
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
    
    try {
      const connection = await poolConnection!.getConnection();
      return {
        async query(sql: string, params: any[] = []) {
          return executeQuery(connection, sql, params);
        },
        release() {
          connection.release();
        }
      };
    } catch (error: any) {
      if (CONNECTION_ERRORS.includes(error.code)) {
        console.warn('⚠️ Base de datos inaccesible en connect(). Creando cliente mock:', error.message);
        return {
          async query(sql: string, params: any[] = []) {
            return { rows: [] };
          },
          release() {}
        };
      }
      throw error;
    }
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
