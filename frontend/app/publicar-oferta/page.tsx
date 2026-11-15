import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import PublishForm from './PublishForm';

export const metadata: Metadata = {
  title: 'Publicar Oferta de Empleo IT — Llega a miles de desarrolladores',
  description:
    'Publica tu oferta de trabajo en Portal Trabajo IT y llega a miles de programadores activos en España. Planes desde 0€. Ofertas destacadas con máxima visibilidad.',
  alternates: {
    canonical: '/publicar-oferta',
  },
  openGraph: {
    title: 'Publicar Oferta de Empleo IT — Portal Trabajo IT',
    description:
      'Llega a miles de desarrolladores activos. Publica tu oferta y recibe candidatos cualificados.',
  },
};

export default function PublicarOfertaPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-gray-950 to-purple-900/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
          >
            ← Volver al buscador
          </Link>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Publica tu oferta y llega a{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              miles de desarrolladores
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Portal Trabajo IT recibe tráfico diario de programadores activos en España.
            Tu oferta aparecerá en nuestra web, canal de Telegram y newsletter.
          </p>

          <a
            href="#formulario"
            className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-10 rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-lg"
          >
            Publicar oferta gratis ↓
          </a>
        </div>
      </section>

      {/* Ventajas */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-12">
          ¿Por qué publicar aquí?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎯',
              title: 'Audiencia cualificada',
              desc: 'Solo profesionales IT: React, Python, Java, DevOps, Data Science...',
            },
            {
              icon: '📲',
              title: 'Distribución multicanal',
              desc: 'Tu oferta se publica en la web, se envía al canal de Telegram y a nuestra newsletter.',
            },
            {
              icon: '⚡',
              title: 'Publicación en 24h',
              desc: 'Revisamos y publicamos tu oferta en menos de un día laborable.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plan único gratuito de lanzamiento */}
      <section id="planes" className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-indigo-950/60 via-gray-900 to-gray-950 border border-indigo-500/40 rounded-3xl p-8 text-center shadow-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            Fase de Lanzamiento · 100% Gratuito
          </span>
          <h2 className="text-2xl md:text-3xl font-black mb-3">
            Publica tu vacante sin coste
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto mb-6">
            Actualmente todas las publicaciones de empleo son <strong>totalmente gratuitas</strong> para priorizar el crecimiento de ofertas de calidad.
            Cada envío pasa por una breve supervisión manual de nuestro equipo antes de activarse en el buscador.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-300">
            <span className="px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700">✓ Listado completo 30 días</span>
            <span className="px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700">✓ Revisión anti-spam &lt;24h</span>
            <span className="px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700">✓ Sin tarjeta ni compromisos</span>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section id="formulario" className="max-w-2xl mx-auto px-4 py-20">
        <Suspense fallback={<div className="text-center py-12 text-gray-400">Cargando formulario...</div>}>
          <PublishForm />
        </Suspense>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} Portal Trabajo IT ·{' '}
          <Link href="/" className="text-indigo-400 hover:underline">
            Volver al buscador
          </Link>{' '}
          ·{' '}
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Privacidad
          </Link>
        </p>
      </footer>
    </main>
  );
}
