import pool from "@/lib/db";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdBanner from "@/components/AdBanner";
import SubscribeForm from "@/components/SubscribeForm";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 300; // Cache 5 min

export const metadata: Metadata = {
  title: 'Directorio de Empresas IT en España | Portal Trabajo',
  description: 'Explora las principales empresas que contratan programadores y profesionales de informática en España. Compara salarios medios y porcentaje de trabajo remoto.',
  alternates: {
    canonical: '/empresas',
  },
  openGraph: {
    title: 'Directorio de Empresas IT en España | Portal Trabajo',
    description: 'Explora las principales empresas que contratan programadores y profesionales de informática en España.',
    url: `${BASE_URL}/empresas`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Directorio de Empresas IT en España',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Directorio de Empresas IT en España | Portal Trabajo',
    description: 'Explora las principales empresas que contratan programadores en España.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

interface CompanyRow {
  company: string;
  job_count: number;
  salaries: (string | null)[];
  locations: (string | null)[];
}

interface CompanyItem {
  name: string;
  slug: string;
  jobCount: number;
  averageSalary: number | null;
  remoteRatio: number;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '')       // Elimina caracteres especiales
    .replace(/\-\-+/g, '-')         // Evita guiones dobles
    .replace(/^-+/, '')             // Quita guión inicial
    .replace(/-+$/, '');            // Quita guión final
}

function parseCompanyStats(salaries: (string | null)[], locations: (string | null)[]) {
  let countWithSalary = 0;
  let sumSalary = 0;
  let remoteCount = 0;

  for (const loc of locations) {
    if (loc) {
      const text = loc.toLowerCase();
      if (text.includes('remoto') || text.includes('teletrabajo') || text.includes('remote')) {
        remoteCount++;
      }
    }
  }

  for (const salary of salaries) {
    if (salary) {
      const cleanStr = salary.replace(/\./g, '').replace(/\s/g, '');
      const numbers = cleanStr.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const parsedNums = numbers.map((n: string) => parseInt(n));
        let val = 0;
        if (parsedNums.length >= 2) {
          val = (parsedNums[0] + parsedNums[1]) / 2;
        } else {
          val = parsedNums[0];
        }

        if (val > 0 && val < 5000) {
          val = val * 12; // mensual a anual
        }

        if (val >= 12000 && val <= 150000) {
          sumSalary += val;
          countWithSalary++;
        }
      }
    }
  }

  const averageSalary = countWithSalary > 0 ? Math.round(sumSalary / countWithSalary) : null;
  const remoteRatio = locations.length > 0 ? Math.round((remoteCount / locations.length) * 100) : 0;

  return {
    averageSalary,
    remoteRatio,
  };
}

async function getCompanies(): Promise<CompanyItem[]> {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT 
        company,
        COUNT(*) as job_count,
        GROUP_CONCAT(salary SEPARATOR '||') as salaries,
        GROUP_CONCAT(location SEPARATOR '||') as locations
      FROM jobs 
      WHERE is_active = TRUE AND company IS NOT NULL AND company != 'Desconocida' AND company != ''
      GROUP BY company
      ORDER BY job_count DESC
    `;
    const res = await client.query(sql);
    
    return res.rows.map((row: any) => {
      const salariesArr = Array.isArray(row.salaries) 
        ? row.salaries 
        : (typeof row.salaries === 'string' ? row.salaries.split('||') : []);
      const locationsArr = Array.isArray(row.locations) 
        ? row.locations 
        : (typeof row.locations === 'string' ? row.locations.split('||') : []);

      const { averageSalary, remoteRatio } = parseCompanyStats(salariesArr, locationsArr);
      return {
        name: row.company,
        slug: slugify(row.company),
        jobCount: Number(row.job_count),
        averageSalary,
        remoteRatio
      };
    });
  } catch (error) {
    console.error("Error al obtener las empresas:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function EmpresasDirectoryPage() {
  const companies = await getCompanies();

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Empresas' }
  ];


  
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Directorio de empresas tecnológicas en España',
    description: 'Empresas del sector IT con ofertas de empleo activas en España.',
    numberOfItems: companies.length,
    itemListElement: companies.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/empresas/${c.slug}`,
      name: c.name
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
            🏢 Directorio de Reclutadores IT
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Descubre dónde trabajar en{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              Tecnología
            </span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Analizamos y clasificamos las empresas activas en España en base a sus ofertas reales.
            Encuentra información salarial estimada, ofertas activas y tasa de teletrabajo.
          </p>
        </div>
      </div>

      {/* Banner de publicidad Inline */}
      <div className="mb-8">
        <AdBanner variant="inline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {companies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-5xl block mb-4">📭</span>
              <p className="text-gray-600 font-medium">No hay empresas registradas actualmente con ofertas activas.</p>
              <p className="text-sm text-gray-400 mt-2">Los scrapers importarán ofertas pronto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div key={company.slug} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col justify-between p-6">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight hover:text-indigo-600 transition-colors">
                        <Link href={`/empresas/${company.slug}`}>
                          {company.name}
                        </Link>
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 whitespace-nowrap">
                        {company.jobCount} {company.jobCount === 1 ? 'oferta' : 'ofertas'}
                      </span>
                    </div>

                    <div className="space-y-2.5 my-4">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>💰 Salario Medio:</span>
                        <span className="font-bold text-gray-800">
                          {company.averageSalary ? `${company.averageSalary.toLocaleString('es-ES')}€` : 'N/D'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>🌐 Teletrabajo:</span>
                        <span className="font-bold text-gray-800">
                          {company.remoteRatio}%
                        </span>
                      </div>
                      
                      {/* Barra de teletrabajo visual */}
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all" 
                          style={{ width: `${company.remoteRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/empresas/${company.slug}`} 
                    className="mt-2 block w-full text-center bg-gray-900 hover:bg-black text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Ver Empleos
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <SubscribeForm location="Empresas en España" />
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
