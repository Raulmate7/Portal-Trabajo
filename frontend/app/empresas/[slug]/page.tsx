import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

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
    // Coincidencia flexible para slugs de empresa
    const sql = `
      SELECT * FROM jobs 
      WHERE regexp_replace(lower(company), '[^a-z0-9]+', '-', 'g') = $1 
         OR lower(company) = REPLACE($1, '-', ' ')
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
    // Verificar si es remoto
    const text = `${job.title} ${job.location} ${job.description_snippet || ''}`.toLowerCase();
    if (text.includes('remoto') || text.includes('teletrabajo') || text.includes('remote')) {
      remoteCount++;
    }

    // Calcular salario medio
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
  const remoteRatio = jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0;

  return {
    averageSalary,
    remoteRatio,
  };
}

const BASE_URL = 'https://portal-trabajo.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const jobs = await getJobsByCompany(slug, 1);
  
  if (!jobs || jobs.length === 0) {
    return {
      title: 'Empresa no encontrada | Portal Trabajo',
    };
  }

  const companyName = jobs[0].company;

  return {
    title: `Trabajar en ${companyName} | Ofertas de Empleo IT en España`,
    description: `Encuentra ofertas de trabajo activas en ${companyName}. Vacantes de programación, desarrollo de software, salarios estimados y modalidad teletrabajo.`,
    openGraph: {
      title: `Ofertas de Empleo en ${companyName} - Vacantes Recientes`,
      description: `Listado actualizado de ofertas de trabajo en ${companyName}.`,
    }
  };
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

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Empresas', href: '#' },
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

      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Empleo en {companyName}
        </h1>
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
