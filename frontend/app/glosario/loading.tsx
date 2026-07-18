import React from 'react';

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="h-6 w-52 bg-white/20 rounded-full mx-auto animate-pulse" />
          <div className="h-12 w-64 bg-white/20 rounded-lg mx-auto animate-pulse" />
          <div className="h-6 w-96 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="h-4 w-44 bg-white/10 rounded-lg mx-auto animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex gap-2">
          <div className="h-4 w-12 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
          <span className="text-gray-300">/</span>
          <div className="h-4.5 w-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-8">
        {/* Letras de navegación rápida Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
          <div className="h-4 w-28 bg-gray-200 rounded mx-auto animate-pulse" />
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Listado de términos agrupados Skeleton */}
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, lIdx) => (
            <section key={lIdx} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, tIdx) => (
                  <div key={tIdx} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-24 bg-indigo-50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
