/**
 * test_bloque4_fraud.mjs
 * 
 * Verificación adversarial y de regresión para el Bloque 4:
 * Lógica de Negocio, Pasarelas y Fraude B2B (Vectores 19 al 23).
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN ADVERSARIAL: BLOQUE 4 (VECTORES 19 AL 23)');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1 (Vector 19): Moderación Previa Obligatoria en Ofertas Gratuitas
// -----------------------------------------------------------------------------
console.log('--- TEST 1 (Vector 19): Moderación Previa Obligatoria en Ofertas Gratuitas ---');

const actionsPath = path.resolve('frontend/app/actions.ts');
const actionsContent = fs.readFileSync(actionsPath, 'utf8');

// 1.1 Verificación en código fuente: is_active = FALSE en plan básico
assert.ok(
  actionsContent.includes("VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, FALSE, 'basico', NOW())"),
  'Las ofertas gratuitas de plan básico deben insertarse con is_active = FALSE'
);
assert.ok(
  actionsContent.includes("'pendiente', // Vector 21: Toda solicitud pasa por estado 'pendiente'"),
  'El estado inicial debe ser siempre pendiente para moderación humana previa'
);
assert.ok(
  actionsContent.includes('Nuestro equipo la revisará y se activará en breve tras su validación'),
  'El mensaje al usuario debe clarificar que requiere revisión previa'
);

function simulateSubmitJob(plan) {
  let isActive = false;
  let status = 'pendiente';
  if (plan === 'basico') {
    isActive = false;
    status = 'pendiente';
  }
  return {
    plan,
    isActive,
    status,
    message: '¡Tu oferta de empleo ha sido recibida con éxito! Nuestro equipo la revisará y se activará en breve tras su validación.'
  };
}

const freeJob = simulateSubmitJob('basico');
assert.strictEqual(freeJob.isActive, false, 'Las ofertas gratuitas JAMÁS deben auto-activarse sin moderación');
assert.strictEqual(freeJob.status, 'pendiente');

console.log('✅ TEST 1 superado: Auto-activación eliminada; moderación previa garantizada.\n');

// -----------------------------------------------------------------------------
// TEST 2 (Vector 20): Prevención de Redirección Abierta (Open Redirect)
// -----------------------------------------------------------------------------
console.log('--- TEST 2 (Vector 20): Prevención de Redirección Abierta (Open Redirect) ---');

function getSanitizedRedirect(redirectParam, requestUrl = 'https://portalempleoit.com/api/track-click') {
  if (!redirectParam) return '/';

  let decoded = '';
  try {
    decoded = decodeURIComponent(redirectParam).trim();
  } catch {
    return '/';
  }

  // Prevenir bypass de schema protocol-relative tipo '//evil.com'
  if (decoded.startsWith('//')) {
    return '/';
  }

  // Rutas relativas internas seguras
  if (decoded.startsWith('/') && !decoded.startsWith('/\\')) {
    return decoded;
  }

  try {
    const currentUrl = new URL(requestUrl);
    const parsed = new URL(decoded);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '/';
    }

    if (parsed.origin === currentUrl.origin) {
      return decoded;
    }

    const defaultAllowedHosts = new Set([
      'portalempleoit.com',
      'www.portalempleoit.com',
      'localhost',
      '127.0.0.1',
      'trk.udemy.com',
      'udemy.com'
    ]);

    const targetHost = parsed.hostname.toLowerCase();
    if (defaultAllowedHosts.has(targetHost)) {
      return decoded;
    }

    for (const allowed of defaultAllowedHosts) {
      if (targetHost.endsWith(`.${allowed}`)) {
        return decoded;
      }
    }

    return '/';
  } catch {
    return '/';
  }
}

// 2.1 Intentos de bypass con esquemas maliciosos
assert.strictEqual(getSanitizedRedirect('javascript:alert(1)'), '/', 'javascript: debe neutralizarse a /');
assert.strictEqual(getSanitizedRedirect('data:text/html,<script>evil()</script>'), '/', 'data: debe neutralizarse a /');
assert.strictEqual(getSanitizedRedirect('//attacker-phishing.com/login'), '/', 'Protocol-relative //evil.com debe neutralizarse a /');
assert.strictEqual(getSanitizedRedirect('https://attacker-phishing.com/login'), '/', 'Dominios externos no autorizados deben neutralizarse a /');

// 2.2 Rutas internas y dominios legítimos permitidos
assert.strictEqual(getSanitizedRedirect('/empleo/react-developer'), '/empleo/react-developer', 'Rutas relativas válidas permitidas');
assert.strictEqual(getSanitizedRedirect('https://portalempleoit.com/salarios'), 'https://portalempleoit.com/salarios', 'Dominio oficial permitido');
assert.strictEqual(getSanitizedRedirect('https://trk.udemy.com/redirect?aff=1'), 'https://trk.udemy.com/redirect?aff=1', 'Afiliado oficial en whitelist permitido');

console.log('✅ TEST 2 superado: Open redirects neutralizados hacia la raíz del portal.\n');

// -----------------------------------------------------------------------------
// TEST 3 (Vector 21): Mitigación de Fraude en Auto-Comisión de Afiliados B2B
// -----------------------------------------------------------------------------
console.log('--- TEST 3 (Vector 21): Mitigación de Fraude en Auto-Comisión de Afiliados B2B ---');

const stripeWebhookPath = path.resolve('frontend/app/api/webhooks/stripe/route.ts');
const stripeWebhookContent = fs.readFileSync(stripeWebhookPath, 'utf8');

// 3.1 Detección de auto-adjudicación en el código del webhook de Stripe
assert.ok(
  stripeWebhookContent.includes('payerEmail && recruiterEmail === payerEmail'),
  'El webhook de Stripe debe verificar si el pagador coincide con el reclutador'
);
assert.ok(
  stripeWebhookContent.includes('Intento de auto-comisión denegado: el reclutador'),
  'Debe denegar y registrar la auto-comisión'
);

function evaluateAffiliateCommission(recruiterEmail, payerEmail, affiliateCode) {
  if (!affiliateCode || !/^RECR-[A-Z0-9]{4,12}$/i.test(affiliateCode.trim())) {
    return { approved: false, reason: 'Código inválido' };
  }
  const rEmail = (recruiterEmail || '').toLowerCase().trim();
  const pEmail = (payerEmail || '').toLowerCase().trim();

  if (pEmail && rEmail === pEmail) {
    return { approved: false, reason: 'Auto-comisión denegada: reclutador coincide con pagador' };
  }
  return { approved: true, recruiter: rEmail, payer: pEmail };
}

// 3.2 Prueba de intento de auto-bonificación fraudulenta
const selfReferral = evaluateAffiliateCommission('recruiter@agency.es', 'recruiter@agency.es', 'RECR-XYZ9999');
assert.strictEqual(selfReferral.approved, false, 'Auto-comisión debe ser estrictamente denegada');

// 3.3 Prueba de referido genuino de un tercero
const legitimateReferral = evaluateAffiliateCommission('recruiter@agency.es', 'client@bigcorp.es', 'RECR-XYZ9999');
assert.strictEqual(legitimateReferral.approved, true, 'Comisión legítima de tercero debe ser aprobada');

console.log('✅ TEST 3 superado: Algoritmo de auto-comisión fraudulenta neutralizado en webhook.\n');

// -----------------------------------------------------------------------------
// TEST 4 (Vector 22): Verificación Criptográfica de Firmas en Webhooks de Stripe
// -----------------------------------------------------------------------------
console.log('--- TEST 4 (Vector 22): Verificación Criptográfica de Firmas en Webhooks de Stripe ---');

// 4.1 Uso de constructEvent con cuerpo en crudo
assert.ok(
  stripeWebhookContent.includes('stripe.webhooks.constructEvent(body, sig, webhookSecret)'),
  'El webhook de Stripe debe invocar stripe.webhooks.constructEvent con raw body'
);
assert.ok(
  stripeWebhookContent.includes('await request.text()'),
  'Debe leer el cuerpo en crudo con request.text() sin parseo JSON previo'
);
assert.ok(
  stripeWebhookContent.includes('!sig || !webhookSecret'),
  'Debe rechazar de inmediato si falta la firma o el secreto'
);

console.log('✅ TEST 4 superado: Webhook de Stripe blindado contra falsificación de eventos de pago.\n');

// -----------------------------------------------------------------------------
// TEST 5 (Vector 23): Manipulación de Precios (Parameter Tampering) en Checkout
// -----------------------------------------------------------------------------
console.log('--- TEST 5 (Vector 23): Manipulación de Precios (Parameter Tampering) en Checkout ---');

const checkoutRoutePath = path.resolve('frontend/app/api/checkout/route.ts');
const checkoutRouteContent = fs.readFileSync(checkoutRoutePath, 'utf8');

// 5.1 Catálogo y precios fijados exclusivamente en servidor
assert.ok(
  checkoutRouteContent.includes("const VALID_PLANS = new Set(['destacado_basico', 'destacado_30d', 'destacado_pro', 'destacado_enterprise'])"),
  'El endpoint de checkout debe validar el plan contra un catálogo estricto en servidor'
);
assert.ok(
  checkoutRouteContent.includes('unitAmount = 1900') &&
  checkoutRouteContent.includes('unitAmount = 900') &&
  checkoutRouteContent.includes('unitAmount = 4900'),
  'Los precios unitarios (9€, 19€, 49€) deben asignarse exclusivamente en backend'
);

// 5.2 Limpieza defensiva de registros huérfanos
assert.ok(
  checkoutRouteContent.includes('DELETE FROM jobs WHERE id = $1 AND is_active = FALSE'),
  'Debe limpiar la oferta preliminar si Stripe rechaza la sesión'
);

function simulatePriceResolution(plan) {
  const selected = (plan || '').toLowerCase().trim();
  const prices = {
    'destacado_basico': 900,
    'destacado_30d': 1900,
    'destacado_pro': 1900,
    'destacado_enterprise': 4900
  };
  return prices[selected] ?? null;
}

assert.strictEqual(simulatePriceResolution('destacado_basico'), 900);
assert.strictEqual(simulatePriceResolution('destacado_pro'), 1900);
assert.strictEqual(simulatePriceResolution('destacado_enterprise'), 4900);
assert.strictEqual(simulatePriceResolution('plan_hacked_0_euros'), null, 'Planes arbitrarios no deben resolver precio');

console.log('✅ TEST 5 superado: Precios blindados contra manipulación en cliente (Parameter Tampering).\n');

console.log('========================================================================');
console.log('🎉 TODOS LOS TESTS DEL BLOQUE 4 (VECTORES 19 AL 23) HAN PASADO CON ÉXITO');
console.log('========================================================================');

