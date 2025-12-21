import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import LocationFilter from '@/components/LocationFilter';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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

// CONFIGURACIÓN DE PAGINACIÓN
const ITEMS_PER_PAGE = 20;

async function getSectorAndJobs(slug: string, locationQuery?: string, page: number = 1) {
  // 1. Obtener sector
  const { data: sectorData } = await supabase
    .from('sectors')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!sectorData) return { sector: null, jobs: [], total: 0 };

  // 2. Calcular rango de paginación (Ej: Pag 1 es del 0 al 19)
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // 3. Consulta base
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' }) // Pedimos el total de ofertas
    .eq('sector_id', sectorData.id)
    .order('created_at', { ascending: false })
    .range(from, to); // Aplicamos el recorte

  // 4. Filtro de ubicación
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

// Metadatos
export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  return { title: `Ofertas de ${sector} | Portal` };
}

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

  // Cálculos para los botones
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Función para generar enlaces manteniendo los filtros
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
          <a href="/" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Volver a sectores</a>
          <h1 className="text-3xl font-bold text-gray-900">Ofertas de {sector.name}</h1>
          <p className="text-gray-500 mt-2">
            Mostrando {jobs.length} de {total} ofertas (Página {page})
          </p>
        </div>

        <LocationFilter />

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

        {/* BARRA DE PAGINACIÓN */}
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
