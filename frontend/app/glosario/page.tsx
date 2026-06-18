import { GLOSSARY_TERMS } from '@/lib/glosario';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Glosario Tecnológico IT | Diccionario de Términos de Programación',
  description: 'Glosario de términos tecnológicos, lenguajes de programación, frameworks, metodologías de trabajo y herramientas del sector IT en España.',
  alternates: {
    canonical: `${BASE_URL}/glosario`,
  },
  openGraph: {
    title: 'Glosario Tecnológico IT | Portal Trabajo',
    description: 'Diccionario de términos del sector tecnológico y desarrollo de software para programadores.',
    url: `${BASE_URL}/glosario`,
  }
};

export default function GlossaryIndexPage() {
  // Agrupar términos por letra inicial
  const alphabet = Array.from(new Set(GLOSSARY_TERMS.map(t => t.letter))).sort();
  
  const groupedTerms: Record<string, typeof GLOSSARY_TERMS> = {};
  for (const term of GLOSSARY_TERMS) {
    if (!groupedTerms[term.letter]) {
      groupedTerms[term.letter] = [];
    }
    groupedTerms[term.letter].push(term);
  }
  
  // Ordenar los términos dentro de cada letra
  for (const letter of alphabet) {
    groupedTerms[letter].sort((a, b) => a.term.localeCompare(b.term));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            📖 Diccionario de desarrollo de software
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Glosario Tecnológico
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Domina el vocabulario del sector IT. Definiciones claras de herramientas, metodologías y tecnologías más buscadas por los reclutadores.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        
        {/* AdBanner unit */}
        <div className="mb-8">
          <AdBanner variant="inline" />
        </div>

        {/* Letras de navegación rápida */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm mb-10">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Índice Alfabético</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {alphabet.map((letter) => (
              <a 
                key={letter}
                href={`#letter-${letter}`}
                className="w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-extrabold transition-all text-sm border border-indigo-100/50 shadow-sm"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>

        {/* Listado de términos agrupados */}
        <div className="space-y-12">
          {alphabet.map((letter) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-indigo-900 bg-indigo-50 border border-indigo-100/50 w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm">
                  {letter}
                </h2>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedTerms[letter].map((term) => (
                  <div 
                    key={term.slug}
                    className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-base font-bold text-gray-950 mb-2.5">
                        {term.term}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                        {term.definition}
                      </p>
                    </div>
                    
                    <div>
                      <Link 
                        href={`/glosario/${term.slug}`}
                        className="text-xs text-indigo-650 hover:text-indigo-850 font-bold flex items-center gap-1.5 group"
                      >
                        Leer definición completa 
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* AdBanner inferior */}
        <div className="mt-12">
          <AdBanner variant="inline" />
        </div>

      </div>
    </main>
  );
}
