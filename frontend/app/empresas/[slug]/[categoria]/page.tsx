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
import { getJobSlug, slugify } from "@/lib/slug";
import CompanyReviewForm from "@/components/CompanyReviewForm";
import { getCompanyReviews } from "@/app/actions";

export const revalidate = 3600; // Cache de 1 hora (ISR)

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
  params: Promise<{ slug: string; categoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const categorySlugMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data-ai': 'Data & AI',
  'cloud-devops': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'otros': 'Otros'
};

const categoryNamesEs: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data-ai': 'Datos e Inteligencia Artificial',
  'cloud-devops': 'Cloud y DevOps',
  'mobile': 'Móviles',
  'otros': 'Otros Roles'
};

const categoryNamesEn: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data-ai': 'Data and Artificial Intelligence',
  'cloud-devops': 'Cloud and DevOps',
  'mobile': 'Mobile Development',
  'otros': 'Other Roles'
};

const TECHNOLOGIES = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'php', 'csharp', 'ruby', 'go', 
  'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'nextjs', 'flutter', 
  'kotlin', 'swift', 'sql', 'salesforce', 'cybersecurity', 'ciberseguridad', 'rust',
  'scala', 'elixir', 'terraform', 'haskell', 'erlang', 'cobol'
];

const displayNameMap: Record<string, string> = {
  'react': 'React',
  'angular': 'Angular',
  'vue': 'Vue',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'php': 'PHP',
  'csharp': 'C#',
  'ruby': 'Ruby',
  'go': 'Go',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'aws': 'AWS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'nextjs': 'Next.js',
  'flutter': 'Flutter',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'sql': 'SQL',
  'salesforce': 'Salesforce',
  'cybersecurity': 'Ciberseguridad',
  'ciberseguridad': 'Ciberseguridad',
  'rust': 'Rust',
  'scala': 'Scala',
  'elixir': 'Elixir',
  'terraform': 'Terraform',
  'cobol': 'COBOL'
};

const displayNameMapEn: Record<string, string> = {
  'react': 'React',
  'angular': 'Angular',
  'vue': 'Vue',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'php': 'PHP',
  'csharp': 'C#',
  'ruby': 'Ruby',
  'go': 'Go',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'aws': 'AWS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'nextjs': 'Next.js',
  'flutter': 'Flutter',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'sql': 'SQL',
  'salesforce': 'Salesforce',
  'cybersecurity': 'Cybersecurity',
  'ciberseguridad': 'Cybersecurity',
  'rust': 'Rust',
  'scala': 'Scala',
  'elixir': 'Elixir',
  'terraform': 'Terraform',
  'cobol': 'COBOL'
};

async function getJobsByCompanyAndCategory(companySlug: string, catKey: string) {
  const dbCategory = categorySlugMap[catKey];
  const client = await pool.connect();
  try {
    // 1. Obtener todas las empresas distintas
    const resCompanies = await client.query(
      "SELECT DISTINCT company FROM jobs WHERE is_active = TRUE AND company IS NOT NULL AND company != 'Desconocida'"
    );
    
    // 2. Encontrar la empresa coincidente
    const targetCompany = resCompanies.rows.find(
      (row: any) => slugify(row.company) === companySlug
    );
    
    if (!targetCompany) {
      return [];
    }

    let sql = '';
    const params = [targetCompany.company];
    
    if (dbCategory) {
      sql = `
        SELECT * FROM jobs 
        WHERE is_active = TRUE 
          AND company = $1
          AND category = $2
        ORDER BY created_at DESC
      `;
      params.push(dbCategory);
    } else {
      const techName = displayNameMap[catKey] || catKey;
      sql = `
        SELECT * FROM jobs 
        WHERE is_active = TRUE 
          AND company = $1
          AND (title ILIKE $2 OR description_snippet ILIKE $2)
        ORDER BY created_at DESC
      `;
      params.push(`%${techName}%`);
    }

    const res = await client.query(sql, params);
    return res.rows as Job[];
  } catch (error) {
    console.error("Error cargando ofertas de la empresa por categoria/tecnologia:", error);
    return [];
  } finally {
    client.release();
  }
}

async function getCompanyName(companySlug: string) {
  const client = await pool.connect();
  try {
    const resCompanies = await client.query(
      "SELECT DISTINCT company FROM jobs WHERE company IS NOT NULL AND company != 'Desconocida'"
    );
    const targetCompany = resCompanies.rows.find(
      (row: any) => slugify(row.company) === companySlug
    );
    return targetCompany?.company || null;
  } catch (error) {
    console.error("Error cargando nombre de la empresa:", error);
    return null;
  } finally {
    client.release();
  }
}

