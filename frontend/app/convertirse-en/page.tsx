import { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';
import { PROFESSIONS } from '@/lib/convertirse';

export const revalidate = 86400; // Cache 24h

export const metadata: Metadata = {
  title: 'Guías de Carrera IT [2026] | Hojas de Ruta para Programadores',
  description: 'Descubre las guías de carrera para convertirte en desarrollador Frontend, Backend, Fullstack, Cloud DevOps, Data Analyst o desarrollador Mobile en España.',
  alternates: {
    canonical: `${BASE_URL}/convertirse-en`,
  },
  openGraph: {
    title: 'Guías de Carrera IT [2026] | Hojas de Ruta para Programadores',
    description: 'Hojas de ruta paso a paso, salarios medios estimados y habilidades necesarias para los perfiles tech más buscados.',
    url: `${BASE_URL}/convertirse-en`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Guías de Carrera IT',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guías de Carrera IT [2026] | Hojas de Ruta',
    description: 'Hojas de ruta paso a paso para ser programador en España.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

export default function ConvertirseEnIndexPage() {
  const professionEntries = Object.entries(PROFESSIONS);

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guías de Carrera IT y Hojas de Ruta para Programadores',
    description: 'Directorio de guías paso a paso para perfiles de desarrollo y tecnología en España.',
    url: `${BASE_URL}/convertirse-en`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: professionEntries.length,
      itemListElement: professionEntries.map(([key, data], idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${BASE_URL}/convertirse-en/${key}`,
        name: data.title
      }))
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🎓 Hojas de Ruta Profesionales 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Guías de Carrera IT
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Hojas de ruta detalladas con los pasos, habilidades técnicas, salarios de referencia y vacantes activas en España.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Guías de Carrera' }
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <AdBanner variant="inline" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionEntries.map(([key, data]) => (
            <Link 
              key={key} 
              href={`/convertirse-en/${key}`}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-2xl">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {data.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  {data.description}
                </p>
              </div>

              <div className="pt-6">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver Hoja de Ruta Completa →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <AdBanner variant="multiplex" />
      </div>
    </main>
  );
}
