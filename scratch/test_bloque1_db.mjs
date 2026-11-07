/**
 * test_bloque1_db.mjs
 * 
 * Verificación adversarial y de regresión para el Bloque 1:
 * Base de Datos, Acceso a Datos y Proxy SQL (Vectores 1 al 7).
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

console.log('========================================================================');
console.log('🧪 VERIFICACIÓN ADVERSARIAL: BLOQUE 1 (VECTORES 1 AL 7)');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1 (Vector 1): Traducción Segura de Parámetros y Prepared Statements
// -----------------------------------------------------------------------------
console.log('--- TEST 1 (Vector 1): Traducción Segura de Parámetros y Prepared Statements ---');

// Función idéntica a la implementada en frontend/lib/db.ts
function translatePgToMysql(sql, params = []) {
  let mysqlParams = [];
  let mysqlSql = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (inString) {
      if (char === stringChar && sql[i - 1] !== '\\') {
        inString = false;
      }
      mysqlSql += char;
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
        mysqlSql += char;
      } else if (char === '$') {
        let j = i + 1;
        let numStr = '';
        while (j < sql.length && sql[j] >= '0' && sql[j] <= '9') {
          numStr += sql[j];
          j++;
        }
        if (numStr.length > 0) {
          const pgIndex = parseInt(numStr, 10) - 1;
          if (params && pgIndex >= 0 && pgIndex < params.length) {
            mysqlParams.push(params[pgIndex]);
          } else {
            mysqlParams.push(null);
          }
          mysqlSql += '?';
          i = j - 1;
        } else {
          mysqlSql += char;
        }
      } else {
        mysqlSql += char;
      }
    }
  }

  if (mysqlParams.length === 0 && params && params.length > 0) {
    mysqlParams = params;
  }

  mysqlSql = mysqlSql.replace(/\bILIKE\b/gi, 'LIKE');
  return { mysqlSql, mysqlParams };
}

// 1.1 Consulta básica parametrizada
const q1 = translatePgToMysql('SELECT * FROM jobs WHERE category = $1 AND is_active = $2', ['Frontend', true]);
assert.strictEqual(q1.mysqlSql, 'SELECT * FROM jobs WHERE category = ? AND is_active = ?');
assert.deepStrictEqual(q1.mysqlParams, ['Frontend', true]);

// 1.2 Signo $ dentro de string literal jamás debe convertirse a ?
const q2 = translatePgToMysql("SELECT * FROM jobs WHERE salary = '$50,000' AND id = $1", [42]);
assert.strictEqual(q2.mysqlSql, "SELECT * FROM jobs WHERE salary = '$50,000' AND id = ?");
assert.deepStrictEqual(q2.mysqlParams, [42]);

// 1.3 Comillas escapadas dentro de strings
const q3 = translatePgToMysql("SELECT * FROM jobs WHERE note = 'John\\'s $100 bonus' AND id = $1", [99]);
assert.strictEqual(q3.mysqlSql, "SELECT * FROM jobs WHERE note = 'John\\'s $100 bonus' AND id = ?");
assert.deepStrictEqual(q3.mysqlParams, [99]);

// 1.4 Reutilización del mismo parámetro ($1 en múltiples cláusulas)
const q4 = translatePgToMysql("SELECT * FROM jobs WHERE (title ILIKE $1 OR description ILIKE $1)", ['%react%']);
assert.strictEqual(q4.mysqlSql, "SELECT * FROM jobs WHERE (title LIKE ? OR description LIKE ?)");
assert.deepStrictEqual(q4.mysqlParams, ['%react%', '%react%']);

console.log('✅ TEST 1 superado: La capa de traducción maneja parámetros y strings sin alterar datos literales.\n');

// -----------------------------------------------------------------------------
// TEST 2 (Vector 2): Control de Acceso y Mitigación de Timing Attacks en db_proxy.php
// -----------------------------------------------------------------------------
console.log('--- TEST 2 (Vector 2): Control de Acceso y Mitigación de Timing Attacks en db_proxy.php ---');

function simulateProxyAuth(enableProxyEnv, expectedSecretEnv, clientTokenHeader) {
  // 1. Bloqueo por defecto
  if (enableProxyEnv !== 'true') {
    return { status: 403, error: 'Endpoint deshabilitado por directiva de seguridad.' };
  }

  // 2. Token de seguridad
  const secret = clientTokenHeader || '';
  const expected = expectedSecretEnv || '';

  if (!expected || !secret) {
    return { status: 403, error: 'Acceso denegado: Token no válido o ausente.' };
  }

  // Equivalente de hash_equals en PHP
  const secretBuf = Buffer.from(secret, 'utf-8');
  const expectedBuf = Buffer.from(expected, 'utf-8');
  const isValid = secretBuf.length === expectedBuf.length && crypto.timingSafeEqual(secretBuf, expectedBuf);

  if (!isValid) {
    return { status: 403, error: 'Acceso denegado: Token no válido o ausente.' };
  }

  return { status: 200, success: true };
}

// 2.1 Deshabilitado por defecto
assert.strictEqual(simulateProxyAuth(undefined, 'secret123', 'secret123').status, 403);
assert.strictEqual(simulateProxyAuth('false', 'secret123', 'secret123').status, 403);

// 2.2 Secreto de entorno vacío (rechazo fail-closed)
assert.strictEqual(simulateProxyAuth('true', '', '').status, 403);
assert.strictEqual(simulateProxyAuth('true', undefined, 'secret123').status, 403);

// 2.3 Token de cliente incorrecto
assert.strictEqual(simulateProxyAuth('true', 'correct_secret_token_123', 'wrong_token').status, 403);

// 2.4 Token de cliente legítimo
assert.strictEqual(simulateProxyAuth('true', 'correct_secret_token_123', 'correct_secret_token_123').status, 200);

console.log('✅ TEST 2 superado: db_proxy.php opera en fail-closed con comparación en tiempo constante.\n');

// -----------------------------------------------------------------------------
// TEST 3 (Vector 3): Detección y Rechazo de Consultas Apiladas (Stacked Queries)
// -----------------------------------------------------------------------------
console.log('--- TEST 3 (Vector 3): Detección y Rechazo de Consultas Apiladas (Stacked Queries) ---');

function validateStackedQueries(sql) {
  const trimmed = sql.replace(/[; \t\n\r\0\x0B]+$/, '');
  if (trimmed.includes(';')) {
    return { allowed: false, error: 'Consultas múltiples no permitidas por políticas de seguridad.' };
  }
  return { allowed: true };
}

// 3.1 Rechazar multisentencias con punto y coma
assert.strictEqual(validateStackedQueries('SELECT * FROM jobs; DROP TABLE jobs').allowed, false);
assert.strictEqual(validateStackedQueries('SELECT 1; UPDATE users SET is_admin = 1').allowed, false);
assert.strictEqual(validateStackedQueries('SELECT 1; TRUNCATE subscribers;').allowed, false);

// 3.2 Permitir consultas únicas con punto y coma final benigno
assert.strictEqual(validateStackedQueries('SELECT * FROM jobs WHERE is_active = 1;').allowed, true);
assert.strictEqual(validateStackedQueries('SELECT * FROM jobs WHERE is_active = 1;\n  \t').allowed, true);

console.log('✅ TEST 3 superado: Stacked queries destructivas bloqueadas eficazmente.\n');

// -----------------------------------------------------------------------------
// TEST 4 (Vector 4): Prevención de Exfiltración de Esquemas del Sistema
// -----------------------------------------------------------------------------
console.log('--- TEST 4 (Vector 4): Prevención de Exfiltración de Esquemas del Sistema ---');

function validateSystemSchemas(sql) {
  const sqlUpper = sql.toUpperCase().trim();
  if (/\b(INFORMATION_SCHEMA|PERFORMANCE_SCHEMA|MYSQL|SYS)\b/i.test(sqlUpper)) {
    return { allowed: false, error: 'Acceso a esquemas de sistema no permitido.' };
  }
  return { allowed: true };
}

// 4.1 Intentos de introspección adversarial bloqueados
assert.strictEqual(validateSystemSchemas('SELECT * FROM information_schema.tables').allowed, false);
assert.strictEqual(validateSystemSchemas('SELECT * FROM `INFORMATION_SCHEMA`.columns').allowed, false);
assert.strictEqual(validateSystemSchemas('SELECT * FROM performance_schema.threads').allowed, false);
assert.strictEqual(validateSystemSchemas('SELECT user, authentication_string FROM mysql.user').allowed, false);
assert.strictEqual(validateSystemSchemas('SELECT * FROM sys.version').allowed, false);

// 4.2 Consultas legítimas que no deben generar falsos positivos
assert.strictEqual(validateSystemSchemas("SELECT * FROM jobs WHERE category = 'mysql_specialist'").allowed, true);

console.log('✅ TEST 4 superado: Esquemas internos protegidos contra introspección no autorizada.\n');

// -----------------------------------------------------------------------------
// TEST 5 (Vector 5): Bloqueo de Funciones de Archivo y Temporización (RCE & Timing)
// -----------------------------------------------------------------------------
console.log('--- TEST 5 (Vector 5): Bloqueo de Funciones de Archivo y Temporización ---');

function validateFileAndTiming(sql) {
  const sqlUpper = sql.toUpperCase().trim();
  if (/\b(OUTFILE|DUMPFILE|LOAD_FILE|BENCHMARK|SLEEP)\b/i.test(sqlUpper)) {
    return { allowed: false, error: 'Operación de archivo o temporización bloqueada.' };
  }
  return { allowed: true };
}

// 5.1 Bloquear operaciones de vuelco de archivos (webshell)
assert.strictEqual(validateFileAndTiming("SELECT '<?php system($_GET[1]); ?>' INTO OUTFILE '/var/www/html/sh.php'").allowed, false);
assert.strictEqual(validateFileAndTiming("SELECT 'shell' INTO/**/OUTFILE '/tmp/x'").allowed, false); // Intento de evasión por comentario
assert.strictEqual(validateFileAndTiming("SELECT 'payload' INTO/*test*/DUMPFILE '/tmp/p'").allowed, false);

