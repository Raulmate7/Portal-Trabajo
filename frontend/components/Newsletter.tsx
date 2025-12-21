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

    const { error } = await supabase
      .from('alerts')
      .insert([{ email }]);

    if (error) {
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
    <div className="bg-indigo-900 rounded-xl p-6 md:p-8 text-white text-center shadow-lg my-8 relative overflow-hidden border border-indigo-700">
      
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <span className="absolute top-[-20px] left-[-20px] text-9xl">🔔</span>
        <span className="absolute bottom-[-20px] right-[-20px] text-9xl">✉️</span>
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        <h3 className="text-2xl font-bold mb-2 text-white">
          🚀 No te pierdas ninguna oferta
        </h3>
        <p className="text-indigo-100 mb-6 font-medium">
          Recibe las mejores ofertas de programación en tu correo cada mañana.
        </p>

        {status === 'success' ? (
          <div className="bg-green-500/20 text-green-200 p-4 rounded-lg border border-green-500/50 font-bold">
            ✅ ¡Genial! Te has apuntado correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Escribe tu correo aquí..."
              // AQUI ESTA EL CAMBIO DE COLOR: Fondo oscuro (bg-indigo-950) y Texto Blanco (text-white)
              className="flex-1 px-4 py-3 rounded-lg bg-indigo-950 text-white placeholder-indigo-300 border border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50"
            >
              {status === 'loading' ? '...' : 'Avísame'}
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
