'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// --- Rate Limiter y Utilidades Seguras ---
const rateLimitMap = new Map<string, number>();

function checkRateLimit(key: string, limitMs: number = 60000): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(key);
  if (lastRequest && now - lastRequest < limitMs) {
    return false;
  }
  if (rateLimitMap.size > 10000) rateLimitMap.clear();
  rateLimitMap.set(key, now);
  return true;
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
// ------------------------------------------


export async function subscribeUser(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const pathname = formData.get('pathname') as string;
  const techKeywords = (formData.get('tech_keywords') as string || '').trim();
  const locationPref = (formData.get('location_pref') as string || '').trim();
  const frequency = (formData.get('frequency') as string || 'weekly').trim();
  const referredBy = (formData.get('referred_by') as string || '').trim().toLowerCase() || null;
  const operator = (formData.get('operator') as string || 'OR').toUpperCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 255) {
    return { message: 'Por favor, escribe un email válido.', success: false };
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

    if (checkRes.rows && checkRes.rows.length > 0) {
      return { 
        message: '¡Ya estás suscrito al boletín! Para modificar tus alertas o darte de baja, utiliza el enlace seguro en cualquiera de nuestros correos.', 
        success: true 
      };
    }

    // 2. Si es nuevo, insertar limpiamente
    const jsonVal = JSON.stringify({ keywords: techKeywords.split(',').map((s: string) => s.trim()).filter(Boolean), operator });
    
    await client.query(
      `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, referred_by, created_at, tech_keywords_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [email, techKeywords, locationPref, frequency, referredBy, new Date().toISOString(), jsonVal]
    );

    revalidatePath(pathname);
    return { message: '¡Gracias! Te has suscrito correctamente. 🚀', success: true };

  } catch (error: any) {
    console.error('Error guardando suscriptor:', error);
    return { message: 'Hubo un error al guardar tu email.', success: false };
  } finally {
    client.release();
  }
}

export async function submitPremiumLead(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const stack = formData.get('stack') as string;
  const experience = formData.get('experience') as string;
  const linkedin = (formData.get('linkedin') as string) || null;

  if (!name || !email || !stack || !experience) {
    return { message: 'Por favor, rellena todos los campos obligatorios.', success: false };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!checkRateLimit(`lead_${cleanEmail}`, 60000)) {
    return { message: 'Estás enviando demasiadas solicitudes. Espera un minuto.', success: false };
  }

  const client = await pool.connect();
  try {
    await client.query(
      "INSERT INTO premium_leads (name, email, stack, experience, linkedin, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, cleanEmail, stack, experience, linkedin, new Date().toISOString()]
    );

    // Enviar notificación por Telegram (al canal, ya que ADMIN_ID no está disponible en Vercel)
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_ID || process.env.TELEGRAM_CHANNEL;

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
      // Vector 16: Anti-Enumeración de Candidatos (previene filtrar si un email ya está en búsqueda activa)
      try {
        await client.query(
          "UPDATE premium_leads SET name = $1, stack = $2, experience = $3, linkedin = COALESCE($4, linkedin) WHERE email = $5",
          [name, stack, experience, linkedin, cleanEmail]
        );
      } catch {
        // Fallback defensivo si ocurre algún fallo de conexión en el update
      }
      return { message: '¡Gracias! Hemos recibido tu solicitud.', success: true };
    }
    console.error('Error guardando lead premium:', error);
    return { message: 'Hubo un error interno. Inténtalo más tarde.', success: false };
  } finally {
    client.release();
  }
}

export async function submitSponsoredJob(formData: FormData) {
  const company_name = formData.get('company_name') as string;
  const company_email = formData.get('company_email') as string;
  const company_phone = (formData.get('company_phone') as string) || null;
  const job_title = formData.get('job_title') as string;
  const job_location = formData.get('job_location') as string;
  const job_salary = (formData.get('job_salary') as string) || null;
  const job_description = formData.get('job_description') as string;
  const job_url = formData.get('job_url') as string;
  const plan = formData.get('plan') as string;

  if (!company_name || !company_email || !job_title || !job_location || !job_description || !job_url) {
    return { message: 'Por favor, rellena todos los campos obligatorios.', success: false };
  }

  const cleanJobUrl = job_url.trim();
  try {
    const parsedUrl = new URL(cleanJobUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { message: 'La URL de la oferta debe comenzar por http:// o https://', success: false };
    }
  } catch {
    return { message: 'La URL de la oferta no tiene un formato válido.', success: false };
  }

  if (!checkRateLimit(`job_${company_email}`, 60000)) {
    return { message: 'Por favor, espera un minuto entre publicaciones.', success: false };
  }

  const client = await pool.connect();
  try {
    await client.query('START TRANSACTION');

    await client.query(
      `INSERT INTO sponsored_jobs (company_name, company_email, company_phone, job_title, job_location, job_salary, job_description, job_url, plan, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
        'pendiente', // Vector 21: Toda solicitud pasa por estado 'pendiente' para moderación humana previa
        new Date().toISOString()
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

    // Notificar por Telegram (preferiblemente al admin privado para no exponer datos de empresa)
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const telegramChannel = process.env.TELEGRAM_ADMIN_ID || process.env.TELEGRAM_CHANNEL;

    if (telegramToken && telegramChannel) {
      let planLabel = '📋 Básico (Gratis - Pendiente de Moderación)';
      if (plan === 'destacado_basico') planLabel = '⭐ Destacado Básico (9€)';
      else if (plan === 'destacado_pro') planLabel = '⭐ Destacado Pro (19€)';
      else if (plan === 'destacado_enterprise') planLabel = '⭐ Enterprise (49€)';

      // Vector 23: Formateo con HTML escapado contra phishing y enlaces inyectados
      const text = `💰 <b>NUEVA SOLICITUD DE OFERTA</b> 💰\n\n` +
        `📋 <b>Plan:</b> ${escapeTelegramHtml(planLabel)}\n` +
        `🏢 <b>Empresa:</b> ${escapeTelegramHtml(company_name)}\n` +
        `📧 <b>Email:</b> ${escapeTelegramHtml(company_email)}\n` +
        `📞 <b>Teléfono:</b> ${escapeTelegramHtml(company_phone || 'No proporcionado')}\n\n` +
        `💼 <b>Puesto:</b> ${escapeTelegramHtml(job_title)}\n` +
        `📍 <b>Ubicación:</b> ${escapeTelegramHtml(job_location)}\n` +
        `💰 <b>Salario:</b> ${escapeTelegramHtml(job_salary || 'No indicado')}\n` +
        `🔗 <b>URL:</b> ${escapeTelegramHtml(cleanJobUrl)}`;

      try {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChannel,
            text: text,
            parse_mode: 'HTML'
          })
        });
      } catch (e) {
        console.error("Error enviando notificación de Telegram:", e);
      }
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
  if (!jobId || !reactionType) {
    return { success: false, error: 'Parámetros inválidos' };
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

export async function getReferralStats(email: string) {
  if (!email) {
    return { count: 0, success: false };
  }
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT COUNT(*) as count FROM subscribers WHERE referred_by = $1",
      [email.trim().toLowerCase()]
    );
    const countValue = res.rows[0]?.count || 0;
    return { count: parseInt(String(countValue), 10), success: true };
  } catch (error) {
    console.error("Error obteniendo estadísticas de referidos:", error);
    return { count: 0, success: false };
  } finally {
    client.release();
  }
}

