import pool from '@/lib/db';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response(
      `<html>
        <head>
          <title>Error - Portal Trabajo IT</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-w: 400px; }
            h1 { color: #dc2626; font-size: 1.5rem; margin-top: 0; }
            p { color: #4b5563; font-size: 0.95rem; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Error</h1>
            <p>El enlace de cancelación no contiene un correo electrónico válido.</p>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM subscribers WHERE email = $1', [email]);
    } finally {
      client.release();
    }

    // Escapar email para evitar vulnerabilidades XSS en el HTML de respuesta
    const escapedEmail = email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    return new Response(
      `<html>
        <head>
          <title>Suscripción Cancelada - Portal Trabajo IT</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f9fafb; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #111827; padding: 3rem 2.5rem; border-radius: 1.5rem; border: 1px solid #1f2937; text-align: center; max-width: 450px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            h1 { color: #f59e0b; font-size: 1.75rem; margin-top: 0; font-weight: 800; }
            p { color: #9ca3af; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; transition: transform 0.2s; }
            .btn:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Suscripción Cancelada</h1>
            <p>Tu correo <strong>${escapedEmail}</strong> ha sido eliminado de nuestra lista de correo. No recibirás más alertas de empleo.</p>
            <a href="/" class="btn">Volver al Portal</a>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    console.error('Error al dar de baja al usuario:', error);
    return new Response(
      `<html>
        <head>
          <title>Error - Portal Trabajo IT</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-w: 400px; }
            h1 { color: #dc2626; font-size: 1.5rem; margin-top: 0; }
            p { color: #4b5563; font-size: 0.95rem; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Error del Servidor</h1>
            <p>Hubo un problema procesando tu solicitud de cancelación. Por favor, inténtalo de nuevo más tarde.</p>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
