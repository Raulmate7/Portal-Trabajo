import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pool } from "pg";
import Link from 'next/link';

// Forzar dinámico para evitar errores de caché vieja
export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

type Props = {
  params: Promise<{ id: string }>
}

// 1. SEO: TÍTULOS DINÁMICOS
// Esto hace que en Google salga: "Oferta Programador Java en Madrid"
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT title, company, location, description_snippet FROM jobs WHERE id = $1", [id]);
    client.release();

    const job = res.rows[0];
    if (!job) return { title: 'Oferta no encontrada' };

    // Título optimizado para SEO: Puesto + Ubicación + Portal
    return {
      title: `${job.title} en ${job.location} | Empleo Tech`,
      description: `Nueva oferta de trabajo: ${job.title} en la empresa ${job.company}. Ubicación: ${job.location}. Aplica hoy mismo.`,
    };
  } catch (e) {
    return { title: 'Oferta de Empleo IT' };
  }
}

async function getJob(id: string) {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT * FROM jobs WHERE id = $1", [id]);
    client.release();
    return res.rows[0];
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}

export default async function JobPage({ params }: Props) {
  const resolvedParams = await params; // Await explícito para evitar errores
  const job = await getJob(resolvedParams.id);

  if (!job) {
    notFound();
  }

  // 2. SEO TÉCNICO: DATOS ESTRUCTURADOS (JSON-LD)
  // Esto es lo que lee Google para ponerte en la cajita azul de empleos
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_snippet || `Oportunidad laboral para ${job.title}. Empresa: ${job.company}.`,
    datePosted: new Date(job.created_at).toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'ES', // Asumimos España para mejorar posicionamiento local
      },
    },
    // Añadir empleo directo hace que Google lo valore más
    employmentType: "FULL_TIME", 
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Inyección de código SEO invisible */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:underline mb-6 inline-flex items-center gap-2 font-medium">
          ← Volver al buscador
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Cabecera Atractiva */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-indigo-100 text-sm md:text-base">
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2">
                🏢 {job.company}
              </span>
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2">
                📍 {job.location}
              </span>
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2">
                📅 {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles de la oferta</h2>
            
            <div className="prose max-w-none text-gray-600 mb-8">
              <p className="whitespace-pre-line leading-relaxed">
                {job.description_snippet 
                  ? job.description_snippet 
                  : "Esta oferta ha sido recopilada de un portal externo. Pulsa el botón para ver todos los detalles."}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-600 mb-4 text-sm">
                Esta oferta se encuentra originalmente en <strong>{job.source || 'Portal Externo'}</strong>.
              </p>
              
              <a 
                href={job.url_source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                👉 Aplicar en la web original
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
