import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import Search from '@/components/Search';
import LocationFilter from '@/components/LocationFilter';
import ScopeTabs from '@/components/ScopeTabs';
import SubscribeForm from '@/components/SubscribeForm';
import Link from 'next/link';
import { Job } from '@/types/job'; // <--- IMPORTAMOS EL TIPO CENTRALIZADO

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ sector: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SectorPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const locationFilter = searchParams.ubicacion as string | undefined;
  const queryFilter = searchParams.q as string | undefined;
  const scopeFilter = (searchParams.scope as string) || 'espana';

  // --- CONSULTA A BASE DE DATOS ---
  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  // 1. LÓGICA DE PAÍS (ESPAÑA vs GLOBAL)
  if (scopeFilter === 'espana') {
    query = query.or('location.ilike.%Madrid%,location.ilike.%Barcelona%,location.ilike.%Valencia%,location.ilike.%Sevilla%,location.ilike.%Bilbao%,location.ilike.%Málaga%,location.ilike.%Spain%,location.ilike.%España%,location.eq.Remoto');
  }

  // 2. Filtro de Ubicación
  if (locationFilter) {
    if (locationFilter === 'Remoto') {
      query = query.or('location.ilike.%Remoto%,location.ilike.%Remote%');
    } else {
      query = query.ilike('location', `%${locationFilter}%`);
    }
  }

  // 3. Filtro de Texto
  if (queryFilter) {
    query = query.or(`title.ilike.%${queryFilter}%,description_snippet.ilike.%${queryFilter}%`);
  }

  const { data: jobs } = await query.limit(50);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Portal Trabajo IT
            </h1>
          </Link>
          <div className="w-full md:w-80">
            <Search placeholder="Buscar tecnología..." />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ScopeTabs />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <LocationFilter />
            </div>
            <SubscribeForm location={locationFilter || (scopeFilter === 'espana' ? 'España' : 'Global')} />
          </aside>

          <div className="lg:col-span-3">
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                // Aquí TypeScript ya no fallará porque job es del tipo global Job
                jobs.map((job: Job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No se encontraron ofertas con estos filtros.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
