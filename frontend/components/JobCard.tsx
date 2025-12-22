import React from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description_snippet: string | null;
  url_source: string;
  created_at: string;
}

export default function JobCard({ job }: { job: Job }) {
  // Calculamos hace cuánto se publicó (ej: "Hace 2 horas")
  const date = new Date(job.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const isNew = diffDays <= 2; // Si tiene menos de 2 días, es "NUEVA"

  // Preparamos los enlaces para compartir
  // Usamos encodeURIComponent para que los espacios y acentos no rompan el link
  const shareText = `Mira esta oferta de ${job.title} en ${job.company}: ${job.url_source}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(job.url_source)}`;

  return (
    <div className="group relative bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      
      {/* Etiqueta de NUEVO */}
      {isNew && (
        <span className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          NUEVA
        </span>
      )}

      <div className="flex flex-col h-full">
        {/* Título y Empresa */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            <a href={job.url_source} target="_blank" rel="noopener noreferrer">
              {job.title}
            </a>
          </h3>
          <p className="text-sm text-gray-600 font-medium">{job.company}</p>
        </div>

        {/* Detalles: Ubicación y Salario */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            📍 {job.location}
          </span>
          {job.salary && (
            <span className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
              💰 {job.salary}
            </span>
          )}
        </div>

        {/* Descripción corta */}
        {job.description_snippet && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
            {job.description_snippet}
          </p>
        )}

        {/* Botones de Acción (Footer de la tarjeta) */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
          {/* Botón Principal */}
          <a 
            href={job.url_source} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Ver oferta completa &rarr;
          </a>

          {/* Botones de Compartir (Pequeños y sutiles) */}
          <div className="flex gap-3">
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-green-600 transition-colors"
              title="Compartir en WhatsApp"
            >
              {/* Icono WhatsApp SVG */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </a>
            <a 
              href={linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-700 transition-colors"
              title="Compartir en LinkedIn"
            >
              {/* Icono LinkedIn SVG */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
