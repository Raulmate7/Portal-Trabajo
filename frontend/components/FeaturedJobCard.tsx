import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';
import CompanyLogo from './CompanyLogo';

interface FeaturedJob {
  id: string | number;
  title: string;
  title_es?: string | null;
  company: string;
  location: string;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at: string;
}

export default function FeaturedJobCard({ job, lang }: { job: FeaturedJob; lang?: string }) {
  const isEnglish = lang === 'en';
  
  const createdDate = job.created_at ? new Date(job.created_at) : new Date();
  const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isRecent = diffDays <= 1; 
  const isExpiringSoon = diffDays >= 25; 

  const jobSlug = getJobSlug(job);
  const queryParam = isEnglish ? '?lang=en' : '';
  const detailUrl = `/job/${jobSlug}${queryParam}`;

  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);

  const hasSalaryStr = job.salary && job.salary !== 'Consultar' && job.salary !== 'Negotiable';
  let displaySalary = job.salary;
  if (!hasSalaryStr && job.salary_min && job.salary_max) {
    const minK = Math.round(job.salary_min / 1000);
    const maxK = Math.round(job.salary_max / 1000);
    displaySalary = `${minK}k - ${maxK}k €/año`;
  } else if (!hasSalaryStr && job.salary_min) {
    const minK = Math.round(job.salary_min / 1000);
    displaySalary = isEnglish ? `From ${minK}k €/yr` : `Desde ${minK}k €/año`;
  } else if (!hasSalaryStr && job.salary_max) {
    const maxK = Math.round(job.salary_max / 1000);
    displaySalary = isEnglish ? `Up to ${maxK}k €/yr` : `Hasta ${maxK}k €/año`;
  }
  if (!displaySalary) {
    displaySalary = isEnglish ? 'Negotiable' : 'Consultar';
  }

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6 rounded-2xl border-2 border-amber-300/70 shadow-lg shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 group">
      {/* Badge Destacada */}
      <div className="absolute -top-3 left-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-md shadow-amber-200/60 uppercase tracking-wider">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {isEnglish ? 'Featured' : 'Destacada'}
        </span>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mt-2">
        <div className="flex gap-4 items-start w-full">
          <CompanyLogo company={job.company} size={12} />
          <div className="w-full">
          <Link href={detailUrl} prefetch={true}>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
               {displayTitle}
            </h2>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600 font-medium">{job.company}</p>
            {isRecent && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider shrink-0 animate-pulse">
                {isEnglish ? '🆕 Recent' : '🆕 Reciente'}
              </span>
            )}
            {isExpiringSoon && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider shrink-0">
                {isEnglish ? '⚠️ Expiring soon' : '⚠️ Caduca pronto'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-amber-800 font-medium">
              📍 {job.location}
            </span>
            <span className="bg-amber-50 px-2 py-1 rounded border border-amber-200 text-amber-800">
              💰 {displaySalary}
            </span>
            <span className="bg-gray-50 px-2 py-1 rounded">
              📅 {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        </div>

        <Link
          href={detailUrl}
          prefetch={true}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all text-center shrink-0 shadow-md shadow-amber-200/50 hover:shadow-lg"
        >
          {isEnglish ? 'View Job ⭐' : 'Ver oferta ⭐'}
        </Link>
      </div>
    </div>
  );
}
