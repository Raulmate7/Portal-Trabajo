import { Metadata } from 'next';
import Link from 'next/link';
import PremiumForm from './PremiumForm';

export const metadata: Metadata = {
  title: 'Talento Premium — Accede a oportunidades exclusivas | Portal Trabajo IT',
  description:
    'Regístrate como desarrollador Mid/Senior y recibe ofertas de empleo exclusivas con salarios de +45K. Empresas top buscan tu perfil.',
  openGraph: {
    title: 'Talento Premium — Oportunidades exclusivas para Senior Devs',
    description:
      'Las mejores empresas tech de España buscan talento como el tuyo. Accede a ofertas que no se publican.',
  },
};

const BENEFITS = [
  {
    emoji: '💰',
    title: 'Salarios +45K',
    desc: 'Solo ofertas con bandas salariales competitivas para perfiles Mid y Senior.',
  },
  {
    emoji: '🤝',
    title: 'Contacto directo',
    desc: 'Te conectamos directamente con CTOs y hiring managers, sin intermediarios genéricos.',
  },
  {
    emoji: '🔒',
    title: '100% Confidencial',
    desc: 'Tu empresa actual no sabrá que estás buscando. Tus datos solo se comparten con tu permiso.',
  },
  {
    emoji: '⚡',
    title: 'Procesos ágiles',
    desc: 'Nuestros partners de reclutamiento se comprometen a darte feedback en menos de 72h.',
  },
];

const STACK_TAGS = [
  'Java', 'Python', 'React', 'Node.js', 'Go', 'Kubernetes',
  'AWS', 'TypeScript', 'Scala', 'Rust', 'Flutter', 'DevOps',
];

export default function TalentoPremiumPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '5s' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Programa exclusivo · Plazas limitadas
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Las mejores empresas tech
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              buscan tu talento
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Regístrate como desarrollador/a Mid o Senior y accede a oportunidades exclusivas
            que <strong className="text-white">no se publican en portales convencionales</strong>.
            Te conectamos con CTOs y headhunters de forma confidencial.
          </p>

          <a
            href="#registro"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 text-lg font-black py-4 px-10 rounded-2xl hover:from-amber-300 hover:to-yellow-400 hover:scale-105 transition-all shadow-[0_0_40px_rgba(251,191,36,0.3)]"
          >
            Quiero acceder →
          </a>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          ¿Por qué unirte al programa?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-indigo-500/50 transition-colors backdrop-blur-sm"
            >
              <span className="text-3xl mb-3 block">{b.emoji}</span>
              <h3 className="font-bold text-lg mb-1">{b.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tecnologías */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-6 text-gray-300">Perfiles más buscados</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {STACK_TAGS.map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:border-indigo-500 hover:text-indigo-300 transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Formulario de Registro */}
      <section id="registro" className="max-w-2xl mx-auto px-4 py-20">
        <PremiumForm />
      </section>

      {/* Footer mínimo */}
      <footer className="text-center py-8 text-gray-600 text-sm border-t border-gray-800">
        <Link href="/" className="text-indigo-400 hover:underline">
          ← Volver al Portal de Empleo
        </Link>
      </footer>
    </main>
  );
}
