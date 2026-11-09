'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { encryptReferralCode } from '@/lib/referral';
import { isSafePublicUrl } from '@/lib/urlSafety';

// --- Rate Limiter y Utilidades Seguras ---
const rateLimitMap = new Map<string, number>();

async function getActionClientIp(): Promise<string> {
  try {
    const reqHeaders = await headers();
    const cfIp = reqHeaders.get('cf-connecting-ip');
    if (cfIp) return cfIp.trim();
    const realIp = reqHeaders.get('x-real-ip');
    if (realIp) return realIp.trim();
    const forwarded = reqHeaders.get('x-forwarded-for');
    if (forwarded) {
      const parts = forwarded.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1];
    }
  } catch {
    // Edge case if headers() is invoked in test context
  }
  return '127.0.0.1';
}

function checkRateLimit(key: string, limitMs: number = 60000): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(key);
  if (lastRequest && now - lastRequest < limitMs) {
    return false;
  }
  // Vector 21: Prevención de DoS de Rate Limiting.
  // Jamás usar .clear() global (que borraba el historial de todos los atacantes).
  // Se purgan primero entradas vencidas y luego se expulsa por LRU ordenado.
  if (rateLimitMap.size >= 10000) {
    for (const [k, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > 300000) { // más de 5 minutos
        rateLimitMap.delete(k);
      }
      if (rateLimitMap.size < 8000) break;
    }
    // Si aún excede el límite (rotación masiva de claves), expulsar las más antiguas por orden FIFO/LRU
    if (rateLimitMap.size >= 10000) {
      let evicted = 0;
      for (const k of rateLimitMap.keys()) {
        rateLimitMap.delete(k);
        evicted++;
        if (evicted >= 2000) break;
      }
    }
  }
  rateLimitMap.set(key, now);
  return true;
}

/**
 * Valida la cabecera Origin / Host para prevenir ataques CSRF en Server Actions mutantes (Vector 22).
 */
async function verifyCsrfOrigin(): Promise<boolean> {
  try {
    const h = await headers();
    const origin = h.get('origin');
    if (!origin) {
      const referer = h.get('referer');
      if (!referer) return true; // Invocación interna desde el servidor / SSR
      const refHost = new URL(referer).host;
      const host = h.get('host') || h.get('x-forwarded-host');
      return !host || refHost === host;
    }
    const originHost = new URL(origin).host;
    const host = h.get('host') || h.get('x-forwarded-host');
    if (!host) return true;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * Sanitiza campos de texto para notificaciones de Telegram usando parse_mode: 'HTML' (Vector 23).
 * Previene ataques de phishing, inyección de enlaces camuflados y errores de parseo por caracteres especiales.
 */
function escapeTelegramHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Registro en memoria para invalidar tokens de acceso mágico (revocación y prevención de repetición)
const revokedMagicTokens = new Map<string, number>();

function cleanupRevokedMagicTokens() {
  const now = Date.now();
  for (const [key, expiry] of revokedMagicTokens.entries()) {
    if (expiry < now) {
      revokedMagicTokens.delete(key);
    }
  }
  if (revokedMagicTokens.size > 2000) {
    let evicted = 0;
    for (const k of revokedMagicTokens.keys()) {
      revokedMagicTokens.delete(k);
      evicted++;
      if (evicted >= 500) break;
    }
  }
}

export async function revokeSecureToken(token: string): Promise<void> {
  if (!token || typeof token !== 'string') return;
  const ttl = Date.now() + 2 * 60 * 60 * 1000;
  revokedMagicTokens.set(token, ttl);
  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length === 3) {
      revokedMagicTokens.set(parts[1], ttl); // JTI/Nonce
    }
  }
  if (revokedMagicTokens.size > 2000) {
    cleanupRevokedMagicTokens();
  }
}

function generateSecureToken(email: string): string {
  // Usar clave secreta dedicada para enlaces mágicos de acceso
  const secret = process.env.MAGIC_LINK_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("MAGIC_LINK_SECRET o CRON_SECRET no configurado");
  const timestamp = Date.now();
  // Nonce criptográfico aleatorio único por cada token generado (Vector 13)
  const nonce = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', secret).update(`${email.trim().toLowerCase()}:${timestamp}:${nonce}`).digest('hex');
  return `${timestamp}.${nonce}.${hash}`;
}

function verifySecureToken(email: string, token: string): boolean {
  const secret = process.env.MAGIC_LINK_SECRET || process.env.CRON_SECRET;
  if (!secret || !token || !token.includes('.')) return false;
  
  if (revokedMagicTokens.has(token)) {
    return false;
  }

  const parts = token.split('.');
  const cleanEmail = email.trim().toLowerCase();

  // Tokens reforzados con nonce aleatorio de 3 partes: {timestamp}.{nonce}.{hash}
  if (parts.length === 3) {
    const [timestampStr, nonce, hash] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Ventana estricta de validez de 2 horas (estándar OWASP para magic links)
    const MAX_AGE = 2 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - timestamp > MAX_AGE || now < timestamp) return false;

    if (revokedMagicTokens.has(nonce)) return false;

    const expectedHash = crypto.createHmac('sha256', secret).update(`${cleanEmail}:${timestampStr}:${nonce}`).digest('hex');
    if (!hash || hash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
  }

  // Compatibilidad con tokens clásicos de 2 partes: {timestamp}.{hash}
  if (parts.length === 2) {
    const [timestampStr, hash] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const MAX_AGE = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - timestamp > MAX_AGE || now < timestamp) return false;

    const expectedHash = crypto.createHmac('sha256', secret).update(cleanEmail + timestampStr).digest('hex');
    if (!hash || hash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(expectedHash, 'utf-8'));
  }

  return false;
}

