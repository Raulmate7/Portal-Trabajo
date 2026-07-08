'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CompanyLogo from './CompanyLogo';
import AdBanner from './AdBanner';
import { getJobSlug } from '@/lib/slug';

interface Job {
  id: string;
  title: string;
  title_es?: string | null;
  company: string;
  location: string;
  salary?: string | null;
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
  }, [hasMore, loading, page, q, location, minSalary, modality, dateRange, experience, initiallyHasMore]);

  async function loadMore() {
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
  }

  const queryParam = isEnglish ? '?lang=en' : '';

  return (
    <div className="space-y-6">
      {/* Listado de ofertas adicionales cargadas por el cliente */}
      {jobs.map((job, index) => {
        const jobSlug = getJobSlug(job);
        const detailUrl = `/job/${jobSlug}${queryParam}`;
        const displayJobTitle = isEnglish ? job.title : (job.title_es || job.title);
        
        return (
          <React.Fragment key={job.id}>
            {/* Intercalar anuncios cada 10 ofertas (índice 9, 19, etc.) */}
            {index > 0 && index % 10 === 0 && (
              <div className="my-6">
                <AdBanner variant="inline" />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800/80 hover:shadow-md transition-shadow">
              <div className="flex gap-4 items-start">
                <CompanyLogo company={job.company} size={12} />
                <div className="flex-grow w-full flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="w-full">
                    <Link href={detailUrl}>
                      <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-400 hover:text-indigo-650 dark:hover:text-indigo-300 transition-colors">
                        {displayJobTitle}
                      </h3>
                    </Link>
                    <p className="text-gray-650 dark:text-slate-350 font-medium mt-1">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500 dark:text-slate-400">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-gray-50 dark:bg-slate-850 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-medium border border-gray-200 dark:border-slate-800"
                      >
                        📍 {job.location}
                      </a>
                      <span className="bg-gray-50 dark:bg-slate-850 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">
                        💰 {job.salary || (isEnglish ? 'Negotiable' : 'Consultar')}
                      </span>
                      <span className="bg-gray-50 dark:bg-slate-850 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">
                        📅 {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Link 
                    href={detailUrl}
                    className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/60 dark:text-indigo-300 font-semibold rounded-lg transition-colors text-center shrink-0 cursor-pointer"
                  >
                    {isEnglish ? 'View offer' : 'Ver oferta'}
                  </Link>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Centinela invisible para scroll infinito */}
      {hasMore && (
        <div id="infinite-scroll-sentinel" className="h-1 w-full" />
      )}

      {/* Botón de Cargar Más / Spinner */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 border border-gray-300 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors shadow-sm disabled:opacity-60 cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-650 rounded-full animate-spin" />
                <span>{isEnglish ? 'Loading...' : 'Cargando...'}</span>
              </>
            ) : (
              <span>{isEnglish ? 'Load more offers' : 'Cargar más ofertas'}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
