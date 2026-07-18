import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { INTERVIEW_TECHS, getInterviewTech } from '@/lib/entrevistas';
import AdBanner from '@/components/AdBanner';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';
import { generateHowToSteps } from '@/lib/howto';

export const revalidate = 86400; // 24h

type Props = {
  params: Promise<{ tech: string }>;
};

export async function generateStaticParams() {
  return INTERVIEW_TECHS.map((t) => ({ tech: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tech } = await params;
  const item = getInterviewTech(tech);
  if (!item) return { title: 'Preguntas de entrevista no encontradas' };

  const title = `${item.questions.length}+ Preguntas de Entrevista ${item.name} [2026] con Respuestas`;
  const description = `Las ${item.questions.length} preguntas más frecuentes en entrevistas técnicas de ${item.name} en España. Respuestas detalladas para junior, mid y senior. Prepárate hoy.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/entrevistas/${tech}`,
      languages: {
        'es-ES': `${BASE_URL}/entrevistas/${tech}`,
        'x-default': `${BASE_URL}/entrevistas/${tech}`,
      }
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/entrevistas/${tech}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid / Intermedio',
  senior: 'Senior',
};

const LEVEL_COLOR: Record<string, string> = {
  junior: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  mid: 'bg-blue-50 text-blue-700 border-blue-200',
  senior: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default async function InterviewTechPage({ params }: Props) {
  const { tech } = await params;
  const item = getInterviewTech(tech);

  if (!item) notFound();

  const juniorQs = item.questions.filter(q => q.level === 'junior');
  const midQs = item.questions.filter(q => q.level === 'mid');
  const seniorQs = item.questions.filter(q => q.level === 'senior');

  // FAQ Schema — todas las preguntas
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: item.questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1'),
      }
    }))
  };

  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Preguntas de entrevista técnica de ${item.name} con respuestas [2026]`,
    description: item.description,
    url: `${BASE_URL}/entrevistas/${tech}`,
    datePublished: '2026-07-09',
    dateModified: new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: 'Portal Trabajo IT', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'Portal Trabajo IT', logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` } }
  };

  const otherTechs = INTERVIEW_TECHS.filter(t => t.slug !== tech).slice(0, 4);

  // Generate HowTo schema for interview steps
  const howtoSchema = generateHowToSteps(item);

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howtoSchema) }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            {item.emoji} {item.category} · {item.questions.length} preguntas con respuesta
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Preguntas de Entrevista<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              {item.name} [2026]
            </span>
          </h1>
          <p className="text-indigo-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {item.description}
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-sm text-indigo-300">
            {juniorQs.length > 0 && <span className="flex items-center gap-1.5">🟢 <strong className="text-white">{juniorQs.length}</strong> Junior</span>}
            {midQs.length > 0 && <span className="text-indigo-600">·</span>}
            {midQs.length > 0 && <span className="flex items-center gap-1.5">🔵 <strong className="text-white">{midQs.length}</strong> Mid</span>}
            {seniorQs.length > 0 && <span className="text-indigo-600">·</span>}
            {seniorQs.length > 0 && <span className="flex items-center gap-1.5">🟣 <strong className="text-white">{seniorQs.length}</strong> Senior</span>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Preguntas de Entrevista', href: '/entrevistas' },
          { label: item.name }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main content — questions */}
        <div className="lg:col-span-2 space-y-4">

          {/* Ad inline top */}
          <AdBanner variant="inline" />

          {/* Questions list */}
          {item.questions.map((q, idx) => (
            <div key={q.id} className="w-full">
              {idx > 0 && idx % 4 === 0 && (
                <div className="my-4">
                  <AdBanner variant="inline" />
                </div>
              )}
              <details
                id={`q-${q.id}`}
                className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden group open:shadow-md transition-shadow"
              >
                <summary className="flex items-start gap-4 p-5 cursor-pointer list-none select-none hover:bg-gray-50/80 transition-colors">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${LEVEL_COLOR[q.level]}`}>
                        {LEVEL_LABEL[q.level]}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm md:text-base leading-snug">{q.question}</p>
                  </div>
                  <span className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform text-lg mt-0.5">▾</span>
                </summary>

                <div className="px-5 pb-6 pt-2 border-t border-gray-100">
                  <div className="text-gray-700 text-sm leading-relaxed space-y-2 prose prose-sm max-w-none prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-indigo-700 prose-code:text-xs">
                    {q.answer.split('\n').map((line, i) => (
                      <p key={i} dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                          .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-700 text-xs font-mono">$1</code>')
                          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:underline">$1</a>')
                      }} />
                    ))}
                  </div>
                </div>
              </details>
            </div>
          ))}

          {/* Ad inline after questions */}
          <div className="pt-4">
            <AdBanner variant="inline" />
          </div>

          {/* Multiplex al final */}
          <AdBanner variant="multiplex" />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Links rápidos por nivel */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Navegar por nivel</h3>
            <div className="space-y-2">
              {juniorQs.length > 0 && (
                <a href={`#q-${juniorQs[0].id}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:underline font-semibold">
                  🟢 Junior ({juniorQs.length})
                </a>
              )}
              {midQs.length > 0 && (
                <a href={`#q-${midQs[0].id}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline font-semibold">
                  🔵 Mid ({midQs.length})
                </a>
              )}
              {seniorQs.length > 0 && (
                <a href={`#q-${seniorQs[0].id}`} className="flex items-center gap-2 text-sm text-purple-700 hover:underline font-semibold">
                  🟣 Senior ({seniorQs.length})
                </a>
              )}
            </div>
          </div>

          {/* CTA jobs */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-1 text-sm">💼 Ofertas de {item.name}</h3>
            <p className="text-xs text-indigo-700 mb-3 leading-relaxed">Aplica a las mejores ofertas de {item.name} en España con salario transparente.</p>
            <Link href={`/trabajos/${item.jobsSlug}`} className="block w-full text-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm">
              Ver ofertas de {item.name} →
            </Link>
            {item.salariesSlug && (
              <Link href={`/salarios/${item.salariesSlug}`} className="block w-full text-center py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors mt-2 border border-indigo-200">
                Ver salarios de {item.name}
              </Link>
            )}
          </div>

          {/* Otras tecnologías */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Otras entrevistas</h3>
            <div className="space-y-2">
              {otherTechs.map((t) => (
                <Link
                  key={t.slug}
                  href={`/entrevistas/${t.slug}`}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-700 hover:underline font-medium py-1"
                >
                  <span>{t.emoji}</span> {t.name}
                </Link>
              ))}
              <Link href="/entrevistas" className="text-xs text-indigo-600 hover:underline block mt-2 font-bold">
                Ver todas las entrevistas →
              </Link>
            </div>
          </div>

          {/* Sticky ad */}
          <div className="sticky top-24">
            <AdBanner variant="sidebar" enableRefresh={true} />
          </div>

        </div>
      </div>
      <StickyDesktopAd />
    </main>
  );
}
