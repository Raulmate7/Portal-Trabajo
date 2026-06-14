import { Pool } from 'pg';

/**
 * Pool de conexiones PostgreSQL compartido para todo el servidor de Next.js.
 * Un único pool evita el agotamiento de conexiones al no crear/destruir
 * un pool en cada petición HTTP individual.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false
       : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,              // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
