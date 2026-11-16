"use client";
import React from 'react';
import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';
import { formatSalaryEur } from '@/lib/salary';
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
  is_featured?: boolean | number | null;
}

interface JobCardProps {
  job: Job;
  lang?: string;
  prefetch?: boolean;
  variant?: 'default' | 'feed';
}

export default function JobCard({ job, lang, prefetch, variant = 'default' }: JobCardProps) {
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

  const createdDate = job.created_at ? new Date(job.created_at) : null;
  const diffMs = createdDate ? Math.max(0, Date.now() - createdDate.getTime()) : 0;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isRecent = createdDate ? diffDays <= 1 : false;
  const isExpiringSoon = createdDate ? diffDays >= 90 : false;

  const relativeTime = createdDate
    ? diffHours < 1
      ? isEnglish ? 'just now' : 'ahora'
      : diffHours < 24
        ? isEnglish ? `${diffHours}h ago` : `hace ${diffHours}h`
        : isEnglish ? `${diffDays}d ago` : `hace ${diffDays}d`
    : null;

  const textToLower = `${job.title} ${job.description_snippet || ''}`.toLowerCase();
  const isUrgent = textToLower.includes('urgente') || textToLower.includes('incorporación inmediata') || textToLower.includes('incorporacion inmediata') || textToLower.includes('urgent');

  const jobSlug = job.id ? getJobSlug({ ...job, id: job.id }) : '';
  const queryParam = isEnglish ? '?lang=en' : '';
  const detailUrl = job.id ? `/job/${jobSlug}${queryParam}` : job.url_source;

  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);

  const priorityBadges: Array<{ key: string; label: string; tone: 'accent' | 'danger' | 'emerald' | 'amber' }> = [];
  if (compatScore !== null) {
    priorityBadges.push({
      key: 'compat',
      label: `${compatScore}% ${isEnglish ? 'match' : 'match'}`,
      tone: 'accent',
    });
  }
  if (isUrgent) {
    priorityBadges.push({
      key: 'urgent',
      label: isEnglish ? 'Urgent' : 'Urgente',
      tone: 'danger',
    });
  }
  if (isRecent) {
    priorityBadges.push({
      key: 'recent',
      label: isEnglish ? 'New' : 'Reciente',
      tone: 'emerald',
    });
  }
  if (isExpiringSoon) {
    priorityBadges.push({
      key: 'expiring',
      label: isEnglish ? 'Closing soon' : 'Últimos días',
      tone: 'amber',
    });
  }
  const visibleBadges = priorityBadges.slice(0, 2);

  const badgeToneClasses: Record<'accent' | 'danger' | 'emerald' | 'amber', string> = {
    accent: 'bg-[var(--accent-tint)] text-[var(--accent-primary)] border-[var(--border-accent)]',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    emerald: 'bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border-[var(--status-emerald)]/25',
    amber: 'bg-[var(--status-amber-tint)] text-[var(--status-amber)] border-[var(--border-featured)]',
  };

  const { text: displaySalary, isKnown: hasKnownSalary } = formatSalaryEur(job, { isEnglish });

  const techPatterns: Array<{ label: string; query: string; regex: RegExp }> = [
    { label: 'React', query: 'react', regex: /\breact(?:\.js|js)?\b/i },
    { label: 'TypeScript', query: 'typescript', regex: /\btypescript\b/i },
    { label: 'Node.js', query: 'node', regex: /\bnode(?:\.js|js)?\b/i },
    { label: 'Python', query: 'python', regex: /\bpython\b/i },
    { label: 'Java', query: 'java', regex: /\bjava\b/i },
    { label: 'Next.js', query: 'nextjs', regex: /\bnext(?:\.js|js)\b/i },
    { label: 'Angular', query: 'angular', regex: /\bangular\b/i },
    { label: 'Vue', query: 'vue', regex: /\bvue(?:\.js|js)?\b/i },
    { label: 'DevOps', query: 'devops', regex: /\bdevops\b/i },
    { label: 'AWS', query: 'aws', regex: /\baws\b/i },
    { label: 'Docker', query: 'docker', regex: /\bdocker\b/i },
    { label: 'Kubernetes', query: 'kubernetes', regex: /\bkubernetes|k8s\b/i },
    { label: 'PHP', query: 'php', regex: /\bphp\b/i },
    { label: 'SQL', query: 'sql', regex: /\bsql|postgres|mysql\b/i },
    { label: 'Go', query: 'go', regex: /\bgolang\b/i },
    { label: 'Rust', query: 'rust', regex: /\brust\b/i },
  ];
  const combinedText = `${job.title} ${job.description_snippet || ''}`;
  const detectedTechs = techPatterns.filter((t) => t.regex.test(combinedText)).slice(0, 3);
  const detectedTech = detectedTechs[0]?.query || null;

  return (
    <article
      data-variant={variant}
      data-sponsored={job.is_featured ? 'true' : undefined}
      className="relative group ui-card ui-card-interactive rounded-xl p-4 sm:p-5 flex flex-col h-full"
    >
      {/* Cabecera: Logo + Título (stretched link) + Acciones rápidas */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3.5 items-start min-w-0 flex-1">
          <CompanyLogo company={job.company} size={10} />
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <h3 className="text-[15px] sm:text-base font-semibold tracking-tight text-[var(--text-primary)] leading-snug line-clamp-2">
              <Link
                href={detailUrl}
                prefetch={prefetch}
                rel={job.is_featured ? 'sponsored' : undefined}
                className="after:absolute after:inset-0 after:z-0 focus:outline-none group-hover:text-[var(--accent-primary)] transition-colors duration-150"
              >
                {displayTitle}
              </Link>
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
                {job.company}
              </span>
              <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
              <span className="truncate max-w-[180px]">{job.location}</span>
              {relativeTime && (
                <>
                  <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                    {relativeTime}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 relative z-10">
          <CompareJobButton job={job} />
          <SaveJobButton job={job} />
        </div>
      </div>

      {/* Metadatos técnicos: Salario mono + Categoría + Máx 2 badges prioritarios */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span
          className={`font-mono tabular-nums text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${
            hasKnownSalary
              ? 'bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border-[var(--status-emerald)]/25'
              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
          }`}
        >
          {hasKnownSalary ? displaySalary : (isEnglish ? 'Negotiable' : 'Consultar')}
        </span>

        {job.category && (
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md border bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] whitespace-nowrap">
            {job.category}
          </span>
        )}

        {visibleBadges.map(badge => (
          <span
            key={badge.key}
            className={`font-mono tabular-nums text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${badgeToneClasses[badge.tone]}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      {/* Snippet */}
      {job.description_snippet && (
        <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mt-2.5">
          {job.description_snippet}
        </p>
      )}

      {/* Pie de tarjeta */}
      <div className="mt-auto pt-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 relative z-10">
          {detectedTechs.map((t) => (
            <Link
              key={t.query}
              href={`/?q=${encodeURIComponent(t.label)}${isEnglish ? '&lang=en' : ''}`}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors"
            >
              {t.label}
            </Link>
          ))}
          {detectedTech && (
            <Link
              href={`/salarios/${detectedTech}${queryParam}`}
              className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors inline-flex items-center gap-1 ml-1"
            >
              {isEnglish ? `Salaries` : `Salarios`}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        <span
          aria-hidden="true"
          className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors inline-flex items-center gap-1"
        >
          {isEnglish ? 'View role' : 'Ver oferta'}
          <span>→</span>
        </span>
      </div>
    </article>
  );
}
