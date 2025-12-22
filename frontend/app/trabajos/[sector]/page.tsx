import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import LocationFilter from '@/components/LocationFilter';
import Newsletter from '@/components/Newsletter';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Esto obliga a que la página se actualice siempre que entres (para ver ofertas nuevas al momento)
export const revalidate = 0;

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string | null;
  description_snippet: string | null;
  url_source: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

// Función auxiliar para buscar los datos
async function getSectorAndJobs(slug: string, locationQuery?: string, page: number = 1) {
  // 1. Buscamos el sector
  const { data: sectorData } = await supabase
    .from('sectors')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!sectorData) return { sector: null, jobs: [], total: 0 };

  // 2. Calculamos la paginación
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // 3. Preparamos la consulta de ofertas
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('sector_id', sectorData.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  // 4. Si hay filtro de ubicación, lo aplicamos
  if (locationQuery) {
    query = query.ilike('location', `%${locationQuery}%`);
  }

  const { data: jobsData, count } = await query;

  return { 
    sector: sectorData, 
    jobs: jobsData as Job[] || [], 
    total: count || 0 
  };
}

// --- SEO DINÁMICO ---
export async function generateMetadata(
  props: {
    params: Promise<{ sector: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const location = typeof searchParams.ubicacion === 'string' ? searchParams.ubicacion : null;
  
  // Arreglamos el nombre para que se vea bonito en Google
  const sectorName = params.sector === 'informatica-tecnologia' ? 'Informática y Tecnología' : params.sector;

  const title = location 
    ? `Ofertas de trabajo de ${sectorName} en ${location} | Portal IT`
    : `Bolsa de empleo de ${sectorName} | Portal IT`;

  const description = location
    ? `Busca y encuentra las mejores ofertas de empleo de ${sectorName} en ${location}. Actualizado hoy.`
    : `Las mejores ofertas de trabajo de ${sectorName} recopiladas de toda España.`;

  return { 
    title,
    description,
    alternates: {
      canonical: location 
        ? `/trabajos/${params.sector}?ubicacion=${location}`
        : `/trabajos/${params.sector}`
    }
  };
}

// --- COMPONENTE PRINCIPAL ---
export default async function SectorPage(props: { 
  params: Promise<{ sector: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const locationFilter = typeof searchParams.ubicacion === 'string' ? searchParams.ubicacion : undefined;
  
  const { sector, jobs, total } = await getSectorAndJobs(params.sector, locationFilter, page);

  if (!sector) notFound();

  // Cálculos para los botones de paginación
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Generador de enlaces para mantener el filtro de ubicación al cambiar de página
  const createPageLink = (newPage: number) => {
    const query = new URLSearchParams();
    if (locationFilter) query.set('ubicacion', locationFilter);
    query.set('page', newPage.toString());
    return `?${query.toString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Volver a inicio</Link>
          <h1 className="text-3xl font-bold text-gray-900">Ofertas de {sector.name}</h1>
          <p className="text-gray-500 mt-2">
            Mostrando {jobs.length} de {total} ofertas (Página {page})
          </p>
        </div>

        {/* --- BARRA DE HERRAMIENTAS --- */}
        <LocationFilter />
        
        {/* --- CAJA DE SUSCRIPCIÓN (NEWSLETTER) --- */}
        <Newsletter /> 

        {/* --- LISTA DE OFERTAS --- */}
        <div className="grid grid-cols-1 gap-4 mt-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          
          {jobs.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-white rounded shadow">
              No hay ofertas en esta página o ubicación.
            </div>
          )}
        </div>

        {/* --- BOTONES ANTERIOR / SIGUIENTE --- */}
        <div className="flex justify-center items-center gap-4 mt-10">
          {hasPrev ? (
            <Link 
              href={createPageLink(page - 1)}
              className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
            >
              &larr; Anterior
            </Link>
          ) : (
            <button disabled className="px-4 py-2 bg-gray-100 border border-gray-200 rounded text-gray-400 cursor-not-allowed">
              &larr; Anterior
            </button>
          )}

          <span className="text-sm font-medium text-gray-600">
            Página {page} de {totalPages || 1}
          </span>

          {hasNext ? (
            <Link 
              href={createPageLink(page + 1)}
              className="px-4 py-2 bg-indigo-600 border border-indigo-600 rounded hover:bg-indigo-700 text-white"
            >
              Siguiente &rarr;
            </Link>
          ) : (
            <button disabled className="px-4 py-2 bg-gray-100 border border-gray-200 rounded text-gray-400 cursor-not-allowed">
              Siguiente &rarr;
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
