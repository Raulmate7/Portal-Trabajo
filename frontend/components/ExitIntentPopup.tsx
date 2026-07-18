"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Show popup only once per session
  useEffect(() => {
    if (sessionStorage.getItem('exitIntentShown')) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setVisible(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const validateEmail = (value: string) => {
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return re.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Introduce un email válido');
      return;
    }
    setError('');
    // TODO: Connect with newsletter API
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-md w-full p-6 relative animate-fade-in">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={() => setVisible(false)}
          aria-label="Cerrar popup"
        >×</button>
        <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
          ¡No te vayas sin suscribirte!
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Suscríbete a nuestro newsletter y recibe las mejores ofertas de empleo y trucos de entrevista directamente en tu inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition-colors"
          >
            Suscribirme
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <Link href="/politica-privacidad" className="underline hover:text-indigo-600">Política de privacidad</Link>
        </p>
      </div>
    </div>
  );
}
