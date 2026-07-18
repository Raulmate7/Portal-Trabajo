// Skeleton para la página de detalle de oferta /job/[id]
// Previene pantalla en blanco durante el fetch de la oferta y reduce el bounce rate

export default function JobDetailLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs skeleton */}
        <div className="flex gap-2 items-center mb-6 animate-pulse">
          <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden animate-pulse">
              {/* Header de la oferta */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 md:p-8">
                <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 rounded-lg bg-white/20 shrink-0" />
                  <div className="flex-grow space-y-3">
                    <div className="h-7 bg-white/20 rounded-lg w-3/4" />
                    <div className="flex gap-3">
                      <div className="h-6 bg-white/15 rounded-full w-32" />
                      <div className="h-6 bg-white/15 rounded-full w-28" />
                      <div className="h-6 bg-white/15 rounded-full w-24" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuerpo de la descripción */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
                </div>
                {/* Botón aplicar */}
                <div className="pt-4 flex gap-3">
                  <div className="h-12 bg-indigo-200 dark:bg-indigo-900/50 rounded-xl w-48" />
                  <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl w-12" />
                  <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl w-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen rápido */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-2/5" />
                  </div>
                ))}
              </div>
              <div className="h-10 bg-indigo-100 dark:bg-indigo-950/30 rounded-xl w-full mt-2" />
            </div>
            {/* Suscripción */}
            <div className="h-48 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
