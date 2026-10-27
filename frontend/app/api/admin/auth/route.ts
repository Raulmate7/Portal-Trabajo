import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminSessionToken } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail-closed estricto: Si no hay contraseña configurada en el entorno, bloquear todo acceso
  if (!adminPassword || adminPassword.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'El panel de administración no tiene una contraseña configurada en el servidor.' },
      { status: 503 }
    );
  }

  let password = '';
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    password = (body.password || '').toString();
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null);
    password = (formData?.get('password') || '').toString();
  }

  if (!password) {
    return NextResponse.json({ success: false, error: 'Contraseña requerida.' }, { status: 400 });
  }

  // Comparación en tiempo constante de hashes sha256 para prevenir timing attacks
  const inputHash = crypto.createHash('sha256').update(password).digest();
  const targetHash = crypto.createHash('sha256').update(adminPassword).digest();

  const isValid = crypto.timingSafeEqual(inputHash, targetHash);

  if (!isValid) {
    return NextResponse.json({ success: false, error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  const sessionToken = createAdminSessionToken();

  const response = NextResponse.json({ success: true, message: 'Autenticación exitosa.' });
  response.cookies.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 // 8 horas
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Sesión cerrada.' });
  response.cookies.delete('admin_session');
  return response;
}
