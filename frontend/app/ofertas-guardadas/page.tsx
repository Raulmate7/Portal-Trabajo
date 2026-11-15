"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { getJobSlug } from '@/lib/slug';

interface SavedJobRow {
  job_id: string | number;
  title: string | null;
  title_es?: string | null;
  company: string | null;
  location: string | null;
  salary?: string | null;
  isExpired?: boolean;
  daysRemaining?: number | null;
}

export default function OfertasGuardadasPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJobRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const loadSavedJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/saved-jobs', { cache: 'no-store' });
      if (res.status === 401) {
        setIsAuthenticated(false);
        setSavedJobs([]);
        return;
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.savedJobs)) {
        setIsAuthenticated(true);
        setSavedJobs(data.savedJobs.filter((j: SavedJobRow) => j.title));
      }
    } catch {
      setSavedJobs([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSavedJobs();
    window.addEventListener('saved_jobs_changed', loadSavedJobs);
    window.addEventListener('auth_state_changed', loadSavedJobs);
    return () => {
      window.removeEventListener('saved_jobs_changed', loadSavedJobs);
      window.removeEventListener('auth_state_changed', loadSavedJobs);
    };
  }, [loadSavedJobs]);

  const handleRemove = async (jobId: string | number) => {
    const idStr = String(jobId);
    setSavedJobs((prev) => prev.filter((j) => String(j.job_id) !== idStr));
    try {
      await fetch(`/api/auth/saved-jobs?jobId=${encodeURIComponent(idStr)}`, {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('saved_jobs_changed'));
    } catch {}
  };

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Ofertas Guardadas' },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              💼 Mis Ofertas Guardadas
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Vacantes de empleo IT sincronizadas con tu cuenta. Las ofertas expiradas se conservan 10 días extra antes de eliminarse.
            </p>
          </div>
        </div>

        {!isLoaded ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-primary)]"></div>
          </div>
        ) : !isAuthenticated ? (
          <div className="ui-card rounded-2xl p-12 text-center max-w-xl mx-auto">
            <span className="text-5xl block mb-4">🔐</span>
            <h3 className="text-lg font-bold mb-2">Inicia sesión para ver tus ofertas guardadas</h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              Únete o inicia sesión para guardar vacantes en la nube y conservar acceso 10 días extra si alguna expira.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition"
            >
              Unirse / Iniciar sesión
            </Link>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="ui-card rounded-2xl p-12 text-center max-w-xl mx-auto">
            <span className="text-5xl block mb-4">⭐</span>
            <h3 className="text-lg font-bold mb-2">No tienes ofertas guardadas</h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              Navega por nuestro catálogo de empleo técnico, haz clic en la estrella de cualquier oferta de tu interés y aparecerá aquí automáticamente.
            </p>
            <Link
              href="/trabajos/informatica-tecnologia"
              className="inline-block bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition"
            >
              Explorar Ofertas IT
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedJobs.map((job) => {
              const title = job.title_es || job.title || 'Oferta IT';
              const company = job.company || 'Empresa IT';
              const slug = getJobSlug({ id: job.job_id, title, company });
              return (
                <div
                  key={String(job.job_id)}
                  className="ui-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/job/${slug}`}
                        className="font-semibold text-base text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                      >
                        {title}
                      </Link>
                      {job.isExpired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {job.daysRemaining && job.daysRemaining > 0
                            ? `Expirada · se eliminará en ${job.daysRemaining}d`
                            : 'Expirada · se eliminará hoy'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {company} · {job.location || 'Remoto'}
                      {job.salary ? ` · ${job.salary}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/job/${slug}`}
                      className="ui-btn-press px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
                    >
                      Ver oferta
                    </Link>
                    <button
                      onClick={() => handleRemove(job.job_id)}
                      className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--status-danger)] text-xs font-medium transition-colors cursor-pointer"
                      title="Quitar de guardadas"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <AdBanner variant="inline" />
        </div>
      </div>
    </main>
  );
}
