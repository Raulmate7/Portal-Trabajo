import pool from '@/lib/db';
import JobCard from '@/components/JobCard';
import SubscribeForm from '@/components/SubscribeForm';
import PushSubscribe from '@/components/PushSubscribe';
import AdBanner from '@/components/AdBanner';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';
import StickyDesktopAd from '@/components/StickyDesktopAd';

export const revalidate = 3600; // Cache ISR de 1 hora

const CITY_MAP: Record<string, string> = {
  'madrid': 'Madrid',
  'barcelona': 'Barcelona',
  'valencia': 'Valencia',
  'malaga': 'Málaga',
  'bilbao': 'Bilbao',
  'sevilla': 'Sevilla',
  'zaragoza': 'Zaragoza',
  'alicante': 'Alicante',
  'murcia': 'Murcia',
  'gijon': 'Gijón',
  'oviedo': 'Oviedo',
  'vigo': 'Vigo',
  'coruna': 'A Coruña',
  'granada': 'Granada',
  'valladolid': 'Valladolid',
  'pamplona': 'Pamplona',
  'san-sebastian': 'San Sebastián',
  'santander': 'Santander',
  'palma': 'Palma de Mallorca',
  'las-palmas': 'Las Palmas de Gran Canaria',
  'remoto': 'Remoto'
};

const TECH_MAP: Record<string, string> = {
  'react': 'React',
  'angular': 'Angular',
  'vue': 'Vue',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'php': 'PHP',
  'csharp': 'C# / .NET',
  'go': 'Go',
  'rust': 'Rust',
  'typescript': 'TypeScript',
  'javascript': 'JavaScript',
  'aws': 'AWS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'backend': 'Backend',
  'frontend': 'Frontend',
  'devops': 'DevOps',
  'data': 'Data & AI',
  'mobile': 'Mobile',
  'nextjs': 'Next.js',
  'flutter': 'Flutter',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'sql': 'SQL',
  'salesforce': 'Salesforce',
  'cybersecurity': 'Ciberseguridad',
  'ciberseguridad': 'Ciberseguridad',
  'fullstack': 'Fullstack',
  'qa-engineer': 'QA Engineer'
};

export async function generateStaticParams() {
  const cities = Object.keys(CITY_MAP);
  const techs = Object.keys(TECH_MAP);
  
  const params: { ciudad: string; tech: string }[] = [];
  for (const ciudad of cities) {
    for (const tech of techs) {
      params.push({ ciudad, tech });
    }
  }
  return params;
}

type Props = {
  params: Promise<{ ciudad: string; tech: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { ciudad, tech } = await params;
  const resolvedSearchParams = await searchParams;

  const cityName = CITY_MAP[ciudad] || ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
  const techName = TECH_MAP[tech] || tech.charAt(0).toUpperCase() + tech.slice(1);

  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const isRemote = ciudad === 'remoto';
  const locationText = isRemote 
    ? (isEnglish ? 'Remote' : 'en Remoto') 
    : (isEnglish ? `in ${cityName}` : `en ${cityName}`);

  const title = isEnglish
    ? `${techName} Jobs ${locationText} [2026] | IT Job Portal`
    : `Ofertas de Empleo de ${techName} ${locationText} [2026] | Portal Trabajo`;

  const description = isEnglish
    ? `Active ${techName} developer job vacancies ${locationText}. Compare average salaries, requirements, and hiring tech companies in ${cityName}.`
    : `Vacantes de empleo activas para desarrolladores de ${techName} ${locationText}. Compara salarios medios, requisitos y empresas contratantes en ${cityName}.`;

  const canonical = `${BASE_URL}/trabajo-${ciudad}/${tech}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'es-ES': canonical,
        'en': `${canonical}?lang=en`,
        'x-default': canonical,
      }
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Empleo de ${techName} ${locationText}`,
        },
      ],
    },
  };
}

