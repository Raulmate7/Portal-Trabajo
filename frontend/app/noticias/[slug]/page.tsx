import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getBlogPosts } from '@/lib/blog';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import PushSubscribe from '@/components/PushSubscribe';
import Breadcrumbs from '@/components/Breadcrumbs';
import AuthorBox from '@/components/AuthorBox';
import { Markdown } from '@/lib/markdown';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 3600; // Cache de 1 hora (ISR)

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    return { title: 'Noticia no encontrada' };
  }

  const queryParam = ''; // Para canonical

  return {
    title: `${post.title} | Noticias Portal Empleo IT`,
    description: post.excerpt,
    alternates: {
      canonical: `${BASE_URL}/noticias/${resolvedParams.slug}`,
      languages: {
        'es-ES': `${BASE_URL}/noticias/${resolvedParams.slug}`,
        'en': `${BASE_URL}/noticias/${resolvedParams.slug}?lang=en`,
        'x-default': `${BASE_URL}/noticias/${resolvedParams.slug}`,
      }
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: `${BASE_URL}/blog/${resolvedParams.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [`${BASE_URL}/blog/${resolvedParams.slug}/opengraph-image`],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  // Solo pre-compilamos las noticias (slug comience con tendencias-)
  return posts
    .filter(post => post.slug.startsWith('tendencias-'))
    .map((post) => ({
      slug: post.slug,
    }));
}

function extractFaqsFromContent(content: string): any {
  const headingRegex = /\n(?:##|###)\s+([^\n]+\?)/g;
  const faqs = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const question = match[1].trim();
    const startIndex = match.index + match[0].length;
    const nextHeadingMatch = content.slice(startIndex).match(/\n(?:##|###)\s+/);
    const endPosition = nextHeadingMatch && nextHeadingMatch.index !== undefined
      ? startIndex + nextHeadingMatch.index
      : content.length;
      
    const answerMarkdown = content.substring(startIndex, endPosition).trim();
    const cleanAnswer = answerMarkdown
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[\*\_`#]/g, '')
      .replace(/\n+/g, ' ')
      .substring(0, 300) + '...';
      
    faqs.push({
      '@type': 'Question',
      'name': question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': cleanAnswer
      }
    });
  }

  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Dividir el contenido del post en el primer encabezado H2 para insertar publicidad contextual en medio del artículo
  let intro = post.content;
  let restFirst = '';
  let restSecond = '';
  const match = post.content.match(/\n##\s+/);
  if (match && match.index !== undefined) {
    intro = post.content.substring(0, match.index);
    const rest = post.content.substring(match.index);
    
    // Buscar el segundo H2 (descartando el primero que está al inicio de `rest`)
    const secondMatch = rest.slice(1).match(/\n##\s+/);
    if (secondMatch && secondMatch.index !== undefined) {
      const splitIndex = secondMatch.index + 1; // Ajuste por slice(1)
      restFirst = rest.substring(0, splitIndex);
      restSecond = rest.substring(splitIndex);
    } else {
      restFirst = rest;
    }
  }

  // Extraer encabezados H2 para la tabla de contenidos (TOC)
  const headings: { id: string; text: string }[] = [];
  const h2Regex = /\n##\s+([^\n]+)/g;
  let matchH2;
  while ((matchH2 = h2Regex.exec(post.content)) !== null) {
    const text = matchH2[1].trim();
    const id = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    headings.push({ id, text });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    image: [
      `${BASE_URL}/blog/${resolvedParams.slug}/opengraph-image`
    ],
    datePublished: new Date(post.date).toISOString(),
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${BASE_URL}/sobre-nosotros`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Portal Trabajo IT',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`
      }
    }
  };

  const faqPageSchema = extractFaqsFromContent(post.content);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqPageSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />
      )}

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Noticias', href: '/noticias' },
          { label: post.title },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-8 md:p-12 font-sans">
              <header className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-full mb-3 inline-block">
                  📊 Tendencias y Mercado IT
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center text-gray-500 text-xs gap-x-4 gap-y-1 mt-3">
                  <time dateTime={post.date} className="inline-flex items-center gap-1.5">
                    <span>📅</span> Publicado: {new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span>✍️</span> {post.author}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span>⏱️</span> {Math.max(1, Math.ceil(post.content.split(/\s+/).length / 220))} min de lectura
                  </span>
                </div>
              </header>

              {headings.length > 0 && (
                <div className="mb-8 p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 shadow-sm">
                  <h3 className="text-sm font-bold text-indigo-950 mb-3.5 uppercase tracking-wider flex items-center gap-2">
                    📋 Secciones del artículo
                  </h3>
                  <ul className="space-y-2.5 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <a href={`#${h.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg mb-8">
                <Markdown content={intro} autoLink={true} isEnglish={false} />
                
                {/* Primer banner de AdSense (Oportunidad 1.3) */}
                {restFirst && (
                  <>
                    <div className="my-8">
                      <AdBanner variant="inline" />
                    </div>
                    <Markdown content={restFirst} autoLink={true} isEnglish={false} />
                  </>
                )}
                
                {/* Segundo banner de AdSense (Oportunidad 1.3) */}
                {restSecond && (
                  <>
                    <div className="my-8">
                      <AdBanner variant="inline" />
                    </div>
                    <Markdown content={restSecond} autoLink={true} isEnglish={false} />
                  </>
                )}
              </div>

              {/* Banner al final */}
              <div className="my-8 border-t border-b border-gray-100 py-6">
                <AdBanner variant="multiplex" />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SubscribeForm location="España" />
            <PushSubscribe />
            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
