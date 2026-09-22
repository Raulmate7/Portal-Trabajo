import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NEWSLETTER_EDITIONS, getNewsletterEdition } from '@/lib/newsletter-archive';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // 24h

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return NEWSLETTER_EDITIONS.map((e) => ({
    slug: e.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const edition = getNewsletterEdition(slug);

  if (!edition) {
    return { title: 'Edición de Newsletter no encontrada' };
  }

  return {
    title: `${edition.title} | Newsletter Portal Trabajo IT`,
    description: edition.summary,
    alternates: {
      canonical: `${BASE_URL}/newsletter/archivo/${slug}`,
    },
    openGraph: {
      title: edition.title,
      description: edition.summary,
      url: `${BASE_URL}/newsletter/archivo/${slug}`,
      type: 'article',
    }
  };
}

export default async function NewsletterEditionPage({ params }: Props) {
  const { slug } = await params;
  const edition = getNewsletterEdition(slug);

  if (!edition) {
    notFound();
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: edition.title,
    description: edition.summary,
    datePublished: edition.date,
    dateModified: edition.date,
    url: `${BASE_URL}/newsletter/archivo/${slug}`,
    author: {
      '@type': 'Organization',
      name: 'Portal Trabajo IT',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Portal Trabajo IT',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-14 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
            📬 Boletín Semanal · {new Date(edition.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {edition.title}
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            {edition.summary}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Newsletter', href: '/newsletter' },
          { label: 'Archivo', href: '/newsletter/archivo' },
          { label: edition.slug }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <AdBanner variant="inline" />

          {/* Highlights */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📌</span> Puntos Clave de esta Edición
            </h2>
            <ul className="space-y-2">
              {edition.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Editorial Content */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
              📝 Nota Editorial y Análisis
            </h2>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              {edition.content.editorial}
            </p>

            <div className="bg-indigo-50/60 p-5 rounded-xl border border-indigo-100 space-y-2">
              <h3 className="text-sm font-bold text-indigo-900">📈 Tendencias Salariales Observadas</h3>
              <p className="text-xs text-indigo-800 leading-relaxed">
                {edition.content.salaryTrends}
              </p>
            </div>

            {edition.content.sponsoredNote && (
              <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                {edition.content.sponsoredNote}
              </div>
            )}
          </div>

          <AdBanner variant="multiplex" />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <SubscribeForm location="Archivo Newsletter" />
          
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900">🔗 Tecnologías Tratadas</h3>
            <div className="flex flex-wrap gap-2">
              {edition.featuredTechs.map((tech) => (
                <Link key={tech} href={`/trabajos/${tech}`} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-semibold hover:bg-indigo-100">
                  {tech} →
                </Link>
              ))}
            </div>
          </div>

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </aside>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
