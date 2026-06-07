require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const query = `
    CREATE TABLE IF NOT EXISTS premium_leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        stack VARCHAR(255) NOT NULL,
        experience VARCHAR(50) NOT NULL,
        linkedin VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("Tabla premium_leads creada exitosamente.");
  } catch (err) {
    console.error("Error creando tabla:", err);
  } finally {
    pool.end();
  }
}
run();
