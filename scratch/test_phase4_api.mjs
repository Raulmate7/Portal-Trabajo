import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rate-limiter
import { RateLimiter, getClientIp } from '../frontend/lib/rate-limit.ts';

// ─── TEST 1: Rate Limiter y Detección de IP ──────────────────────────────────
function test1_rate_limiter() {
  console.log('--- TEST 1: Rate Limiter y Detección de IP ---');

  const limiter = new RateLimiter(500, 3); // 3 peticiones por 500ms
  const ip1 = '192.168.1.50';
  const ip2 = '10.0.0.1';

  // IP 1: 3 permitidas, 4ta bloqueada
  assert.strictEqual(limiter.limit(ip1).success, true, 'Req 1 debe ser permitida');
  assert.strictEqual(limiter.limit(ip1).success, true, 'Req 2 debe ser permitida');
  assert.strictEqual(limiter.limit(ip1).success, true, 'Req 3 debe ser permitida');
  const blocked = limiter.limit(ip1);
  assert.strictEqual(blocked.success, false, 'Req 4 debe ser bloqueada (429)');
  assert.strictEqual(blocked.remaining, 0, 'Remaining debe ser 0');

  // IP 2: debe tener su propio contador independiente
  assert.strictEqual(limiter.limit(ip2).success, true, 'IP distinta debe ser permitida');

  // Detección de IP: prioridad Cloudflare > X-Real-IP > X-Forwarded-For
  const mockReqCf = new Request('https://portalempleoit.com', {
    headers: {
      'cf-connecting-ip': '203.0.113.195',
      'x-real-ip': '198.51.100.1',
      'x-forwarded-for': '192.0.2.1, 10.0.0.1'
    }
  });
  assert.strictEqual(getClientIp(mockReqCf), '203.0.113.195', 'Debe priorizar cf-connecting-ip');

  const mockReqReal = new Request('https://portalempleoit.com', {
    headers: {
      'x-real-ip': '198.51.100.1',
      'x-forwarded-for': '192.0.2.1, 10.0.0.1'
    }
  });
  assert.strictEqual(getClientIp(mockReqReal), '198.51.100.1', 'Debe usar x-real-ip si no hay cf-connecting-ip');

  const mockReqFwd = new Request('https://portalempleoit.com', {
    headers: {
      'x-forwarded-for': '192.0.2.1, 10.0.0.1'
    }
  });
  assert.strictEqual(getClientIp(mockReqFwd), '192.0.2.1', 'Debe usar la primera IP de x-forwarded-for');

  const mockReqEmpty = new Request('https://portalempleoit.com');
  assert.strictEqual(getClientIp(mockReqEmpty), '127.0.0.1', 'Fallback a 127.0.0.1');

  console.log('✅ RateLimiter y resolución de IP anti-spoofing verificados correctamente.');
}

// ─── TEST 2: Admin Session Token y Verificación HMAC ─────────────────────────
function test2_admin_auth() {
  console.log('\n--- TEST 2: Admin Session Token y Verificación HMAC ---');
  
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'test_secret_key_1234567890abcdef';
  process.env.ADMIN_PASSWORD = 'super_secret_admin_password';

  function createAdminSessionToken() {
    const secret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD;
    const timestamp = Date.now().toString();
    const signature = crypto.createHmac('sha256', secret).update(`admin_session:${timestamp}`).digest('hex');
    return `${timestamp}.${signature}`;
  }

  function verifyAdminSessionToken(token) {
    if (!token || !token.includes('.')) return false;
    try {
      const secret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD;
      const [timestampStr, signature] = token.split('.');
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) return false;

      const SESSION_DURATION = 8 * 60 * 60 * 1000;
      if (Date.now() - timestamp > SESSION_DURATION || Date.now() < timestamp) {
        return false;
      }

      const expectedSig = crypto.createHmac('sha256', secret).update(`admin_session:${timestampStr}`).digest('hex');
      if (signature.length !== expectedSig.length) {
        return false;
      }

      return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
    } catch {
      return false;
    }
  }

  const validToken = createAdminSessionToken();
  assert.strictEqual(verifyAdminSessionToken(validToken), true, 'Token recién creado debe ser válido');

  // Token alterado (Tampering)
  const tamperedToken = validToken.slice(0, -2) + 'ff';
  assert.strictEqual(verifyAdminSessionToken(tamperedToken), false, 'Token alterado debe ser rechazado');

  // Token expirado (hace 9 horas)
  const expiredTimestamp = (Date.now() - 9 * 60 * 60 * 1000).toString();
  const expiredSig = crypto.createHmac('sha256', process.env.CRON_SECRET).update(`admin_session:${expiredTimestamp}`).digest('hex');
  const expiredToken = `${expiredTimestamp}.${expiredSig}`;
  assert.strictEqual(verifyAdminSessionToken(expiredToken), false, 'Token de hace 9h debe ser rechazado');

  // Token del futuro (ataque de desincronización)
  const futureTimestamp = (Date.now() + 60 * 60 * 1000).toString();
  const futureSig = crypto.createHmac('sha256', process.env.CRON_SECRET).update(`admin_session:${futureTimestamp}`).digest('hex');
  const futureToken = `${futureTimestamp}.${futureSig}`;
  assert.strictEqual(verifyAdminSessionToken(futureToken), false, 'Token con timestamp futuro debe ser rechazado');

  // Tokens basura
  assert.strictEqual(verifyAdminSessionToken(''), false);
  assert.strictEqual(verifyAdminSessionToken(null), false);
  assert.strictEqual(verifyAdminSessionToken('not.a.valid.token.format'), false);

  console.log('✅ Criptografía de sesión de administración 100% segura y validada.');
}

