import { supabase } from "@/lib/supabase"; // <--- CAMBIO IMPORTANTE: Usamos tu archivo real
import JobCard from "@/components/JobCard";

// Definimos los tipos exactos para evitar errores de TypeScript
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

// 1. DICCIONARIO DE CATEGORÍAS (URL -> Base de Datos)
const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

// 2. DICCIONARIO DE PUBLICIDAD
const adMap: Record<string, { title: string, text: string, link: string }> = {
  'backend': { 
    title: '¿Quieres ser experto en Java/Spring?', 
    text: 'Las empresas pagan +40k a los seniors. Fórmate aquí.', 
    link: 'https://ejemplo.com/curso-java' 
  },
  'data': { 
    title: 'Domina el Big Data y PowerBI', 
    text: 'El perfil más demandado de 2025.', 
    link: 'https://ejemplo.com/curso-data'
  }
};

// Tipo para los parámetros de Next.js 15+
type Params = Promise<{ sector: string }>;

export default async function SectorPage({ params }: { params: Params }) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  // Determinamos qué categoría buscar en la DB
  const dbCategory = categoryMap[sectorSlug];
  
  // CONSTRUCCIÓN DE LA CONSULTA
  // Usamos 'supabase' directamente, sin await createClient()
  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  // Lógica de Filtrado
  if (dbCategory) {
    // Si la URL coincide con una categoría conocida (ej: /backend)
    query = query.eq('category', dbCategory);
  } else if (sectorSlug !== 'informatica-tecnologia') {
    // Si es una búsqueda rara, intentamos buscar en el título
    // "informatica-tecnologia" se salta esto para mostrar todo
    query = query.ilike('title', `%${sectorSlug}%`);
  }

  // Ejecutamos la consulta
  const { data: jobs, error } = await query;

  if (error) {
    console.error("Error cargando ofertas:", error);
    return <div className="p-10 text-center text-red-500">Error temporal cargando ofertas.</div>;
  }

  // Seleccionamos el anuncio adecuado
  const ad = adMap[sectorSlug];

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* TÍTULO */}
      <h1 className="text-3xl font-bold mb-2 capitalize text-gray-900">
        Ofertas de {dbCategory || sector.replace('-', ' ')}
      </h1>
      <p className="text-gray-600 mb-8">
        {jobs?.length || 0} ofertas encontradas hoy.
      </p>

      {/* BANNER PUBLICIDAD (Solo sale si hay anuncio configurado) */}
      {ad && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-lg font-bold text-indigo-900">{ad.title}</h3>
          <p className="text-indigo-700 mb-3">{ad.text}</p>
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            Ver Curso Recomendado →
          </a>
        </div>
      )}

      {/* LISTA DE TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            // TypeScript detectará automáticamente que 'job' coincide con la interfaz gracias a la inferencia de Supabase
            // pero forzamos el tipo 'any' o 'Job' en el map si fuera necesario. Aquí debería ir fluido.
            <JobCard key={job.id} job={job as Job} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No hay ofertas de {dbCategory || sector} ahora mismo.</p>
            <p className="text-sm text-gray-400 mt-2">Vuelve mañana a las 08:00.</p>
          </div>
        )}
      </div>
    </div>
  );
}
