import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import Search from '@/components/Search';
import LocationFilter from '@/components/LocationFilter';
import ScopeTabs from '@/components/ScopeTabs'; // <--- NUEVO COMPONENTE
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;

  const locationFilter = searchParams.ubicacion as string | undefined;
  const queryFilter = searchParams.q as string | undefined;
  const scopeFilter = (searchParams.scope as string) || 'espana'; // Por defecto España

  // --- CONSULTA A BASE DE DATOS ---
  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  // 1. LÓGICA DE PAÍS (ESPAÑA vs GLOBAL)
  if (scopeFilter === 'espana') {
    // Filtramos para incluir solo ciudades españolas comunes + "Remoto" genérico (que asumimos ES)
    // OJO: Esto depende de cómo guarden los scrapers la info.
    query = query.or('location.ilike.%Madrid%,location.ilike.%Barcelona%,location.ilike.%Valencia%,location.ilike.%Sevilla%,location.ilike.%Bilbao%,location.ilike.%Málaga%,location.ilike.%Spain%,location.ilike.%España%,location.eq.Remoto');
  } else {
    // Si es Global, NO filtramos por país (mostramos todo: USA, World, etc.)
  }

  // 2. Filtro de Ubicación (Sidebar manual)
  if (locationFilter) {
    if (locationFilter === 'Remoto') {
      query = query.or('location.ilike.%Remoto%,location.ilike.%Remote%');
    } else {
      query = query.ilike('location', `%${locationFilter}%`);
    }
  }

  // 3. Filtro de Texto (Buscador Superior)
  if (queryFilter) {
    query = query.or(`title.ilike.%${queryFilter}%,description_snippet.ilike.%${queryFilter}%`);
  }

  query = query.limit(50);
  const { data: jobs } = await query;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- CABECERA --- */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Portal Trabajo IT
              </h1>
              {queryFilter && <span className="text-xs text-gray-500">Filtro: "{queryFilter}"</span>}
            </div>
          </Link>
          <div className="w-full md:w-80">
            <Search placeholder="Tecnología (ej: Python)..." />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- PESTAÑAS DE ALCANCE (NUEVO) --- */}
        <ScopeTabs />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* --- SIDEBAR --- */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <LocationFilter />
            </div>

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-lg text-white">Alertas de Empleo</h3>
              </div>
              <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                Recibe las ofertas de <strong>{locationFilter || (scopeFilter === 'espana' ? 'España' : 'Todo el mundo')}</strong> en tu inbox.
              </p>
              <form className="space-y-3">
                <input 
                  type="email" 
                  placeholder="tu@email.com" 
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow-md">
                  Suscribirme
                </button>
              </form>
            </div>
          </aside>

          {/* --- RESULTADOS --- */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🤷‍♂️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    No hay ofertas en {scopeFilter === 'espana' ? 'España' : 'Global'}
                  </h3>
                  <p className="mt-1 text-gray-500 max-w-sm mx-auto">
                    {scopeFilter === 'espana' 
                      ? 'Tus fuentes actuales son internacionales. Prueba a cambiar a la pestaña "Global".' 
                      : 'Intenta buscar otra tecnología.'}
                  </p>
                  <div className="mt-6">
                    {scopeFilter === 'espana' ? (
                       // Si estamos en España y no hay nada, sugerimos ir a Global
                       <Link href="?scope=global" className="text-indigo-600 font-semibold hover:underline">
                         Ver ofertas Globales &rarr;
                       </Link>
                    ) : (
                       <Link href="/trabajos/informatica-tecnologia?scope=global" className="text-indigo-600 hover:underline">
                         Limpiar búsqueda
                       </Link>
                    )}
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
