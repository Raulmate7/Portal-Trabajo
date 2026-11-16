'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PendingJobItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  url_source: string | null;
  description_snippet: string | null;
  created_at: string;
}

export default function PendingJobsModeration({
  initialJobs,
  initialTotal,
}: {
  initialJobs: PendingJobItem[];
  initialTotal?: number;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<PendingJobItem[]>(initialJobs);
  const [total, setTotal] = useState<number>(initialTotal ?? initialJobs.length);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(Math.max(1, Math.ceil((initialTotal ?? initialJobs.length) / 50)));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const fetchPage = async (nextPage: number, q: string) => {
    setLoadingList(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/admin/jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error cargando ofertas pendientes');
      setJobs(data.jobs || []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? nextPage);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la lista');
    } finally {
      setLoadingList(false);
    }
  };

  const handleAction = async (job: PendingJobItem, action: 'approve' | 'reject') => {
    setBusyId(job.id);
    setError('');
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          action,
          title: job.title,
          company: job.company,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo completar la acción');
      }
      setJobs((prev) => prev.filter((item) => item.id !== job.id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la moderación');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300/70 dark:border-amber-700/50 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡️</span> Ofertas Pendientes de Validación ({total})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Las ofertas enviadas desde /publicar-oferta permanecen ocultas hasta que las apruebes.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPage(1, searchQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar título o empresa..."
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={loadingList}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            {loadingList ? '...' : 'Buscar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="m-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm italic">
          No hay ofertas pendientes de moderación en este momento.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.map((job) => {
            const isBusy = busyId === job.id;
            return (
              <div
                key={job.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {job.title}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {job.company}
                    </span>
                    {job.location && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        📍 {job.location}
                      </span>
                    )}
                    {job.salary && (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        💶 {job.salary}
                      </span>
                    )}
                  </div>
                  {job.description_snippet && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {job.description_snippet}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    <span>
                      Enviada: {new Date(job.created_at).toLocaleString('es-ES')}
                    </span>
                    {job.url_source && (
                      <a
                        href={job.url_source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium truncate max-w-xs"
                      >
                        Ver enlace de candidatura ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleAction(job, 'approve')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isBusy ? 'Procesando...' : '✓ Aprobar y Publicar'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleAction(job, 'reject')}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ✕ Rechazar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Página {page} de {totalPages} ({total} resultados)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loadingList || page <= 1}
              onClick={() => fetchPage(page - 1, searchQuery)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              ← Anterior
            </button>
            <button
              type="button"
              disabled={loadingList || page >= totalPages}
              onClick={() => fetchPage(page + 1, searchQuery)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
