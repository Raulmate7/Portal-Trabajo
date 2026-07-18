import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // Cache de 24 horas para páginas estáticas de recursos

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const title = isEnglish 
    ? 'Developer Resources & Tech Tools | IT Job Portal' 
    : 'Recursos para Programadores y Herramientas Tech | Portal Trabajo IT';
  
  const description = isEnglish
    ? 'Curated list of the best development tools, online courses, hosting services, and resume templates for software engineers.'
    : 'Lista seleccionada de los mejores cursos de programación, IDEs, hosting, libros de arquitectura y herramientas de CV para informáticos.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/recursos`,
      languages: {
        'es-ES': `${BASE_URL}/recursos`,
        'en': `${BASE_URL}/recursos?lang=en`,
        'x-default': `${BASE_URL}/recursos`,
      }
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/recursos`,
    }
  };
}

export default async function RecursosPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG || '';
  const getAmazonUrl = (url: string) => {
    if (amazonTag) {
      return url.replace('TU_AMAZON_TAG', amazonTag);
    } else {
      return url.replace(/[&?]tag=TU_AMAZON_TAG/, '');
    }
  };

  const courseraId = process.env.NEXT_PUBLIC_COURSERA_AFFILIATE_ID || '';
  const getCourseraUrl = (url: string) => {
    if (courseraId) {
      return url.replace('TU_AFFILIATE_ID_COURSERA', courseraId);
    } else {
      return url.replace(/[&?]c=TU_AFFILIATE_ID_COURSERA/, '');
    }
  };

  const resources = {
    formacion: {
      title: isEnglish ? '🎓 Top Courses & Certifications' : '🎓 Cursos y Certificaciones',
      items: [
        {
          name: 'Udemy Bestsellers',
          desc: isEnglish ? 'Access the best online courses in web development, Python, Node, Java and React at promotional rates.' : 'Accede a los mejores cursos online de desarrollo web, Python, Node, Java y React con tarifas promocionales.',
          tag: 'Udemy',
          cta: isEnglish ? 'Explore Courses' : 'Explorar Cursos',
          href: 'https://trk.udemy.com/9VMAEj?subid=recursos_page',
          featured: true,
        },
        {
          name: 'Coursera Professional Certifications',
          desc: isEnglish ? 'Official career certificates from Google, IBM, Meta and AWS. Accelerate your job search.' : 'Certificados profesionales oficiales de Google, IBM, Meta y AWS. Acelera tu búsqueda de empleo.',
          tag: 'Coursera',
          cta: isEnglish ? 'View Certificates' : 'Ver Certificados',
          href: getCourseraUrl('https://coursera.pxf.io/c/TU_AFFILIATE_ID_COURSERA/1164968/14726?subid=recursos_page'),
          featured: false,
        }
      ]
    },
    ides: {
      title: isEnglish ? '💻 IDEs & Development Editors' : '💻 IDEs y Editores de Código',
      items: [
        {
          name: 'JetBrains IDEs',
          desc: isEnglish ? 'IntelliJ IDEA, WebStorm, PyCharm, PhpStorm. Professional developer tools for high performance.' : 'IntelliJ IDEA, WebStorm, PyCharm, PhpStorm. Las herramientas más potentes para desarrollo profesional.',
          tag: 'JetBrains',
          cta: isEnglish ? 'Get Free Trial' : 'Probar Gratis',
          href: 'https://www.jetbrains.com/company/partners/referral/',
          featured: false,
        },
        {
          name: 'Visual Studio Code',
          desc: isEnglish ? 'The most popular free open-source code editor. Highly extensible and lightweight.' : 'El editor gratuito de código abierto más popular del mundo. Extremadamente extensible y ligero.',
          tag: 'Microsoft',
          cta: isEnglish ? 'Download VS Code' : 'Download Editor',
          href: 'https://code.visualstudio.com/',
          featured: false,
        }
      ]
    },
    cv: {
      title: isEnglish ? '📄 ATS-Optimized Resume Builders' : '📄 Creación de CV y Empleo',
      items: [
        {
          name: isEnglish ? 'ATS Resume Templates' : 'Plantillas de CV optimizadas para ATS',
          desc: isEnglish ? 'Download our free professional tech resume templates designed to pass recruiter filters easily.' : 'Descarga nuestras plantillas gratuitas de currículum técnico optimizadas para superar los filtros ATS de los reclutadores.',
          tag: 'Portal Empleo',
          cta: isEnglish ? 'View Templates' : 'Ver Plantillas',
          href: '/recursos/plantillas-cv' + queryParam,
          featured: true,
        },
        {
          name: isEnglish ? 'Technical Interview Prep Guide' : 'Guía de Preparación para Entrevistas',
          desc: isEnglish ? 'Tips and strategies to pass tech interviews in Spain. Focus on junior, mid, and senior levels.' : 'Consejos y estrategias prácticas para superar entrevistas técnicas en España. Enfoque para junior, mid y senior.',
          tag: 'Portal Empleo',
          cta: isEnglish ? 'Read Guide' : 'Leer Guía',
          href: '/recursos/guia-entrevistas' + queryParam,
          featured: false,
        },
        {
          name: isEnglish ? 'GitHub Portfolio Guide' : 'Cómo diseñar tu Portfolio en GitHub',
          desc: isEnglish ? 'Step-by-step guide to build a developer portfolio that impresses engineering managers.' : 'Guía paso a paso para crear un portafolio de programador que llame la atención de líderes técnicos.',
          tag: 'Portal Empleo',
          cta: isEnglish ? 'Read Guide' : 'Leer Guía',
          href: '/recursos/portfolio' + queryParam,
          featured: false,
        }
      ]
    },
    hosting: {
      title: isEnglish ? '☁️ Cloud Hosting & Project Servers' : '☁️ Servidores y Hosting Web',
      items: [
        {
          name: 'DigitalOcean Cloud',
          desc: isEnglish ? 'Deploy VPS servers (droplets), databases and Kubernetes easily. Ideal for personal projects and APIs.' : 'Despliega servidores VPS (droplets), bases de datos y Kubernetes de forma ágil. Ideal para proyectos y APIs.',
          tag: 'DigitalOcean',
          cta: isEnglish ? 'Get $200 Free Credit' : 'Conseguir 200$ Gratis',
          href: 'https://m.do.co/c/52bf01704253',
          featured: true,
        },
        {
          name: 'Hostinger Hosting',
          desc: isEnglish ? 'High performance shared hosting for portfolio websites, blogs and WordPress with free SSL.' : 'Hosting compartido de alta velocidad para portafolios web, blogs y WordPress con dominio y SSL gratis.',
          tag: 'Hostinger',
          cta: isEnglish ? 'Get Discounted Hosting' : 'Ver Planes de Hosting',
          href: 'https://www.hostinger.es/',
          featured: false,
        }
      ]
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-955 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🛠️ Stacks, Hosting, Formación y Herramientas
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {isEnglish ? 'Developer Tools & Resources' : 'Recursos y Herramientas Tech'}
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Our curated selection of the best tools, hosting services, tech books and certifications to boost your developer career.'
              : 'Nuestra selección recomendada de herramientas, servidores, libros y cursos estrella para potenciar tu carrera y destacar en procesos de selección.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        
        {/* Banner publicitario inline */}
        <div className="mb-10">
          <AdBanner variant="inline" />
        </div>

        {/* Rejilla de Recursos por Categorías */}
        <div className="space-y-12">
          {Object.entries(resources).map(([key, section], idx) => (
            <section key={key} className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="h-px bg-gray-200 dark:bg-slate-800 flex-grow" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.items.map((item) => (
                  <div 
                    key={item.name}
                    className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full relative ${
                      item.featured 
                        ? 'border-indigo-200 shadow-md shadow-indigo-500/5 dark:border-indigo-900/40' 
                        : 'border-gray-150 dark:border-slate-800 hover:shadow-md'
                    }`}
                  >
                    {item.featured && (
                      <span className="absolute top-4 right-4 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900 uppercase tracking-wide">
                        {isEnglish ? 'Recommended' : 'Recomendado'}
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
                      <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
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

              {/* Intercalar anuncios inline en ciertas secciones */}
              {idx === 1 && (
                <div className="my-8 pt-4">
                  <AdBanner variant="inline" />
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Banner Multiplex inferior */}
        <div className="mt-14">
          <AdBanner variant="multiplex" />
        </div>

      </div>
    </main>
  );
}