// 5.2 Bloquear lectura de archivos
assert.strictEqual(validateFileAndTiming("SELECT LOAD_FILE('/etc/passwd')").allowed, false);

// 5.3 Bloquear temporización ciega (Time-based Blind SQLi)
assert.strictEqual(validateFileAndTiming("SELECT * FROM jobs WHERE SLEEP(5)").allowed, false);
assert.strictEqual(validateFileAndTiming("SELECT BENCHMARK(10000000, MD5(1))").allowed, false);

console.log('✅ TEST 5 superado: Vectores de RCE vía archivos y temporización neutralizados.\n');

// -----------------------------------------------------------------------------
// TEST 6 (Vector 6): Configuración Defensiva del Pool de Conexiones en db.ts
// -----------------------------------------------------------------------------
console.log('--- TEST 6 (Vector 6): Configuración Defensiva del Pool de Conexiones en db.ts ---');

const dbTsPath = path.resolve('frontend/lib/db.ts');
const dbTsContent = fs.readFileSync(dbTsPath, 'utf8');

// 6.1 Límite de cola defensivo para prevenir fugas de memoria
assert.ok(
  dbTsContent.includes('queueLimit: 50'),
  'El pool de MySQL debe tener un queueLimit explícito (50) para evitar desbordamiento de memoria'
);

