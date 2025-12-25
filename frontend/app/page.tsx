import Link from "next/link";
import { Pool } from "pg";
import SearchFilters from "./components/SearchFilters";

// Configuración BD
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Definimos los tipos para los parámetros de búsqueda
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getJobs(query: string, location: string) {
  let client;
  try {
    client = await pool.connect();
    
    // Construimos la consulta SQL dinámica
    let sql = "SELECT * FROM jobs WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    // Filtro por Palabra Clave (Título o Descripción)
    if (query) {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    // Filtro por Ubicación
    if (location) {
      sql += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    sql += " ORDER BY created_at DESC LIMIT 50";

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  } finally {
    if (client) client.release();
  }
}

export default async function Home({ searchParams }: Props) {
  // Leemos los parámetros de la URL
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const loc = typeof resolvedParams.location === 'string' ? resolvedParams.location : '';

  const jobs = await getJobs(q, loc);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* 1. SECCIÓN HERO (TELEGRAM ARRIBA) */}
      <div className="bg-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Encuentra tu próximo empleo Tech
          </h1>
          <p className="text-indigo-200 text-lg mb-8">
            Agregador automático de ofertas de empleo IT en español.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="https://t.me/TU_CANAL" 
              target="_blank" 
              className="bg-white text-indigo-900 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              ✈️ Unirme al canal de Telegram
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 -mt-8">
        
        {/* 2. BARRA DE BÚSQUEDA Y FILTROS */}
        <SearchFilters />

        {/* 3. RESULTADOS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {jobs.length === 0 ? "No se encontraron ofertas" : `Últimas ofertas (${jobs.length})`}
            </h2>
            {(q || loc) && (
              <Link href="/" className="text-sm text-indigo-600 hover:underline">
                Borrar filtros
              </Link>
            )}
          </div>

          {jobs.length > 0 ? (
            jobs.map((job) => (
              <Link 
                href={`/job/${job.id}`} 
                key={job.id}
                className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:border-indigo-200 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h2>
                    <p className="text-gray-600 font-medium mt-1">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      {/* ENLACE A GOOGLE MAPS */}
                      <object>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors z-10 relative"
                          onClick={(e) => e.stopPropagation()} 
                        >
                          📍 {job.location}
                        </a>
                      </object>
                      
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                        💰 {job.salary || "Consultar"}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                        📅 {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <span className="hidden sm:inline-block px-4 py-2 bg-gray-50 text-indigo-600 rounded-lg font-medium group-hover:bg-indigo-50 transition-colors">
                    Ver oferta →
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500 text-lg">No hemos encontrado ofertas con esos filtros.</p>
              <Link href="/" className="text-indigo-600 font-medium mt-2 inline-block hover:underline">
                Ver todas las ofertas
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
