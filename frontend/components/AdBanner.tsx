'use client';

import { useEffect, useState, useRef } from 'react';

// Banners de afiliado internos (no AdSense) — rápidos, sin JS externo, sin ad-blockers.
const UDEMY_LINK = "https://trk.udemy.com/9VMAEj";

const ADS = [
  {
    id: 'bootcamp',
    emoji: '🚀',
    title: 'Domina las tecnologías más demandadas',
    desc: 'Cursos de programación con certificado. Aprende a tu ritmo.',
    cta: 'Ver Cursos →',
    href: UDEMY_LINK,
    colors: 'from-emerald-50 to-teal-50 border-emerald-200',
    ctaColors: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'fullstack',
    emoji: '⚛️',
    title: 'Conviértete en Fullstack Developer',
    desc: 'React, Node.js, bases de datos y despliegue. Todo en un curso.',
    cta: 'Empezar ahora →',
    href: UDEMY_LINK,
    colors: 'from-blue-50 to-indigo-50 border-blue-200',
    ctaColors: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'data',
    emoji: '📊',
    title: 'Aprende Data Science y Machine Learning',
    desc: 'El perfil más demandado de 2026. Python, SQL y más.',
    cta: 'Ver formación →',
    href: UDEMY_LINK,
    colors: 'from-violet-50 to-purple-50 border-violet-200',
    ctaColors: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
];

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * Muestra un banner de Google AdSense o un banner de afiliado de Udemy como fallback.
 * Evita Cumulative Layout Shift (CLS) reservando un espacio mínimo.
 * 
 * @param variant - 'sidebar' muestra formato vertical compacto, 'inline' muestra formato horizontal
 * @param slot - Opcional. ID de slot de anuncio de Google AdSense.
 */
export default function AdBanner({ 
  variant = 'sidebar', 
  slot 
}: { 
  variant?: 'sidebar' | 'inline';
  slot?: string;
}) {
  const [adError, setAdError] = useState(false);
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // Slot ID por defecto si no se especifica uno personalizado
  const adSlot = slot || (variant === 'inline' ? '9876543210' : '1234567890');

  const initializedRef = useRef(false);

  useEffect(() => {
    if (adsenseClientId && !adError && !initializedRef.current) {
      try {
        // Ejecutar el push de adsbygoogle en el cliente
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initializedRef.current = true;
      } catch (err) {
        console.error("⚠️ Error cargando anuncio de AdSense:", err);
        setAdError(true);
      }
    }
  }, [adsenseClientId, adError]);

  // Seleccionar un anuncio de afiliados basado en la hora actual
  const ad = ADS[new Date().getHours() % ADS.length];

  // Si no está configurada la variable de entorno o hay un error de carga, usar afiliación Udemy
  if (!adsenseClientId || adError) {
    if (variant === 'inline') {
      return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r ${ad.colors} border shadow-sm`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{ad.emoji}</span>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{ad.title}</h4>
              <p className="text-gray-600 text-xs">{ad.desc}</p>
            </div>
          </div>
          <a
            href={ad.href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`shrink-0 px-5 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${ad.ctaColors}`}
          >
            {ad.cta}
          </a>
        </div>
      );
    }

    // Sidebar (vertical)
    return (
      <div className={`p-5 rounded-xl bg-gradient-to-br ${ad.colors} border shadow-sm`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{ad.emoji}</span>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Patrocinado</p>
        </div>
        <h4 className="font-bold text-gray-900 text-sm mb-1">{ad.title}</h4>
        <p className="text-gray-600 text-xs mb-4 leading-relaxed">{ad.desc}</p>
        <a
          href={ad.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`block w-full text-center px-4 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${ad.ctaColors}`}
        >
          {ad.cta}
        </a>
      </div>
    );
  }

  // Renderizado del banner de Google AdSense
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center">
      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block text-center">Anuncio</span>
      <div 
        className={`w-full flex justify-center items-center overflow-hidden transition-all duration-300 ${
          variant === 'inline' 
            ? 'min-h-[90px] md:min-h-[250px] max-h-[280px]' 
            : 'min-h-[250px] md:min-h-[300px]'
        }`}
      >
        <ins
          className="adsbygoogle"
          style={{ 
            display: 'block', 
            width: '100%',
            textAlign: 'center'
          }}
          data-ad-client={adsenseClientId}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