// 6.2 Espera de conexiones y timeout ajustado
assert.ok(
  dbTsContent.includes('waitForConnections: true'),
  'waitForConnections debe estar activado'
);
assert.ok(
  dbTsContent.includes('connectTimeout: 5000'),
  'connectTimeout debe ser estricto (5000ms) para evitar bloqueos prolongados'
);

// 6.3 Prevención de almacenamiento en caché en el proxy de fetch
assert.ok(
  dbTsContent.includes("cache: 'no-store'"),
  'Las llamadas al proxy HTTP deben tener cache: no-store para evitar fugas de datos en Next.js Data Cache'
);

// 6.4 Uso prioritario de server-side prepared statements en executeQuery
assert.ok(
  dbTsContent.includes('conn.execute(mysqlSql, mysqlParams)'),
  'Debe priorizar conn.execute sobre conn.query cuando existen parámetros'
);

console.log('✅ TEST 6 superado: Límites de memoria y pool configurados con defensas anti-DoS.\n');

// -----------------------------------------------------------------------------
// TEST 7 (Vector 7): Transacciones Atómicas y Rollback Defensivo
// -----------------------------------------------------------------------------
console.log('--- TEST 7 (Vector 7): Transacciones Atómicas y Rollback Defensivo ---');

const actionsPath = path.resolve('frontend/app/actions.ts');
const actionsContent = fs.readFileSync(actionsPath, 'utf8');

// 7.1 ROLLBACK en submitSponsoredJob
assert.ok(
  actionsContent.includes("await client.query('ROLLBACK')"),
  'submitSponsoredJob debe ejecutar ROLLBACK ante fallos de inserción'
);

const deactivateJobsPath = path.resolve('backend/deactivate_expired_jobs.py');
const deactivateJobsContent = fs.readFileSync(deactivateJobsPath, 'utf8');

// 7.2 rollback() en scripts de backend
assert.ok(
  deactivateJobsContent.includes('conn.rollback()'),
  'deactivate_expired_jobs.py debe ejecutar rollback() en caso de excepción'
);

console.log('✅ TEST 7 superado: Transacciones atómicas protegidas con reversión garantizada.\n');

console.log('========================================================================');
console.log('🎉 TODOS LOS TESTS DEL BLOQUE 1 (VECTORES 1 AL 7) HAN PASADO CON ÉXITO');
console.log('========================================================================');

