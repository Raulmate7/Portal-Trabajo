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

  const hasKnownSalary = Boolean(displaySalary && displaySalary !== 'Consultar' && displaySalary !== 'Negotiable');

  return (
    <article className="relative group ui-card ui-card-interactive rounded-xl border-[var(--border-featured)] p-4 sm:p-5 overflow-hidden">
      {/* Acento lateral ámbar de 2px */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[var(--status-amber)]" />

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex gap-3.5 items-start min-w-0 flex-1">
          <CompanyLogo company={job.company} size={11} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--status-amber-tint)] text-[var(--status-amber)] border border-[var(--border-featured)] font-mono text-[10px] font-semibold uppercase tracking-wider">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {isEnglish ? 'FEATURED' : 'DESTACADA'}
              </span>
              {isRecent && (
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border border-[var(--status-emerald)]/25 uppercase tracking-wider shrink-0">
                  {isEnglish ? 'New' : 'Reciente'}
                </span>
              )}
              {isExpiringSoon && (
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--status-amber-tint)] text-[var(--status-amber)] border border-[var(--border-featured)] uppercase tracking-wider shrink-0">
                  {isEnglish ? 'Closing soon' : 'Últimos días'}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text-primary)] leading-snug line-clamp-2">
              <Link
                href={detailUrl}
                prefetch={true}
                className="after:absolute after:inset-0 after:z-0 focus:outline-none group-hover:text-[var(--accent-primary)] transition-colors duration-150"
              >
                {displayTitle}
              </Link>
            </h2>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                {job.company}
              </span>
              <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
              <span className="truncate max-w-[200px]">{job.location}</span>
              <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className={`font-mono tabular-nums text-xs font-medium px-2.5 py-0.5 rounded-md border ${
                  hasKnownSalary
                    ? 'bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border-[var(--status-emerald)]/25'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                }`}
              >
                {displaySalary}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center md:justify-end">
          <span
            aria-hidden="true"
            className="ui-btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] group-hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors duration-150"
          >
            {isEnglish ? 'View role' : 'Ver oferta'}
            <span>→</span>
          </span>
        </div>
      </div>
    </article>
  );
}
