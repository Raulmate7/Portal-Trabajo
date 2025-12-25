import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pool } from "pg";
import Link from 'next/link';

// Configuración BD
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

type Props = {
  params: Promise<{ id: string }>
}

// 1. GENERADOR DE METADATOS (Para que Google vea "Oferta Python en Madrid")
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT title, company, location, description_snippet FROM jobs WHERE id = $1", [id]);
    client.release();

    const job = res.rows[0];
    if (!job) return { title: 'Oferta no encontrada' };

    return {
      title: `${job.title} en ${job.company} | Portal Empleo IT`,
      description: `Aplica a la posición de ${job.title}. Ubicación: ${job.location}. ${job.description_snippet?.substring(0, 100)}...`,
    };
  } catch (e) {
    return { title: 'Portal Empleo IT' };
  }
}

// Función para obtener los datos (Renderizado)
async function getJob(id: string) {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT * FROM jobs WHERE id = $1", [id]);
    client.release();
    return res.rows[0];
  } catch (error) {
    return null;
  }
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  // 2. DATOS ESTRUCTURADOS (Para la cajita azul de Google Jobs)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_snippet || `Oferta de trabajo de ${job.title} en ${job.company}.`,
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
        addressCountry: 'ES',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary === 'Consultar' ? 0 : 0, // Si tuviéramos número real lo pondríamos aquí
        unitText: 'YEAR'
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Script Invisible para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:underline mb-6 inline-block">
          ← Volver a las ofertas
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Cabecera */}
          <div className="bg-indigo-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-indigo-200 mt-4">
              <span className="flex items-center gap-1">🏢 {job.company}</span>
              <span className="flex items-center gap-1">📍 {job.location}</span>
              <span className="flex items-center gap-1">💰 {job.salary}</span>
              <span className="flex items-center gap-1">📅 {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-8">
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Descripción del puesto</h3>
              <p className="whitespace-pre-line mb-6">
                {job.description_snippet 
                  ? job.description_snippet 
                  : "Para ver la descripción completa y aplicar, por favor visita el enlace original de la oferta."}
              </p>

              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-6">
                <p className="text-indigo-900 font-medium">
                  Esta oferta fue encontrada automáticamente en <strong>{job.source || 'Internet'}</strong>.
                </p>
              </div>

              {/* Botón de Aplicar */}
              <div className="flex justify-center mt-8">
                <a 
                  href={job.url_source} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-indigo-700 transition-transform hover:scale-105 shadow-md text-lg"
                >
                  👉 Solicitar en la web original
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
