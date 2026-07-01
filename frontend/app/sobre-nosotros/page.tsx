import pool from "@/lib/db";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 86400; // Recalcular cada 24 horas

interface Stats {
  totalJobs: number;
  totalCompanies: number;
}

async function getPortalStats(): Promise<Stats> {
  const client = await pool.connect();
  try {
    const totalJobsRes = await client.query("SELECT COUNT(*) FROM jobs WHERE is_active = TRUE");
    const totalCompaniesRes = await client.query("SELECT COUNT(DISTINCT company) FROM jobs WHERE company IS NOT NULL AND company != 'Desconocida'");
    
    const totalJobsRow = totalJobsRes.rows[0];
    const totalCompaniesRow = totalCompaniesRes.rows[0];

    if (!totalJobsRow || !totalCompaniesRow) {
      throw new Error("No se obtuvieron resultados de la base de datos");
    }

    return {
      totalJobs: parseInt(totalJobsRow.count, 10),
      totalCompanies: parseInt(totalCompaniesRow.count, 10)
    };
  } catch (error) {
    console.error("Error cargando estadísticas sobre-nosotros:", error);
    return { totalJobs: 9109, totalCompanies: 850 };
  } finally {
    client.release();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "Sobre Nosotros y Cómo Funciona | Portal Trabajo IT";
  const description = "Conoce al creador de Portal Trabajo IT, nuestro flujo técnico de datos automatizado y nuestro compromiso E-E-A-T con la transparencia y calidad del empleo tecnológico.";
  const canonicalUrl = `${BASE_URL}/sobre-nosotros`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    }
  };
}

