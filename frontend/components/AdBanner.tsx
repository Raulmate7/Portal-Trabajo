'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Banners de afiliado internos (no AdSense) — rápidos, sin JS externo, sin ad-blockers.
const UDEMY_LINK = "https://trk.udemy.com/9VMAEj";

const ADS = [
  {
    id: 'bootcamp',
    emoji: '🚀',
    title: 'Domina las tecnologías más demandadas',
    desc: 'Cursos de programación con certificado. Aprende a tu ritmo.',
    cta: 'Ver Cursos →',
    href: `${UDEMY_LINK}?subid=bootcamp`,
    colors: 'from-emerald-50 to-teal-50 border-emerald-200',
    ctaColors: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'fullstack',
    emoji: '⚛️',
    title: 'Conviértete en Fullstack Developer',
    desc: 'React, Node.js, bases de datos y despliegue. Todo en un curso.',
    cta: 'Empezar ahora →',
    href: `${UDEMY_LINK}?subid=fullstack`,
    colors: 'from-blue-50 to-indigo-50 border-blue-200',
    ctaColors: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'data',
    emoji: '📊',
    title: 'Aprende Data Science y Machine Learning',
    desc: 'El perfil más demandado de 2026. Python, SQL y más.',
    cta: 'Ver formación →',
    href: `${UDEMY_LINK}?subid=data`,
    colors: 'from-violet-50 to-purple-50 border-violet-200',
    ctaColors: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  {
    id: 'books',
    emoji: '📚',
    title: 'Los mejores libros para programadores',
    desc: 'Diseño de sistemas, Clean Code y arquitectura recomendada.',
    cta: 'Ver Libros →',
    href: 'https://amzn.to/3XQyY7Z',
    colors: 'from-amber-50 to-yellow-50 border-amber-200',
    ctaColors: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    id: 'cloud-cert',
    emoji: '☁️',
    title: 'Certificaciones Cloud oficiales (AWS, GCP, Azure)',
    desc: 'Consigue tu certificado en la nube con cursos de Coursera.',
    cta: 'Ver Cursos →',
    href: 'https://coursera.pxf.io/c/123456/1164968/14726',
    colors: 'from-sky-50 to-cyan-50 border-sky-200',
    ctaColors: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  {
    id: 'jetbrains',
    emoji: '💻',
    title: 'Licencias JetBrains (WebStorm, PyCharm, IntelliJ)',
    desc: 'Optimiza tu productividad con los IDEs preferidos.',
    cta: 'Obtener IDE →',
    href: 'https://www.jetbrains.com/store/#affiliate=123456',
    colors: 'from-pink-50 to-rose-50 border-pink-200',
    ctaColors: 'bg-pink-600 hover:bg-pink-700 text-white',
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
  variant?: 'sidebar' | 'inline' | 'multiplex';
  slot?: string;
}) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // Slot ID por defecto si no se especifica uno personalizado, intentando leer de variables de entorno públicas
  const defaultSlot = variant === 'inline'
    ? (process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || '9876543210')
    : variant === 'multiplex'
    ? (process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX || '1122334455')
    : (process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '1234567890');

  const adSlot = slot || defaultSlot;

  // Detección de Slots placeholders/dummies para evitar peticiones AdSense inservibles en producción
  const isDummySlot = adSlot === '9876543210' || adSlot === '1122334455' || adSlot === '1234567890';
  const shouldTryAdsense = !!adsenseClientId && !isDummySlot;

  const [adError, setAdError] = useState(!shouldTryAdsense);
  const [isLoading, setIsLoading] = useState(shouldTryAdsense);
  
  const insRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!shouldTryAdsense || adError) return;

    let timer: NodeJS.Timeout;
    let observer: MutationObserver;
    let intersectionObserver: IntersectionObserver;

    try {
      const initializeAd = () => {
        if (!initializedRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          initializedRef.current = true;
        }

        // 1. MutationObserver para detectar de inmediato cuando AdSense carga exitosamente (filled) o falla (unfilled)
        if (insRef.current) {
          observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                const status = insRef.current?.getAttribute('data-ad-status');
                if (status === 'filled') {
                  setIsLoading(false);
                } else if (status === 'unfilled') {
                  setAdError(true);
                  setIsLoading(false);
                }
              }
            });
          });

          observer.observe(insRef.current, { attributes: true });
        }

        // 2. Timer de salvaguarda de 3.5 segundos (útil para adblockers agresivos o bloqueos totales de red)
        timer = setTimeout(() => {
          if (insRef.current) {
            const hasIframe = insRef.current.getElementsByTagName('iframe').length > 0;
            const status = insRef.current.getAttribute('data-ad-status');

            if (status === 'filled' || hasIframe) {
              setIsLoading(false);
            } else {
              console.warn("⚠️ AdSense no cargó el anuncio (adblocker o error). Mostrando banner de fallback.");
              setAdError(true);
              setIsLoading(false);
            }
          }
        }, 3500);
      };

      if (insRef.current && typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              initializeAd();
              intersectionObserver.disconnect();
            }
          });
        }, { rootMargin: '200px' });

        intersectionObserver.observe(insRef.current);
      } else {
        // Fallback si no hay soporte para IntersectionObserver o no hay ref
        initializeAd();
      }

    } catch (err) {
      console.error("⚠️ Error inicializando AdSense:", err);
      setAdError(true);
      setIsLoading(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
    };
  }, [shouldTryAdsense, adError]);

  const pathname = usePathname() || '';

  // Seleccionar un anuncio de afiliados basado en la ruta / tecnología actual
  let adIndex = 0;
  const pathLower = pathname.toLowerCase();
  if (
    pathLower.includes('cloud') ||
    pathLower.includes('devops') ||
    pathLower.includes('aws') ||
    pathLower.includes('docker') ||
    pathLower.includes('kubernetes') ||
    pathLower.includes('azure') ||
    pathLower.includes('gcp') ||
    pathLower.includes('system') ||
    pathLower.includes('admin')
  ) {
    adIndex = 4; // cloud-cert
  } else if (
    pathLower.includes('java') ||
    pathLower.includes('php') ||
    pathLower.includes('csharp') ||
    pathLower.includes('intellij') ||
    pathLower.includes('pycharm') ||
    pathLower.includes('webstorm') ||
    pathLower.includes('ide') ||
    pathLower.includes('productivity')
  ) {
    adIndex = 5; // jetbrains
  } else if (
    pathLower.includes('blog') ||
    pathLower.includes('orientacion') ||
    pathLower.includes('cv') ||
    pathLower.includes('entrevista') ||
    pathLower.includes('libro') ||
    pathLower.includes('book')
  ) {
    adIndex = 3; // books
  } else if (
    pathLower.includes('react') ||
    pathLower.includes('javascript') ||
    pathLower.includes('typescript') ||
    pathLower.includes('nextjs') ||
    pathLower.includes('vue') ||
    pathLower.includes('angular') ||
    pathLower.includes('frontend') ||
    pathLower.includes('node') ||
    pathLower.includes('backend') ||
    pathLower.includes('fullstack') ||
    pathLower.includes('web')
  ) {
    adIndex = 1; // fullstack
  } else if (
    pathLower.includes('python') ||
    pathLower.includes('data') ||
    pathLower.includes('science') ||
    pathLower.includes('machine') ||
    pathLower.includes('learning') ||
    pathLower.includes('sql') ||
    pathLower.includes('mysql') ||
    pathLower.includes('postgres') ||
    pathLower.includes('analytics')
  ) {
    adIndex = 2; // data
  } else {
    adIndex = new Date().getHours() % ADS.length;
  }

  const ad = ADS[adIndex];

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

    if (variant === 'multiplex') {
      return (
        <div className="w-full mt-8 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 block text-center">Formación Recomendada</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ADS.map((adItem) => (
              <div key={adItem.id} className={`p-5 rounded-xl bg-gradient-to-br ${adItem.colors} border shadow-sm flex flex-col justify-between h-full`}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{adItem.emoji}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{adItem.title}</h4>
                  <p className="text-gray-600 text-xs mb-4 leading-relaxed">{adItem.desc}</p>
                </div>
                <a
                  href={adItem.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`block w-full text-center px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${adItem.ctaColors}`}
                >
                  {adItem.cta}
                </a>
              </div>
            ))}
          </div>
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

  // Renderizado del bloque Multiplex de AdSense
  if (variant === 'multiplex') {
    return (
      <div className="w-full overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm p-4 mt-8 flex flex-col items-center">
        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block text-center">Contenido Patrocinado</span>
        <div className={`w-full flex justify-center items-center overflow-hidden min-h-[250px] relative bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 rounded-lg border border-gray-100/50 ${isLoading ? 'animate-pulse' : ''}`}>
          {/* Fondo elegante del placeholder que se tapará cuando cargue el anuncio */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300">
              <span className="text-2xl mb-1">📰</span>
              <span className="text-[10px] uppercase tracking-wider font-medium">Recomendados para ti</span>
            </div>
          )}
          <ins
            ref={insRef}
            className="adsbygoogle relative z-10"
            style={{ 
              display: 'block', 
              width: '100%',
              textAlign: 'center'
            }}
            data-ad-client={adsenseClientId}
            data-ad-slot={adSlot}
            data-ad-format="autorelaxed"
            data-matched-content-ui-type="image_card_stacked"
            data-matched-content-rows-num="4,2"
            data-matched-content-columns-num="1,2"
          />
        </div>
      </div>
    );
  }

  // Renderizado del banner estándar de Google AdSense (inline / sidebar)
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center">
      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block text-center">Anuncio</span>
      <div 
        className={`w-full flex justify-center items-center overflow-hidden transition-all duration-300 relative bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 rounded-lg border border-gray-100/50 ${
          isLoading ? 'animate-pulse' : ''
        } ${
          variant === 'inline' 
            ? 'min-h-[90px] md:min-h-[250px] max-h-[280px]' 
            : 'min-h-[250px] md:min-h-[300px]'
        }`}
      >
        {/* Fondo elegante del placeholder que se tapará cuando cargue el anuncio */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300">
            <span className="text-xl mb-1">📢</span>
            <span className="text-[9px] uppercase tracking-wider font-medium">Cargando anuncio...</span>
          </div>
        )}
        <ins
          ref={insRef}
          className="adsbygoogle relative z-10"
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
