import crypto from 'crypto';

// Registro en memoria de sesiones revocadas (token o JTI -> timestamp de expiración)
const revokedSessions = new Map<string, number>();
let globalRevokeBefore: number = 0;

function getSessionSecret(): string {
  // Usar secreto dedicado para sesiones de administración o fallback a ADMIN_PASSWORD.
  // CRON_SECRET no debe compartirse ni usarse para autorizar sesiones de administración.
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('Configuración de seguridad de administración no inicializada (se requiere ADMIN_SESSION_SECRET o ADMIN_PASSWORD)');
  }
  return secret;
}

function cleanupRevoked() {
  const now = Date.now();
  for (const [key, expiry] of revokedSessions.entries()) {
    if (expiry < now) {
      revokedSessions.delete(key);
    }
  }
}

/**
 * Genera un token de sesión seguro con identificador único (JTI) y timestamp.
 * Formato: {timestamp}.{jti}.{signature}
 */
export function createAdminSessionToken(): string {
  const secret = getSessionSecret();
  const timestamp = Date.now().toString();
  const jti = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', secret).update(`admin_session:${timestamp}:${jti}`).digest('hex');
  return `${timestamp}.${jti}.${signature}`;
}

/**
 * Revoca un token de sesión específico de forma inmediata.
 */
export function revokeAdminSession(token: string | undefined | null): void {
  if (!token || typeof token !== 'string') return;
  try {
    const parts = token.split('.');
    const timestampStr = parts[0];
    const timestamp = parseInt(timestampStr, 10);
    const ttl = (isNaN(timestamp) ? Date.now() : timestamp) + (8 * 60 * 60 * 1000);

    revokedSessions.set(token, ttl);
    if (parts.length === 3) {
      revokedSessions.set(parts[1], ttl); // Revocar también por JTI
    }

    if (revokedSessions.size > 1000) {
      cleanupRevoked();
    }
  } catch {
    // ignore
  }
}

/**
 * Revoca todas las sesiones activas emitidas con anterioridad a este instante.
 */
export function revokeAllAdminSessions(): void {
  globalRevokeBefore = Date.now();
}

/**
 * Valida criptográficamente el token de sesión y comprueba que no haya expirado ni sido revocado.
 */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2 && parts.length !== 3) return false;

    const timestampStr = parts[0];
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Duración máxima de sesión: 8 horas
    const SESSION_DURATION = 8 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - timestamp > SESSION_DURATION || now < timestamp) {
      return false;
    }

    // Comprobar si la sesión fue emitida antes de una revocación global
    if (timestamp <= globalRevokeBefore) {
      return false;
    }

    // Comprobar si el token completo o su JTI está en la lista de revocación
    if (revokedSessions.has(token)) {
      return false;
    }

    const secret = getSessionSecret();

    if (parts.length === 3) {
      const [, jti, signature] = parts;
      if (!jti || !signature) return false;
      if (revokedSessions.has(jti)) {
        return false;
      }
      const expectedSig = crypto.createHmac('sha256', secret).update(`admin_session:${timestampStr}:${jti}`).digest('hex');
      if (signature.length !== expectedSig.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
    } else {
      // Compatibilidad retroactiva con tokens clásicos de 2 partes
      const [, signature] = parts;
      if (!signature) return false;
      const expectedSig = crypto.createHmac('sha256', secret).update(`admin_session:${timestampStr}`).digest('hex');
      if (signature.length !== expectedSig.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
    }
  } catch {
    return false;
  }
}
