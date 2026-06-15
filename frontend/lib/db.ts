import mysql from 'mysql2/promise';

/**
 * Pool de conexiones MySQL con capa de traducción automática para compatibilidad
 * con sintaxis de consultas PostgreSQL (marcadores $1, $2, operador ILIKE,
 * y métodos pool.connect() / client.release()).
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

  // Fallback si la consulta no usa placeholders $N pero tiene parámetros
  if (mysqlParams.length === 0 && params && params.length > 0) {
    mysqlParams = params;
  }

  // 2. Traducir operador ILIKE a LIKE (MySQL es case-insensitive por defecto)
  mysqlSql = mysqlSql.replace(/\bILIKE\b/gi, 'LIKE');

  // 3. Ejecutar consulta
  try {
    const [rows] = await conn.query(mysqlSql, mysqlParams);
    
    // Retornar en el formato estructurado de PostgreSQL { rows }
    return {
      rows: rows as any[],
    };
  } catch (error) {
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
  // Método directo de consulta en el pool
  async query(sql: string, params: any[] = []) {
    return executeQuery(poolConnection, sql, params);
  },

  // Método connect para adquirir un cliente del pool de forma compatible con PG
  async connect() {
    const connection = await poolConnection.getConnection();
    
    // Devolvemos una interfaz de cliente compatible con pg (incluye query y release)
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
    await poolConnection.end();
  }
};

export default pool;
