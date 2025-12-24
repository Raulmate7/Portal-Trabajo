import { notFound } from "next/navigation";
import Link from "next/link";
import { Pool } from "pg";

// Configuración de la Base de Datos (solo lectura para esta página)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getJob(id: string) {
  try {
    const client = await pool.connect();
    // Buscamos la oferta que coincida con el ID
    const result = await client.query(
      "SELECT * FROM jobs WHERE id = $1",
      [id]
    );
    client.release();
    
    // Si no existe, devolvemos null
    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}

export default async function JobPage({ params }: { params: { id: string } }) {
  // 1. Obtenemos el ID de la URL
  const { id } = params;
  
  // 2. Buscamos los datos en la BD
  const job = await getJob(id);

  // 3. Si no existe, mostramos error 404
  if (!job) {
    notFound();
  }

  // 4. Si existe, pintamos la página
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Botón Volver */}
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 inline-block">
          ← Volver al listado
        </Link>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          
          {/* Encabezado */}
          <div className="bg-indigo-600 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-indigo-100 text-lg flex items-center gap-2">
              🏢 {job.company}
            </p>
          </div>

          {/* Detalles */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600">
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="block text-sm text-gray-400 uppercase font-bold tracking-wider">Ubicación</span>
                <span className="text-lg font-semibold text-gray-800">📍 {job.location}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="block text-sm text-gray-400 uppercase font-bold tracking-wider">Salario</span>
                <span className="text-lg font-semibold text-gray-800">💰 {job.salary || "A convenir"}</span>
              </div>
            </div>

            {/* Descripción (si la tuvieras en BD, si no, ponemos un placeholder) */}
            <div className="prose max-w-none text-gray-600 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Descripción del puesto</h3>
              <p>
                {job.description 
                  ? job.description 
                  : "Esta oferta fue recopilada automáticamente. Pulsa en el botón de abajo para ver la descripción completa en la web original."}
              </p>
            </div>

            {/* Botón de Acción Principal */}
            <div className="mt-10 pt-6 border-t border-gray-100 text-center">
              <a 
                href={job.url_source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 px-10 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
              >
                🚀 Aplicar a esta Oferta
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-sm text-gray-400 mt-4">
                Serás redirigido a la web original para completar tu inscripción.
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
