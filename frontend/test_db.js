const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Checking connection to:', connectionString);
  try {
    const pool = mysql.createPool(connectionString);
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Success! Connection result:', rows);
    await pool.end();
  } catch (err) {
    console.error('Error connecting to DB:', err.message);
  }
}
test();
