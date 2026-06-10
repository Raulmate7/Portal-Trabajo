import pool from '@/lib/db';
import JobCard from '@/components/JobCard';
import Search from '@/components/Search';
import LocationFilter from '@/components/LocationFilter';
import ScopeTabs from '@/components/ScopeTabs';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import PushSubscribe from '@/components/PushSubscribe';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getJobs(scopeFilter: string, locationFilter?: string, queryFilter?: string, page: number = 1) {
  const limit = 50;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE is_active = TRUE";
    const params: any[] = [];
    let paramIndex = 1;

    // 1. LÓGICA DE PAÍS (ESPAÑA vs GLOBAL)
    if (scopeFilter === 'espana') {
      sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2} OR location ILIKE $${paramIndex + 3} OR location ILIKE $${paramIndex + 4} OR location ILIKE $${paramIndex + 5} OR location ILIKE $${paramIndex + 6} OR location ILIKE $${paramIndex + 7} OR location = $${paramIndex + 8})`;
      params.push('%Madrid%', '%Barcelona%', '%Valencia%', '%Sevilla%', '%Bilbao%', '%Spain%', '%España%', '%Málaga%', 'Remoto');
      paramIndex += 9;
    }

    // 2. Filtro de Ubicación (Sidebar manual)
    if (locationFilter) {
      if (locationFilter === 'Remoto') {
        sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1})`;
        params.push('%Remoto%', '%Remote%');
        paramIndex += 2;
      } else {
        sql += ` AND location ILIKE $${paramIndex}`;
        params.push(`%${locationFilter}%`);
        paramIndex++;
      }
    }

    // 3. Filtro de Texto (Buscador Superior)
    if (queryFilter) {
      sql += ` AND (title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
      params.push(`%${queryFilter}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Error cargando ofertas:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;

  const locationFilter = searchParams.ubicacion as string | undefined;
  const queryFilter = searchParams.q as string | undefined;
  const scopeFilter = (searchParams.scope as string) || 'espana';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  const jobs = await getJobs(scopeFilter, locationFilter, queryFilter, validPage);

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
        
        {/* --- PESTAÑAS DE ALCANCE --- */}
        <ScopeTabs />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* --- SIDEBAR --- */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <LocationFilter />
            </div>

            {/* AQUÍ ESTÁ EL CAMBIO: Usamos el componente funcional */}
            <SubscribeForm location={locationFilter || (scopeFilter === 'espana' ? 'España' : 'Todo el mundo')} />
            <PushSubscribe />

            {/* Banner de afiliado: herramientas para devs */}
            <AdBanner variant="sidebar" />
          </aside>

          {/* --- RESULTADOS --- */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                <>
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}

                  {/* Controles de Paginación */}
                  <div className="flex justify-between items-center pt-6">
                    {validPage > 1 ? (
                      <Link
                        href={`/trabajos/informatica-tecnologia?scope=${scopeFilter}&ubicacion=${encodeURIComponent(locationFilter || '')}&q=${encodeURIComponent(queryFilter || '')}&page=${validPage - 1}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ← Anterior
                      </Link>
                    ) : (
                      <div />
                    )}
                    <span className="text-sm text-gray-600">Página {validPage}</span>
                    {jobs.length === 50 ? (
                      <Link
                        href={`/trabajos/informatica-tecnologia?scope=${scopeFilter}&ubicacion=${encodeURIComponent(locationFilter || '')}&q=${encodeURIComponent(queryFilter || '')}&page=${validPage + 1}`}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Siguiente →
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>
                </>
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
                      ? 'Prueba a cambiar a la pestaña "Global" o busca otra tecnología.' 
                      : 'Intenta buscar algo más general.'}
                  </p>
                  <div className="mt-6">
                    {scopeFilter === 'espana' ? (
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
