import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import CourseAffiliate from '@/components/CourseAffiliate';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';

export const revalidate = 60;

const BASE_URL = 'https://portal-trabajo.vercel.app';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT title, company, location, description_snippet FROM jobs WHERE id = $1",
      [id]
    );

    const job = res.rows[0];
    if (!job) return { title: 'Oferta no encontrada' };

    const titulo = `${job.title} en ${job.location}`;
    const desc = `Oportunidad laboral en ${job.company}. ${job.description_snippet?.substring(0, 130) ?? ''}...`;

    return {
      title: `${titulo} | Portal Empleo`,
      description: desc,
      openGraph: {
        title: titulo,
        description: desc,
        url: `${BASE_URL}/job/${id}`,
        siteName: 'Agregador de Empleo Tech',
        locale: 'es_ES',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: titulo,
        description: desc,
      },
    };
  } catch (e) {
    return { title: 'Portal de Empleo' };
  } finally {
    client.release();
  }
}

async function getJob(id: string) {
  if (!process.env.DATABASE_URL) return null;
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM jobs WHERE id = $1", [id]);
    return res.rows[0] ?? null;
  } catch (error) {
    console.error('Error cargando oferta:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Extrae el nombre de la fuente desde description_snippet.
 * Los scrapers guardan el origen con el formato "[Fuente: X] ..."
 * Si no hay prefijo, devuelve 'Internet'.
 */
function extractSource(descriptionSnippet: string | null | undefined): string {
  if (!descriptionSnippet) return 'Internet';
  const match = descriptionSnippet.match(/^\[Fuente:\s*(.+?)\]/);
  return match ? match[1] : 'Internet';
}

function parseSalarySchema(salaryStr: string | null | undefined): any {
  if (!salaryStr) return null;
  
  // Limpiar caracteres y convertir a minúsculas
  const cleanStr = salaryStr.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
  
  // Buscar números en la cadena
  const numbers = cleanStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  
  // Intentar determinar si es anual o mensual (por defecto YEAR)
  let unitText = "YEAR";
  if (cleanStr.includes("mes") || cleanStr.includes("mensual") || (parseInt(numbers[0]) > 0 && parseInt(numbers[0]) < 5000)) {
    unitText = "MONTH";
  }
  
  const parsedNums = numbers.map(n => parseInt(n));
  
  if (parsedNums.length >= 2) {
    const minVal = Math.min(parsedNums[0], parsedNums[1]);
    const maxVal = Math.max(parsedNums[0], parsedNums[1]);
    
    if (minVal < 100 || maxVal > 1000000) return null;
    
    return {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": minVal,
        "maxValue": maxVal,
        "unitText": unitText
      }
    };
  } else {
    const val = parsedNums[0];
    if (val < 100 || val > 1000000) return null;
    
    return {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "value": val,
        "unitText": unitText
      }
    };
  }
}

function inferEmploymentTypes(text: string): string[] {
  const types: string[] = [];
  if (text.includes('media jornada') || text.includes('part-time') || text.includes('part time')) {
    types.push('PART_TIME');
  }
  if (text.includes('prácticas') || text.includes('beca') || text.includes('becario') || text.includes('internship')) {
    types.push('INTERNSHIP');
  }
  if (text.includes('autónomo') || text.includes('freelance') || text.includes('contractor')) {
    types.push('CONTRACTOR');
  }
  if (types.length === 0 || text.includes('jornada completa') || text.includes('full time') || text.includes('indefinido') || text.includes('completa')) {
    types.push('FULL_TIME');
  }
  return types;
}

export default async function JobPage({ params }: Props) {
  const resolvedParams = await params;
  const job = await getJob(resolvedParams.id);

  if (!job) {
    notFound();
  }

  const sourceLabel = extractSource(job.description_snippet);

  // Inferencia para SEO
  const textForInference = `${job.title} ${job.description_snippet || ''}`.toLowerCase();
  const isRemote = textForInference.includes('remoto') || textForInference.includes('teletrabajo') || textForInference.includes('remote');
  const employmentTypes = inferEmploymentTypes(textForInference);

  const datePosted = new Date(job.created_at);
  const validThroughDate = new Date(datePosted.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 días después

  const baseSalaryObj = parseSalarySchema(job.salary);

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_snippet || `Oferta de empleo para ${job.title} en ${job.company}`,
    datePosted: datePosted.toISOString(),
    validThrough: validThroughDate.toISOString(),
    hiringOrganization: { 
      '@type': 'Organization', 
      name: (job.company && job.company !== 'Desconocida') ? job.company : (sourceLabel !== 'Internet' ? sourceLabel : 'Portal Trabajo IT')
    },
    jobLocation: {
      '@type': 'Place',
      address: { 
        '@type': 'PostalAddress', 
        addressLocality: job.location || 'Remoto/España', 
        addressCountry: 'ES' 
      },
    },
    employmentType: employmentTypes,
  };

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'ES'
    };
  }

  if (baseSalaryObj) {
    jsonLd.baseSalary = baseSalaryObj;
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: BASE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Ofertas',
        item: `${BASE_URL}/trabajos/informatica-tecnologia`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: job.title,
        item: `${BASE_URL}/job/${job.id}`
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Ofertas', href: '/trabajos/informatica-tecnologia' },
            { label: job.title }
          ]} 
        />
        
        {/* Cabecera de navegación */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-indigo-600 hover:underline inline-flex items-center gap-2 font-medium">
            ← Volver al buscador
          </Link>

          <ShareButton title={job.title} company={job.company} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{job.title}</h1>
            <div className="flex flex-wrap gap-3 text-indigo-100 text-sm md:text-base">
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                🏢 {job.company}
              </span>
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                📍 {job.location}
              </span>
              <span className="bg-indigo-700/50 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                📅 {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del puesto</h2>
            <div className="prose max-w-none text-gray-600 mb-8 leading-relaxed">
              <p className="whitespace-pre-line">{job.description_snippet || "Ver detalles en la web original."}</p>
            </div>

            {/* Bootcamp recomendado según la tecnología de la oferta */}
            <CourseAffiliate title={job.title} />

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center mt-8">
              <p className="text-indigo-900 mb-4 text-sm font-medium">
                {/* Usamos extractSource() en lugar de job.source que no existe en la BD */}
                Esta oferta fue encontrada en <strong>{sourceLabel}</strong>
              </p>
              <a
                href={job.url_source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full md:w-auto justify-center items-center bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                👉 Aplicar en la web original
              </a>
            </div>

            {/* Anuncios Multiplex de AdSense / Udemy Fallback */}
            <AdBanner variant="multiplex" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-6 space-y-6">
              <SubscribeForm location={job.location || 'España'} />
              <AdBanner variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
