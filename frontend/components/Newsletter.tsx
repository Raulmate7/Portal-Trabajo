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
      // Aquí conectaremos con tu Backend en el siguiente paso
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscribe`, {
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
      setStatus('error');
    }
  };

  return (
    <div className="bg-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl mx-4 my-10 max-w-4xl md:mx-auto">
      <h2 className="text-3xl font-bold mb-4">
        🚀 No te pierdas ninguna oferta
      </h2>
      <p className="text-indigo-100 mb-8 text-lg max-w-2xl mx-auto">
        Recibe las mejores ofertas de empleo IT y recursos para mejorar tu perfil directamente en tu correo. Sin spam, solo oportunidades.
      </p>

      {status === 'success' ? (
        <div className="bg-green-500 text-white p-4 rounded-xl font-bold animate-pulse">
          ¡Genial! Te has apuntado correctamente. 🎉
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-6 py-4 rounded-xl text-gray-900 w-full focus:outline-none focus:ring-4 focus:ring-indigo-300"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-white text-indigo-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Guardando...' : 'Suscribirme'}
          </button>
        </form>
      )}
      
      {status === 'error' && (
        <p className="text-red-300 mt-4 font-semibold">
          Hubo un error. Inténtalo de nuevo más tarde.
        </p>
      )}
    </div>
  );
}
