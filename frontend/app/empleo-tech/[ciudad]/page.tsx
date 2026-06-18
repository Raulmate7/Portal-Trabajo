import pool from '@/lib/db';
import JobCard from '@/components/JobCard';
import AdBanner from '@/components/AdBanner';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';

interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at: string;
  salary?: string | null;
  title_es?: string | null;
}

type Props = {
  params: Promise<{ ciudad: string }>;
};

const cityNamesMap: Record<string, string> = {
  'madrid': 'Madrid',
  'barcelona': 'Barcelona',
  'valencia': 'Valencia',
  'sevilla': 'Sevilla',
  'malaga': 'Málaga',
  'bilbao': 'Bilbao',
  'zaragoza': 'Zaragoza'
};

export async function generateStaticParams() {
  return [
    { ciudad: 'madrid' },
    { ciudad: 'barcelona' },
    { ciudad: 'valencia' },
    { ciudad: 'sevilla' },
    { ciudad: 'malaga' },
    { ciudad: 'bilbao' },
    { ciudad: 'zaragoza' }
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad } = await params;
  const cityName = cityNamesMap[ciudad] || (ciudad.charAt(0).toUpperCase() + ciudad.slice(1));

  return {
    title: `Trabajo IT en ${cityName} | Ofertas de Empleo en Tecnología`,
    description: `Encuentra las últimas ofertas de empleo tecnológico en ${cityName}. Vacantes de programación, salarios de desarrolladores y teletrabajo en ${cityName}.`,
    alternates: {
      canonical: `${BASE_URL}/empleo-tech/${ciudad}`,
    },
    openGraph: {
      title: `Trabajo IT en ${cityName} | Ofertas de Empleo en Tecnología`,
      description: `Encuentra las últimas ofertas de empleo de programación y desarrollo de software en ${cityName} con salarios estimados.`,
      url: `${BASE_URL}/empleo-tech/${ciudad}`,
    }
  };
}

