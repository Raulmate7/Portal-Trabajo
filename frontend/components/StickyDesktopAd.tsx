'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdBanner from './AdBanner';

export default function StickyDesktopAd() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_SIDEBAR;

  useEffect(() => {
    const checkAdConsent = (): boolean => {
      if (typeof window === 'undefined') return false;
      try {
        const saved = localStorage.getItem('cookies_consent');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.advertising === true;
        }
        return localStorage.getItem('cookies_accepted') === 'true';
      } catch {
        return false;
      }
    };

    const excludedPaths = ['/publicar-oferta', '/precios', '/publicidad'];
    const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));

    // Solo mostrar después de 2 segundos si el usuario otorgó consentimiento publicitario (Art. 22.2 LSSI)
    const timer = setTimeout(() => {
      if (!isExcluded && checkAdConsent()) {
        setIsVisible(true);
      }
    }, 2000);

    const onConsent = (event: Event) => {
      if (isExcluded) {
        setIsVisible(false);
        return;
      }
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.advertising === 'boolean') {
        setIsVisible(customEvent.detail.advertising);
      } else {
        setIsVisible(checkAdConsent());
      }
    };

    window.addEventListener('cookie_consent_updated', onConsent);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('cookie_consent_updated', onConsent);
    };
  }, [pathname]);

  // Si cambia la ruta, resetear visibilidad
  useEffect(() => {
    setIsVisible(false);
  }, [pathname]);

  if (!isVisible || !adsenseClientId) return null;

  return (
    <div className="fixed right-4 top-24 z-40 hidden xl:flex flex-col items-center w-[160px] bg-white border border-gray-150 shadow-lg rounded-xl p-2 transition-opacity duration-300">
      {/* Botón de cerrar */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -top-3 -right-3 w-6 h-6 bg-gray-150 hover:bg-gray-200 text-gray-700 hover:scale-105 transition-all rounded-full flex items-center justify-center text-[10px] font-black border border-gray-300/40 cursor-pointer shadow-sm"
        aria-label="Cerrar Anuncio"
      >
        ✕
      </button>

      {/* Etiqueta de patrocinado */}
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-1.5">Anuncio</span>

      {/* Contenedor de Anuncio en formato Sidebar */}
      <div className="w-full h-[600px] overflow-hidden flex justify-center items-center">
        <AdBanner 
          variant="sidebar" 
          slot={slotId} 
          raw={true}
        />
      </div>
    </div>
  );
}
