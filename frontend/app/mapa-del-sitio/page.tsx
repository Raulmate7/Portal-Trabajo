import pool from '@/lib/db';
import Link from 'next/link';
import { Metadata } from 'next';
import { getBlogPosts } from '@/lib/blog';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 3600; // Cache cache for 1 hour

export const metadata: Metadata = {
  title: 'Mapa del Sitio HTML - Directorio de Empleo IT | Portal Trabajo',
  description: 'Mapa del sitio web para navegar jerárquicamente por todas las ofertas de empleo, tecnologías, artículos de blog y empresas de tecnología en España.',
  alternates: {
    canonical: `${BASE_URL}/mapa-del-sitio`,
  }
};

const SECTORS = [
  { name: 'Informática y Tecnología (General)', slug: 'informatica-tecnologia' },
  { name: 'Desarrollo Frontend', slug: 'frontend' },
  { name: 'Desarrollo Backend', slug: 'backend' },
  { name: 'Sistemas & Cloud', slug: 'cloud' },
  { name: 'Datos & Inteligencia Artificial', slug: 'data' },
  { name: 'Desarrollo Mobile', slug: 'mobile' },
  { name: 'Trabajo Remoto IT', slug: 'informatica-tecnologia-remoto' }
];

const POPULAR_TECHS = [
  { name: 'React', slug: 'react' },
  { name: 'Angular', slug: 'angular' },
  { name: 'Vue.js', slug: 'vue' },
  { name: 'Node.js', slug: 'node' },
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'Python', slug: 'python' },
  { name: 'Java', slug: 'java' },
  { name: 'PHP', slug: 'php' },
  { name: 'C# / .NET', slug: 'csharp' },
  { name: 'Go', slug: 'go' },
  { name: 'Ruby', slug: 'ruby' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'AWS (Amazon Web Services)', slug: 'aws' },
  { name: 'Docker', slug: 'docker' },
  { name: 'Kubernetes', slug: 'kubernetes' },
  { name: 'Flutter', slug: 'flutter' },
  { name: 'Kotlin', slug: 'kotlin' },
  { name: 'Swift', slug: 'swift' }
];

const PAGES_LEGAL = [
  { name: 'Inicio / Buscador', href: '/' },
  { name: 'Calculadora de Salarios IT', href: '/salarios' },
  { name: 'Directorio de Empresas', href: '/empresas' },
  { name: 'Blog de Consejos Profesionales', href: '/blog' },
  { name: 'Talento Premium', href: '/talento-premium' },
  { name: 'Publicar Oferta de Empleo', href: '/publicar-oferta' },
  { name: 'Aviso Legal', href: '/aviso-legal' },
  { name: 'Política de Privacidad', href: '/politica-de-privacidad' }
];

async function getTopCompanies() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT company, COUNT(*) as count 
      FROM jobs 
      WHERE is_active = TRUE AND company != 'Desconocida' AND company IS NOT NULL
      GROUP BY company 
      ORDER BY count DESC 
      LIMIT 20
    `);
    return res.rows.map((row: any) => ({
      name: row.company,
      slug: row.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }));
  } catch (error) {
    console.error("Error loading top companies for sitemap:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function SitemapPage() {
  const [blogPosts, topCompanies] = await Promise.all([
    getBlogPosts(),
    getTopCompanies()
  ]);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Mapa del Sitio' }
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href ? `${BASE_URL}${item.href}` : undefined
    }))
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />

      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="mb-10 text-center md:text-left">
          <h1 id="sitemap-title" className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Mapa del Sitio
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl leading-relaxed m-0">
            Navega de forma rápida y estructurada por todas las secciones, ofertas de empleo por tecnología, guías profesionales y empresas tecnológicas de nuestro portal.
          </p>
        </div>

        {/* Rejilla de Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          
          {/* Columna 1: Ofertas y Sectores */}
          <section id="sitemap-sectors-techs" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>💼</span> Sectores y Tecnologías
            </h2>
            <div className="space-y-6 flex-grow">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Sectores</h3>
                <ul className="space-y-2">
                  {SECTORS.map((sector) => (
                    <li key={sector.slug}>
                      <Link 
                        href={`/trabajos/${sector.slug}`} 
                        className="text-sm text-indigo-650 hover:text-indigo-850 hover:underline font-semibold"
                      >
                        {sector.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Tecnologías Populares</h3>
                <ul className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {POPULAR_TECHS.map((tech) => (
                    <li key={tech.slug}>
                      <Link 
                        href={`/trabajos/${tech.slug}`} 
                        className="text-sm text-gray-700 hover:text-indigo-600 hover:underline transition-colors"
                      >
                        Empleo de {tech.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Columna 2: Guías del Blog */}
          <section id="sitemap-blog" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>📖</span> Consejos y Guías (Blog)
            </h2>
            <ul className="space-y-3 flex-grow overflow-y-auto pr-2 max-h-[500px] custom-scrollbar">
              {blogPosts.map((post) => (
                <li key={post.slug} className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <Link 
                    href={`/blog/${post.slug}`} 
                    className="text-sm text-gray-700 hover:text-indigo-600 hover:underline transition-colors leading-relaxed"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Columna 3: Empresas Principales */}
          <section id="sitemap-companies" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>🏢</span> Empresas Destacadas
            </h2>
            <ul className="space-y-2 flex-grow overflow-y-auto pr-2 max-h-[500px] custom-scrollbar">
              {topCompanies.length > 0 ? (
                topCompanies.map((company: any) => (
                  <li key={company.slug}>
                    <Link 
                      href={`/empresas/${company.slug}`} 
                      className="text-sm text-gray-700 hover:text-indigo-600 hover:underline transition-colors"
                    >
                      Trabajo en {company.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-400 italic">No hay empresas disponibles en este momento.</li>
              )}
            </ul>
          </section>

          {/* Columna 4: Páginas y Enlaces Legales */}
          <section id="sitemap-pages-legal" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>🔗</span> Enlaces Corporativos
            </h2>
            <ul className="space-y-3 flex-grow">
              {PAGES_LEGAL.map((page) => (
                <li key={page.href}>
                  <Link 
                    href={page.href} 
                    className="text-sm text-gray-700 hover:text-indigo-600 hover:underline transition-colors font-medium"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

        </div>

        {/* Footer del Mapa */}
        <div className="mt-12 text-center border-t border-gray-200 pt-6">
          <Link href="/" className="text-sm text-indigo-650 hover:text-indigo-850 font-bold hover:underline">
            &larr; Volver al Buscador de Empleo IT Principal
          </Link>
        </div>

      </div>
    </main>
  );
}
