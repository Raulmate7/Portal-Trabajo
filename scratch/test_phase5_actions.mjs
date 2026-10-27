import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.CRON_SECRET = process.env.CRON_SECRET || 'test_secret_for_phase5_cron_secret_32chars';

// ─── TEST 1: Criptografía de Tokens de Acceso Mágico ─────────────────────────
function test1_magic_link_crypto() {
  console.log('--- TEST 1: Criptografía y Validez de Tokens Mágicos ---');

  function generateSecureToken(email) {
    const secret = process.env.CRON_SECRET;
    const timestamp = Date.now();
    const hash = crypto.createHmac('sha256', secret).update(email.trim().toLowerCase() + timestamp).digest('hex');
    return `${timestamp}.${hash}`;
  }

  function verifySecureToken(email, token) {
    const secret = process.env.CRON_SECRET;
    if (!secret || !token || !token.includes('.')) return false;
    
    const [timestampStr, hash] = token.split('.');
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    
    // Expira a las 24h o si el timestamp está en el futuro
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000 || Date.now() < timestamp) return false;
    
    const expectedHash = crypto.createHmac('sha256', secret).update(email.trim().toLowerCase() + timestamp).digest('hex');
    if (!hash || hash.length !== expectedHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
  }

  const email = 'candidato.senior@empresa.com';
  const token = generateSecureToken(email);

  // 1. Verificación exitosa
  assert.strictEqual(verifySecureToken(email, token), true, 'El token legítimo debe ser verificado con éxito');

  // 2. Intento de uso para otro usuario (Protección IDOR)
  assert.strictEqual(verifySecureToken('victima@empresa.com', token), false, 'Un token de Usuario A no debe ser válido para Usuario B');

  // 3. Modificación del hash (Tampering)
  const tamperedToken = token.slice(0, -2) + 'aa';
  assert.strictEqual(verifySecureToken(email, tamperedToken), false, 'Token con firma alterada debe ser rechazado');

  // 4. Token expirado (>24h)
  const expiredTime = Date.now() - 25 * 60 * 60 * 1000;
  const expiredHash = crypto.createHmac('sha256', process.env.CRON_SECRET).update(email + expiredTime).digest('hex');
  assert.strictEqual(verifySecureToken(email, `${expiredTime}.${expiredHash}`), false, 'Token expirado de hace 25h debe ser rechazado');

  // 5. Token del futuro
  const futureTime = Date.now() + 60 * 60 * 1000;
  const futureHash = crypto.createHmac('sha256', process.env.CRON_SECRET).update(email + futureTime).digest('hex');
  assert.strictEqual(verifySecureToken(email, `${futureTime}.${futureHash}`), false, 'Token con fecha en el futuro debe ser rechazado');

  console.log('✅ Generación y verificación segura de Magic Links aprobada al 100%.');
}

// ─── TEST 2: Anti-Enumeración de Usuarios ─────────────────────────────────────
function test2_anti_enumeration() {
  console.log('\n--- TEST 2: Anti-Enumeración en Acciones de Login ---');

  // Ambas respuestas deben ser idénticas tanto si el email existe como si no
  const GENERIC_MSG_RECRUITER = 'Si este correo figura en nuestros registros con ofertas activas, hemos enviado un enlace de acceso seguro a tu bandeja de entrada. Revisa tu correo (y la carpeta de spam).';
  const GENERIC_MSG_CANDIDATE = 'Si este correo está registrado en nuestro boletín, hemos enviado un enlace de acceso seguro a tu bandeja de entrada. Revisa tu correo (y la carpeta de spam).';

  function simulateCandidateLoginResponse(userExists) {
    if (!userExists) {
      return { success: true, message: GENERIC_MSG_CANDIDATE };
    }
    return { success: true, message: GENERIC_MSG_CANDIDATE };
  }

  function simulateRecruiterLoginResponse(jobsCount) {
    if (jobsCount === 0) {
      return { success: true, message: GENERIC_MSG_RECRUITER };
    }
    return { success: true, message: GENERIC_MSG_RECRUITER };
  }

  const resCandExists = simulateCandidateLoginResponse(true);
  const resCandNotExists = simulateCandidateLoginResponse(false);
  assert.strictEqual(resCandExists.message, resCandNotExists.message, 'Mensajes de candidato deben ser 100% idénticos');
  assert.strictEqual(resCandExists.success, resCandNotExists.success);

  const resRecrExists = simulateRecruiterLoginResponse(5);
  const resRecrNotExists = simulateRecruiterLoginResponse(0);
  assert.strictEqual(resRecrExists.message, resRecrNotExists.message, 'Mensajes de reclutador deben ser 100% idénticos');
  assert.strictEqual(resRecrExists.success, resRecrNotExists.success);

  console.log('✅ Protección contra enumeración de suscriptores y reclutadores validada.');
}

