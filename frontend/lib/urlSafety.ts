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

    // Validación de IPv4 contra rangos privados, loopback y link-local
    if (/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(host)) {
      const parts = host.split('.').map(n => parseInt(n, 10));
      const [p1, p2, p3, p4] = parts;

      if (parts.some(p => p > 255)) {
        return false;
      }

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

    // Validación de IPv6 (encerrado entre corchetes en URLs)
    if (host.startsWith('[') && host.endsWith(']')) {
      const inner = host.slice(1, -1).toLowerCase();
      if (
        inner === '::1' ||
        inner === '::' ||
        inner.startsWith('fe80:') || // Link-local
        inner.startsWith('fc') ||    // Unique Local Address
        inner.startsWith('fd') ||
        inner.startsWith('::ffff:')  // IPv4-mapped IPv6
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
 * Devuelve la URL original si pasa todos los filtros de seguridad,
 * o la URL de fallback especificada (por defecto '/').
 */
export function getSafeRedirectUrl(rawUrl: string | null | undefined, fallback: string = '/'): string {
  if (isSafePublicUrl(rawUrl)) {
    return rawUrl!.trim();
  }
  return fallback;
}

