import pool from '@/lib/db';
import Link from 'next/link';
import { Metadata } from 'next';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';
import { slugify } from '@/lib/slug';
import StickyDesktopAd from '@/components/StickyDesktopAd';

export const revalidate = 3600; // ISR cada 1 hora

export const metadata: Metadata = {
  title: 'Empresas que Contratan en Remoto [2026] | Ranking Teletrabajo IT',
  description: 'Descubre las empresas tecnológicas que ofrecen más vacantes 100% remoto y teletrabajo en España. Ranking con salarios medios, stacks técnicos y ofertas activas.',
  alternates: {
    canonical: `${BASE_URL}/empresas-remotas`,
  },
  openGraph: {
    title: 'Empresas que Contratan en Remoto [2026] | Ranking Teletrabajo IT',
    description: 'Ranking actualizado de empresas IT que contratan programadores en remoto con salarios medios y vacantes activas en España.',
    url: `${BASE_URL}/empresas-remotas`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Empresas que contratan en remoto — Portal Trabajo IT',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empresas que Contratan en Remoto | Ranking Teletrabajo IT',
    description: 'Ranking de empresas que contratan programadores en remoto con mejores sueldos.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

interface RemoteCompany {
  name: string;
  slug: string;
  remoteCount: number;
  averageSalary: number | null;
  topTechs: string[];
}

async function getRemoteCompanies(): Promise<RemoteCompany[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT company, title, description_snippet, salary 
      FROM jobs 
      WHERE is_active = TRUE 
        AND company IS NOT NULL 
        AND company != 'Desconocida'
        AND (location LIKE '%remoto%' OR location LIKE '%teletrabajo%' OR location LIKE '%remote%')
    `);

    const companyData: Record<string, { count: number; salaries: number[]; textConcat: string }> = {};

    for (const row of res.rows) {
      const company = row.company.trim();
      if (!companyData[company]) {
        companyData[company] = { count: 0, salaries: [], textConcat: '' };
      }
      companyData[company].count++;
      companyData[company].textConcat += ` ${row.title} ${row.description_snippet || ''}`;

      if (row.salary) {
        const cleanStr = row.salary.replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
        const numbers = cleanStr.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length > 0) {
          const parsedNums = numbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n));
          let val = 0;
          if (parsedNums.length >= 2) {
            val = (parsedNums[0] + parsedNums[1]) / 2;
          } else if (parsedNums.length === 1) {
            val = parsedNums[0];
          }
          if (val > 0 && val < 5000) val = val * 12;
          if (val >= 15000 && val <= 150000) {
            companyData[company].salaries.push(val);
          }
        }
      }
    }

    const techKeywords = ['React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'Go', 'PHP', 'Flutter'];

    const sortedCompanies = Object.entries(companyData)
      .map(([name, data]) => {
        const slug = slugify(name);
        const averageSalary = data.salaries.length >= 2
          ? Math.round(data.salaries.reduce((sum, s) => sum + s, 0) / data.salaries.length)
          : null;

        const textLower = data.textConcat.toLowerCase();
        const topTechs = techKeywords
          .filter(tech => textLower.includes(tech.toLowerCase()))
          .slice(0, 3);

        return {
          name,
          slug,
          remoteCount: data.count,
          averageSalary,
          topTechs,
        };
      })
      .sort((a, b) => b.remoteCount - a.remoteCount)
      .slice(0, 30);

    return sortedCompanies;
  } catch (error) {
    console.error('Error fetching remote companies:', error);
    return [];
  } finally {
    client.release();
  }
}

export default async function RemoteCompaniesPage() {
  const companies = await getRemoteCompanies();
  const totalRemoteOffers = companies.reduce((acc, c) => acc + c.remoteCount, 0);

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Empresas', href: '/empresas' },
    { label: 'Empresas en Remoto' }
  ];

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ranking de Empresas que Contratan en Remoto en España',
    description: 'Directorio de empresas de desarrollo de software con vacantes 100% en remoto.',
    numberOfItems: companies.length,
    itemListElement: companies.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.name,
      url: `${BASE_URL}/empresas/${c.slug}`
    }))
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': '¿Qué empresas ofrecen más trabajo en remoto en el sector IT en España?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Actualmente, empresas como ${companies.slice(0, 4).map(c => c.name).join(', ')} lideran la publicación de ofertas 100% teletrabajo en nuestro portal.`
        }
      },
      {
        '@type': 'Question',
        'name': '¿Cuál es el salario medio de los puestos en remoto?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'El salario medio para vacantes de desarrollo de software en remoto en España oscila entre los 38.000€ y 65.000€ brutos anuales según la experiencia y stack técnico.'
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🏠 100% Teletrabajo & Remoto
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Empresas que Contratan en Remoto
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Directorio con las organizaciones tecnológicas que apuestan por la flexibilidad laboral y trabajo desde cualquier lugar.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Banner ad */}
        <div className="mb-8">
          <AdBanner variant="inline" />
        </div>

        {/* Resumen de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Empresas en Remoto</span>
            <p className="text-3xl font-black text-indigo-900">{companies.length}</p>
            <span className="text-xs text-gray-500 mt-1 block">Empresas analizadas activas</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ofertas 100% Remoto</span>
            <p className="text-3xl font-black text-emerald-600">{totalRemoteOffers}</p>
            <span className="text-xs text-gray-500 mt-1 block">Vacantes disponibles en tiempo real</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Salario Medio Estimado</span>
            <p className="text-3xl font-black text-purple-700">44.500 €</p>
            <span className="text-xs text-gray-500 mt-1 block">Promedio para perfiles en remoto</span>
          </div>
        </div>

        {/* Lista de Empresas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <span>🏆</span> Ranking de Contratación Teletrabajo
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {companies.map((company, index) => (
              <div 
                key={company.slug}
                className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm shrink-0">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">
                      <Link href={`/empresas/${company.slug}`} className="hover:text-indigo-600 transition-colors">
                        {company.name}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">
                        {company.remoteCount} {company.remoteCount === 1 ? 'oferta en remoto' : 'ofertas en remoto'}
                      </span>
                      {company.averageSalary && (
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                          💰 ~{company.averageSalary.toLocaleString('es-ES')} €/año
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  {company.topTechs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {company.topTechs.map(tech => (
                        <span key={tech} className="text-[11px] font-semibold bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/40">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link 
                    href={`/empresas/${company.slug}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 text-center w-full sm:w-auto"
                  >
                    Ver Ofertas →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AdBanner inferior */}
        <div className="mt-12">
          <AdBanner variant="inline" />
        </div>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
