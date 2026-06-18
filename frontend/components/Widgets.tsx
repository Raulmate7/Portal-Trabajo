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
  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 dark:from-amber-950/20 dark:to-yellow-950/10 p-5 rounded-2xl border border-amber-500/25 dark:border-amber-500/20 shadow-sm relative overflow-hidden group">
      {/* Mini Badge */}
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white dark:bg-amber-600 text-[10px] font-black uppercase tracking-wider mb-3.5 shadow-sm">
        🔥 {isEnglish ? 'Job of the Day' : 'Oferta del Día'}
      </span>

      <div className="flex gap-3.5 items-start">
        <CompanyLogo company={job.company} size={10} />
        <div className="space-y-1">
          <Link href={detailUrl}>
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
              {displayTitle}
            </h4>
          </Link>
          <p className="text-xs font-semibold text-gray-650 dark:text-slate-350">{job.company}</p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 dark:text-slate-400">
            <span>📍 {job.location}</span>
            <span>•</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              💰 {job.salary || (isEnglish ? 'Check salary' : 'Ver salario')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link 
          href={detailUrl}
          className="block w-full text-center bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-sm"
        >
          {isEnglish ? 'View Details ⭐' : 'Ver Detalles ⭐'}
        </Link>
      </div>
    </div>
  );
}

export function TrendingTechWidget({ trends, lang = 'es' }: { trends: Trend[]; lang?: string }) {
  if (!trends || trends.length === 0) return null;
  
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  // Iconos por categoría
  const getIcon = (cat: string) => {
    const name = cat.toLowerCase();
    if (name.includes('front')) return '🎨';
    if (name.includes('back')) return '⚙️';
    if (name.includes('data') || name.includes('ai') || name.includes('inteligencia')) return '📊';
    if (name.includes('cloud') || name.includes('devops')) return '☁️';
    if (name.includes('mobile') || name.includes('movil')) return '📱';
    return '💻';
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <span>📈</span> {isEnglish ? 'Trending Categories' : 'Categorías en Tendencia'}
      </h3>

      <div className="space-y-3.5">
        {trends.map((t, index) => (
          <Link 
            key={t.category} 
            href={`/trabajos/${t.category.toLowerCase().replace(/\s&\s/g, '-').replace(/\s/g, '-')}${queryParam}`}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{getIcon(t.category)}</span>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t.category}
                </h4>
                <p className="text-[10px] text-gray-400">
                  {isEnglish ? `${t.count} jobs this week` : `${t.count} empleos esta semana`}
                </p>
              </div>
            </div>
            
            <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
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
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 dark:from-indigo-950/20 dark:to-purple-950/10 p-5 rounded-2xl border border-indigo-500/25 dark:border-indigo-500/20 shadow-sm relative overflow-hidden group">
      {/* Mini Badge */}
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white dark:bg-indigo-650 text-[10px] font-black uppercase tracking-wider mb-3.5 shadow-sm">
        👥 {isEnglish ? 'Referral Program' : 'Programa de Referidos'}
      </span>

      <h4 className="text-sm font-extrabold text-gray-900 dark:text-slate-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-2">
        {isEnglish ? 'Invite Friends & Get Premium' : 'Invita a Amigos y Gana Premium'}
      </h4>
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
        {isEnglish 
          ? 'Share your personal link. When 3 friends sign up, everyone gets premium status and priority access!'
          : 'Comparte tu enlace personal. Si 3 amigos se registran, todos conseguiréis estatus destacado y ventajas premium.'}
      </p>

      <div>
        <Link 
          href={`/referidos${queryParam}`}
          className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isEnglish ? 'Get my Referral Link 🔗' : 'Obtener mi Enlace 🔗'}
        </Link>
      </div>
    </div>
  );
}

