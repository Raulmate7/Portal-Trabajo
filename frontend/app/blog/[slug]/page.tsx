import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, BLOG_POSTS } from '@/lib/blog';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import pool from '@/lib/db';
import { Markdown } from '@/lib/markdown';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    return { title: 'Artículo no encontrado' };
  }

  return {
    title: `${post.title} | Blog Portal Empleo`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${resolvedParams.slug}`,
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
  return BLOG_POSTS.map((post) => ({
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

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const relatedJobs = await getRelatedJobs(resolvedParams.slug);

  const imageUrl = `${BASE_URL}/blog/${resolvedParams.slug}/opengraph-image`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
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
        url: `${BASE_URL}/favicon.ico`,
        width: 60,
        height: 60
      }
    },
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${resolvedParams.slug}`
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/blog" className="text-indigo-600 hover:underline inline-flex items-center gap-2 font-medium">
            ← Volver al blog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-8 md:p-12">
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center text-gray-500 text-sm gap-4">
                  <span>📅 {new Date(post.date).toLocaleDateString()}</span>
                  <span>✍️ {post.author}</span>
                </div>
              </header>

              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg mb-8">
                <Markdown content={post.content} />
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
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-6 space-y-6">
              <SubscribeForm location="España" />
              <AdBanner variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