async function sendMagicLinkEmail(toEmail: string, loginUrl: string, type: 'recruiter' | 'candidate') {
  const resendApiKey = process.env.RESEND_API_KEY;
  const isRecruiter = type === 'recruiter';
  const subject = isRecruiter 
    ? 'Acceso a tu Panel de Empresa — Portal Trabajo IT' 
    : 'Acceso a tu Perfil de Candidato — Portal Trabajo IT';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #4338ca; margin-top: 0;">Portal Trabajo IT</h2>
      <p style="color: #374151; font-size: 15px;">Hola,</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5;">
        Has solicitado un enlace de acceso para ${isRecruiter ? 'gestionar tus ofertas de empleo' : 'configurar tus preferencias de alertas y candidato'}.
      </p>
      <div style="margin: 24px 0;">
        <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
          Acceder a mi panel seguro →
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Este enlace es personal e intransferible y expira en 24 horas.<br/>
        Si no has solicitado este acceso, puedes ignorar este correo de forma segura.
      </p>
    </div>
  `;

  if (resendApiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Portal Trabajo IT <alertas@portalempleoit.com>',
          to: toEmail,
          subject,
          html
        })
      });
    } catch (e) {
      console.error('Error enviando email via Resend:', e);
    }
  } else {
    // Registro seguro sin exponer tokens en logs
    const masked = toEmail.length > 5 ? `${toEmail.slice(0, 2)}***@${toEmail.split('@')[1]}` : '***';
    console.log(`[AUTH] Enlace de acceso preparado para ${masked}`);
  }
}

/**
 * Genera un enlace de recomendación con código opaco y cifrado (Vector 8)
 * para evitar la exposición pública del correo electrónico del recomendador.
 */
export async function getReferralLink(email: string): Promise<string> {
  if (!email || !email.includes('@')) return '';
  const code = encryptReferralCode(email);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
  return `${baseUrl}/ref/${code}`;
}

// ------------------------------------------

export async function subscribeUser(formData: FormData) {
  if (!await verifyCsrfOrigin()) {
    return { message: 'Petición rechazada por política de seguridad de origen (CSRF).', success: false };
  }
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const pathname = formData.get('pathname') as string;
  const techKeywords = (formData.get('tech_keywords') as string || '').trim();
  const locationPref = (formData.get('location_pref') as string || '').trim();
  const frequency = (formData.get('frequency') as string || 'weekly').trim();
  const privacyAccepted = formData.get('privacy_accepted') === 'on' || formData.get('privacy_accepted') === 'true';

  if (!privacyAccepted) {
    return { message: 'Debes aceptar la Política de Privacidad para suscribirte.', success: false };
  }
  
  // Vector 10: Leer cookie referrer_email segura httpOnly como fallback si no viene en el formulario
  const cookieStore = await cookies();
  const cookieReferrer = cookieStore.get('referrer_email')?.value || null;
  const rawReferredBy = (formData.get('referred_by') as string || '').trim().toLowerCase();
  const referredBy = rawReferredBy || cookieReferrer;

  const operator = (formData.get('operator') as string || 'OR').toUpperCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 255) {
    return { message: 'Por favor, escribe un email válido.', success: false };
  }

  // Vector 24: Mitigación de spam masivo y agotamiento de recursos por IP y por email
  const clientIp = await getActionClientIp();
  if (!checkRateLimit(`ip_sub_${clientIp}`, 10000)) {
    return { message: 'Demasiadas solicitudes desde tu red. Espera unos segundos antes de volver a intentarlo.', success: false };
  }
  if (!checkRateLimit(`sub_${email}`, 30000)) {
    return { message: 'Estás haciendo demasiadas peticiones. Espera un momento.', success: false };
  }

  const client = await pool.connect();
  try {
    // 1. Comprobar si el suscriptor ya existe para evitar que terceros sobreescriban sus preferencias sin autenticación
    const checkRes = await client.query(
      "SELECT id FROM subscribers WHERE email = $1 LIMIT 1",
      [email]
    );

    // Vector 12: Unificar la respuesta para suscriptores existentes y nuevos.
    // Previene la enumeración de usuarios (un atacante no puede deducir qué correos están registrados).
    if (checkRes.rows && checkRes.rows.length > 0) {
      return { 
        message: '¡Gracias por suscribirte! Si tu correo es válido, recibirás nuestras alertas de empleo en tu bandeja de entrada. 🚀', 
        success: true 
      };
    }

    // 2. Si es nuevo, insertar limpiamente
    const jsonVal = JSON.stringify({ keywords: techKeywords.split(',').map((s: string) => s.trim()).filter(Boolean), operator });
    
    try {
      await client.query(
        `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, referred_by, created_at, tech_keywords_json)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [email, techKeywords, locationPref, frequency, referredBy, jsonVal]
      );
    } catch (insertErr: any) {
      // Fallback si la columna tech_keywords_json no existe aún en la tabla subscribers
      await client.query(
        `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, referred_by, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [email, techKeywords, locationPref, frequency, referredBy]
      );
    }

    revalidatePath(pathname);
    return { message: '¡Gracias por suscribirte! Si tu correo es válido, recibirás nuestras alertas de empleo en tu bandeja de entrada. 🚀', success: true };

  } catch (error: any) {
    console.error('Error guardando suscriptor:', error);
    return { message: 'Hubo un error al guardar tu email.', success: false };
  } finally {
    client.release();
  }
}

export async function submitPremiumLead(formData: FormData) {
  if (!await verifyCsrfOrigin()) {
    return { message: 'Petición rechazada por política de seguridad de origen (CSRF).', success: false };
  }
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const stack = formData.get('stack') as string;
  const experience = formData.get('experience') as string;
  const linkedin = (formData.get('linkedin') as string) || null;
  const privacyAccepted = formData.get('privacy_accepted') === 'on' || formData.get('privacy_accepted') === 'true';

  if (!privacyAccepted) {
    return { message: 'Debes aceptar la Política de Privacidad para unirte al programa.', success: false };
  }

  if (!name || !email || !stack || !experience) {
    return { message: 'Por favor, rellena todos los campos obligatorios.', success: false };
  }

  const cleanEmail = email.trim().toLowerCase();
  const clientIp = await getActionClientIp();
  if (!checkRateLimit(`ip_lead_${clientIp}`, 15000)) {
    return { message: 'Demasiadas solicitudes desde tu red. Espera unos segundos.', success: false };
  }
  if (!checkRateLimit(`lead_${cleanEmail}`, 60000)) {
    return { message: 'Estás enviando demasiadas solicitudes. Espera un minuto.', success: false };
  }

  const client = await pool.connect();
  try {
    // Vector 11: Comprobar si ya existe un lead reciente para este correo (últimas 24h)
    // Previene spam y sobreescrituras no deseadas sin autenticación
    const checkExisting = await client.query(
      "SELECT id FROM premium_leads WHERE email = $1 AND created_at > NOW() - INTERVAL 24 HOUR LIMIT 1",
      [cleanEmail]
    );

    if (checkExisting.rows && checkExisting.rows.length > 0) {
      return { message: '¡Gracias! Hemos recibido tu solicitud.', success: true };
    }

    await client.query(
      "INSERT INTO premium_leads (name, email, stack, experience, linkedin, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [name, cleanEmail, stack, experience, linkedin]
    );

    // Vector 7: Notificación solo al administrador privado (TELEGRAM_ADMIN_ID). Nunca al canal público.
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_ID;

    if (telegramToken && adminChatId) {
      // Vector 23: Sanitización estricta HTML para prevenir phishing y manipulación de enlaces en Telegram
      const text = `🚨 <b>NUEVO LEAD PREMIUM</b> 🚨\n\n` +
        `👤 <b>Nombre:</b> ${escapeTelegramHtml(name)}\n` +
        `📧 <b>Email:</b> ${escapeTelegramHtml(cleanEmail)}\n` +
        `💻 <b>Stack:</b> ${escapeTelegramHtml(stack)}\n` +
        `⏱ <b>Experiencia:</b> ${escapeTelegramHtml(experience)} años\n` +
        `🔗 <b>LinkedIn:</b> ${escapeTelegramHtml(linkedin || 'No proporcionado')}`;
      
      try {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: text,
            parse_mode: 'HTML'
          })
        });
      } catch (e) {
        console.error("Error enviando notificación de Telegram:", e);
      }
    } else if (!adminChatId) {
      console.warn('[SECURITY] TELEGRAM_ADMIN_ID no configurado; no se envía lead al canal público para evitar filtración de PII.');
    }

    return { message: '¡Gracias! Hemos recibido tu solicitud.', success: true };
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const errorCode = String(error?.code || '');
    const isDuplicate = 
      errorCode === '23505' || // Postgres
      errorCode === '1062' || // MySQL numeric
      errorCode === 'ER_DUP_ENTRY' || // MySQL string
      errorMsg.includes('1062') || // Proxy PDO error code
      errorMsg.includes('Duplicate entry'); // Proxy PDO message

    if (isDuplicate) {
      // Vector 11 & 16: Anti-Enumeración y protección contra sobreescritura no autorizada de perfiles
      return { message: '¡Gracias! Hemos recibido tu solicitud.', success: true };
    }
    console.error('Error guardando lead premium:', error);
    return { message: 'Hubo un error interno. Inténtalo más tarde.', success: false };
  } finally {
    client.release();
  }
}

export async function submitSponsoredJob(formData: FormData) {
  if (!await verifyCsrfOrigin()) {
    return { message: 'Petición rechazada por política de seguridad de origen (CSRF).', success: false };
  }

  // VULN-21: Trampa honeypot en Server Action contra spam bots en publicaciones gratuitas
  const honeypot = (formData.get('website_hp') || formData.get('company_website_hp') || '') as string;
  if (honeypot.trim().length > 0) {
    return { message: 'Tu oferta ha sido enviada para moderación.', success: true, redirectUrl: '/publicar-oferta?success=true&free=true' };
  }

  const company_name = formData.get('company_name') as string;
  const company_email = formData.get('company_email') as string;
  const company_phone = (formData.get('company_phone') as string) || null;
  const job_title = formData.get('job_title') as string;
  const job_location = formData.get('job_location') as string;
  const job_salary = (formData.get('job_salary') as string) || null;
  const job_description = formData.get('job_description') as string;
  const job_url = formData.get('job_url') as string;
  const plan = formData.get('plan') as string;
  const privacyAccepted = formData.get('privacy_accepted') === 'on' || formData.get('privacy_accepted') === 'true';

  if (!privacyAccepted) {
    return { message: 'Debes aceptar la Política de Privacidad para publicar una oferta.', success: false };
  }

  if (!company_name || !company_email || !job_title || !job_location || !job_description || !job_url) {
    return { message: 'Por favor, rellena todos los campos obligatorios.', success: false };
  }

  const cleanJobUrl = job_url.trim();
  if (!isSafePublicUrl(cleanJobUrl)) {
    return { message: 'La URL de la oferta no es válida o apunta a una dirección interna o no permitida.', success: false };
  }

  const clientIp = await getActionClientIp();
  if (!checkRateLimit(`ip_job_${clientIp}`, 15000)) {
    return { message: 'Demasiadas publicaciones desde tu conexión. Por favor, espera unos segundos.', success: false };
  }

  if (!checkRateLimit(`job_${company_email}`, 60000)) {
    return { message: 'Por favor, espera un minuto entre publicaciones.', success: false };
  }

  const client = await pool.connect();
  try {
    await client.query('START TRANSACTION');

    await client.query(
      `INSERT INTO sponsored_jobs (company_name, company_email, company_phone, job_title, job_location, job_salary, job_description, job_url, plan, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        company_name,
        company_email,
        company_phone,
        job_title,
        job_location,
        job_salary,
        job_description,
        cleanJobUrl,
        plan,
        'pendiente' // Vector 21: Toda solicitud pasa por estado 'pendiente' para moderación humana previa
      ]
    );

    // Vector 21: Moderación previa obligatoria. NUNCA auto-activar ofertas gratuitas sin revisión
    // (previene inyecciones masivas de ofertas de phishing, spam o estafas en portada y sitemaps)
    if (plan === 'basico') {
      const jobId = crypto.randomUUID();
      await client.query(
        `INSERT INTO jobs (id, title, company, location, salary, description_snippet, url_source, category, is_active, is_featured, plan, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, FALSE, 'basico', NOW())`,
        [
          jobId,
          job_title,
          company_name,
          job_location || 'Remoto',
          job_salary || 'Consultar',
          job_description || '',
          cleanJobUrl,
          'Otros'
        ]
      );
    }

    await client.query('COMMIT');

    // Vector 7: Notificar por Telegram EXCLUSIVAMENTE al chat de administración privada (TELEGRAM_ADMIN_ID).
    // NUNCA enviar solicitudes con datos de contacto o solicitudes de publicación al canal público para evitar filtración de PII.
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_ID;

    if (telegramToken && adminChatId) {
      let planLabel = '📋 Básico (Gratis - Pendiente de Moderación)';
      if (plan === 'destacado_basico') planLabel = '⭐ Destacado Básico (9€)';
      else if (plan === 'destacado_pro') planLabel = '⭐ Destacado Pro (19€)';
      else if (plan === 'destacado_enterprise') planLabel = '⭐ Enterprise (49€)';

      // Vector 23 & 7: Formateo con HTML escapado contra phishing y protección de PII de la empresa
      const safeCompanyEmail = escapeTelegramHtml(company_email);
      const safeCompanyPhone = escapeTelegramHtml(company_phone || 'No proporcionado');

      const text = `💰 <b>NUEVA SOLICITUD DE OFERTA</b> 💰\n\n` +
        `📋 <b>Plan:</b> ${escapeTelegramHtml(planLabel)}\n` +
        `🏢 <b>Empresa:</b> ${escapeTelegramHtml(company_name)}\n` +
        `📧 <b>Email:</b> ${safeCompanyEmail}\n` +
        `📞 <b>Teléfono:</b> ${safeCompanyPhone}\n\n` +
        `💼 <b>Puesto:</b> ${escapeTelegramHtml(job_title)}\n` +
        `📍 <b>Ubicación:</b> ${escapeTelegramHtml(job_location)}\n` +
        `💰 <b>Salario:</b> ${escapeTelegramHtml(job_salary || 'No indicado')}\n` +
        `🔗 <b>URL:</b> ${escapeTelegramHtml(cleanJobUrl)}`;

      try {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: text,
            parse_mode: 'HTML'
          })
        });
      } catch (e) {
        console.error("Error enviando notificación de Telegram:", e);
      }
    } else if (!adminChatId) {
      console.warn('[SECURITY] TELEGRAM_ADMIN_ID no configurado; no se envía solicitud de oferta al canal público para evitar filtración de PII corporativo.');
    }

    return { 
      message: plan === 'basico' 
        ? '¡Tu oferta de empleo ha sido recibida con éxito! Nuestro equipo la revisará y se activará en breve tras su validación.' 
        : '¡Solicitud enviada correctamente!', 
      success: true,
      redirectUrl: plan === 'basico' ? '/publicar-oferta?success=true&pending=true' : undefined
    };
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('Error guardando oferta patrocinada:', error);
    return { message: 'Hubo un error interno. Inténtalo más tarde.', success: false };
  } finally {
    client.release();
  }
}

