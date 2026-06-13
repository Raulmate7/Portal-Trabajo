import React from 'react';
import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';

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

interface JobCardProps {
  job: Job;
  lang?: string;
}

export default function JobCard({ job, lang }: JobCardProps) {
  const isEnglish = lang === 'en';

  const getCategoryColor = (cat: string | null | undefined) => {
    const category = cat ? cat.toLowerCase() : 'otros';

    if (category.includes('frontend')) return 'bg-green-100 text-green-800 border-green-200';
    if (category.includes('backend')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (category.includes('data')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (category.includes('cloud') || category.includes('devops')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (category.includes('mobile')) return 'bg-pink-100 text-pink-800 border-pink-200';
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const createdDate = job.created_at ? new Date(job.created_at) : new Date();
  const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isRecent = diffDays <= 1; 
  const isExpiringSoon = diffDays >= 25; 

  const jobSlug = job.id ? getJobSlug({ ...job, id: job.id }) : '';
  const queryParam = isEnglish ? '?lang=en' : '';
  const detailUrl = job.id ? `/job/${jobSlug}${queryParam}` : job.url_source;

  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {displayTitle}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {isRecent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider shrink-0">
                  {isEnglish ? '🆕 Recent' : '🆕 Reciente'}
                </span>
              )}
              {isExpiringSoon && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider shrink-0">
                  {isEnglish ? '⚠️ Expiring soon' : '⚠️ Caduca pronto'}
                </span>
              )}
            </div>
          </div>
          
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getCategoryColor(job.category)}`}>
            {job.category || (isEnglish ? 'General' : 'General')}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-medium">{job.company}</span>
          <span className="mx-2">•</span>
          <span>{job.location}</span>
        </div>

        {job.description_snippet && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {job.description_snippet}
          </p>
        )}
      </div>

      <div className="px-6 pb-6 mt-auto">
        <Link 
          href={detailUrl} 
          className="block w-full text-center bg-gray-900 hover:bg-black text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
        >
          {isEnglish ? 'View Job' : 'Ver Oferta'}
        </Link>
      </div>
    </div>
  );
}
