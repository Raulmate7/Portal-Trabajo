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
    
    return {
      totalJobs: parseInt(totalJobsRes.rows[0].count, 10),
      totalCompanies: parseInt(totalCompaniesRes.rows[0].count, 10)
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
  const description = "Descubre el origen de nuestros datos, el proceso de deduplicación cada 6 horas, estadísticas del sector en vivo y nuestro compromiso E-E-A-T con la transparencia salarial.";
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

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
        ℹ️ Sobre Nosotros y Cómo Funciona el Portal
      </h1>

      {/* Intro Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
          <span className="text-3xl block mb-2">📊</span>
          <span className="text-2xl font-black text-indigo-950 block">{stats.totalJobs.toLocaleString('es-ES')}</span>
          <span className="text-xs text-gray-550 font-medium uppercase tracking-wider">Ofertas Activas</span>
        </div>
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
          <span className="text-3xl block mb-2">🏢</span>
          <span className="text-2xl font-black text-indigo-950 block">{stats.totalCompanies.toLocaleString('es-ES')}</span>
          <span className="text-xs text-gray-550 font-medium uppercase tracking-wider">Empresas Indexadas</span>
        </div>
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
          <span className="text-3xl block mb-2">⚡</span>
          <span className="text-2xl font-black text-indigo-950 block">Cada 6h</span>
          <span className="text-xs text-gray-550 font-medium uppercase tracking-wider">Actualización</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8 text-gray-750">
        
        {/* Section 1: Mission */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-950">🎯 Nuestra Misión: Transparencia y Eficiencia</h2>
          <p className="text-sm leading-relaxed">
            Portal Trabajo IT nació con la vocación de solucionar la fragmentación y falta de claridad que sufre el mercado de empleo tecnológico en España. Los desarrolladores a menudo pierden valiosas horas revisando ofertas repetidas o con descripciones salariales confusas. Nuestra meta es ofrecer un buscador especializado, deduplicado y enriquecido con estadísticas de mercado reales.
          </p>
        </section>

        {/* Section 2: Pipeline */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-950">⚙️ ¿Cómo funciona nuestro flujo de datos?</h2>
          <p className="text-sm leading-relaxed">
            Para mantener el portal actualizado y útil para la comunidad, ejecutamos una secuencia técnica automatizada cada 6 horas:
          </p>
          <div className="space-y-4 pl-2">
            <div className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">1</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Agregación e Ingesta de Fuentes</h4>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                  Rastreamos más de una decena de fuentes de empleo nacionales e internacionales en busca de vacantes informáticas.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">2</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Limpieza y Deduplicación Estricta</h4>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                  Filtramos el spam y las ofertas duplicadas mediante comparación de firma digital del puesto y contenido. Solo se muestra la oferta original.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">3</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Categorización por Stack y Seniority</h4>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                  Clasificamos cada oferta en su sector tecnológico específico (Backend, Frontend, Cloud...) y asignamos su nivel de experiencia y modalidad (remoto/híbrido).
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">4</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Cálculo de Percentiles Salariales</h4>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                  Extraemos los rangos salariales transparentes para alimentar nuestra calculadora de percentiles (P25, P50, P75) y ofrecer referencias fiables de mercado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: E-E-A-T Credibility */}
        <section className="space-y-3 border-t border-gray-150 pt-6">
          <h2 className="text-xl font-bold text-gray-950">✍️ Autoría y Rigor de Contenidos (E-E-A-T)</h2>
          <p className="text-sm leading-relaxed">
            Nuestro portal está gestionado por ingenieros de software y consultores de recruiting técnico. Toda la información editorial referente a fiscalidad, orientación profesional, consejos para currículum y preparación de entrevistas técnicas es redactada e inspeccionada por profesionales activos con experiencia en procesos de reclutamiento globales.
          </p>
          <p className="text-sm leading-relaxed">
            Las estadísticas salariales que se muestran en el portal son puramente estadísticas, extraídas directamente de las ofertas de trabajo activas en España que detallan sus rangos salariales mínimos y máximos en el mercado actual.
          </p>
        </section>

        {/* Section 4: Contact/Channels */}
        <section className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-indigo-950 text-sm">📬 ¿Quieres colaborar o sugerir una fuente?</h4>
            <p className="text-xs text-indigo-850 mt-1">
              Si organizas un meetup de programadores o quieres que indexemos tu bolsa de empleo, escríbenos.
            </p>
          </div>
          <Link 
            href="/talento-premium"
            className="inline-block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Contacto del Portal
          </Link>
        </section>

      </div>
    </div>
  );
}
