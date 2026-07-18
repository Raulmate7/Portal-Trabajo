// Skeleton global de la homepage — se activa durante SSR/ISR
// Evita pantalla en blanco y reduce el bounce rate percibido

function JobCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800/80 animate-pulse">
      <div className="flex gap-4 items-start">
        {/* Logo placeholder */}
        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-grow space-y-3">
          {/* Título */}
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
          {/* Empresa */}
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
          {/* Tags */}
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-lg w-24" />
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-lg w-20" />
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded-lg w-16" />
          </div>
        </div>
        {/* Botón CTA */}
        <div className="h-9 w-24 bg-indigo-100 dark:bg-indigo-950/30 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4 animate-pulse">
          <div className="h-6 bg-white/10 rounded-full w-64 mx-auto" />
          <div className="h-12 bg-white/10 rounded-xl w-80 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-96 mx-auto" />
          <div className="flex justify-center gap-3 pt-2">
            <div className="h-10 w-36 bg-white/20 rounded-xl" />
            <div className="h-10 w-36 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de ofertas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barra de búsqueda */}
            <div className="h-16 bg-white dark:bg-slate-900 rounded-2xl shadow animate-pulse" />
            {/* Cards */}
            {Array.from({ length: 8 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl shadow animate-pulse" />
            <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl shadow animate-pulse" />
            <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl shadow animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
