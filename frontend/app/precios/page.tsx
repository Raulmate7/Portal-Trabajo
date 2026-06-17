import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tarifas y Planes para Publicar Ofertas IT — Portal Trabajo IT',
  description:
    'Encuentra el mejor plan para publicar tus ofertas de empleo y llegar a miles de desarrolladores en España. Planes gratis y opciones destacadas.',
  alternates: {
    canonical: '/precios',
  },
};

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
      {/* Header / Hero */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-gray-950 to-purple-900/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
          >
            ← Volver al buscador
          </Link>

          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Tarifas de Publicación
          </h1>
          <p className="text-base md:text-lg text-gray-450 max-w-xl mx-auto mb-4 leading-relaxed">
            Llega de forma directa y efectiva al talento tecnológico de España. 
            Elige el plan que mejor se adapte a tus necesidades de reclutamiento.
          </p>
        </div>
      </section>

      {/* Planes Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan Básico (Gratis) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-gray-750 transition-all">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Plan Regular</span>
              <h2 className="text-xl font-extrabold text-white">Básico</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-white">Gratis</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Ideal para startups que están validando o equipos con poco volumen de contratación.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                Publicación estándar por 30 días
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                Indexación básica en categorías
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                Enlace a tu web de candidaturas
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-700">✗</span>
                Sin prioridad de orden
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-700">✗</span>
                Sin difusión en Redes/Telegram
              </li>
            </ul>
            <Link
              href="/publicar-oferta"
              className="mt-6 text-center py-2.5 px-4 rounded-xl border border-gray-750 text-white font-bold hover:bg-gray-800 transition-all text-sm"
            >
              Publicar Gratis
            </Link>
          </div>

          {/* Plan Destacado Rápido */}
          <div className="bg-gray-900/60 border border-amber-500/30 rounded-2xl p-6 flex flex-col hover:border-amber-500/50 transition-all">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500/70 block mb-1">Destaque Corto</span>
              <h2 className="text-xl font-extrabold text-white">Destacado Rápido</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-amber-400">19€</span>
                <span className="text-gray-500 text-xs ml-2 mb-1">/ 7 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Visibilidad de impacto inmediato para acelerar la captación a bajo coste.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Fijada arriba</strong> de las listas por 7 días</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Diseño premium destacado con bordes dorados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Badge visual &quot;⭐ Destacada&quot;
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-700">✗</span>
                Sin envío a Newsletter semanal
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-700">✗</span>
                Sin publicación en Telegram / Redes
              </li>
            </ul>
            <Link
              href="/publicar-oferta"
              className="mt-6 text-center py-2.5 px-4 rounded-xl border border-amber-500/50 text-amber-400 font-bold hover:bg-amber-500/10 transition-all text-sm"
            >
              Destacar por 19€
            </Link>
          </div>

          {/* Plan Destacado Estándar */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-amber-500 rounded-2xl p-6 flex flex-col shadow-xl shadow-amber-500/5 hover:scale-[1.01] transition-all">
            <div className="absolute -top-3.5 left-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold shadow-md uppercase tracking-wider">
                Recomendado
              </span>
            </div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block mb-1">Máxima Conversión</span>
              <h2 className="text-xl font-extrabold text-white">Destacado Estándar</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-amber-400">39€</span>
                <span className="text-gray-500 text-xs ml-2 mb-1">/ 30 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Consigue la mayor visibilidad. Ideal para la mayoría de perfiles y necesidades estándar.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Fijada arriba</strong> de las listas por 30 días</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Diseño premium con bordes dorados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Alerta push inmediata a suscriptores
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Badge visual &quot;⭐ Destacada&quot; en todo el portal
              </li>
              <li className="flex items-start gap-2 text-gray-650">
                <span className="text-gray-700">✗</span>
                Sin boletín ni canales sociales
              </li>
            </ul>
            <Link
              href="/publicar-oferta"
              className="mt-6 text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 text-sm"
            >
              Destacar por 39€
            </Link>
          </div>

          {/* Plan Destacado Premium */}
          <div className="bg-gray-900/60 border border-purple-500/40 rounded-2xl p-6 flex flex-col hover:border-purple-500 transition-all">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">Cobertura Total</span>
              <h2 className="text-xl font-extrabold text-white">Destacado Premium</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-purple-400">79€</span>
                <span className="text-gray-500 text-xs ml-2 mb-1">/ 30 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Máxima difusión multicanal. Ideal para vacantes difíciles de cubrir o contratación masiva.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                <span><strong>Fijada arriba</strong> de las listas por 30 días</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Diseño premium destacado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Inclusión en el <strong>boletín semanal (newsletter)</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Publicación en **canales de Telegram**
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Difusión en **LinkedIn, Twitter/X y Mastodon**
              </li>
            </ul>
            <Link
              href="/publicar-oferta"
              className="mt-6 text-center py-2.5 px-4 rounded-xl border border-purple-500 text-purple-400 font-bold hover:bg-purple-500/10 transition-all text-sm"
            >
              Destacar por 79€
            </Link>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-900 py-10 text-center text-gray-500 text-sm mt-12 bg-gray-950/80">
        <p className="mb-2">
          © {new Date().getFullYear()} Portal Trabajo IT · Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Volver al buscador</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
          <span>·</span>
          <Link href="/publicar-oferta" className="hover:text-white transition-colors">Publicar Oferta</Link>
        </div>
      </footer>
    </main>
  );
}
