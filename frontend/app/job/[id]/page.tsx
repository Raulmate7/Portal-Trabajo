import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pool } from "pg";
import Link from 'next/link';
import ShareButton from '@/components/ShareButton'; // <--- IMPORTAMOS EL BOTÓN

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://portal-trabajo.vercel.app'; 

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getDb = () => new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const pool = getDb();
    const client = await pool.connect();
    const res = await client.query("SELECT title, company, location, description_snippet FROM jobs WHERE id = $1", [id]);
    client.release();
    await pool.end();

    const job = res.rows[0];
    if (!job) return { title: 'Oferta no encontrada' };

    const titulo = `${job.title} en ${job.location}`;
    const desc = `Oportunidad laboral en ${job.company}. ${job.description_snippet?.substring(0, 130)}...`;

    return {
      title: `${titulo} | Portal Empleo`,
      description: desc,
      openGraph: {
        title: titulo,
        description: desc,
        url: `${BASE_URL}/job/${id}`,
        siteName: 'Agregador de Empleo Tech',
        locale: 'es_ES',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: titulo,
        description: desc,
      },
    };
  } catch (e) {
    return { title: 'Portal de Empleo' };
  }
}

async function getJob(id: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const pool = getDb();
    const client = await pool.connect();
    const res = await client.query("SELECT * FROM jobs WHERE id = $1", [id]);
    client.release();
    await pool.end();
    return res.rows[0];
  } catch (error) {
    return null;
  }
}

export default async function JobPage({ params }: Props) {
  const resolvedParams = await params;
  const job = await getJob(resolvedParams.id);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800">Oferta no disponible</h1>
          <Link href="/" className="text-indigo-600 hover:underline font-medium">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_snippet,
    datePosted: new Date(job.created_at).toISOString(),
    hiringOrganization: { '@type': 'Organization', name: job.company },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'ES' },
    },
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto">
        {/* Cabecera de navegación */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-indigo-600 hover:underline inline-flex items-center gap-2 font-medium">
            ← Volver al buscador
          </Link>
          
          {/* AQUÍ ESTÁ EL BOTÓN DE COMPARTIR QUE HEMOS CREADO */}
          <ShareButton title={job.title} company={job.company} />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{job.title}</h1>
            <div className="flex flex-wrap gap-3 text-indigo-100 text-sm md:text-base">
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                🏢 {job.company}
              </span>
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                📍 {job.location}
              </span>
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                📅 {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del puesto</h2>
            <div className="prose max-w-none text-gray-600 mb-8 leading-relaxed">
              <p className="whitespace-pre-line">{job.description_snippet || "Ver detalles en la web original."}</p>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center">
              <p className="text-indigo-900 mb-4 text-sm font-medium">
                Esta oferta fue encontrada en <strong>{job.source || 'Internet'}</strong>
              </p>
              <a 
                href={job.url_source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex w-full md:w-auto justify-center items-center bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
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
