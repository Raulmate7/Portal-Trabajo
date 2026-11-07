interface RateLimitInfo {
  count: number;
  resetAt: number;
}

/**
 * Normaliza direcciones IP para mitigar ataques de rotación de direcciones (Vector 18).
 * Para IPv6: agrupa por prefijo /64 (primeros 4 hextetos).
 * Para IPv4: elimina puertos espurios y espacios.
 */
export function normalizeIp(rawIp: string | null | undefined): string {
  if (!rawIp || typeof rawIp !== 'string') return '127.0.0.1';
  let ip = rawIp.trim();

  // Si contiene formato con puerto en IPv4 (ej. 192.168.1.1:8080), extraer solo la IP
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  // Si es IPv6 (contiene dos puntos)
  if (ip.includes(':')) {
    // Normalizar IPv6 y agrupar por subred /64 para evitar evasión mediante rotación de sufijo
    const parts = ip.split(':').filter(p => p.length > 0);
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::/64`.toLowerCase();
    }
    return ip.toLowerCase();
  }

  return ip;
}

export class RateLimiter {
  private ipMap: Map<string, RateLimitInfo> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  limit(rawIp: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const ip = normalizeIp(rawIp);
    const now = Date.now();
    let info = this.ipMap.get(ip);

    if (!info || info.resetAt < now) {
      info = { count: 0, resetAt: now + this.windowMs };
    }

    info.count++;
    this.ipMap.set(ip, info);

    // Limpieza de memoria (prevenir fugas)
    if (this.ipMap.size > 5000) {
      this.cleanup();
    }

    const remaining = Math.max(0, this.maxRequests - info.count);
    return {
      success: info.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining,
      reset: info.resetAt
    };
  }

  reset(rawIp: string): void {
    const ip = normalizeIp(rawIp);
    this.ipMap.delete(ip);
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, info] of this.ipMap.entries()) {
      if (info.resetAt < now) {
        this.ipMap.delete(ip);
      }
    }
  }
}

// Instancias globales de limitadores para distintos endpoints
export const freshAlertsLimiter = new RateLimiter(60000, 10); // 10 req / min
export const trackOpenLimiter = new RateLimiter(60000, 20); // 20 req / min
export const trackClickLimiter = new RateLimiter(60000, 30); // 30 req / min (anti-flood en track-click, Vector 19)
export const vacantesWidgetLimiter = new RateLimiter(60000, 30); // 30 req / min
export const checkoutLimiter = new RateLimiter(60000, 5); // 5 req / min
export const adminAuthLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 intentos / 15 min (anti-fuerza bruta admin)

export function getClientIp(request: Request): string {
  // Cloudflare pone la IP real en cf-connecting-ip (no falsificable si Cloudflare está activo)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // Header de IP real configurado en Nginx (proxy_set_header X-Real-IP $remote_addr)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // Fallback: primer IP de x-forwarded-for si está detrás de proxy inverso
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return '127.0.0.1'; // Fallback local
}
