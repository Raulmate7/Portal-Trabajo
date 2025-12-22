import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ESTO ES LO MÁS IMPORTANTE PARA VERCEL:
// Le dice que no intente generar esta página durante el despliegue, sino solo cuando alguien entre.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type Props = {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage(props: Props) {
  const params = await props.params;
  const id = params.id;

  // Consultamos a Supabase
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/trabajos/informatica-tecnologia" className="text-indigo-600 hover:underline">
          ← Volver al listado
        </Link>
        
        <h1 className="text-3xl font-bold mt-6 text-gray-900">{job.title}</h1>
        <p className="text-xl text-gray-600 mt-2">{job.company} - {job.location}</p>
        
        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="whitespace-pre-line text-gray-800 leading-relaxed">
            {job.description_snippet}
          </p>
        </div>

        <div className="mt-10">
          <a 
            href={job.url_source} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
          >
            Ver oferta original y aplicar
          </a>
        </div>
      </div>
    </div>
  );
}
