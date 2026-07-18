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
    ? 'Free ATS-Friendly Tech Resume Templates | IT Job Portal' 
    : 'Plantillas de CV para Programadores Gratis (Formato ATS) | Portal Trabajo IT';

  const description = isEnglish
    ? 'Download free professional developer resume templates designed specifically to pass automatic recruiter ATS scanners.'
    : 'Descarga gratis plantillas profesionales de currículum para programadores e ingenieros de software, diseñadas para pasar filtros ATS.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/recursos/plantillas-cv`,
      languages: {
        'es-ES': `${BASE_URL}/recursos/plantillas-cv`,
        'en': `${BASE_URL}/recursos/plantillas-cv?lang=en`,
        'x-default': `${BASE_URL}/recursos/plantillas-cv`,
      }
    }
  };
}

export default async function PlantillasCvPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": isEnglish ? "How to Create an ATS-Friendly Tech Resume" : "Cómo Crear un CV de Programador Compatible con ATS",
    "description": isEnglish
      ? "Step-by-step instructions to design a technical resume that passes recruiter screening systems."
      : "Pasos recomendados para estructurar y formatear un currículum tecnológico que supere los filtros automáticos ATS.",
    "step": [
      {
        "@type": "HowToStep",
        "name": isEnglish ? "Use a Single-Column Layout" : "Usar Layout de Una Columna",
        "text": isEnglish 
          ? "ATS parsers read left-to-right and top-to-bottom. Avoid multiple sidebars."
          : "Diseña tu CV en una sola columna para que los robots rastreadores no mezclen el contenido de forma lateral.",
        "url": `${BASE_URL}/recursos/plantillas-cv#step1`
      },
      {
        "@type": "HowToStep",
        "name": isEnglish ? "Keep Text Plain and Standard" : "Usar Texto Plano Legible",
        "text": isEnglish 
          ? "Use standard fonts like Calibri or Arial, avoiding complex graphical text elements."
          : "Usa fuentes tipográficas estándar y evita tablas, cajas de texto cruzadas o gráficos complejos.",
        "url": `${BASE_URL}/recursos/plantillas-cv#step2`
      },
      {
        "@type": "HowToStep",
        "name": isEnglish ? "Integrate Contextual Keywords" : "Integrar Palabras Clave de la Oferta",
        "text": isEnglish 
          ? "Include the exact names of technologies mentioned in the job description."
          : "Añade las tecnologías exactas (ej. React, Python) tal y como aparecen descritas en la oferta de empleo.",
        "url": `${BASE_URL}/recursos/plantillas-cv#step3`
      },
      {
        "@type": "HowToStep",
        "name": isEnglish ? "Avoid Skill Progress Bars" : "Evitar Barras de Nivel Gráficas",
        "text": isEnglish 
          ? "Don't state skills in percentage bars like React: 80%. List years of hands-on experience instead."
          : "No uses porcentajes gráficos para puntuar tus stacks (ej. React: 80%). Especifica tus años de experiencia reales.",
        "url": `${BASE_URL}/recursos/plantillas-cv#step4`
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
            📄 Formato Profesional Aprobado por Recruiters
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'ATS-Optimized Resume Templates' : 'Plantillas de CV para Programadores'}
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Download our free templates designed to pass automated screening filters and secure more interviews.'
              : 'Descarga nuestras plantillas profesionales gratuitas, diseñadas en base a las mejores prácticas para superar filtros ATS automáticos.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Recursos', href: '/recursos' },
          { label: 'Plantillas de CV' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-8">
          
          <AdBanner variant="inline" />

          {/* Guía ATS */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-slate-800 pb-3">
              <span>🤖</span> ¿Qué es un CV compatible con ATS y por qué lo necesitas?
            </h2>
            <div className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed space-y-3 font-sans">
              <p>
                Los **ATS (Applicant Tracking Systems)** son sistemas informáticos que los reclutadores de las grandes empresas tecnológicas en España (y startups de rápido crecimiento) utilizan para automatizar y filtrar las candidaturas de empleo.
              </p>
              <p>
                Casi el **70% de los CVs en formato PDF son descartados de forma automática** por robots de cribado antes de que un ser humano llegue a leerlos, debido a layouts complejos con múltiples columnas, tablas, barras de progreso de habilidades gráficas o formatos de archivo ilegibles para el parser del sistema.
              </p>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm pt-2 uppercase tracking-wide">Claves para un currículum técnico perfecto:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Layout de una sola columna:</strong> Los parsers leen de arriba a abajo y de izquierda a derecha. Las columnas cruzadas rompen la lógica de lectura.</li>
                <li><strong>Texto plano legible:</strong> Evita cajas de texto y gráficos. Usa tipografía estándar (Arial, Calibri o Inter).</li>
                <li><strong>Palabras clave contextuales:</strong> Integra los nombres de las tecnologías tal cual aparecen en la descripción de la oferta.</li>
                <li><strong>Sin barras de nivel de habilidad:</strong> Indicar "React: 80%" no aporta valor estadístico al robot y puede confundir al parser. Describe tus años de experiencia práctica.</li>
              </ul>
            </div>
          </div>

          {/* Listado de Plantillas descargables */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📂 Plantillas Gratuitas para Descargar
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Plantilla de CV Minimalista ATS',
                  desc: 'El diseño limpio definitivo de una sola columna recomendado por Google y Amazon. Ideal para desarrolladores de cualquier nivel.',
                  format: 'PDF / Word (.docx)',
                  href: '/descargas/plantilla_cv_minimalista_it.docx',
                  color: 'indigo',
                },
                {
                  title: 'Plantilla para Ingenieros de Datos / Cloud',
                  desc: 'Estructurada para dar visibilidad clara a las certificaciones cloud, arquitecturas complejas y herramientas de datos.',
                  format: 'PDF / Word (.docx)',
                  href: '/descargas/plantilla_cv_cloud_data.docx',
                  color: 'emerald',
                }
              ].map((tpl) => (
                <div key={tpl.title} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {tpl.format}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{tpl.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{tpl.desc}</p>
                  </div>
                  <div className="pt-4">
                    <a 
                      href={tpl.href} 
                      download 
                      className="w-full text-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors block shadow-sm cursor-pointer"
                    >
                      📥 Descargar Plantilla Gratis
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AdBanner variant="multiplex" />

        </div>

        {/* Barra Lateral */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-gradient-to-br from-indigo-900 to-violet-950 text-white p-6 rounded-2xl shadow-sm border border-indigo-950 relative overflow-hidden">
            <h3 className="font-bold mb-2 text-sm">📧 ¿Quieres recibir ofertas adaptadas a tu perfil?</h3>
            <p className="text-xs text-indigo-200 mb-4 leading-relaxed">Únete a nuestra newsletter semanal y recibe vacantes de empleo con salarios visibles acordes a tu currículum.</p>
            <Link 
              href="/newsletter"
              className="block w-full text-center py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl text-xs transition-all shadow-md"
            >
              Suscribirme al Boletín →
            </Link>
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
