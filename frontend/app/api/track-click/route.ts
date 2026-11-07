import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { trackClickLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Registro de deduplicación en memoria para mitigar inundaciones repetidas (Vector 19)
const recentClicks = new Map<string, number>();

function cleanupRecentClicks() {
  const now = Date.now();
  for (const [key, timestamp] of recentClicks.entries()) {
    if (now - timestamp > 60000) {
      recentClicks.delete(key);
    }
  }
}

function getSanitizedRedirect(redirectParam: string, requestUrl: string): string {
  if (!redirectParam) return '/';

  let decoded = '';
  try {
    decoded = decodeURIComponent(redirectParam).trim();
  } catch {
    return '/';
  }

  // Prevenir bypass de schema protocol-relative tipo '//evil.com'
  if (decoded.startsWith('//')) {
    return '/';
  }

  // Rutas relativas internas seguras
  if (decoded.startsWith('/') && !decoded.startsWith('/\\')) {
    return decoded;
  }

  try {
    const currentUrl = new URL(requestUrl);
    const parsed = new URL(decoded);

    // Solo admitir protocolos web seguros
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '/';
    }

    // Mismo origen permitido
    if (parsed.origin === currentUrl.origin) {
      return decoded;
    }

    // Hostnames explícitamente permitidos
    const configuredHosts = (process.env.ALLOWED_REDIRECT_HOSTS || '')
      .split(',')
      .map(h => h.trim().toLowerCase())
      .filter(Boolean);

    const defaultAllowedHosts = [
      'portalempleoit.com',
      'www.portalempleoit.com',
      'localhost',
      '127.0.0.1',
      'trk.udemy.com',
      'udemy.com'
    ];

    const allAllowedHosts = new Set([...configuredHosts, ...defaultAllowedHosts]);
    const targetHost = parsed.hostname.toLowerCase();

    if (allAllowedHosts.has(targetHost)) {
      return decoded;
    }

    // Comprobar si es un subdominio permitido
    for (const allowed of allAllowedHosts) {
      if (targetHost.endsWith(`.${allowed}`)) {
        return decoded;
      }
    }

    return '/';
  } catch {
    return '/';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get('email') || '';
  const rawCampaign = searchParams.get('campaign') || '';
  const redirect = searchParams.get('url') || searchParams.get('redirect') || '';

  // Validar redirecciones contra open redirect
  const targetUrl = getSanitizedRedirect(redirect, request.url);

  // 1. Rate Limiting anti-inundación en track-click (Vector 19)
  const clientIp = getClientIp(request);
  const rateLimit = trackClickLimiter.limit(clientIp);

  // Si se excede la tasa, redirigir al usuario al destino sin saturar la base de datos
  if (!rateLimit.success) {
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  const cleanEmail = rawEmail.trim().toLowerCase();
  const cleanCampaign = rawCampaign.trim();

  // 2. Validación estricta de parámetros para prevenir inyección de basura masiva
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) && cleanEmail.length <= 100;
  const isCampaignValid = /^[a-zA-Z0-9\-_:]{1,60}$/.test(cleanCampaign);
  const isTargetUrlSafe = targetUrl.length <= 500;

  if (isEmailValid && isCampaignValid && isTargetUrlSafe) {
    // 3. Deduplicación temporal (evita que un clic repetido o bot inserte múltiples filas en < 10 segundos)
    const dedupKey = `${cleanEmail}:${cleanCampaign}:${targetUrl.slice(0, 80)}`;
    const now = Date.now();
    const lastClickTime = recentClicks.get(dedupKey);

    if (!lastClickTime || now - lastClickTime > 10000) {
      recentClicks.set(dedupKey, now);

      if (recentClicks.size > 2000) {
        cleanupRecentClicks();
      }

      const client = await pool.connect();
      try {
        await client.query(
          'INSERT INTO email_tracking (email, campaign, clicked_url) VALUES ($1, $2, $3)',
          [cleanEmail, `${cleanCampaign}:click`, targetUrl]
        );
        // Sanitizar caracteres de control para prevenir log injection
        const safeLogEmail = cleanEmail.replace(/[\r\n\x00-\x1f]/g, '');
        const safeLogCamp = cleanCampaign.replace(/[\r\n\x00-\x1f]/g, '');
        console.log(`📈 Email click tracked: ${safeLogEmail} in campaign ${safeLogCamp}`);
      } catch (error) {
        console.error('Error logging email track-click:', error);
      } finally {
        client.release();
      }
    }
  }

  return NextResponse.redirect(new URL(targetUrl, request.url));
}
