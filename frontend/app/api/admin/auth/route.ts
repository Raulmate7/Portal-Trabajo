import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  createAdminSessionTokenAsync,
  recordAdminAuditLog,
  revokeAdminSessionAsync
} from '@/lib/adminAuth';
import { adminAuthLimiter, getClientIp } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/securityLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Rate Limiting estricto anti-fuerza bruta (Vector 11)
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const rateLimitResult = await adminAuthLimiter.limitAsync(clientIp);

  if (!rateLimitResult.success) {
    await recordAdminAuditLog({
      eventType: 'admin_login_rate_limited',
      clientIp,
      userAgent,
      success: false,
      details: 'Bloqueo temporal por exceso de intentos'
    });
    await logSecurityEvent('SECURITY_CRITICAL', 'admin_auth_rate_limited', { clientIp });
    const retryAfterSec = Math.max(1, Math.ceil((rateLimitResult.reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        success: false,
        error: `Demasiados intentos fallidos. Acceso bloqueado temporalmente por seguridad. Inténtalo de nuevo en ${Math.ceil(retryAfterSec / 60)} minutos.`
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec)
        }
      }
    );
  }

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
    await recordAdminAuditLog({
      eventType: 'admin_login_failed',
      clientIp,
      userAgent,
      success: false,
      details: 'Contraseña incorrecta'
    });
    await logSecurityEvent('SECURITY_WARN', 'admin_auth_invalid_password', { clientIp });
    // Retardo defensivo de 250ms para mitigar ataques de temporización y fuerza bruta distribuida
    await new Promise((resolve) => setTimeout(resolve, 250));
    return NextResponse.json({ success: false, error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  // Éxito: restablecer intentos en memoria y Redis distribuido (SEC-020)
  await adminAuthLimiter.resetAsync(clientIp);

  const sessionToken = await createAdminSessionTokenAsync();
  await recordAdminAuditLog({
    eventType: 'admin_login_success',
    clientIp,
    userAgent,
    success: true,
    details: 'Inicio de sesión administrativo válido'
  });

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

export async function DELETE(request: NextRequest) {
  // Revocación activa de la sesión en servidor y BD (SEC-021)
  const clientIp = getClientIp(request);
  const sessionToken = request.cookies.get('admin_session')?.value;
  if (sessionToken) {
    await revokeAdminSessionAsync(sessionToken);
  }
  await recordAdminAuditLog({
    eventType: 'admin_logout',
    clientIp,
    userAgent: request.headers.get('user-agent'),
    success: true,
    details: 'Cierre de sesión administrativo'
  });

  const response = NextResponse.json({ success: true, message: 'Sesión cerrada.' });
  response.cookies.delete('admin_session');
  return response;
}
