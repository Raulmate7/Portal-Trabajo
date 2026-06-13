import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import PushSubscribe from "@/components/PushSubscribe";
import AdBanner from "@/components/AdBanner";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 1. Obtener ofertas remotas de la BD con paginación
async function getRemoteJobs(page: number = 1) {
  const limit = 30;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
        AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%')
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await client.query(sql, [limit, offset]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching remote jobs:", error);
    return [];
  } finally {
    client.release();
  }
}

// 2. Obtener estadísticas de remoto
async function getRemoteStats() {
  const client = await pool.connect();
  try {
    const totalRes = await client.query(`
      SELECT COUNT(*) 
      FROM jobs 
      WHERE is_active = TRUE 
        AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%')
    `);
    
    const count = parseInt(totalRes.rows[0].count, 10);
    return {
      total: count,
    };
  } catch (error) {
    console.error("Error fetching remote stats:", error);
    return { total: 0 };
  } finally {
    client.release();
  }
}

// 3. Metadata dinámica para SEO y robots noindex en paginación
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;

  const metadata: Metadata = {
    title: `Trabajo Remoto IT y Programación en España${isPaged ? ` - Página ${page}` : ''} [2026] | Portal Trabajo IT`,
    description: `Encuentra las mejores ofertas de empleo 100% remoto para desarrolladores y profesionales tech. Trabaja desde casa en React, Python, Java, DevOps y más.${isPaged ? ` (Página ${page})` : ''}`,
    alternates: {
      canonical: `${BASE_URL}/trabajo-remoto`,
    },
    openGraph: {
      title: `Empleo IT 100% Remoto — Trabaja desde Casa${isPaged ? ` (Página ${page})` : ''}`,
      description: "Listado exclusivo de ofertas de trabajo en modalidad remota y teletrabajo para programadores. Actualizado constantemente.",
      url: `${BASE_URL}/trabajo-remoto`,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Trabajo Remoto IT",
        },
      ],
    },
  };

  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

export default async function RemoteLandingPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  const [jobs, stats] = await Promise.all([
    getRemoteJobs(validPage),
    getRemoteStats(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Cabecera */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="rocket">🚀</span>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Portal Trabajo IT
              </span>
            </div>
          </Link>
          <Link 
            href="/trabajos/informatica-tecnologia" 
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Buscar todos los empleos →
          </Link>
        </div>
      </header>

      {/* Hero Section Premium */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 px-4 sm:px-6 lg:px-8 shadow-inner">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-violet-950 z-0" />
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/35 via-transparent to-transparent z-0" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider animate-pulse">
            💻 Modalidad Teletrabajo
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Trabajo Remoto IT para <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Programadores y Techs</span>
          </h2>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed mb-8">
            Encuentra las mejores oportunidades en programación, sistemas y datos 100% remotas de España y del extranjero. Sin desplazamientos, con flexibilidad horaria y conciliación real.
          </p>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors">
              <p className="text-3xl font-extrabold text-white">{stats.total}</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">Vacantes Remotas Activas</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors">
              <p className="text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">Sin Presencialidad Obligatoria</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors col-span-1 sm:col-span-2 md:col-span-1">
              <p className="text-3xl font-extrabold text-white">Cada 6h</p>
              <p className="text-xs text-indigo-200 mt-1.5 font-medium uppercase tracking-wider">Actualización de Listado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h3 className="text-2xl font-extrabold text-gray-900">Guía: Cómo Triunfar Buscando Empleo Remoto IT 🚀</h3>
          <p className="text-sm text-gray-500 mt-2">
            Trabajar desde casa requiere habilidades específicas. Asegúrate de destacar estas 3 áreas en tu perfil:
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-2">Portfolio de GitHub Sólido</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              En remoto tu código habla por ti. Mantén tus repositorios limpios, escribe buenos archivos `README.md` y documenta la arquitectura de tus proyectos personales.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-violet-50 text-violet-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-2">Comunicación Asíncrona Eficiente</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              La comunicación escrita es la columna vertebral de los equipos remotos. Demuestra que eres capaz de estructurar tus reportes, crear issues descriptivos y redactar de forma clara.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-pink-50 text-pink-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-2">Herramientas de Colaboración</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Familiarízate con herramientas de gestión ágil (Jira, Trello, Linear) y control de versiones. Las empresas valoran mucho que sepas organizarte de forma autónoma.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-150">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Resultados de Ofertas */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>💼</span> Ofertas de Teletrabajo IT Recientes
            </h3>
            
            {jobs && jobs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {/* Controles de Paginación */}
                <div className="flex justify-between items-center pt-8">
                  {validPage > 1 ? (
                    <Link
                      href={`/trabajo-remoto?page=${validPage - 1}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      ← Anterior
                    </Link>
                  ) : (
                    <div />
                  )}
                  <span className="text-sm text-gray-500 font-medium font-sans">Página {validPage}</span>
                  {jobs.length === 30 ? (
                    <Link
                      href={`/trabajo-remoto?page=${validPage + 1}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Siguiente →
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                <span className="text-4xl">🤷‍♂️</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4">No hay más ofertas remotas</h3>
                <p className="text-xs text-gray-500 mt-1">Vuelve más tarde para ver nuevas actualizaciones.</p>
                <Link href="/" className="inline-block mt-6 text-sm font-semibold text-indigo-600 hover:underline">
                  Volver al buscador principal &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Formulario de Suscripción preconfigurado con Remoto */}
            <SubscribeForm location="Remoto" />
            
            {/* Push Notifications */}
            <PushSubscribe />

            {/* Banner de afiliado / cursos */}
            <AdBanner variant="sidebar" />
          </aside>

        </div>
      </div>
    </div>
  );
}
