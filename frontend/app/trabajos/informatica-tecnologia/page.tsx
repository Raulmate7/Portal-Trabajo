import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import Search from '@/components/Search';
import LocationFilter from '@/components/LocationFilter';
import Link from 'next/link';

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

  // --- CONSULTA A BASE DE DATOS ---
  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  // 1. Filtro de Ubicación (Sidebar)
  if (locationFilter) {
    if (locationFilter === 'Remoto') {
      query = query.or('location.ilike.%Remoto%,location.ilike.%Remote%');
    } else {
      query = query.ilike('location', `%${locationFilter}%`);
    }
  }

  // 2. Filtro de Texto (Buscador Superior)
  if (queryFilter) {
    query = query.or(`title.ilike.%${queryFilter}%,description_snippet.ilike.%${queryFilter}%`);
  }

  // Limitamos a 50 resultados
  query = query.limit(50);
  const { data: jobs } = await query;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- CABECERA (LOGO + BUSCADOR DE TECNOLOGÍA) --- */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* LOGO CLICABLE (Lleva al inicio) */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Portal Trabajo IT
              </h1>
              {/* Mostramos pequeño texto si hay búsqueda activa */}
              {queryFilter && (
                <span className="text-xs text-gray-500 font-normal">
                  Filtro: "{queryFilter}"
                </span>
              )}
            </div>
          </Link>
          
          {/* BUSCADOR DE TEXTO (Python, Java...) A la derecha */}
          <div className="w-full md:w-80">
            <Search placeholder="Tecnología (ej: Python, React)..." />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* --- COLUMNA IZQUIERDA (FILTROS + CORREO) --- */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* 1. Selector de Ubicación (Ahora es buscador gracias a LocationFilter) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <LocationFilter />
            </div>

            {/* 2. Caja de Suscripción (DISEÑO OSCURO ALTO CONTRASTE) */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-lg text-white">Alertas de Empleo</h3>
              </div>
              <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                Recibe las ofertas de <strong>{locationFilter || 'España'}</strong> directamente en tu inbox. Cero spam.
              </p>
              <form className="space-y-3">
                {/* Input con fondo oscuro y texto BLANCO */}
                <input 
                  type="email" 
                  placeholder="tu@email.com" 
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow-md">
                  Suscribirme Gratis
                </button>
              </form>
            </div>
          </aside>

          {/* --- COLUMNA DERECHA (RESULTADOS) --- */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No encontramos ofertas exactas</h3>
                  <p className="mt-1 text-gray-500">Intenta buscar algo más general o cambia la ubicación.</p>
                  <div className="mt-6">
                    <Link
                      href="/trabajos/informatica-tecnologia"
                      className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Limpiar filtros
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
