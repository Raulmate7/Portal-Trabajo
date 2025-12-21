import Link from 'next/link';

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

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition duration-300">
      <h2 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h2>
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <span className="font-semibold text-indigo-600">{job.company}</span>
        <span>•</span>
        <span>{job.location}</span>
        {job.salary && (
          <>
            <span>•</span>
            <span className="text-green-600">{job.salary}</span>
          </>
        )}
      </div>

      {job.description_snippet && (
        <p className="text-gray-700 mb-4 line-clamp-2">{job.description_snippet}</p>
      )}

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-400">
          {new Date(job.created_at).toLocaleDateString('es-ES')}
        </span>
        <a 
          href={job.url_source} 
          target="_blank" 
          rel="nofollow sponsored noopener noreferrer" 
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Ver Oferta
        </a>
      </div>
    </div>
  );
};

export default JobCard;
