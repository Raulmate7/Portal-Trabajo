import { createClient } from "@/utils/supabase/server";
import JobCard from "@/components/JobCard";
import { notFound } from "next/navigation";

// Definimos los tipos para que TypeScript no se queje
interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at: string;
}

// 1. DICCIONARIO DE TRADUCCIÓN (URL -> Base de Datos)
// Si la URL es "backend", buscamos "Backend" en la DB.
const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

// 2. DICCIONARIO DE DINERO (URL -> Publicidad)
// Aquí definiremos qué vendemos en cada sección
const adMap: Record<string, { title: string, text: string, link: string }> = {
  'backend': { 
    title: '¿Quieres ser experto en Java/Spring?', 
    text: 'Las empresas pagan +40k a los seniors. Fórmate aquí.', 
    link: 'https://ejemplo.com/curso-java' // Aquí pondremos tu link de afiliado luego
  },
  'data': { 
    title: 'Domina el Big Data y PowerBI', 
    text: 'El perfil más demandado de 2025.', 
    link: 'https://ejemplo.com/curso-data'
  }
};

// Necesario para Next.js 15+ (Params son asíncronos)
type Params = Promise<{ sector: string }>;

export default async function SectorPage({ params }: { params: Params }) {
  // Await de los parámetros (obligatorio en versiones nuevas)
  const { sector } = await params;
  
  // Normalizamos el sector de la URL (minusculas)
  const sectorSlug = sector.toLowerCase();
  
  // Buscamos si tenemos una categoría exacta para este sector
  const dbCategory = categoryMap[sectorSlug];
  
  // Iniciamos Supabase
  const supabase = await createClient();

  // CONSTRUCCIÓN DE LA CONSULTA
  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  // Lógica de Filtrado:
  if (dbCategory) {
    // A) Si es un sector conocido (ej: /trabajos/backend), filtramos por categoría
    query = query.eq('category', dbCategory);
  } else if (sectorSlug !== 'informatica-tecnologia') {
    // B) Si es un sector raro (ej: /trabajos/java), buscamos en el título por si acaso
    // Si es "informatica-tecnologia" (tu home), no filtramos nada (mostramos todo)
    query = query.ilike('title', `%${sectorSlug}%`);
  }

  // Ejecutamos la consulta
  const { data: jobs, error } = await query;

  if (error) {
    console.error("Error fetching jobs:", error);
    return <div className="p-10 text-center text-red-500">Error cargando ofertas. Intenta recargar.</div>;
  }

  // Recuperamos el banner de publicidad (si existe para este sector)
  const ad = adMap[sectorSlug];

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* TÍTULO DE LA SECCIÓN */}
      <h1 className="text-3xl font-bold mb-2 capitalize text-gray-900">
        Ofertas de {dbCategory || sector.replace('-', ' ')}
      </h1>
      <p className="text-gray-600 mb-8">
        {jobs?.length || 0} ofertas encontradas actualizadas hoy.
      </p>

      {/* ESPACIO PARA PUBLICIDAD (Monetización) */}
      {ad && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-lg font-bold text-indigo-900">{ad.title}</h3>
          <p className="text-indigo-700 mb-3">{ad.text}</p>
          <a href={ad.link} target="_blank" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            Ver Curso Recomendado →
          </a>
        </div>
      )}

      {/* LISTA DE OFERTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs && jobs.length > 0 ? (
          jobs.map((job: Job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No hay ofertas activas en esta categoría hoy.</p>
            <p className="text-sm text-gray-400 mt-2">El robot volverá a buscar mañana a las 08:00.</p>
          </div>
        )}
      </div>
    </div>
  );
}
