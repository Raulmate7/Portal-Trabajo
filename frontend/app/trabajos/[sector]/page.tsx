import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Metadata } from "next"; // Importamos tipos para SEO

// Tipos
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

const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

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

type Params = Promise<{ sector: string }>;

// --- NUEVA SECCIÓN: GENERADOR DE SEO ---
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  const categoriaBonita = categoryMap[sectorSlug] || sector.replace('-', ' ');
  const tituloCapitalizado = categoriaBonita.charAt(0).toUpperCase() + categoriaBonita.slice(1);

  return {
    title: `Ofertas de trabajo de ${tituloCapitalizado} en España | Portal Trabajo`,
    description: `Encuentra las mejores vacantes de ${tituloCapitalizado} actualizadas hoy. Recopilamos ofertas de las mejores empresas tecnológicas para perfiles ${tituloCapitalizado}.`,
    openGraph: {
      title: `Empleo ${tituloCapitalizado} - Vacantes Urgentes`,
      description: `Listado actualizado de ofertas de ${tituloCapitalizado}.`,
    }
  };
}
// ---------------------------------------

export default async function SectorPage({ params }: { params: Params }) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const dbCategory = categoryMap[sectorSlug];
  
  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbCategory) {
    query = query.eq('category', dbCategory);
  } else if (sectorSlug !== 'informatica-tecnologia') {
    query = query.ilike('title', `%${sectorSlug}%`);
  }

  const { data: jobs, error } = await query;

  if (error) {
    console.error("Error cargando ofertas:", error);
    return <div className="p-10 text-center text-red-500">Error temporal cargando ofertas.</div>;
  }

  const ad = adMap[sectorSlug];

  return (
    <div className="container mx-auto px-4 py-8">
      
      <h1 className="text-3xl font-bold mb-2 capitalize text-gray-900">
        Ofertas de {dbCategory || sector.replace('-', ' ')}
      </h1>
      <p className="text-gray-600 mb-8">
        {jobs?.length || 0} ofertas encontradas hoy.
      </p>

      {ad && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-lg font-bold text-indigo-900">{ad.title}</h3>
          <p className="text-indigo-700 mb-3">{ad.text}</p>
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            Ver Curso Recomendado →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
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
