import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Usamos la misma base de datos que tu Python
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necesario para que funcione en la nube
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validamos que sea un email real
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // 2. Conectamos a la Base de Datos
    const client = await pool.connect();

    try {
      // 3. Guardamos el email (si ya existe, no hace nada gracias a ON CONFLICT)
      await client.query(
        'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [email]
      );
      
      return NextResponse.json({ message: 'Suscrito correctamente' }, { status: 200 });
    } finally {
      client.release(); // Cerramos conexión
    }

  } catch (error) {
    console.error('Error guardando suscriptor:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
