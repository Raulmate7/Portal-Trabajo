/**
 * Utilidades para validación estricta de URLs contra ataques de Open Redirect,
 * SSRF (Server-Side Request Forgery) y Phishing Ciego.
 */

/**
 * Determina si una URL es segura para redirección pública y peticiones externas.
 * Rechaza esquemas no seguros (javascript:, data:), direcciones de loopback (127.0.0.1, localhost),
 * rangos privados de red (RFC 1918: 10.x, 172.16-31.x, 192.168.x), metadatos de proveedores cloud (169.254.169.254),
 * IPv6 locales, credenciales incrustadas y caracteres de control (CRLF).
 */
export function isSafePublicUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return false;
  }

  // Prevenir inyección CRLF / Response Splitting y caracteres de control
  if (/[\r\n\x00-\x1f\x7f]/.test(trimmed)) {
    return false;
  }

  // Prevenir bypass de schema protocol-relative o barras invertidas (//evil.com, /\\evil.com, \\evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // Solo admitir protocolos web estándar
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Prevenir credenciales incrustadas (phishing tipo https://user:pass@evil.com)
    if (parsed.username || parsed.password) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (!host || host.length > 253) {
      return false;
    }

    // Nombres de host locales o reservados
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.endsWith('.lan') ||
      host.endsWith('.arpa') ||
      host.endsWith('.corp') ||
      host.endsWith('.home') ||
      host === 'metadata.google.internal' ||
      host === 'instance-data'
    ) {
      return false;
    }

    // Representaciones enteras o hexadecimales de IPs (evasiones de SSRF tipo http://2130706433 o http://0x7f000001)
    if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
      return false;
    }

    // VULN-08: Detección y normalización de IPs numéricas (incluyendo abreviadas tipo 127.1, 10.1 o con octal/hex)
    const isDottedNumeric = host.split('.').every(part => /^(0x[0-9a-f]+|\d+)$/i.test(part));
    if (isDottedNumeric) {
      const rawParts = host.split('.');
      // Rechazar IPs con menos o más de 4 octetos (ej. 127.1, 127.0.1, 10.1)
      if (rawParts.length !== 4) {
        return false;
      }

      // Normalizar partes numéricas (decimal, octal y hexadecimal)
      const parts = rawParts.map(p => {
        if (/^0x/i.test(p)) return parseInt(p, 16);
        if (p.length > 1 && p.startsWith('0')) return parseInt(p, 8);
        return parseInt(p, 10);
      });

      if (parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        return false;
      }

      const [p1, p2, p3, p4] = parts;
      if (
        p1 === 127 || // Loopback 127.0.0.0/8
        p1 === 10 ||  // Red privada RFC 1918 10.0.0.0/8
        p1 === 0 ||   // Red actual 0.0.0.0/8
        (p1 === 172 && p2 >= 16 && p2 <= 31) || // Red privada RFC 1918 172.16.0.0/12
        (p1 === 192 && p2 === 168) || // Red privada RFC 1918 192.168.0.0/16
        (p1 === 169 && p2 === 254) || // Link-Local / Cloud Metadata (AWS, GCP, Azure 169.254.169.254)
        (p1 === 100 && p2 >= 64 && p2 <= 127) || // Carrier-Grade NAT RFC 6598
        (p1 === 198 && (p2 === 18 || p2 === 19)) || // Benchmark RFC 2544
        p1 >= 224 // Multicast (224.0.0.0/4), Reservado (240.0.0.0/4) y Broadcast (255.255.255.255)
      ) {
        return false;
      }
    }

    // VULN-09: Validación robusta de IPv6 (encerrado entre corchetes en URLs)
    if (host.startsWith('[') && host.endsWith(']')) {
      const inner = host.slice(1, -1).toLowerCase();
      // Detectar loopback en todas sus formas (comprimida ::1, expandida 0:0:..:1)
      const isLoopbackIPv6 = 
        inner === '::1' || 
        inner === '::' || 
        /^0*(:0*){1,7}:0*1$/.test(inner) ||
        inner.endsWith(':7f00:1') || // 127.0.0.1 en hex
        inner.includes('127.0.0.1');

      if (
        isLoopbackIPv6 ||
        inner.startsWith('fe80:') || // Link-local
        inner.startsWith('fc') ||    // Unique Local Address (ULA fc00::/7)
        inner.startsWith('fd') ||    // Unique Local Address (ULA fd00::/8)
        inner.startsWith('ff') ||    // Multicast (ff00::/8)
        inner.startsWith('::ffff:') || // IPv4-mapped IPv6
        inner.includes('169.254.') || // Cloud Metadata
        inner.includes('10.') ||      // RFC 1918 privado
        inner.includes('192.168.') || // RFC 1918 privado
        /172\.(1[6-9]|2[0-9]|3[0-1])\./.test(inner) // RFC 1918 privado
      ) {
        return false;
      }
    }

    // Debe contener al menos un punto y un dominio de nivel superior
    if (!host.includes('.')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * VULN-10: Resuelve el host mediante DNS y valida que ninguna dirección IP resuelta
 * pertenezca a rangos privados o de loopback, mitigando ataques de DNS Rebinding y TOCTOU.
 */
export async function resolveAndValidatePublicUrl(rawUrl: string | null | undefined): Promise<boolean> {
  if (!isSafePublicUrl(rawUrl)) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl!.trim());
    const host = parsed.hostname.toLowerCase();

    // Si ya es una IP sintáctica validada por isSafePublicUrl, no requiere resolución DNS
    if (/^[0-9.]+$/.test(host) || (host.startsWith('[') && host.endsWith(']'))) {
      return true;
    }

    // Resolver todas las direcciones IPv4/IPv6 asignadas al host (exclusivamente en servidor)
    if (typeof window !== 'undefined') {
      return true; // En cliente no se realiza resolución DNS de servidor
    }
    const dnsModule = 'dns';
    const dns = await import(/* webpackIgnore: true */ dnsModule);
    const records = await dns.promises.lookup(host, { all: true });

    for (const record of records) {
      const ip = record.address;
      // Re-verificar la dirección IP resuelta con el validador base
      const testUrl = record.family === 6 ? `http://[${ip}]` : `http://${ip}`;
      if (!isSafePublicUrl(testUrl)) {
        return false;
      }
    }

    return true;
  } catch {
    // Si la resolución DNS falla o el host no existe, denegar por seguridad (Fail-Closed)
    return false;
  }
}

