import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { BASE_URL } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';

export const revalidate = 86400; // Cache de 24 horas

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const title = isEnglish 
    ? 'Developer Tools & Resources | IT Job Portal' 
    : 'Herramientas para Programadores y Recursos Tech | Portal Trabajo IT';
  
  const description = isEnglish
    ? 'Discover the best developer utilities, IDEs, cloud hosting providers, and technical training platform recommendations.'
    : 'Descubre las mejores utilidades de desarrollo, IDEs de programación, servidores cloud, bases de datos y plataformas formativas.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/herramientas`,
      languages: {
        'es-ES': `${BASE_URL}/herramientas`,
        'en': `${BASE_URL}/herramientas?lang=en`,
        'x-default': `${BASE_URL}/herramientas`,
      }
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/herramientas`,
    }
  };
}

export default async function HerramientasPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const courseraId = process.env.NEXT_PUBLIC_COURSERA_AFFILIATE_ID || '';
  const getCourseraUrl = (url: string) => {
    if (courseraId) {
      return url.replace('TU_AFFILIATE_ID_COURSERA', courseraId);
    } else {
      return url.replace(/[&?]c=TU_AFFILIATE_ID_COURSERA/, '');
    }
  };

  const tools = {
    software: {
      title: isEnglish ? '💻 IDEs & Development Utilities' : '💻 IDEs y Utilidades de Desarrollo',
      items: [
        {
          name: 'JetBrains IDEs',
          desc: isEnglish 
            ? 'IntelliJ IDEA, WebStorm, PyCharm, PhpStorm. The most powerful developer IDEs in the industry.' 
            : 'IntelliJ IDEA, WebStorm, PyCharm, PhpStorm. Las herramientas más potentes para desarrollo profesional.',
          tag: 'JetBrains',
          cta: isEnglish ? 'Try JetBrains' : 'Probar JetBrains',
          href: 'https://www.jetbrains.com/company/partners/referral/',
          featured: true,
        },
        {
          name: 'Visual Studio Code',
          desc: isEnglish 
            ? 'The most popular free open-source code editor. Highly extensible, lightweight and customizable.' 
            : 'El editor gratuito de código abierto más popular del mundo. Extremadamente extensible, ligero y personalizable.',
          tag: 'Microsoft',
          cta: isEnglish ? 'Download VS Code' : 'Descargar Editor',
          href: 'https://code.visualstudio.com/',
          featured: false,
        },
        {
          name: 'Warp Terminal',
          desc: isEnglish 
            ? 'A modern, AI-powered terminal for developers. Write command lines faster with search and autocompletion.' 
            : 'Una terminal moderna con inteligencia artificial integrada. Escribe comandos más rápido con autocompletado y búsqueda.',
          tag: 'Warp',
          cta: isEnglish ? 'Get Warp' : 'Descargar Warp',
          href: 'https://www.warp.dev/',
          featured: false,
        }
      ]
    },
    hosting: {
      title: isEnglish ? '☁️ Cloud Hosting & Databases' : '☁️ Servidores Cloud y Hosting',
      items: [
        {
          name: 'DigitalOcean Cloud',
          desc: isEnglish 
            ? 'Deploy VPS (droplets), databases and Kubernetes easily. Get $200 free credit to launch your personal projects.' 
            : 'Despliega servidores VPS (droplets), bases de datos y Kubernetes de forma ágil. Consigue 200$ gratis para tus proyectos.',
          tag: 'DigitalOcean',
          cta: isEnglish ? 'Get $200 Free Credit' : 'Conseguir 200$ Gratis',
          href: 'https://m.do.co/c/52bf01704253',
          featured: true,
        },
        {
          name: 'Hostinger Hosting',
          desc: isEnglish 
            ? 'High speed shared hosting for portfolios, personal blogs and WordPress with domain and free SSL.' 
            : 'Hosting compartido de alta velocidad para portafolios web, blogs y WordPress con dominio y certificado SSL gratuito.',
          tag: 'Hostinger',
          cta: isEnglish ? 'Get Discount' : 'Ver Descuentos',
          href: 'https://www.hostinger.es/',
          featured: false,
        },
        {
          name: 'Supabase Serverless DB',
          desc: isEnglish 
            ? 'The open source Firebase alternative. Build PostgreSQL databases, user auth, and real-time APIs in minutes.' 
            : 'La alternativa de código abierto a Firebase. Crea bases de datos PostgreSQL, autenticación y APIs en minutos.',
          tag: 'Supabase',
          cta: isEnglish ? 'Start Supabase' : 'Iniciar Gratis',
          href: 'https://supabase.com/',
          featured: false,
        }
      ]
    },
    cursos: {
      title: isEnglish ? '🎓 Top Training & Certifications' : '🎓 Cursos y Formación Tecnológica',
      items: [
        {
          name: 'Udemy Specialization Courses',
          desc: isEnglish 
            ? 'Access the best online courses in web development, Python, Node, Java and React at promotional rates.' 
            : 'Accede a los mejores cursos online de desarrollo web, Python, Node, Java y React con tarifas promocionales.',
          tag: 'Udemy',
          cta: isEnglish ? 'Explore Courses' : 'Explorar Cursos',
          href: 'https://trk.udemy.com/9VMAEj?subid=herramientas_page',
          featured: true,
        },
        {
          name: 'Coursera Professional Certifications',
          desc: isEnglish 
            ? 'Official career certificates from Google, IBM, Meta and AWS. Accelerate your job search and stand out.' 
            : 'Certificados profesionales oficiales de Google, IBM, Meta y AWS. Acelera tu búsqueda de empleo y destaca.',
          tag: 'Coursera',
          cta: isEnglish ? 'View Certificates' : 'Ver Certificados',
          href: getCourseraUrl('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726?subid=herramientas_page'),
          featured: false,
        }
      ]
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🛠️ Caja de Herramientas del Desarrollador
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'Top Developer Tools & Utilities' : 'Herramientas Recomendadas para Desarrolladores'}
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Our curated selection of essential software, servers, and certification platforms to boost your software development career.'
              : 'Nuestra recopilación seleccionada de herramientas, servidores, IDEs y plataformas de certificación para impulsar tu carrera y tu productividad.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Herramientas' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        
        {/* Banner publicitario inline superior */}
        <div className="mb-10">
          <AdBanner variant="inline" />
        </div>

        {/* Listado de herramientas */}
        <div className="space-y-12">
          {Object.entries(tools).map(([key, section], idx) => (
            <section key={key} className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="h-px bg-gray-200 dark:bg-slate-800 flex-grow" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {section.items.map((item) => (
                  <div 
                    key={item.name}
                    className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full relative ${
                      item.featured 
                        ? 'border-indigo-200 shadow-md shadow-indigo-500/5 dark:border-indigo-900/40 hover:scale-[1.01]' 
                        : 'border-gray-150 dark:border-slate-800 hover:shadow-md'
                    }`}
                  >
                    {item.featured && (
                      <span className="absolute top-4 right-4 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900 uppercase tracking-wide">
                        {isEnglish ? 'Featured' : 'Destacado'}
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-950 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-6">
                      <a 
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className={`w-full py-2.5 px-4 rounded-xl text-center block text-xs font-bold transition-all ${
                          item.featured
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {item.cta}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Intercalar anuncios inline en la navegación */}
              {idx === 0 && (
                <div className="my-8 pt-4">
                  <AdBanner variant="inline" />
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Banner inferior */}
        <div className="mt-14">
          <AdBanner variant="multiplex" />
        </div>

      </div>
    </main>
  );
}
