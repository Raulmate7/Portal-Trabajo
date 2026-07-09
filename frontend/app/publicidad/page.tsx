import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Publicidad y Patrocinios IT — Media Kit B2B | Portal Trabajo IT',
  description:
    'Llega de forma directa a una audiencia de más de 8.700 profesionales de la programación y la tecnología en España. Descubre nuestros formatos publicitarios.',
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
            📢 Media Kit & Patrocinios B2B
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Anúnciate ante una comunidad de<br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              +8.700 Desarrolladores Activos
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-405 max-w-2xl mx-auto leading-relaxed">
            Portal Trabajo IT es el portal de empleo tecnológico especializado en España.
            Conectamos marcas de software, formación, IDEs y reclutadores directamente con programadores e ingenieros de sistemas altamente cualificados.
          </p>
        </div>
      </section>

      {/* Métricas clave actualizadas */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full">
        <h2 className="text-xl md:text-2xl font-bold mb-8 text-center text-gray-250">Nuestra Audiencia en Cifras</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { metric: '+35.000', label: 'Páginas Vistas/Mes', desc: 'Tráfico orgánico de alta intención SEO' },
            { metric: '8.700+', label: 'Suscriptores Tech', desc: 'Newsletter de desarrolladores segmentados' },
            { metric: '42%', label: 'Tasa de Apertura', desc: 'Engagement de newsletter muy superior a la media' },
            { metric: '100% IT', label: 'Público Especializado', desc: 'Solo desarrolladores, ingenieros de sistemas y datos' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 hover:border-gray-800 transition-all">
              <span className="text-3xl md:text-4xl font-extrabold text-amber-400 block mb-2">{stat.metric}</span>
              <span className="block text-sm font-bold text-white mb-1">{stat.label}</span>
              <span className="block text-xs text-gray-500 leading-normal">{stat.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Formatos de Publicidad B2B */}
      <section className="max-w-5xl mx-auto px-4 py-12 w-full">
        <h2 className="text-xl md:text-2xl font-bold mb-10 text-center text-gray-250">Formatos y Canales de Patrocinio</h2>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          
          {/* Formato 1: Ofertas Destacadas */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl mb-6">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ofertas Destacadas (SaaS)</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Fija tu vacante en la cabecera del buscador.
                Aumenta el volumen de candidatos y obtén difusión automatizada en la newsletter semanal y redes sociales.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-6 list-disc list-inside">
                <li>Básico (39€) — 15 días destacado</li>
                <li>Pro (79€) — 30 días destacado + Newsletter</li>
                <li>Enterprise (199€) — Destaque 30d + Newsletter exclusiva + Social push</li>
              </ul>
            </div>
            <Link
              href="/precios"
              className="block w-full text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold hover:from-amber-400 hover:to-yellow-400 transition-all text-xs shadow-md shadow-amber-500/10"
            >
              Ver Planes de Publicación
            </Link>
          </div>

          {/* Formato 2: Newsletter Patrocinada */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl mb-6">
                ✉️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Newsletter Patrocinada</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Promociona bootcamps, cursos, eventos, herramientas SaaS o servicios de tu marca directamente en la bandeja de entrada de 8.700+ profesionales de la tecnología.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-6 list-disc list-inside">
                <li>Bloque editorial exclusivo (Texto + Botón CTA)</li>
                <li>150€ por envío único</li>
                <li>Excelente tasa de click-through (CTR) de programadores</li>
              </ul>
            </div>
            <a
              href="mailto:publicidad@portalempleoit.com?subject=Reserva%20de%20Newsletter%20Patrocinada"
              className="block w-full text-center py-2.5 px-4 rounded-xl border border-purple-500 text-purple-400 font-bold hover:bg-purple-500/10 transition-all text-xs"
            >
              Reservar Espacio (150€)
            </a>
          </div>

          {/* Formato 3: Banners de Marca */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mb-6">
                📰
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Banners de Marca</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Consigue impresiones directas colocando banners estáticos en el sidebar lateral o entre las ofertas de las páginas con más tráfico orgánico como la calculadora de salarios o guías del blog.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-6 list-disc list-inside">
                <li>Visibilidad continua sin ad-blockers (anuncios nativos)</li>
                <li>Enlace directo con UTM de tracking</li>
                <li>Tarifa plana mensual (250€/mes)</li>
              </ul>
            </div>
            <a
              href="mailto:publicidad@portalempleoit.com?subject=Interés%20en%20Banners%20Nativos"
              className="block w-full text-center py-2.5 px-4 rounded-xl border border-gray-750 text-white font-bold hover:bg-gray-800 transition-all text-xs"
            >
              Contratar Banner (250€/mes)
            </a>
          </div>
        </div>
      </section>

      {/* CTA final de contacto */}
      <section className="max-w-3xl mx-auto px-4 py-16 w-full text-center">
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-gray-800/80 rounded-3xl p-8 md:p-12 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-4">¿Quieres nuestro Media Kit completo en PDF?</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Escríbenos directamente o haz clic en el botón para solicitar tarifas personalizadas y estadísticas detalladas por tecnología. Te responderemos en menos de 24 horas.
          </p>
          <a
            href="mailto:publicidad@portalempleoit.com?subject=Solicitud%20de%20Media%20Kit%20Portal%20Trabajo%20IT"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            ✉️ Solicitar Dossier de Tarifas
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
