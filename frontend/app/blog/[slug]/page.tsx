import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getBlogPosts } from '@/lib/blog';
import { getClusterBySlug } from '@/lib/blog-clusters';
import AdBanner from '@/components/AdBanner';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import SubscribeForm from '@/components/SubscribeForm';
import PushSubscribe from '@/components/PushSubscribe';
import Breadcrumbs from '@/components/Breadcrumbs';
import AuthorBox from '@/components/AuthorBox';
import pool from '@/lib/db';
import { Markdown } from '@/lib/markdown';
import { BASE_URL } from '@/lib/constants';
import Image from 'next/image';
import AffiliateCourseCard from '@/components/AffiliateCourseCard';

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    return { title: 'Artículo no encontrado' };
  }

  return {
    title: `${post.title} | Blog Portal Empleo`,
    description: post.excerpt,
    alternates: {
      canonical: `${BASE_URL}/blog/${resolvedParams.slug}`,
      languages: {
        'es-ES': `${BASE_URL}/blog/${resolvedParams.slug}`,
        'en': `${BASE_URL}/blog/${resolvedParams.slug}?lang=en`,
        'x-default': `${BASE_URL}/blog/${resolvedParams.slug}`,
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
          url: `/blog/${resolvedParams.slug}/opengraph-image`,
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
      images: [`/blog/${resolvedParams.slug}/opengraph-image`],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

async function getRelatedJobs(slug: string) {
  const client = await pool.connect();
  try {
    let queryWord = '';
    if (slug.includes('react')) {
      queryWord = 'react';
    } else if (slug.includes('python')) {
      queryWord = 'python';
    } else if (slug.includes('java')) {
      queryWord = 'java';
    }
    
    let sql = "SELECT id, title, company, location FROM jobs";
    const params = [];
    if (queryWord) {
      sql += " WHERE title ILIKE $1";
      params.push(`%${queryWord}%`);
    }
    sql += " ORDER BY created_at DESC LIMIT 3";
    
    const res = await client.query(sql, params);
    return res.rows;
  } catch (error) {
    console.error("Error fetching related jobs:", error);
    return [];
  } finally {
    client.release();
  }
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

function detectPostTechnology(slug: string, title: string, content: string): string {
  const techs = [
    'react', 'node', 'python', 'java', 'typescript', 'aws', 'docker', 
    'flutter', 'csharp', 'php', 'sql', 'go', 'rust', 'ruby', 'scala', 
    'elixir', 'salesforce', 'cybersecurity', 'terraform', 'cobol'
  ];
  
  const slugLower = slug.toLowerCase();
  for (const tech of techs) {
    if (slugLower.includes(tech)) return tech;
  }
  
  const titleLower = title.toLowerCase();
  for (const tech of techs) {
    if (titleLower.includes(tech)) return tech;
  }
  
  const contentLower = content.substring(0, 500).toLowerCase();
  for (const tech of techs) {
    if (contentLower.includes(tech)) return tech;
  }
  
  return 'general';
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const relatedJobs = await getRelatedJobs(resolvedParams.slug);
  const cluster = getClusterBySlug(resolvedParams.slug);
  const clusterPosts = cluster
    ? await Promise.all(
        cluster.slugs
          .filter(s => s !== resolvedParams.slug)
          .slice(0, 3)
          .map(s => getPostBySlug(s))
      ).then(results => results.filter(Boolean))
    : [];

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

  const imageUrl = `${BASE_URL}/blog/${resolvedParams.slug}/opengraph-image`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['BlogPosting', 'NewsArticle'],
    headline: post.title,
    description: post.excerpt,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630
    },
    author: {
      '@type': 'Person',
      name: post.author,
      image: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/favicon.ico`,
        width: 60,
        height: 60
      }
    },
    publisher: {
      '@type': 'Organization',
      name: 'Portal Trabajo IT',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
        width: 512,
        height: 512
      }
    },
    datePublished: new Date(post.date).toISOString(),
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date(post.date).toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${resolvedParams.slug}`
    }
  };

  const isHowTo = post.title.toLowerCase().includes('cómo') || post.title.toLowerCase().includes('como');
  let howToJsonLd = null;
  if (isHowTo && headings.length > 0) {
    howToJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: post.title,
      description: post.excerpt,
      step: headings.map((h, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: h.text,
        url: `${BASE_URL}/blog/${resolvedParams.slug}#${h.id}`,
        itemListElement: [
          {
            '@type': 'HowToDirection',
            text: `Consulta los detalles sobre ${h.text} en nuestro artículo de empleo.`
          }
        ]
      }))
    };
  }

  const faqPageSchema = extractFaqsFromContent(post.content);
  const detectedTech = detectPostTechnology(resolvedParams.slug, post.title, post.content);
  const hasLearningKeywords = /\b(aprender|curso|certificaci[oó]n|formaci[oó]n|estudiar)\b/i.test(post.content);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {howToJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      )}
      {faqPageSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />
      )}

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-8 md:p-12">
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center text-gray-500 text-xs gap-x-4 gap-y-1 mt-3">
                  <div className="inline-flex flex-wrap gap-x-2 gap-y-1 items-center">
                    <time dateTime={post.date} className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true">📅</span>
                      Publicado: {new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                    {post.updatedAt && (
                      <>
                        <span className="text-gray-300">|</span>
                        <time dateTime={post.updatedAt} className="inline-flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 font-medium">
                          Actualizado: {new Date(post.updatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                      </>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true">✍️</span> Raúl M.
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true">⏱️</span>
                    {Math.max(1, Math.ceil(post.content.split(/\s+/).length / 220))} min de lectura
                  </span>
                </div>
              </header>

              {/* Cover image optimizada con priority para LCP */}
              <div className="relative w-full h-[250px] sm:h-[350px] rounded-2xl overflow-hidden mb-8 border border-gray-150/50 shadow-sm bg-gray-50 flex items-center justify-center">
                <Image 
                  src={`/blog/${resolvedParams.slug}/opengraph-image`}
                  alt={`Imagen de portada para ${post.title}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                />
              </div>

              {headings.length > 0 && (
                <div className="mb-8 p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 shadow-sm">
                  <h3 className="text-sm font-bold text-indigo-950 mb-3.5 uppercase tracking-wider flex items-center gap-2">
                    <span>📋</span> Contenido del artículo
                  </h3>
                  <ul className="space-y-2.5 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <a href={`#${h.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg mb-8">
                <Markdown content={intro} autoLink={true} isEnglish={false} />
                {restFirst && (
                  <>
                    <div className="my-8">
                      <AdBanner variant="inline" />
                    </div>
                    <Markdown content={restFirst} autoLink={true} isEnglish={false} />
                  </>
                )}
                {restSecond && (
                  <>
                    <div className="my-8">
                      <AdBanner variant="inline" />
                    </div>
                    <div className="my-8">
                      <SubscribeForm location="España" />
                    </div>
                    <Markdown content={restSecond} autoLink={true} isEnglish={false} />
                  </>
                )}
              </div>

              {/* Tarjeta de afiliado de cursos contextual (Udemy) si el post habla de aprendizaje */}
              {hasLearningKeywords && (
                <AffiliateCourseCard technology={detectedTech} />
              )}

              {/* Banner inline al final del artículo del blog */}
              <div className="my-8 border-t border-b border-gray-100 py-6">
                <AdBanner variant="inline" />
              </div>

              {relatedJobs.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">💼 Ofertas de empleo relacionadas</h3>
                  <div className="space-y-3">
                    {relatedJobs.map((job: any) => (
                      <div key={job.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-indigo-300 transition-colors flex justify-between items-center">
                        <div>
                          <Link href={`/job/${job.id}`} className="font-semibold text-indigo-900 hover:underline">
                            {job.title}
                          </Link>
                          <div className="text-xs text-gray-500 mt-1">{job.company} • {job.location}</div>
                        </div>
                        <Link href={`/job/${job.id}`} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors">
                          Ver Oferta
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <AuthorBox
                author={post.author}
                date={post.date}
                updatedAt={post.updatedAt}
                slug={resolvedParams.slug}
                readingTimeMinutes={Math.max(1, Math.ceil(post.content.split(/\s+/).length / 220))}
              />

              {/* Bloque de artículos del mismo cluster (Pillar + Cluster linking) */}
              {clusterPosts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{cluster?.emoji}</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Serie: {cluster?.topic}</p>
                      <h3 className="text-base font-bold text-gray-900">Artículos relacionados de esta serie</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {clusterPosts.map((related: any) => (
                      <Link
                        key={related.slug}
                        href={`/blog/${related.slug}`}
                        className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                      >
                        <span className="text-indigo-400 text-xl mt-0.5 flex-shrink-0">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors leading-snug">{related.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{related.excerpt}</p>
                        </div>
                        <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform text-xs flex-shrink-0 mt-1">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Bloque Multiplex de Recomendados al final del artículo */}
            <AdBanner variant="multiplex" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-6">
              <SubscribeForm location="España" />
              <PushSubscribe />
              <div className="lg:sticky lg:top-24">
                <AdBanner variant="sidebar" enableRefresh={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <StickyDesktopAd />
    </main>
  );
}
