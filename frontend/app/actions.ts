'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function subscribeUser(formData: FormData) {
  const email = formData.get('email') as string;
  const pathname = formData.get('pathname') as string;
  const techKeywords = (formData.get('tech_keywords') as string || '').trim();
  const locationPref = (formData.get('location_pref') as string || '').trim();
  const frequency = (formData.get('frequency') as string || 'weekly').trim();
  const referredBy = (formData.get('referred_by') as string || '').trim().toLowerCase() || null;
  const operator = (formData.get('operator') as string || 'OR').toUpperCase();

  if (!email) {
    return { message: 'Por favor, escribe un email.', success: false };
  }

  const client = await pool.connect();
  try {
    const jsonVal = JSON.stringify({ keywords: techKeywords.split(',').map((s: string) => s.trim()).filter(Boolean), operator });
    
    await client.query(
      `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, referred_by, created_at, tech_keywords_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON DUPLICATE KEY UPDATE
         tech_keywords = VALUES(tech_keywords),
         location_pref = VALUES(location_pref),
         frequency = VALUES(frequency),
         tech_keywords_json = VALUES(tech_keywords_json)`,
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

  const client = await pool.connect();
  try {
    await client.query(
      "INSERT INTO premium_leads (name, email, stack, experience, linkedin, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, email, stack, experience, linkedin, new Date().toISOString()]
    );

    // Enviar notificación por Telegram (al canal, ya que ADMIN_ID no está disponible en Vercel)
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_ID || process.env.TELEGRAM_CHANNEL;

    if (telegramToken && adminChatId) {
      const text = `🚨 *NUEVO LEAD PREMIUM* 🚨\n\n👤 *Nombre:* ${name}\n📧 *Email:* ${email}\n💻 *Stack:* ${stack}\n⏱ *Experiencia:* ${experience} años\n🔗 *LinkedIn:* ${linkedin || 'No proporcionado'}`;
      
      try {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: text,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error("Error enviando notificación de Telegram:", e);
      }
    }

    return { message: '¡Gracias!', success: true };
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
      return { message: 'Tu email ya estaba registrado en el programa.', success: false };
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

  const client = await pool.connect();
  try {
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
        job_url,
        plan,
        plan === 'basico' ? 'aprobado' : 'pendiente',
        new Date().toISOString()
      ]
    );

    // Si es plan básico, insertar directamente en la tabla 'jobs' como activo
    if (plan === 'basico') {
      const jobId = crypto.randomUUID();
      await client.query(
        `INSERT INTO jobs (id, title, company, location, salary, description_snippet, url_source, category, is_active, is_featured, company_email, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, FALSE, $9, NOW())`,
        [
          jobId,
          job_title,
          company_name,
          job_location || 'Remoto',
          job_salary || 'Consultar',
          job_description || '',
          job_url,
          'Otros',
          company_email
        ]
      );
    }

    // Notificar por Telegram (preferiblemente al admin privado para no exponer datos de empresa)
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const telegramChannel = process.env.TELEGRAM_ADMIN_ID || process.env.TELEGRAM_CHANNEL;

    if (telegramToken && telegramChannel) {
      let planLabel = '📋 Básico (Gratis - Autoactivado)';
      if (plan === 'destacado_basico') planLabel = '⭐ Destacado Básico (9€)';
      else if (plan === 'destacado_pro') planLabel = '⭐ Destacado Pro (19€)';
      else if (plan === 'destacado_enterprise') planLabel = '⭐ Enterprise (49€)';

      const text = `💰 *NUEVA SOLICITUD DE OFERTA PATROCINADA* 💰\n\n` +
        `📋 *Plan:* ${planLabel}\n` +
        `🏢 *Empresa:* ${company_name}\n` +
        `📧 *Email:* ${company_email}\n` +
        `📞 *Teléfono:* ${company_phone || 'No proporcionado'}\n\n` +
        `💼 *Puesto:* ${job_title}\n` +
        `📍 *Ubicación:* ${job_location}\n` +
        `💰 *Salario:* ${job_salary || 'No indicado'}\n` +
        `🔗 *URL:* ${job_url}`;

      try {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChannel,
            text: text,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error("Error enviando notificación de Telegram:", e);
      }
    }

    return { 
      message: plan === 'basico' 
        ? '¡Tu oferta de empleo gratuita ha sido publicada con éxito!' 
        : '¡Solicitud enviada correctamente!', 
      success: true,
      redirectUrl: plan === 'basico' ? '/publicar-oferta?success=true&free=true' : undefined
    };
  } catch (error: any) {
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
    // Verificar si el reclutador tiene ofertas (en jobs o en sponsored_jobs)
    const checkJobs = await client.query(
      "SELECT COUNT(*) as count FROM jobs WHERE company_email = $1",
      [cleanEmail]
    );
    const checkSponsored = await client.query(
      "SELECT COUNT(*) as count FROM sponsored_jobs WHERE company_email = $1",
      [cleanEmail]
    );

    const totalJobs = parseInt(checkJobs.rows[0]?.count || '0', 10) + parseInt(checkSponsored.rows[0]?.count || '0', 10);
    
    if (totalJobs === 0) {
      return { 
        success: false, 
        message: 'No encontramos ofertas de empleo asociadas a este correo. Asegúrate de usar el mismo email que usaste para publicar.' 
      };
    }

    // Generar token seguro sin estado
    const secret = process.env.CRON_SECRET || 'portal-trabajo-cron-secret-2026';
    const token = crypto.createHash('md5').update(cleanEmail + secret).digest('hex');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portalempleoit.com';
    const loginLink = `/empresa-dashboard?email=${encodeURIComponent(cleanEmail)}&token=${token}`;

    console.log(`🔑 Recruiter login link generated: ${cleanEmail} -> ${loginLink}`);

    return { 
      success: true, 
      message: '¡Enlace de acceso generado con éxito!', 
      loginLink 
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
  const secret = process.env.CRON_SECRET || 'portal-trabajo-cron-secret-2026';
  const expectedToken = crypto.createHash('md5').update(cleanEmail + secret).digest('hex');

  if (token !== expectedToken) {
    return { success: false, error: 'Acceso no autorizado. El token de inicio de sesión no es válido o ha expirado.' };
  }

  const client = await pool.connect();
  try {
    // Obtener empleos activos
    const jobsRes = await client.query(
      `SELECT id, title, company, created_at, is_active, impressions_count, clicks_count 
       FROM jobs 
       WHERE company_email = $1 
       ORDER BY created_at DESC`,
      [cleanEmail]
    );

    // Obtener solicitudes patrocinadas (pendientes o aprobadas)
    const sponsoredRes = await client.query(
      `SELECT id, company_name, job_title, plan, status, created_at 
       FROM sponsored_jobs 
       WHERE company_email = $1 
       ORDER BY created_at DESC`,
      [cleanEmail]
    );

    return { 
      success: true, 
      jobs: jobsRes.rows || [], 
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
export async function registerRecruiterAffiliate(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Por favor, proporciona un correo válido.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const client = await pool.connect();

  try {
    // 1. Comprobar si ya está registrado
    const checkRes = await client.query(
      "SELECT affiliate_code FROM recruiter_affiliates WHERE recruiter_email = $1 LIMIT 1",
      [cleanEmail]
    );

    if (checkRes.rows && checkRes.rows.length > 0) {
      const code = checkRes.rows[0].affiliate_code;
      // Obtener estadísticas de referidos
      const statsRes = await client.query(
        "SELECT referred_company_name, commission_paid, created_at FROM recruiter_affiliates WHERE recruiter_email = $1 AND referred_company_name IS NOT NULL",
        [cleanEmail]
      );

      return {
        success: true,
        code,
        referrals: statsRes.rows || [],
      };
    }

    // 2. Si no existe, crear un nuevo código aleatorio de afiliado
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `RECR-${randomSuffix}`;

    await client.query(
      "INSERT INTO recruiter_affiliates (recruiter_email, affiliate_code) VALUES ($1, $2)",
      [cleanEmail, newCode]
    );

    return {
      success: true,
      code: newCode,
      referrals: [],
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
  const secret = process.env.CRON_SECRET || 'portal-trabajo-cron-secret-2026';
  const expectedToken = crypto.createHash('md5').update(cleanEmail + secret).digest('hex');
  if (token !== expectedToken) return { success: false };
  
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
      return { success: false, message: 'Este correo electrónico no está registrado en el boletín. ¡Regístrate gratis primero!' };
    }
    
    const secret = process.env.CRON_SECRET || 'portal-trabajo-cron-secret-2026';
    const token = crypto.createHash('md5').update(cleanEmail + secret).digest('hex');
    const loginLink = `/mi-perfil?email=${encodeURIComponent(cleanEmail)}&token=${token}`;
    return { success: true, message: '¡Enlace de acceso generado con éxito!', loginLink };
  } catch (error) {
    return { success: false, message: 'Ocurrió un error al procesar tu solicitud.' };
  } finally {
    client.release();
  }
}


