'use client';
// Error boundary global — captura errores de cualquier ruta cuando la BD falla u ocurre un error inesperado.
// Sin este archivo, Next.js muestra un error crudo sin navegación, causando abandono total del usuario.

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción, aquí se podría enviar el error a un servicio de logging
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Icono de error */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 space-y-5">
          <span className="text-6xl block">⚠️</span>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Algo ha ido mal
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Ha ocurrido un error inesperado. Puede ser temporal — prueba a recargar la página o vuelve al buscador.
          </p>

          {/* Código de error para debugging */}
          {error?.digest && (
            <p className="text-xs text-gray-400 dark:text-slate-600 font-mono bg-gray-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg inline-block">
              Error ID: {error.digest}
            </p>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={reset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              🔄 Intentar de nuevo
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors border border-gray-200 dark:border-slate-700"
            >
              🏠 Ir al buscador
            </Link>
          </div>
        </div>

        {/* Links de recuperación */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-slate-500 font-medium">
            Mientras tanto, puedes explorar:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'React', href: '/trabajos/react' },
              { label: 'Python', href: '/trabajos/python' },
              { label: 'Java', href: '/trabajos/java' },
              { label: 'Trabajo Remoto', href: '/trabajos/informatica-tecnologia-remoto' },
              { label: 'Salarios', href: '/salarios' },
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
