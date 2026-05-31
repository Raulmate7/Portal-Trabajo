import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, BLOG_POSTS } from '@/lib/blog';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';

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

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

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
                {post.content.split('\\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                  }
                  if (paragraph.startsWith('* ')) {
                    return <li key={idx} className="ml-4 mb-2" dangerouslySetInnerHTML={{__html: paragraph.replace('* ', '').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')}} />;
                  }
                  if (paragraph.trim() === '') return null;
                  
                  return (
                    <p key={idx} className="mb-4" dangerouslySetInnerHTML={{__html: paragraph.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')}} />
                  );
                })}
              </div>
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
