/**
 * SEC-052: Verificación centralizada de Cloudflare Turnstile en servidor.
 * Cuando TURNSTILE_SECRET_KEY está configurada en entorno, exige un token válido.
 */
export async function verifyTurnstileToken(token: string | null | undefined, clientIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || secret.trim() === '') {
    return true;
  }

  const cleanToken = (token || '').trim();
  if (!cleanToken) {
    return false;
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: cleanToken,
        remoteip: clientIp,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}
