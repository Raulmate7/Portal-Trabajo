'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function subscribeUser(formData: FormData) {
  const email = formData.get('email') as string;
  const pathname = formData.get('pathname') as string;

  if (!email) {
    return { message: 'Por favor, escribe un email.', success: false };
  }

  try {
    // 1. Guardar en Supabase
    // Asumimos que la tabla se llama 'subscribers'
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email, created_at: new Date().toISOString() }]);

    if (error) {
      // Si el error es por duplicado (código 23505 en Postgres), avisamos amablemente
      if (error.code === '23505') {
        return { message: '¡Ya estabas suscrito! 😉', success: true }; // Lo marcamos como éxito para que no se preocupe
      }
      console.error('Error Supabase:', error);
      return { message: 'Hubo un error al guardar tu email.', success: false };
    }

    // 2. Refrescar la página (opcional, por si mostramos algo nuevo)
    revalidatePath(pathname);

    return { message: '¡Gracias! Te has suscrito correctamente. 🚀', success: true };
    
  } catch (e) {
    return { message: 'Error desconocido.', success: false };
  }
}
