import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CourseAffiliate from '@/components/CourseAffiliate'; // <--- IMPORTANTE

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type Props = {
  params: Promise<{ id: string }>
}

// SEO Dinámico
export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { data: job } = await supabase
    .from('jobs')
    .select('title, company')
    .eq('id', params.id)
    .single();

  return {
    title: job ? `${job.title} en ${job.company} | Portal Trabajo IT` : 'Oferta de Empleo IT',
    description: `Postúlate a la vacante de ${job?.title} en ${job?.company} a través de nuestro portal.`,
  }
}

export default async function JobDetailPage(props: Props) {
  const params = await props.params;
  const { id } = params;

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-10">
        <Link href="/trabajos/informatica-tecnologia" className="text-indigo-600 hover:underline font-medium">
          ← Volver al listado
        </Link>
        
        <header className="mt-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{job.title}</h1>
          <p className="text-xl text-gray-500 mt-2 font-medium">{job.company} • {job.location}</p>
        </header>

        {/* --- SISTEMA DE MONETIZACIÓN AUTOMÁTICA --- */}
        <CourseAffiliate title={job.title} />

        <div className="mt-10 prose prose-lg">
          <h3 className="text-gray-900 font-bold">Descripción del puesto</h3>
          <p className="whitespace-pre-line text-gray-700 leading-relaxed mt-4">
            {job.description_snippet}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <a 
            href={job.url_source} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex justify-center items-center bg-indigo-600 text-white font-bold py-4 px-10 rounded-xl shadow-xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
          >
            Ver oferta original y aplicar &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
