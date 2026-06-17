import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 3600; // Cache 1 hora (ISR)

export const metadata: Metadata = {
  title: 'Noticias de Tecnología y Programación | Portal Trabajo IT',
  description: 'Mantente al día con las últimas noticias del sector tech, lenguajes de programación, software y empleo IT en España.',
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

      // Extraer Título (soportando CDATA)
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
      // Extraer Link
      const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemContent.match(/<link>([\s\S]*?)<\/link>/);
      // Extraer Descripción (limpiando HTML/CDATA)
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
      // Extraer Fecha de publicación
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      const title = titleMatch ? titleMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      let rawDesc = descMatch ? descMatch[1].trim() : '';
      // Limpiar etiquetas HTML de la descripción
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

    return items.slice(0, 15); // Limitar a las 15 más recientes de cada fuente
  } catch (error) {
    console.error(`Error al parsear RSS de ${sourceName}:`, error);
    return [];
  }
}

export default async function NoticiasPage() {
  const xatakaNews = await fetchRssFeed('https://feeds.weblogssl.com/xataka2', 'Xataka');
  const genbetaNews = await fetchRssFeed('https://feeds.weblogssl.com/genbeta', 'Genbeta');

  // Combinar y ordenar cronológicamente
  const allNews = [...xatakaNews, ...genbetaNews].sort(
    (a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()
  );

  const newsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Últimas Noticias Tech | Portal Trabajo IT',
    'description': 'Feed agregado de noticias del sector tecnológico en español.',
    'numberOfItems': allNews.length,
    'itemListElement': allNews.map((news, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'url': news.link,
      'name': news.title
    }))
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }}
      />
      
      {/* Header section */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-4 border border-indigo-100">
          📰 Agregador de Actualidad Tech en Directo
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Noticias del Sector Tecnológico
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          Sigue las últimas novedades sobre lenguajes de programación, desarrollo de software, inteligencia artificial y el mercado de empleo IT en España.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {allNews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
              <span className="text-5xl block mb-4">📭</span>
              <h3 className="text-lg font-bold text-gray-800">No se pudieron cargar las noticias</h3>
              <p className="text-sm text-gray-500 mt-1">Por favor, vuelve a intentarlo más tarde.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {allNews.map((item, idx) => (
                <div key={`${item.slug || idx}-${item.title}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-indigo-650 transition-colors">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline leading-snug block">
                      {item.title}
                    </a>
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group"
                  >
                    Leer noticia completa en {item.source} 
                    <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-indigo-950 text-center">
              <span className="text-3xl block mb-3">💼</span>
              <h3 className="font-bold text-lg mb-2">¿Buscas empleo IT?</h3>
              <p className="text-indigo-200 text-xs leading-relaxed mb-5">
                Encuentra miles de vacantes de programación y sistemas actualizadas cada 6 horas en España.
              </p>
              <Link 
                href="/trabajos/informatica-tecnologia"
                className="inline-block w-full bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                Explorar Ofertas
              </Link>
            </div>

            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