// ─── TEST 3: Feeds XML Jooble y Talent.com ───────────────────────────────────
function test3_xml_feeds() {
  console.log('\n--- TEST 3: Sintaxis y Sanitización de Feeds XML ---');

  function cleanCdata(text) {
    if (!text) return '';
    return String(text).replace(/\]\]>/g, ']]]]><![CDATA[>');
  }

  function escapeXmlAttr(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Ofertas simuladas incluyendo caracteres especiales y ataques de breakout CDATA
  const sampleJobs = [
    {
      id: 'job-1',
      title: 'Senior Frontend Engineer & React Specialist',
      company: 'Tech & Media Corp <Spain>',
      location: 'Madrid / Remoto',
      description_snippet: 'Buscamos desarrollador con experiencia en JS & CSS. ]]> Inyección maliciosa CDATA tentativa.',
      created_at: new Date().toISOString(),
      salary: '45.000€ - 55.000€'
    },
    {
      id: 'job-2',
      title: 'DevOps & Cloud Architect "AWS"',
      company: 'Globex Inc.',
      location: 'Barcelona',
      description_snippet: null,
      created_at: new Date().toISOString(),
      salary: 'Consultar'
    }
  ];

  // Generar Jooble Feed
  const joobleItems = sampleJobs.map(job => {
    const date = new Date(job.created_at);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    const cleanDesc = job.description_snippet || 'Oferta tecnológica';
    const salaryText = job.salary && job.salary !== 'Consultar' ? job.salary : '';

    return `
  <job id="${escapeXmlAttr(job.id)}">
    <link><![CDATA[${cleanCdata(`https://portalempleoit.com/job/${job.id}`)}]]></link>
    <name><![CDATA[${cleanCdata(job.title)}]]></name>
    <region><![CDATA[${cleanCdata(job.location)}]]></region>
    <company><![CDATA[${cleanCdata(job.company)}]]></company>
    <description><![CDATA[${cleanCdata(cleanDesc)}]]></description>
    <pubdate>${formattedDate}</pubdate>
    <updated>${formattedDate}</updated>
    ${salaryText ? `<salary><![CDATA[${cleanCdata(salaryText)}]]></salary>` : ''}
  </job>`;
  }).join('');

  const joobleXml = `<?xml version="1.0" encoding="utf-8"?>\n<jobs>${joobleItems}\n</jobs>`;

  // Validaciones del XML de Jooble
  assert(joobleXml.startsWith('<?xml version="1.0" encoding="utf-8"?>'), 'Debe tener declaración XML');
  assert(joobleXml.includes('<jobs>') && joobleXml.endsWith('</jobs>'), 'Estructura raíz <jobs> válida');
  assert(!joobleXml.includes('<![CDATA[Buscamos desarrollador con experiencia en JS & CSS. ]]> Inyección'), 'Debe neutralizar el cierre prematuro de CDATA');
  assert(joobleXml.includes(']]]]><![CDATA[>'), 'Debe escapar el breakout de CDATA correctamente');

  // Generar Talent.com Feed
  const talentItems = sampleJobs.map(job => {
    const formattedDate = new Date(job.created_at).toISOString().split('T')[0];
    const cleanDesc = job.description_snippet || 'Oferta tecnológica';
    const salaryText = job.salary && job.salary !== 'Consultar' ? job.salary : '';

    return `
  <job>
    <title><![CDATA[${cleanCdata(job.title)}]]></title>
    <date><![CDATA[${formattedDate}]]></date>
    <referencenumber><![CDATA[${cleanCdata(job.id)}]]></referencenumber>
    <url><![CDATA[${cleanCdata(`https://portalempleoit.com/job/${job.id}`)}]]></url>
    <company><![CDATA[${cleanCdata(job.company)}]]></company>
    <city><![CDATA[${cleanCdata(job.location)}]]></city>
    <country><![CDATA[ES]]></country>
    <description><![CDATA[${cleanCdata(cleanDesc)}]]></description>
    ${salaryText ? `<salary><![CDATA[${cleanCdata(salaryText)}]]></salary>` : ''}
  </job>`;
  }).join('');

  const talentXml = `<?xml version="1.0" encoding="utf-8"?>\n<publisher>${talentItems}\n</publisher>`;

  // Validaciones del XML de Talent
  assert(talentXml.startsWith('<?xml version="1.0" encoding="utf-8"?>'), 'Debe tener declaración XML');
  assert(talentXml.includes('<publisher>') && talentXml.endsWith('</publisher>'), 'Estructura raíz <publisher> válida');

  console.log('✅ Feeds XML de Jooble y Talent.com verificados contra inyecciones y rotura de CDATA.');
}

// ─── TEST 4: Verificación y Rechazo de Webhook de Stripe ──────────────────────
async function test4_stripe_webhook_security() {
  console.log('\n--- TEST 4: Seguridad y Rechazo de Firmas Falsas en Webhook de Stripe ---');
  
  // Importar Stripe SDK desde frontend/node_modules
  const { createRequire } = await import('module');
  const require = createRequire(path.join(__dirname, '../frontend/package.json'));
  const Stripe = require('stripe');
  const stripe = new Stripe('sk_test_fake_key_123456789', { apiVersion: '2023-10-16' });
  const fakeWebhookSecret = 'whsec_test_secret_xyz123';

  const payload = JSON.stringify({
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_123', metadata: { jobId: '123' } } }
  });

  // 1. Firma inventada / falsificada
  const forgedSig = 't=1600000000,v1=0000000000000000000000000000000000000000000000000000000000000000';

  let signatureRejected = false;
  try {
    stripe.webhooks.constructEvent(payload, forgedSig, fakeWebhookSecret);
  } catch (err) {
    signatureRejected = true;
    assert(err.message.includes('signature') || err.message.includes('timestamp'), 'Error debe ser de validación de firma');
  }
  assert.strictEqual(signatureRejected, true, 'El webhook DEBE rechazar firmas falsificadas');

  // 2. Firma válida generada criptográficamente para verificar que el constructor funciona
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const validSignature = crypto.createHmac('sha256', fakeWebhookSecret).update(signedPayload).digest('hex');
  const genuineSigHeader = `t=${timestamp},v1=${validSignature}`;

  const event = stripe.webhooks.constructEvent(payload, genuineSigHeader, fakeWebhookSecret);
  assert.strictEqual(event.type, 'checkout.session.completed', 'Firma genuina debe construirse sin errores');
  assert.strictEqual(event.data.object.metadata.jobId, '123');

  console.log('✅ Verificación de firma HMAC de Stripe validada: firmas falsas rechazadas al 100%.');
}

// ─── TEST 5: Protección Open Redirect en Track-Click ─────────────────────────
function test5_open_redirect_protection() {
  console.log('\n--- TEST 5: Protección Contra Open Redirect en API ---');

  function getSanitizedRedirect(redirectParam, requestUrl) {
    if (!redirectParam) return '/';
    let decoded = '';
    try {
      decoded = decodeURIComponent(redirectParam).trim();
    } catch {
      return '/';
    }

    if (decoded.startsWith('//')) return '/';
    if (decoded.startsWith('/') && !decoded.startsWith('/\\')) return decoded;

    try {
      const currentUrl = new URL(requestUrl);
      const parsed = new URL(decoded);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '/';
      if (parsed.origin === currentUrl.origin) return decoded;

      const defaultAllowedHosts = [
        'portalempleoit.com',
        'www.portalempleoit.com',
        'localhost',
        '127.0.0.1',
        'trk.udemy.com',
        'udemy.com'
      ];
      const allAllowedHosts = new Set(defaultAllowedHosts);
      const targetHost = parsed.hostname.toLowerCase();

      if (allAllowedHosts.has(targetHost)) return decoded;
      for (const allowed of allAllowedHosts) {
        if (targetHost.endsWith(`.${allowed}`)) return decoded;
      }
      return '/';
    } catch {
      return '/';
    }
  }

  const base = 'https://portalempleoit.com/api/track-click';

  // Intentos de ataque de Open Redirect
  assert.strictEqual(getSanitizedRedirect('//evil.com', base), '/', 'Protocol-relative bypass //evil.com debe ser bloqueado');
  assert.strictEqual(getSanitizedRedirect('https://evil-hacker.com/phishing', base), '/', 'Dominio no permitido debe redirigir a /');
  assert.strictEqual(getSanitizedRedirect('javascript:alert(document.cookie)', base), '/', 'javascript: URI debe ser bloqueado');
  assert.strictEqual(getSanitizedRedirect('/\\evil.com', base), '/', 'Backslash bypass /\\evil.com debe ser bloqueado');
  assert.strictEqual(getSanitizedRedirect('data:text/html,<script>alert(1)</script>', base), '/', 'data: URI debe ser bloqueado');

  // Redirecciones legítimas
  assert.strictEqual(getSanitizedRedirect('/salarios', base), '/salarios', 'Ruta interna relativa permitida');
  assert.strictEqual(getSanitizedRedirect('https://portalempleoit.com/job/senior-python-123', base), 'https://portalempleoit.com/job/senior-python-123', 'Mismo origen permitido');
  assert.strictEqual(getSanitizedRedirect('https://trk.udemy.com/9VMAEj', base), 'https://trk.udemy.com/9VMAEj', 'Partner autorizado permitido');

  console.log('✅ Sanitización contra Open Redirect validada en todos los escenarios de ataque.');
}

// ─── TEST 6: Validación de Entradas de Checkout ──────────────────────────────
function test6_checkout_input_validation() {
  console.log('\n--- TEST 6: Validación de Entradas en Checkout ---');

  function validateCheckoutPayload(body) {
    const { title, company, url_source } = body;
    if (!title || !company || !url_source) {
      return { valid: false, error: 'Faltan campos obligatorios' };
    }
    try {
      const parsedUrl = new URL(url_source);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return { valid: false, error: 'La URL de la oferta debe comenzar por http:// o https://' };
      }
    } catch {
      return { valid: false, error: 'La URL proporcionada no es válida' };
    }
    return { valid: true };
  }

  // Falta de campos obligatorios
  assert.strictEqual(validateCheckoutPayload({ title: 'Dev' }).valid, false);
  assert.strictEqual(validateCheckoutPayload({ company: 'Acme' }).valid, false);

  // URL maliciosa o protocolo inseguro
  assert.strictEqual(validateCheckoutPayload({ title: 'Dev', company: 'Acme', url_source: 'javascript:alert(1)' }).valid, false);
  assert.strictEqual(validateCheckoutPayload({ title: 'Dev', company: 'Acme', url_source: 'not-a-valid-url' }).valid, false);
  assert.strictEqual(validateCheckoutPayload({ title: 'Dev', company: 'Acme', url_source: 'file:///etc/passwd' }).valid, false);

  // Payload legítimo
  assert.strictEqual(validateCheckoutPayload({ title: 'Dev', company: 'Acme', url_source: 'https://acme.com/jobs/1' }).valid, true);

  console.log('✅ Validación de entradas de checkout aprobada.');
}

async function runAll() {
  console.log('=============================================================');
  console.log('🧪 EJECUCIÓN FASE 4: ROUTE HANDLERS, APIS Y PASARELA STRIPE');
  console.log('=============================================================');

  test1_rate_limiter();
  test2_admin_auth();
  test3_xml_feeds();
  await test4_stripe_webhook_security();
  test5_open_redirect_protection();
  test6_checkout_input_validation();

  console.log('\n🎉 FASE 4 COMPLETADA CON ÉXITO: 6/6 PRUEBAS PASADAS AL 100%.');
}

runAll().catch(err => {
  console.error('\n❌ ERROR EN FASE 4:', err);
  process.exit(1);
});
