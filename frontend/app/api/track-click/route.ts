import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
  const email = searchParams.get('email') || '';
  const campaign = searchParams.get('campaign') || '';
  const redirect = searchParams.get('url') || searchParams.get('redirect') || '';

  // Validar redirecciones contra open redirect
  const targetUrl = getSanitizedRedirect(redirect, request.url);

  if (email && campaign) {
    const client = await pool.connect();
    try {
      // Registrar el click agregando un sufijo ':click' a la campaña y registrando la url cliqueada
      await client.query(
        'INSERT INTO email_tracking (email, campaign, clicked_url) VALUES ($1, $2, $3)',
        [email.trim().toLowerCase(), `${campaign.trim()}:click`, targetUrl]
      );
      console.log(`📈 Email click tracked: ${email} in campaign ${campaign} -> ${targetUrl}`);
    } catch (error) {
      console.error('Error logging email track-click:', error);
    } finally {
      client.release();
    }
  }

  return NextResponse.redirect(new URL(targetUrl, request.url));
}
