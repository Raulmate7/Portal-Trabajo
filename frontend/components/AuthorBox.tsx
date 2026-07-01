import Link from 'next/link';
import { BASE_URL } from '@/lib/constants';

interface Props {
  author: string;
  date: string;
  updatedAt?: string;
  slug: string;
  readingTimeMinutes?: number;
}

const AUTHOR_META: Record<string, { name: string; role: string; bio: string; initials: string }> = {
  'Equipo Portal Empleo': {
    name: 'Raúl M.',
    role: 'Creador y Editor — Portal Trabajo IT',
    bio: 'Estudiante de Ingeniería Informática y desarrollador de software. Creó Portal Trabajo IT para aportar transparencia salarial y eliminar el ruido de las bolsas de empleo generalistas para la comunidad tech de España.',
    initials: 'RM',
  },
};

function getAuthorMeta(authorField: string) {
  return AUTHOR_META[authorField] ?? {
    name: authorField,
    role: 'Editor — Portal Trabajo IT',
    bio: 'Profesional del sector tecnológico con experiencia en el mercado de empleo IT en España.',
    initials: authorField.slice(0, 2).toUpperCase(),
  };
}

function formatDate(dateStr: string, locale = 'es-ES') {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AuthorBox({ author, date, updatedAt, slug, readingTimeMinutes }: Props) {
  const meta = getAuthorMeta(author);
  const publishedFormatted = formatDate(date);
  const updatedFormatted = updatedAt ? formatDate(updatedAt) : null;

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: meta.name,
    jobTitle: meta.role,
    url: `${BASE_URL}/sobre-nosotros`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="mt-10 pt-8 border-t border-gray-100">
        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-6">
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={date}>Publicado: {publishedFormatted}</time>
          </span>
          {updatedFormatted && (
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <time dateTime={updatedAt}>Actualizado: {updatedFormatted}</time>
            </span>
          )}
          {readingTimeMinutes && (
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {readingTimeMinutes} min de lectura
            </span>
          )}
        </div>

        {/* Author card */}
        <div className="flex items-start gap-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 p-5">
          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold text-base shadow-sm"
            aria-hidden="true"
          >
            {meta.initials}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link
                href="/sobre-nosotros"
                className="font-bold text-gray-900 hover:text-indigo-600 transition-colors text-sm"
                rel="author"
              >
                {meta.name}
              </Link>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Autor verificado
              </span>
            </div>
            <p className="text-xs text-indigo-700 font-medium mb-1.5">{meta.role}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{meta.bio}</p>
          </div>
        </div>
      </div>
    </>
  );
}
