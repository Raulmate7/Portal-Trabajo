import { notFound } from 'next/navigation';
import { Pool } from 'pg';
import Link from 'next/link';

// 1. Configuración de Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 2. Función para buscar la oferta en la BD
async function getJob(id: string) {
  const client = await pool.connect();
  try {
    // Buscamos por ID (asegúrate de que tu tabla tiene columna 'id')
    const result = await client.query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    return null;
  } finally {
    client.release();
  }
}

// 3. Generar Título Dinámico para la pestaña del navegador (SEO Básico)
export async function generateMetadata({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) return { title: 'Oferta no encontrada' };
  
  return {
    title: `${job.title} en ${job.company} | Portal Trabajo IT`,
    description: `Oferta de empleo: ${job.title} en ${job.location}. Aplica ahora.`,
  };
}

// 4. Componente Principal de la Página
export default async function JobPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job) {
    notFound(); // Si no existe, muestra error 404
  }

  // --- EL TRUCO DE GOOGLE (SCHEMA.ORG) ---
  // Esto es lo que lee Google para ponerte en el recuadro azul
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_snippet || job.title, // Google necesita descripción
    datePosted: job.created_at,
    validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Caduca en 3 meses
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Remoto', 
        addressCountry: 'ES', // Asumimos España por defecto, o adáptalo
      },
    },
    baseSalary: job.salary ? {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary, // Google intentará entender el texto "30.000 - 40.000"
        unitText: 'YEAR',
      },
    } : undefined,
  };

  return (
    <main className="max-w-4xl mx-auto p-6 md:py-12">
      {/* Script Invisible para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/" className="text-indigo-600 hover:underline mb-6 inline-block">
        ← Volver a ofertas
      </Link>

      <article className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-indigo-100 font-medium">
            <span className="flex items-center gap-2">🏢 {job.company}</span>
            <span className="flex items-center gap-2">📍 {job.location}</span>
            <span className="flex items-center gap-2">💰 {job.salary || 'Salario no disponible'}</span>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Descripción del puesto</h2>
          <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
            {job.description_snippet}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <p className="text-sm text-gray-500">
              Publicado el {new Date(job.created_at).toLocaleDateString()}
            </p>
            <a 
              href={job.url_source} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 w-full md:w-auto text-center"
            >
              Aplicar en la web original 🚀
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