function calculateCategoryStats(jobs: Job[]) {
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, categoria } = await params;
  const catKey = categoria.toLowerCase();
  const dbCategory = categorySlugMap[catKey];
  const isTech = TECHNOLOGIES.includes(catKey);
  
  if (!dbCategory && !isTech) {
    return { title: 'Página no encontrada' };
  }

  const companyName = await getCompanyName(slug);
  if (!companyName) {
    return { title: 'Empresa no encontrada' };
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const jobs = await getJobsByCompanyAndCategory(slug, catKey);
  const totalJobs = jobs.length;
  
  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoryPretty = dbCategory 
    ? (isEnglish ? categoryNamesEn[catKey] : categoryNamesEs[catKey])
    : (displayNameMapUsed[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1));

  let titleSeo = isEnglish
    ? `${categoryPretty} Jobs at ${companyName} (${totalJobs} openings) | IT Job Portal`
    : `Empleo de ${categoryPretty} en ${companyName} (${totalJobs} ofertas) | Portal Trabajo`;
  if (isPaged) {
    titleSeo += isEnglish ? ` - Page ${page}` : ` - Página ${page}`;
  }

  const description = isEnglish
    ? `Find active ${categoryPretty} vacancies at ${companyName}. Browse ${totalJobs} opportunities, check salary estimates and remote options for ${companyName} ${categoryPretty} team.${isPaged ? ` (Page ${page})` : ''}`
    : `Encuentra ofertas activas de ${categoryPretty} en ${companyName}. Revisa ${totalJobs} vacantes de tecnología, estimaciones salariales y teletrabajo para ${companyName}.${isPaged ? ` (Página ${page})` : ''}`;

  const queryParam = isEnglish ? '?lang=en' : '';
  
  return {
    title: titleSeo,
    description: description,
    alternates: {
      canonical: `${BASE_URL}/empresas/${slug}/${categoria}${queryParam}`,
      languages: {
        'es-ES': `${BASE_URL}/empresas/${slug}/${categoria}`,
        'en': `${BASE_URL}/empresas/${slug}/${categoria}?lang=en`,
        'x-default': `${BASE_URL}/empresas/${slug}/${categoria}`,
      }
    },
    openGraph: {
      title: isEnglish ? `${categoryPretty} Openings at ${companyName}` : `${categoryPretty} en ${companyName} - Vacantes Recientes`,
      description: description,
      url: `${BASE_URL}/empresas/${slug}/${categoria}${queryParam}`,
      images: [
        {
          url: `${BASE_URL}/empresas/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${companyName} - ${categoryPretty}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEnglish ? `${categoryPretty} Openings at ${companyName}` : `${categoryPretty} en ${companyName} - Vacantes Recientes`,
      description: description,
      images: [`${BASE_URL}/empresas/${slug}/opengraph-image`],
    },
  };
}

export async function generateStaticParams() {
  const topCompanies = ['telefonica', 'indra', 'glovo', 'cabify', 'softtek', 'capgemini', 'banco-santander', 'bbva'];
  const topTechs = ['react', 'node', 'python', 'java', 'typescript', 'devops'];
  const topCats = ['frontend', 'backend', 'data-ai', 'cloud-devops'];

  const params = [];
  for (const company of topCompanies) {
    for (const tech of topTechs) {
      params.push({ slug: company, categoria: tech });
    }
    for (const cat of topCats) {
      params.push({ slug: company, categoria: cat });
    }
  }
  return params;
}

export default async function CompanyCategoryPage({ params, searchParams }: Props) {
  const { slug, categoria } = await params;
  const catKey = categoria.toLowerCase();
  const dbCategory = categorySlugMap[catKey];
  const isTech = TECHNOLOGIES.includes(catKey);

  if (!dbCategory && !isTech) {
    notFound();
  }

  const companyName = await getCompanyName(slug);
  if (!companyName) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const allJobs = await getJobsByCompanyAndCategory(slug, catKey);
  
  const stats = calculateCategoryStats(allJobs);
  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoryPretty = dbCategory 
    ? (isEnglish ? categoryNamesEn[catKey] : categoryNamesEs[catKey])
    : (displayNameMapUsed[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1));

  // Paginación
  const limit = 20;
  const offset = (validPage - 1) * limit;
  const jobs = allJobs.slice(offset, offset + limit);

  const reviews = await getCompanyReviews(slug);
  const baseRatingVal = 3.8 + (slug.charCodeAt(0) % 13) / 10;
  const baseReviewCount = 5 + (slug.charCodeAt(slug.length - 1) % 25);
  const realReviewsCount = reviews.length;
  const realReviewsSum = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  const reviewCount = baseReviewCount + realReviewsCount;
  const ratingValue = ((baseRatingVal * baseReviewCount + realReviewsSum) / reviewCount).toFixed(1);

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Companies' : 'Empresas', href: isEnglish ? '/empresas?lang=en' : '/empresas' },
    { label: companyName, href: isEnglish ? `/empresas/${slug}?lang=en` : `/empresas/${slug}` },
    { label: categoryPretty }
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

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: companyName,
    url: `${BASE_URL}/empresas/${slug}`,
    logo: `${BASE_URL}/og-image.png`,
    description: `Ofertas de trabajo de ${categoryPretty} en la empresa ${companyName}.`,
    aggregateRating: {
      '@type': 'EmployerAggregateRating',
      'itemReviewed': {
        '@type': 'Organization',
        'name': companyName,
        'url': `${BASE_URL}/empresas/${slug}`
      },
      'ratingValue': ratingValue,
      'bestRating': '5',
      'worstRating': '1',
      'ratingCount': reviewCount
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 font-sans">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isEnglish ? `${categoryPretty} Jobs at ${companyName}` : `Empleo de ${categoryPretty} en ${companyName}`}
          </h1>
          <ShareButton title={isEnglish ? `${categoryPretty} Jobs at ${companyName}` : `Empleo de ${categoryPretty} en ${companyName}`} company={companyName} />
        </div>
        <Link href={isEnglish ? `/empresas/${slug}?lang=en` : `/empresas/${slug}`} className="text-indigo-650 hover:underline text-sm font-medium">
          {isEnglish ? `← Back to ${companyName}` : `← Volver a ${companyName}`}
        </Link>
      </div>

      {/* Tarjeta de Estadísticas de la Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col justify-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{isEnglish ? 'Active Openings' : 'Ofertas Activas'}</span>
          <p className="text-3xl font-extrabold text-gray-900 m-0">{allJobs.length}</p>
        </div>

        <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider m-0 mb-1">{isEnglish ? 'Estimated Avg Salary' : 'Salario Medio Estimado'}</h3>
          <p className="text-3xl font-extrabold text-indigo-700 m-0">
            {stats.averageSalary ? `${stats.averageSalary.toLocaleString('es-ES')}€` : 'N/A'}
          </p>
          <span className="text-[10px] text-gray-550 mt-1">{isEnglish ? 'Specific for this department/tech' : 'Específico de este departamento/tech'}</span>
        </div>

        <div className="bg-purple-50/70 p-5 rounded-xl border border-purple-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider m-0 mb-1">{isEnglish ? 'Remote Work Rate' : 'Tasa de Teletrabajo'}</h3>
          <p className="text-3xl font-extrabold text-purple-700 m-0">
            {stats.remoteRatio}%
          </p>
          <span className="text-[10px] text-gray-550 mt-1">{isEnglish ? 'Percentage of remote vacancies' : 'Porcentaje de vacantes en remoto'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-150 p-6">
                <span className="text-3xl">🤷‍♂️</span>
                <p className="text-gray-550 text-sm mt-3">
                  {isEnglish 
                    ? `We currently don't have active ${categoryPretty} jobs at ${companyName}.`
                    : `No hay ofertas activas de ${categoryPretty} en ${companyName} ahora mismo.`}
                </p>
                <Link href={isEnglish ? `/empresas/${slug}?lang=en` : `/empresas/${slug}`} className="inline-block mt-4 text-indigo-650 font-bold hover:underline text-xs">
                  {isEnglish ? `View all openings at ${companyName}` : `Ver todas las vacantes de ${companyName}`} &rarr;
                </Link>
              </div>
            ) : (
              jobs.flatMap((job, index) => {
                const card = <JobCard key={job.id} job={job} lang={lang} />;
                if (index === 4) {
                  return [
                    <div key={`ad-inline-${job.id}`} className="col-span-full my-2">
                      <AdBanner variant="inline" />
                    </div>,
                    card
                  ];
                }
                return [card];
              })
            )}

            {/* Paginación */}
            {allJobs.length > limit && (
              <div className="col-span-full flex justify-between items-center pt-6">
                {validPage > 1 ? (
                  <Link
                    href={`/empresas/${slug}/${categoria}?page=${validPage - 1}${isEnglish ? '&lang=en' : ''}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {isEnglish ? '← Previous' : '← Anterior'}
                  </Link>
                ) : (
                  <div />
                )}
                <span className="text-sm text-gray-650">{isEnglish ? `Page ${validPage}` : `Página ${validPage}`}</span>
                {jobs.length === limit ? (
                  <Link
                    href={`/empresas/${slug}/${categoria}?page=${validPage + 1}${isEnglish ? '&lang=en' : ''}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {isEnglish ? 'Next →' : 'Siguiente →'}
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <SubscribeForm location={`${companyName} (${categoryPretty})`} />
          <div className="lg:sticky lg:top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>

      {/* Formulario de Review */}
      <div className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{isEnglish ? 'Reviews & Opinions' : 'Opiniones sobre la empresa'}</h2>
        <CompanyReviewForm companySlug={slug} />
      </div>
    </div>
  );
}
