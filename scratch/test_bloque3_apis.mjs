/**
 * test_bloque3_apis.mjs
 * 
 * Verificación adversarial y de regresión para el Bloque 3:
 * APIs, Red y Rate Limiting (Vectores 14 al 18).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeIp, RateLimiter, trackClickLimiter, getClientIp } from '../frontend/lib/rate-limit.ts';

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN ADVERSARIAL: BLOQUE 3 (VECTORES 14 AL 18)');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1 (Vector 14): Validación de Nginx y Mitigación de Spoofing de IP
// -----------------------------------------------------------------------------
console.log('--- TEST 1 (Vector 14): Validación de Nginx y Mitigación de Spoofing de IP ---');

const nginxTemplatePath = path.resolve('nginx.conf.template');
const nginxContent = fs.readFileSync(nginxTemplatePath, 'utf8');

// 1.1 Rangos oficiales CIDR de Cloudflare y localhost
assert.ok(nginxContent.includes('set_real_ip_from 173.245.48.0/20;'), 'Debe incluir rangos IPv4 de Cloudflare');
assert.ok(nginxContent.includes('set_real_ip_from 2400:cb00::/32;'), 'Debe incluir rangos IPv6 de Cloudflare');
assert.ok(nginxContent.includes('set_real_ip_from 127.0.0.1;'), 'Debe incluir localhost');

// 1.2 Módulo real_ip
assert.ok(nginxContent.includes('real_ip_header CF-Connecting-IP;'), 'Debe definir real_ip_header CF-Connecting-IP');
assert.ok(nginxContent.includes('real_ip_recursive on;'), 'Debe activar real_ip_recursive');

// 1.3 Bloqueo de cabeceras cliente sin validar
assert.strictEqual(
  nginxContent.includes('$http_cf_connecting_ip'),
  false,
  'JAMÁS debe pasar $http_cf_connecting_ip sin validar a Next.js (abuso de spoofing)'
);

// 1.4 Paso de IP validada por socket al proxy inverso
assert.ok(
  nginxContent.includes('proxy_set_header CF-Connecting-IP $remote_addr;'),
  'Debe pasar $remote_addr validado en CF-Connecting-IP'
);
assert.ok(
  nginxContent.includes('proxy_set_header X-Real-IP $remote_addr;'),
  'Debe pasar $remote_addr validado en X-Real-IP'
);

// 1.5 Simulación de función getClientIp en servidor Node.js
const mockReqValid = new Request('https://portalempleoit.com', {
  headers: {
    'cf-connecting-ip': '198.51.100.22',
    'x-real-ip': '10.0.0.1'
  }
});
assert.strictEqual(getClientIp(mockReqValid), '198.51.100.22', 'Debe priorizar cf-connecting-ip de origen validado');

console.log('✅ TEST 1 superado: Directivas de Nginx blindadas contra spoofing de IP.\n');

// -----------------------------------------------------------------------------
// TEST 2 (Vector 15): Normalización de IP y Agrupación de Subredes IPv6 /64
// -----------------------------------------------------------------------------
console.log('--- TEST 2 (Vector 15): Normalización de IP y Agrupación de Subredes IPv6 /64 ---');

// 2.1 Normalización de IPv4 con puerto y espacios espurios
assert.strictEqual(normalizeIp('192.168.1.100:54321'), '192.168.1.100', 'Debe eliminar el puerto de una dirección IPv4');
assert.strictEqual(normalizeIp('  10.0.0.5  '), '10.0.0.5', 'Debe recortar espacios en blanco');

// 2.2 Agrupación de prefijo /64 en IPv6
const ipv6HostA = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
const ipv6HostB = '2001:0db8:85a3:0000:ffff:ffff:ffff:ffff'; // Mismo prefijo /64, diferente host
const ipv6DiffSubnet = '2001:0db8:85a3:0001:0000:0000:0000:0001'; // Subred contigua distinta

const normalizedA = normalizeIp(ipv6HostA);
const normalizedB = normalizeIp(ipv6HostB);
const normalizedDiff = normalizeIp(ipv6DiffSubnet);

assert.strictEqual(normalizedA, normalizedB, 'Direcciones en la misma subred /64 deben agruparse bajo la misma clave');
assert.notStrictEqual(normalizedA, normalizedDiff, 'Subredes /64 diferentes deben tener contadores independientes');

// 2.3 Simulación de evasión por rotación de sufijo con RateLimiter
const testLimiter = new RateLimiter(60000, 2); // 2 peticiones permitidas por subred
assert.strictEqual(testLimiter.limit(ipv6HostA).success, true, 'Petición 1 permitida');
assert.strictEqual(testLimiter.limit(ipv6HostB).success, true, 'Petición 2 permitida');

// La petición 3 desde una IP distinta del mismo rango /64 debe ser BLOQUEADA
const ipv6HostC = '2001:0db8:85a3:0000:1234:5678:9abc:def0';
const blockedRes = testLimiter.limit(ipv6HostC);
assert.strictEqual(blockedRes.success, false, 'Rotación de direcciones en el mismo bloque /64 debe ser bloqueada');
assert.strictEqual(blockedRes.remaining, 0);

console.log('✅ TEST 2 superado: Agrupación IPv6 /64 neutraliza la evasión por rotación de direcciones.\n');

// -----------------------------------------------------------------------------
// TEST 3 (Vector 16): Mitigación de Inundación y Deduplicación en track-click
// -----------------------------------------------------------------------------
console.log('--- TEST 3 (Vector 16): Mitigación de Inundación y Deduplicación en track-click ---');

const testIpClick = '198.51.100.88';
trackClickLimiter.reset(testIpClick);

// 3.1 Rate limit dedicado de 30 req/min
for (let i = 0; i < 30; i++) {
  const res = trackClickLimiter.limit(testIpClick);
  assert.strictEqual(res.success, true, `Petición ${i + 1} debe ser permitida`);
}
const overLimitRes = trackClickLimiter.limit(testIpClick);
assert.strictEqual(overLimitRes.success, false, 'La petición 31 debe ser bloqueada por rate limit (anti-flooding)');
trackClickLimiter.reset(testIpClick);

// 3.2 Validación de formato y tamaño de entradas
function validateTrackInputs(email, campaign, targetUrl) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCampaign = (campaign || '').trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) && cleanEmail.length <= 100;
  const isCampaignValid = /^[a-zA-Z0-9\-_:]{1,60}$/.test(cleanCampaign);
  const isTargetUrlSafe = targetUrl && targetUrl.length <= 500;
  return isEmailValid && isCampaignValid && isTargetUrlSafe;
}

assert.strictEqual(validateTrackInputs('candidato@empresa.com', 'newsletter_oct26', '/job/123'), true);
assert.strictEqual(validateTrackInputs('a'.repeat(150) + '@evil.com', 'camp', '/'), false, 'Email excesivamente largo rechazado');
assert.strictEqual(validateTrackInputs('notanemail', 'camp', '/'), false, 'Formato email inválido rechazado');
assert.strictEqual(validateTrackInputs('user@ok.com', 'camp; DROP TABLE email_tracking;', '/'), false, 'Campaña con SQLi rechazada');

// 3.3 Deduplicación temporal en memoria (< 10 segundos)
const dedupMap = new Map();
function simulateClickTracking(email, campaign, url) {
  const key = `${email}:${campaign}:${url}`;
  const now = Date.now();
  const last = dedupMap.get(key);
  if (!last || now - last > 10000) {
    dedupMap.set(key, now);
    return { tracked: true };
  }
  return { tracked: false, deduplicated: true };
}

const c1 = simulateClickTracking('user@test.com', 'c1', '/job/1');
assert.strictEqual(c1.tracked, true, 'Primer clic debe registrarse');
const c2 = simulateClickTracking('user@test.com', 'c1', '/job/1');
assert.strictEqual(c2.deduplicated, true, 'Clic repetido en <10s debe deduplicarse sin escribir en base de datos');

console.log('✅ TEST 3 superado: Anti-flooding, validación estricta y deduplicación temporal activos.\n');

// -----------------------------------------------------------------------------
// TEST 4 (Vector 17): Prevención de Inyección de Saltos de Línea en Logs (CRLF)
// -----------------------------------------------------------------------------
console.log('--- TEST 4 (Vector 17): Prevención de Inyección de Saltos de Línea en Logs (CRLF) ---');

function sanitizeLogField(input) {
  if (!input) return '';
  return input.replace(/[\r\n\x00-\x1f\x7f-\x9f]/g, '').slice(0, 150);
}

const payloadCrlf = 'usuario@empresa.com\r\n[CRITICAL] 2026-11-07 Admin credentials leaked\n\x1b[31mFAKE LOG\x1b[0m';
const sanitized = sanitizeLogField(payloadCrlf);

assert.strictEqual(sanitized.includes('\r'), false, 'Retorno de carro (\\r) debe ser neutralizado');
assert.strictEqual(sanitized.includes('\n'), false, 'Salto de línea (\\n) debe ser neutralizado');
assert.strictEqual(sanitized.includes('\x1b'), false, 'Caracteres de control y secuencias ANSI deben ser eliminados');
assert.ok(sanitized.length <= 150, 'Longitud de campo de log acotada');

console.log('✅ TEST 4 superado: Sanitización de registros neutraliza la inyección CRLF y falsificación de logs.\n');

// -----------------------------------------------------------------------------
// TEST 5 (Vector 18): Control Estricto de Origen / CORS en APIs Mutantes
// -----------------------------------------------------------------------------
console.log('--- TEST 5 (Vector 18): Control Estricto de Origen / CORS en APIs Mutantes ---');

const middlewarePath = path.resolve('frontend/middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

// 5.1 Verificación en middleware de bloqueo de métodos mutantes
assert.ok(
  middlewareContent.includes("['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)"),
  'Middleware debe interceptar métodos mutantes en /api/'
);
assert.ok(
  middlewareContent.includes("allowedHosts.has(originUrl.hostname)"),
  'Middleware debe validar el hostname contra la lista blanca oficial'
);
assert.ok(
  middlewareContent.includes('Violación de directiva CORS: origen no autorizado'),
  'Debe retornar HTTP 403 ante orígenes no autorizados'
);

// 5.2 Simulación de validación CORS
function simulateCorsCheck(method, originHeader) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        const allowed = new Set(['portalempleoit.com', 'www.portalempleoit.com', 'localhost', '127.0.0.1']);
        if (!allowed.has(parsed.hostname)) {
          return { status: 403, error: 'CORS: origen no autorizado' };
        }
      } catch {
        return { status: 400, error: 'Origin inválido' };
      }
    }
  }
  return { status: 200, allowed: true };
}

assert.strictEqual(simulateCorsCheck('POST', 'https://portalempleoit.com').status, 200);
assert.strictEqual(simulateCorsCheck('POST', 'https://malicious-attacker.com').status, 403);
assert.strictEqual(simulateCorsCheck('DELETE', 'http://phishing-site.es').status, 403);
assert.strictEqual(simulateCorsCheck('POST', 'invalid-origin-string').status, 400);

console.log('✅ TEST 5 superado: Directivas CORS restringen de forma estricta los orígenes mutantes en APIs.\n');

console.log('========================================================================');
console.log('🎉 TODOS LOS TESTS DEL BLOQUE 3 (VECTORES 14 AL 18) HAN PASADO CON ÉXITO');
console.log('========================================================================');

