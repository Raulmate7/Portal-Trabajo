import { supabase } from '@/lib/supabase';
import JobCard from '@/components/JobCard';
import { notFound } from 'next/navigation';

export const revalidate = 60;

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

// Función auxiliar para buscar datos
async function getSectorAndJobs(slug: string): Promise<{ sector: Sector | null, jobs: Job[] }> {
  // 1. Obtener el sector por slug
  const { data: sectorData } = await supabase
    .from('sectors')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!sectorData) {
    return { sector: null, jobs: [] };
  }

  // 2. Obtener las ofertas de trabajo para ese sector
  const { data: jobsData } = await supabase
    .from('jobs')
    .select('*')
    .eq('sector_id', sectorData.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return { sector: sectorData as Sector, jobs: jobsData as Job[] || [] };
}

// Generación de metadatos (Adaptado a Next.js 15/16)
export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }) {
  const { sector: sectorSlug } = await params; // <--- AQUÍ ESTÁ EL CAMBIO CLAVE
  const { sector } = await getSectorAndJobs(sectorSlug);

  if (!sector) {
    return {
      title: 'Sector no encontrado',
    };
  }

  return {
    title: `Ofertas de Empleo de ${sector.name} | Agregador`,
    description: `Encuentra las últimas ofertas de trabajo en el sector de ${sector.name.toLowerCase()}.`,
  };
}

// Componente Principal (Adaptado a Next.js 15/16)
export default async function SectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector: sectorSlug } = await params; // <--- AQUÍ ESTÁ EL CAMBIO CLAVE
  const { sector, jobs } = await getSectorAndJobs(sectorSlug);

  if (!sector) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Volver a sectores</a>
          <h1 className="text-3xl font-bold text-gray-900">
            Ofertas de {sector.name}
          </h1>
          <p className="text-gray-500 mt-2">
            {jobs.length} ofertas encontradas recientemente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div className="p-12 bg-white rounded-lg shadow text-center border border-gray-100">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-lg font-medium text-gray-900">No hay ofertas todavía</h3>
              <p className="text-gray-500 mt-1">El robot aún no ha encontrado trabajos para este sector. Vuelve más tarde.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
