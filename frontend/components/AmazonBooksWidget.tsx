import React from 'react';

interface BookItem {
  title: string;
  author: string;
  reason: string;
  asin: string;
}

const DEFAULT_BOOKS: BookItem[] = [
  {
    title: 'Clean Code (Código Limpio)',
    author: 'Robert C. Martin',
    reason: 'Estándar imprescindible en entrevistas técnicas.',
    asin: '8441532109',
  },
  {
    title: 'El Programador Pragmático',
    author: 'David Thomas & Andrew Hunt',
    reason: 'Arquitectura, criterio y buenas prácticas reales.',
    asin: '8441542694',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    reason: 'La referencia en sistemas distribuidos y backend.',
    asin: '1449373321',
  },
];

function selectBooks(contextTitle?: string): BookItem[] {
  if (!contextTitle) return DEFAULT_BOOKS;
  const t = contextTitle.toLowerCase();

  if (t.includes('python') || t.includes('data') || t.includes('sql') || t.includes('ml')) {
    return [
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        reason: 'Clave para ingeniería de datos y escalabilidad.',
        asin: '1449373321',
      },
      {
        title: 'Clean Code (Código Limpio)',
        author: 'Robert C. Martin',
        reason: 'Código mantenible y preparación de pruebas técnicas.',
        asin: '8441532109',
      },
    ];
  }

  if (t.includes('devops') || t.includes('cloud') || t.includes('aws') || t.includes('kubernetes')) {
    return [
      {
        title: 'The Phoenix Project',
        author: 'Gene Kim',
        reason: 'Cultura DevOps, CI/CD y entregas sin fricción.',
        asin: '1942788290',
      },
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        reason: 'Tolerancia a fallos, colas y sistemas distribuidos.',
        asin: '1449373321',
      },
    ];
  }

  return DEFAULT_BOOKS.slice(0, 2);
}

export default function AmazonBooksWidget({
  contextTitle,
  lang = 'es',
}: {
  contextTitle?: string;
  lang?: string;
}) {
  const isEnglish = lang === 'en';
  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_TAG || 'portalit0e-21';
  const books = selectBooks(contextTitle);

  return (
    <div className="ui-card rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
          <span aria-hidden="true">📚</span>
          {isEnglish ? 'Recommended Tech Books' : 'Lecturas recomendadas'}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Amazon
        </span>
      </div>

      <div className="space-y-2.5">
        {books.map((book) => {
          const href = `https://www.amazon.es/dp/${book.asin}?tag=${encodeURIComponent(amazonTag)}`;
          return (
            <a
              key={book.asin}
              href={href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="group block p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-accent)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug">
                  {book.title}
                </p>
                <span className="text-[10px] font-mono text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] shrink-0">
                  ↗
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{book.author}</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-snug">
                {book.reason}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
