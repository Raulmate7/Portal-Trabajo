import React from 'react';

// Definimos la estructura de los datos que esperamos recibir
interface Job {
  id?: number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string;
  category?: string; // Esta es la nueva pieza clave
  created_at?: string;
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  
  // Función para asignar colores según la categoría
  const getCategoryColor = (cat: string) => {
    // Normalizamos a minúsculas por si acaso
    const category = cat ? cat.toLowerCase() : 'otros';

    if (category.includes('frontend')) return 'bg-green-100 text-green-800 border-green-200';
    if (category.includes('backend')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (category.includes('data')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (category.includes('cloud') || category.includes('devops')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (category.includes('mobile')) return 'bg-pink-100 text-pink-800 border-pink-200';
    
    // Color por defecto (Gris) para 'Otros'
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
      
      <div className="p-6 flex-grow">
        {/* Cabecera: Título y Etiqueta de Categoría */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {job.title}
          </h3>
          
          {/* Aquí mostramos la "Chapita" de color */}
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getCategoryColor(job.category || '')}`}>
            {job.category || 'General'}
          </span>
        </div>

        {/* Detalles de la empresa */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-medium">{job.company}</span>
          <span className="mx-2">•</span>
          <span>{job.location}</span>
        </div>

        {/* Descripción corta (si existe) */}
        {job.description_snippet && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {job.description_snippet}
          </p>
        )}
      </div>

      {/* Botón de acción */}
      <div className="px-6 pb-6 mt-auto">
        <a 
          href={job.url_source} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full text-center bg-gray-900 hover:bg-black text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
        >
          Ver Oferta
        </a>
      </div>
    </div>
  );
}
