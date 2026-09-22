export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex gap-4 items-start">
          <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex-1 space-y-4 py-1">
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-5/6" />
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
