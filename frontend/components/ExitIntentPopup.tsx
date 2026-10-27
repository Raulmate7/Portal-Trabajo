"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Garantizar que solo se muestre una única vez por persona de por vida
  useEffect(() => {
    // 1. Si ya se mostró antes o la persona ya está suscrita, no hacer nada jamás
    try {
      const alreadyShown = localStorage.getItem('exit_popup_already_shown');
      const alreadySubscribed = localStorage.getItem('newsletter_subscribed');
      const sessionShown = sessionStorage.getItem('exit_popup_session_shown');

      if (alreadyShown === 'true' || alreadySubscribed === 'true' || sessionShown === 'true') {
        return;
      }
    } catch {
      return;
    }

    // 2. Tiempo mínimo de permanencia en la web (12 segundos) antes de activar la detección.
    // Esto evita que salte nada más entrar si el usuario mueve el ratón hacia las pestañas o buscador.
    let isEligible = false;
    const dwellTimer = setTimeout(() => {
      isEligible = true;
    }, 12000);

    const handleMouseLeave = (e: MouseEvent) => {
      if (!isEligible) return;

      // El usuario mueve el cursor hacia arriba fuera de la ventana del navegador
      if (e.clientY <= 0) {
        try {
          // Doble verificación defensiva
          if (
            localStorage.getItem('exit_popup_already_shown') === 'true' ||
            localStorage.getItem('newsletter_subscribed') === 'true'
          ) {
            return;
          }

          // Marcar de inmediato en localStorage para que NUNCA vuelva a salir a esta persona
          localStorage.setItem('exit_popup_already_shown', 'true');
          sessionStorage.setItem('exit_popup_session_shown', 'true');
        } catch {}

        setVisible(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(dwellTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    try {
      localStorage.setItem('exit_popup_already_shown', 'true');
    } catch {}
  };

  const validateEmail = (value: string) => {
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return re.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Por favor, introduce un correo electrónico válido');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('pathname', typeof window !== 'undefined' ? window.location.pathname : '/');
      formData.set('tech_keywords', 'frontend, backend, react, node, python');
      formData.set('frequency', 'weekly');

      const result = await subscribeUser(formData);

      if (result.success) {
        setSuccess(true);
        try {
          localStorage.setItem('newsletter_subscribed', 'true');
          localStorage.setItem('exit_popup_already_shown', 'true');
        } catch {}
        setTimeout(() => {
          setVisible(false);
        }, 1800);
      } else {
        setError(result.message || 'Hubo un error al suscribirte.');
      }
    } catch {
      setError('No pudimos conectar con el servidor. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[100] backdrop-blur-sm bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Botón Cerrar */}
        <button
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
          onClick={handleClose}
          aria-label="Cerrar ventana emergente"
        >
          ×
        </button>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <span className="text-5xl block animate-bounce">🎉</span>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              ¡Suscripción completada!
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Recibirás las mejores ofertas y tendencias IT directamente en tu bandeja de entrada.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚀</span>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                Alerta de Empleo IT
              </span>
            </div>

            <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">
              ¡No te vayas sin suscribirte!
            </h2>
            <p className="text-sm text-gray-650 dark:text-slate-300 mb-6 leading-relaxed">
              Recibe un resumen semanal con las <strong>ofertas tecnológicas mejor pagadas</strong> en España y consejos de entrevistas antes de que se cierren.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Suscribiendo...' : 'Suscribirme gratis ✉️'}
              </button>
            </form>

            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-4 text-center">
              Sin spam. Puedes darte de baja en 1 clic. Lee nuestra{' '}
              <Link href="/privacy" className="underline hover:text-indigo-600 dark:hover:text-indigo-400">
                Política de Privacidad
              </Link>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
