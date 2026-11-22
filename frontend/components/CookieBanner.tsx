'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  updatedAt?: number;
}

const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses (<= 24 meses Guía AEPD, LEG-027)

const BANNER_COPY = {
  es: {
    title: 'Preferencias de privacidad y cookies',
    desc: 'Utilizamos cookies técnicas necesarias para el funcionamiento del portal, así como cookies analíticas y publicitarias propias y de terceros para medir el uso y mostrar ofertas relevantes. Puedes aceptar todas, rechazar las opcionales o configurar tus preferencias.',
    moreDetails: 'Más detalles en nuestra',
    cookiesLabel: 'Política de Cookies',
    and: 'y',
    privacyLabel: 'Política de Privacidad',
    reject: 'Rechazar no esenciales',
    configure: 'Configurar',
    accept: 'Aceptar todas',
  },
  en: {
    title: 'Privacy and cookie preferences',
    desc: 'We use strictly necessary technical cookies for the site to operate, as well as optional analytics and advertising cookies to measure usage and show relevant listings. You can accept all cookies, reject non-essential ones, or customize your preferences.',
    moreDetails: 'More details in our',
    cookiesLabel: 'Cookie Policy',
    and: 'and',
    privacyLabel: 'Privacy Policy',
    reject: 'Reject non-essential',
    configure: 'Settings',
    accept: 'Accept all',
  },
  ca: {
    title: 'Preferències de privacitat i cookies',
    desc: 'Utilitzem cookies tècniques necessàries per al funcionament del portal, així com cookies analítiques i publicitàries opcionals per entendre l’ús del web i mostrar ofertes rellevants. Pots acceptar-les totes, rebutjar les opcionals o configurar les teves preferències.',
    moreDetails: 'Més detalls a la nostra',
    cookiesLabel: 'Política de Cookies',
    and: 'i',
    privacyLabel: 'Política de Privacitat',
    reject: 'Rebutjar no essencials',
    configure: 'Configurar',
    accept: 'Acceptar totes',
  },
  eu: {
    title: 'Pribatutasun eta cookie hobespenak',
    desc: 'Atariak funtzionatzeko ezinbesteko cookie teknikoak erabiltzen ditugu, baita aukerako cookie analitikoak eta publizitatekoak ere, webgunearen erabilera ulertzeko eta eskaintza egokiak erakusteko. Guztiak onartu, aukerakoak baztertu edo zure hobespenak konfigura ditzakezu.',
    moreDetails: 'Xehetasun gehiago gure',
    cookiesLabel: 'Cookie Politikan',
    and: 'eta',
    privacyLabel: 'Pribatutasun Politikan',
    reject: 'Ez-funtsezkoak baztertu',
    configure: 'Konfiguratu',
    accept: 'Guztiak onartu',
  },
} as const;

