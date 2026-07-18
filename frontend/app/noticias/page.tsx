import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 3600; // Cache 1 hora (ISR)

export const metadata: Metadata = {
  title: 'Noticias y Tendencias de Tecnología | Portal Trabajo IT',
  description: 'Mantente al día con las últimas noticias del sector tech, novedades de lenguajes de programación e informes de empleo IT en España.',
  alternates: {
    canonical: '/noticias',
  },
};

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  parsedDate: Date;
}

interface LocalNewsItem {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

async function fetchLocalNews(): Promise<LocalNewsItem[]> {
  try {
    const res = await pool.query(
      `SELECT slug, title, excerpt, date 
       FROM blog_posts 
       WHERE slug LIKE 'tendencias-%' OR author = 'Sistema de Tendencias IT'
       ORDER BY date DESC LIMIT 8`
    );
    return res.rows.map((row: any) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt || '',
      date: row.date,
    }));
  } catch (error) {
    console.error("Error cargando noticias locales:", error);
    return [];
  }
}

async function fetchRssFeed(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Fetch failed for ${url}`);
    
    const text = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];

      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      const title = titleMatch ? titleMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      let rawDesc = descMatch ? descMatch[1].trim() : '';
      rawDesc = rawDesc.replace(/<[^>]*>?/gm, '');
      const description = rawDesc.length > 180 ? rawDesc.substring(0, 180) + '...' : rawDesc;

      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      const parsedDate = pubDate ? new Date(pubDate) : new Date();

      if (title && link) {
        items.push({
          title,
          link,
          description,
          pubDate,
          source: sourceName,
          parsedDate,
        });
      }
    }

    return items.slice(0, 15);
  } catch (error) {
    console.error(`Error al parsear RSS de ${sourceName}:`, error);
    return [];
  }
}

export default async function NoticiasPage() {
  const [localNews, xatakaNews, genbetaNews] = await Promise.all([
    fetchLocalNews(),
    fetchRssFeed('https://feeds.weblogssl.com/xataka2', 'Xataka'),
    fetchRssFeed('https://feeds.weblogssl.com/genbeta', 'Genbeta')
  ]);

  const allExternalNews = [...xatakaNews, ...genbetaNews].sort(
    (a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()
  );

  const newsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Noticias Tech y Tendencias IT | Portal Trabajo',
    'description': 'Informes de mercado tecnológico y feeds de actualidad en español.',
    'numberOfItems': localNews.length + allExternalNews.length,
    'itemListElement': [
      ...localNews.map((news, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'url': `${BASE_URL}/noticias/${news.slug}`,
        'name': news.title
      })),
      ...allExternalNews.map((news, idx) => ({
        '@type': 'ListItem',
        'position': localNews.length + idx + 1,
        'url': news.link,
        'name': news.title
      }))
    ]
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl min-h-screen font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }}
      />
      
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold mb-4 border border-indigo-100/60">
          📰 Actualidad Tech y Análisis de Mercado IT
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
          Noticias y Tendencias Tecnológicas
        </h1>
        <p className="text-gray-650 text-base leading-relaxed">
          Mantente al día con los últimos informes de empleo IT de nuestra base de datos y la actualidad del sector de desarrollo de software e inteligencia artificial.
        </p>
      </div>

      {/* AdBanner en cabecera */}
      <div className="mb-10">
        <AdBanner variant="inline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Feed */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Sección 1: Noticias Internas / Informes de Tendencias (Oportunidad 1.3) */}
          {localNews.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-2">
                <span>📊</span> Informes de Tendencias IT y Salarios
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {localNews.map((news) => (
                  <div key={news.slug} className="bg-gradient-to-br from-indigo-50/20 via-white to-white rounded-2xl border border-indigo-100/80 shadow-md p-6 hover:shadow-lg transition-all group flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-2">
                        🔥 Tendencias del Portal
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-650 transition-colors leading-snug mb-3">
                        <Link href={`/noticias/${news.slug}`} className="hover:underline">
                          {news.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {news.excerpt}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-4">
                      <span className="text-xs text-gray-400">📅 {news.date}</span>
                      <Link 
                        href={`/noticias/${news.slug}`} 
                        className="text-xs font-black text-indigo-600 hover:text-indigo-850 inline-flex items-center gap-1.5"
                      >
                        Leer informe completo &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AdSense In-feed */}
          <div className="my-6">
            <AdBanner variant="inline" />
          </div>

          {/* Sección 2: RSS Feed Externo */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-2">
              <span>🌐</span> Actualidad Tecnológica Externa
            </h2>
            {allExternalNews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <span className="text-4xl block mb-3">🤷‍♂️</span>
                <p className="text-sm text-gray-500">No se pudieron recuperar las fuentes externas en este momento.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {allExternalNews.map((item, idx) => (
                  <div key={`${idx}-${item.title}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.source === 'Genbeta' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-orange-50 text-orange-700 border border-orange-100'
                      }`}>
                        {item.source}
                      </span>
                      <span className="text-xs text-gray-400">
                        • {item.parsedDate.toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-indigo-650 transition-colors leading-snug">
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline block">
                        {item.title}
                      </a>
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-bold text-indigo-650 hover:text-indigo-850 inline-flex items-center gap-1 group"
                    >
                      Leer en {item.source} 
                      <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-950 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_40%)]"></div>
            <div className="relative z-10">
              <span className="text-3xl block mb-3">💼</span>
              <h3 className="font-bold text-lg mb-2">Buscador de Empleo IT</h3>
              <p className="text-indigo-200 text-xs leading-relaxed mb-5">
                Accede a las últimas vacantes de desarrollo de software y sistemas publicadas y actualizadas de forma transparente.
              </p>
              <Link 
                href="/trabajos/informatica-tecnologia"
                className="inline-block w-full bg-white hover:bg-indigo-50 text-indigo-950 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                Explorar Ofertas
              </Link>
            </div>
          </div>

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