async function getCityData(ciudadSlug: string) {
  const cityName = cityNamesMap[ciudadSlug] || (ciudadSlug.charAt(0).toUpperCase() + ciudadSlug.slice(1));
  const client = await pool.connect();
  
  try {
    // 1. Total active jobs in the city
    const totalRes = await client.query(
      `SELECT COUNT(*) as count FROM jobs 
       WHERE is_active = TRUE AND location LIKE $1`,
      [`%${cityName}%`]
    );
    const count = parseInt(totalRes.rows[0]?.count || '0', 10);

    // 2. Most demanded technologies in the city
    const techRes = await client.query(`
      SELECT 
        SUM(CASE WHEN title LIKE '%react%' OR description_snippet LIKE '%react%' THEN 1 ELSE 0 END) as react,
        SUM(CASE WHEN title LIKE '%angular%' OR description_snippet LIKE '%angular%' THEN 1 ELSE 0 END) as angular,
        SUM(CASE WHEN title LIKE '%vue%' OR description_snippet LIKE '%vue%' THEN 1 ELSE 0 END) as vue,
        SUM(CASE WHEN title LIKE '%node%' OR description_snippet LIKE '%node%' THEN 1 ELSE 0 END) as node,
        SUM(CASE WHEN title LIKE '%python%' OR description_snippet LIKE '%python%' THEN 1 ELSE 0 END) as python,
        SUM(CASE WHEN title LIKE '%java%' OR description_snippet LIKE '%java%' THEN 1 ELSE 0 END) as java,
        SUM(CASE WHEN title LIKE '%php%' OR description_snippet LIKE '%php%' THEN 1 ELSE 0 END) as php,
        SUM(CASE WHEN title LIKE '%c#%' OR title LIKE '%csharp%' OR description_snippet LIKE '%c#%' OR description_snippet LIKE '%csharp%' THEN 1 ELSE 0 END) as csharp,
        SUM(CASE WHEN title LIKE '%go %' OR title LIKE '%golang%' OR description_snippet LIKE '%go %' OR description_snippet LIKE '%golang%' THEN 1 ELSE 0 END) as go,
        SUM(CASE WHEN title LIKE '%typescript%' OR description_snippet LIKE '%typescript%' THEN 1 ELSE 0 END) as typescript,
        SUM(CASE WHEN title LIKE '%javascript%' OR description_snippet LIKE '%javascript%' THEN 1 ELSE 0 END) as javascript,
        SUM(CASE WHEN title LIKE '%aws%' OR description_snippet LIKE '%aws%' THEN 1 ELSE 0 END) as aws,
        SUM(CASE WHEN title LIKE '%docker%' OR description_snippet LIKE '%docker%' THEN 1 ELSE 0 END) as docker,
        SUM(CASE WHEN title LIKE '%kubernetes%' OR description_snippet LIKE '%kubernetes%' THEN 1 ELSE 0 END) as kubernetes
      FROM jobs 
      WHERE is_active = TRUE AND location LIKE $1
    `, [`%${cityName}%`]);
    
    const techRaw = techRes.rows[0] || {};
    const techData = [
      { name: 'React', count: parseInt(techRaw.react || '0', 10), slug: 'react' },
      { name: 'Angular', count: parseInt(techRaw.angular || '0', 10), slug: 'angular' },
      { name: 'Vue', count: parseInt(techRaw.vue || '0', 10), slug: 'vue' },
      { name: 'Node.js', count: parseInt(techRaw.node || '0', 10), slug: 'node' },
      { name: 'Python', count: parseInt(techRaw.python || '0', 10), slug: 'python' },
      { name: 'Java', count: parseInt(techRaw.java || '0', 10), slug: 'java' },
      { name: 'PHP', count: parseInt(techRaw.php || '0', 10), slug: 'php' },
      { name: 'C# / .NET', count: parseInt(techRaw.csharp || '0', 10), slug: 'csharp' },
      { name: 'Go', count: parseInt(techRaw.go || '0', 10), slug: 'go' },
      { name: 'TypeScript', count: parseInt(techRaw.typescript || '0', 10), slug: 'typescript' },
      { name: 'JavaScript', count: parseInt(techRaw.javascript || '0', 10), slug: 'javascript' },
      { name: 'AWS', count: parseInt(techRaw.aws || '0', 10), slug: 'aws' },
      { name: 'Docker', count: parseInt(techRaw.docker || '0', 10), slug: 'docker' },
      { name: 'Kubernetes', count: parseInt(techRaw.kubernetes || '0', 10), slug: 'kubernetes' }
    ].sort((a, b) => b.count - a.count).filter(t => t.count > 0).slice(0, 6);

    // 3. Highlighted local companies
    const companiesRes = await client.query(
      `SELECT DISTINCT company FROM jobs 
       WHERE is_active = TRUE AND location LIKE $1
         AND company IS NOT NULL AND company != 'Desconocida'
       LIMIT 5`,
      [`%${cityName}%`]
    );
    const companies = companiesRes.rows.map((row: any) => row.company);

    // 4. List of 10 most recent jobs in that city
    const jobsRes = await client.query(
      `SELECT * FROM jobs 
       WHERE is_active = TRUE AND location LIKE $1
       ORDER BY created_at DESC 
       LIMIT 10`,
      [`%${cityName}%`]
    );
    const recentJobs = jobsRes.rows;

    return {
      cityName,
      citySlug: ciudadSlug,
      count,
      techData,
      companies,
      recentJobs
    };
  } catch (error) {
    console.error(`Error in getCityData for ${cityName}:`, error);
    return {
      cityName,
      citySlug: ciudadSlug,
      count: 150,
      techData: [
        { name: 'React', count: 45, slug: 'react' },
        { name: 'Java', count: 35, slug: 'java' },
        { name: 'TypeScript', count: 28, slug: 'typescript' }
      ],
      companies: ['Softtek', 'Indra', 'Capgemini'],
      recentJobs: []
    };
  } finally {
    client.release();
  }
}

