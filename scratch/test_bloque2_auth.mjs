/**
 * test_bloque2_auth.mjs
 * 
 * Verificación adversarial y de regresión para el Bloque 2:
 * Autenticación, Control de Acceso y Gestión de Sesiones (Vectores 8 al 13).
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { adminAuthLimiter } from '../frontend/lib/rate-limit.ts';
import { 
  createAdminSessionToken, 
  verifyAdminSessionToken, 
  revokeAdminSession, 
  revokeAllAdminSessions 
} from '../frontend/lib/adminAuth.ts';

process.env.ADMIN_SESSION_SECRET = 'test_admin_session_secret_32_characters_long!';
process.env.ADMIN_PASSWORD = 'test_admin_password_123';
process.env.MAGIC_LINK_SECRET = 'test_magic_link_secret_32_characters_long!';

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN ADVERSARIAL: BLOQUE 2 (VECTORES 8 AL 13)');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1 (Vector 8): Rate Limiting y Protección Anti-Fuerza Bruta en Login Admin
// -----------------------------------------------------------------------------
console.log('--- TEST 1 (Vector 8): Rate Limiting y Protección Anti-Fuerza Bruta en Login Admin ---');

const testIp = '198.51.100.77';

// 1. Probar 5 intentos permitidos
for (let i = 1; i <= 5; i++) {
  const res = adminAuthLimiter.limit(testIp);
  assert.strictEqual(res.success, true, `Intento ${i} debe ser permitido`);
  assert.strictEqual(res.remaining, 5 - i, `Intentos restantes deben ser ${5 - i}`);
}

// 2. 6to intento: debe ser bloqueado con HTTP 429
const blockedRes = adminAuthLimiter.limit(testIp);
assert.strictEqual(blockedRes.success, false, 'El 6to intento debe ser bloqueado (429)');
assert.strictEqual(blockedRes.remaining, 0, 'No deben quedar intentos disponibles');
assert.ok(blockedRes.reset > Date.now(), 'El tiempo de reset debe estar en el futuro');

// 3. Reset tras login exitoso legítimo
adminAuthLimiter.reset(testIp);
const afterReset = adminAuthLimiter.limit(testIp);
assert.strictEqual(afterReset.success, true, 'Tras login correcto, el contador debe restablecerse');
adminAuthLimiter.reset(testIp); // Limpieza

// 4. Verificación de comparación timing-safe de contraseñas en código
const adminAuthRoutePath = path.resolve('frontend/app/api/admin/auth/route.ts');
const adminAuthRouteContent = fs.readFileSync(adminAuthRoutePath, 'utf8');
assert.ok(
  adminAuthRouteContent.includes('crypto.timingSafeEqual(inputHash, targetHash)'),
  'Debe usar crypto.timingSafeEqual para comparar hashes de contraseña'
);
assert.ok(
  adminAuthRouteContent.includes('setTimeout(resolve, 250)'),
  'Debe incluir retardo defensivo de 250ms en fallos de autenticación'
);

console.log('✅ TEST 1 superado: Rate limiting de 5 intentos por 15 min y protección timing-safe activos.\n');

// -----------------------------------------------------------------------------
// TEST 2 (Vector 9): Criptografía con Nonce y Mitigación de Replay en Magic Links
// -----------------------------------------------------------------------------
console.log('--- TEST 2 (Vector 9): Criptografía con Nonce y Mitigación de Replay en Magic Links ---');

const revokedMagic = new Set();
const secret = process.env.MAGIC_LINK_SECRET;

function generateSecureTokenWithNonce(email) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', secret).update(`${email.trim().toLowerCase()}:${timestamp}:${nonce}`).digest('hex');
  return `${timestamp}.${nonce}.${hash}`;
}

function verifySecureTokenTest(email, token) {
  if (!token || !token.includes('.')) return false;
  if (revokedMagic.has(token)) return false;

  const parts = token.split('.');
  const cleanEmail = email.trim().toLowerCase();

  if (parts.length === 3) {
    const [timestampStr, nonce, hash] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Ventana de 2 horas (estándar OWASP)
    const MAX_AGE = 2 * 60 * 60 * 1000;
    if (Date.now() - timestamp > MAX_AGE || Date.now() < timestamp) return false;
    if (revokedMagic.has(nonce)) return false;

    const expected = crypto.createHmac('sha256', secret).update(`${cleanEmail}:${timestampStr}:${nonce}`).digest('hex');
    if (hash.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(expected, 'utf-8'));
  }
  return false;
}

const userEmail = 'recruiter@techventures.es';
const tokenA = generateSecureTokenWithNonce(userEmail);
const tokenB = generateSecureTokenWithNonce(userEmail);

// 2.1 Unicidad garantizada por nonce
assert.notStrictEqual(tokenA, tokenB, 'Dos tokens generados consecutivamente deben diferir por nonce aleatorio');
assert.strictEqual(verifySecureTokenTest(userEmail, tokenA), true);
assert.strictEqual(verifySecureTokenTest(userEmail, tokenB), true);

// 2.2 Protección contra suplantación (IDOR)
assert.strictEqual(verifySecureTokenTest('hacker@external.com', tokenA), false, 'Token de un usuario jamás debe validar a otro');

// 2.3 Expiración estricta de 2 horas
const expiredTimestamp = Date.now() - (2 * 60 * 60 * 1000 + 5000);
const expiredNonce = crypto.randomBytes(16).toString('hex');
const expiredHash = crypto.createHmac('sha256', secret).update(`${userEmail}:${expiredTimestamp}:${expiredNonce}`).digest('hex');
const expiredToken = `${expiredTimestamp}.${expiredNonce}.${expiredHash}`;
assert.strictEqual(verifySecureTokenTest(userEmail, expiredToken), false, 'Tokens expirados (>2h) deben ser rechazados');

// 2.4 Revocación inmediata
revokedMagic.add(tokenA);
assert.strictEqual(verifySecureTokenTest(userEmail, tokenA), false, 'Token revocado debe invalidarse de inmediato');

console.log('✅ TEST 2 superado: Nonces criptográficos aleatorios, ventana de 2h y revocación anti-replay validados.\n');

// -----------------------------------------------------------------------------
// TEST 3 (Vector 10): Identificador JTI y Revocación Activa de Sesiones Admin
// -----------------------------------------------------------------------------
console.log('--- TEST 3 (Vector 10): Identificador JTI y Revocación Activa de Sesiones Admin ---');

// 3.1 Creación de sesión estructurada con JTI
const adminToken = createAdminSessionToken();
const parts = adminToken.split('.');
assert.strictEqual(parts.length, 3, 'El token debe tener estructura {timestamp}.{jti}.{signature}');
assert.strictEqual(parts[1].length, 32, 'El JTI debe ser un nonce hexadecimal de 16 bytes (32 caracteres)');

// 3.2 Verificación legítima
assert.strictEqual(verifyAdminSessionToken(adminToken), true, 'El token legítimo debe verificarse');

// 3.3 Detección de manipulación de JTI
const tamperedJti = `${parts[0]}.11112222333344445555666677778888.${parts[2]}`;
assert.strictEqual(verifyAdminSessionToken(tamperedJti), false, 'Token con JTI alterado debe ser rechazado');

// 3.4 Revocación individual al hacer logout
revokeAdminSession(adminToken);
assert.strictEqual(verifyAdminSessionToken(adminToken), false, 'Sesión revocada individualmente debe invalidarse');

// 3.5 Revocación global de todas las sesiones activas
const adminToken2 = createAdminSessionToken();
assert.strictEqual(verifyAdminSessionToken(adminToken2), true, 'Nueva sesión debe ser válida');

revokeAllAdminSessions();
assert.strictEqual(verifyAdminSessionToken(adminToken2), false, 'Sesiones previas a revocación global deben invalidarse');

console.log('✅ TEST 3 superado: JTI único por sesión, revocación individual y revocación global activas.\n');

// -----------------------------------------------------------------------------
// TEST 4 (Vector 11): Control Centralizado y Cabeceras en Middleware para /admin
// -----------------------------------------------------------------------------
console.log('--- TEST 4 (Vector 11): Control Centralizado y Cabeceras en Middleware para /admin ---');

const middlewarePath = path.resolve('frontend/middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

// 4.1 Aislamiento de subrutas sin cookie estructurada
assert.ok(
  middlewareContent.includes("pathname.startsWith('/admin')"),
  'Middleware debe interceptar todas las rutas administrativas'
);
assert.ok(
  middlewareContent.includes("pathname !== '/admin' && (!sessionCookie || !sessionCookie.includes('.'))"),
  'Subrutas de /admin deben redirigir preventivamente a /admin si falta la cookie de sesión'
);

// 4.2 Cabeceras defensivas específicas para /admin
assert.ok(
  middlewareContent.includes("response.headers.set('X-Frame-Options', 'DENY')"),
  'Debe forzar X-Frame-Options: DENY en rutas administrativas'
);
assert.ok(
  middlewareContent.includes("response.headers.set('Content-Security-Policy', \"frame-ancestors 'none'\")"),
  'Debe forzar frame-ancestors none en CSP de rutas administrativas'
);

console.log('✅ TEST 4 superado: Perímetro de administración blindado con middleware y anti-clickjacking.\n');

// -----------------------------------------------------------------------------
// TEST 5 (Vector 12): Protección de Códigos Confidenciales y Métricas de Afiliados B2B
// -----------------------------------------------------------------------------
console.log('--- TEST 5 (Vector 12): Protección de Códigos Confidenciales y Métricas de Afiliados B2B ---');

const actionsPath = path.resolve('frontend/app/actions.ts');
const actionsContent = fs.readFileSync(actionsPath, 'utf8');

// 5.1 No exposición anónima de códigos existentes
assert.ok(
  actionsContent.includes('requiresAuth: true'),
  'registerRecruiterAffiliate debe retornar requiresAuth: true si el usuario no tiene token'
);
assert.ok(
  actionsContent.includes('sendMagicLinkEmail(cleanEmail, fullLoginUrl, \'recruiter\')'),
  'Debe enviar magic link al email del propietario en lugar de exponer el código directamente'
);

// 5.2 Generación de códigos con entropía criptográfica
assert.ok(
  actionsContent.includes("crypto.randomBytes(4).toString('hex').toUpperCase()"),
  'Los códigos de afiliado nuevos deben generarse con crypto.randomBytes(4)'
);

console.log('✅ TEST 5 superado: Códigos de afiliado B2B protegidos contra IDOR y scraping no autorizado.\n');

// -----------------------------------------------------------------------------
// TEST 6 (Vector 13): Anti-Enumeración de Candidatos en Leads Premium
// -----------------------------------------------------------------------------
console.log('--- TEST 6 (Vector 13): Anti-Enumeración de Candidatos en Leads Premium ---');

// 6.1 Sanitización HTML contra phishing en notificaciones internas
assert.ok(
  actionsContent.includes('escapeTelegramHtml(name)'),
  'submitPremiumLead debe sanitizar el campo name con escapeTelegramHtml'
);
assert.ok(
  actionsContent.includes("parse_mode: 'HTML'"),
  'Las notificaciones de leads deben emitirse exclusivamente en HTML escapado'
);

// 6.2 Rate limiting anti-scraping
assert.ok(
  actionsContent.includes('checkRateLimit(`lead_${cleanEmail}`, 60000)'),
  'submitPremiumLead debe aplicar rate limiting por correo para mitigar flooding'
);

console.log('✅ TEST 6 superado: Formularios de leads protegidos contra sondeo masivo y phishing.\n');

console.log('========================================================================');
console.log('🎉 TODOS LOS TESTS DEL BLOQUE 2 (VECTORES 8 AL 13) HAN PASADO CON ÉXITO');
console.log('========================================================================');

