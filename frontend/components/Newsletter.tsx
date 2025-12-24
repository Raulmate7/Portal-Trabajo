'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl mx-4 my-10 max-w-4xl md:mx-auto">
      <h2 className="text-3xl font-bold mb-4">
        🚀 No te pierdas ninguna oferta
      </h2>
      <p className="text-indigo-100 mb-8 text-lg max-w-2xl mx-auto">
        Recibe las mejores ofertas de empleo IT directamente en tu correo. Sin spam.
      </p>

      {/* --- FORMULARIO EMAIL --- */}
      {status === 'success' ? (
        <div className="bg-green-500 text-white p-4 rounded-xl font-bold animate-pulse border-2 border-green-400 mb-8">
          ¡Genial! Te has apuntado correctamente. 🎉
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto mb-8">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-6 py-4 rounded-xl bg-indigo-900 border border-indigo-500 text-white placeholder-indigo-300 w-full focus:outline-none focus:ring-4 focus:ring-indigo-400 transition-all"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-white text-indigo-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {status === 'loading' ? '...' : 'Suscribirme'}
          </button>
        </form>
      )}
      
      {status === 'error' && (
        <p className="text-red-200 bg-red-900/50 p-2 rounded mb-6 font-semibold text-sm inline-block">
          Hubo un error. Inténtalo de nuevo.
        </p>
      )}

      {/* --- SECCIÓN TELEGRAM (NUEVA) --- */}
      <div className="border-t border-indigo-500/50 pt-8 mt-4">
        <p className="text-indigo-200 mb-4 text-sm font-medium uppercase tracking-wide">
          ¿Prefieres avisos instantáneos en el móvil?
        </p>
        <a 
          href="https://t.me/PortalDeTrabajo" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Unirme al Canal de Telegram
        </a>
      </div>

    </div>
  );
}
