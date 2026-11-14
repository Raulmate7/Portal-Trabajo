import crypto from 'crypto';
import pool from '@/lib/db';

// Registro en memoria de sesiones revocadas (token o JTI -> timestamp de expiración)
const revokedSessions = new Map<string, number>();
let globalRevokeBefore: number = 0;
let currentSessionVersion: number = 1;
let securityTablesReady = false;

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('Configuración de seguridad de administración no inicializada (se requiere ADMIN_SESSION_SECRET o ADMIN_PASSWORD)');
  }
  return secret;
}

function cleanupRevoked() {
  const now = Date.now();
  for (const [key, expiry] of revokedSessions.entries()) {
    if (expiry < now) {
      revokedSessions.delete(key);
    }
  }
}

async function ensureAdminSecurityTables(): Promise<void> {
  if (securityTablesReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_security_state (
        id TINYINT PRIMARY KEY,
        session_version INT NOT NULL DEFAULT 1,
        global_revoke_before BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      INSERT IGNORE INTO admin_security_state (id, session_version, global_revoke_before)
      VALUES (1, 1, 0)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revoked_admin_sessions (
        jti VARCHAR(64) PRIMARY KEY,
        expires_at BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        ip_hash VARCHAR(64) NOT NULL,
        user_agent VARCHAR(255) NULL,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        details VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin_audit_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    securityTablesReady = true;
  } catch {
    // Fallback tolerante si el entorno no tiene BD disponible durante build/test
  }
}

async function loadSecurityState(): Promise<{ version: number; revokeBefore: number }> {
  await ensureAdminSecurityTables();
  try {
    const res = await pool.query(
      'SELECT session_version, global_revoke_before FROM admin_security_state WHERE id = 1 LIMIT 1'
    );
    if (res.rows && res.rows.length > 0) {
      const ver = Number(res.rows[0].session_version) || 1;
      const rev = Number(res.rows[0].global_revoke_before) || 0;
      currentSessionVersion = Math.max(currentSessionVersion, ver);
      globalRevokeBefore = Math.max(globalRevokeBefore, rev);
    }
  } catch {
    // Usar estado en memoria si la BD no responde
  }
  return { version: currentSessionVersion, revokeBefore: globalRevokeBefore };
}

/**
 * Genera un token de sesión seguro con versión revocable y JTI.
 * Formato: {timestamp}.{version}.{jti}.{signature}
 */
export function createAdminSessionToken(version: number = currentSessionVersion): string {
  const secret = getSessionSecret();
  const timestamp = Date.now().toString();
  const jti = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`admin_session:${timestamp}:${version}:${jti}`)
    .digest('hex');
  return `${timestamp}.${version}.${jti}.${signature}`;
}

export async function createAdminSessionTokenAsync(): Promise<string> {
  const state = await loadSecurityState();
  return createAdminSessionToken(state.version);
}

/**
 * Revoca un token de sesión específico en memoria y en base de datos.
 */
export function revokeAdminSession(token: string | undefined | null): void {
  if (!token || typeof token !== 'string') return;
  try {
    const parts = token.split('.');
    const timestamp = parseInt(parts[0], 10);
    const ttl = (isNaN(timestamp) ? Date.now() : timestamp) + (8 * 60 * 60 * 1000);

    revokedSessions.set(token, ttl);
    if (parts.length === 4) {
      revokedSessions.set(parts[2], ttl);
    } else if (parts.length === 3) {
      revokedSessions.set(parts[1], ttl);
    }

    if (revokedSessions.size > 1000) {
      cleanupRevoked();
    }
  } catch {
    // ignore
  }
}

export async function revokeAdminSessionAsync(token: string | undefined | null): Promise<void> {
  revokeAdminSession(token);
  if (!token || typeof token !== 'string') return;
  const parts = token.split('.');
  const jti = parts.length === 4 ? parts[2] : parts.length === 3 ? parts[1] : null;
  if (!jti) return;
  const timestamp = parseInt(parts[0], 10);
  const expiresAt = (isNaN(timestamp) ? Date.now() : timestamp) + (8 * 60 * 60 * 1000);

  await ensureAdminSecurityTables();
  try {
    await pool.query(
      'INSERT IGNORE INTO revoked_admin_sessions (jti, expires_at) VALUES ($1, $2)',
      [jti.slice(0, 64), expiresAt]
    );
  } catch {
    // ignore
  }
}

/**
 * Revoca globalmente todas las sesiones activas incrementando session_version y global_revoke_before.
 */
export function revokeAllAdminSessions(): void {
  globalRevokeBefore = Date.now();
  currentSessionVersion += 1;
}

export async function revokeAllAdminSessionsAsync(): Promise<void> {
  revokeAllAdminSessions();
  await ensureAdminSecurityTables();
  try {
    await pool.query(
      'UPDATE admin_security_state SET session_version = session_version + 1, global_revoke_before = $1 WHERE id = 1',
      [globalRevokeBefore]
    );
  } catch {
    // ignore
  }
}

/**
 * Registra eventos de autenticación administrativa en admin_audit_logs (SEC-021).
 */
export async function recordAdminAuditLog(params: {
  eventType: string;
  clientIp: string;
  userAgent?: string | null;
  success: boolean;
  details?: string;
}): Promise<void> {
  await ensureAdminSecurityTables();
  const salt = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'admin_audit';
  const ipHash = crypto.createHash('sha256').update(`${params.clientIp}:${salt}`).digest('hex');
  const ua = (params.userAgent || '').slice(0, 250);
  const details = (params.details || '').slice(0, 250);
  try {
    await pool.query(
      `INSERT INTO admin_audit_logs (event_type, ip_hash, user_agent, success, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.eventType.slice(0, 64), ipHash, ua, params.success, details]
    );
  } catch {
    // No bloquear el flujo de auth si falla el log secundario
  }
}

/**
 * Valida criptográficamente el token de sesión en memoria.
 */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3 && parts.length !== 4) return false;

    const timestampStr = parts[0];
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const SESSION_DURATION = 8 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - timestamp > SESSION_DURATION || now < timestamp) {
      return false;
    }

    if (timestamp <= globalRevokeBefore) {
      return false;
    }

    if (revokedSessions.has(token)) {
      return false;
    }

    const secret = getSessionSecret();

    if (parts.length === 4) {
      const [, versionStr, jti, signature] = parts;
      const version = parseInt(versionStr, 10);
      if (isNaN(version) || version < currentSessionVersion || !jti || !signature) return false;
      if (revokedSessions.has(jti)) return false;

      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(`admin_session:${timestampStr}:${versionStr}:${jti}`)
        .digest('hex');
      if (signature.length !== expectedSig.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
    }

    const [, jti, signature] = parts;
    if (!jti || !signature || revokedSessions.has(jti)) return false;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`admin_session:${timestampStr}:${jti}`)
      .digest('hex');
    if (signature.length !== expectedSig.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSig, 'utf-8'));
  } catch {
    return false;
  }
}

/**
 * Valida sesión administrativa contrastando además versión global y revocación persistente en BD (SEC-021).
 */
export async function verifyAdminSessionTokenAsync(token: string | undefined | null): Promise<boolean> {
  await loadSecurityState();
  if (!verifyAdminSessionToken(token)) return false;
  if (!token) return false;

  const parts = token.split('.');
  const jti = parts.length === 4 ? parts[2] : parts[1];
  try {
    const res = await pool.query(
      'SELECT 1 FROM revoked_admin_sessions WHERE jti = $1 LIMIT 1',
      [jti]
    );
    if (res.rows && res.rows.length > 0) {
      return false;
    }
  } catch {
    // Si falla consulta secundaria tras validar firma, se mantiene el chequeo en memoria
  }
  return true;
}
