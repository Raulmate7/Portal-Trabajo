'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

export default function PushSubscribe() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta Service Workers y notificaciones push
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      setIsSupported(true);

      // Si el usuario ya había otorgado permiso previamente, asegurar carga de OneSignal
      if (Notification.permission === 'granted' && typeof (window as any).loadOneSignal === 'function') {
        (window as any).loadOneSignal();
      }

      // Comprobar estado de suscripción de OneSignal
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        setIsSubscribed(OneSignal.User.PushSubscription.optedIn);

        // Escuchar cambios de estado
        OneSignal.User.PushSubscription.addEventListener("change", (event: any) => {
          setIsSubscribed(event.current.optedIn);
        });
      });
    }
  }, []);

  const handleSubscribe = () => {
    if (loading) return;
    setLoading(true);
    
    // Carga bajo demanda del SDK de OneSignal al interactuar el usuario
    if (typeof (window as any).loadOneSignal === 'function') {
      (window as any).loadOneSignal();
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        if (isSubscribed) {
          await OneSignal.User.PushSubscription.optOut();
        } else {
          await OneSignal.Notifications.requestPermission();
          await OneSignal.User.PushSubscription.optIn();
        }
      } catch (err) {
        console.error("Error cambiando estado de notificaciones push:", err);
      } finally {
        setLoading(false);
      }
    });
  };

  if (!isSupported || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
    return null; // Ocultar si el navegador no lo soporta o no está configurado
  }

  return (
    <div className="bg-[#0D1117] text-white p-4 sm:p-5 rounded-xl border border-white/[0.1] relative overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-indigo-400 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-tight text-white leading-tight">
              Alertas en tiempo real
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Te avisamos al instante de nuevas ofertas de programación.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`ui-btn-press w-full text-center py-2 px-4 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            isSubscribed
              ? 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 border border-white/[0.12]'
              : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white'
          }`}
        >
          {loading ? 'Procesando...' : isSubscribed ? 'Desactivar Alertas' : 'Activar Notificaciones'}
        </button>

        <p className="text-[10px] text-slate-500 text-center leading-normal">
          Solo te avisaremos de nuevas ofertas tech. Token anónimo gestionado por OneSignal. Puedes darte de baja en cualquier momento con este botón o desde los ajustes de tu navegador. Consulta nuestra{' '}
          <Link href="/privacy" className="underline hover:text-slate-300">
            Política de Privacidad
          </Link>.
        </p>
      </div>
    </div>
  );
}
