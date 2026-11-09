"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Siempre obligatorias
    analytics: false,
    advertising: false,
  });

  const updateGtagConsent = (analytics: boolean, ads: boolean) => {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('consent', 'update', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: ads ? 'granted' : 'denied',
        ad_user_data: ads ? 'granted' : 'denied',
        ad_personalization: ads ? 'granted' : 'denied',
      });
    }
  };

  const notifyConsentUpdate = (prefs: CookiePreferences) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: prefs }));
    }
  };

  useEffect(() => {
    // 1. Comprobar consentimiento previo almacenado
    const savedConsent = localStorage.getItem('cookies_consent');
    const legacyAccepted = localStorage.getItem('cookies_accepted');

    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        const prefs: CookiePreferences = {
          essential: true,
          analytics: !!parsed.analytics,
          advertising: !!parsed.advertising,
        };
        setPreferences(prefs);
        updateGtagConsent(prefs.analytics, prefs.advertising);
        notifyConsentUpdate(prefs);
      } catch {
        // Formato string simple ('all' o 'essential')
        const isAll = savedConsent === 'all';
        const prefs: CookiePreferences = {
          essential: true,
          analytics: isAll,
          advertising: isAll,
        };
        setPreferences(prefs);
        updateGtagConsent(isAll, isAll);
        notifyConsentUpdate(prefs);
      }
    } else if (legacyAccepted === 'true') {
      // Compatibilidad con versiones anteriores
      const prefs: CookiePreferences = { essential: true, analytics: true, advertising: true };
      setPreferences(prefs);
      updateGtagConsent(true, true);
      notifyConsentUpdate(prefs);
    } else {
      // Sin decisión previa: mostrar banner con GA y AdSense denegados por defecto
      const defaultPrefs: CookiePreferences = { essential: true, analytics: false, advertising: false };
      updateGtagConsent(false, false);
      notifyConsentUpdate(defaultPrefs);
      setShow(true);
    }

    // 2. Escuchar evento para permitir reabrir el panel desde el footer o la política de cookies
    const handleOpenPreferences = () => {
      setShowConfig(true);
      setShow(true);
    };

    window.addEventListener('open_cookie_preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('open_cookie_preferences', handleOpenPreferences);
    };
  }, []);

  const handleAcceptAll = () => {
    const allConsents: CookiePreferences = { essential: true, analytics: true, advertising: true };
    localStorage.setItem('cookies_consent', JSON.stringify(allConsents));
    localStorage.setItem('cookies_accepted', 'true');
    setPreferences(allConsents);
    updateGtagConsent(true, true);
    notifyConsentUpdate(allConsents);
    setShow(false);
    setShowConfig(false);
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = { essential: true, analytics: false, advertising: false };
    localStorage.setItem('cookies_consent', JSON.stringify(onlyEssential));
    localStorage.setItem('cookies_accepted', 'false');
    setPreferences(onlyEssential);
    updateGtagConsent(false, false);
    notifyConsentUpdate(onlyEssential);
    setShow(false);
    setShowConfig(false);
  };

  const handleSaveCustom = () => {
    const customConsents: CookiePreferences = {
      essential: true,
      analytics: preferences.analytics,
      advertising: preferences.advertising,
    };
    localStorage.setItem('cookies_consent', JSON.stringify(customConsents));
    localStorage.setItem('cookies_accepted', preferences.analytics || preferences.advertising ? 'true' : 'false');
    updateGtagConsent(preferences.analytics, preferences.advertising);
    notifyConsentUpdate(customConsents);
    setShow(false);
    setShowConfig(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 left-0 right-0 bg-slate-950/98 backdrop-blur-md text-white p-4 sm:p-5 z-50 shadow-[0_-6px_20px_rgba(0,0,0,0.35)] border-t border-slate-700/80 animate-in fade-in duration-300"
    >
      <div className="max-w-6xl mx-auto">
        {!showConfig ? (
          // Vista 1: Banner Principal (AEPD: Aceptar y Rechazar al mismo nivel visual y jerarquía)
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-left max-w-3xl">
              <h3 id="cookie-banner-title" className="text-base font-bold text-white flex items-center gap-2 mb-1.5">
                <span>🍪</span> Tu privacidad es nuestra prioridad
              </h3>
              <p id="cookie-banner-desc" className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Utilizamos cookies técnicas necesarias para el funcionamiento del portal, así como cookies analíticas y publicitarias propias y de terceros para entender el uso de la web y mostrar ofertas y anuncios relevantes. Puedes aceptar todas las cookies, rechazar las opcionales o configurar tus preferencias. Más detalles en nuestra{' '}
                <Link href="/cookies" className="underline text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Política de Cookies
                </Link>{' '}
                y{' '}
                <Link href="/privacy" className="underline text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Política de Privacidad
                </Link>.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all text-center focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
              >
                Rechazar no esenciales
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600 rounded-lg text-xs sm:text-sm font-medium transition-all text-center focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-all text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        ) : (
          // Vista 2: Panel Granular de Configuración
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚙️</span> Panel de Configuración de Preferencias de Cookies
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestiona el uso de cookies según tus preferencias. Las cookies técnicas son imprescindibles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold px-2 py-1"
                aria-label="Cerrar panel de configuración"
              >
                ✕ Volver
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Categoría 1: Técnicas */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">Técnicas y Necesarias</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2 py-0.5 rounded">
                    Obligatorias
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Permiten la navegación segura, autenticación básica y guardar tus preferencias de consentimiento.
                </p>
              </div>

              {/* Categoría 2: Analíticas */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">Analítica y Rendimiento</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Miden el número de visitas, páginas populares y tiempos de carga para optimizar la experiencia (Google Analytics).
                </p>
              </div>

              {/* Categoría 3: Publicidad */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">Publicidad Contextual</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Permiten financiar el portal gratuito mostrando anuncios relevantes mediante Google AdSense.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Guardar mi selección
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
