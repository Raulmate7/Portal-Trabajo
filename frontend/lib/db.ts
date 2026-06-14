import mysql from 'mysql2/promise';

/**
 * Pool de conexiones MySQL con capa de traducción automática para compatibilidad
 * con sintaxis de consultas PostgreSQL (marcadores $1, $2 y operador ILIKE).
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

const pool = {
  async query(sql: string, params: any[] = []) {
    let mysqlParams: any[] = [];
    
    // 1. Traducir marcadores de PostgreSQL ($1, $2, etc.) a marcadores de MySQL (?)
    // Mapeamos los parámetros en el orden en que aparecen en la consulta SQL.
    let mysqlSql = sql.replace(/\$(\d+)/g, (match, numStr) => {
      const pgIndex = parseInt(numStr, 10) - 1;
      if (params && pgIndex >= 0 && pgIndex < params.length) {
        mysqlParams.push(params[pgIndex]);
      } else {
        // Fallback en caso de que falten parámetros
        mysqlParams.push(null);
      }
      return '?';
    });

    // Si la consulta no tiene marcadores $N pero sí tiene parámetros, los pasamos tal cual
    if (mysqlParams.length === 0 && params && params.length > 0) {
      mysqlParams = params;
    }

    // 2. Traducir operador ILIKE a LIKE (MySQL es case-insensitive por defecto)
    mysqlSql = mysqlSql.replace(/\bILIKE\b/gi, 'LIKE');

    // 3. Ejecutar consulta sobre el pool de conexiones de MySQL
    try {
      const [rows] = await poolConnection.query(mysqlSql, mysqlParams);
      
      // 4. Retornar en el formato estructurado de PostgreSQL { rows }
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
  },
  
  // Exponer método para cerrar el pool si se requiere en los scripts
  async end() {
    await poolConnection.end();
  }
};

export default pool;
