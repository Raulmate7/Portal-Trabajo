'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function subscribeUser(formData: FormData) {
  const email = formData.get('email') as string;
  const pathname = formData.get('pathname') as string;

  if (!email) {
    return { message: 'Por favor, escribe un email.', success: false };
  }

  const client = await pool.connect();
  try {
    await client.query(
      "INSERT INTO subscribers (email, created_at) VALUES ($1, $2)",
      [email, new Date().toISOString()]
    );

    revalidatePath(pathname);
    return { message: '¡Gracias! Te has suscrito correctamente. 🚀', success: true };

  } catch (error: any) {
    // Si el error es por duplicado (código 23505 en Postgres), avisamos amablemente
    if (error?.code === '23505') {
      return { message: '¡Ya estabas suscrito! 😉', success: true };
    }
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

    // Enviar notificación por Telegram al Admin (si están las variables configuradas)
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_ID;

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
    if (error?.code === '23505') {
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente', $10)`,
      [company_name, company_email, company_phone, job_title, job_location, job_salary, job_description, job_url, plan, new Date().toISOString()]
    );

    // Notificar al canal de Telegram
    const telegramToken = process.env.TELEGRAM_TOKEN;
    const telegramChannel = process.env.TELEGRAM_CHANNEL;

    if (telegramToken && telegramChannel) {
      const planLabel = plan === 'destacado' ? '⭐ DESTACADO (39€)' : '📋 Básico (Gratis)';
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

    return { message: '¡Solicitud enviada correctamente!', success: true };
  } catch (error: any) {
    console.error('Error guardando oferta patrocinada:', error);
    return { message: 'Hubo un error interno. Inténtalo más tarde.', success: false };
  } finally {
    client.release();
  }
}