export async function submitCompanyReview(formData: FormData) {
  const companySlug = formData.get('company_slug') as string;
  const rating = parseInt(formData.get('rating') as string || '0', 10);
  const reviewText = formData.get('review_text') as string;
  const role = (formData.get('role') as string || 'Anónimo').trim();

  if (!companySlug || rating < 1 || rating > 5 || !reviewText) {
    return { message: 'Por favor, rellena la puntuación y el comentario.', success: false };
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

export async function getCompanyReviews(companySlug: string) {
  if (!companySlug) return [];
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT rating, review_text, role, created_at 
       FROM company_reviews 
       WHERE company_slug = $1 
       ORDER BY created_at DESC`,
      [companySlug]
    );
    return res.rows || [];
  } catch (error) {
    console.error("Error obteniendo reseñas de empresa:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateRecruiterLoginLink(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Por favor, proporciona un correo válido.' };
  }

  const cleanEmail = email.trim().toLowerCase();
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

    // Obtener empleos asociados a las empresas del reclutador
    let jobsList: any[] = [];
    if (sponsoredRes.rows && sponsoredRes.rows.length > 0) {
      const companyNames = [...new Set(sponsoredRes.rows.map((r: any) => r.company_name).filter(Boolean))];
      if (companyNames.length > 0) {
        const placeholders = companyNames.map((_, i) => `$${i + 1}`).join(', ');
        const jobsQuery = `
          SELECT id, title, company, created_at, is_active, 0 AS impressions_count, 0 AS clicks_count 
          FROM jobs 
          WHERE company IN (${placeholders})
          ORDER BY created_at DESC
        `;
        const jRes = await client.query(jobsQuery, companyNames);
        jobsList = jRes.rows || [];
      }
    }

    return { 
      success: true, 
      jobs: jobsList, 
      sponsoredJobs: sponsoredRes.rows || [] 
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
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Por favor, proporciona un correo válido.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Rate Limiting anti-scraping
  if (!checkRateLimit(`affiliate_reg_${cleanEmail}`, 10000)) {
    return { success: false, error: 'Demasiadas solicitudes. Espera unos segundos antes de intentarlo de nuevo.' };
  }

  const client = await pool.connect();

  try {
    // 1. Comprobar si ya está registrado
    const checkRes = await client.query(
      "SELECT affiliate_code FROM recruiter_affiliates WHERE recruiter_email = $1 LIMIT 1",
      [cleanEmail]
    );

    if (checkRes.rows && checkRes.rows.length > 0) {
      const isAuthenticated = token ? verifySecureToken(cleanEmail, token) : false;

      // Vector 15: Si no está autenticado con token verificado, NO exponer el código confidencial ni estadísticas
      if (!isAuthenticated) {
        try {
          const magicToken = generateSecureToken(cleanEmail);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
          const fullLoginUrl = `${baseUrl}/empresa-dashboard?email=${encodeURIComponent(cleanEmail)}&token=${magicToken}`;
          await sendMagicLinkEmail(cleanEmail, fullLoginUrl, 'recruiter');
        } catch (mailErr) {
          console.error("Error enviando enlace seguro de afiliado:", mailErr);
        }

        return {
          success: false,
          error: 'Este correo ya tiene un código de afiliado registrado. Por seguridad, te hemos enviado un enlace de acceso seguro a tu correo para acceder a tu panel y código.',
          requiresAuth: true,
        };
      }

      const code = checkRes.rows[0].affiliate_code;
      // Obtener estadísticas de referidos solo si el usuario está autenticado
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

    // 2. Si no existe, crear un nuevo código criptográficamente seguro de afiliado (Vector 15)
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
  
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT email, tech_keywords, location_pref, frequency, tech_keywords_json FROM subscribers WHERE email = $1 LIMIT 1",
      [email.trim().toLowerCase()]
    );
    return { success: true, subscriber: res.rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
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
  const validation = await validateCandidateToken(email, token);
  if (!validation.success) return { success: false, error: 'No autorizado' };
  
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE subscribers 
       SET tech_keywords = $1, location_pref = $2, frequency = $3, tech_keywords_json = $4
       WHERE email = $5`,
      [techKeywords, locationPref, frequency, techKeywordsJson, email.trim().toLowerCase()]
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function generateCandidateLoginLink(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Por favor, proporciona un correo válido.' };
  }
  const cleanEmail = email.trim().toLowerCase();
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


