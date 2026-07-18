// Skeleton para el listado de sector /trabajos/[sector]
// Previene pantalla en blanco durante ISR y reduce INP (Interaction to Next Paint)

function JobCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800/80 p-5 animate-pulse">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-grow space-y-2.5">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-2/5" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-lg w-28" />
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-lg w-20" />
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-lg w-16" />
          </div>
        </div>
        <div className="h-9 w-24 bg-indigo-100 dark:bg-indigo-950/30 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

export default function SectorLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs skeleton */}
        <div className="flex gap-2 items-center mb-6 animate-pulse">
          <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>

        {/* Título skeleton */}
        <div className="mb-6 animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista principal */}
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl shadow animate-pulse" />
            <div className="h-40 bg-white dark:bg-slate-900 rounded-2xl shadow animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
