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
    ? 'Technical Interview Preparation Guide | IT Job Portal' 
    : 'Guía de Preparación para Entrevistas Técnicas IT | Portal Trabajo IT';

  const description = isEnglish
    ? 'Comprehensive roadmap to prepare for live coding, system design, and behavioral tech interviews in Spain.'
    : 'Guía completa con trucos, fases de reclutamiento y simulacros para superar con éxito entrevistas de programación y sistemas en España.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/recursos/guia-entrevistas`,
      languages: {
        'es-ES': `${BASE_URL}/recursos/guia-entrevistas`,
        'en': `${BASE_URL}/recursos/guia-entrevistas?lang=en`,
        'x-default': `${BASE_URL}/recursos/guia-entrevistas`,
      }
    }
  };
}

export default async function GuiaEntrevistasPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": isEnglish ? "How to Prepare for a Technical Software Interview" : "Cómo Preparar una Entrevista Técnica de Software",
    "description": isEnglish 
      ? "Step-by-step roadmap to successfully pass developer recruitment phases."
      : "Fases y pasos recomendados para superar con éxito las entrevistas de empleo tecnológico en España.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Screening Call",
        "text": isEnglish 
          ? "Initial HR call to validate CV alignment, cultural fit, and salary range expectations."
          : "Filtro inicial de recursos humanos de 15-20 minutos para validar encaje cultural básico y expectativas de sueldo.",
        "url": `${BASE_URL}/recursos/guia-entrevistas#step1`
      },
      {
        "@type": "HowToStep",
        "name": isEnglish ? "Technical Test" : "Prueba Técnica",
        "text": isEnglish 
          ? "Practical developer skill assessment, either live coding (algorithms) or take-home project."
          : "Evaluación práctica de habilidades de desarrollo mediante ejercicios de algoritmos en vivo o un proyecto para hacer en casa.",
        "url": `${BASE_URL}/recursos/guia-entrevistas#step2`
      },
      {
        "@type": "HowToStep",
        "name": "System Design",
        "text": isEnglish 
          ? "Architecture interview focused on scaling systems (e.g. databases, caches, queues)."
          : "Entrevista de arquitectura y escalabilidad de sistemas (bases de datos, cachés, colas) para perfiles mid/senior.",
        "url": `${BASE_URL}/recursos/guia-entrevistas#step3`
      },
      {
        "@type": "HowToStep",
        "name": isEnglish ? "Behavioral Interview" : "Entrevista Conductual",
        "text": isEnglish 
          ? "HR interview evaluating conflict resolution and team fit using the STAR method."
          : "Evaluación final de habilidades blandas y resolución de conflictos utilizando la metodología STAR.",
        "url": `${BASE_URL}/recursos/guia-entrevistas#step4`
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            💡 Domina el Proceso de Selección
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'Technical Interview Guide' : 'Guía de Entrevistas Técnicas IT'}
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Learn the step-by-step process of engineering recruitment and how to ace every evaluation.'
              : 'Descubre las fases habituales de contratación en el sector tecnológico y cómo superar cada evaluación.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Recursos', href: '/recursos' },
          { label: 'Guía de Entrevistas' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-8">
          
          <AdBanner variant="inline" />

          {/* Fases del Proceso */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-slate-800 pb-3">
              🎯 Las 4 Fases de una Entrevista de Ingeniería de Software
            </h2>
            
            <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-slate-300 font-sans">
              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">1. Screening Call (Filtro Inicial de RRHH)</h3>
                <p className="mt-1">
                  Una llamada telefónica o videollamada corta (15-20 min) para validar tu currículum, encaje cultural básico y tus expectativas salariales. *Consejo:* No facilites un número exacto en esta fase; desvía la pregunta hacia la banda presupuestada.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">2. Prueba Técnica (Live Coding / Take-home Assignment)</h3>
                <p className="mt-1">
                  Evaluación de tus habilidades de desarrollo prácticos. Puede ser una prueba interactiva en vivo (tipo HackerRank o LeetCode con algoritmos) o un pequeño proyecto para resolver en casa en un par de días (Take-home).
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">3. Entrevista de System Design (Diseño de Sistemas)</h3>
                <p className="mt-1">
                  Común para puestos Mid y Senior. Te pedirán diseñar la arquitectura de un sistema a gran escala (ej: "diseña un clon de Twitter o una pasarela de reservas"). Se evalúa tu capacidad de abstracción, uso de bases de datos, cachés y colas.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">4. Entrevista Conductual (Behavioral Interview)</h3>
                <p className="mt-1">
                  Para evaluar tu encaje en el equipo y cómo resuelves conflictos interpersonales. Utiliza la metodología STAR (Situación, Tarea, Acción, Resultado) para estructurar tus respuestas y anécdotas profesionales del pasado.
                </p>
              </div>
            </div>
          </div>

          {/* CTA al Banco de Preguntas */}
          <div className="bg-indigo-50 dark:bg-slate-900/60 p-6 md:p-8 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm text-center space-y-4">
            <h3 className="text-xl font-bold text-indigo-950 dark:text-white">🚀 Practica hoy mismo con nuestro banco de preguntas</h3>
            <p className="text-xs md:text-sm text-indigo-700 dark:text-indigo-400 max-w-xl mx-auto leading-relaxed">
              Hemos preparado listados de preguntas frecuentes con respuestas completas redactadas paso a paso por ingenieros senior para las principales tecnologías.
            </p>
            <div className="pt-2">
              <Link 
                href="/entrevistas"
                className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Ver Banco de Preguntas y Respuestas →
              </Link>
            </div>
          </div>

          <AdBanner variant="multiplex" />

        </div>

        {/* Barra Lateral */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">🔗 Recursos recomendados</h3>
            <div className="flex flex-col gap-2.5 text-xs font-semibold">
              <Link href="/recursos/plantillas-cv" className="text-indigo-650 hover:underline">
                📄 Descargar Plantilla de CV (ATS)
              </Link>
              <Link href="/recursos/portfolio" className="text-indigo-650 hover:underline">
                💻 Guía de Portfolio en GitHub
              </Link>
              <Link href="/salarios" className="text-indigo-650 hover:underline">
                💰 Consultar Banda Salarial IT
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
