'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdBanner from './AdBanner';
import JobCard from './JobCard';
import JobCardSkeleton from './JobCardSkeleton';

interface Job {
  id: string;
  title: string;
  title_es?: string | null;
  company: string;
  location: string;
  url_source?: string;
  description_snippet?: string | null;
  category?: string | null;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at: string;
}

interface LoadMoreJobsProps {
  lang?: string;
  initiallyHasMore: boolean;
}

export default function LoadMoreJobs({ lang = 'es', initiallyHasMore }: LoadMoreJobsProps) {
  const isEnglish = lang === 'en';
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initiallyHasMore);

  const q = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';
  const minSalary = searchParams.get('min_salary') || '';
  const modality = searchParams.get('modality') || '';
  const dateRange = searchParams.get('date_range') || '';
  const experience = searchParams.get('experience') || '';

  // Resetear estados cuando cambian los filtros principales en la URL
  useEffect(() => {
    setJobs([]);
    setPage(2);
    setHasMore(initiallyHasMore);
  }, [q, location, minSalary, modality, dateRange, experience, initiallyHasMore]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (location) params.set('location', location);
      if (minSalary) params.set('min_salary', minSalary);
      if (modality) params.set('modality', modality);
      if (dateRange) params.set('date_range', dateRange);
      if (experience) params.set('experience', experience);
      params.set('page', page.toString());
      if (lang === 'en') params.set('lang', 'en');

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const newJobs: Job[] = await response.json();
      
      if (newJobs.length === 0) {
        setHasMore(false);
      } else {
        setJobs((prev) => [...prev, ...newJobs]);
        setPage((prev) => prev + 1);
        if (newJobs.length < 20) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, q, location, minSalary, modality, dateRange, experience, page, lang]);

  // Scroll infinito automático usando IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return;

    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '400px', // Precarga ofertas cuando falten 400px para llegar al final de la lista
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div className="space-y-4">
      {/* Listado de ofertas adicionales cargadas por el cliente */}
      {jobs.map((job, index) => (
        <React.Fragment key={job.id}>
          {/* Intercalar anuncios cada 10 ofertas (índice 9, 19, etc.) */}
          {index > 0 && index % 10 === 0 && (
            <div className="my-4">
              <AdBanner variant="inline" />
            </div>
          )}

          <JobCard
            job={{ ...job, url_source: job.url_source || '' }}
            lang={lang}
            variant="feed"
          />
        </React.Fragment>
      ))}

      {/* Centinela invisible para scroll infinito */}
      {hasMore && (
        <div id="infinite-scroll-sentinel" className="h-1 w-full" />
      )}

      {/* Skeleton Loading — se muestra mientras se carga la siguiente página */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* Botón de Cargar Más + enlace de paginación rastreable (SEO-049) */}
      {hasMore && !loading && (() => {
        const nextParams = new URLSearchParams();
        if (q) nextParams.set('q', q);
        if (location) nextParams.set('location', location);
        if (minSalary) nextParams.set('min_salary', minSalary);
        if (modality) nextParams.set('modality', modality);
        if (dateRange) nextParams.set('date_range', dateRange);
        if (experience) nextParams.set('experience', experience);
        nextParams.set('page', page.toString());
        const basePath = lang === 'en' ? '/en' : '/';
        const nextPageHref = `${basePath}?${nextParams.toString()}`;

        return (
          <div className="flex flex-col items-center gap-2 pt-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="ui-card ui-card-interactive ui-btn-press px-5 py-2.5 rounded-lg text-xs font-medium text-[var(--text-primary)] disabled:opacity-60 cursor-pointer flex items-center gap-2"
            >
              <span>{isEnglish ? 'Load more offers' : 'Cargar más ofertas'}</span>
            </button>
            <Link
              href={nextPageHref}
              rel="next"
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] underline-offset-2 hover:underline transition-colors"
            >
              {isEnglish ? `Page ${page}` : `Página ${page}`}
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
