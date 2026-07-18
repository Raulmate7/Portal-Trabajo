'use client';
// Error boundary específico para /job/[id]
// Cuando una oferta no se puede cargar (BD caída, ID inválido que pasó validación, etc.),
// muestra un fallback con ofertas similares sugeridas en vez de una pantalla rota.

import { useEffect } from 'react';
import Link from 'next/link';

export default function JobDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[JobDetailError]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8 text-center">

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 space-y-5">
          <span className="text-5xl block">📭</span>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            No se pudo cargar esta oferta
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Es posible que la oferta haya expirado o que haya un problema temporal.
            Prueba a recargar o explora ofertas similares.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              🔄 Reintentar
            </button>
            <Link
              href="/trabajos/informatica-tecnologia"
              className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
            >
              🔍 Ver todas las ofertas
            </Link>
          </div>
        </div>

        {/* Sugerencias de búsqueda */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Explora estas categorías:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'React', href: '/trabajos/react' },
              { label: 'Python', href: '/trabajos/python' },
              { label: 'Java', href: '/trabajos/java' },
              { label: 'Node.js', href: '/trabajos/node' },
              { label: 'TypeScript', href: '/trabajos/typescript' },
              { label: 'DevOps', href: '/trabajos/cloud' },
              { label: 'Remoto', href: '/trabajos/informatica-tecnologia-remoto' },
              { label: 'Junior', href: '/trabajos/informatica-tecnologia-junior' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 rounded-lg border border-gray-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
