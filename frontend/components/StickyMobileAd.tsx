'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdBanner from './AdBanner';

export default function StickyMobileAd() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Solo mostrar después de 3 segundos de carga de página para evitar clics accidentales
    const timer = setTimeout(() => {
      const excludedPaths = ['/publicar-oferta', '/precios', '/publicidad'];
      const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));
      
      if (!isExcluded) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Si cambia la ruta, resetear visibilidad para la nueva página
  useEffect(() => {
    setIsVisible(false);
  }, [pathname]);

  if (!isVisible) return null;

  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_ANCHOR || '3344556677';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden py-2 px-4 transition-all duration-300 animate-fade-in pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto relative flex flex-col items-center">
        {/* Botón de cierre superior derecho */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-6 right-2 w-5 h-5 bg-gray-200/90 dark:bg-slate-850/90 hover:bg-gray-300 dark:hover:bg-slate-800 hover:scale-105 transition-all rounded-full flex items-center justify-center text-gray-600 dark:text-slate-400 text-[10px] font-black border border-gray-300/40 cursor-pointer shadow-sm"
          aria-label="Cerrar Anuncio"
        >
          ✕
        </button>

        {/* Etiqueta mínima de patrocinado */}
        <span className="text-[8px] font-bold text-gray-400/90 dark:text-slate-500/90 uppercase tracking-widest block text-center mb-1">Anuncio</span>

        {/* Contenedor de Anuncio en modo RAW */}
        <div className="w-full flex justify-center items-center min-h-[50px] max-h-[100px] overflow-hidden">
          <AdBanner 
            variant="inline" 
            slot={slotId} 
            raw={true}
          />
        </div>
      </div>
    </div>
  );
}