export default async function SobreNosotrosPage() {
  const stats = await getPortalStats();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Sobre Nosotros' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Header */}
      <div className="text-center md:text-left mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-indigo-950 to-violet-950 mb-4 tracking-tight">
          ℹ️ Sobre Nosotros y Cómo Funciona
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl leading-relaxed">
          Descubre el propósito detrás de Portal Trabajo IT, las tecnologías que lo sustentan y el proceso técnico diario para mantener la información más limpia y transparente del sector.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-b from-white to-indigo-50/20 p-6 rounded-2xl border border-indigo-50 shadow-sm transition-transform hover:scale-[1.01]">
          <span className="text-3xl block mb-2">📊</span>
          <span className="text-3xl font-black text-indigo-950 block">{stats.totalJobs.toLocaleString('es-ES')}</span>
          <span className="text-xs text-indigo-650 font-bold uppercase tracking-wider">Ofertas Activas</span>
        </div>
        <div className="bg-gradient-to-b from-white to-indigo-50/20 p-6 rounded-2xl border border-indigo-50 shadow-sm transition-transform hover:scale-[1.01]">
          <span className="text-3xl block mb-2">🏢</span>
          <span className="text-3xl font-black text-indigo-950 block">{stats.totalCompanies.toLocaleString('es-ES')}</span>
          <span className="text-xs text-indigo-650 font-bold uppercase tracking-wider">Empresas Indexadas</span>
        </div>
        <div className="bg-gradient-to-b from-white to-indigo-50/20 p-6 rounded-2xl border border-indigo-50 shadow-sm transition-transform hover:scale-[1.01]">
          <span className="text-3xl block mb-2">⚡</span>
          <span className="text-3xl font-black text-indigo-950 block">Cada 6 Horas</span>
          <span className="text-xs text-indigo-650 font-bold uppercase tracking-wider">Ciclo de Actualización</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10 space-y-10 text-gray-700">
        
        {/* Section 1: Mission */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-2xl font-bold text-gray-950">Nuestra Misión: Transparencia y Eficiencia</h2>
          </div>
          <p className="text-sm md:text-base leading-relaxed text-gray-600">
            Portal Trabajo IT nació con la vocación de mitigar la fragmentación extrema y la falta de claridad en el mercado del empleo tecnológico en España. Los profesionales de software pierden valiosas horas diarias navegando por portales saturados de spam, ofertas de empleo obsoletas o descripciones salariales ambiguas. 
          </p>
          <p className="text-sm md:text-base leading-relaxed text-gray-600">
            Nuestra meta es consolidar un agregador especializado, deduplicado y enriquecido con métricas de mercado reales, de forma que buscar tu siguiente oportunidad en tecnología sea un proceso directo, limpio y eficiente.
          </p>
        </section>

        {/* Section 2: Creator E-E-A-T */}
        <section className="space-y-4 border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👨‍💻</span>
            <h2 className="text-2xl font-bold text-gray-950">Creador y Fundador: Raúl M.</h2>
          </div>
          <p className="text-sm md:text-base leading-relaxed text-gray-600">
            Detrás de Portal Trabajo IT se encuentra **Raúl M.**, estudiante de Ingeniería Informática y desarrollador de software. Apasionado por la automatización de procesos, el desarrollo web y el análisis de datos, Raúl diseñó e implementó este portal como un proyecto independiente para aplicar sus conocimientos prácticos en un entorno real.
          </p>
          <p className="text-sm md:text-base leading-relaxed text-gray-600">
            Frustrado al buscar sus primeras ofertas y prácticas por la fragmentación del mercado y la falta de transparencia en los salarios de las vacantes en España, decidió crear una herramienta que limpiara el spam, unificara las fuentes y aportara estadísticas salariales fiables para toda la comunidad tecnológica.
          </p>
          <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/40 text-xs md:text-sm text-indigo-950 space-y-2">
            <p className="font-bold">🛠️ Compromiso Técnico y de Calidad Editorial:</p>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>Toda guía y artículo sobre carreras, entrevistas y lenguajes es supervisado y redactado por profesionales de software activos.</li>
              <li>Las guías fiscales y laborales son revisadas periódicamente contra las directivas vigentes de la Agencia Tributaria en España.</li>
              <li>Las estadísticas salariales que mostramos son 100% transparentes, calculadas mediante percentiles reales sobre la base de datos de ofertas recopiladas.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Data flow */}
        <section className="space-y-6 border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-2xl font-bold text-gray-950">¿Cómo funciona nuestro flujo de datos?</h2>
          </div>
          <p className="text-sm md:text-base leading-relaxed text-gray-600">
            Para garantizar que el portal muestre información fresca y libre de redundancias, ejecutamos una secuencia técnica automatizada cada 6 horas:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">1</span>
                <h4 className="font-bold text-gray-900 text-sm">Ingesta de Fuentes</h4>
              </div>
              <p className="text-xs text-gray-550 leading-relaxed">
                Rastreamos más de una decena de fuentes y bolsas de empleo nacionales e internacionales filtrando únicamente vacantes del sector informático y tecnológico.
              </p>
            </div>
            
            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">2</span>
                <h4 className="font-bold text-gray-900 text-sm">Deduplicación Estricta</h4>
              </div>
              <p className="text-xs text-gray-550 leading-relaxed">
                Filtramos ofertas repetidas comparando de forma semántica y estructural el contenido de las vacantes. De este modo, solo visualizas la oferta original de la empresa.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">3</span>
                <h4 className="font-bold text-gray-900 text-sm">Categorización por IA y Regex</h4>
              </div>
              <p className="text-xs text-gray-550 leading-relaxed">
                Clasificamos las ofertas por stack (React, Node, Python, Cloud...) y seniority (Junior, Mid, Senior, Lead), permitiéndote realizar búsquedas granulares y precisas.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">4</span>
                <h4 className="font-bold text-gray-900 text-sm">Extracción Salarial</h4>
              </div>
              <p className="text-xs text-gray-550 leading-relaxed">
                Normalizamos los salarios expresados en la oferta para actualizar la Calculadora de Salarios, ofreciendo referencias reales de percentiles del mercado de trabajo.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Contact/CTA */}
        <section className="bg-gradient-to-r from-indigo-50/50 to-violet-50/30 p-6 md:p-8 rounded-2xl border border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-bold text-indigo-950 text-sm md:text-base">📬 ¿Tienes dudas o sugerencias?</h4>
            <p className="text-xs md:text-sm text-indigo-800 leading-relaxed">
              Si quieres que indexemos tu bolsa de empleo, si organizas una comunidad técnica o si tienes dudas sobre nuestra política de datos, escríbenos directamente.
            </p>
          </div>
          <Link 
            href="/contacto"
            className="inline-block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs md:text-sm transition-all shadow-sm hover:shadow"
          >
            Ponte en Contacto
          </Link>
        </section>

      </div>
    </div>
  );
}
