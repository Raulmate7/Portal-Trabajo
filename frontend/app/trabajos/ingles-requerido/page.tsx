import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import PushSubscribe from "@/components/PushSubscribe";
import AdBanner from "@/components/AdBanner";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import { getJobSlug } from "@/lib/slug";

export const revalidate = 3600; // Cache de 1 hora

interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at: string;
  salary?: string | null;
  title_es?: string | null;
}

async function getEnglishRequiredJobs(): Promise<Job[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT id, title, title_es, company, location, url_source, description_snippet, category, created_at, salary 
      FROM jobs 
      WHERE is_active = TRUE 
        AND (
          title ILIKE '%inglés%'
          OR title ILIKE '%ingles%'
          OR title ILIKE '%english%'
          OR title ILIKE '%bilingual%'
          OR title ILIKE '%bilingüe%'
          OR title ILIKE '%bilingue%'
          OR description_snippet ILIKE '%inglés%'
          OR description_snippet ILIKE '%ingles%'
          OR description_snippet ILIKE '%english%'
          OR description_snippet ILIKE '%bilingual%'
          OR description_snippet ILIKE '%bilingüe%'
          OR description_snippet ILIKE '%bilingue%'
        )
      ORDER BY created_at DESC
      LIMIT 30
    `;
    const result = await client.query(sql);
    let jobs = result.rows;

    // Si no hay suficientes ofertas con palabras clave de inglés, traemos las ofertas de empleo IT más recientes
    if (jobs.length < 12) {
      const needed = 30 - jobs.length;
      const excludeIds = jobs.map((j: any) => j.id);
      
      let fallbackSql = `
        SELECT id, title, title_es, company, location, url_source, description_snippet, category, created_at, salary 
        FROM jobs 
        WHERE is_active = TRUE
      `;
      const fallbackParams = [];
      if (excludeIds.length > 0) {
        fallbackSql += ` AND id NOT IN (${excludeIds.map((_: any, i: number) => `$${i+1}`).join(',')})`;
        fallbackParams.push(...excludeIds);
      }
      fallbackSql += ` ORDER BY created_at DESC LIMIT $${fallbackParams.length + 1}`;
      fallbackParams.push(needed);

      const fallbackResult = await client.query(fallbackSql, fallbackParams);
      jobs = [...jobs, ...fallbackResult.rows];
    }

    return jobs;
  } catch (error) {
    console.error("Error cargando ofertas de inglés requerido:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "Ofertas de Empleo IT con Inglés Requerido [2026]";
  const description = "Encuentra ofertas de trabajo de programación y tecnología que requieren inglés en España. Guía de preparación de currículum y entrevistas en inglés.";
  const canonicalUrl = `${BASE_URL}/trabajos/ingles-requerido`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'es-ES': canonicalUrl,
      }
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: `${BASE_URL}/images/og-english.png`,
          width: 1200,
          height: 630,
          alt: "Ofertas de empleo IT con inglés requerido",
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function InglesRequeridoPage() {
  const jobs = await getEnglishRequiredJobs();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Trabajos', href: '/trabajos/informatica-tecnologia' },
    { label: 'Inglés Requerido' }
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? `${BASE_URL}${item.href}` : undefined
    }))
  };

  const faqItems = [
    {
      question: "¿Qué nivel de inglés se necesita realmente para programar?",
      answer: "Para la mayoría de puestos de desarrollo con inglés requerido se solicita un nivel B2 (intermedio alto) o C1 (avanzado). Lo fundamental no es hablar de forma perfecta, sino ser capaz de comunicarte con fluidez técnica, entender los requisitos del negocio, debatir soluciones arquitectónicas y escribir documentación clara."
    },
    {
      question: "¿Es obligatorio tener un título oficial de inglés?",
      answer: "No. En el sector tecnológico los títulos oficiales (como Cambridge, TOEFL o IELTS) rara vez se solicitan. Tu nivel se evaluará de forma práctica durante las entrevistas iniciales con recursos humanos y en las fases de entrevistas técnicas con los líderes del equipo."
    },
    {
      question: "¿Cómo preparo mi currículum en inglés?",
      answer: "Escribe tu currículum desde cero en inglés en lugar de usar un traductor automático. Utiliza verbos de acción fuertes (achieved, optimized, implemented), cuantifica tus logros (ej: 'improved page load by 30%'), adapta los términos técnicos y describe tus niveles de idioma usando el marco europeo o términos descriptivos claros."
    },
    {
      question: "¿Cómo es una entrevista técnica en inglés?",
      answer: "Suele combinar una charla para conocer tu trayectoria, una prueba de live coding o system design y preguntas de comportamiento. Durante la prueba técnica es crucial pensar en voz alta (think out loud) en inglés, explicando tus razonamientos de diseño y código a los entrevistadores."
    }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ofertas de Empleo IT con Inglés Requerido',
    description: 'Listado de ofertas de trabajo activas de informática y tecnología que requieren inglés en España',
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job: Job, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/job/${getJobSlug(job)}`,
      name: `${job.title} - ${job.company}`
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-indigo-900 text-white rounded-2xl p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4">
            🗣️ English Required
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Empleo IT con Inglés Requerido en España
          </h1>
          <p className="text-gray-305 text-sm md:text-lg leading-relaxed">
            Accede a mejores salarios y proyectos globales. Encuentra vacantes activas y prepárate con nuestra guía para redactar tu CV y superar entrevistas técnicas.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: CV tips */}
          <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              📝 Consejos para Redactar tu Currículum en Inglés
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Un currículum en inglés no es simplemente una traducción literal de tu CV en español. Para captar la atención de reclutadores internacionales, sigue estas recomendaciones:
            </p>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider block mb-1">Evita Traductores Literales</span>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Redacta las descripciones directamente en inglés. Usa verbos de acción específicos como *developed, migrated, architected, spearheaded, decreased, scaled* en lugar del genérico *did* o *was responsible for*.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider block mb-1">Muestra tus logros cuantitativos</span>
                <p className="text-gray-650 text-xs leading-relaxed">
                  En la cultura anglosajona se valora el impacto real. Usa la estructura *Acción + Resultado*, por ejemplo: *“Refactored the core legacy API using Node.js, reducing query response times by 40% and increasing concurrent user support.”*
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider block mb-1">Define tu nivel de forma práctica</span>
                <p className="text-gray-650 text-xs leading-relaxed">
                  Utiliza términos estandarizados para describir tu nivel de conversación. Ejemplos correctos: *Full Professional Proficiency* (puedes trabajar 100% en ese idioma) o *Professional Working Proficiency* (suficiente para reuniones y tareas cotidianas).
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Technical interview */}
          <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              🎤 Cómo Superar una Entrevista Técnica en Inglés
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              La entrevista técnica pone a prueba no solo tus conocimientos de código sino tu habilidad para comunicar tus ideas de forma lógica en inglés:
            </p>
            <div className="space-y-3 text-xs text-gray-650">
              <p>
                <strong>1. Think out loud (Piensa en voz alta):</strong> Durante las pruebas de live coding o system design, explica paso a paso lo que estás haciendo en inglés. Los entrevistadores valoran tu proceso de resolución de problemas incluso si cometes un pequeño error gramatical.
              </p>
              <p>
                <strong>2. Prepara tu Elevator Pitch:</strong> Ten lista una presentación de 2 o 3 minutos sobre tu trayectoria, tus tecnologías principales y los proyectos más retadores en los que has trabajado recientemente. Practícala hablando en voz alta frente al espejo.
              </p>
              <p>
                <strong>3. No temas pedir aclaraciones:</strong> Si no entiendes una pregunta debido al acento o velocidad del entrevistador, es perfectamente aceptable decir: *“Could you please rephrase that question?”* o *“If I understand correctly, you are asking about... is that right?”*.
              </p>
            </div>
          </section>

          {/* Jobs List */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold text-gray-900">
                💼 Ofertas Activas con Inglés Requerido
              </h2>
              <span className="text-xs bg-indigo-100 text-indigo-850 px-2.5 py-1 rounded-full font-bold">
                {jobs.length} ofertas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.length > 0 ? (
                jobs.map((job, index) => (
                  <JobCard key={job.id} job={job as any} lang="es" prefetch={index < 5} />
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium">No se han encontrado ofertas en este momento.</p>
                  <p className="text-xs text-gray-400 mt-1">Vuelve a consultar más tarde para nuevas ofertas.</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar Info & FAQ */}
        <div className="space-y-6">
          <SubscribeForm location="ingles" />
          <PushSubscribe />

          {/* Visual FAQ Block */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
              <span>❓</span> Preguntas Frecuentes
            </h3>
            <div className="space-y-4 divide-y divide-gray-100 text-xs">
              {faqItems.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0">
                  <h4 className="font-bold text-indigo-950 mb-1">{item.question}</h4>
                  <p className="text-gray-650 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
