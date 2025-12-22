import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CourseAffiliate from '@/components/CourseAffiliate';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { data: job } = await supabase.from('jobs').select('title, company').eq('id', params.id).single();
  return {
    title: job ? `${job.title} | Portal Trabajo IT` : 'Oferta de Empleo',
  }
}

export default async function JobDetailPage(props: Props) {
  const params = await props.params;
  const id = params.id;

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
        <Link href="/" className="text-indigo-600 hover:underline">← Volver al listado</Link>
        
        <h1 className="text-3xl font-bold mt-6 text-gray-900">{job.title}</h1>
        <p className="text-xl text-gray-600 mt-2">{job.company} - {job.location}</p>
        
        {/* Aquí el componente de monetización */}
        <CourseAffiliate title={job.title} />

        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="whitespace-pre-line text-gray-800 leading-relaxed">
            {job.description_snippet}
          </p>
        </div>

        <div className="mt-10">
          <a href={job.url_source} target="_blank" rel="noopener noreferrer"
             className="inline-block bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg">
            Ver oferta original y aplicar
          </a>
        </div>
      </div>
    </div>
  );
}
