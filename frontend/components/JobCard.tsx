import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string | null;
  description_snippet: string;
  created_at: string;
  url_source: string;
}

export default function JobCard({ job }: { job: Job }) {
  // Formatear fecha (ej: 12 dic)
  const date = new Date(job.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Link 
      href={`/oferta/${job.id}`}
      className="block group bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {job.title}
          </h2>
          <p className="text-sm font-medium text-gray-700 mt-1">
            {job.company}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
              📍 {job.location}
            </span>
            {job.salary && job.salary !== 'Consultar' && (
              <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                💰 {job.salary}
              </span>
            )}
            <span className="text-xs text-gray-400">
              📅 {date}
            </span>
          </div>
        </div>

        {/* Icono Flecha */}
        <div className="text-gray-300 group-hover:text-indigo-500 transition-colors mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600 line-clamp-2">
        {job.description_snippet}
      </p>
    </Link>
  );
}
