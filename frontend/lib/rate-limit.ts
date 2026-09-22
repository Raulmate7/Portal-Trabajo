interface RateLimitInfo {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private ipMap: Map<string, RateLimitInfo> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  limit(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
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
export const vacantesWidgetLimiter = new RateLimiter(60000, 30); // 30 req / min

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1'; // Fallback
}
