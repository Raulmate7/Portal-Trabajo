import crypto from 'crypto';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export const USER_SESSION_COOKIE_NAME = 'user_session';
const SHORT_SESSION_MS = 24 * 60 * 60 * 1000; // 24 horas
const LONG_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
let userTablesReady = false;

/**
 * Garantiza de forma automática e idempotente que las tablas de usuario existan en MySQL
 * (compatible con db_proxy.php gracias a CREATE TABLE IF NOT EXISTS).
 */
export async function ensureUserAuthTables(): Promise<void> {
  if (userTablesReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NULL,
        role ENUM('candidate', 'company', 'recruiter') DEFAULT 'candidate',
        email_verified BOOLEAN DEFAULT FALSE,
        email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        email_consent_updated_at TIMESTAMP NULL,
        privacy_policy_version VARCHAR(50) DEFAULT 'v2026.11',
        consent_ip_hash VARCHAR(64) NULL,
        session_version INT NOT NULL DEFAULT 1,
        last_login_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email_notif (email_notifications_enabled, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        jti VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        ip_hash VARCHAR(64) NULL,
        user_agent VARCHAR(255) NULL,
        expires_at BIGINT NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_sessions_user (user_id),
        INDEX idx_user_sessions_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_password_resets (
        token_hash VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at BIGINT NOT NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_password_resets_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_saved_jobs (
        user_id INT NOT NULL,
        job_id VARCHAR(255) NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, job_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    userTablesReady = true;
  } catch {
    // Fallback tolerante durante build o entornos sin BD
  }
}

export interface AuthenticatedUser {
  id: number;
  uuid: string;
  email: string;
  fullName: string | null;
  role: 'candidate' | 'company' | 'recruiter';
  emailVerified: boolean;
  emailNotificationsEnabled: boolean;
  emailConsentUpdatedAt: string | null;
  sessionVersion: number;
  jti: string;
}

function getUserSessionSecret(): string {
  const secret =
    process.env.USER_SESSION_SECRET ||
    process.env.APP_SECRET ||
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET;

  if (!secret || secret.trim().length < 16) {
    throw new Error(
      'Configuración de seguridad de sesiones de usuario incompleta (se requiere USER_SESSION_SECRET o APP_SECRET).'
    );
  }
  return secret.trim();
}

/**
 * Genera un hash seguro de contraseña usando Node crypto.scrypt con salt aleatorio de 16 bytes.
 * Formato almacenado: scrypt:{saltHex}:{derivedKeyHex}
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica una contraseña en texto plano contra su hash almacenado en tiempo constante.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || !storedHash.startsWith('scrypt:')) {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  try {
    const expectedBuf = Buffer.from(hashHex, 'hex');
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, expectedBuf.length, { N: 16384, r: 8, p: 1 }, (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
    if (derivedKey.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedBuf);
  } catch {
    return false;
  }
}

export interface ParsedUserToken {
  userId: number;
  issuedAt: number;
  expiresAt: number;
  sessionVersion: number;
  jti: string;
}

/**
 * Genera un token HMAC-SHA256 para la cookie HttpOnly de usuario.
 * Formato: {userId}.{issuedAt}.{expiresAt}.{sessionVersion}.{jti}.{hmac}
 */
export function createUserSessionToken(
  userId: number,
  sessionVersion: number = 1,
  rememberMe: boolean = true
): { token: string; jti: string; expiresAt: number; maxAgeSeconds: number } {
  const secret = getUserSessionSecret();
  const issuedAt = Date.now();
  const durationMs = rememberMe ? LONG_SESSION_MS : SHORT_SESSION_MS;
  const expiresAt = issuedAt + durationMs;
  const jti = crypto.randomBytes(16).toString('hex');
  const payload = `user_session:${userId}:${issuedAt}:${expiresAt}:${sessionVersion}:${jti}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return {
    token: `${userId}.${issuedAt}.${expiresAt}.${sessionVersion}.${jti}.${signature}`,
    jti,
    expiresAt,
    maxAgeSeconds: Math.floor(durationMs / 1000),
  };
}

/**
 * Verifica criptográficamente la firma HMAC y la expiración de un token de sesión de usuario.
 */
export function verifyUserSessionToken(token: string | undefined | null): ParsedUserToken | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 6) return null;

  const [userIdStr, issuedAtStr, expiresAtStr, versionStr, jti, sigHex] = parts;
  const userId = parseInt(userIdStr, 10);
  const issuedAt = parseInt(issuedAtStr, 10);
  const expiresAt = parseInt(expiresAtStr, 10);
  const sessionVersion = parseInt(versionStr, 10);

  if (
    isNaN(userId) ||
    userId <= 0 ||
    isNaN(issuedAt) ||
    isNaN(expiresAt) ||
    isNaN(sessionVersion) ||
    !jti ||
    !sigHex
  ) {
    return null;
  }

  const now = Date.now();
  if (now > expiresAt || issuedAt > now + 60000) {
    return null;
  }

  let secret: string;
  try {
    secret = getUserSessionSecret();
  } catch {
    return null;
  }

  const payload = `user_session:${userId}:${issuedAt}:${expiresAt}:${sessionVersion}:${jti}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (sigHex.length !== expectedSig.length) return null;
  try {
    const valid = crypto.timingSafeEqual(Buffer.from(sigHex, 'utf8'), Buffer.from(expectedSig, 'utf8'));
    if (!valid) return null;
  } catch {
    return null;
  }

  return { userId, issuedAt, expiresAt, sessionVersion, jti };
}

export function getUserSessionCookieOptions(maxAgeSeconds: number) {
  return {
    name: USER_SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/**
 * Crea la sesión en la tabla user_sessions y devuelve el token listo para guardar en cookie.
 */
export async function createAndPersistUserSession(params: {
  userId: number;
  sessionVersion: number;
  rememberMe?: boolean;
  clientIp?: string;
  userAgent?: string | null;
}): Promise<{ token: string; jti: string; expiresAt: number; maxAgeSeconds: number }> {
  const { token, jti, expiresAt, maxAgeSeconds } = createUserSessionToken(
    params.userId,
    params.sessionVersion,
    params.rememberMe ?? true
  );

  const ipSalt = process.env.APP_SECRET || 'user_session_ip';
  const ipHash = params.clientIp
    ? crypto.createHash('sha256').update(`${params.clientIp}:${ipSalt}`).digest('hex')
    : null;
  const ua = (params.userAgent || '').slice(0, 250) || null;

  try {
    await pool.query(
      `INSERT INTO user_sessions (jti, user_id, ip_hash, user_agent, expires_at, revoked, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
      [jti, params.userId, ipHash, ua, expiresAt]
    );
  } catch (err) {
    console.error('Error al persistir user_sessions:', err);
  }

  return { token, jti, expiresAt, maxAgeSeconds };
}

/**
 * Revoca una sesión específica en base de datos por token o JTI.
 */
export async function revokeUserSession(token: string | undefined | null): Promise<void> {
  const parsed = verifyUserSessionToken(token);
  if (!parsed) return;
  try {
    await pool.query('UPDATE user_sessions SET revoked = TRUE WHERE jti = $1', [parsed.jti]);
  } catch {}
}

/**
 * Lee la cookie user_session del contexto actual (Server Components / Route Handlers)
 * y valida la sesión contra users y user_sessions.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_SESSION_COOKIE_NAME)?.value;
    const parsed = verifyUserSessionToken(token);
    if (!parsed) return null;

    await ensureUserAuthTables();

    const res = await pool.query(
      `SELECT u.id, u.uuid, u.email, u.full_name, u.role, u.email_verified,
              u.email_notifications_enabled, u.email_consent_updated_at,
              u.session_version, u.is_active,
              s.revoked AS session_revoked, s.expires_at AS session_expires_at
       FROM users u
       LEFT JOIN user_sessions s ON s.jti = $1 AND s.user_id = u.id
       WHERE u.id = $2
       LIMIT 1`,
      [parsed.jti, parsed.userId]
    );

    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];

    if (!row.is_active) return null;
    if (Number(row.session_version) !== parsed.sessionVersion) return null;
    if (row.session_revoked === true || row.session_revoked === 1) return null;
    if (row.session_expires_at && Number(row.session_expires_at) < Date.now()) return null;

    return {
      id: Number(row.id),
      uuid: String(row.uuid),
      email: String(row.email),
      fullName: row.full_name ? String(row.full_name) : null,
      role: (row.role || 'candidate') as 'candidate' | 'company' | 'recruiter',
      emailVerified: Boolean(row.email_verified),
      emailNotificationsEnabled: Boolean(row.email_notifications_enabled),
      emailConsentUpdatedAt: row.email_consent_updated_at
        ? new Date(row.email_consent_updated_at).toISOString()
        : null,
      sessionVersion: Number(row.session_version),
      jti: parsed.jti,
    };
  } catch {
    return null;
  }
}
