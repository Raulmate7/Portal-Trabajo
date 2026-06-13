"use client";
import React, { useState, useEffect } from 'react';

interface Job {
  id?: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at?: string;
  title_es?: string | null;
}

interface SaveJobButtonProps {
  job: Job;
  variant?: 'card' | 'detail';
}

export default function SaveJobButton({ job, variant = 'card' }: SaveJobButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && job.id) {
      const savedJobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      const found = savedJobs.some((j: any) => String(j.id) === String(job.id));
      setIsSaved(found);
    }
  }, [job.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!job.id) return;

    const savedJobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    if (isSaved) {
      const updated = savedJobs.filter((j: any) => String(j.id) !== String(job.id));
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedJobs.push(job);
      localStorage.setItem('saved_jobs', JSON.stringify(savedJobs));
      setIsSaved(true);
    }
  };

  if (variant === 'detail') {
    return (
      <button
        onClick={toggleSave}
        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all duration-200 ${
          isSaved 
            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm' 
            : 'bg-white text-gray-700 border-gray-200 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title={isSaved ? "Quitar de favoritos" : "Guardar esta oferta"}
      >
        <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.812l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.218-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.777-.56-.378-1.812.583-1.812h4.907a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
        <span>{isSaved ? "Guardada" : "Guardar Oferta"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleSave}
      className={`p-2 rounded-lg transition-colors border shrink-0 ${
        isSaved 
          ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100' 
          : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600 hover:bg-gray-50'
      }`}
      title={isSaved ? "Quitar de guardadas" : "Guardar oferta"}
      aria-label={isSaved ? "Quitar de guardadas" : "Guardar oferta"}
    >
      <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.812l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.218-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.777-.56-.378-1.812.583-1.812h4.907a1 1 0 00.95-.69l1.519-4.674z" />
      </svg>
    </button>
  );
}