export default function CookieBanner() {
  const pathname = usePathname() || '/';
  const locale = pathname.startsWith('/en/') || pathname === '/en'
    ? 'en'
    : pathname.startsWith('/ca/') || pathname === '/ca'
    ? 'ca'
    : pathname.startsWith('/eu/') || pathname === '/eu'
    ? 'eu'
    : 'es';
  const copy = BANNER_COPY[locale];

  const [show, setShow] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
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

  const purgeNonEssentialStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('affiliate_cta_variant');
      localStorage.removeItem('newsletter_cta_variant');
      localStorage.removeItem('user_streak');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.toLowerCase().includes('onesignal') || key.startsWith('os_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      if ('indexedDB' in window && typeof window.indexedDB.deleteDatabase === 'function') {
        window.indexedDB.deleteDatabase('ONE_SIGNAL_SDK_DB');
      }
      const w = window as any;
      if (Array.isArray(w.OneSignalDeferred)) {
        w.OneSignalDeferred.push((OneSignal: any) => {
          try { OneSignal?.User?.PushSubscription?.optOut?.(); } catch {}
        });
      }
    } catch {}

    try {
      const cookiesToPurge = ['_ga', '_gid', '_gat', '__gads', '__gpi', '_gcl_au', '_fbp', '__os_', 'onesignal'];
      const currentCookies = document.cookie.split(';');
      const hostname = window.location.hostname;
      const domainParts = hostname.split('.');
      const rootDomain = domainParts.length > 1 ? '.' + domainParts.slice(-2).join('.') : hostname;

      for (const cookieStr of currentCookies) {
        const name = cookieStr.split('=')[0].trim();
        const lower = name.toLowerCase();
        const shouldPurge = cookiesToPurge.some((prefix) => lower === prefix || lower.startsWith(prefix));
        if (shouldPurge) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain};`;
        }
      }
    } catch {}
  };

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookies_consent');
    localStorage.removeItem('cookies_accepted');

    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        const updatedAt = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0;
        if (updatedAt > 0 && Date.now() - updatedAt > CONSENT_MAX_AGE_MS) {
          localStorage.removeItem('cookies_consent');
          updateGtagConsent(false, false);
          setShow(true);
        } else {
          const prefs: CookiePreferences = {
            essential: true,
            analytics: parsed.analytics === true,
            advertising: parsed.advertising === true,
            updatedAt: updatedAt || Date.now(),
          };
          setPreferences(prefs);
          updateGtagConsent(prefs.analytics, prefs.advertising);
          notifyConsentUpdate(prefs);
        }
      } catch {
        localStorage.removeItem('cookies_consent');
        const failClosed: CookiePreferences = { essential: true, analytics: false, advertising: false };
        setPreferences(failClosed);
        updateGtagConsent(false, false);
        notifyConsentUpdate(failClosed);
        setShow(true);
      }
    } else {
      const defaultPrefs: CookiePreferences = { essential: true, analytics: false, advertising: false };
      updateGtagConsent(false, false);
      notifyConsentUpdate(defaultPrefs);
      setShow(true);
    }

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
    const allConsents: CookiePreferences = { essential: true, analytics: true, advertising: true, updatedAt: Date.now() };
    localStorage.setItem('cookies_consent', JSON.stringify(allConsents));
    setPreferences(allConsents);
    updateGtagConsent(true, true);
    notifyConsentUpdate(allConsents);
    setShow(false);
    setShowConfig(false);
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = { essential: true, analytics: false, advertising: false, updatedAt: Date.now() };
    localStorage.setItem('cookies_consent', JSON.stringify(onlyEssential));
    purgeNonEssentialStorage();
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
      updatedAt: Date.now(),
    };
    localStorage.setItem('cookies_consent', JSON.stringify(customConsents));
    if (!preferences.analytics || !preferences.advertising) {
      purgeNonEssentialStorage();
    }
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
      className="fixed bottom-0 inset-x-0 bg-[var(--p-inv-bg)] text-[var(--p-inv-ink)] py-5 z-50 border-t border-white/15 shadow-[var(--shadow-overlay)] pb-[calc(20px+env(safe-area-inset-bottom))]"
    >
      <div className="wrap max-h-[55vh] overflow-y-auto">
        {!showConfig ? (
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="text-left max-w-3xl">
              <h3 id="cookie-banner-title" className="text-[16px] font-medium text-[var(--p-inv-ink)] mb-1.5">
                {copy.title}
              </h3>
              <p id="cookie-banner-desc" className="text-[14px] text-[var(--p-inv-muted)] leading-relaxed">
                {copy.desc} {copy.moreDetails}{' '}
                <Link href="/cookies" className="underline text-[var(--p-inv-accent)] hover:text-white font-medium">
                  {copy.cookiesLabel}
                </Link>{' '}
                {copy.and}{' '}
                <Link href="/privacy" className="underline text-[var(--p-inv-accent)] hover:text-white font-medium">
                  {copy.privacyLabel}
                </Link>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleRejectAll}
                className="min-h-[44px] px-5 rounded-[var(--r-btn)] bg-[var(--p-inv-surface)] hover:bg-white/10 text-[var(--p-inv-ink)] border border-white/20 text-[14px] font-medium text-center cursor-pointer"
              >
                {copy.reject}
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="min-h-[44px] px-4 rounded-[var(--r-btn)] bg-transparent hover:bg-white/10 text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] border border-white/15 text-[14px] font-medium text-center cursor-pointer"
              >
                {copy.configure}
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn-primary !text-[14px] whitespace-nowrap"
              >
                {copy.accept}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4 border-b border-white/12 pb-3">
              <div>
                <h3 className="text-[16px] font-medium text-[var(--p-inv-ink)]">
                  Panel de configuración de preferencias de cookies
                </h3>
                <p className="text-[13px] text-[var(--p-inv-muted)] mt-0.5">
                  Gestiona el uso de cookies según tus preferencias. Las cookies técnicas son imprescindibles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="min-h-[44px] px-3 rounded-[var(--r-md)] text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] hover:bg-white/10 text-[14px] font-medium cursor-pointer shrink-0"
                aria-label="Cerrar panel de configuración"
              >
                ✕ Volver
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-[var(--p-inv-surface)] rounded-[var(--r-md)] border border-white/12">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[14px] font-medium text-[var(--p-inv-ink)]">Técnicas y Necesarias</span>
                  <span className="font-mono text-[13px] text-[#34d399] font-medium">
                    Obligatorias
                  </span>
                </div>
                <p className="text-[13px] text-[var(--p-inv-muted)] leading-snug">
                  Permiten la navegación segura, autenticación básica y guardar tus preferencias de consentimiento.
                </p>
              </div>

              <div className="p-4 bg-[var(--p-inv-surface)] rounded-[var(--r-md)] border border-white/12">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[14px] font-medium text-[var(--p-inv-ink)]">Analítica y Rendimiento</span>
                  <label className="relative inline-flex items-center min-h-[44px] min-w-[44px] justify-end cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                      aria-label="Activar cookies de analítica y rendimiento"
                    />
                    <div className="w-10 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[14px] after:right-[22px] peer-checked:after:right-[22px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-[var(--p-action)]" />
                  </label>
                </div>
                <p className="text-[13px] text-[var(--p-inv-muted)] leading-snug">
                  Miden el número de visitas, páginas populares y tiempos de carga para optimizar la experiencia (Google Analytics).
                </p>
              </div>

              <div className="p-4 bg-[var(--p-inv-surface)] rounded-[var(--r-md)] border border-white/12">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[14px] font-medium text-[var(--p-inv-ink)]">Publicidad Contextual</span>
                  <label className="relative inline-flex items-center min-h-[44px] min-w-[44px] justify-end cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                      className="sr-only peer"
                      aria-label="Activar cookies de publicidad contextual"
                    />
                    <div className="w-10 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[14px] after:right-[22px] peer-checked:after:right-[22px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-[var(--p-action)]" />
                  </label>
                </div>
                <p className="text-[13px] text-[var(--p-inv-muted)] leading-snug">
                  Permiten financiar el portal gratuito mostrando anuncios relevantes mediante Google AdSense.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t border-white/12">
              <button
                type="button"
                onClick={handleRejectAll}
                className="min-h-[44px] px-4 rounded-[var(--r-btn)] bg-[var(--p-inv-surface)] hover:bg-white/10 text-[var(--p-inv-ink)] border border-white/20 text-[14px] font-medium cursor-pointer"
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="min-h-[44px] px-4 rounded-[var(--r-btn)] bg-white/15 hover:bg-white/25 text-[var(--p-inv-ink)] text-[14px] font-medium cursor-pointer"
              >
                Guardar mi selección
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn-primary !text-[14px]"
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
