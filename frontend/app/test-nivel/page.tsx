import { Metadata } from 'next';
import Link from 'next/link';
import { QUIZZES } from '@/lib/test-nivel';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: 'Tests de Nivel de Programación IT [2026] | Evalúa tus Habilidades',
  description: 'Mide tu nivel en Python, JavaScript, React, SQL y AWS con nuestros tests técnicos interactivos gratuitos. Obtén una evaluación inmediata de tu perfil.',
  alternates: {
    canonical: `${BASE_URL}/test-nivel`,
  },
  openGraph: {
    title: 'Tests de Nivel Técnicos IT [2026] | Portal Trabajo IT',
    description: 'Evalúa tus conocimientos técnicos con quizzes interactivos rápidos.',
    url: `${BASE_URL}/test-nivel`,
  }
};

export default function TestNivelIndexPage() {
  const quizzes = Object.values(QUIZZES);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🧠 Evaluación Técnica Interactiva
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Tests de Nivel de Programación
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Responde 5 preguntas clave en menos de 5 minutos y descubre si tu perfil encaja con ofertas Junior, Mid o Senior.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Tests de Nivel' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <AdBanner variant="inline" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.slug}
              href={`/test-nivel/${quiz.slug}`}
              className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                    {quiz.emoji}
                  </span>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
                    ⏱️ {quiz.timeMinutes} min
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {quiz.name}
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    {quiz.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 group-hover:underline">
                  Iniciar Test ({quiz.questions.length} preguntas) →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <AdBanner variant="multiplex" />
      </div>
    </main>
  );
}
