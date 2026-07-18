import pool from "@/lib/db";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";
import { cache } from "react";
import { BASE_URL } from "@/lib/constants";
import { slugify } from "@/lib/slug";

export const revalidate = 3600; // Cache de 1 hora (ISR)

interface CompanyRow {
  company: string;
  count: number;
  average_salary?: number | null;
  remote_ratio?: number | null;
}

type Props = {
  params: Promise<{ sector: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

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
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data',
  'cloud': 'Cloud',
  'mobile': 'Mobile',
  'desarrollador-fullstack': 'Desarrollador Full Stack',
  'fullstack': 'Desarrollador Full Stack',
  'devops-engineer': 'DevOps Engineer',
  'scrum-master': 'Scrum Master',
  'product-manager': 'Product Manager',
  'data-analyst': 'Data Analyst',
  'qa-engineer': 'QA Engineer',
  'ux-designer': 'UX Designer',
  'informatica-tecnologia': 'Informática y Tecnología',
  'rust': 'Rust',
  'scala': 'Scala',
  'elixir': 'Elixir',
  'terraform': 'Terraform',
  'haskell': 'Haskell',
  'erlang': 'Erlang',
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
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data',
  'cloud': 'Cloud',
  'mobile': 'Mobile',
  'desarrollador-fullstack': 'Full Stack Developer',
  'fullstack': 'Full Stack Developer',
  'devops-engineer': 'DevOps Engineer',
  'scrum-master': 'Scrum Master',
  'product-manager': 'Product Manager',
  'data-analyst': 'Data Analyst',
  'qa-engineer': 'QA Engineer',
  'ux-designer': 'UX Designer',
  'informatica-tecnologia': 'IT and Technology',
  'rust': 'Rust',
  'scala': 'Scala',
  'elixir': 'Elixir',
  'terraform': 'Terraform',
  'haskell': 'Haskell',
  'erlang': 'Erlang',
  'cobol': 'COBOL'
};

function parseSector(sectorSlug: string) {
  let tec = sectorSlug;
  let ciudad = '';
  const experiencia = '';
  const modalidad = '';
  const contrato = '';

  const enIndex = tec.indexOf('-en-');
  if (enIndex !== -1) {
    const afterEn = tec.substring(enIndex + 4);
    tec = tec.substring(0, enIndex);
    ciudad = afterEn.replace(/-/g, ' ');
  } else if (tec.endsWith('-remoto')) {
    tec = tec.slice(0, -7);
    ciudad = 'remoto';
  }

  if (tec === '') {
    tec = 'informatica-tecnologia';
  }

  const dbCategory = categoryMap[tec];
  return { tec, ciudad, experiencia, modalidad, contrato, dbCategory };
}

const getCompaniesBySector = cache(async (
  tec: string, 
  ciudad: string, 
  dbCategory: string | undefined
): Promise<CompanyRow[]> => {
  const client = await pool.connect();
  try {
    let sql = `
      SELECT company, COUNT(*) as count, 
             AVG(CASE WHEN salary_min >= 12000 AND salary_max <= 150000 THEN (salary_min + salary_max)/2 ELSE NULL END) as average_salary,
             COUNT(CASE WHEN location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' THEN 1 ELSE NULL END) as remote_count
      FROM jobs 
      WHERE is_active = TRUE AND company IS NOT NULL AND company != 'Desconocida'
    `;
    const paramsQuery: any[] = [];
    let paramIndex = 1;

    if (dbCategory) {
      sql += ` AND category = $${paramIndex}`;
      paramsQuery.push(dbCategory);
      paramIndex++;
    } else if (tec !== 'informatica-tecnologia') {
      if (tec === 'nextjs') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%nextjs%', '%next.js%', '%next-js%');
        paramIndex += 3;
      } else if (tec === 'csharp') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%c#%', '%c-sharp%', '%csharp%');
        paramIndex += 3;
      } else if (tec === 'cybersecurity' || tec === 'ciberseguridad') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%cybersecurity%', '%ciberseguridad%', '%seguridad%');
        paramIndex += 3;
      } else {
        sql += ` AND title ILIKE $${paramIndex}`;
        paramsQuery.push(`%${tec}%`);
        paramIndex++;
      }
    }

    if (ciudad) {
      if (ciudad.toLowerCase() === 'remoto') {
        sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2} OR location ILIKE $${paramIndex + 3})`;
        paramsQuery.push('%remoto%', '%remote%', '%worldwide%', '%teletrabajo%');
        paramIndex += 4;
      } else {
        sql += ` AND location ILIKE $${paramIndex}`;
        paramsQuery.push(`%${ciudad}%`);
        paramIndex++;
      }
    }

    sql += ` GROUP BY company ORDER BY count DESC LIMIT 50`;

    const result = await client.query(sql, paramsQuery);
    return result.rows.map((row: any) => {
      const total = parseInt(row.count || '0', 10);
      const remotes = parseInt(row.remote_count || '0', 10);
      return {
        company: row.company,
        count: total,
        average_salary: row.average_salary ? Math.round(parseFloat(row.average_salary)) : null,
        remote_ratio: total > 0 ? Math.round((remotes / total) * 100) : 0
      };
    });
  } catch (error) {
    console.error("Error cargando empresas para empleadores:", error);
    return [];
  } finally {
    client.release();
  }
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  
  const { tec, ciudad, dbCategory } = parseSector(sectorSlug);
  
  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoriaBonita = displayNameMapUsed[tec] || dbCategory || tec.replace(/-/g, ' ');

  const locLabel = ciudad ? (ciudad.toLowerCase() === 'remoto' ? (isEnglish ? ' Remote' : ' en Remoto') : (isEnglish ? ` in ${ciudad}` : ` en ${ciudad}`)) : (isEnglish ? ' in Spain' : ' en España');

  const title = isEnglish
    ? `Best Companies to Work for in ${categoriaBonita}${locLabel} [2026]`
    : `Mejores Empresas para Trabajar en ${categoriaBonita}${locLabel} [Ranking 2026]`;

  const description = isEnglish
    ? `Discover the top tech companies hiring for ${categoriaBonita} roles${locLabel}. Compare average salaries, remote work rates, and search active jobs.`
    : `Descubre las mejores empresas tecnológicas para trabajar con ${categoriaBonita}${locLabel}. Compara sueldos medios, tasa de teletrabajo y vacantes activas.`;

  const queryParam = isEnglish ? '?lang=en' : '';

  return {
    title: `${title} | Portal Trabajo IT`,
    description,
    alternates: {
      canonical: `${BASE_URL}/empleadores/${sectorSlug}${queryParam}`,
      languages: {
        'es-ES': `${BASE_URL}/empleadores/${sectorSlug}`,
        'en': `${BASE_URL}/empleadores/${sectorSlug}?lang=en`,
        'x-default': `${BASE_URL}/empleadores/${sectorSlug}`,
      }
    }
  };
}

export async function generateStaticParams() {
  const technologies = [
    'react', 'node', 'python', 'java', 'typescript', 'javascript', 'aws', 'docker', 'kubernetes', 'backend', 'frontend', 'fullstack'
  ];
  return technologies.map(tech => ({ sector: tech }));
}

export default async function EmpleadoresPage({ params, searchParams }: Props) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const { tec, ciudad, dbCategory } = parseSector(sectorSlug);
  const companies = await getCompaniesBySector(tec, ciudad, dbCategory);

  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoriaBonita = displayNameMapUsed[tec] || dbCategory || tec.replace(/-/g, ' ');
  const locLabel = ciudad ? (ciudad.toLowerCase() === 'remoto' ? (isEnglish ? 'Remote' : 'en Remoto') : (isEnglish ? `in ${ciudad}` : `en ${ciudad}`)) : (isEnglish ? 'in Spain' : 'en España');

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Jobs' : 'Ofertas', href: isEnglish ? `/trabajos/${sectorSlug}?lang=en` : `/trabajos/${sectorSlug}` },
    { label: isEnglish ? 'Best Employers' : 'Mejores Empresas' }
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
    name: isEnglish ? `Best Companies for ${categoriaBonita} ${locLabel}` : `Mejores Empresas para ${categoriaBonita} ${locLabel}`,
    numberOfItems: companies.length,
    itemListElement: companies.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/empresas/${slugify(c.company)}`,
      name: c.company
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8 font-sans max-w-6xl min-h-screen">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />

      {/* Header editorial premium */}
      <div className="mb-10 text-center max-w-3xl mx-auto bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]"></div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            ⭐ {isEnglish ? 'Verified Employer Insights' : 'Ranking de Contratación IT'}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
            {isEnglish ? `Best Companies to Work for in ${categoriaBonita}` : `Mejores Empresas para Trabajar en ${categoriaBonita}`}
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            {isEnglish 
              ? `Compare the top active employers hiring ${categoriaBonita} developers ${locLabel}. Analyze median salaries, telecommuting rates, and active job postings.`
              : `Compara las principales empresas con ofertas de empleo de ${categoriaBonita} ${locLabel}. Analiza salarios brutos promedio, porcentaje de teletrabajo y estabilidad laboral.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main List */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="bg-gray-50/75 p-4 border-b border-gray-100 grid grid-cols-12 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
              <span className="col-span-6 text-left pl-4">{isEnglish ? 'Company Name' : 'Empresa'}</span>
              <span className="col-span-2">{isEnglish ? 'Est. Salary' : 'Sueldo Medio'}</span>
              <span className="col-span-2">{isEnglish ? 'Remote Rate' : '% Remoto'}</span>
              <span className="col-span-2 pr-4">{isEnglish ? 'Openings' : 'Vacantes'}</span>
            </div>

            {companies.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                🤷‍♂️ {isEnglish ? 'No employers found with current criteria.' : 'No se encontraron empresas con los criterios seleccionados.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {companies.map((c, index) => {
                  const companySlug = slugify(c.company);
                  return (
                    <div key={c.company} className="p-4 grid grid-cols-12 items-center hover:bg-gray-50/50 transition-colors text-center text-sm md:text-base">
                      {/* Name */}
                      <div className="col-span-6 flex items-center gap-3 text-left pl-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <Link 
                            href={`/empresas/${companySlug}${isEnglish ? '?lang=en' : ''}`}
                            className="font-bold text-gray-900 hover:text-indigo-650 hover:underline"
                          >
                            {c.company}
                          </Link>
                          {c.count > 1 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {isEnglish ? 'Active Hirer' : 'Contratando Activo'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Salary */}
                      <span className="col-span-2 font-semibold text-gray-700">
                        {c.average_salary ? `${c.average_salary.toLocaleString('es-ES')}€` : 'N/A'}
                      </span>

                      {/* Remote Rate */}
                      <span className="col-span-2 font-medium text-gray-600">
                        {c.remote_ratio}%
                      </span>

                      {/* Openings Button */}
                      <div className="col-span-2 pr-2">
                        <Link 
                          href={`/empresas/${companySlug}${isEnglish ? '?lang=en' : ''}`}
                          className="inline-block px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold rounded-lg text-xs transition-colors shrink-0 border border-indigo-100/50"
                        >
                          {c.count} {isEnglish ? 'Jobs' : 'Ofertas'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <AdBanner variant="inline" />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <SubscribeForm location={`${categoriaBonita} ${locLabel}`} />
          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
