import crypto from 'crypto';

/**
 * SEC-013: Hashea direcciones IP con HMAC-SHA256 usando un secreto de servidor dedicado
 * (sin sal estática predecible).
 */
export function hashClientIp(clientIp: string): string {
  const secret =
    process.env.IP_HASH_SECRET ||
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.APP_SECRET ||
    '';

  if (!secret || secret.trim().length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('IP_HASH_SECRET (o secreto de sesión equivalente >= 16 chars) es obligatorio en producción.');
    }
    return crypto.createHmac('sha256', 'dev-ephemeral-ip-hash-key').update(clientIp).digest('hex');
  }

  return crypto.createHmac('sha256', secret.trim()).update(clientIp).digest('hex');
}
