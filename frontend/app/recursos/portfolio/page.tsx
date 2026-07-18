import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // Cache 24h

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const title = isEnglish 
    ? 'How to Create a Developer Portfolio | IT Job Portal' 
    : 'Cómo crear un Portafolio de Programador Profesional | Portal Trabajo IT';

  const description = isEnglish
    ? 'Learn how to build a technical portfolio and optimize your GitHub profile to attract tech companies.'
    : 'Guía práctica para construir un portafolio web de desarrollo y optimizar tu cuenta de GitHub para destacar ante recruiters.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/recursos/portfolio`,
      languages: {
        'es-ES': `${BASE_URL}/recursos/portfolio`,
        'en': `${BASE_URL}/recursos/portfolio?lang=en`,
        'x-default': `${BASE_URL}/recursos/portfolio`,
      }
    }
  };
}

export default async function PortfolioPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            💻 Marca Personal e Ingeniería de Software
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'GitHub & Developer Portfolio' : 'Portfolio de Programador en GitHub'}
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Stand out by demonstrating your coding standards, documentation quality, and real projects.'
              : 'Destaca de forma masiva demostrando tu nivel de código, calidad de documentación y proyectos reales.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Recursos', href: '/recursos' },
          { label: 'Portfolio de Programador' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-8">
          
          <AdBanner variant="inline" />

          {/* Guía Rápida */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-slate-800 pb-3">
              🛠️ Los 3 Componentes Clave de un Portfolio de Calidad
            </h2>
            
            <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-slate-300 font-sans">
              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">1. El README de Perfil de GitHub</h3>
                <p className="mt-1">
                  Crea un repositorio especial con el mismo nombre que tu usuario de GitHub. Añade un archivo `README.md` que resuma tu stack tecnológico principal agrupado de forma estructurada, tus metas actuales y enlaces a tus redes y portafolio web personal.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">2. Repositorios Destacados y Compilación (Pins)</h3>
                <p className="mt-1">
                  Usa la función de fijar repositorios públicos de GitHub para mostrar como máximo 3 o 4 proyectos principales. Es preferible tener dos repositorios impecables con documentación, tests y arquitectura ordenada que 10 repositorios desordenados de proyectos escolares.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">3. Documentación del README del Proyecto</h3>
                <p className="mt-1">
                  Cada proyecto fijado debe tener un README estructurado con: enlace visible a la Demo en Vivo (producción), capturas de pantalla, listado de características técnicas complejas (ej: uso de colas de mensajes, optimización de consultas, pasarelas de pago) e instrucciones para ejecutarlo en local.
                </p>
              </div>
            </div>
          </div>

          {/* Enlace al Blog completo */}
          <div className="bg-indigo-50 dark:bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm text-center space-y-4">
            <h3 className="text-xl font-bold text-indigo-950 dark:text-white">📖 Lee nuestra guía maestra completa en el blog</h3>
            <p className="text-xs md:text-sm text-indigo-700 dark:text-indigo-400 max-w-xl mx-auto leading-relaxed">
              Analizamos paso a paso cada detalle para optimizar tu cuenta de GitHub, escribir commits semánticos y estructurar diagramas de arquitectura para impresionar a evaluadores técnicos.
            </p>
            <div className="pt-2">
              <Link 
                href="/blog/portfolio-programador-github-2026"
                className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Ver Guía Completa de GitHub →
              </Link>
            </div>
          </div>

          <AdBanner variant="multiplex" />

        </div>

        {/* Barra Lateral */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">🔗 Más Recursos</h3>
            <div className="flex flex-col gap-2.5 text-xs font-semibold">
              <Link href="/recursos/plantillas-cv" className="text-indigo-650 hover:underline">
                📄 Plantillas de CV optimizadas ATS
              </Link>
              <Link href="/recursos/guia-entrevistas" className="text-indigo-650 hover:underline">
                💡 Guía de Entrevistas Técnicas IT
              </Link>
              <Link href="/trabajos/informatica-tecnologia" className="text-indigo-650 hover:underline">
                💼 Buscar Ofertas de Empleo
              </Link>
            </div>
          </div>

          <div className="sticky top-24">
            <AdBanner variant="sidebar" enableRefresh={true} />
          </div>

        </div>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
