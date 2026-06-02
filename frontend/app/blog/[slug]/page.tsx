import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, BLOG_POSTS } from '@/lib/blog';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import pool from '@/lib/db';

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
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    datePublished: new Date(post.date).toISOString(),
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
                {/* Parseamos básico de markdown simulado (solo saltos de línea, negritas y encabezados) */}
                {post.content.split('\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                  }
                  if (paragraph.startsWith('* ')) {
                    return <li key={idx} className="ml-4 mb-2" dangerouslySetInnerHTML={{__html: paragraph.replace('* ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />;
                  }
                  if (paragraph.trim() === '') return null;
                  
                  return (
                    <p key={idx} className="mb-4" dangerouslySetInnerHTML={{__html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
                  );
                })}
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
