import { Metadata } from 'next';
import Link from 'next/link';
import { INTERVIEW_TECHS } from '@/lib/entrevistas';
import AdBanner from '@/components/AdBanner';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Preguntas de Entrevista Técnica IT [2026] | Con Respuestas por Tecnología',
  description: 'Banco de preguntas frecuentes en entrevistas técnicas de programación: React, Python, Java, TypeScript, Node.js, AWS y más. Con respuestas detalladas para junior, mid y senior.',
  alternates: {
    canonical: `${BASE_URL}/entrevistas`,
    languages: {
      'es-ES': `${BASE_URL}/entrevistas`,
      'x-default': `${BASE_URL}/entrevistas`,
    }
  },
  openGraph: {
    title: 'Preguntas de Entrevista Técnica IT [2026] con Respuestas',
    description: 'Prepárate para tu próxima entrevista técnica. Más de 50 preguntas con respuestas para los stacks más demandados en España.',
    url: `${BASE_URL}/entrevistas`,
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Preguntas de Entrevista Técnica IT',
  description: 'Banco completo de preguntas frecuentes en entrevistas de programación con respuestas detalladas.',
  url: `${BASE_URL}/entrevistas`,
  hasPart: INTERVIEW_TECHS.map(t => ({
    '@type': 'WebPage',
    name: `Preguntas de entrevista ${t.name}`,
    url: `${BASE_URL}/entrevistas/${t.slug}`,
  }))
};

const TIPS = [
  { icon: '🎯', text: 'Practica en voz alta, no solo leyendo' },
  { icon: '📝', text: 'Explica tu razonamiento, no solo la respuesta' },
  { icon: '❓', text: 'Si no sabes, di cómo lo averiguarías' },
  { icon: '⏱️', text: 'Revisa 5 preguntas diarias la semana antes' },
];

export default function EntrevistasPage() {
  const totalQuestions = INTERVIEW_TECHS.reduce((sum, t) => sum + t.questions.length, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🎤 Preparación de Entrevistas Técnicas · {totalQuestions}+ preguntas con respuesta
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Preguntas de Entrevista Técnica IT
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500"> [2026]</span>
          </h1>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto leading-relaxed">
            El banco de preguntas más completo para preparar entrevistas de programación en España. Seleccionadas de procesos reales en empresas como Spotify, Cabify, Glovo, Banco Santander e Inditex.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Ad banner */}
        <div className="mb-10">
          <AdBanner variant="inline" />
        </div>

        {/* Tech grid */}
        <div className="mb-4">
          <h2 className="text-xl font-black text-gray-900 mb-1">Elige tu tecnología</h2>
          <p className="text-gray-500 text-sm mb-8">Selecciona el stack para el que te estás preparando y accede a las preguntas más frecuentes con respuestas detalladas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {INTERVIEW_TECHS.map((tech) => {
            const juniorCount = tech.questions.filter(q => q.level === 'junior').length;
            const midCount = tech.questions.filter(q => q.level === 'mid').length;
            const seniorCount = tech.questions.filter(q => q.level === 'senior').length;

            return (
              <Link
                key={tech.slug}
                href={`/entrevistas/${tech.slug}`}
                className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{tech.emoji}</span>
                    <div>
                      <h3 className="font-black text-gray-900 group-hover:text-indigo-700 transition-colors">{tech.name}</h3>
                      <span className="text-xs text-gray-400 font-medium">{tech.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{tech.description}</p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {juniorCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">Junior ×{juniorCount}</span>}
                    {midCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Mid ×{midCount}</span>}
                    {seniorCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md">Senior ×{seniorCount}</span>}
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:underline">Ver preguntas →</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tips section */}
        <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-sm mb-10">
          <h2 className="text-lg font-black text-gray-900 mb-4">💡 Consejos para la entrevista técnica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIPS.map((tip) => (
              <div key={tip.text} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <p className="text-sm text-gray-700 font-medium leading-snug">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Links */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Link href="/salarios" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
            💰 Calculadora de Salarios IT
          </Link>
          <Link href="/trabajos/informatica-tecnologia" className="px-6 py-3 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 font-bold rounded-xl text-sm transition-colors shadow-sm">
            💼 Buscar Ofertas de Empleo IT
          </Link>
        </div>

      </div>
    </main>
  );
}
