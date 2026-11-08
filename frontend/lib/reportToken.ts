import crypto from 'crypto';

function getReportTokenSecret(): string {
  const secret = process.env.MAGIC_LINK_SECRET || process.env.CRON_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('Configuración de seguridad incompleta: secreto criptográfico no definido o longitud insuficiente');
  }
  return secret;
}

/**
 * Genera un token firmado criptográficamente (HMAC-SHA256) para autorizar la descarga
 * de informes de mercado IT de pago, mitigando ataques de bypass de paywall por IDOR o URL.
 */
export function generateReportToken(email: string, plan: string, sessionId: string): string {
  const secret = getReportTokenSecret();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // Validez de 24 horas
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPlan = (plan || 'full').trim().toLowerCase();
  const cleanSessionId = (sessionId || '').trim();

  const payload = `${cleanEmail}:${cleanPlan}:${cleanSessionId}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const tokenObj = {
    p: payload,
    s: sig,
  };

  return Buffer.from(JSON.stringify(tokenObj), 'utf-8').toString('base64url');
}

/**
 * Verifica la firma y la fecha de expiración del token de descarga del informe.
 */
export function verifyReportToken(token: string): { valid: boolean; email?: string; plan?: string; sessionId?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const tokenObj = JSON.parse(raw);
    const { p: payload, s: sig } = tokenObj;

    if (!payload || !sig) {
      return { valid: false };
    }

    const secret = getReportTokenSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const sigBuf = Buffer.from(sig, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false };
    }

    const parts = payload.split(':');
    if (parts.length !== 4) {
      return { valid: false };
    }

    const [email, plan, sessionId, expiresAtStr] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    return {
      valid: true,
      email,
      plan,
      sessionId,
    };
  } catch {
    return { valid: false };
  }
}

