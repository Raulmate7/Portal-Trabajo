"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';

interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description_snippet: string | null;
  category: string | null;
  created_at: string;
}

interface CompareClientHelperProps {
  jobs: Job[];
  queryParam: string;
}

export default function CompareClientHelper({ jobs, queryParam }: CompareClientHelperProps) {
  const router = useRouter();
  const [localJobs, setLocalJobs] = useState<Job[]>(jobs);

  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);

  const handleRemove = (jobId: string | number) => {
    const jobIdStr = String(jobId);
    let compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
    compared = compared.filter((id: string) => id !== jobIdStr);
    localStorage.setItem('compared_jobs', JSON.stringify(compared));
    
    // Notificar al pill flotante
    window.dispatchEvent(new Event('compared_jobs_updated'));

    if (compared.length === 0) {
      router.push('/comparar-ofertas');
    } else {
      router.push(`/comparar-ofertas?ids=${compared.join(',')}`);
    }
  };

  const getDaysAgo = (dateStr: string) => {
    const createdDate = new Date(dateStr);
    const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? 'Hoy / Ayer' : `Hace ${diffDays} días`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] divide-y divide-gray-150 dark:divide-slate-800">
        
        {/* Encabezado con Botón eliminar */}
        <div className="grid grid-cols-4 gap-4 py-4 font-black text-gray-900 dark:text-white items-center bg-gray-50 dark:bg-slate-900 px-4 rounded-xl mb-4">
          <div className="text-xs uppercase tracking-wider text-gray-400">Característica</div>
          {localJobs.map((j) => (
            <div key={j.id} className="relative pr-6">
              <span className="font-extrabold text-sm block truncate max-w-[180px]">{j.company}</span>
              <button
                onClick={() => handleRemove(j.id)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-450 hover:text-rose-600 font-bold text-xs p-1 cursor-pointer"
                title="Quitar de la comparación"
              >
                ✕
              </button>
            </div>
          ))}
          {/* Si hay menos de 3 ofertas, añadir slots vacíos */}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-header-${idx}`} className="text-xs text-gray-350 dark:text-slate-600 font-bold border border-dashed border-gray-200 dark:border-slate-800 p-2 text-center rounded-lg">
              Vacío (Añade otra)
            </div>
          ))}
        </div>

        {/* Fila Título */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-center">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Puesto</div>
          {localJobs.map((j) => (
            <div key={j.id} className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
              {j.title}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-title-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

        {/* Fila Salario */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-center">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Salario</div>
          {localJobs.map((j) => (
            <div key={j.id} className="font-mono text-sm text-indigo-700 dark:text-indigo-400 font-black">
              💰 {j.salary || 'Consultar'}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-sal-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

        {/* Fila Modalidad */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-center">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Ubicación</div>
          {localJobs.map((j) => (
            <div key={j.id} className="text-sm text-gray-700 dark:text-slate-300 font-semibold">
              📍 {j.location}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-loc-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

        {/* Fila Categoría */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-center">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Categoría</div>
          {localJobs.map((j) => (
            <div key={j.id} className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-max">
              {j.category || 'General'}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-cat-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

        {/* Fila Antigüedad */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-center">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Publicación</div>
          {localJobs.map((j) => (
            <div key={j.id} className="text-xs font-medium text-gray-500 dark:text-slate-400">
              📅 {getDaysAgo(j.created_at)}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-date-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

        {/* Fila Descripción */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-start">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Detalles</div>
          {localJobs.map((j) => (
            <div key={j.id} className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-sans line-clamp-4">
              {j.description_snippet || 'Sin descripción detallada.'}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-desc-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

        {/* Fila Acciones */}
        <div className="grid grid-cols-4 gap-4 py-5 px-4 items-center">
          <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Acción</div>
          {localJobs.map((j) => {
            const jobSlug = getJobSlug({ ...j, id: j.id });
            return (
              <div key={j.id}>
                <Link
                  href={`/job/${jobSlug}${queryParam}`}
                  className="w-full text-center py-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors block shadow-sm"
                >
                  Ver Oferta 🚀
                </Link>
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 3 - localJobs.length) }).map((_, idx) => (
            <div key={`empty-act-${idx}`} className="text-gray-300 dark:text-slate-800">-</div>
          ))}
        </div>

      </div>
    </div>
  );
}
