"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
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

    if (!privacyAccepted) {
      setError('Debes aceptar la Política de Privacidad para suscribirte.');
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
      formData.set('privacy_accepted', 'true');

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
              Alertas Semanales de Empleo Tech
            </h2>
            <p className="text-sm text-gray-650 dark:text-slate-300 mb-6 leading-relaxed">
              Recibe un resumen periódico con las <strong>ofertas tecnológicas destacadas</strong> en España y salarios actualizados. Suscripción voluntaria y cancelable en 1 clic.
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

              <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  He leído y acepto la{' '}
                  <Link href="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline">
                    Política de Privacidad
                  </Link>{' '}
                  y consiento recibir alertas semanales de empleo IT.*
                </span>
              </label>

              {/* Primera capa informativa AEPD (RGPD Art. 13) */}
              <div className="p-2.5 bg-gray-50 dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800 rounded-lg text-[10px] text-gray-500 dark:text-slate-400 text-left space-y-0.5">
                <p><strong>Responsable:</strong> Portal Trabajo IT.</p>
                <p><strong>Finalidad:</strong> Envío de newsletter y alertas laborales semanales.</p>
                <p><strong>Legitimación:</strong> Tu consentimiento expreso (Art. 6.1.a RGPD).</p>
                <p><strong>Destinatarios:</strong> Plataforma de envío (Resend). No se cede a terceros.</p>
                <p><strong>Derechos:</strong> Baja en 1 clic en cada email o escribiendo a <a href="mailto:contacto@portalempleoit.com" className="text-indigo-600 dark:text-indigo-400 underline">contacto@portalempleoit.com</a> (+ info en <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 underline">Política de Privacidad</Link>).</p>
              </div>

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

              {/* Opción de rechazo simétrica y neutral (Directrices EDPB 03/2022 y Art. 25 DSA) */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 py-1.5 transition-colors cursor-pointer text-center"
              >
                No, gracias — continuar navegando
              </button>
            </form>

            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3 text-center">
              Sin spam. Baja inmediata en cada email. Consulta nuestra{' '}
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
