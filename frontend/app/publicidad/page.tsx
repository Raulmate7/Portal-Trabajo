import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Publicidad y Patrocinios IT — Anúnciate con nosotros',
  description:
    'Llega a miles de profesionales del sector de la programación y la tecnología en España. Banners, patrocinio de newsletter y ofertas destacadas.',
  alternates: {
    canonical: '/publicidad',
  },
};

export default function PublicidadPage() {
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6 uppercase tracking-wider">
            📢 Oportunidades de Patrocinio
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Anúnciate ante miles de<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Profesionales Tecnológicos
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Portal Trabajo IT es el agregador de empleo IT de referencia en España. 
            Ayudamos a marcas de formación, IDEs, software SaaS y reclutadores a conectar de forma directa con desarrolladores activos y pasivos.
          </p>
        </div>
      </section>

      {/* Métricas clave */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full">
        <h2 className="text-xl md:text-2xl font-bold mb-8 text-center text-gray-250">Nuestra Audiencia en Cifras</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { metric: '+15.000', label: 'Páginas Vistas/Mes', desc: 'Tráfico de alta intención SEO' },
            { metric: '3.5 min', label: 'Permanencia Media', desc: 'Alto dwell-time en ofertas y salarios' },
            { metric: '+500', label: 'Suscriptores Activos', desc: 'Desarrolladores en nuestra Newsletter' },
            { metric: '100% IT', label: 'Público Segmentado', desc: 'Solo perfiles técnicos y de ingeniería' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 hover:border-gray-800 transition-all">
              <span className="text-3xl md:text-4xl font-extrabold text-indigo-400 block mb-2">{stat.metric}</span>
              <span className="block text-sm font-bold text-white mb-1">{stat.label}</span>
              <span className="block text-xs text-gray-500 leading-normal">{stat.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Formatos de Publicidad */}
      <section className="max-w-5xl mx-auto px-4 py-12 w-full">
        <h2 className="text-xl md:text-2xl font-bold mb-10 text-center text-gray-250">Formatos Disponibles</h2>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {/* Formato 1: Ofertas Destacadas */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl mb-6">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ofertas Destacadas</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Coloca tus ofertas de empleo en las primeras posiciones del buscador de la tecnología correspondiente. Incluye difusión automática en nuestros bots sociales de Twitter/X, LinkedIn y Telegram.
              </p>
            </div>
            <Link
              href="/publicar-oferta"
              className="block w-full text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold hover:from-amber-400 hover:to-yellow-400 transition-all text-xs"
            >
              Publicar Oferta Destacada
            </Link>
          </div>

          {/* Formato 2: Banners en Web */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mb-6">
                📰
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Banners Patrocinados</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Espacios publicitarios dedicados (formatos horizontales en la cabecera y verticales en barra lateral) en nuestras páginas con más tráfico recurrente: /salarios, directorio de empresas y blog de orientación profesional.
              </p>
            </div>
            <a
              href="mailto:publicidad@portalempleoit.com?subject=Interés%20en%20Banners%20Web"
              className="block w-full text-center py-2.5 px-4 rounded-xl border border-gray-750 text-white font-bold hover:bg-gray-800 transition-all text-xs"
            >
              Consultar Tarifas
            </a>
          </div>

          {/* Formato 3: Patrocinio de Newsletter */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl mb-6">
                ✉️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Newsletter Semanal</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Patrocina el boletín semanal que reciben cientos de suscriptores directamente en su bandeja de entrada cada lunes. Coloca un bloque dedicado de texto + enlace para promocionar cursos, herramientas o servicios.
              </p>
            </div>
            <a
              href="mailto:publicidad@portalempleoit.com?subject=Interés%20en%20Newsletter"
              className="block w-full text-center py-2.5 px-4 rounded-xl border border-gray-750 text-white font-bold hover:bg-gray-800 transition-all text-xs"
            >
              Patrocinar Boletín
            </a>
          </div>
        </div>
      </section>

      {/* CTA final de contacto */}
      <section className="max-w-3xl mx-auto px-4 py-16 w-full text-center">
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-gray-800/80 rounded-3xl p-8 md:p-12 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-4">¿Hablamos?</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Escríbenos describiendo tu producto, servicio u oferta y nos pondremos en contacto contigo en menos de 24 horas laborables para facilitarte un dossier personalizado.
          </p>
          <a
            href="mailto:publicidad@portalempleoit.com"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            ✉️ Enviar un Email a publicidad@portalempleoit.com
          </a>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-900 py-10 text-center text-gray-505 text-sm bg-gray-950/80">
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
