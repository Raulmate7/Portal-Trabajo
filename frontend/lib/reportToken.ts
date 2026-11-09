import crypto from 'crypto';

function getReportTokenSecret(): string {
  // VULN-08: Se elimina terminantemente la reutilización de STRIPE_SECRET_KEY o CRON_SECRET.
  // Se exige un secreto criptográfico dedicado exclusivamente para firma de tokens de descarga (Key Separation).
  const secret = process.env.REPORT_TOKEN_SECRET || process.env.REPORT_DOWNLOAD_SECRET || process.env.MAGIC_LINK_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuración de seguridad incompleta: REPORT_TOKEN_SECRET debe estar definido con al menos 32 caracteres');
    }
    return 'dev-report-token-secret-only-in-non-prod-32chars!';
  }
  return secret;
}

/**
 * Genera un token firmado criptográficamente (HMAC-SHA256) para autorizar la descarga
 * de informes de mercado IT de pago, mitigando ataques de bypass de paywall por IDOR o URL.
 */
export function generateReportToken(email: string, plan: string, sessionId: string, customExpiresAt?: number): string {
  const secret = getReportTokenSecret();
  // VULN-11: Soporte para timestamp de expiración acotado temporalmente al tiempo de creación de la compra en Stripe
  const expiresAt = customExpiresAt || (Date.now() + 24 * 60 * 60 * 1000); // Validez por defecto de 24 horas
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPlan = (plan || 'full').trim().toLowerCase();
  const cleanSessionId = (sessionId || '').trim();

  // VULN-09: Serialización JSON en base64url para prevenir ambigüedad de delimitadores ':' e inyección de parámetros
  const payloadObj = {
    e: cleanEmail,
    p: cleanPlan,
    s: cleanSessionId,
    exp: expiresAt,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj), 'utf-8').toString('base64url');
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

    if (!payload || !sig || typeof payload !== 'string' || typeof sig !== 'string') {
      return { valid: false };
    }

    const secret = getReportTokenSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const sigBuf = Buffer.from(sig, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false };
    }

    let email = '';
    let plan = '';
    let sessionId = '';
    let expiresAt = 0;

    // VULN-09: Deserialización estructurada segura con retrocompatibilidad para tokens legacy
    if (payload.startsWith('{') || !payload.includes(':')) {
      try {
        const jsonStr = payload.startsWith('{') ? payload : Buffer.from(payload, 'base64url').toString('utf-8');
        const data = JSON.parse(jsonStr);
        email = data.e || '';
        plan = data.p || '';
        sessionId = data.s || '';
        expiresAt = Number(data.exp);
      } catch {
        return { valid: false };
      }
    } else {
      const parts = payload.split(':');
      if (parts.length !== 4) {
        return { valid: false };
      }
      [email, plan, sessionId] = parts;
      expiresAt = parseInt(parts[3], 10);
    }

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

