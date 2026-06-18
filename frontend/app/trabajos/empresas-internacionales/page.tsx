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

async function getInternationalJobs(): Promise<Job[]> {
  const client = await pool.connect();
  try {
    // 1. Buscamos ofertas originadas en scrapers internacionales
    const sql = `
      SELECT id, title, title_es, company, location, url_source, description_snippet, category, created_at, salary 
      FROM jobs 
      WHERE is_active = TRUE 
        AND (
          url_source ILIKE '%weworkremotely%'
          OR url_source ILIKE '%remoteok%'
          OR url_source ILIKE '%remotive%'
          OR url_source ILIKE '%himalayas%'
          OR url_source ILIKE '%workingnomads%'
          OR url_source ILIKE '%remote.co%'
          OR url_source ILIKE '%flexjobs%'
        )
      ORDER BY created_at DESC
      LIMIT 30
    `;
    const result = await client.query(sql);
    let jobs = result.rows;

    // 2. Si no hay suficientes, complementamos con ofertas que sean 100% en remoto / global
    if (jobs.length < 12) {
      const needed = 30 - jobs.length;
      const excludeIds = jobs.map((j: any) => j.id);
      
      let fallbackSql = `
        SELECT id, title, title_es, company, location, url_source, description_snippet, category, created_at, salary 
        FROM jobs 
        WHERE is_active = TRUE 
          AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%worldwide%')
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
    console.error("Error cargando empleos internacionales:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "Trabajar para Empresas Internacionales desde España (Remoto) [2026]";
  const description = "Guía completa para trabajar en remoto para empresas de EEUU y Europa desde España. Modelos Contractor vs EOR, fiscalidad, autónomos y ofertas activas.";
  const canonicalUrl = `${BASE_URL}/trabajos/empresas-internacionales`;

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
          url: `${BASE_URL}/images/og-international.png`,
          width: 1200,
          height: 630,
          alt: "Trabajo internacional desde España",
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

export default async function EmpresasInternacionalesPage() {
  const jobs = await getInternationalJobs();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Trabajos', href: '/trabajos/informatica-tecnologia' },
    { label: 'Empresas Internacionales' }
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
      question: "¿Puedo trabajar para una empresa de EE.UU. viviendo en España?",
      answer: "Sí, es perfectamente legal y común. Puedes hacerlo bajo dos modalidades principales: dándote de alta como autónomo en España para facturarles como contratista independiente (Contractor), o a través de una entidad local intermediaria llamada Employer of Record (EOR) que te contrate con un contrato de trabajo español regular."
    },
    {
      question: "¿Qué es un EOR (Employer of Record) y cómo funciona?",
      answer: "Un Employer of Record es una empresa tercera (como Deel, Remote u Oyster) con sede legal en España. La empresa internacional los contrata a ellos y el EOR te contrata a ti bajo la legislación española. Recibes una nómina mensual regular, cotizas a la Seguridad Social y tienes los mismos derechos que cualquier empleado en España."
    },
    {
      question: "¿Cómo tributan los ingresos trabajando como Contractor extranjero?",
      answer: "Como Contractor/Autónomo, debes darte de alta en el régimen de autónomos de la Seguridad Social y presentar el alta censal en Hacienda (modelo 036 o 037). Tributarás por tus ingresos netos en el IRPF mediante pagos fraccionados trimestrales (modelo 130) y la declaración anual de la renta. Si facturas fuera de la UE, tus facturas están exentas de IVA."
    },
    {
      question: "¿Qué es el formulario W-8BEN y cuándo debo firmarlo?",
      answer: "El W-8BEN es un formulario del IRS (Hacienda de EE.UU.) que los ciudadanos extranjeros firman para declarar que no son residentes fiscales en EE.UU. Evita que la empresa estadounidense te retenga impuestos en origen, permitiéndote recibir el 100% de tus facturas y tributar exclusivamente en España."
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

  return (
    <div className="container mx-auto px-4 py-8">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4">
            🌎 Remoto Global
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Trabajar para Empresas Internacionales desde España
          </h1>
          <p className="text-gray-305 text-sm md:text-lg leading-relaxed">
            Consigue salarios competitivos en dólares o euros trabajando desde casa. Guía de fiscalidad, modelos de contratación y ofertas de empleo activas.
          </p>
        </div>
      </div>

      {/* Editorial Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Contratación */}
          <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              💼 Opciones de Contratación: Contractor vs. EOR
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Trabajar para un cliente extranjero desde España requiere formalizar tu relación jurídica. Las empresas de EE.UU. o de países de la Unión Europea que no tienen sede legal en España utilizan principalmente dos vías para incorporarte a sus equipos de desarrollo:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-950 text-base mb-2">1. Modelo Contractor (Autónomo)</h3>
                  <p className="text-gray-650 text-xs leading-relaxed">
                    Te das de alta en el régimen especial de trabajadores autónomos (RETA) en España y les emites facturas mensuales de servicios como profesional independiente.
                  </p>
                  <ul className="text-xs text-gray-650 space-y-1 mt-3 list-disc list-inside">
                    <li>Mayor flexibilidad de negociación.</li>
                    <li>Sueles recibir el sueldo íntegro sin retención en origen.</li>
                    <li>Debes gestionar tus propios impuestos trimestrales.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100/55 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-indigo-950 text-base mb-2">2. Modelo EOR (Employer of Record)</h3>
                  <p className="text-gray-650 text-xs leading-relaxed">
                    La empresa extranjera utiliza plataformas como Deel, Remote, Oyster o Boundless para contratarte formalmente en España.
                  </p>
                  <ul className="text-xs text-gray-650 space-y-1 mt-3 list-disc list-inside">
                    <li>Contrato laboral indefinido 100% español.</li>
                    <li>Nómina regular con cotización a la Seguridad Social.</li>
                    <li>Derechos de desempleo y baja médica cubiertos.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Fiscalidad */}
          <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Fiscalidad: ¿Cómo tributan mis ingresos en España?
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              La forma de declarar tus ingresos dependerá de la modalidad contractual seleccionada:
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-600 pl-4 py-1">
                <h3 className="font-semibold text-gray-950 text-sm">Tributación como Empleado (EOR)</h3>
                <p className="text-gray-600 text-xs leading-relaxed mt-1">
                  Funciona igual que cualquier empresa española. En tu nómina se te retiene una parte para el pago a cuenta del IRPF (basado en tus ingresos) y se te descuenta tu aportación a la Seguridad Social. Solo tendrás que confirmar tu borrador en la Campaña de la Renta anual.
                </p>
              </div>
              
              <div className="border-l-4 border-amber-500 pl-4 py-1">
                <h3 className="font-semibold text-gray-950 text-sm">Tributación como Contractor (Autónomo)</h3>
                <p className="text-gray-600 text-xs leading-relaxed mt-1">
                  Debes presentar el **modelo 036 o 037** de alta censal y darte de alta en la Seguridad Social. Presentarás trimestralmente el **modelo 130** (pago fraccionado del 20% del rendimiento neto) y la declaración anual. Si facturas a una empresa en la UE, debes registrarte en el VIES para emitir facturas exentas con IVA intracomunitario. Si facturas a EE.UU., debes rellenar el formulario **W-8BEN** para evitar retenciones de impuestos en EE.UU.
                </p>
              </div>
            </div>
          </section>

          {/* Jobs List */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold text-gray-900">
                💼 Ofertas de Empleo Internacional Activas
              </h2>
              <span className="text-xs bg-indigo-100 text-indigo-850 px-2.5 py-1 rounded-full font-bold">
                {jobs.length} ofertas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard key={job.id} job={job as any} lang="es" />
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
          <SubscribeForm location="internacional" />
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
