import Link from 'next/link';
import { Job } from '@/types/job';

export default function JobCard({ job }: { job: Job }) {
  const date = job.created_at 
    ? new Date(job.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : '';

  return (
    <Link 
      href={`/oferta/${job.id}`}
      className="block group bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
            {job.title}
          </h2>
          <p className="text-sm text-gray-700">{job.company}</p>
          <div className="flex gap-3 mt-3 text-sm text-gray-500">
            <span className="bg-gray-50 px-2 py-1 rounded">📍 {job.location}</span>
            {job.salary && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">💰 {job.salary}</span>}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 line-clamp-2">
        {job.description_snippet || 'Sin descripción disponible'}
      </p>
    </Link>
  );
}
