"use client";
import React, { useState, useEffect } from 'react';
import JobCard from '@/components/JobCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

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

export default function OfertasGuardadasPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadJobs = () => {
        const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
        setSavedJobs(jobs);
        setIsLoaded(true);
      };
      loadJobs();

      // Escuchar cambios de localStorage si el usuario elimina desde la tarjeta
      window.addEventListener('storage', loadJobs);
      return () => {
        window.removeEventListener('storage', loadJobs);
      };
    }
  }, []);

  // Función para volver a cargar la lista local en caso de borrado dentro de la misma pestaña
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      setSavedJobs(jobs);
    }
  };

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Ofertas Guardadas' }
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              💼 Mis Ofertas Guardadas
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Listado de vacantes de empleo IT que has marcado como favoritas para revisar más tarde.
            </p>
          </div>
          {savedJobs.length > 0 && (
            <button 
              onClick={() => {
                if (confirm('¿Seguro que quieres borrar todas tus ofertas guardadas?')) {
                  localStorage.setItem('saved_jobs', '[]');
                  setSavedJobs([]);
                }
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg transition-colors"
            >
              🗑️ Borrar todo
            </button>
          )}
        </div>

        {!isLoaded ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-xl mx-auto shadow-sm">
            <span className="text-5xl block mb-4">⭐</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No tienes ofertas guardadas</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Navega por nuestro catálogo de empleo técnico, haz clic en el botón de la estrella en cualquier oferta de tu interés y aparecerá aquí automáticamente.
            </p>
            <Link 
              href="/trabajos/informatica-tecnologia" 
              className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
            >
              Explorar Ofertas IT
            </Link>
          </div>
        ) : (
          <div 
            onClick={handleRefresh} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} lang="es" />
            ))}
          </div>
        )}

        <div className="mt-8">
          <AdBanner variant="inline" />
        </div>
      </div>
    </main>
  );
}
