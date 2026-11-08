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
  private name: string;

  constructor(windowMs: number, maxRequests: number, name: string = 'default') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.name = name;
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

    // Limpieza LRU de memoria (Vector 21: Evitar saturación sin usar .clear() destructivo)
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

  /**
   * Rate limiting distribuido compatible con Upstash Redis / Vercel KV en Serverless (Vector 19).
   * Si no se configuran variables de Redis, recurre al RateLimiter local en memoria de alta velocidad.
   */
  async limitAsync(rawIp: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return this.limit(rawIp);
    }

    const ip = normalizeIp(rawIp);
    const key = `ratelimit:${this.name}:${ip}`;
    try {
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', key],
          ['PTTL', key]
        ]),
        cache: 'no-store'
      });

      if (!res.ok) {
        return this.limit(rawIp);
      }

      const data = await res.json();
      const count = Number(data[0]?.result || 1);
      let pttl = Number(data[1]?.result || -1);

      // Si la clave es nueva (no tenía TTL asignado)
      if (pttl < 0) {
        await fetch(`${redisUrl}/pexpire/${encodeURIComponent(key)}/${this.windowMs}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` },
          cache: 'no-store'
        }).catch(() => {});
        pttl = this.windowMs;
      }

      const now = Date.now();
      const remaining = Math.max(0, this.maxRequests - count);
      return {
        success: count <= this.maxRequests,
        limit: this.maxRequests,
        remaining,
        reset: now + (pttl > 0 ? pttl : this.windowMs)
      };
    } catch {
      // Fallback tolerante a fallos si Redis no responde
      return this.limit(rawIp);
    }
  }

  reset(rawIp: string): void {
    const ip = normalizeIp(rawIp);
    this.ipMap.delete(ip);
  }

  private cleanup() {
    const now = Date.now();
    // 1. Purgar primero entradas vencidas
    for (const [ip, info] of this.ipMap.entries()) {
      if (info.resetAt < now) {
        this.ipMap.delete(ip);
      }
    }
    // 2. Si todavía sobrepasa 5000 entradas (posible DoS de rotación de IPs), expulsar las más antiguas (LRU/FIFO)
    if (this.ipMap.size > 5000) {
      let toRemove = this.ipMap.size - 4000;
      for (const ip of this.ipMap.keys()) {
        this.ipMap.delete(ip);
        toRemove--;
        if (toRemove <= 0) break;
      }
    }
  }
}

// Instancias globales de limitadores para distintos endpoints con nombres para Redis
export const freshAlertsLimiter = new RateLimiter(60000, 10, 'fresh_alerts'); // 10 req / min
export const trackOpenLimiter = new RateLimiter(60000, 20, 'track_open'); // 20 req / min
export const trackClickLimiter = new RateLimiter(60000, 30, 'track_click'); // 30 req / min (anti-flood en track-click, Vector 19)
export const vacantesWidgetLimiter = new RateLimiter(60000, 30, 'widget_vacantes'); // 30 req / min
export const checkoutLimiter = new RateLimiter(60000, 5, 'checkout'); // 5 req / min
export const adminAuthLimiter = new RateLimiter(15 * 60 * 1000, 5, 'admin_auth'); // 5 intentos / 15 min (anti-fuerza bruta admin)
export const jobsApiLimiter = new RateLimiter(60000, 60, 'jobs_api'); // 60 req / min (anti-scraping y protección DoS)
export const salariosLimiter = new RateLimiter(60000, 40, 'salarios_api'); // 40 req / min (protección de cálculo salarial)
export const indexJobLimiter = new RateLimiter(60000, 30, 'index_job'); // 30 req / min (protección de cuota de indexación)

export function getClientIp(request: Request): string {
  // 1. IP directa de la conexión provista por NextRequest / Edge Runtime
  const nextReq = request as any;
  if (nextReq.ip && typeof nextReq.ip === 'string') {
    return nextReq.ip.trim();
  }

  // 2. Cloudflare pone la IP real en cf-connecting-ip (no falsificable si Cloudflare está activo)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // 3. Header de IP real configurado en Nginx (proxy_set_header X-Real-IP $remote_addr)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // 4. X-Forwarded-For: Mitigación de spoofing (Vector 20)
  // Cuando un atacante envía "X-Forwarded-For: spoofed_ip", el proxy seguro añade la IP real al final:
  // "X-Forwarded-For: spoofed_ip, real_client_ip".
  // Por tanto, la IP añadida por el proxy perimetral de confianza es la última entrada.
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(s => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }

  return '127.0.0.1'; // Fallback local
}
