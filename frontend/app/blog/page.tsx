import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Blog de Empleo Tech | Portal Trabajo',
  description: 'Consejos, guías salariales y recursos para encontrar trabajo como programador en España.',
  alternates: {
    canonical: '/blog',
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'Blog de Empleo Tech | Portal Trabajo',
    'description': 'Consejos, guías salariales y recursos para encontrar trabajo como programador en España.',
    'url': `${BASE_URL}/blog`,
    'blogPost': posts.map(post => ({
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.excerpt,
      'datePublished': new Date(post.date).toISOString(),
      'url': `${BASE_URL}/blog/${post.slug}`,
      'image': `${BASE_URL}/blog/${post.slug}/opengraph-image`,
      'author': {
        '@type': 'Person',
        'name': post.author
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <h1 className="text-4xl font-bold mb-4 text-gray-900">Blog de Empleo Tech</h1>
      <p className="text-xl text-gray-600 mb-12">Recursos, guías y consejos para potenciar tu carrera en tecnología.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col">
              <div className="text-sm text-indigo-600 font-semibold mb-2">{new Date(post.date).toLocaleDateString()}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-6 flex-grow">{post.excerpt}</p>
              <div className="text-indigo-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Leer artículo <span aria-hidden="true">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
