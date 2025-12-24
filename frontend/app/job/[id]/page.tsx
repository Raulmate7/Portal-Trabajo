import { notFound } from "next/navigation";
import Link from "next/link";
import { Pool } from "pg";

// 1. Configuración de BD con soporte SSL para producción
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Definimos el tipo para las props (compatible con Next.js 15)
type Props = {
  params: Promise<{ id: string }>
}

async function getJob(id: string) {
  let client;
  try {
    client = await pool.connect();
    // Buscamos la oferta por ID
    const result = await client.query(
      "SELECT * FROM jobs WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    // Imprimimos el error real en los logs de Vercel para poder depurar
    console.error("❌ ERROR CRÍTICO DE BD:", error);
    return null;
  } finally {
    if (client) client.release();
  }
}

export default async function JobPage({ params }: Props) {
  // 2. AWAIT params (Obligatorio en versiones nuevas de Next.js)
  const { id } = await params;
  
  console.log(`🔍 Buscando oferta ID: ${id}`); // Log para depuración

  const job = await getJob(id);

  // Si no se encuentra o hay error de BD, muestra 404
  if (!job) {
    console.log("⚠️ Oferta no encontrada o error de conexión.");
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 inline-block">
          ← Volver al listado
        </Link>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="bg-indigo-600 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-indigo-100 text-lg">🏢 {job.company}</p>
          </div>

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

            <div className="prose max-w-none text-gray-600 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Descripción</h3>
              <p>
                {job.description || "Pulsa en el botón de abajo para ver la descripción completa."}
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 text-center">
              <a 
                href={job.url_source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 px-10 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
              >
                🚀 Aplicar en web original
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