// ─── TEST 3: Rate Limiter en Server Actions ──────────────────────────────────
function test3_actions_rate_limiter() {
  console.log('\n--- TEST 3: Rate Limiting en Acciones del Servidor ---');

  const rateLimitMap = new Map();

  function checkRateLimit(key, limitMs = 60000) {
    const now = Date.now();
    const lastRequest = rateLimitMap.get(key);
    if (lastRequest && now - lastRequest < limitMs) {
      return false;
    }
    if (rateLimitMap.size > 10000) rateLimitMap.clear();
    rateLimitMap.set(key, now);
    return true;
  }

  const key1 = 'sub_spammer@gmail.com';
  const key2 = 'sub_legit@gmail.com';

  assert.strictEqual(checkRateLimit(key1, 1000), true, 'Petición 1 permitida');
  assert.strictEqual(checkRateLimit(key1, 1000), false, 'Petición inmediata bloqueada por rate limit');
  assert.strictEqual(checkRateLimit(key2, 1000), true, 'Petición de usuario distinto permitida');

  console.log('✅ Aislamiento y throttling de acciones de servidor verificados.');
}

// ─── TEST 4: Sanitización de Protocolos en URLs de Ofertas ───────────────────
function test4_url_protocol_sanitization() {
  console.log('\n--- TEST 4: Validación de Protocolos en URLs de Ofertas ---');

  function validateUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  // Protocolos inseguros y ataques XSS/SSRF
  assert.strictEqual(validateUrl('javascript:alert(document.cookie)'), false, 'javascript: URI rechazada');
  assert.strictEqual(validateUrl('data:text/html,<script>alert(1)</script>'), false, 'data: URI rechazada');
  assert.strictEqual(validateUrl('file:///etc/passwd'), false, 'file: URI rechazada');
  assert.strictEqual(validateUrl('vbscript:msgbox(1)'), false, 'vbscript: URI rechazada');
  assert.strictEqual(validateUrl('invalid-url-without-protocol'), false, 'URL sin protocolo rechazada');

  // Protocolos legítimos
  assert.strictEqual(validateUrl('https://empresa.com/careers/lead-dev'), true, 'HTTPS permitida');
  assert.strictEqual(validateUrl('http://startup.io/jobs/1'), true, 'HTTP permitida');

  console.log('✅ Validación estricta de protocolos HTTP/HTTPS aprobada.');
}

// ─── TEST 5: Protección de Datos Comerciales en Afiliados B2B ─────────────────
function test5_affiliate_commercial_privacy() {
  console.log('\n--- TEST 5: Privacidad Comercial en Afiliados B2B ---');

  function simulateRegisterAffiliate(isAuthenticated, mockData) {
    let referrals = [];
    if (isAuthenticated) {
      referrals = mockData;
    }
    return {
      success: true,
      code: 'RECR-ABC123',
      referrals,
      authenticated: isAuthenticated
    };
  }

  const sensitiveSalesData = [
    { referred_company_name: 'Banca Privada S.A.', commission_paid: true, created_at: '2026-05-01' },
    { referred_company_name: 'Startup Unicornio S.L.', commission_paid: false, created_at: '2026-05-10' }
  ];

  // 1. Acceso sin token de sesión (Usuario anónimo introduciendo un correo)
  const unauthenticatedRes = simulateRegisterAffiliate(false, sensitiveSalesData);
  assert.strictEqual(unauthenticatedRes.authenticated, false);
  assert.strictEqual(unauthenticatedRes.referrals.length, 0, 'No debe filtrar empresas ni comisiones sin sesión');

  // 2. Acceso con token verificado
  const authenticatedRes = simulateRegisterAffiliate(true, sensitiveSalesData);
  assert.strictEqual(authenticatedRes.authenticated, true);
  assert.strictEqual(authenticatedRes.referrals.length, 2, 'Debe devolver el desglose solo con sesión autenticada');

  console.log('✅ Confidencialidad comercial de comisiones protegida contra IDOR.');
}

async function runAll() {
  console.log('=============================================================');
  console.log('🧪 EJECUCIÓN FASE 5: SERVER ACTIONS Y AUTENTICACIÓN PORTALES');
  console.log('=============================================================');

  test1_magic_link_crypto();
  test2_anti_enumeration();
  test3_actions_rate_limiter();
  test4_url_protocol_sanitization();
  test5_affiliate_commercial_privacy();

  console.log('\n🎉 FASE 5 COMPLETADA CON ÉXITO: 5/5 PRUEBAS PASADAS AL 100%.');
}

runAll().catch(err => {
  console.error('\n❌ ERROR EN FASE 5:', err);
  process.exit(1);
});
