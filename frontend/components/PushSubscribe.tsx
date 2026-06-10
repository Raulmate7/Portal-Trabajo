'use client';

import { useEffect, useState } from 'react';

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
    <div className="bg-gradient-to-br from-violet-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-500/20 shadow-lg relative overflow-hidden">
      {/* Círculo de luz decorativo de fondo */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-indigo-500 rounded-full mix-blend-screen opacity-20 filter blur-xl animate-pulse"></div>

      <div className="relative z-10 flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner border border-white/5">
            🔔
          </div>
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-white leading-tight">
              Alertas en tiempo real
            </h4>
            <p className="text-[11px] text-indigo-200 mt-0.5">
              Te avisamos al instante de nuevas ofertas de programación.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full text-center py-2.5 px-4 text-xs font-black rounded-xl transition-all shadow-md active:scale-95 ${
            isSubscribed
              ? 'bg-indigo-650 hover:bg-indigo-700 text-indigo-100 border border-indigo-600/30'
              : 'bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold hover:shadow-lg'
          }`}
        >
          {loading ? 'Procesando...' : isSubscribed ? '🔔 Desactivar Alertas' : '🚀 Activar Notificaciones'}
        </button>
      </div>
    </div>
  );
}
