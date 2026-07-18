import React from 'react';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-screen">
      {/* Breadcrumbs Skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-12 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        <span className="text-gray-300">/</span>
        <div className="h-4 w-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 border-b border-gray-100 dark:border-slate-900/50 pb-8">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-6 w-96 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>

      {/* Grid of Post Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              <span className="text-gray-300">·</span>
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-7 w-3/4 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-5 w-28 bg-indigo-100/50 dark:bg-indigo-950/20 rounded animate-pulse pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
