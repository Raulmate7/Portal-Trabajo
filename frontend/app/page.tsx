import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 0; 

async function getSectors() {
  const { data } = await supabase.from('sectors').select('*');
  return data || [];
}

export default async function Home() {
  const sectors = await getSectors();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Buscador de Empleo España
        </h1>
        <p className="text-xl text-gray-600">
          Ofertas seleccionadas y clasificadas automáticamente.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sector) => (
          <Link 
            key={sector.id} 
            href={`/trabajos/${sector.slug}`}
            className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-500 transition duration-300"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {sector.name}
            </h2>
            <div className="text-indigo-600 font-medium flex items-center">
              Ver ofertas
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
