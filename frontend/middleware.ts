import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Políticas CSP completas para mitigar XSS, Clickjacking e inyecciones de frames (Vector 31)
const DEFAULT_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://cdn.onesignal.com https://onesignal.com https://www.googletagmanager.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.youtube.com https://js.stripe.com https://checkout.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'none'; upgrade-insecure-requests;";
const ADMIN_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;";

export function middleware(request: NextRequest) {
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

  // 2. Control estricto de origen / CSRF en peticiones mutantes de API y Server Actions (Vector 22 & 34)
  const isMutatingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
  const isServerAction = Boolean(request.headers.get('next-action'));
  const isApi = pathname.startsWith('/api/');
  const isWebhook = pathname.startsWith('/api/webhooks/');

  if ((isApi || isServerAction || isMutatingMethod) && !isWebhook) {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const allowedHosts = new Set(['portalempleoit.com', 'www.portalempleoit.com', 'localhost', '127.0.0.1']);
        if (process.env.NEXT_PUBLIC_APP_URL) {
          try {
            allowedHosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname);
          } catch {}
        }
        if (process.env.NEXT_PUBLIC_BASE_URL) {
          try {
            allowedHosts.add(new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname);
          } catch {}
        }
        const hostHeader = request.headers.get('host') || request.headers.get('x-forwarded-host');
        if (hostHeader) {
          allowedHosts.add(hostHeader.split(':')[0]);
        }
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
    }
  }

  // 3. Control centralizado de acceso para rutas administrativas (Vector 12)
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    // Si intenta acceder a una subruta interna (/admin/algo) sin cookie de sesión estructurada,
    // redirigir preventivamente a /admin para autenticarse
    if (pathname !== '/admin' && (!sessionCookie || !sessionCookie.includes('.'))) {
      const loginUrl = new URL('/admin', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();

    // Cabeceras estrictas específicas para la sección de administración (anti-clickjacking) (Vector 31)
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', ADMIN_CSP);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    return response;
  }

  // 4. Cabeceras de seguridad globales para el resto del portal (Vector 31)
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', DEFAULT_CSP);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

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