async function getCityTechJobs(cityName: string, techName: string, isRemote: boolean, page: number = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = `
      SELECT id, title, title_es, company, location, salary, created_at, url_source, description_snippet, category, is_featured
      FROM jobs 
      WHERE is_active = TRUE 
        AND (title ILIKE $1 OR description_snippet ILIKE $1)
    `;
    const params: any[] = [`%${techName}%`];

    if (isRemote) {
      sql += ` AND (location ILIKE '%remoto%' OR location ILIKE '%teletrabajo%' OR location ILIKE '%remote%')`;
    } else {
      sql += ` AND location ILIKE $2`;
      params.push(`%${cityName}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await client.query(sql, params);
    return res.rows;
  } catch (error) {
    console.error(`Error fetching jobs for ${techName} in ${cityName}:`, error);
    return [];
  } finally {
    client.release();
  }
}

export default async function CityTechLandingPage({ params, searchParams }: Props) {
  const { ciudad, tech } = await params;
  const resolvedSearchParams = await searchParams;

  const cityName = CITY_MAP[ciudad] || ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
  const techName = TECH_MAP[tech] || tech.charAt(0).toUpperCase() + tech.slice(1);

  if (!cityName || !techName) {
    notFound();
  }

  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const isRemote = ciudad === 'remoto';

  const jobs = await getCityTechJobs(cityName, techName, isRemote, validPage);

  const queryParam = isEnglish ? '?lang=en' : '';
  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Jobs' : 'Empleo', href: `/trabajos/informatica-tecnologia${queryParam}` },
    { label: isEnglish ? `Jobs in ${cityName}` : `Empleo en ${cityName}`, href: `/trabajo-${ciudad}${queryParam}` },
    { label: `${techName}` }
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

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Ofertas de empleo de ${techName} en ${cityName}`,
    description: `Listado de vacantes tecnológicas activas para perfiles ${techName} en ${cityName}.`,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((j: any, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: j.title_es || j.title,
      url: `${BASE_URL}/job/${j.id}`
    }))
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title={`Portal Trabajo IT — Feed de ${techName} en ${cityName}`} 
        href={`${BASE_URL}/feed.xml?q=${encodeURIComponent(techName)}&location=${encodeURIComponent(cityName)}`} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            📍 {isEnglish ? `Jobs in ${cityName}` : `Ofertas en ${cityName}`} · 💻 {techName}
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            {isEnglish ? `${techName} Jobs in ${cityName}` : `Empleo de ${techName} en ${cityName}`}
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {isEnglish 
              ? `Find active ${techName} vacancies in ${cityName}. Connect with top software development teams.`
              : `Encuentra ofertas de empleo activas para desarrolladores y especialistas en ${techName} en ${cityName}.`
            }
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        
        {/* AdBanner */}
        <div className="mb-8">
          <AdBanner variant="inline" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            
            {jobs && jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                <span className="text-4xl block mb-3">🔍</span>
                <h3 className="text-lg font-bold text-gray-900">
                  {isEnglish ? `No active ${techName} offers in ${cityName} right now` : `No hay ofertas activas de ${techName} en ${cityName} en este momento`}
                </h3>
                <p className="text-xs text-gray-500 mt-2 mb-6">
                  {isEnglish ? 'Explore other related technologies or cities below:' : 'Explora otras tecnologías o ciudades relacionadas:'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link href={`/trabajos/${tech}${queryParam}`} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100">
                    Todas las ofertas de {techName} →
                  </Link>
                  <Link href={`/trabajo-${ciudad}${queryParam}`} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200">
                    Todas las ofertas en {cityName} →
                  </Link>
                </div>
              </div>
            )}

            {/* Enlaces de Interlinking de SEO */}
            <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider">
                🔗 Navegación Relacionada
              </h3>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <Link href={`/trabajos/${tech}${queryParam}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  💻 Empleo de {techName} (Nacional)
                </Link>
                <Link href={`/salarios/${tech}${queryParam}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  💰 Salario de {techName}
                </Link>
                <Link href={`/glosario/${tech}${queryParam}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  📖 Qué es {techName} (Glosario)
                </Link>
                <Link href={`/trabajo-${ciudad}${queryParam}`} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                  📍 Todo el Empleo en {cityName}
                </Link>
              </div>
            </div>

          </div>

          <aside className="lg:col-span-1 space-y-6">
            <SubscribeForm location={cityName} defaultTech={tech} />
            <PushSubscribe />
            <div className="lg:sticky lg:top-24">
              <AdBanner variant="sidebar" />
            </div>
          </aside>
        </div>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
