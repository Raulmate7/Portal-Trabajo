import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // Cache de 24 horas (SSG)

const TECH_HUB_DATA: Record<string, { name: string; tag: string; descEs: string; descEn: string; udemyQuery: string }> = {
  react: {
    name: 'React',
    tag: 'Frontend',
    descEs: 'Ecosistema completo de React: Next.js, Redux, Tailwind, preguntas de entrevista y bandas salariales en España.',
    descEn: 'Complete React ecosystem: Next.js, Redux, Tailwind, interview questions and salary bands in Spain.',
    udemyQuery: 'react+nextjs'
  },
  python: {
    name: 'Python',
    tag: 'Data & Backend',
    descEs: 'Recursos de Python para Ciencia de Datos, Inteligencia Artificial, FastAPI y Django con análisis salarial.',
    descEn: 'Python resources for Data Science, Artificial Intelligence, FastAPI and Django with salary analysis.',
    udemyQuery: 'python+data+science'
  },
  java: {
    name: 'Java',
    tag: 'Enterprise Backend',
    descEs: 'Guías de desarrollo enterprise con Java y Spring Boot, pruebas de nivel, entrevistas y ofertas activas.',
    descEn: 'Enterprise development guides with Java and Spring Boot, skill tests, interviews and active openings.',
    udemyQuery: 'java+spring+boot'
  },
  node: {
    name: 'Node.js',
    tag: 'Backend JavaScript',
    descEs: 'Desarrollo backend rápido y escalable en Node.js, Express, NestJS y arquitecturas de microservicios.',
    descEn: 'Fast and scalable backend development in Node.js, Express, NestJS and microservices architectures.',
    udemyQuery: 'nodejs+express'
  },
  aws: {
    name: 'AWS Cloud',
    tag: 'Cloud & DevOps',
    descEs: 'Certificaciones oficial de Amazon Web Services, arquitecturas serverless, Terraform y salarios Cloud.',
    descEn: 'Official Amazon Web Services certifications, serverless architectures, Terraform and Cloud salaries.',
    udemyQuery: 'aws+cloud+architect'
  },
  docker: {
    name: 'Docker & Containers',
    tag: 'DevOps',
    descEs: 'Contenerización de aplicaciones, Kubernetes, CI/CD pipelines y mejores prácticas para producción.',
    descEn: 'App containerization, Kubernetes, CI/CD pipelines and best practices for production.',
    udemyQuery: 'docker+kubernetes'
  },
  devops: {
    name: 'DevOps & SRE',
    tag: 'Cloud & Infrastructure',
    descEs: 'Cultura DevOps, automatización de infraestructura, CI/CD, monitoreo y salarios senior en España.',
    descEn: 'DevOps culture, infrastructure automation, CI/CD, monitoring and senior salaries in Spain.',
    udemyQuery: 'devops+kubernetes+aws'
  },
  typescript: {
    name: 'TypeScript',
    tag: 'Frontend & Backend',
    descEs: 'Tipado estático en JavaScript, integración con React y Node, patrones de diseño y entrevistas.',
    descEn: 'Static typing in JavaScript, React and Node integration, design patterns and interviews.',
    udemyQuery: 'typescript'
  },
  frontend: {
    name: 'Frontend Web Development',
    tag: 'Frontend',
    descEs: 'Herramientas modernas para desarrolladores web frontend: HTML5, CSS3, JS, React, Vue, Angular y rendimiento web.',
    descEn: 'Modern tools for frontend web developers: HTML5, CSS3, JS, React, Vue, Angular and web performance.',
    udemyQuery: 'frontend+web+development'
  },
  backend: {
    name: 'Backend Engineering',
    tag: 'Backend',
    descEs: 'Arquitectura de software, bases de datos SQL/NoSQL, APIs REST/GraphQL y optimización de servidores.',
    descEn: 'Software architecture, SQL/NoSQL databases, REST/GraphQL APIs and server optimization.',
    udemyQuery: 'backend+web+development'
  },
  data: {
    name: 'Data Science & AI',
    tag: 'Data & Artificial Intelligence',
    descEs: 'Análisis de datos, Machine Learning, PowerBI, SQL, Python y modelos de lenguaje de última generación.',
    descEn: 'Data analytics, Machine Learning, PowerBI, SQL, Python and state-of-the-art language models.',
    udemyQuery: 'data+science+ai'
  }
};

export async function generateStaticParams() {
  return Object.keys(TECH_HUB_DATA).map((tech) => ({ tech }));
}

