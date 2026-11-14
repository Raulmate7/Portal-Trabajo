'use client';

/**
 * JobCardSkeleton — Placeholder animado con la misma estructura que las cards
 * de LoadMoreJobs. Se muestra mientras se cargan las ofertas siguientes para
 * mejorar la percepción de velocidad y evitar Layout Shift (CLS).
 */
export default function JobCardSkeleton() {
  return (
    <div className="ui-card rounded-xl p-4 sm:p-5 animate-pulse">
      <div className="flex gap-3.5 items-start">
        {/* Logo placeholder */}
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shrink-0" />

        <div className="flex-1 min-w-0 flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="w-full space-y-2.5">
            {/* Título */}
            <div className="h-4 bg-[var(--bg-subtle)] rounded w-3/4" />
            {/* Empresa y ubicación */}
            <div className="h-3.5 bg-[var(--bg-subtle)] rounded w-1/3" />

            {/* Chips de metadatos */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="h-6 w-24 bg-[var(--bg-subtle)] rounded-md border border-[var(--border-subtle)]" />
              <div className="h-6 w-20 bg-[var(--bg-subtle)] rounded-md border border-[var(--border-subtle)]" />
              <div className="h-6 w-16 bg-[var(--bg-subtle)] rounded-md border border-[var(--border-subtle)]" />
            </div>
          </div>

          {/* Acciones placeholder */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="h-8 w-8 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]" />
            <div className="h-8 w-8 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
