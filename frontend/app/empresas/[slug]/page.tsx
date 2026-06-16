import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareButton from "@/components/ShareButton";
import { BASE_URL } from "@/lib/constants";
import { getJobSlug } from "@/lib/slug";

export const revalidate = 60;

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
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getJobsByCompany(companySlug: string, page: number = 1) {
  const limit = 50;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE REGEXP_REPLACE(LOWER(company), '[^a-z0-9]+', '-') = $1 
         OR LOWER(company) = REPLACE($1, '-', ' ')
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const res = await client.query(sql, [companySlug, limit, offset]);
    return res.rows as Job[];
  } catch (error) {
    console.error("Error cargando ofertas de la empresa:", error);
    return [];
  } finally {
    client.release();
  }
}

function calculateCompanyStats(jobs: Job[]) {
  let countWithSalary = 0;
  let sumSalary = 0;
  let remoteCount = 0;

  for (const job of jobs) {
    const text = `${job.title} ${job.location} ${job.description_snippet || ''}`.toLowerCase();
    if (text.includes('remoto') || text.includes('teletrabajo') || text.includes('remote')) {
      remoteCount++;
    }

    if (job.salary) {
      const cleanStr = job.salary.replace(/\./g, '').replace(/\s/g, '');
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
          val = val * 12;
        }

        if (val >= 12000 && val <= 150000) {
          sumSalary += val;
          countWithSalary++;
        }
      }
    }
  }

  const averageSalary = countWithSalary > 0 ? Math.round(sumSalary / countWithSalary) : null;
  const remoteRatio = jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0;

  return {
    averageSalary,
    remoteRatio,
  };
}

function detectCompanyTechStack(jobs: Job[]): string[] {
  const techCount: Record<string, number> = {};
  const keywords = [
    { name: 'React', label: 'React' },
    { name: 'Angular', label: 'Angular' },
    { name: 'Vue', label: 'Vue' },
    { name: 'Node', label: 'Node.js' },
    { name: 'Python', label: 'Python' },
    { name: 'Java', label: 'Java' },
    { name: 'TypeScript', label: 'TypeScript' },
    { name: 'JavaScript', label: 'JavaScript' },
    { name: 'AWS', label: 'AWS' },
    { name: 'Docker', label: 'Docker' },
    { name: 'Kubernetes', label: 'Kubernetes' },
    { name: 'Next.js', label: 'Next.js' },
    { name: 'Nextjs', label: 'Next.js' },
    { name: 'Flutter', label: 'Flutter' },
    { name: 'SQL', label: 'SQL' },
    { name: 'PHP', label: 'PHP' },
    { name: 'C#', label: 'C# / .NET' },
    { name: 'Go ', label: 'Go' },
    { name: 'Golang', label: 'Go' },
    { name: 'Symfony', label: 'Symfony' },
    { name: 'Laravel', label: 'Laravel' },
    { name: 'Spring Boot', label: 'Spring Boot' },
    { name: 'Spring', label: 'Spring Boot' },
  ];

  for (const job of jobs) {
    const text = `${job.title} ${job.description_snippet || ''}`.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw.name.toLowerCase())) {
        techCount[kw.label] = (techCount[kw.label] || 0) + 1;
      }
    }
  }

  return Object.entries(techCount)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 4);
}

