import net from 'net';

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

  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  if (ip.includes(':')) {
    const parts = ip.split(':').filter(p => p.length > 0);
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::/64`.toLowerCase();
    }
    return ip.toLowerCase();
  }

  return ip;
}

/**
 * Cliente RESP2 ligero sobre TCP para Redis local (REDIS_URL=redis://127.0.0.1:6379)
 * sin dependencias externas y con timeout estricto de 400ms.
 */
function encodeRespCommand(args: string[]): string {
  let out = `*${args.length}\r\n`;
  for (const arg of args) {
    const bufLen = Buffer.byteLength(arg, 'utf8');
    out += `$${bufLen}\r\n${arg}\r\n`;
  }
  return out;
}

async function execLocalRedisCommands(redisUrl: string, commands: string[][]): Promise<Array<number | string | null>> {
  const parsed = new URL(redisUrl);
  const host = parsed.hostname || '127.0.0.1';
  const port = Number(parsed.port) || 6379;
  const password = parsed.password ? decodeURIComponent(parsed.password) : '';

  const allCmds = password ? [['AUTH', password], ...commands] : commands;
  const payload = allCmds.map(encodeRespCommand).join('');

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let raw = '';
    const expectedCount = allCmds.length;

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Redis TCP timeout'));
    }, 400);

    socket.on('connect', () => {
      socket.write(payload);
    });

    socket.on('data', (chunk) => {
      raw += chunk.toString('utf8');
      const lines = raw.split('\r\n');
      // Verificar si hemos recibido tantas respuestas simples (:int, +OK, $-1) como comandos enviados
      const completed = lines.slice(0, -1).filter(l =>
        l.startsWith(':') || l.startsWith('+') || l.startsWith('-') || l === '$-1'
      );
      if (completed.length >= expectedCount) {
        clearTimeout(timer);
        socket.end();
        const sliced = password ? completed.slice(1) : completed;
        const results = sliced.map(line => {
          if (line.startsWith(':')) return Number(line.slice(1));
          if (line.startsWith('+')) return line.slice(1);
          if (line === '$-1') return null;
          return line;
        });
        resolve(results);
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      socket.destroy();
      reject(err);
    });
  });
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

  /**
   * @deprecated Usar limitAsync() o limitKeyAsync() para soportar Redis distribuido/local.
   */
  limit(rawIp: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const ip = normalizeIp(rawIp);
    return this.limitLocalKey(ip);
  }

  private limitLocalKey(key: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    let info = this.ipMap.get(key);

    if (!info || info.resetAt < now) {
      info = { count: 0, resetAt: now + this.windowMs };
    }

    info.count++;
    this.ipMap.set(key, info);

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

  async limitAsync(rawIp: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const ip = normalizeIp(rawIp);
    return this.limitKeyAsync(ip);
  }

  /**
   * Rate limiting sobre clave arbitraria usando Redis local (REDIS_URL), Upstash REST o fallback LRU en RAM.
   */
  async limitKeyAsync(rawKey: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const safeKey = rawKey.trim().slice(0, 160);
    const redisKey = `ratelimit:${this.name}:${safeKey}`;

    // 1. Priorizar Redis local TCP si REDIS_URL está configurado
    const localRedisUrl = process.env.REDIS_URL;
    if (localRedisUrl) {
      try {
        const res = await execLocalRedisCommands(localRedisUrl, [
          ['INCR', redisKey],
          ['PTTL', redisKey],
        ]);
        const count = Number(res[0] || 1);
        let pttl = Number(res[1] ?? -1);
        if (pttl < 0) {
          await execLocalRedisCommands(localRedisUrl, [['PEXPIRE', redisKey, String(this.windowMs)]]).catch(() => {});
          pttl = this.windowMs;
        }
        const now = Date.now();
        return {
          success: count <= this.maxRequests,
          limit: this.maxRequests,
          remaining: Math.max(0, this.maxRequests - count),
          reset: now + (pttl > 0 ? pttl : this.windowMs),
        };
      } catch {
        // Fallback tolerante si Redis local no responde
      }
    }

    // 2. Upstash Redis REST si está configurado
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      try {
        const res = await fetch(`${redisUrl}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redisToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([
            ['INCR', redisKey],
            ['PTTL', redisKey]
          ]),
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          const count = Number(data[0]?.result || 1);
          let pttl = Number(data[1]?.result || -1);

          if (pttl < 0) {
            await fetch(`${redisUrl}/pexpire/${encodeURIComponent(redisKey)}/${this.windowMs}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${redisToken}` },
              cache: 'no-store'
            }).catch(() => {});
            pttl = this.windowMs;
          }

          const now = Date.now();
          return {
            success: count <= this.maxRequests,
            limit: this.maxRequests,
            remaining: Math.max(0, this.maxRequests - count),
            reset: now + (pttl > 0 ? pttl : this.windowMs)
          };
        }
      } catch {
        // Fallback a memoria
      }
    }

    // 3. Fallback LRU acotado en memoria
    return this.limitLocalKey(safeKey);
  }

  reset(rawIp: string): void {
    const ip = normalizeIp(rawIp);
    this.ipMap.delete(ip);
  }

  /**
   * Purga el contador de rate limit tanto en memoria local como en Redis local/Upstash (SEC-020).
   */
  async resetAsync(rawIp: string): Promise<void> {
    const ip = normalizeIp(rawIp);
    this.ipMap.delete(ip);
    const redisKey = `ratelimit:${this.name}:${ip}`;

    const localRedisUrl = process.env.REDIS_URL;
    if (localRedisUrl) {
      try {
        await execLocalRedisCommands(localRedisUrl, [['DEL', redisKey]]);
      } catch {}
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      try {
        await fetch(`${redisUrl}/del/${encodeURIComponent(redisKey)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` },
          cache: 'no-store'
        });
      } catch {}
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, info] of this.ipMap.entries()) {
      if (info.resetAt < now) {
        this.ipMap.delete(ip);
      }
    }
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
export const trackClickLimiter = new RateLimiter(60000, 30, 'track_click'); // 30 req / min
export const vacantesWidgetLimiter = new RateLimiter(60000, 30, 'widget_vacantes'); // 30 req / min
export const checkoutLimiter = new RateLimiter(60000, 5, 'checkout'); // 5 req / min
export const adminAuthLimiter = new RateLimiter(15 * 60 * 1000, 5, 'admin_auth'); // 5 intentos / 15 min
export const jobsApiLimiter = new RateLimiter(60000, 60, 'jobs_api'); // 60 req / min
export const salariosLimiter = new RateLimiter(60000, 40, 'salarios_api'); // 40 req / min
export const indexJobLimiter = new RateLimiter(60000, 30, 'index_job'); // 30 req / min
export const subscribeLimiter = new RateLimiter(60000, 6, 'subscribe'); // 6 req / min
export const unsubscribeLinkLimiter = new RateLimiter(15 * 60 * 1000, 3, 'unsub_link'); // 3 req / 15 min
export const actionsRateLimiter = new RateLimiter(60000, 10, 'actions'); // 10 req / min

export function getClientIp(request: Request): string {
  const nextReq = request as any;
  if (nextReq.ip && typeof nextReq.ip === 'string') {
    return nextReq.ip.trim();
  }

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(s => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }

  return '127.0.0.1';
}
