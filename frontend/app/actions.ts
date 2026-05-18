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
