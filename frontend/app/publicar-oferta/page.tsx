import { Metadata } from 'next';
import Link from 'next/link';
import PublishForm from './PublishForm';

export const metadata: Metadata = {
  title: 'Publicar Oferta de Empleo IT — Llega a miles de desarrolladores',
  description:
    'Publica tu oferta de trabajo en Portal Trabajo IT y llega a miles de programadores activos en España. Planes desde 0€. Ofertas destacadas con máxima visibilidad.',
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
      <section id="planes" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-4">
          Precios de lanzamiento
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Aprovecha nuestras tarifas especiales mientras el portal sigue creciendo.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Plan Básico */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Básico</span>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-black">Gratis</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-300 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Publicación en la web durante 30 días
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Visible en el buscador y por sector
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Enlace directo a tu página de candidatura
              </li>
            </ul>
            <a
              href="#formulario"
              className="mt-8 text-center py-3 px-6 rounded-xl border border-gray-700 text-white font-bold hover:bg-gray-800 transition-all"
            >
              Publicar Gratis
            </a>
          </div>

          {/* Plan Destacado */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-amber-500/60 rounded-2xl p-8 flex flex-col shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3.5 left-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold shadow-md uppercase tracking-wider">
                ⭐ Oferta Especial
              </span>
            </div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Destacado</span>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-black">39€</span>
                <span className="text-gray-500 mb-1 line-through ml-2 text-sm">149€</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-300 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                Todo lo del plan Básico
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                <strong className="text-white">Fijada en la parte superior</strong> con diseño premium dorado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                Publicación en <strong className="text-white">canal de Telegram</strong> (+500 suscriptores IT)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                Envío en <strong className="text-white">newsletter semanal</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">✓</span>
                Badge &quot;⭐ Destacada&quot; que atrae más clics
              </li>
            </ul>
            <a
              href="#formulario"
              className="mt-8 text-center py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20"
            >
              Destacar por 39€
            </a>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section id="formulario" className="max-w-2xl mx-auto px-4 py-20">
        <PublishForm />
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
