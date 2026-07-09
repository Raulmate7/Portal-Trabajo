'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';


// Banners de afiliado internos (no AdSense) — rápidos, sin JS externo, sin ad-blockers.
const UDEMY_LINK = "https://trk.udemy.com/9VMAEj";

const getAmazonLink = (url: string) => {
  const tag = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_AMAZON_TAG || '') : '';
  if (tag) {
    return url.replace('TU_AMAZON_TAG', tag);
  } else {
    return url.replace(/[&?]tag=TU_AMAZON_TAG/, '');
  }
};

const getLinkedinLink = (url: string) => {
  const affiliateId = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_LINKEDIN_AFFILIATE_ID || '') : '';
  if (affiliateId) {
    return url.replace('TU_AFFILIATE_ID_LINKEDIN', affiliateId);
  } else {
    return url.replace(/[&?]upsellOrderOrigin=aff_TU_AFFILIATE_ID_LINKEDIN/, '');
  }
};

const getCourseraLink = (url: string) => {
  const affiliateId = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_COURSERA_AFFILIATE_ID || '') : '';
  if (affiliateId) {
    return url.replace('TU_AFFILIATE_ID_COURSERA', affiliateId);
  } else {
    return url.replace(/[&?]c=TU_AFFILIATE_ID_COURSERA/, '');
  }
};

const BOOKS = [
  {
    title: 'Libro: Código Limpio (Clean Code)',
    desc: 'El manual clásico de Robert C. Martin para escribir software limpio, legible y fácil de mantener.',
    href: getAmazonLink('https://www.amazon.es/dp/8441532109?tag=TU_AMAZON_TAG'),
  },
  {
    title: 'Libro: El Programador Pragmático',
    desc: 'La guía fundamental para perfeccionar tu oficio como desarrollador y crear software de alta calidad.',
    href: getAmazonLink('https://www.amazon.es/dp/8441542694?tag=TU_AMAZON_TAG'),
  },
  {
    title: 'Libro: Designing Data-Intensive Applications',
    desc: 'La biblia de Martin Kleppmann para comprender la arquitectura de datos, escalabilidad y sistemas distribuidos.',
    href: getAmazonLink('https://www.amazon.es/dp/1449373321?tag=TU_AMAZON_TAG'),
  }
];

