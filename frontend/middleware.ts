import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SEC-037: Políticas CSP dinámicas con nonce criptográfico por petición (sin 'unsafe-inline' ni 'unsafe-eval' en script-src)
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function buildDefaultCsp(nonce: string): string {
  return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://pagead2.googlesyndication.com https://cdn.onesignal.com https://onesignal.com https://www.googletagmanager.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.youtube.com https://js.stripe.com https://checkout.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'none'; upgrade-insecure-requests;`;
}

function buildAdminCsp(nonce: string): string {
  return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;`;
}

function getAllowedHosts(): Set<string> {
  const allowedHosts = new Set(['portalempleoit.com', 'www.portalempleoit.com', 'localhost', '127.0.0.1']);
  for (const envUrl of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ]) {
    if (envUrl) {
      try {
        allowedHosts.add(new URL(envUrl).hostname);
      } catch {}
    }
  }
  return allowedHosts;
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Verificación criptográfica HMAC-SHA256 de admin_session en Edge Runtime (SEC-018).
 */
async function verifyAdminSessionEdge(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || secret.trim() === '') return false;

  const parts = token.split('.');
  // Soporta {ts}.{jti}.{sig} (3 partes) y {ts}.{ver}.{jti}.{sig} (4 partes)
  if (parts.length !== 3 && parts.length !== 4) return false;

  const timestampStr = parts[0];
  const timestamp = parseInt(timestampStr, 10);
  const SESSION_DURATION = 8 * 60 * 60 * 1000;
  const now = Date.now();
  if (isNaN(timestamp) || now - timestamp > SESSION_DURATION || now < timestamp) {
    return false;
  }

  const signatureHex = parts[parts.length - 1];
  const sigBytes = hexToBytes(signatureHex);
  if (!sigBytes) return false;

  const payload = parts.length === 4
    ? `admin_session:${parts[0]}:${parts[1]}:${parts[2]}`
    : `admin_session:${parts[0]}:${parts[1]}`;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bloqueo en profundidad de archivos sensibles, dotfiles y backups (Vector 33)
  if (
    (pathname.startsWith('/.') && !pathname.startsWith('/.well-known')) ||
    /\.(sql|bak|backup|config|conf|ini|log|sh|py|yml|yaml|tar|gz|zip|swp|php)$/i.test(pathname) ||
    pathname.includes('package.json') ||
    pathname.includes('tsconfig.json') ||
    pathname.includes('package-lock.json') ||
    pathname.includes('composer.json') ||
    pathname.includes('composer.lock') ||
    pathname.includes('Dockerfile')
  ) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Control estricto de origen / CSRF en peticiones mutantes de API y Server Actions (SEC-016 & SEC-017)
  const isMutatingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
  const isServerAction = Boolean(request.headers.get('next-action'));
  const isWebhook = pathname.startsWith('/api/webhooks/');

  if ((isServerAction || isMutatingMethod) && !isWebhook) {
    const allowedHosts = getAllowedHosts();
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const secFetchSite = request.headers.get('sec-fetch-site');
    const hasAuthBearer = Boolean(request.headers.get('authorization'));

    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (!allowedHosts.has(originUrl.hostname)) {
          return NextResponse.json(
            { error: 'Violación de directiva de seguridad: origen no autorizado (CSRF)' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Formato de cabecera Origin inválido' },
          { status: 400 }
        );
      }
    } else if (referer) {
      try {
        const refUrl = new URL(referer);
        if (!allowedHosts.has(refUrl.hostname)) {
          return NextResponse.json(
            { error: 'Violación de directiva de seguridad: Referer no autorizado (CSRF)' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Formato de cabecera Referer inválido' },
          { status: 400 }
        );
      }
    } else if (secFetchSite !== 'same-origin' && !hasAuthBearer) {
      return NextResponse.json(
        { error: 'Violación de directiva de seguridad: origen mutante ausente (CSRF)' },
        { status: 403 }
      );
    }
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // 3. Control centralizado y criptográfico de acceso para rutas administrativas (SEC-018)
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    if (pathname !== '/admin' && !(await verifyAdminSessionEdge(sessionCookie))) {
      const loginUrl = new URL('/admin', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Cabeceras estrictas específicas para la sección de administración (anti-clickjacking) (Vector 31)
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', buildAdminCsp(nonce));
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=(), usb=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

    return response;
  }

  // 4. Cabeceras de seguridad globales para el resto del portal (Vector 31)
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', buildDefaultCsp(nonce));
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=(), usb=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Interceptar rutas de la aplicación excluyendo recursos estáticos compilados
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

