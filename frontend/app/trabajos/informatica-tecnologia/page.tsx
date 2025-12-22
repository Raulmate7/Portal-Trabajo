import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import Search from '@/components/Search';
import Link from 'next/link';

// Esto fuerza a que la página sea dinámica (necesario para búsquedas)
export const dynamic = 'force-dynamic';

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: {
    ubicacion?: string;
    q?: string;
  };
}) {
  const locationFilter = searchParams?.ubicacion;
  const queryFilter = searchParams?.q;

  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (locationFilter) {
    query = query.ilike('location', `%${locationFilter}%`);
  }

  if (queryFilter) {
    // Busca en título O descripción
    query = query.or(`title.ilike.%${queryFilter}%,description_snippet.ilike.%${queryFilter}%`);
  }

  const { data: jobs } = await query;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabecera */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Ofertas IT {locationFilter ? `- ${locationFilter}` : ''}
          </h1>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Inicio
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* BUSCADOR */}
        <Search placeholder="Buscar (ej: Java, Junior, Remoto)..." />

        {/* Lista de Resultados */}
        <div className="space-y-4 mt-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay ofertas con esa búsqueda 😔</p>
              <Link href="/trabajos/informatica-tecnologia" className="text-indigo-600 hover:underline mt-2 inline-block">
                Ver todas las ofertas
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}	