/**
 * Devuelve la URL original si pasa todos los filtros de seguridad,
 * o la URL de fallback especificada (por defecto '/').
 */
export function getSafeRedirectUrl(rawUrl: string | null | undefined, fallback: string = '/'): string {
  if (isSafePublicUrl(rawUrl)) {
    return rawUrl!.trim();
  }
  return fallback;
}

/**
 * VULN-20: Valida que una URL devuelta por la pasarela de pagos pertenezca
 * exclusivamente al dominio oficial https://checkout.stripe.com/
 * para mitigar ataques de Open Redirect en componentes del cliente.
 */
export function isSafeStripeRedirectUrl(rawUrl: unknown): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' && parsed.hostname === 'checkout.stripe.com';
  } catch {
    return false;
  }
}

/**
 * VULN-30: Valida que la cabecera Origin o Referer de la petición proceda
 * del dominio legítimo de la aplicación para mitigar CSRF y cross-origin checkout abuse.
 */
export function isValidApiOrigin(request: Request, allowedBaseUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite === 'cross-site') return false;
    return true; // Petición same-origin o directa
  }
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const baseHost = new URL(allowedBaseUrl).host.toLowerCase();
    return originHost === baseHost || originHost === 'localhost:3000' || originHost === '127.0.0.1:3000';
  } catch {
    return false;
  }
}

