import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    console.log("📨 Intentando registrar:", email);

    // Comprobar si tenemos la contraseña de la base de datos
    if (!process.env.DATABASE_URL) {
      console.error("❌ ERROR CRÍTICO: No existe la variable DATABASE_URL en Vercel");
      return NextResponse.json({ error: 'Error de configuración' }, { status: 500 });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Importante para la nube
    });

    const client = await pool.connect();
    
    try {
      // Crear la tabla si no existe (por seguridad, por si el script de Python falló)
      await client.query(`
        CREATE TABLE IF NOT EXISTS subscribers (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Guardar el email
      await client.query(
        'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [email]
      );
      
      console.log("✅ Email guardado con éxito");
      return NextResponse.json({ message: 'Suscrito' }, { status: 200 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('💥 Error en el servidor:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
