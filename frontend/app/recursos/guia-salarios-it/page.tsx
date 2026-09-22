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
    ? 'IT Salary Guide Spain [2026] | Tech Compensation Roadmap'
    : 'Guía de Salarios IT en España [2026] | Informe de Remuneración Tech';

  const description = isEnglish
    ? 'Complete salary guide for software developers in Spain. Average compensation by role, experience level (Junior, Mid, Senior), and remote vs on-site.'
    : 'Guía salarial completa para desarrolladores de software en España. Retribuciones medias por rol, nivel de experiencia (Junior, Mid, Senior) y modalidad de trabajo.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/recursos/guia-salarios-it`,
      languages: {
        'es-ES': `${BASE_URL}/recursos/guia-salarios-it`,
        'en': `${BASE_URL}/recursos/guia-salarios-it?lang=en`,
        'x-default': `${BASE_URL}/recursos/guia-salarios-it`,
      }
    }
  };
}

export default async function GuiaSalariosITPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": isEnglish ? "Tech Salary Guide in Spain 2026" : "Guía de Salarios e Informe Retributivo IT en España 2026",
    "description": isEnglish
      ? "Comprehensive reference for software engineering compensation in Spain."
      : "Informe de remuneración de referencia para ingenieros de software, DevOps, Data y desarrolladores móviles en España.",
    "author": {
      "@type": "Organization",
      "name": "Portal Trabajo IT",
      "url": BASE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "Portal Trabajo IT",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/og-image.png`
      }
    },
    "datePublished": "2026-01-15",
    "dateModified": "2026-07-01"
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": isEnglish ? "How to Negotiate Your Tech Salary in Spain" : "Cómo Negociar tu Salario Tecnológico en España",
    "description": isEnglish 
      ? "Strategic steps to prepare and present your salary expectation during recruitment."
      : "Pasos estratégicos para preparar y defender tu horquilla salarial en procesos de selección.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Investigación de Mercado",
        "text": "Consulta datos agregados reales por tecnología y ciudad en la Calculadora de Salarios IT.",
        "url": `${BASE_URL}/recursos/guia-salarios-it#step1`
      },
      {
        "@type": "HowToStep",
        "name": "Demostración de Impacto",
        "text": "Prepara métricas cuantitativas de tus proyectos pasados y competencias clave.",
        "url": `${BASE_URL}/recursos/guia-salarios-it#step2`
      },
      {
        "@type": "HowToStep",
        "name": "Definición de Rango Bruto",
        "text": "Establece tu banda mínima aceptable y tu objetivo óptimo antes de la llamada de filtro.",
        "url": `${BASE_URL}/recursos/guia-salarios-it#step3`
      }
    ]
  };

  const salaryData = [
    { role: 'Backend Developer (Node / Java / Python)', junior: '24.000€ - 30.000€', mid: '38.000€ - 50.000€', senior: '55.000€ - 75.000€' },
    { role: 'Frontend Developer (React / Angular / Vue)', junior: '22.000€ - 28.000€', mid: '35.000€ - 46.000€', senior: '50.000€ - 68.000€' },
    { role: 'Fullstack Developer', junior: '25.000€ - 32.000€', mid: '40.000€ - 52.000€', senior: '58.000€ - 78.000€' },
    { role: 'DevOps & Cloud Engineer (AWS / K8s)', junior: '28.000€ - 36.000€', mid: '45.000€ - 60.000€', senior: '65.000€ - 90.000€' },
    { role: 'Data Scientist & Machine Learning', junior: '26.000€ - 34.000€', mid: '42.000€ - 58.000€', senior: '60.000€ - 85.000€' },
    { role: 'Mobile Developer (Flutter / React Native)', junior: '23.000€ - 30.000€', mid: '36.000€ - 48.000€', senior: '52.000€ - 70.000€' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            💰 Informe Retributivo de Mercado
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Guía de Salarios IT en España
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Descubre las bandas salariales reales por especialidad, nivel de experiencia y modalidad de trabajo (remoto vs presencial).
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Recursos', href: '/recursos' },
          { label: 'Guía de Salarios IT' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-8">
          
          <AdBanner variant="inline" />

          {/* Tabla Resumen de Salarios */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span>📊</span> Bandas Salariales Medias en España (Bruto Anual)
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Estadísticas obtenidas a partir del análisis continuado de ofertas de empleo activas en nuestro portal.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-50/70 text-indigo-950 font-extrabold border-b border-indigo-100">
                    <th className="p-3.5">Especialidad</th>
                    <th className="p-3.5">Junior (0-2 años)</th>
                    <th className="p-3.5">Mid (2-5 años)</th>
                    <th className="p-3.5">Senior (5+ años)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {salaryData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900">{row.role}</td>
                      <td className="p-3.5 text-gray-600">{row.junior}</td>
                      <td className="p-3.5 font-semibold text-indigo-700">{row.mid}</td>
                      <td className="p-3.5 font-bold text-emerald-700">{row.senior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Factores que influyen en el salario */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-sm text-gray-700 leading-relaxed">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              💡 Los 4 Factores que Más Incrementan tu Sueldo Tech
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-950 text-base">1. Teletrabajo e Internacionalización</h4>
                <p className="mt-1">
                  Las empresas extranjeras (EEUU, Reino Unido, Alemania) que contratan en remoto en España suelen ofrecer retribuciones entre un **25% y un 50% superiores** a la media local.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-950 text-base">2. Nivel de Inglés Técnico y Fluidez Hablada</h4>
                <p className="mt-1">
                  Poder participar con fluidez en reuniones técnicas internacionales abre la puerta a posiciones Staff y Lead con sueldos superiores a los **70.000€/año**.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-950 text-base">3. Especialización en Cloud & DevOps</h4>
                <p className="mt-1">
                  La escasez de perfiles capaces de diseñar infraestructuras escalables en AWS o Kubernetes mantiene a DevOps e Ingenieros Cloud al frente del ranking salarial.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-950 text-base">4. Arquitectura de Sistemas y System Design</h4>
                <p className="mt-1">
                  Saber estructurar aplicaciones para millones de usuarios (microservicios, cachés, tolerancia a fallos) es la competencia clave solicitada para bandas Senior.
                </p>
              </div>
            </div>
          </div>

          {/* CTA a la Calculadora */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 md:p-8 rounded-2xl shadow-lg text-center space-y-4">
            <h3 className="text-2xl font-black">💰 Calcula tu Salario Específico</h3>
            <p className="text-xs md:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Filtra por tu tecnología exacta, tu ciudad (o remoto) y tu nivel de experiencia en nuestra herramienta gratuita en tiempo real.
            </p>
            <div>
              <Link 
                href="/salarios"
                className="inline-block py-3 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Ir a la Calculadora Salarial →
              </Link>
            </div>
          </div>

          <AdBanner variant="multiplex" />

        </div>

        {/* Barra Lateral */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-950 text-sm">🔍 Accesos Rápidos por Ciudad</h3>
            <div className="flex flex-col gap-2.5 text-xs font-semibold">
              <Link href="/salarios/react/madrid" className="text-indigo-650 hover:underline">
                📍 Salario React en Madrid
              </Link>
              <Link href="/salarios/node/remoto" className="text-indigo-650 hover:underline">
                📍 Salario Node.js en Remoto
              </Link>
              <Link href="/salarios/python/barcelona" className="text-indigo-650 hover:underline">
                📍 Salario Python en Barcelona
              </Link>
              <Link href="/salarios/java/madrid" className="text-indigo-650 hover:underline">
                📍 Salario Java en Madrid
              </Link>
              <Link href="/empresas-remotas" className="text-indigo-650 hover:underline font-bold text-emerald-700">
                🏠 Ranking Empresas Remoto
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
