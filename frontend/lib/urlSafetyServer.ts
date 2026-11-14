import dns from 'dns/promises';
import net from 'net';
import { isSafePublicUrl } from './urlSafety';

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((n) => parseInt(n, 10));
    const [p1, p2] = parts;
    return (
      p1 === 127 ||
      p1 === 10 ||
      p1 === 0 ||
      (p1 === 172 && p2 >= 16 && p2 <= 31) ||
      (p1 === 192 && p2 === 168) ||
      (p1 === 169 && p2 === 254) ||
      (p1 === 100 && p2 >= 64 && p2 <= 127) ||
      (p1 === 198 && (p2 === 18 || p2 === 19)) ||
      p1 >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('::ffff:127.') ||
      lower.startsWith('::ffff:10.') ||
      lower.startsWith('::ffff:192.168.') ||
      lower.startsWith('::ffff:169.254.')
    );
  }
  return true;
}

/**
 * SEC-044: Valida sintaxis SSRF y resuelve DNS en servidor para bloquear DNS Rebinding hacia IPs privadas.
 */
export async function isSafePublicUrlWithDns(rawUrl: string | null | undefined): Promise<boolean> {
  if (!isSafePublicUrl(rawUrl)) return false;
  try {
    const host = new URL(rawUrl!.trim()).hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host)) {
      return !isPrivateOrReservedIp(host);
    }
    const records = await dns.lookup(host, { all: true });
    if (!records || records.length === 0) return false;
    return records.every((rec) => !isPrivateOrReservedIp(rec.address));
  } catch {
    return false;
  }
}
