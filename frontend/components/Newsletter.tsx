'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    // Guardamos el email en la tabla 'alerts'
    const { error } = await supabase
      .from('alerts')
      .insert([{ email }]);

    if (error) {
      // Si el error es código 23505, es que ya estaba registrado
      if (error.code === '23505') {
        setStatus('success');
      } else {
        console.error(error);
        setStatus('error');
      }
    } else {
      setStatus('success');
      setEmail('');
    }
  };

  return (
    <div className="bg-indigo-900 rounded-xl p-6 md:p-8 text-white text-center shadow-lg my-8 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <span className="absolute top-[-20px] left-[-20px] text-9xl">🔔</span>
        <span className="absolute bottom-[-20px] right-[-20px] text-9xl">✉️</span>
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        <h3 className="text-2xl font-bold mb-2">
          🚀 No te pierdas ninguna oferta
        </h3>
        <p className="text-indigo-200 mb-6">
          Recibe las mejores ofertas de programación en tu correo cada mañana. Sin spam.
        </p>

        {status === 'success' ? (
          <div className="bg-green-500/20 text-green-200 p-4 rounded-lg border border-green-500/50">
            ✅ ¡Genial! Te has apuntado correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50"
            >
              {status === 'loading' ? 'Guardando...' : 'Avísame'}
            </button>
          </form>
        )}
        
        {status === 'error' && (
          <p className="text-red-300 text-sm mt-2">
            Ups, ha habido un error. Inténtalo de nuevo.
          </p>
        )}
      </div>
    </div>
  );
}