type Props = {
  params: Promise<{ tech: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const tech = resolvedParams.tech.toLowerCase();
  const techData = TECH_HUB_DATA[tech] || {
    name: tech.charAt(0).toUpperCase() + tech.slice(1),
    descEs: `Recursos seleccionados, cursos, salarios y empleos para ${tech}.`,
    descEn: `Curated resources, courses, salaries and job openings for ${tech}.`
  };

  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const title = isEnglish
    ? `${techData.name} Developer Resources & Career Guide | IT Job Portal`
    : `Recursos para Programadores ${techData.name}: Guías, Salarios y Empleo`;

  const description = isEnglish ? techData.descEn : techData.descEs;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/recursos/${tech}`,
      languages: {
        'es-ES': `${BASE_URL}/recursos/${tech}`,
        'en': `${BASE_URL}/recursos/${tech}?lang=en`,
        'x-default': `${BASE_URL}/recursos/${tech}`,
      }
    },
    openGraph: { title, description, url: `${BASE_URL}/recursos/${tech}` }
  };
}

export default async function TechResourceHubPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const tech = resolvedParams.tech.toLowerCase();
  const techData = TECH_HUB_DATA[tech] || {
    name: tech.charAt(0).toUpperCase() + tech.slice(1),
    tag: 'Tecnología',
    descEs: `Aprende y especialízate en ${tech}. Accede a formación de calidad, banda salarial del mercado y ofertas activas.`,
    descEn: `Learn and specialize in ${tech}. Access quality training, market salary ranges and active openings.`,
    udemyQuery: tech
  };

  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  const udemyLink = `https://trk.udemy.com/9VMAEj?subid=recursos_${tech}&ulp=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3D${techData.udemyQuery}`;

  return (
    <main className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white py-14 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
            🛠️ Hub de Recursos & Carrera
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            {isEnglish ? `${techData.name} Resources & Developer Guide` : `Recursos para Programadores ${techData.name}`}
          </h1>
          <p className="text-indigo-200 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {isEnglish ? techData.descEn : techData.descEs}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        
        <AdBanner variant="inline" />

        {/* Tarjetas de Accesos Rápidos SEO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href={`/salarios/${tech}${queryParam}`}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all group"
          >
            <span className="text-3xl block mb-3">💰</span>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-650 transition-colors">
              {isEnglish ? `${techData.name} Salary Guide` : `Salarios de ${techData.name}`}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {isEnglish ? 'Explore real salary data by city and experience.' : 'Consulta datos salariales reales ajustados por experiencia.'}
            </p>
            <span className="inline-block mt-4 text-xs font-bold text-indigo-600 group-hover:underline">
              {isEnglish ? 'View Salaries →' : 'Ver Salarios →'}
            </span>
          </Link>

          <Link
            href={`/entrevistas/${tech}${queryParam}`}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all group"
          >
            <span className="text-3xl block mb-3">🎯</span>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-650 transition-colors">
              {isEnglish ? `${techData.name} Technical Questions` : `Preguntas de Entrevista`}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {isEnglish ? 'Prepare for technical interviews with real questions.' : 'Supera entrevistas técnicas con nuestro banco de preguntas.'}
            </p>
            <span className="inline-block mt-4 text-xs font-bold text-indigo-600 group-hover:underline">
              {isEnglish ? 'Prepare Interview →' : 'Preparar Entrevista →'}
            </span>
          </Link>

          <Link
            href={`/trabajos/${tech}${queryParam}`}
            className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all group"
          >
            <span className="text-3xl block mb-3">💼</span>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-650 transition-colors">
              {isEnglish ? `Active ${techData.name} Jobs` : `Ofertas de ${techData.name}`}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {isEnglish ? 'Browse verified active job vacancies today.' : 'Explora vacantes de empleo activas y actualizadas hoy.'}
            </p>
            <span className="inline-block mt-4 text-xs font-bold text-indigo-600 group-hover:underline">
              {isEnglish ? 'View Openings →' : 'Ver Vacantes →'}
            </span>
          </Link>
        </div>

        {/* Sección Formación Recomendada */}
        <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEnglish ? `Recommended ${techData.name} Courses` : `Formación Recomendada en ${techData.name}`}
              </h2>
              <p className="text-xs text-gray-500">
                {isEnglish ? 'Cursos prácticos para dominar el stack y conseguir un mejor sueldo.' : 'Cursos con proyectos reales para impulsar tu perfil laboral.'}
              </p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                ⭐ CURSO DESTACADO EN UDEMY
              </span>
              <h3 className="text-lg font-bold">
                {isEnglish ? `Mastering ${techData.name} for Production` : `Dominando ${techData.name} para Entornos Reales`}
              </h3>
              <p className="text-xs text-indigo-200 mt-1 leading-relaxed max-w-xl">
                {isEnglish ? `Learn ${techData.name} step-by-step with practical projects, tests and best architecture practices.` : `Aprende ${techData.name} paso a paso con proyectos prácticos, pruebas y buenas prácticas de arquitectura.`}
              </p>
            </div>
            <a
              href={udemyLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="shrink-0 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all"
            >
              {isEnglish ? 'Explore Courses →' : 'Explorar Cursos →'}
            </a>
          </div>
        </section>

        {/* Enlaces de Interlinking Adicional */}
        <div className="pt-6 border-t border-gray-200 text-center">
          <Link href={`/recursos${queryParam}`} className="text-xs font-bold text-indigo-600 hover:underline">
            {isEnglish ? '← Back to all Developer Resources' : '← Volver al catálogo general de Recursos Tech'}
          </Link>
        </div>

        <AdBanner variant="multiplex" />
      </div>
    </main>
  );
}
