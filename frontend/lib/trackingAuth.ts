import crypto from 'crypto';

export interface TrackingPayload {
  email: string;
  campaign: string;
  redirect?: string;
  exp?: number;
}

function getTrackingSecret(): string | null {
  const secret =
    process.env.TRACKING_HMAC_SECRET ||
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.ADMIN_SESSION_SECRET;
  return secret && secret.trim() !== '' ? secret : null;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length || !/^[0-9a-fA-F]+$/.test(a) || !/^[0-9a-fA-F]+$/.test(b)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/**
 * SEC-042 & SEC-043: Verifica un token opaco firmado con HMAC-SHA256 (`t=<b64url>.<hexSig>`)
 * que encapsula email, campaign y redirect sin exponer PII en claro en URLs ni logs.
 */
export function verifyOpaqueTrackingToken(token: string): TrackingPayload | null {
  const secret = getTrackingSecret();
  if (!secret || !token || !token.includes('.')) return null;

  const dotIdx = token.indexOf('.');
  const b64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!b64 || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(b64).digest('hex');
  if (!timingSafeHexEqual(sig, expectedSig)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(b64, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed.e !== 'string' || typeof parsed.c !== 'string') {
      return null;
    }
    if (typeof parsed.exp === 'number' && parsed.exp > 0 && Math.floor(Date.now() / 1000) > parsed.exp) {
      return null;
    }
    return {
      email: parsed.e.trim().toLowerCase(),
      campaign: parsed.c.trim(),
      redirect: typeof parsed.r === 'string' ? parsed.r : undefined,
      exp: typeof parsed.exp === 'number' ? parsed.exp : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica firma HMAC-SHA256 sobre parámetros explícitos (compatibilidad con enlaces firmados legacy).
 */
export function verifyTrackingSignature(
  email: string,
  campaign: string,
  sig: string,
  redirect = '',
  expStr = ''
): boolean {
  const secret = getTrackingSecret();
  if (!secret || !sig) return false;

  if (expStr) {
    const exp = Number.parseInt(expStr, 10);
    if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) {
      return false;
    }
  }

  const canonical = redirect
    ? `${email}|${campaign}|${redirect}${expStr ? `|${expStr}` : ''}`
    : `${email}|${campaign}${expStr ? `|${expStr}` : ''}`;

  const expectedSig = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return timingSafeHexEqual(sig, expectedSig);
}
