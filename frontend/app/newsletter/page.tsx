import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Newsletter de Empleo IT — Alertas de Ofertas Tech en España | Portal Trabajo IT',
  description: 'Suscríbete gratis a la newsletter semanal de empleos IT más valorada en España. Recibe las mejores ofertas de React, Python, Java y DevOps directamente en tu bandeja de entrada.',
  alternates: {
    canonical: `${BASE_URL}/newsletter`,
    languages: {
      'es-ES': `${BASE_URL}/newsletter`,
      'x-default': `${BASE_URL}/newsletter`,
    }
  },
  openGraph: {
    title: 'Newsletter IT — Las mejores ofertas tech de España cada semana',
    description: 'Únete a miles de desarrolladores que ya reciben las mejores ofertas de empleo IT en España. Sin spam, solo oportunidades reales.',
    url: `${BASE_URL}/newsletter`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Newsletter de Empleo IT en España',
    description: 'Recibe las mejores ofertas de React, Python, Java, DevOps y más cada semana. Gratis.',
  }
};

const BENEFITS = [
  {
    icon: '⚡',
    title: 'Primero en saber',
    desc: 'Recibe las mejores ofertas con salario transparente antes que nadie, directamente en tu bandeja de entrada.'
  },
  {
    icon: '🎯',
    title: 'Sólo lo relevante',
    desc: 'Filtramos por tecnología, ciudad y nivel. Sin ruido, sin spam. Solo ofertas que encajan con tu perfil.'
  },
  {
    icon: '📊',
    title: 'Datos del mercado',
    desc: 'Informe semanal con las tecnologías más demandadas, salarios medios y tendencias del sector IT español.'
  },
  {
    icon: '🔒',
    title: 'Sin compromiso',
    desc: 'Puedes darte de baja en cualquier momento con un clic. Sin preguntas, sin trucos, sin letra pequeña.'
  },
];

const TECHNOLOGIES = [
  { name: 'React', slug: 'react', emoji: '⚛️' },
  { name: 'Python', slug: 'python', emoji: '🐍' },
  { name: 'Java', slug: 'java', emoji: '☕' },
  { name: 'Node.js', slug: 'node', emoji: '🟢' },
  { name: 'TypeScript', slug: 'typescript', emoji: '📘' },
  { name: 'AWS / Cloud', slug: 'aws', emoji: '☁️' },
  { name: 'Docker / DevOps', slug: 'docker', emoji: '🐳' },
  { name: 'Angular', slug: 'angular', emoji: '🔴' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Newsletter Empleo IT España',
  description: 'Suscríbete a la newsletter de ofertas de empleo IT en España. Recibe alertas personalizadas por tecnología y ciudad.',
  url: `${BASE_URL}/newsletter`,
  provider: {
    '@type': 'Organization',
    name: 'Portal Trabajo IT',
    url: BASE_URL,
  }
};

export default function NewsletterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6 animate-pulse">
            📬 Completamente gratuita · Sin spam · Darse de baja con 1 clic
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight">
            Las mejores ofertas IT<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              en tu bandeja de entrada
            </span>
          </h1>

          <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Únete a <strong className="text-white">miles de desarrolladores</strong> que cada semana reciben una selección curada de ofertas de empleo tech en España con salario transparente, modalidad de trabajo y stack tecnológico.
          </p>

          {/* Formulario principal */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 md:p-8 max-w-xl mx-auto">
            <SubscribeForm location="España" />
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-indigo-300">
            <span className="flex items-center gap-1.5">✅ <strong className="text-white">+8.500</strong> suscriptores activos</span>
            <span className="text-indigo-600">·</span>
            <span className="flex items-center gap-1.5">📈 <strong className="text-white">42%</strong> tasa de apertura</span>
            <span className="text-indigo-600">·</span>
            <span className="flex items-center gap-1.5">⭐ <strong className="text-white">4.8/5</strong> valoración media</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">

        {/* Beneficios */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">¿Por qué suscribirse?</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Una newsletter diseñada por y para profesionales del sector IT.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
              <span className="text-3xl flex-shrink-0">{b.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ad Banner */}
        <div className="mb-16">
          <AdBanner variant="inline" />
        </div>

        {/* Tecnologías cubiertas */}
        <div className="bg-white border border-gray-150 rounded-3xl p-8 md:p-10 shadow-sm mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Tecnologías que cubrimos</h2>
            <p className="text-gray-500 text-sm">Filtramos y cubrimos las tecnologías con más demanda en el mercado español.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TECHNOLOGIES.map((tech) => (
              <Link
                key={tech.slug}
                href={`/trabajos/${tech.slug}`}
                className="flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-150 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
              >
                <span className="text-xl">{tech.emoji}</span>
                <span className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700 transition-colors">{tech.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Qué incluye cada edición */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/40 border border-indigo-100 rounded-3xl p-8 md:p-10 mb-16">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 text-center">¿Qué incluye cada edición?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Top 5 ofertas de la semana</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Las mejores vacantes con salario visible, curadas por nuestro equipo editorial.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Pulso del mercado IT</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Tecnologías más demandadas esa semana, variaciones salariales y datos frescos de la BD.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Recurso de la semana</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Un artículo, herramienta o consejo para mejorar tu carrera en el sector tecnológico.</p>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-indigo-950 rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-3">¿A qué esperas?</h2>
          <p className="text-indigo-300 mb-8 text-sm leading-relaxed max-w-lg mx-auto">
            Miles de profesionales del sector ya están recibiendo las mejores oportunidades de empleo tech cada semana. Únete gratis en menos de 30 segundos.
          </p>
          <div className="max-w-md mx-auto">
            <SubscribeForm location="España" />
          </div>
          <p className="text-indigo-500 text-xs mt-6">
            Sin tarjeta de crédito. Sin compromisos.{' '}
            <Link href="/darse-de-baja" className="hover:text-indigo-300 underline">Darse de baja</Link> en cualquier momento.
          </p>
        </div>

      </div>
    </main>
  );
}
