'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';

interface ViewedJob {
  id: string | number;
  title: string;
  company: string;
  location: string;
  salary?: string | null;
}

export function RecentlyViewedTracker({ job }: { job: ViewedJob }) {
  useEffect(() => {
    if (!job || !job.id) return;
    
    try {
      const storageKey = 'recently-viewed-jobs';
      const raw = localStorage.getItem(storageKey);
      let list: ViewedJob[] = raw ? JSON.parse(raw) : [];
      
      // Asegurarse de que no haya duplicados
      list = list.filter((j) => j.id.toString() !== job.id.toString());
      
      // Añadir la actual al principio
      list.unshift({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
      });
      
      // Limitar a los 10 últimos
      if (list.length > 10) {
        list = list.slice(0, 10);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (error) {
      console.error('Error tracking recently viewed job:', error);
    }
  }, [job]);

  return null; // Componente invisible
}

export function RecentlyViewedList({ lang = 'es' }: { lang?: string }) {
  const [list, setList] = useState<ViewedJob[]>([]);
  const isEnglish = lang === 'en';

  useEffect(() => {
    try {
      const storageKey = 'recently-viewed-jobs';
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setList(JSON.parse(raw));
      }
    } catch (error) {
      console.error('Error reading recently viewed jobs:', error);
    }
  }, []);

  if (list.length === 0) {
    return null; // Ocultar si no hay historial
  }

  const queryParam = isEnglish ? '?lang=en' : '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800/80 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <span>🕒</span> {isEnglish ? 'Recently Viewed' : 'Vistos recientemente'}
      </h3>
      
      <div className="space-y-3">
        {list.map((job) => {
          const jobSlug = getJobSlug({ ...job, id: job.id });
          const detailUrl = `/job/${jobSlug}${queryParam}`;
          
          return (
            <div key={job.id} className="group border-b border-gray-50 dark:border-slate-800/40 pb-2.5 last:border-b-0 last:pb-0">
              <Link href={detailUrl} className="block">
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {job.title}
                </h4>
              </Link>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>{job.company}</span>
                <span className="text-gray-400">•</span>
                <span>{job.location}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
