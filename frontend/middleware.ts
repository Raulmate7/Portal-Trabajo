import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bloqueo en profundidad de archivos sensibles, dotfiles y backups (Vector 33)
  if (
    (pathname.startsWith('/.') && !pathname.startsWith('/.well-known')) ||
    /\.(sql|bak|backup|config|conf|ini|log|sh|py|yml|yaml|tar|gz|zip|swp|php)$/i.test(pathname) ||
    pathname.includes('package.json') ||
    pathname.includes('tsconfig.json')
  ) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Control estricto de origen / CORS en peticiones mutantes de API (Vector 34)
  if (
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
    !pathname.startsWith('/api/webhooks/')
  ) {
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
        if (!allowedHosts.has(originUrl.hostname)) {
          return NextResponse.json(
            { error: 'Violación de directiva CORS: origen no autorizado' },
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
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
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
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

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

