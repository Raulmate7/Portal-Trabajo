"use client";
import React from 'react';
import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';
import SaveJobButton from './SaveJobButton';
import CompareJobButton from './CompareJobButton';
import CompanyLogo from './CompanyLogo';

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
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
}

interface JobCardProps {
  job: Job;
  lang?: string;
  prefetch?: boolean;
}

export default function JobCard({ job, lang, prefetch }: JobCardProps) {
  const isEnglish = lang === 'en';
  const [compatScore, setCompatScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawKws = localStorage.getItem('subscriber_tech_keywords');
      if (rawKws) {
        const kws = rawKws.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
        if (kws.length > 0) {
          const title = job.title.toLowerCase();
          const desc = (job.description_snippet || '').toLowerCase();
          let matched = 0;
          for (const kw of kws) {
            if (title.includes(kw) || desc.includes(kw)) {
              matched++;
            }
          }
          if (matched > 0) {
            const score = kws.length === 1 ? 100 : Math.round((matched / kws.length) * 100);
            setCompatScore(score > 0 ? Math.max(50, score) : null);
          }
        }
      }
    }
  }, [job.title, job.description_snippet]);

  const getCategoryColor = (cat: string | null | undefined) => {
    const category = cat ? cat.toLowerCase() : 'otros';

    if (category.includes('frontend')) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/50';
    if (category.includes('backend')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50';
    if (category.includes('data')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50';
    if (category.includes('cloud') || category.includes('devops')) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/50';
    if (category.includes('mobile')) return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-900/50';
    
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50';
  };

  const createdDate = job.created_at ? new Date(job.created_at) : new Date();
  const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isRecent = diffDays <= 1; 
  const isExpiringSoon = diffDays >= 25; 

  const textToLower = `${job.title} ${job.description_snippet || ''}`.toLowerCase();
  const isUrgent = textToLower.includes('urgente') || textToLower.includes('incorporación inmediata') || textToLower.includes('incorporacion inmediata') || textToLower.includes('urgent');

  const jobSlug = job.id ? getJobSlug({ ...job, id: job.id }) : '';
  const queryParam = isEnglish ? '?lang=en' : '';
  const detailUrl = job.id ? `/job/${jobSlug}${queryParam}` : job.url_source;

  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex gap-3.5 items-start">
            <CompanyLogo company={job.company} size={10} />
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {displayTitle}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {compatScore !== null && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50 uppercase tracking-wider shrink-0">
                    🎯 {compatScore}% {isEnglish ? 'match' : 'compatible'}
                  </span>
                )}
                {isRecent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 uppercase tracking-wider shrink-0">
                    {isEnglish ? '🆕 Recent' : '🆕 Reciente'}
                  </span>
                )}
                {isUrgent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50 uppercase tracking-wider shrink-0">
                    {isEnglish ? '🔥 Urgent' : '🔥 Urgente'}
                  </span>
                )}
                {isExpiringSoon && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 uppercase tracking-wider shrink-0">
                    {isEnglish ? '⚠️ Expiring soon' : '⚠️ Caduca pronto'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getCategoryColor(job.category)}`}>
              {job.category || (isEnglish ? 'General' : 'General')}
            </span>
            <div className="flex items-center gap-1.5">
              <CompareJobButton job={job} />
              <SaveJobButton job={job} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-1.5 text-sm text-gray-500 dark:text-slate-400 mb-4">
          <div className="flex items-center mr-3">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium">{job.company}</span>
            <span className="mx-2">•</span>
            <span>{job.location}</span>
          </div>
          {(() => {
            const hasSalaryStr = job.salary && job.salary !== 'Consultar' && job.salary !== 'Negotiable' && job.salary !== 'Ver salario';
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
            
            if (displaySalary && displaySalary !== 'Consultar' && displaySalary !== 'Negotiable') {
              return (
                <div className="flex items-center text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/30 dark:bg-indigo-950/20 dark:text-indigo-300 px-2 py-0.5 rounded-md shrink-0">
                  💰 {displaySalary}
                </div>
              );
            }
            return (
              <div className="flex items-center text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-100 dark:bg-slate-800/40 dark:text-slate-450 px-2 py-0.5 rounded-md shrink-0">
                💰 {isEnglish ? 'Negotiable' : 'Consultar'}
              </div>
            );
          })()}
        </div>

        {job.description_snippet && (
          <p className="text-sm text-gray-650 dark:text-slate-350 line-clamp-2 mb-4">
            {job.description_snippet}
          </p>
        )}

        {(() => {
          const titleLower = job.title.toLowerCase();
          const techs = ['react', 'node', 'python', 'java', 'typescript', 'devops', 'php', 'sql', 'go', 'rust', 'angular', 'vue'];
          let detected = null;
          for (const t of techs) {
            if (titleLower.includes(t)) {
              detected = t;
              break;
            }
          }
          if (detected) {
            return (
              <div className="mb-4 text-xs">
                <Link 
                  href={`/salarios/${detected}${queryParam}`} 
                  className="text-indigo-650 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-350 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  📊 {isEnglish ? `View ${detected.toUpperCase()} salaries in Spain →` : `Ver salarios de ${detected.toUpperCase()} en España →`}
                </Link>
              </div>
            );
          }
          return null;
        })()}
      </div>

      <div className="px-6 pb-6 mt-auto">
        <Link 
          href={detailUrl} 
          prefetch={prefetch}
          className="block w-full text-center bg-gray-900 hover:bg-black text-white dark:bg-indigo-650 dark:hover:bg-indigo-700 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
        >
          {isEnglish ? 'View Job' : 'Ver Oferta'}
        </Link>
      </div>
    </div>
  );
}
