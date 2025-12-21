import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import LocationFilter from '@/components/LocationFilter';
import { notFound } from 'next/navigation';

// Esto hace que la página sea dinámica y el buscador funcione al instante
export const revalidate = 0; 

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description_snippet: string | null;
  url_source: string;
  created_at: string;
}

interface Sector {
  id: number;
  name: string;
  slug: string;
}

// Función auxiliar para buscar datos en Supabase
async function getSectorAndJobs(slug: string, locationQuery?: string): Promise<{ sector: Sector | null, jobs: Job[] }> {
  // 1. Obtener el sector
  const { data: sectorData } = await supabase
    .from('sectors')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!sectorData) {
    return { sector: null, jobs: [] };
  }

  // 2. Construir la consulta de trabajos
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('sector_id', sectorData.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // 3. APLICAR FILTRO DE UBICACIÓN (La parte nueva)
  if (locationQuery) {
    // 'ilike' busca texto ignorando mayúsculas/minúsculas
    query = query.ilike('location', `%${locationQuery}%`);
  }

  const { data: jobsData } = await query;

  return { sector: sectorData as Sector, jobs: jobsData as Job[] || [] };
}

// Generar títulos para el navegador
export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }) {
  const { sector: sectorSlug } = await params;
  const { sector } = await getSectorAndJobs(sectorSlug);

  if (!sector) return { title: 'No encontrado' };

  return {
    title: `Ofertas de ${sector.name} | Buscador`,
  };
}

// Componente Principal de la Página
export default async function SectorPage(props: { 
  params: Promise<{ sector: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // En Next.js 15/16, params y searchParams son promesas que hay que esperar
  const params = await props.params;
  const searchParams = await props.searchParams;

  const sectorSlug = params.sector;
  
  // Leemos si hay algo escrito en la URL (ej: ?ubicacion=Madrid)
  const locationFilter = typeof searchParams.ubicacion === 'string' ? searchParams.ubicacion : undefined;

  // Pedimos los datos filtrados
  const { sector, jobs } = await getSectorAndJobs(sectorSlug, locationFilter);

  if (!sector) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Volver a sectores</a>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Ofertas de {sector.name}
                </h1>
                {locationFilter && (
                    <p className="text-indigo-600 font-medium mt-1 bg-indigo-50 inline-block px-2 py-1 rounded">
                        📍 Filtrando por zona: "{locationFilter}"
                    </p>
                )}
             </div>
             <p className="text-gray-500">
                {jobs.length} ofertas encontradas
             </p>
          </div>
        </div>

        {/* AQUÍ CARGAMOS TU BARRA DE BÚSQUEDA NUEVA */}
        <LocationFilter />

        <div className="grid grid-cols-1 gap-4 mt-6">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="p-12 bg-white rounded-lg shadow text-center border border-gray-100">
              <span className="text-4xl block mb-4">🌍</span>
              <h3 className="text-lg font-medium text-gray-900">No hay ofertas en esta zona</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                No hemos encontrado ofertas en <strong>{locationFilter}</strong> por ahora. 
                Prueba a borrar el filtro para ver todas las de España.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