export async function reactToJob(jobId: string, reactionType: 'like' | 'dislike') {
  if (!await verifyCsrfOrigin()) {
    return { success: false, error: 'Petición rechazada por política de seguridad de origen (CSRF).' };
  }

  if (!jobId || !['like', 'dislike'].includes(reactionType)) {
    return { success: false, error: 'Parámetros inválidos' };
  }

  // Validar formato del ID (UUID o numérico)
  const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId) || /^\d+$/.test(jobId);
  if (!isValidId) {
    return { success: false, error: 'Identificador de oferta inválido.' };
  }

  // Rate limiting anti-spam
  if (!checkRateLimit(`reaction_${jobId}_${reactionType}`, 2000)) {
    return { success: false, error: 'Demasiadas solicitudes. Espera un momento.' };
  }

  const client = await pool.connect();
  try {
    await client.query(
      "INSERT INTO job_reactions (job_id, reaction_type, created_at) VALUES ($1, $2, NOW())",
      [jobId, reactionType]
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error guardando reacción:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function getJobReactions(jobId: string) {
  if (!jobId) {
    return { likes: 0, dislikes: 0 };
  }
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT 
         SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) AS likes,
         SUM(CASE WHEN reaction_type = 'dislike' THEN 1 ELSE 0 END) AS dislikes
       FROM job_reactions WHERE job_id = $1`,
      [jobId]
    );
    const row = res.rows[0];
    return {
      likes: parseInt(row?.likes || '0', 10),
      dislikes: parseInt(row?.dislikes || '0', 10)
    };
  } catch (error) {
    console.error("Error obteniendo reacciones:", error);
    return { likes: 0, dislikes: 0 };
  } finally {
    client.release();
  }
}

export async function getReferralStats(email: string, token?: string) {
  if (!email || !email.includes('@')) {
    return { count: 0, success: false, authenticated: false };
  }
  const cleanEmail = email.trim().toLowerCase();

  // Vector 13: Rate limiting estricto para evitar ataques de fuerza bruta y sondeo
  if (!checkRateLimit(`ref_stats_${cleanEmail}`, 10000)) {
    return { count: 0, success: false, authenticated: false };
  }

  // Si no se proporciona token válido, no exponemos las métricas reales para prevenir enumeración
  const isAuthenticated = token ? verifySecureToken(cleanEmail, token) : false;
  if (!isAuthenticated) {
    return { count: 0, success: true, authenticated: false };
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT COUNT(*) as count FROM subscribers WHERE referred_by = $1",
      [cleanEmail]
    );
    const countValue = res.rows[0]?.count || 0;
    return { count: parseInt(String(countValue), 10), success: true, authenticated: true };
  } catch (error) {
    console.error("Error obteniendo estadísticas de referidos:", error);
    return { count: 0, success: false, authenticated: false };
  } finally {
    client.release();
  }
}

export async function submitCompanyReview(formData: FormData) {
  if (!await verifyCsrfOrigin()) {
    return { message: 'Petición rechazada por política de seguridad de origen (CSRF).', success: false };
  }

  const companySlug = (formData.get('company_slug') as string || '').trim().toLowerCase();
  const rating = parseInt(formData.get('rating') as string || '0', 10);
  const reviewText = (formData.get('review_text') as string || '').trim();
  const role = (formData.get('role') as string || 'Anónimo').trim().slice(0, 60);
  const guidelinesAccepted = formData.get('guidelines_accepted') === 'on' || formData.get('guidelines_accepted') === 'true';
  const privacyAccepted = formData.get('privacy_accepted') === 'on' || formData.get('privacy_accepted') === 'true';

  if (!companySlug || !/^[a-z0-9-]+$/.test(companySlug) || companySlug.length > 100) {
    return { message: 'Identificador de empresa inválido.', success: false };
  }

  if (rating < 1 || rating > 5 || !reviewText || reviewText.length < 5 || reviewText.length > 2000) {
    return { message: 'Por favor, proporciona una puntuación válida (1-5) y un comentario de entre 5 y 2000 caracteres.', success: false };
  }

  if (!guidelinesAccepted) {
    return { message: 'Debes confirmar que tu opinión respeta las normas de la comunidad y no contiene datos personales ni difamaciones.', success: false };
  }

  if (!privacyAccepted) {
    return { message: 'Debes aceptar la Política de Privacidad para publicar tu reseña.', success: false };
  }

  // Prevención de Doxing y revelación de datos personales de terceros (RGPD Art. 6 / AEPD)
  const phonePattern = /(?:\+34|0034)?[6789]\d{8}/;
  const dniPattern = /\b\d{8}[A-HJ-NP-TV-Z]\b/i;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  if (phonePattern.test(reviewText) || dniPattern.test(reviewText) || emailPattern.test(reviewText)) {
    return {
      message: 'Por motivos de protección de datos (RGPD) y normas de la comunidad, no está permitido incluir números de teléfono, DNI o correos electrónicos en las opiniones públicas.',
      success: false
    };
  }

  if (!checkRateLimit(`review_${companySlug}`, 30000)) {
    return { message: 'Demasiadas reseñas en poco tiempo. Espera un momento.', success: false };
  }

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO company_reviews (company_slug, rating, review_text, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [companySlug, rating, reviewText, role]
    );
    revalidatePath(`/empresas/${companySlug}`);
    return { message: '¡Gracias por dejar tu reseña! 🚀 Se ha publicado con éxito.', success: true };
  } catch (error) {
    console.error('Error guardando reseña de empresa:', error);
    return { message: 'Hubo un error al guardar tu reseña.', success: false };
  } finally {
    client.release();
  }
}

export async function reportCompanyReview(formData: FormData) {
  if (!await verifyCsrfOrigin()) {
    return { message: 'Petición rechazada por política de seguridad de origen (CSRF).', success: false };
  }

  const reviewId = parseInt(formData.get('review_id') as string || '0', 10);
  const companySlug = (formData.get('company_slug') as string || '').trim().toLowerCase();
  const reason = (formData.get('reason') as string || '').trim();
  const explanation = (formData.get('explanation') as string || '').trim();
  const reporterEmail = (formData.get('reporter_email') as string || '').trim().toLowerCase();
  const goodFaith = formData.get('good_faith') === 'on' || formData.get('good_faith') === 'true';

  if (!reviewId || !companySlug || !reason || !explanation || !reporterEmail) {
    return { message: 'Por favor, completa todos los campos requeridos para la notificación legal conforme al Art. 16 de la DSA.', success: false };
  }

  if (!goodFaith) {
    return { message: 'Debes declarar de buena fe la exactitud y veracidad de la información comunicada.', success: false };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(reporterEmail) || reporterEmail.length > 120) {
    return { message: 'Por favor, introduce un correo electrónico válido para recibir el acuse de recibo exigido por la DSA.', success: false };
  }

  if (explanation.length < 15 || explanation.length > 2000) {
    return { message: 'La explicación motivada debe contener entre 15 y 2000 caracteres describiendo por qué consideras que el contenido es ilícito.', success: false };
  }

  if (!checkRateLimit(`report_review_${reporterEmail}`, 30000)) {
    return { message: 'Por favor, espera un momento antes de enviar otra notificación.', success: false };
  }

  const client = await pool.connect();
  try {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS review_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          review_id INT NOT NULL,
          company_slug VARCHAR(100) NOT NULL,
          reason VARCHAR(100) NOT NULL,
          explanation TEXT NOT NULL,
          reporter_email VARCHAR(150) NOT NULL,
          status VARCHAR(30) DEFAULT 'pendiente_moderacion',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          KEY idx_review_id (review_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {}

    await client.query(
      `INSERT INTO review_reports (review_id, company_slug, reason, explanation, reporter_email, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pendiente_moderacion', NOW())`,
      [reviewId, companySlug, reason.slice(0, 100), explanation.slice(0, 2000), reporterEmail]
    );

    return {
      message: 'Notificación registrada con éxito. Conforme al Art. 16 de la DSA, nuestro equipo analizará la reseña con presteza y te remitirá la resolución al correo facilitado.',
      success: true,
    };
  } catch (error) {
    console.error('Error registrando reporte DSA de reseña:', error);
    return { message: 'Hubo un error al procesar tu notificación.', success: false };
  } finally {
    client.release();
  }
}

