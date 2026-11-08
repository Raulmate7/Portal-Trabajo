import crypto from 'crypto';

function getReferralSecret(): Buffer {
  const secret = process.env.MAGIC_LINK_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('Configuración de seguridad crítica no inicializada (MAGIC_LINK_SECRET o CRON_SECRET requerido).');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra un correo para generar un enlace de referido opaco y seguro (Vector 8).
 * Evita la exposición pública en texto claro o Base64 del email del recomendador.
 */
export function encryptReferralCode(email: string): string {
  if (!email || !email.includes('@')) return '';
  try {
    const cleanEmail = email.trim().toLowerCase();
    const iv = crypto.randomBytes(12); // 12 bytes IV recomendado para AES-GCM
    const secret = getReferralSecret();
    const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
    let encrypted = cipher.update(cleanEmail, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `ref_${iv.toString('hex')}_${tag}_${encrypted}`;
  } catch (e) {
    console.error('Error cifrando código de referido:', e);
    return '';
  }
}

/**
 * Descifra el código de referido, requiriendo estrictamente el formato cifrado seguro (AES-256-GCM).
 * Se rechaza cualquier entrada en Base64 para prevenir ataques de falsificación y enumeración de correos.
 */
export function decryptReferralCode(code: string): string | null {
  if (!code || typeof code !== 'string') return null;
  const cleanCode = code.trim();
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  try {
    // Exigir formato cifrado seguro: ref_{iv}_{tag}_{ciphertext}
    if (!cleanCode.startsWith('ref_')) {
      return null;
    }

    const parts = cleanCode.split('_');
    if (parts.length !== 4) {
      return null;
    }

    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    if (iv.length !== 12 || tag.length !== 16 || !encrypted) {
      return null;
    }

    const secret = getReferralSecret();
    const decipher = crypto.createDecipheriv('aes-256-gcm', secret, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const candidate = decrypted.trim().toLowerCase();
    return EMAIL_REGEX.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
