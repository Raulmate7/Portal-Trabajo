'use client';

import { useState, useEffect } from 'react';
import AdBanner from './AdBanner';

export default function StickyDesktopAd() {
  const [isVisible, setIsVisible] = useState(false);
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY_SIDEBAR;

  useEffect(() => {
    // Retrasar la aparición 2 segundos para evitar intrusión inmediata y clics accidentales
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
