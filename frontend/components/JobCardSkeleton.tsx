'use client';

/**
 * JobCardSkeleton — Placeholder animado con la misma estructura que las cards
 * de LoadMoreJobs. Se muestra mientras se cargan las ofertas siguientes para
 * mejorar la percepción de velocidad y evitar Layout Shift (CLS).
 */
export default function JobCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800/80 animate-pulse">
      <div className="flex gap-4 items-start">
        {/* Logo placeholder */}
        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />

        <div className="flex-grow w-full flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="w-full space-y-3">
            {/* Título */}
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-md w-3/4" />
            {/* Empresa */}
            <div className="h-4 bg-gray-150 dark:bg-slate-750 rounded-md w-1/3" />

            {/* Chips de metadatos */}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="h-7 w-28 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700" />
              <div className="h-7 w-24 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700" />
              <div className="h-7 w-20 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700" />
            </div>
          </div>

          {/* Botón placeholder */}
          <div className="h-9 w-28 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  );
}
