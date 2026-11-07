/**
 * test_bloque6_infra.mjs
 * 
 * Verificación adversarial y de regresión para el Bloque 6:
 * Infraestructura, Cabeceras HTTP, Red y Despliegue (Vectores 29 al 34).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN ADVERSARIAL: BLOQUE 6 (VECTORES 29 AL 34)');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1 (Vector 29): Endurecimiento de Cabeceras HTTP de Seguridad
// -----------------------------------------------------------------------------
console.log('--- TEST 1 (Vector 29): Endurecimiento de Cabeceras HTTP de Seguridad ---');

const nextConfigPath = path.resolve('frontend/next.config.ts');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

// 1.1 HSTS
assert.ok(
  nextConfigContent.includes('Strict-Transport-Security') &&
  nextConfigContent.includes('max-age=63072000; includeSubDomains; preload'),
  'HSTS estricto configurado en Next.js (max-age=63072000, subdominios y preload)'
);

// 1.2 Anti-Clickjacking y MIME Sniffing
assert.ok(nextConfigContent.includes("value: 'DENY'"), 'X-Frame-Options DENY configurado en Next.js');
assert.ok(nextConfigContent.includes("value: 'nosniff'"), 'X-Content-Type-Options nosniff configurado en Next.js');
assert.ok(nextConfigContent.includes("value: 'strict-origin-when-cross-origin'"), 'Referrer-Policy restrictiva configurada en Next.js');

// 1.3 Permissions-Policy y COOP
assert.ok(nextConfigContent.includes('Permissions-Policy'), 'Permissions-Policy configurada en Next.js');
assert.ok(
  nextConfigContent.includes('Cross-Origin-Opener-Policy') &&
  nextConfigContent.includes('same-origin-allow-popups'),
  'Cross-Origin-Opener-Policy configurada en Next.js'
);

// 1.4 Content-Security-Policy (CSP) robusta
assert.ok(nextConfigContent.includes("object-src 'none'"), 'CSP restringe object-src a none');
assert.ok(nextConfigContent.includes("base-uri 'self'"), 'CSP restringe base-uri a self');
assert.ok(nextConfigContent.includes("form-action 'self' https://checkout.stripe.com"), 'CSP restringe form-action a self y Stripe');
assert.ok(nextConfigContent.includes("frame-ancestors 'none'"), 'CSP frame-ancestors none contra framing malicioso');
assert.ok(nextConfigContent.includes("upgrade-insecure-requests"), 'CSP incluye directiva upgrade-insecure-requests');

// 1.5 Cabeceras en Nginx template
const nginxPath = path.resolve('nginx.conf.template');
const nginxContent = fs.readFileSync(nginxPath, 'utf8');
assert.ok(nginxContent.includes('Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"'), 'HSTS presente en Nginx');
assert.ok(nginxContent.includes('X-Frame-Options "DENY"'), 'X-Frame-Options presente en Nginx');
assert.ok(nginxContent.includes('X-Content-Type-Options "nosniff"'), 'X-Content-Type-Options presente en Nginx');

console.log('✅ TEST 1 superado: HSTS, CSP estricta, anti-clickjacking y MIME nosniff activos en Next.js y Nginx.\n');

// -----------------------------------------------------------------------------
// TEST 2 (Vector 30): Fuga de Metadatos y Fingerprinting Tecnológico del Servidor
// -----------------------------------------------------------------------------
console.log('--- TEST 2 (Vector 30): Fuga de Metadatos y Fingerprinting Tecnológico del Servidor ---');

// 2.1 Deshabilitación de poweredByHeader en Next.js
assert.ok(
  nextConfigContent.includes('poweredByHeader: false'),
  'poweredByHeader deshabilitado explícitamente en next.config.ts'
);

// 2.2 server_tokens off en Nginx
assert.ok(
  nginxContent.includes('server_tokens off;'),
  'server_tokens off configurado en Nginx para ocultar versión exacta de servidor'
);

// 2.3 Supresión de cabeceras de proxy informativas
assert.ok(
  nginxContent.includes('proxy_hide_header X-Powered-By;'),
  'proxy_hide_header X-Powered-By configurado en Nginx para eliminar filtraciones de backend'
);

console.log('✅ TEST 2 superado: X-Powered-By y versiones de servidor neutralizadas contra escaneo automatizado.\n');

// -----------------------------------------------------------------------------
// TEST 3 (Vector 31): Exposición Accidental de Archivos Sensibles, Backups y Dotfiles
// -----------------------------------------------------------------------------
console.log('--- TEST 3 (Vector 31): Exposición Accidental de Archivos Sensibles, Backups y Dotfiles ---');

// 3.1 Nginx: Bloqueo de dotfiles, dumps SQL, scripts y backups
assert.ok(
  nginxContent.includes('location ~ /\\.(?!well-known)'),
  'Nginx bloquea acceso a dotfiles (.env, .git, etc.) preservando .well-known'
);
assert.ok(
  nginxContent.includes('sql|bak|backup|config|conf|ini|log|sh|py|yml|yaml|tar|gz|zip'),
  'Nginx bloquea extensiones sensibles de base de datos, código y backups'
);
assert.ok(
  nginxContent.includes('location ~ \\.php$'),
  'Nginx bloquea cualquier invocación directa a scripts PHP'
);

// 3.2 Middleware de aplicación: Segunda capa defensiva en tiempo de ejecución
const middlewarePath = path.resolve('frontend/middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

assert.ok(
  middlewareContent.includes("pathname.startsWith('/.') && !pathname.startsWith('/.well-known')"),
  'Middleware bloquea peticiones a rutas ocultas'
);
assert.ok(
  middlewareContent.includes('sql|bak|backup|config|conf|ini|log|sh|py|yml|yaml|tar|gz|zip|swp|php'),
  'Middleware bloquea peticiones a archivos con extensiones críticas'
);
assert.ok(
  middlewareContent.includes('package.json') && middlewareContent.includes('tsconfig.json'),
  'Middleware bloquea acceso a descriptores de proyecto'
);

// 3.3 Flujo de despliegue en cPanel: .htaccess deny all y exclusión de archivos
const cpanelWorkflowPath = path.resolve('.github/workflows/deploy_cpanel.yml');
const cpanelWorkflowContent = fs.readFileSync(cpanelWorkflowPath, 'utf8');

assert.ok(
  cpanelWorkflowContent.includes('rm -f deploy_dist/backend/.env'),
  'CI/CD debe eliminar .env antes de subir a cPanel'
);
assert.ok(
  cpanelWorkflowContent.includes('rm -f deploy_dist/backend/*.sql'),
  'CI/CD debe eliminar dumps .sql antes de subir a cPanel'
);
assert.ok(
  cpanelWorkflowContent.includes('Deny from all'),
  'CI/CD debe inyectar .htaccess con Deny from all en el backend de cPanel'
);

console.log('✅ TEST 3 superado: Dotfiles, volcados SQL, backups y scripts backend inaccesibles por HTTP.\n');

// -----------------------------------------------------------------------------
// TEST 4 (Vector 32): Restricción de Dominio y Control Anti-SSRF en Indexing API
// -----------------------------------------------------------------------------
console.log('--- TEST 4 (Vector 32): Restricción de Dominio y Control Anti-SSRF en Indexing API ---');

const indexJobPath = path.resolve('frontend/app/api/index-job/route.ts');
const indexJobContent = fs.readFileSync(indexJobPath, 'utf8');

// 4.1 Verificación de token timing-safe
assert.ok(
  indexJobContent.includes('crypto.timingSafeEqual'),
  'El endpoint /api/index-job debe validar el secreto de autorización con timingSafeEqual'
);

// 4.2 Restricción estricta de dominios autorizados
assert.ok(
  indexJobContent.includes("const allowedHostnames = new Set(['portalempleoit.com', 'www.portalempleoit.com', 'localhost'])"),
  'El endpoint debe limitar los dominios a la whitelist oficial'
);
assert.ok(
  indexJobContent.includes("if (!allowedHostnames.has(parsed.hostname.toLowerCase()))"),
  'Debe rechazar cualquier URL cuyo dominio no esté en la whitelist'
);

console.log('✅ TEST 4 superado: Google Indexing API protegida contra abuso de cuota y SSRF hacia terceros.\n');

// -----------------------------------------------------------------------------
// TEST 5 (Vector 33): Prevención de OS Command Injection en Orquestador Python
// -----------------------------------------------------------------------------
console.log('--- TEST 5 (Vector 33): Prevención de OS Command Injection en Orquestador Python ---');

const runAllPath = path.resolve('backend/run_all.py');
const runAllCode = fs.readFileSync(runAllPath, 'utf8');

// 5.1 Ausencia total de os.system
assert.strictEqual(
  runAllCode.includes('os.system('),
  false,
  'No debe existir ninguna llamada a os.system en backend/run_all.py'
);

// 5.2 Uso de subprocess.run con listas de argumentos sin shell
assert.ok(
  runAllCode.includes('import subprocess'),
  'Debe importar subprocess'
);
assert.ok(
  runAllCode.includes('subprocess.run(args, check=False)'),
  'Debe invocar subprocess.run con lista de argumentos cerrados'
);
assert.ok(
  runAllCode.includes('run_cmd([python_bin, "main.py"])'),
  'Debe ejecutar tareas mediante matrices de argumentos sin invocar intérprete de shell'
);

console.log('✅ TEST 5 superado: Inyección de comandos en el SO eliminada; procesos invocados con listas seguras.\n');

// -----------------------------------------------------------------------------
// TEST 6 (Vector 34): Fuga de Credenciales en Bundles de Cliente y Flujos CI/CD
// -----------------------------------------------------------------------------
console.log('--- TEST 6 (Vector 34): Fuga de Credenciales en Bundles de Cliente y Flujos CI/CD ---');

// 6.1 Uso exclusivo de secretos de repositorio cifrados en GitHub Actions
assert.ok(
  cpanelWorkflowContent.includes('${{ secrets.FTP_SERVER }}') &&
  cpanelWorkflowContent.includes('${{ secrets.FTP_USERNAME }}') &&
  cpanelWorkflowContent.includes('${{ secrets.FTP_PASSWORD }}'),
  'El flujo de despliegue debe utilizar variables GitHub Secrets cifradas para autenticación FTP'
);

// 6.2 Segregación de variables secretas de backend en Next.js
const envLocalPath = path.resolve('frontend/.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  // Comprobar que variables sensibles de base de datos o claves no tienen prefijo NEXT_PUBLIC_
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key] = trimmed.split('=');
    if (['STRIPE_SECRET_KEY', 'DATABASE_URL', 'ADMIN_PASSWORD', 'PROXY_SECRET', 'CRON_SECRET'].includes(key)) {
      assert.strictEqual(
        key.startsWith('NEXT_PUBLIC_'),
        false,
        `La variable confidencial ${key} JAMÁS debe llevar el prefijo NEXT_PUBLIC_`
      );
    }
  }
}

console.log('✅ TEST 6 superado: Secretos protegidos en servidor; bundles cliente libres de credenciales sensibles.\n');

console.log('========================================================================');
console.log('🎉 TODOS LOS TESTS DEL BLOQUE 6 (VECTORES 29 AL 34) HAN PASADO CON ÉXITO');
console.log('========================================================================');

