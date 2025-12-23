import Link from 'next/link';
import Search from '@/components/Search';
import Newsletter from '@/components/Newsletter'; // <--- IMPORTAMOS EL COMPONENTE
import { Suspense } from 'react';

export default function Home() {
  const categories = [
    { name: 'Frontend', icon: '💻', slug: 'react' },
    { name: 'Backend', icon: '⚙️', slug: 'python' },
    { name: 'Sistemas', icon: '🌐', slug: 'linux' },
    { name: 'Data Science', icon: '📊', slug: 'python' },
  ];

  return (
    <div className="bg-white">
      {/* SECCIÓN HERO */}
      <section className="relative py-20 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl">
            Encuentra tu próximo <span className="text-indigo-600">empleo IT</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Agregamos las mejores ofertas de tecnología de toda España. Tu carrera profesional empieza aquí.
          </p>
          
          <div className="mt-10 max-w-xl mx-auto">
            <Suspense fallback={<div className="h-12 bg-gray-100 animate-pulse rounded-xl"></div>}>
              <Search placeholder="¿Qué tecnología dominas?" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE CATEGORÍAS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Explora por tecnología</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link 
                key={cat.name}
                href={`/trabajos/informatica-tecnologia?q=${cat.slug}`}
                className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-center"
              >
                <span className="text-4xl mb-3">{cat.icon}</span>
                <span className="font-semibold text-gray-900">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN NEWSLETTER (NUEVA) */}
      <section className="py-4">
        <Newsletter />
      </section>

      {/* BOTÓN DE ACCESO AL LISTADO */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link 
            href="/trabajos/informatica-tecnologia"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-xl md:px-10 shadow-lg transition-transform hover:scale-105"
          >
            Ver todas las ofertas de hoy &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
