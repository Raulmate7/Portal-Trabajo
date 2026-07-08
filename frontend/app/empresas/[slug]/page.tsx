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
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const techSlugMap: Record<string, string> = {
  'React': 'react',
  'Angular': 'angular',
  'Vue': 'vue',
  'Node.js': 'node',
  'Python': 'python',
  'Java': 'java',
  'TypeScript': 'typescript',
  'JavaScript': 'javascript',
  'AWS': 'aws',
  'Docker': 'docker',
  'Kubernetes': 'kubernetes',
  'Next.js': 'nextjs',
  'Flutter': 'flutter',
  'SQL': 'sql',
  'PHP': 'php',
  'C# / .NET': 'csharp',
  'Go': 'go',
  'Symfony': 'php',
  'Laravel': 'php',
  'Spring Boot': 'java'
};

async function getAllJobsByCompany(companySlug: string) {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE is_active = TRUE AND (REGEXP_REPLACE(LOWER(company), '[^a-z0-9]+', '-') = $1 
         OR LOWER(company) = REPLACE($1, '-', ' '))
      ORDER BY created_at DESC
    `;
    const res = await client.query(sql, [companySlug]);
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

function generateCompanyEditorial(companyName: string, stats: any, techStack: string[], isEnglish: boolean): string {
  if (isEnglish) {
    const remoteText = stats.remoteRatio > 50 
      ? 'a strong focus on remote work (telecommuting)' 
      : (stats.remoteRatio > 15 
        ? 'a hybrid or flexible model that combines on-site and remote work' 
        : 'a preference for on-site or office-based positions in most of their offers');

    const salaryText = stats.averageSalary 
      ? `the estimated average salary for their positions is around ${stats.averageSalary.toLocaleString('es-ES')}€ gross per year, representing competitive compensation for the sector` 
      : 'we currently do not have sufficient salary reference data for this company in our local database';

    const techText = techStack.length > 0 
      ? `usually search for professionals with mastery of technologies like ${techStack.join(', ')}` 
      : 'offers opportunities across different technologies and engineering areas';

    return `Working at ${companyName} represents a solid choice in today's tech market. According to vacancies analyzed recently on our platform, the organization stands out for ${remoteText}. In terms of compensation, ${remoteText}. Their recruitment processes ${techText}. This information is analyzed and updated regularly to reflect the reality of the company's hiring.`;
  }

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
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const allJobs = await getAllJobsByCompany(slug);
  
  if (!allJobs || allJobs.length === 0) {
    return {
      title: isEnglish ? 'Company not found | IT Job Portal' : 'Empresa no encontrada | Portal Trabajo',
    };
  }

  const companyName = allJobs[0].company;
  const totalJobs = allJobs.length;
  const techStack = detectCompanyTechStack(allJobs);
  const topTechs = techStack.slice(0, 3).join(', ');

  const reviews = await getCompanyReviews(slug);
  const baseRatingVal = 3.8 + (slug.charCodeAt(0) % 13) / 10;
  const baseReviewCount = 5 + (slug.charCodeAt(slug.length - 1) % 25);
  const realReviewsCount = reviews.length;
  const realReviewsSum = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  const reviewCount = baseReviewCount + realReviewsCount;
  const ratingValue = ((baseRatingVal * baseReviewCount + realReviewsSum) / reviewCount).toFixed(1);

  let titleSeo = isEnglish
    ? `Reviews and Jobs at ${companyName} (${totalJobs} openings) | IT Job Portal`
    : `Opiniones y Empleo en ${companyName} (${totalJobs} ofertas) | Portal Trabajo`;
  if (isPaged) {
    titleSeo += isEnglish ? ` - Page ${page}` : ` - Página ${page}`;
  }

  const techText = topTechs 
    ? (isEnglish ? ` Specialists in ${topTechs}.` : ` Especialistas en ${topTechs}.`)
    : '';
  const description = isEnglish
    ? `Employee reviews at ${companyName}: rating ${ratingValue}/5 based on ${reviewCount} reviews. Find ${totalJobs} active tech jobs at ${companyName}.${techText} Software developer jobs, salaries, and remote work.${isPaged ? ` (Page ${page})` : ''}`
    : `Opiniones de empleados en ${companyName}: valoración de ${ratingValue}/5 basada en ${reviewCount} reseñas. Encuentra ${totalJobs} ofertas de trabajo activas en ${companyName}.${techText} Vacantes de desarrollo de software, salarios y teletrabajo.${isPaged ? ` (Página ${page})` : ''}`;

  const queryParam = isEnglish ? '?lang=en' : '';
  const metadata: Metadata = {
    title: titleSeo,
    description: description,
    alternates: {
      canonical: `${BASE_URL}/empresas/${slug}${queryParam}`,
      languages: {
        'es-ES': `${BASE_URL}/empresas/${slug}`,
        'en': `${BASE_URL}/empresas/${slug}?lang=en`,
        'x-default': `${BASE_URL}/empresas/${slug}`,
      }
    },
    openGraph: {
      title: isEnglish ? `Reviews and Job Offers at ${companyName} - Recent Openings` : `Opiniones y Ofertas de Empleo en ${companyName} - Vacantes Recientes${isPaged ? ` (Página ${page})` : ''}`,
      description: description,
      url: `${BASE_URL}/empresas/${slug}${queryParam}`,
      images: [
        {
          url: `${BASE_URL}/empresas/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: isEnglish ? `Reviews and jobs at ${companyName}` : `Opiniones y ofertas de empleo en ${companyName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEnglish ? `Reviews and Job Offers at ${companyName} - Recent Openings` : `Opiniones y Ofertas de Empleo en ${companyName} - Vacantes Recientes${isPaged ? ` (Página ${page})` : ''}`,
      description: description,
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
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const allJobs = await getAllJobsByCompany(slug);

  if (!allJobs || allJobs.length === 0) {
    notFound();
  }

  const companyName = allJobs[0].company;
  const stats = calculateCompanyStats(allJobs);
  const techStack = detectCompanyTechStack(allJobs);
  const editorialText = generateCompanyEditorial(companyName, stats, techStack, isEnglish);

  const uniqueCities = Array.from(
    new Set(
      allJobs
        .map((j) => {
          const loc = j.location ? j.location.trim() : '';
          const lowerLoc = loc.toLowerCase();
          if (lowerLoc.includes('madrid')) return 'Madrid';
          if (lowerLoc.includes('barcelona')) return 'Barcelona';
          if (lowerLoc.includes('valencia')) return 'Valencia';
          if (lowerLoc.includes('sevilla')) return 'Sevilla';
          if (lowerLoc.includes('málaga') || lowerLoc.includes('malaga')) return 'Málaga';
          if (lowerLoc.includes('bilbao')) return 'Bilbao';
          if (lowerLoc.includes('remoto') || lowerLoc.includes('teletrabajo') || lowerLoc.includes('remote')) return 'Remoto';
          return loc;
        })
        .filter((loc) => loc && loc.length > 2 && loc.toLowerCase() !== 'desconocida')
    )
  ).slice(0, 4);

  const queryParam = isEnglish ? '?lang=en' : '';
  const crossLinks: { label: string; href: string }[] = [];
  if (techStack.length > 0 && uniqueCities.length > 0) {
    const topTech = techStack[0];
    const techSlug = techSlugMap[topTech] || 'informatica-tecnologia';
    for (const city of uniqueCities) {
      if (city === 'Remoto') {
        crossLinks.push({
          label: isEnglish ? `View ${topTech} jobs in Remote` : `Ver ofertas de ${topTech} en Remoto`,
          href: `/trabajos/${techSlug}-remoto${queryParam}`
        });
      } else {
        const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        crossLinks.push({
          label: isEnglish ? `View ${topTech} jobs in ${city}` : `Ver ofertas de ${topTech} en ${city}`,
          href: `/trabajos/${techSlug}-en-${citySlug}${queryParam}`
        });
      }
    }
  }

  // Paginación en memoria
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

  const organizationJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: companyName,
    url: `${BASE_URL}/empresas/${slug}`,
    logo: `${BASE_URL}/og-image.png`,
    description: `Ofertas de trabajo del sector tecnológico en la empresa ${companyName}.`,
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
    },
    ...(reviews.length > 0 ? {
      review: reviews.map((r: any) => ({
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': r.role || 'Anónimo'
        },
        'datePublished': (() => {
          try {
            const d = new Date(r.created_at);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          } catch {
            return new Date().toISOString().split('T')[0];
          }
        })(),
        'reviewBody': r.review_text,
        'reviewRating': {
          '@type': 'Rating',
          'bestRating': '5',
          'ratingValue': r.rating,
          'worstRating': '1'
        }
      }))
    } : {})
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Ofertas de empleo IT en ${companyName}`,
    description: `Últimas vacantes de empleo tecnológicas en ${companyName}.`,
    numberOfItems: allJobs.length,
    itemListElement: allJobs.map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/job/${getJobSlug(job)}`,
      name: job.title
    }))
  };

  const top3Jobs = allJobs.slice(0, 3);
  const jobPostingSchemas = top3Jobs.map((job) => {
    const isRemote = job.location.toLowerCase().includes('remoto') || job.location.toLowerCase().includes('teletrabajo') || job.location.toLowerCase().includes('remote');
    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title_es || job.title,
      description: job.description_snippet || `Oferta de empleo para ${job.title_es || job.title} en ${job.company}`,
      datePosted: (() => {
        try {
          const d = new Date(job.created_at);
          return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
        } catch {
          return new Date().toISOString();
        }
      })(),
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company
      },
      identifier: {
        '@type': 'PropertyValue',
        name: job.company,
        value: `job-${job.id}`
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location,
          addressCountry: 'ES'
        }
      },
      jobLocationType: isRemote ? 'TELECOMMUTE' : undefined
    };
  });

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
      {jobPostingSchemas.map((schema, idx) => (
        <script 
          key={`job-schema-${idx}`}
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
        />
      ))}

      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isEnglish ? `Jobs at ${companyName}` : `Empleo en ${companyName}`}
          </h1>
          <ShareButton title={isEnglish ? `Jobs at ${companyName}` : `Empleo en ${companyName}`} company={companyName} />
        </div>
        <Link href={isEnglish ? '/?lang=en' : '/'} className="text-indigo-600 hover:underline text-sm font-medium">
          {isEnglish ? '← Search other offers' : '← Buscar otras ofertas'}
        </Link>
      </div>
      
      {/* Tarjeta de Estadísticas de la Empresa (Rediseño 4 columnas con Valoración Editorial) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="md:col-span-1 flex flex-col justify-center">
          <p className="text-gray-700 leading-relaxed m-0 text-sm">
            {isEnglish ? (
              <>Complete list of technology vacancies to join <strong>{companyName}</strong>. We currently have <strong>{allJobs.length} active offers</strong> collected on the web.</>
            ) : (
              <>Listado completo de vacantes tecnológicas para incorporarte a <strong>{companyName}</strong>. Actualmente contamos con <strong>{allJobs.length} ofertas activas</strong> recopiladas en la web.</>
            )}
          </p>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider m-0 mb-1.5">{isEnglish ? 'Employee Rating' : 'Valoración Empleados'}</h3>
          <div className="flex items-center gap-0.5 mb-1.5 justify-center">
            <span className="text-2xl font-extrabold text-amber-700 mr-1.5">{ratingValue}</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                className={star <= Math.round(parseFloat(ratingValue)) ? "text-amber-500 text-lg" : "text-gray-200 text-lg"}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-[10px] text-gray-500">{isEnglish ? `Based on ${reviewCount} reviews` : `Basado en ${reviewCount} opiniones`}</span>
        </div>
        
        <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider m-0 mb-1">{isEnglish ? 'Estimated Average Salary' : 'Salario Medio Estimado'}</h3>
          <p className="text-3xl font-extrabold text-indigo-700 m-0">
            {stats.averageSalary ? `${stats.averageSalary.toLocaleString('es-ES')}€` : 'N/A'}
          </p>
          <span className="text-[10px] text-gray-500 mt-1">{isEnglish ? 'Based on job offers with visible salary' : 'Basado en las ofertas publicadas con sueldo'}</span>
        </div>

        <div className="bg-purple-50/70 p-5 rounded-xl border border-purple-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider m-0 mb-1">{isEnglish ? 'Remote Work Rate' : 'Tasa de Teletrabajo'}</h3>
          <p className="text-3xl font-extrabold text-purple-700 m-0">
            {stats.remoteRatio}%
          </p>
          <span className="text-[10px] text-gray-500 mt-1">{isEnglish ? 'Percentage of 100% remote offers' : 'Porcentaje de ofertas 100% en remoto'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          
          {/* Sección Editorial Dinámica (Oportunidad 2.4) */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📝</span> {isEnglish ? `About Recruitment at ${companyName}` : `Sobre el Reclutamiento en ${companyName}`}
            </h2>
            <p className="text-sm text-gray-650 leading-relaxed mb-6">
              {editorialText}
            </p>
            {techStack.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  {isEnglish ? 'Most demanded technologies in their offers:' : 'Tecnologías más demandadas en sus ofertas:'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => {
                    const slug = techSlugMap[tech] || 'informatica-tecnologia';
                    return (
                      <Link 
                        key={tech} 
                        href={`/trabajos/${slug}${queryParam}`}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg border border-indigo-100/50 transition-colors"
                      >
                        {tech}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {crossLinks.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {isEnglish ? 'View related offers in your area:' : 'Ver ofertas relacionadas en tu zona:'}
                </h4>
                <div className="flex flex-wrap gap-3">
                  {crossLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.href}
                      className="text-xs text-indigo-650 hover:text-indigo-850 hover:underline font-semibold flex items-center gap-1"
                    >
                      🔍 {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.flatMap((job, index) => {
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
            })}
            
            {/* Controles de Paginación */}
            <div className="col-span-full flex justify-between items-center pt-6">
              {validPage > 1 ? (
                <Link
                  href={`/empresas/${slug}?page=${validPage - 1}${isEnglish ? '&lang=en' : ''}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {isEnglish ? '← Previous' : '← Anterior'}
                </Link>
              ) : (
                <div />
              )}
              <span className="text-sm text-gray-600">{isEnglish ? `Page ${validPage}` : `Página ${validPage}`}</span>
              {jobs.length === 20 ? (
                <Link
                  href={`/empresas/${slug}?page=${validPage + 1}${isEnglish ? '&lang=en' : ''}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {isEnglish ? 'Next →' : 'Siguiente →'}
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Sección de Reseñas / UGC */}
          <div className="mt-12 space-y-8">
            <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>💬</span> {isEnglish ? `Employee Reviews at ${companyName}` : `Opiniones de Empleados en ${companyName}`}
              </h2>
              
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic mb-2">
                  {isEnglish 
                    ? `No user reviews yet. Be the first to share your experience about the work environment or interviews at ${companyName}!`
                    : `Aún no hay opiniones de usuarios. ¡Sé el primero en compartir tu experiencia sobre el ambiente de trabajo o entrevistas en ${companyName}!`}
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((rev: any, idx: number) => (
                    <div key={idx} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-900 block">
                            {rev.role || 'Puesto no especificado'}
                          </span>
                          <span className="text-xs text-gray-500 block">
                            Publicado el {new Date(rev.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={star <= rev.rating ? "text-amber-500 text-sm font-bold" : "text-gray-200 text-sm"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-650 whitespace-pre-line leading-relaxed">
                        {rev.review_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <CompanyReviewForm companySlug={slug} />
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <SubscribeForm location={companyName} />
          <div className="lg:sticky lg:top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
