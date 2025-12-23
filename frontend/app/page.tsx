import { Pool } from 'pg';
import Link from 'next/link';
import Newsletter from '@/components/Newsletter'; // Aseguramos que la newsletter siga ahí

// Configuración de la Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Función para obtener ofertas
async function getJobs(search?: string) {
  const client = await pool.connect();
  try {
    let query = 'SELECT * FROM jobs ORDER BY created_at DESC LIMIT 20';
    let params: any[] = [];

    if (search) {
      query = `
        SELECT * FROM jobs 
        WHERE title ILIKE $1 OR company ILIKE $1 OR description_snippet ILIKE $1 
        ORDER BY created_at DESC LIMIT 20
      `;
      params = [`%${search}%`];
    }

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q;
  const jobs = await getJobs(query);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* HERO SECTION */}
      <section className="bg-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Encuentra tu próximo empleo IT
          </h1>
          <p className="text-xl text-indigo-100 mb-10">
            Recopilamos las mejores ofertas de programación de toda la red.
          </p>

          {/* BUSCADOR */}
          <form className="max-w-2xl mx-auto flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Ej: Python, React, Junior..."
              className="w-full px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-400 shadow-lg"
            />
            <button type="submit" className="bg-indigo-900 hover:bg-indigo-950 text-white px-8 py-4 rounded-xl font-bold transition-all">
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* LISTA DE OFERTAS */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No hemos encontrado ofertas con esa búsqueda.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    {/* AQUÍ ESTÁ EL CAMBIO CLAVE PARA SEO: ENLACE INTERNO */}
                    <Link href={`/job/${job.id}`} className="group-hover:text-indigo-600 transition-colors">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {job.title}
                      </h2>
                    </Link>
                    <p className="text-gray-500 font-medium text-sm">
                      {job.company} • {job.location} • 💰 {job.salary || 'Sueldo no disponible'}
                    </p>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                     <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(job.created_at).toLocaleDateString()}
                     </span>
                     <Link 
                        href={`/job/${job.id}`}
                        className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors text-sm"
                     >
                        Ver Detalles
                     </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* NEWSLETTER (La que ya arreglamos) */}
      <Newsletter />
    </main>
  );
}
