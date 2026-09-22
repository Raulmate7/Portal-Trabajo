import { Metadata } from 'next';
import Link from 'next/link';
import { IT_EVENTS } from '@/lib/eventos';
import { BASE_URL } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Eventos y Conferencias IT en España [2026] | Meetups y Hackathons',
  description: 'Descubre las mejores conferencias de tecnología, congresos de software, meetups de programación y eventos IT en España.',
  alternates: {
    canonical: `${BASE_URL}/eventos-it`,
  },
  openGraph: {
    title: 'Conferencias y Eventos IT en España 2026',
    description: 'Calendario de eventos tecnológicos, congresos de desarrollo de software y meetups en España.',
    url: `${BASE_URL}/eventos-it`,
  }
};

export default function EventsPage() {
  const eventsJsonLd = IT_EVENTS.map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.locationName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city,
        addressCountry: 'ES'
      }
    },
    description: event.description,
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
      url: event.url
    }
  }));

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {eventsJsonLd.map((schema, idx) => (
        <script
          key={`event-schema-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            📅 Calendario Tecnológico España 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Eventos y Conferencias IT
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Conecta con la comunidad de desarrollo de software en España. Las mejores conferencias, hackathons y meetups técnicos.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Eventos IT' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <AdBanner variant="inline" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {IT_EVENTS.map((event) => (
            <div key={event.slug} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100/50">
                    📍 {event.city}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">
                    📅 {new Date(event.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {event.name}
                </h2>
                <p className="text-xs text-gray-400 font-medium mb-3">Organiza: {event.organizer} · {event.locationName}</p>
                <p className="text-sm text-gray-650 leading-relaxed mb-4">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {event.topics.map((t) => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Sitio Web Oficial del Evento →
              </a>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-8 rounded-2xl text-center space-y-4">
          <h3 className="text-2xl font-bold">¿Organizas un evento o meetup tecnológico?</h3>
          <p className="text-sm text-indigo-200 max-w-lg mx-auto">
            Publica tu conferencia o encuentro de la comunidad en nuestro portal para llegar a miles de desarrolladores en toda España.
          </p>
          <Link
            href="/contacto"
            className="inline-block bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-xs px-6 py-3 rounded-xl transition-colors"
          >
            Anunciar Evento Gratis →
          </Link>
        </div>
      </div>
    </main>
  );
}
