"use client";
import React, { useState, useEffect } from 'react';

interface Job {
  id?: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  category?: string | null;
  salary?: string | null;
}

interface CompareJobButtonProps {
  job: Job;
}

export default function CompareJobButton({ job }: CompareJobButtonProps) {
  const [isCompared, setIsCompared] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && job.id) {
      const compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
      setIsCompared(compared.includes(String(job.id)));
    }

    const handleUpdate = () => {
      if (job.id) {
        const compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
        setIsCompared(compared.includes(String(job.id)));
      }
    };

    window.addEventListener('compared_jobs_updated', handleUpdate);
    return () => window.removeEventListener('compared_jobs_updated', handleUpdate);
  }, [job.id]);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!job.id) return;

    let compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
    const jobIdStr = String(job.id);

    if (isCompared) {
      compared = compared.filter((id: string) => id !== jobIdStr);
      setIsCompared(false);
    } else {
      if (compared.length >= 3) {
        alert('Puedes comparar hasta un máximo de 3 ofertas simultáneamente.');
        return;
      }
      compared.push(jobIdStr);
      setIsCompared(true);
    }

    localStorage.setItem('compared_jobs', JSON.stringify(compared));
    window.dispatchEvent(new Event('compared_jobs_updated'));
  };

  if (!mounted || !job.id) return null;

  return (
    <button
      onClick={toggleCompare}
      className={`p-2 rounded-lg transition-colors border shrink-0 ${
        isCompared
          ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
          : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800'
      }`}
      title={isCompared ? "Quitar del comparador" : "Añadir al comparador"}
      aria-label={isCompared ? "Quitar del comparador" : "Añadir al comparador"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    </button>
  );
}
