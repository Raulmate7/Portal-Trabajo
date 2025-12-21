import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl max-w-lg text-center border-4 border-indigo-500/20">
        <div className="mb-6 text-6xl">
          💻
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Portal Trabajo <span className="text-indigo-600">IT</span>
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          El agregador de empleo especializado en tecnología.
          <br/>
          Sin ruido. Solo ofertas reales.
          <br/>
          <span className="text-sm font-medium text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full mt-3 inline-block">
            ⚡ Actualizado cada 8 horas
          </span>
        </p>

        <Link
          href="/trabajos/informatica-tecnologia"
          className="group block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/30"
        >
          Ver Ofertas de Empleo &rarr;
        </Link>
        
        <p className="mt-6 text-xs text-gray-400">
          Encuentra Java, Python, React, Ciberseguridad y más.
        </p>
      </div>
    </main>
  );
}
