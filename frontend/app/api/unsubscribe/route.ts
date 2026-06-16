import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Falta el email del suscriptor' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("DELETE FROM subscribers WHERE email = $1", [email.trim().toLowerCase()]);
    } finally {
      client.release();
    }

    // Redirigir a una página de éxito frontend
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.redirect(`${baseUrl}/darse-de-baja?success=true`);
  } catch (error: any) {
    console.error('Error al dar de baja:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