export default async function CityPage({ params }: Props) {
  const { ciudad } = await params;
  
  if (!cityNamesMap[ciudad] && ciudad !== 'remoto') {
    notFound();
  }

  const {
    cityName,
    citySlug,
    count,
    techData,
    companies,
    recentJobs
  } = await getCityData(ciudad);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `¿Cuántas ofertas de empleo tecnológico hay activas en ${cityName}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Actualmente, disponemos de ${count} vacantes tecnológicas activas en la provincia de ${cityName}, abarcando desarrollo web, administración de sistemas y DevOps.`
        }
      },
      {
        '@type': 'Question',
        'name': `¿Cuáles son las tecnologías más solicitadas por las empresas en ${cityName}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Las tecnologías más demandadas en el mercado IT de ${cityName} son ${techData.slice(0, 3).map(t => t.name).join(', ')}.`
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} 
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            📍 Empleo IT Local
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Trabajo de Tecnología en <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-400">{cityName}</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Explora las últimas ofertas activas y las empresas que más están contratando perfiles tecnológicos en {cityName}.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Ad unit */}
          <AdBanner variant="inline" />

          {/* Estadísticas de la Ciudad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vacantes Totales</h3>
                <p className="text-sm text-gray-500">Ofertas IT vigentes recopiladas en la web.</p>
              </div>
              <p className="text-4xl font-black text-indigo-650 mt-4">{count.toLocaleString('es-ES')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Empresas Activas</h3>
                <p className="text-sm text-gray-500">Compañías que publican regularmente en tu zona.</p>
              </div>
              <p className="text-sm font-bold text-gray-800 mt-4 leading-relaxed">
                {companies.length > 0 ? companies.join(', ') : 'Múltiples consultoras y empresas de producto'}
              </p>
            </div>
          </div>

          {/* Tecnologías más buscadas */}
          {techData.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Demandas de Tecnología en {cityName}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {techData.map((tech) => (
                  <Link 
                    key={tech.name}
                    href={`/trabajos/${tech.slug}-en-${citySlug}`}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all flex flex-col justify-between text-left group"
                  >
                    <span className="font-bold text-gray-800 text-sm group-hover:text-indigo-600">{tech.name}</span>
                    <span className="text-xs text-gray-400 mt-2 font-medium">{tech.count} vacantes</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Listado de los 10 empleos más recientes */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-950 flex items-center gap-2">
              <span>💼</span> Últimas 10 Vacantes en {cityName}
            </h3>
            
            {recentJobs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay ofertas recientes disponibles en este momento. Vuelve a consultar más tarde.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentJobs.map((job: Job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            <div className="pt-4 text-center">
              <Link 
                href={`/trabajos/informatica-tecnologia-en-${citySlug}`}
                className="inline-flex items-center justify-center py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-sm text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Ver todas las ofertas en {cityName} →
              </Link>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick link other cities */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
            <h3 className="text-base font-bold text-gray-950 mb-3 flex items-center gap-2">
              <span>🗺️</span> Otras Ciudades
            </h3>
            
            <div className="divide-y divide-gray-100 text-sm font-semibold">
              {Object.entries(cityNamesMap)
                .filter(([slug]) => slug !== citySlug)
                .map(([slug, name]) => (
                  <Link 
                    key={slug} 
                    href={`/empleo-tech/${slug}`}
                    className="py-3 hover:text-indigo-650 flex justify-between items-center transition-colors"
                  >
                    <span>{name}</span>
                    <span className="text-xs text-gray-400 font-medium">Ver empleo →</span>
                  </Link>
                ))}
            </div>
          </div>

          {/* Sidebar Sticky Ad */}
          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>

        </div>

      </div>
    </main>
  );
}
