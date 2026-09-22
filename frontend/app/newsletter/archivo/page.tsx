import { Metadata } from 'next';
import Link from 'next/link';
import { NEWSLETTER_EDITIONS } from '@/lib/newsletter-archive';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: 'Archivo de Newsletters de Empleo IT | Boletines Semanales',
  description: 'Explora las ediciones pasadas de nuestro boletín semanal sobre el mercado laboral IT en España: ofertas destacadas, tendencias salariales y análisis técnico.',
  alternates: {
    canonical: `${BASE_URL}/newsletter/archivo`,
  },
  openGraph: {
    title: 'Archivo de Newsletters IT | Portal Trabajo IT',
    description: 'Histórico de boletines semanales sobre el mercado tecnológico en España.',
    url: `${BASE_URL}/newsletter/archivo`,
  }
};

export default function NewsletterArchivePage() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Archivo de Newsletters de Empleo IT',
    description: 'Histórico de boletines informativos semanales sobre el mercado de trabajo de programación en España.',
    url: `${BASE_URL}/newsletter/archivo`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: NEWSLETTER_EDITIONS.length,
      itemListElement: NEWSLETTER_EDITIONS.map((e, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${BASE_URL}/newsletter/archivo/${e.slug}`,
        name: e.title
      }))
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            📬 Archivo Histórico de Boletines
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Archivo de Newsletters IT
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Consulta los análisis de mercado, rankings salariales y selecciones de ofertas publicadas en nuestros envíos semanales.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Newsletter', href: '/newsletter' },
          { label: 'Archivo' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <AdBanner variant="inline" />

        <div className="space-y-6">
          {NEWSLETTER_EDITIONS.map((item) => (
            <article 
              key={item.slug} 
              className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
                  <span>📅 {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>⏱️ {item.readTimeMinutes} min de lectura</span>
                </div>

                <Link href={`/newsletter/archivo/${item.slug}`}>
                  <h2 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors leading-snug">
                    {item.title}
                  </h2>
                </Link>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.summary}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {item.featuredTechs.map((tech) => (
                    <span key={tech} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0">
                <Link 
                  href={`/newsletter/archivo/${item.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl border border-indigo-100 transition-colors"
                >
                  Leer Edición →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <AdBanner variant="multiplex" />
      </div>
    </main>
  );
}
