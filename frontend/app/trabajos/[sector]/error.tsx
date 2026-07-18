'use client';
// Error boundary específico para las páginas de sector /trabajos/[sector]
// Cuando la BD falla o una página programática no se puede generar, 
// muestra alternativas útiles en vez de un error crudo.

import { useEffect } from 'react';
import Link from 'next/link';

export default function SectorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SectorError]', error);
  }, [error]);

  const popularCategories = [
    { label: '⚛️ React', href: '/trabajos/react' },
    { label: '🐍 Python', href: '/trabajos/python' },
    { label: '☕ Java', href: '/trabajos/java' },
    { label: '🟢 Node.js', href: '/trabajos/node' },
    { label: '☁️ Cloud / DevOps', href: '/trabajos/cloud' },
    { label: '🌐 Remoto', href: '/trabajos/informatica-tecnologia-remoto' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8 text-center">

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 space-y-5">
          <span className="text-5xl block">🔧</span>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            No podemos cargar esta búsqueda ahora
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Ha ocurrido un error al recuperar las ofertas. Puedes intentarlo de nuevo o explorar
            las categorías más populares mientras tanto.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              🔄 Reintentar
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
            >
              🏠 Buscador principal
            </Link>
          </div>
        </div>

        {/* Categorías populares de fallback */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Categorías más buscadas:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {popularCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 rounded-xl p-4 text-sm font-semibold text-gray-800 dark:text-slate-200 transition-all hover:shadow-sm text-center"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
