import React from 'react';
import Link from 'next/link';
import { getJobSlug } from '@/lib/slug';
import CompanyLogo from './CompanyLogo';

interface Job {
  id: string | number;
  title: string;
  title_es?: string | null;
  company: string;
  location: string;
  salary?: string | null;
  category?: string | null;
  created_at: string;
}

interface Trend {
  category: string;
  count: number;
}

export function JobOfTheDayWidget({ job, lang = 'es' }: { job: Job | null; lang?: string }) {
  if (!job) return null;
  
  const isEnglish = lang === 'en';
  const jobSlug = getJobSlug(job);
  const queryParam = isEnglish ? '?lang=en' : '';
  const detailUrl = `/job/${jobSlug}${queryParam}`;
  const dedicatedUrl = `/empleo-del-dia${queryParam}`;
  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);

  return (
    <div className="relative overflow-hidden ui-card ui-card-interactive rounded-xl border-[var(--border-featured)] p-5 group">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[var(--status-amber)]" />

      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--status-amber-tint)] border border-[var(--border-featured)] text-[var(--status-amber)] font-mono text-[10px] font-semibold uppercase tracking-wider mb-3">
        {isEnglish ? 'Job of the Day' : 'Oferta del Día'}
      </span>

      <div className="flex gap-3 items-start">
        <CompanyLogo company={job.company} size={10} />
        <div className="min-w-0 flex-1 space-y-1">
          <Link href={detailUrl}>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 leading-snug">
              {displayTitle}
            </h4>
          </Link>
          <p className="text-xs font-medium text-[var(--text-secondary)] truncate">{job.company}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5 text-[11px] text-[var(--text-muted)]">
            <span className="truncate">{job.location}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-medium text-[var(--status-emerald)]">
              {job.salary || (isEnglish ? 'Check salary' : 'Ver salario')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={dedicatedUrl}
          className="ui-btn-press block w-full text-center bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium py-2 rounded-lg transition-colors"
        >
          {isEnglish ? 'View & Share' : 'Ver y Compartir'}
        </Link>
        <Link
          href={detailUrl}
          className="ui-btn-press block w-full text-center bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium py-1.5 rounded-lg transition-colors"
        >
          {isEnglish ? 'Apply directly →' : 'Postularme →'}
        </Link>
      </div>
    </div>
  );
}

export function TrendingTechWidget({ trends, lang = 'es' }: { trends: Trend[]; lang?: string }) {
  if (!trends || trends.length === 0) return null;

  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  return (
    <div className="ui-card rounded-xl p-5">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3.5">
        {isEnglish ? 'Trending Categories' : 'Categorías en Tendencia'}
      </h3>

      <div className="space-y-1.5">
        {trends.map((t, index) => (
          <Link
            key={t.category}
            href={`/trabajos/${t.category.toLowerCase().replace(/\s&\s/g, '-').replace(/\s/g, '-')}${queryParam}`}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--bg-subtle)] border border-transparent hover:border-[var(--border-subtle)] transition-colors group"
          >
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                {t.category}
              </h4>
              <p className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                {isEnglish ? `${t.count} jobs this week` : `${t.count} empleos`}
              </p>
            </div>

            <span className="font-mono tabular-nums text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors shrink-0 ml-2">
              #{index + 1}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReferralWidget({ lang = 'es' }: { lang?: string }) {
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  return (
    <div className="ui-card ui-card-interactive rounded-xl border-[var(--border-accent)] p-5 relative overflow-hidden group">
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--accent-primary)] font-mono text-[10px] font-semibold uppercase tracking-wider mb-3">
        {isEnglish ? 'Referral Program' : 'Programa de Referidos'}
      </span>

      <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug mb-1.5">
        {isEnglish ? 'Invite Friends & Get Premium' : 'Invita a Amigos y Gana Premium'}
      </h4>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
        {isEnglish
          ? 'Share your personal link. When 3 friends sign up, everyone gets premium status and priority access!'
          : 'Comparte tu enlace personal. Si 3 amigos se registran, todos conseguiréis estatus destacado y ventajas premium.'}
      </p>

      <Link
        href={`/referidos${queryParam}`}
        className="ui-btn-press block w-full text-center bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium py-2 rounded-lg transition-colors"
      >
        {isEnglish ? 'Get my Referral Link →' : 'Obtener mi Enlace →'}
      </Link>
    </div>
  );
}