export async function getCompanyReviews(companySlug: string) {
  if (!companySlug) return [];
  const client = await pool.connect();
  try {
    let res;
    try {
      res = await client.query(
        `SELECT id, rating, review_text, role, created_at 
         FROM company_reviews 
         WHERE company_slug = $1 AND (is_hidden IS NULL OR is_hidden = FALSE)
         ORDER BY created_at DESC`,
        [companySlug]
      );
    } catch {
      res = await client.query(
        `SELECT id, rating, review_text, role, created_at 
         FROM company_reviews 
         WHERE company_slug = $1 
         ORDER BY created_at DESC`,
        [companySlug]
      );
    }
    return res.rows || [];
  } catch (error) {
    console.error("Error obteniendo reseñas de empresa:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateRecruiterLoginLink(email: string) {
  if (!await verifyCsrfOrigin()) {
    return { success: false, message: 'Petición rechazada por política de seguridad de origen (CSRF).' };
  }

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Por favor, proporciona un correo válido.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Vector 24: Rate limiting estricto anti-bombardeo de correos y agotamiento de cuota Resend (IP + Email)
  const clientIp = await getActionClientIp();
  if (!checkRateLimit(`ip_recr_magic_${clientIp}`, 15000)) {
    return { success: false, message: 'Demasiadas solicitudes de acceso desde tu red. Espera unos segundos antes de volver a intentarlo.' };
  }
  if (!checkRateLimit(`recr_magic_${cleanEmail}`, 60000)) {
    return { success: false, message: 'Demasiadas solicitudes de acceso. Espera un minuto antes de volver a intentarlo.' };
  }

  const client = await pool.connect();
  try {
    // Verificar si el reclutador tiene ofertas en sponsored_jobs
    const checkSponsored = await client.query(
      "SELECT COUNT(*) as count FROM sponsored_jobs WHERE company_email = $1",
      [cleanEmail]
    );

    const totalJobs = parseInt(checkSponsored.rows[0]?.count || '0', 10);
    
    if (totalJobs === 0) {
      return { 
        success: true, 
        message: 'Si este correo figura en nuestros registros con ofertas activas, hemos enviado un enlace de acceso seguro a tu bandeja de entrada. Revisa tu correo (y la carpeta de spam).' 
      };
    }

    // Generar token seguro sin estado
    let token: string;
    try {
      token = generateSecureToken(cleanEmail);
    } catch (e: any) {
      return { success: false, message: 'Configuración del servidor incompleta (CRON_SECRET).' };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
    const fullLoginUrl = `${baseUrl}/empresa-dashboard?email=${encodeURIComponent(cleanEmail)}&token=${token}`;
    await sendMagicLinkEmail(cleanEmail, fullLoginUrl, 'recruiter');

    return { 
      success: true, 
      message: 'Si este correo tiene ofertas activas, hemos enviado un enlace de acceso seguro a tu bandeja de entrada. Revisa tu correo (y la carpeta de spam).'
    };

  } catch (error) {
    console.error("Error generating recruiter login:", error);
    return { success: false, message: 'Ocurrió un error al procesar tu solicitud.' };
  } finally {
    client.release();
  }
}

export async function getRecruiterJobs(email: string, token: string) {
  if (!email || !token) {
    return { success: false, error: 'Parámetros inválidos.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  
  if (!verifySecureToken(cleanEmail, token)) {
    return { success: false, error: 'Acceso no autorizado. El token no es válido o ha expirado.' };
  }

  // Vector 18: One-Time Magic Link Anti-Replay
  // Invalidar de inmediato el enlace mágico consumido y emitir un nuevo token de sesión de corta duración
  await revokeSecureToken(token);
  const sessionToken = generateSecureToken(cleanEmail);

  const client = await pool.connect();
  try {
    // Obtener solicitudes patrocinadas (pendientes o aprobadas)
    const sponsoredRes = await client.query(
      `SELECT id, company_name, job_title, plan, status, created_at 
       FROM sponsored_jobs 
       WHERE company_email = $1 
       ORDER BY created_at DESC`,
      [cleanEmail]
    );

    // Vector 13 & 15: Obtener empleos asociados exclusivamente a las ofertas enviadas por este reclutador.
    // Mitigación IDOR: Se vincula por url_source con sponsored_jobs registrados bajo cleanEmail,
    // impidiendo que cualquier usuario reclame ofertas de terceros introduciendo un company_name arbitrario.
    let jobsList: any[] = [];
    const jobsQuery = `
      SELECT DISTINCT j.id, j.title, j.company, j.created_at, j.is_active, 0 AS impressions_count, 0 AS clicks_count 
      FROM jobs j
      INNER JOIN sponsored_jobs s ON j.url_source = s.job_url
      WHERE s.company_email = $1
      ORDER BY j.created_at DESC
    `;
    const jRes = await client.query(jobsQuery, [cleanEmail]);
    jobsList = jRes.rows || [];

    return { 
      success: true, 
      jobs: jobsList, 
      sponsoredJobs: sponsoredRes.rows || [],
      sessionToken
    };

  } catch (error) {
    console.error("Error fetching recruiter jobs:", error);
    return { success: false, error: 'Error cargando las ofertas de empleo.' };
  } finally {
    client.release();
  }
}

/**
 * Registra o recupera el código de afiliado para un reclutador.
 */
export async function registerRecruiterAffiliate(email: string, token?: string) {
  if (!await verifyCsrfOrigin()) {
    return { success: false, error: 'Petición rechazada por política de seguridad de origen (CSRF).' };
  }

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Por favor, proporciona un correo válido.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Rate Limiting anti-scraping
  if (!checkRateLimit(`affiliate_reg_${cleanEmail}`, 10000)) {
    return { success: false, error: 'Demasiadas solicitudes. Espera unos segundos antes de intentarlo de nuevo.' };
  }

  // Vector 14 & 15: Exigir verificación de identidad vía enlace mágico seguro
  // antes de crear o exponer códigos de afiliado y métricas de comisiones
  const isAuthenticated = token ? verifySecureToken(cleanEmail, token) : false;

  if (!isAuthenticated) {
    try {
      const magicToken = generateSecureToken(cleanEmail);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
      const fullLoginUrl = `${baseUrl}/afiliados-empresa?email=${encodeURIComponent(cleanEmail)}&token=${magicToken}`;
      await sendMagicLinkEmail(cleanEmail, fullLoginUrl, 'recruiter');
    } catch (mailErr) {
      console.error("Error enviando enlace seguro de afiliado:", mailErr);
    }

    return {
      success: false,
      error: 'Te hemos enviado un enlace de confirmación a tu correo. Haz clic en el enlace para verificar tu identidad y acceder a tu panel y código de afiliado.',
      requiresAuth: true,
    };
  }

  const client = await pool.connect();

  try {
    // 1. Comprobar si ya está registrado
    const checkRes = await client.query(
      "SELECT affiliate_code FROM recruiter_affiliates WHERE recruiter_email = $1 LIMIT 1",
      [cleanEmail]
    );

    if (checkRes.rows && checkRes.rows.length > 0) {
      const code = checkRes.rows[0].affiliate_code;
      // Obtener estadísticas de referidos para el usuario verificado
      const statsRes = await client.query(
        "SELECT referred_company_name, commission_paid, created_at FROM recruiter_affiliates WHERE recruiter_email = $1 AND referred_company_name IS NOT NULL",
        [cleanEmail]
      );
      const referrals = statsRes.rows || [];

      return {
        success: true,
        code,
        referrals,
        authenticated: true,
      };
    }

    // 2. Si no existe, crear un nuevo código criptográficamente seguro de afiliado
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const newCode = `RECR-${randomSuffix}`;

    await client.query(
      "INSERT INTO recruiter_affiliates (recruiter_email, affiliate_code) VALUES ($1, $2)",
      [cleanEmail, newCode]
    );

    return {
      success: true,
      code: newCode,
      referrals: [],
      authenticated: true,
    };

  } catch (error) {
    console.error("Error en registerRecruiterAffiliate:", error);
    return { success: false, error: 'Error procesando tu solicitud de afiliado.' };
  } finally {
    client.release();
  }
}

export async function validateCandidateToken(email: string, token: string) {
  if (!email || !token) return { success: false };
  const cleanEmail = email.trim().toLowerCase();
  
  if (!verifySecureToken(cleanEmail, token)) {
    return { success: false, message: 'Token inválido o caducado.' };
  }
  
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT email FROM subscribers WHERE email = $1 LIMIT 1", [cleanEmail]);
    if (res.rows && res.rows.length > 0) {
      return { success: true };
    }
    return { success: false, message: 'No estás registrado como suscriptor.' };
  } catch (error) {
    return { success: false };
  } finally {
    client.release();
  }
}

export async function getSubscriberPreferences(email: string, token: string) {
  const validation = await validateCandidateToken(email, token);
  if (!validation.success) return { success: false, error: 'No autorizado' };
  
  // Vector 18: Anti-replay. El enlace recibido en el correo se revoca de inmediato para que sea de un solo uso
  await revokeSecureToken(token);
  // Se genera un nuevo token de sesión de corta duración para las acciones del usuario
  const sessionToken = generateSecureToken(email);

  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT email, tech_keywords, location_pref, frequency, tech_keywords_json FROM subscribers WHERE email = $1 LIMIT 1",
      [email.trim().toLowerCase()]
    );
    return { success: true, subscriber: res.rows[0], sessionToken };
  } catch (error: any) {
    console.error('Error obteniendo preferencias de suscriptor:', error);
    return { success: false, error: 'Error al consultar las preferencias del suscriptor.' };
  } finally {
    client.release();
  }
}

export async function updateSubscriberPreferences(
  email: string, 
  token: string, 
  techKeywords: string, 
  locationPref: string, 
  frequency: string, 
  techKeywordsJson: string
) {
  if (!await verifyCsrfOrigin()) {
    return { success: false, error: 'Petición rechazada por política de seguridad de origen (CSRF).' };
  }

  const validation = await validateCandidateToken(email, token);
  if (!validation.success) return { success: false, error: 'No autorizado' };
  
  // Rotación de token en cada actualización para prevenir reutilización
  await revokeSecureToken(token);
  const nextSessionToken = generateSecureToken(email);
  
  // Validación y cotas estrictas de longitud de parámetros
  const cleanTech = (techKeywords || '').slice(0, 500);
  const cleanLocation = (locationPref || '').slice(0, 100);
  const cleanFreq = ['daily', 'weekly', 'biweekly', 'monthly'].includes(frequency) ? frequency : 'weekly';
  
  let validJson: string | null = null;
  if (techKeywordsJson) {
    try {
      const parsed = JSON.parse(techKeywordsJson);
      validJson = JSON.stringify(parsed);
    } catch {
      validJson = null;
    }
  }

  const client = await pool.connect();
  try {
    try {
      await client.query(
        `UPDATE subscribers 
         SET tech_keywords = $1, location_pref = $2, frequency = $3, tech_keywords_json = $4
         WHERE email = $5`,
        [cleanTech, cleanLocation, cleanFreq, validJson, email.trim().toLowerCase()]
      );
    } catch {
      await client.query(
        `UPDATE subscribers 
         SET tech_keywords = $1, location_pref = $2, frequency = $3
         WHERE email = $4`,
        [cleanTech, cleanLocation, cleanFreq, email.trim().toLowerCase()]
      );
    }
    return { success: true, sessionToken: nextSessionToken };
  } catch (error: any) {
    console.error('Error actualizando preferencias de suscriptor:', error);
    return { success: false, error: 'Error al actualizar las preferencias de suscriptor.' };
  } finally {
    client.release();
  }
}

export async function generateCandidateLoginLink(email: string) {
  if (!await verifyCsrfOrigin()) {
    return { success: false, message: 'Petición rechazada por política de seguridad de origen (CSRF).' };
  }
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Por favor, proporciona un correo válido.' };
  }
  const cleanEmail = email.trim().toLowerCase();

  // Vector 24: Rate limiting estricto anti-bombardeo y agotamiento de recursos Resend (IP + Email)
  const clientIp = await getActionClientIp();
  if (!checkRateLimit(`ip_cand_magic_${clientIp}`, 15000)) {
    return { success: false, message: 'Demasiadas solicitudes de acceso desde tu red. Espera unos segundos antes de volver a intentarlo.' };
  }
  if (!checkRateLimit(`cand_magic_${cleanEmail}`, 60000)) {
    return { success: false, message: 'Demasiadas solicitudes de acceso. Espera un minuto antes de volver a intentarlo.' };
  }

  const client = await pool.connect();
  try {
    const res = await client.query("SELECT email FROM subscribers WHERE email = $1 LIMIT 1", [cleanEmail]);
    if (!res.rows || res.rows.length === 0) {
      return { 
        success: true, 
        message: 'Si este correo está registrado en nuestro boletín, hemos enviado un enlace de acceso seguro a tu bandeja de entrada. Revisa tu correo (y la carpeta de spam).' 
      };
    }
    
    let token: string;
    try {
      token = generateSecureToken(cleanEmail);
    } catch (e: any) {
      return { success: false, message: 'Configuración del servidor incompleta.' };
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
    const fullLoginUrl = `${baseUrl}/mi-perfil?email=${encodeURIComponent(cleanEmail)}&token=${token}`;
    await sendMagicLinkEmail(cleanEmail, fullLoginUrl, 'candidate');

    return { 
      success: true, 
      message: 'Si este correo está registrado en nuestro boletín, hemos enviado un enlace de acceso seguro a tu bandeja de entrada. Revisa tu correo (y la carpeta de spam).' 
    };
  } catch (error) {
    return { success: false, message: 'Ocurrió un error al procesar tu solicitud.' };
  } finally {
    client.release();
  }
}