function generateCompanyEditorial(companyName: string, stats: any, techStack: string[]): string {
  const remoteText = stats.remoteRatio > 50 
    ? 'un fuerte enfoque en el trabajo en remoto (teletrabajo)' 
    : (stats.remoteRatio > 15 
      ? 'un modelo híbrido o flexible que combina presencialidad y teletrabajo' 
      : 'preferencia por puestos de trabajo presenciales o de oficina en la mayoría de sus ofertas');

  const salaryText = stats.averageSalary 
    ? `el salario medio estimado de sus posiciones se sitúa en los ${stats.averageSalary.toLocaleString('es-ES')}€ brutos anuales, lo que representa una retribución competitiva para el sector` 
    : 'actualmente no contamos con datos salariales de referencia suficientes para esta empresa en nuestra base de datos local';

  const techText = techStack.length > 0 
    ? `suelen buscar profesionales con dominio de tecnologías como ${techStack.join(', ')}` 
    : 'ofrece oportunidades transversales en distintas tecnologías y áreas de ingeniería';

  return `Trabajar en ${companyName} representa una opción sólida en el mercado tecnológico actual. Según las vacantes analizadas recientemente en nuestra plataforma, la organización destaca por ${remoteText}. En términos de compensación, ${salaryText}. Sus procesos de contratación e ingeniería ${techText}. Esta información se analiza y actualiza regularmente para reflejar la realidad del reclutamiento de la compañía.`;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;

  const jobs = await getJobsByCompany(slug, page);
  
  if (!jobs || jobs.length === 0) {
    return {
      title: 'Empresa no encontrada | Portal Trabajo',
    };
  }

  const companyName = jobs[0].company;
  let titleSeo = `Trabajar en ${companyName} | Ofertas de Empleo IT en España`;
  if (isPaged) {
    titleSeo += ` - Página ${page}`;
  }

  const metadata: Metadata = {
    title: titleSeo,
    description: `Encuentra ofertas de trabajo activas en ${companyName}. Vacantes de programación, desarrollo de software, salarios estimados y modalidad teletrabajo.${isPaged ? ` (Página ${page})` : ''}`,
    alternates: {
      canonical: `${BASE_URL}/empresas/${slug}`,
    },
    openGraph: {
      title: `Ofertas de Empleo en ${companyName} - Vacantes Recientes${isPaged ? ` (Página ${page})` : ''}`,
      description: `Listado actualizado de ofertas de trabajo en ${companyName}.`,
      url: `${BASE_URL}/empresas/${slug}`,
      images: [
        {
          url: `${BASE_URL}/empresas/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Ofertas de empleo en ${companyName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Ofertas de Empleo en ${companyName} - Vacantes Recientes${isPaged ? ` (Página ${page})` : ''}`,
      description: `Listado actualizado de ofertas de trabajo en ${companyName}.`,
      images: [`${BASE_URL}/empresas/${slug}/opengraph-image`],
    },
  };

  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  const jobs = await getJobsByCompany(slug, validPage);

  if (!jobs || jobs.length === 0) {
    notFound();
  }

  const companyName = jobs[0].company;
  const stats = calculateCompanyStats(jobs);
  const techStack = detectCompanyTechStack(jobs);
  const editorialText = generateCompanyEditorial(companyName, stats, techStack);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Empresas', href: '/empresas' },
    { label: companyName }
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      item: item.href !== '#' ? `${BASE_URL}${item.href}` : undefined
    }))
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: companyName,
    url: `${BASE_URL}/empresas/${slug}`,
    logo: `${BASE_URL}/og-image.png`,
    description: `Ofertas de trabajo del sector tecnológico en la empresa ${companyName}.`
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Ofertas de empleo IT en ${companyName}`,
    description: `Últimas vacantes de empleo tecnológicas en ${companyName}.`,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/job/${getJobSlug(job)}`,
      name: job.title
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Empleo en {companyName}
          </h1>
          <ShareButton title={`Empleo en ${companyName}`} company={companyName} />
        </div>
        <Link href="/" className="text-indigo-600 hover:underline text-sm font-medium">
          ← Buscar otras ofertas
        </Link>
      </div>
      
      {/* Tarjeta de Estadísticas de la Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="md:col-span-1 flex flex-col justify-center">
          <p className="text-gray-700 leading-relaxed m-0 text-sm">
            Listado completo de vacantes tecnológicas para incorporarte a <strong>{companyName}</strong>. 
            Actualmente contamos con <strong>{jobs.length} ofertas activas</strong> recopiladas en la web.
          </p>
        </div>
        
        <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider m-0 mb-1">Salario Medio Estimado</h3>
          <p className="text-3xl font-extrabold text-indigo-700 m-0">
            {stats.averageSalary ? `${stats.averageSalary.toLocaleString('es-ES')}€` : 'N/A'}
          </p>
          <span className="text-[10px] text-gray-500 mt-1">Basado en las ofertas publicadas con sueldo</span>
        </div>

        <div className="bg-purple-50/70 p-5 rounded-xl border border-purple-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider m-0 mb-1">Tasa de Teletrabajo</h3>
          <p className="text-3xl font-extrabold text-purple-700 m-0">
            {stats.remoteRatio}%
          </p>
          <span className="text-[10px] text-gray-500 mt-1">Porcentaje de ofertas 100% en remoto</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          
          {/* Sección Editorial Dinámica (Oportunidad 2.4) */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📝</span> Sobre el Reclutamiento en {companyName}
            </h2>
            <p className="text-sm text-gray-650 leading-relaxed mb-6">
              {editorialText}
            </p>
            {techStack.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Tecnologías más demandadas en sus ofertas:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => (
                    <span 
                      key={tech} 
                      className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg border border-indigo-100/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.flatMap((job, index) => {
              const card = <JobCard key={job.id} job={job} />;
              if (index === 4) {
                return [
                  <div key={`ad-inline-${job.id}`} className="col-span-full my-2">
                    <AdBanner variant="inline" />
                  </div>,
                  card
                ];
              }
              return [card];
            })}
            
            {/* Controles de Paginación */}
            <div className="col-span-full flex justify-between items-center pt-6">
              {validPage > 1 ? (
                <Link
                  href={`/empresas/${slug}?page=${validPage - 1}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Anterior
                </Link>
              ) : (
                <div />
              )}
              <span className="text-sm text-gray-600">Página {validPage}</span>
              {jobs.length === 50 ? (
                <Link
                  href={`/empresas/${slug}?page=${validPage + 1}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Siguiente →
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <SubscribeForm location={companyName} />
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
