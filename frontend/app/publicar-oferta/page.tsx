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
            href="#planes"
            className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-10 rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-lg"
          >
            Ver planes y precios ↓
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

      {/* Planes */}
      <section id="planes" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-4">
          Nuestros Planes y Tarifas
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Elige el nivel de visibilidad que necesita tu vacante y empieza a recibir candidatos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan Básico */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-gray-750 transition-all">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Plan Regular</span>
              <h3 className="text-lg font-extrabold text-white">Básico</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-black">Gratis</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed flex-grow">
              Ideal para startups o pruebas rápidas de volumen.
            </p>
            <ul className="space-y-2.5 text-xs text-gray-300 border-t border-gray-800/80 pt-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                Publicación estándar 30d
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                Indexación por categoría
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                Enlace de candidatura
              </li>
            </ul>
            <a
              href="#formulario"
              className="block w-full text-center py-2 px-4 rounded-lg border border-gray-750 text-white font-bold hover:bg-gray-800 transition-all text-xs"
            >
              Seleccionar Gratis
            </a>
          </div>

          {/* Plan Destacado Rápido */}
          <div className="bg-gray-900/60 border border-amber-500/30 rounded-2xl p-6 flex flex-col hover:border-amber-500/50 transition-all">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500/70 block mb-1">Destaque Corto</span>
              <h3 className="text-lg font-extrabold text-white">Destacado Rápido</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-black text-amber-400">19€</span>
                <span className="text-gray-500 text-xs ml-1 mb-0.5">/ 7 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed flex-grow">
              Visibilidad de impacto inmediato para acelerar la captación a bajo coste.
            </p>
            <ul className="space-y-2.5 text-xs text-gray-300 border-t border-gray-800/80 pt-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                Fijada arriba por 7 días
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                Diseño premium dorado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                Badge ⭐ Destacada
              </li>
            </ul>
            <a
              href="#formulario"
              className="block w-full text-center py-2 px-4 rounded-lg border border-amber-500/50 text-amber-400 font-bold hover:bg-amber-500/10 transition-all text-xs"
            >
              Seleccionar 19€
            </a>
          </div>

          {/* Plan Destacado Estándar */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-amber-500 rounded-2xl p-6 flex flex-col shadow-xl shadow-amber-500/5 hover:scale-[1.01] transition-all">
            <div className="absolute -top-3 left-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-bold shadow-md uppercase tracking-wider">
                Recomendado
              </span>
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block mb-1">Máxima Conversión</span>
              <h3 className="text-lg font-extrabold text-white">Destacado Estándar</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-black text-amber-400">39€</span>
                <span className="text-gray-500 text-xs ml-1 mb-0.5">/ 30 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed flex-grow">
              Consigue la mayor visibilidad. Ideal para la mayoría de perfiles.
            </p>
            <ul className="space-y-2.5 text-xs text-gray-300 border-t border-gray-800/80 pt-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                Fijada arriba por 30 días
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                Diseño premium dorado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                Alerta push a suscriptores
              </li>
            </ul>
            <a
              href="#formulario"
              className="block w-full text-center py-2 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black hover:from-amber-400 hover:to-yellow-400 transition-all text-xs"
            >
              Seleccionar 39€
            </a>
          </div>

          {/* Plan Destacado Premium */}
          <div className="bg-gray-900/60 border border-purple-500/40 rounded-2xl p-6 flex flex-col hover:border-purple-500 transition-all">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">Cobertura Total</span>
              <h3 className="text-lg font-extrabold text-white">Destacado Premium</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-black text-purple-400">79€</span>
                <span className="text-gray-500 text-xs ml-1 mb-0.5">/ 30 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed flex-grow">
              Máxima difusión en Boletín, Telegram y todas nuestras redes.
            </p>
            <ul className="space-y-2.5 text-xs text-gray-300 border-t border-gray-800/80 pt-4 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">✓</span>
                Fijada arriba por 30 días
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">✓</span>
                Inclusión en Boletín Semanal
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">✓</span>
                Telegram, LinkedIn, Twitter, Mastodon
              </li>
            </ul>
            <a
              href="#formulario"
              className="block w-full text-center py-2 px-4 rounded-lg border border-purple-500 text-purple-400 font-bold hover:bg-purple-500/10 transition-all text-xs"
            >
              Seleccionar 79€
            </a>
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
