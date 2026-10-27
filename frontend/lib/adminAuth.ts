import crypto from 'crypto';

function getSessionSecret(): string {
  const secret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('Configuración de seguridad del servidor no inicializada');
  }
  return secret;
}

export function createAdminSessionToken(): string {
  const secret = getSessionSecret();
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', secret).update(`admin_session:${timestamp}`).digest('hex');
  return `${timestamp}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || !token.includes('.')) return false;
  try {
    const secret = getSessionSecret();
    const [timestampStr, signature] = token.split('.');
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Duración de sesión: 8 horas
    const SESSION_DURATION = 8 * 60 * 60 * 1000;
    if (Date.now() - timestamp > SESSION_DURATION || Date.now() < timestamp) {
      return false;
    }

    const expectedSig = crypto.createHmac('sha256', secret).update(`admin_session:${timestampStr}`).digest('hex');
    if (signature.length !== expectedSig.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
  } catch {
    return false;
  }
}
