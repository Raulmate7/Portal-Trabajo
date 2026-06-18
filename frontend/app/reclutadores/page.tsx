import Link from 'next/link';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Publicar Ofertas de Empleo IT — Captación y Reclutamiento Tech',
  description: 'Publica tus vacantes tecnológicas en Portal Trabajo IT. Encuentra programadores, ingenieros cloud y DevOps con planes a tu medida.',
  alternates: {
    canonical: `${BASE_URL}/reclutadores`,
  },
  openGraph: {
    title: 'Publicar Ofertas de Empleo IT — Portal Trabajo IT',
    description: 'Encuentra el mejor talento tecnológico en España. Publica tus vacantes y llega a miles de desarrolladores.',
    url: `${BASE_URL}/reclutadores`,
  }
};

export default function RecruitersLandingPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': '¿Cuánto cuesta publicar una oferta de empleo?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Disponemos de un plan básico 100% gratuito para que puedas probar la plataforma. Si necesitas mayor visibilidad, contamos con planes destacados desde 19€ y 39€.'
        }
      },
      {
        '@type': 'Question',
        'name': '¿Cuánto tiempo tarda en aprobarse mi oferta?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Las ofertas enviadas se revisan y aprueban en un plazo inferior a 24 horas laborables.'
        }
      },
      {
        '@type': 'Question',
        'name': '¿A qué canales se difunden las ofertas patrocinadas?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Las ofertas patrocinadas y destacadas se publican en la web, se envían al canal de Telegram y se difunden en nuestras redes sociales (LinkedIn, Twitter y Mastodon) además del boletín semanal.'
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} 
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-950 to-purple-950/80" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center z-10 space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            💼 Para empresas y reclutadores IT
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Encuentra al mejor{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Talento Tecnológico
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Publica tus vacantes de programación y sistemas en el portal especializado IT de referencia en España. Conecta directamente con candidatos cualificados y activos.
          </p>
          <div className="pt-6">
            <Link
              id="cta-publish-hero"
              href="/publicar-oferta"
              className="inline-block bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-400 hover:to-purple-550 text-white font-bold py-4.5 px-10 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] text-base"
            >
              Publicar Oferta Ahora →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900/40 border-y border-gray-900 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-black text-indigo-400 mb-1">15.000+</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Visitas Mensuales</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-indigo-400 mb-1">2.000+</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Suscritos Telegram</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-indigo-400 mb-1">5.000+</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Boletín Semanal</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-indigo-400 mb-1">24 Horas</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tiempo de Aprobación</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3.5xl font-black text-center mb-14">
          ¿Por qué reclutar en Portal Trabajo IT?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6.5 hover:border-indigo-500/30 transition-all">
            <span className="text-3xl mb-4 block">🎯</span>
            <h3 className="text-lg font-bold mb-2">Público Altamente Filtrado</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Evita recibir cientos de CVs que no encajan en el perfil. Nuestra audiencia está compuesta exclusivamente por desarrolladores, ingenieros cloud y analistas de datos activos en el sector IT.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6.5 hover:border-indigo-500/30 transition-all">
            <span className="text-3xl mb-4 block">📢</span>
            <h3 className="text-lg font-bold mb-2">Difusión Multicanal</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              No nos limitamos a mostrar tu vacante en la web. La publicamos en nuestro canal automatizado de Telegram, boletines por email específicos por tecnología y en nuestras cuentas de redes sociales.
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6.5 hover:border-indigo-500/30 transition-all">
            <span className="text-3xl mb-4 block">🛡️</span>
            <h3 className="text-lg font-bold mb-2">Candidatura Transparente</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tú decides cómo se postulan los candidatos: mediante tu ATS corporativo, tu email directo o tu página de empleo de origen. Cero intermediarios en tus comunicaciones.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Highlight */}
      <section className="bg-gray-900/20 border-t border-gray-900 py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-black">Empieza Gratis y Destaca Cuando lo Necesites</h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Disponemos de un plan básico gratuito para que pruebes el portal sin compromisos. Si tienes prisa o necesitas máxima conversión, nuestros planes de destaque aumentarán significativamente tus respuestas.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              id="cta-publish-free"
              href="/publicar-oferta" 
              className="py-3.5 px-8 bg-gray-900 border border-gray-800 hover:border-gray-700 font-bold rounded-xl text-sm transition-colors text-white"
            >
              Publicar Oferta Gratis
            </Link>
            <Link 
              id="cta-view-plans"
              href="/publicar-oferta#planes" 
              className="py-3.5 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-sm transition-colors text-white"
            >
              Ver todos los planes
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3.5xl font-black text-center mb-14">
          Lo que dicen los reclutadores
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "Publicamos un puesto destacado de React Senior y en menos de 48 horas recibimos perfiles muy alineados con los requisitos técnicos. Excelente portal para perfiles frontend."
            </p>
            <div className="mt-4">
              <p className="text-xs font-bold text-white">Laura G. · Technical Recruiter</p>
              <p className="text-[10px] text-gray-500">Consultora de software</p>
            </div>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "El plan de difusión en Telegram y boletín nos ayudó a cubrir una vacante muy difícil de DevOps. La visibilidad que ofrece a bajo coste es insuperable."
            </p>
            <div className="mt-4">
              <p className="text-xs font-bold text-white">Carlos M. · HR Manager</p>
              <p className="text-[10px] text-gray-500">Startup de producto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-10 text-center text-gray-600 text-xs">
        <p>© {new Date().getFullYear()} Portal Trabajo IT · Todos los derechos reservados</p>
      </footer>
    </main>
  );
}