const ADS = [
  {
    id: 'bootcamp',
    emoji: '🚀',
    title: 'Domina las tecnologías más demandadas',
    desc: 'Cursos de programación con certificado. Aprende a tu ritmo.',
    cta: 'Ver Cursos →',
    href: `${UDEMY_LINK}?subid=bootcamp&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fthe-web-developer-bootcamp%2F`,
    colors: 'from-emerald-50 to-teal-50 border-emerald-200',
    ctaColors: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'fullstack',
    emoji: '⚛️',
    title: 'Conviértete en Fullstack Developer',
    desc: 'React, Node.js, bases de datos y despliegue. Todo en un curso.',
    cta: 'Empezar ahora →',
    href: `${UDEMY_LINK}?subid=fullstack&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fthe-complete-web-development-bootcamp%2F`,
    colors: 'from-blue-50 to-indigo-50 border-blue-200',
    ctaColors: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'data',
    emoji: '📊',
    title: 'Aprende Data Science y Machine Learning',
    desc: 'El perfil más demandado de 2026. Python, SQL y más.',
    cta: 'Ver formación →',
    href: `${UDEMY_LINK}?subid=data&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fcomplete-python-bootcamp%2F`,
    colors: 'from-violet-50 to-purple-50 border-violet-200',
    ctaColors: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  {
    id: 'cloud-cert',
    emoji: '☁️',
    title: 'Certificaciones Cloud oficiales (AWS, GCP, Azure)',
    desc: 'Consigue tu certificado en la nube con cursos de Coursera.',
    cta: 'Ver Cursos →',
    href: getCourseraLink('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726'),
    colors: 'from-sky-50 to-cyan-50 border-sky-200',
    ctaColors: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  {
    id: 'react-advanced',
    emoji: '⚛️',
    title: 'Advanced React & Frontend Architecture',
    desc: 'Diseño de sistemas, patrones avanzados, rendimiento y testing en React.',
    cta: 'Ver Certificación →',
    href: getCourseraLink('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726?subid=react-advanced'),
    colors: 'from-indigo-50 to-purple-50 border-indigo-200',
    ctaColors: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  {
    id: 'devops-adv',
    emoji: '☸️',
    title: 'GitOps & Kubernetes en Producción',
    desc: 'Escalabilidad, despliegue continuo, Docker y Kubernetes avanzado.',
    cta: 'Ver Certificación →',
    href: getCourseraLink('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726?subid=devops-adv'),
    colors: 'from-slate-50 to-blue-50 border-slate-200',
    ctaColors: 'bg-slate-900 hover:bg-black text-white',
  },
  {
    id: 'linkedin-learning',
    emoji: '🎓',
    title: 'Aprende habilidades IT en LinkedIn Learning',
    desc: 'Cursos prácticos impartidos por expertos. Primer mes gratis.',
    cta: 'Empezar gratis →',
    href: getLinkedinLink('https://linkedin-learning.pxf.io/c/TU_AFFILIATE_ID_LINKEDIN/1164968/14726'),
    colors: 'from-blue-50 to-sky-50 border-blue-200',
    ctaColors: 'bg-indigo-600 hover:bg-indigo-750 text-white',
  },
  {
    id: 'domestika-tech',
    emoji: '🎨',
    title: 'Diseño Web y Frontend en Domestika',
    desc: 'Figma, HTML, CSS y Javascript con profesionales del sector.',
    cta: 'Ver Cursos →',
    href: 'https://domestika.sjv.io/c/42bf01704253/1164968/14726?subid=domestika-tech',
    colors: 'from-orange-50 to-rose-50 border-orange-200',
    ctaColors: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  {
    id: 'platzi-tech',
    emoji: '💚',
    title: 'Crece profesionalmente con Platzi',
    desc: 'Cursos online de programación, servidores, base de datos y diseño.',
    cta: 'Ver Planes →',
    href: 'https://platzi.com/r/portalit/',
    colors: 'from-green-50 to-emerald-50 border-green-200',
    ctaColors: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
];

// Helper para construir URLs de afiliados con parámetros UTM para análisis de conversión
const getUtmUrl = (url: string, id: string, variant: string): string => {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('utm_source', 'portalempleoit');
    parsedUrl.searchParams.set('utm_medium', 'banner');
    parsedUrl.searchParams.set('utm_campaign', id);
    parsedUrl.searchParams.set('utm_content', variant);
    return parsedUrl.toString();
  } catch (e) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=portalempleoit&utm_medium=banner&utm_campaign=${id}&utm_content=${variant}`;
  }
};

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
  slot,
  tech,
  experience,
  enableRefresh = false,
  raw = false
}: { 
  variant?: 'sidebar' | 'inline' | 'multiplex' | 'infeed';
  slot?: string;
  tech?: string;
  experience?: string;
  enableRefresh?: boolean;
  raw?: boolean;
}) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // Slot ID por defecto si no se especifica uno personalizado
  const defaultSlot = variant === 'inline'
    ? (process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || '9876543210')
    : variant === 'multiplex'
    ? (process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX || '1122334455')
    : variant === 'infeed'
    ? (process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED || process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || '9876543210')
    : (process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '1234567890');

  const adSlot = slot || defaultSlot;

  // Detección de Slots placeholders
  const isDummySlot = adSlot === '9876543210' || adSlot === '1122334455' || adSlot === '1234567890';
  const shouldTryAdsense = !!adsenseClientId && !isDummySlot;

  const [refreshKey, setRefreshKey] = useState(0);
  const [adError, setAdError] = useState(!shouldTryAdsense);
  const [isLoading, setIsLoading] = useState(shouldTryAdsense);
  const [bookIndex, setBookIndex] = useState(0);

  useEffect(() => {
    setBookIndex(Math.floor(Math.random() * BOOKS.length));
  }, []);
  
  const insRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);
  const refreshCountRef = useRef(0);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs de métricas de visibilidad
  const adViewedTracked = useRef(false);
  const adViewable1sTracked = useRef(false);
  const adViewable5sTracked = useRef(false);
  const viewTimer1s = useRef<NodeJS.Timeout | null>(null);
  const viewTimer5s = useRef<NodeJS.Timeout | null>(null);

  // Escuchar actividad del usuario de forma global para comprobar inactividad
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Reiniciar estado e inicialización cuando cambia refreshKey
  useEffect(() => {
    adViewedTracked.current = false;
    adViewable1sTracked.current = false;
    adViewable5sTracked.current = false;
    setIsLoading(shouldTryAdsense);
    setAdError(!shouldTryAdsense);
    initializedRef.current = false;
  }, [refreshKey, shouldTryAdsense]);

  const trackViewability = useCallback((event: 'ad_viewed' | 'ad_viewable_1s' | 'ad_viewable_5s') => {
    try {
      sendGAEvent({
        event: event,
        value: `${variant}_${adSlot}`
      });
    } catch (e) {
      console.warn("GA tracking failed:", e);
    }
  }, [variant, adSlot]);

  useEffect(() => {
    if (!shouldTryAdsense || adError) return;

    let timer: NodeJS.Timeout;
    let observer: MutationObserver;
    let intersectionObserver: IntersectionObserver;

    try {
      const initializeAd = () => {
        if (!initializedRef.current && typeof window !== 'undefined') {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            initializedRef.current = true;
          } catch (e) {
            console.error("AdSense push error:", e);
          }
        }

        // MutationObserver para detectar status
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

        // Timeout fallback
        timer = setTimeout(() => {
          if (insRef.current) {
            const hasIframe = insRef.current.getElementsByTagName('iframe').length > 0;
            const status = insRef.current.getAttribute('data-ad-status');

            if (status === 'filled' || hasIframe) {
              setIsLoading(false);
            } else {
              console.warn("⚠️ AdSense no cargó el anuncio. Fallback.");
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
              
              // Evento: ad_viewed
              if (!adViewedTracked.current) {
                trackViewability('ad_viewed');
                adViewedTracked.current = true;
              }

              // Evento: ad_viewable_1s
              if (!adViewable1sTracked.current) {
                viewTimer1s.current = setTimeout(() => {
                  trackViewability('ad_viewable_1s');
                  adViewable1sTracked.current = true;
                }, 1000);
              }

              // Evento: ad_viewable_5s
              if (!adViewable5sTracked.current) {
                viewTimer5s.current = setTimeout(() => {
                  trackViewability('ad_viewable_5s');
                  adViewable5sTracked.current = true;
                }, 5000);
              }

              // Ad Refresh a los 30s (si está habilitado explícitamente)
              if (enableRefresh && refreshCountRef.current < 5) {
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                  const inactiveTime = Date.now() - lastActivityRef.current;
                  if (inactiveTime < 30000) {
                    refreshCountRef.current += 1;
                    setRefreshKey(prev => prev + 1);
                  }
                }, 30000);
              }
            } else {
              // Limpiar timers al salir de pantalla
              if (viewTimer1s.current) {
                clearTimeout(viewTimer1s.current);
                viewTimer1s.current = null;
              }
              if (viewTimer5s.current) {
                clearTimeout(viewTimer5s.current);
                viewTimer5s.current = null;
              }
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
            }
          });
        }, { rootMargin: '200px' });

        intersectionObserver.observe(insRef.current);
      } else {
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
      if (viewTimer1s.current) clearTimeout(viewTimer1s.current);
      if (viewTimer5s.current) clearTimeout(viewTimer5s.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shouldTryAdsense, adError, refreshKey, trackViewability, enableRefresh]);

  const pathname = usePathname() || '';

  // Seleccionar un anuncio de afiliados basado en la tecnología, experiencia o ruta
  const resolvedTech = (tech || pathname.split('/').pop() || '').toLowerCase();
  const resolvedExp = (experience || '').toLowerCase();

  let adIndex = 0;
  
  if (resolvedExp.includes('senior') && (resolvedTech.includes('cloud') || resolvedTech.includes('devops') || resolvedTech.includes('aws') || resolvedTech.includes('kubernetes') || resolvedTech.includes('docker'))) {
    adIndex = 5; // devops-adv (Kubernetes y GitOps)
  } else if (resolvedExp.includes('senior') && (resolvedTech.includes('react') || resolvedTech.includes('next') || resolvedTech.includes('frontend'))) {
    adIndex = 4; // react-advanced
  } else if (
    resolvedTech.includes('cloud') ||
    resolvedTech.includes('devops') ||
    resolvedTech.includes('aws') ||
    resolvedTech.includes('docker') ||
    resolvedTech.includes('kubernetes') ||
    resolvedTech.includes('azure') ||
    resolvedTech.includes('gcp') ||
    resolvedTech.includes('system') ||
    resolvedTech.includes('admin')
  ) {
    adIndex = 3; // cloud-cert
  } else if (
    resolvedTech.includes('react') ||
    resolvedTech.includes('javascript') ||
    resolvedTech.includes('typescript') ||
    resolvedTech.includes('nextjs') ||
    resolvedTech.includes('vue') ||
    resolvedTech.includes('angular') ||
    resolvedTech.includes('frontend') ||
    resolvedTech.includes('node') ||
    resolvedTech.includes('backend') ||
    resolvedTech.includes('fullstack') ||
    resolvedTech.includes('web')
  ) {
    adIndex = 1; // fullstack
  } else if (
    resolvedTech.includes('python') ||
    resolvedTech.includes('data') ||
    resolvedTech.includes('science') ||
    resolvedTech.includes('machine') ||
    resolvedTech.includes('learning') ||
    resolvedTech.includes('sql') ||
    resolvedTech.includes('mysql') ||
    resolvedTech.includes('postgres') ||
    resolvedTech.includes('analytics')
  ) {
    adIndex = 2; // data
  } else {
    adIndex = new Date().getHours() % ADS.length;
  }

  let ad = ADS[adIndex];

  // Mapeo contextual específico por tecnología para maximizar CTR
  const TECH_COURSE_MAP: Record<string, typeof ad> = {
    'react': {
      id: 'react-advanced',
      emoji: '⚛️',
      title: 'Advanced React & Architecture',
      desc: 'Patrones avanzados, rendimiento y diseño de sistemas en frontend.',
      cta: 'Ver Curso →',
      href: getCourseraLink('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726?subid=react-advanced'),
      colors: 'from-indigo-50 to-purple-50 border-indigo-200',
      ctaColors: 'bg-indigo-600 hover:bg-indigo-750 text-white',
    },
    'node': {
      id: 'node-backend',
      emoji: '🟢',
      title: 'Node.js: Backend de Cero a Experto',
      desc: 'Crea APIs robustas, autenticación y despliegue real en producción.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=node-backend&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fnode-de-cero-a-master%2F`,
      colors: 'from-green-50 to-emerald-50 border-green-200',
      ctaColors: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    'python': {
      id: 'python-bootcamp',
      emoji: '🐍',
      title: 'Masterclass Completa de Python',
      desc: 'Aprende programación, análisis de datos y machine learning con Python.',
      cta: 'Empezar →',
      href: `${UDEMY_LINK}?subid=python-bootcamp&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fcomplete-python-bootcamp%2F`,
      colors: 'from-amber-50/40 to-yellow-50/50 border-yellow-200',
      ctaColors: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    'java': {
      id: 'java-master',
      emoji: '☕',
      title: 'Java Master Class & Spring Boot',
      desc: 'El lenguaje corporativo más cotizado. De cero a arquitecto de software.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=java-master&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fjava-the-complete-reference%2F`,
      colors: 'from-red-50 to-orange-50 border-red-200',
      ctaColors: 'bg-red-600 hover:bg-red-700 text-white',
    },
    'typescript': {
      id: 'typescript-master',
      emoji: '🟦',
      title: 'TypeScript: Guía Completa de Programación',
      desc: 'Domina tipos, genéricos, clases y diseño de tipos seguros en frontend y backend.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=typescript-master&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Funderstanding-typescript%2F`,
      colors: 'from-blue-50 to-sky-50 border-blue-200',
      ctaColors: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    'aws': {
      id: 'aws-cert',
      emoji: '☁️',
      title: 'AWS Certified Solutions Architect',
      desc: 'Certifícate oficialmente en la nube con mayor demanda laboral en España.',
      cta: 'Ver Curso →',
      href: getCourseraLink('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726?subid=aws-cert'),
      colors: 'from-orange-50 to-amber-50 border-orange-200',
      ctaColors: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    'docker': {
      id: 'docker-k8s',
      emoji: '🐳',
      title: 'Docker y Kubernetes de Cero a Héroe',
      desc: 'Automatiza, escala y administra contenedores en producción.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=docker-k8s&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fdocker-and-kubernetes-the-complete-guide%2F`,
      colors: 'from-blue-50 to-cyan-50 border-cyan-200',
      ctaColors: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
    'rust': {
      id: 'rust-lang',
      emoji: '🦀',
      title: 'Rust Programming: The Complete Guide',
      desc: 'Domina la gestión de memoria sin recolector y concurrencia segura en Rust.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=rust-lang&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Frust-programming%2F`,
      colors: 'from-amber-50 to-orange-50 border-amber-200',
      ctaColors: 'bg-amber-700 hover:bg-amber-800 text-white',
    },
    'go': {
      id: 'go-lang',
      emoji: '🐹',
      title: 'Desarrollo Backend con Go (Golang)',
      desc: 'Aprende el lenguaje de Google para crear microservicios ultrarrápidos.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=go-lang&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fgo-the-complete-developers-guide%2F`,
      colors: 'from-sky-50 to-cyan-50 border-sky-200',
      ctaColors: 'bg-sky-600 hover:bg-sky-700 text-white',
    },
    'php': {
      id: 'php-laravel',
      emoji: '🐘',
      title: 'PHP con Laravel de Principiante a Master',
      desc: 'Crea aplicaciones dinámicas robustas y seguras usando el framework Laravel.',
      cta: 'Ver Curso →',
      href: `${UDEMY_LINK}?subid=php-laravel&redirect=https%3A%2F%2Fwww.udemy.com%2Fcourse%2Fphp-with-laravel-for-beginners%2F`,
      colors: 'from-indigo-50 to-purple-50 border-indigo-200',
      ctaColors: 'bg-indigo-600 hover:bg-indigo-750 text-white',
    }
  };

  // Intentar emparejar por tecnología para máxima contextualización
  for (const [techKey, techAd] of Object.entries(TECH_COURSE_MAP)) {
    if (resolvedTech.includes(techKey)) {
      ad = techAd;
      break;
    }
  }

  // Si no está configurada la variable de entorno o hay un error de carga, usar afiliación Udemy
  if (!adsenseClientId || adError) {
    if (variant === 'inline') {
      if (raw) {
        return (
          <a
            href={getUtmUrl(ad.href, ad.id, variant)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`flex items-center justify-between w-full h-[60px] px-4 rounded-lg bg-gradient-to-r ${ad.colors} border shadow-sm text-xs font-semibold`}
            onClick={() => sendGAEvent({ event: 'click_affiliate', value: ad.id })}
          >
            <span className="truncate mr-2 font-bold text-gray-900">{ad.emoji} {ad.title}</span>
            <span className={`shrink-0 px-3 py-1 rounded text-[11px] font-bold ${ad.ctaColors}`}>{ad.cta}</span>
          </a>
        );
      }
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
            href={getUtmUrl(ad.href, ad.id, variant)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`shrink-0 px-5 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${ad.ctaColors}`}
            onClick={() => sendGAEvent({ event: 'click_affiliate', value: ad.id })}
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
                  href={getUtmUrl(adItem.href, adItem.id, variant)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`block w-full text-center px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${adItem.ctaColors}`}
                  onClick={() => sendGAEvent({ event: 'click_affiliate', value: adItem.id })}
                >
                  {adItem.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (variant === 'infeed') {
      const isUrgent = ad.id === 'bootcamp' || ad.id === 'linkedin-premium';
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col h-full text-left">
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-550 to-violet-650 flex items-center justify-center text-white shrink-0 font-bold text-lg">
                  {ad.emoji}
                </div>
                <div className="flex flex-col gap-1.5 font-sans">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {ad.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 uppercase tracking-wider shrink-0">
                      💡 Recomendado
                    </span>
                    {isUrgent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 uppercase tracking-wider shrink-0">
                        🔥 Popular
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/50 whitespace-nowrap">
                  Patrocinado
                </span>
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-4 font-sans">
              <span className="font-semibold">
                {ad.id.includes('coursera') || ad.id.includes('react-advanced') || ad.id.includes('devops-adv') ? 'Coursera' : ad.id.includes('linkedin') ? 'LinkedIn' : ad.id.includes('books') ? 'Amazon' : 'Udemy'}
              </span>
              <span className="mx-2">•</span>
              <span>Online / Flexible</span>
            </div>

            <p className="text-xs text-gray-650 dark:text-slate-350 line-clamp-2 mb-4 leading-relaxed font-sans">
              {ad.desc}
            </p>
          </div>

          <div className="px-6 pb-6 mt-auto">
            <a
              href={getUtmUrl(ad.href, ad.id, variant)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`block w-full text-center font-bold py-2.5 px-4 rounded-lg transition-colors duration-205 text-sm ${ad.ctaColors}`}
              onClick={() => sendGAEvent({ event: 'click_affiliate', value: ad.id })}
            >
              {ad.cta}
            </a>
          </div>
        </div>
      );
    }

    // Sidebar (vertical)
    if (raw) {
      return (
        <a
          href={getUtmUrl(ad.href, ad.id, variant)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`block p-3.5 rounded-lg bg-gradient-to-br ${ad.colors} border shadow-sm text-xs text-center`}
          onClick={() => sendGAEvent({ event: 'click_affiliate', value: ad.id })}
        >
          <span className="block font-bold text-gray-900 mb-1.5">{ad.emoji} {ad.title}</span>
          <span className={`block w-full py-1.5 rounded text-[11px] font-bold ${ad.ctaColors}`}>{ad.cta}</span>
        </a>
      );
    }
    return (
      <div className={`p-5 rounded-xl bg-gradient-to-br ${ad.colors} border shadow-sm`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{ad.emoji}</span>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Patrocinado</p>
        </div>
        <h4 className="font-bold text-gray-900 text-sm mb-1">{ad.title}</h4>
        <p className="text-gray-600 text-xs mb-4 leading-relaxed">{ad.desc}</p>
        <a
          href={getUtmUrl(ad.href, ad.id, variant)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`block w-full text-center px-4 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${ad.ctaColors}`}
          onClick={() => sendGAEvent({ event: 'click_affiliate', value: ad.id })}
        >
          {ad.cta}
        </a>
      </div>
    );
  }

  // Renderizado de la variante nativa In-feed de AdSense
  if (variant === 'infeed') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col h-full p-4 items-center">
        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block text-center">Anuncio Patrocinado</span>
        <div 
          className={`w-full flex justify-center items-center overflow-hidden transition-all duration-300 relative bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 rounded-lg border border-gray-100/50 dark:border-slate-800/50 ${
            isLoading ? 'animate-pulse' : ''
          } min-h-[250px] flex-grow`}
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300 dark:text-slate-650">
              <span className="text-xl mb-1">📢</span>
              <span className="text-[9px] uppercase tracking-wider font-medium">Cargando anuncio...</span>
            </div>
          )}
          <ins
            key={refreshKey}
            ref={insRef}
            className="adsbygoogle relative z-10"
            style={{ 
              display: 'block', 
              width: '100%',
              textAlign: 'center'
            }}
            data-ad-client={adsenseClientId}
            data-ad-slot={adSlot}
            data-ad-format="fluid"
          />
        </div>
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
            key={refreshKey}
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
  if (raw) {
    const rawMinH = variant === 'inline' 
      ? 'min-h-[50px] md:min-h-[90px]' 
      : 'min-h-[250px]';
    return (
      <div className={`w-full flex justify-center items-center overflow-hidden relative ${rawMinH} ${isLoading ? 'animate-pulse' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 dark:text-slate-600">
            <span className="text-[9px] uppercase tracking-wider font-medium">Cargando...</span>
          </div>
        )}
        <ins
          key={refreshKey}
          ref={insRef}
          className="adsbygoogle relative z-10"
          style={{ 
            display: 'block', 
            width: '100%',
            textAlign: 'center'
          }}
          data-ad-client={adsenseClientId}
          data-ad-slot={adSlot}
          data-ad-format={variant === 'inline' ? 'horizontal' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  const wrapperMinH = variant === 'inline' 
    ? 'min-h-[50px] md:min-h-[90px]' 
    : 'min-h-[250px] md:min-h-[300px]';

  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center">
      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block text-center">Anuncio</span>
      <div 
        className={`w-full flex justify-center items-center overflow-hidden transition-all duration-300 relative bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 rounded-lg border border-gray-100/50 ${
          isLoading ? 'animate-pulse' : ''
        } ${wrapperMinH}`}
      >
        {/* Fondo elegante del placeholder que se tapará cuando cargue el anuncio */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300">
            <span className="text-xl mb-1">📢</span>
            <span className="text-[9px] uppercase tracking-wider font-medium">Cargando anuncio...</span>
          </div>
        )}
        <ins
          key={refreshKey}
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
