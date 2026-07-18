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

const EXPERIENCE_SUFFIXES: Record<string, { keywords: string[]; label: string; labelEn: string }> = {
  'junior': {
    keywords: ['junior', 'jr', 'junior developer', 'trainee', 'becario', 'prácticas', 'entry level', 'sin experiencia'],
    label: 'Junior',
    labelEn: 'Junior'
  },
  'senior': {
    keywords: ['senior', 'sr', 'lead', 'principal', 'tech lead', 'staff'],
    label: 'Senior',
    labelEn: 'Senior'
  },
  'sin-experiencia': {
    keywords: ['sin experiencia', 'entry level', 'trainee', 'becario', 'prácticas', 'junior'],
    label: 'Sin Experiencia',
    labelEn: 'No Experience Required'
  },
};

const CONTRACT_TYPES: Record<string, { keywords: string[]; label: string; labelEn: string }> = {
  'contrato-indefinido': {
    keywords: ['indefinido', 'contrato indefinido', 'puesto estable', 'permanente', 'permanent'],
    label: 'Contrato Indefinido',
    labelEn: 'Permanent Contract'
  },
  'contrato-temporal': {
    keywords: ['temporal', 'contrato temporal', 'obra y servicio', 'temporary'],
    label: 'Contrato Temporal',
    labelEn: 'Temporary Contract'
  },
  'contrato-practicas': {
    keywords: ['practicas', 'beca', 'becario', 'trainee', 'internship', 'en prácticas'],
    label: 'Contrato de Prácticas',
    labelEn: 'Internship'
  },
  'freelance': {
    keywords: ['freelance', 'autonomo', 'autónomo', 'contractor'],
    label: 'Freelance / Autónomo',
    labelEn: 'Freelance / Contractor'
  }
};

function parseSector(sectorSlug: string) {
  let tec = sectorSlug;
  let ciudad = '';
  let experiencia = '';
  let modalidad = '';
  let contrato = '';
  let salaryMin: number | null = null;
  let salaryMax: number | null = null;

  // Buscar coincidencia de salario y limpiarlo de tec
  const salaryMatch1 = tec.match(/salario-mas-de-(\d+)k?/i);
  const salaryMatch2 = tec.match(/salario-mas-de-(\d+)/i);
  const salaryMatch3 = tec.match(/salario-(\d+)k-(\d+)k/i);
  const salaryMatch4 = tec.match(/salario-(\d+)-(\d+)/i);

  if (salaryMatch1) {
    salaryMin = parseInt(salaryMatch1[1]) * 1000;
    tec = tec.replace(salaryMatch1[0], '').replace(/--+/g, '-').replace(/^-|-$/g, '');
  } else if (salaryMatch2) {
    let val = parseInt(salaryMatch2[1]);
    if (val < 1000) val = val * 1000;
    salaryMin = val;
    tec = tec.replace(salaryMatch2[0], '').replace(/--+/g, '-').replace(/^-|-$/g, '');
  } else if (salaryMatch3) {
    salaryMin = parseInt(salaryMatch3[1]) * 1000;
    salaryMax = parseInt(salaryMatch3[2]) * 1000;
    tec = tec.replace(salaryMatch3[0], '').replace(/--+/g, '-').replace(/^-|-$/g, '');
  } else if (salaryMatch4) {
    salaryMin = parseInt(salaryMatch4[1]);
    salaryMax = parseInt(salaryMatch4[2]);
    tec = tec.replace(salaryMatch4[0], '').replace(/--+/g, '-').replace(/^-|-$/g, '');
  }

  if (tec.includes('-hibrido')) {
    modalidad = 'hibrido';
    tec = tec.replace('-hibrido', '');
  }

  const enIndex = tec.indexOf('-en-');
  if (enIndex !== -1) {
    const afterEn = tec.substring(enIndex + 4);
    tec = tec.substring(0, enIndex);
    ciudad = afterEn.replace(/-/g, ' ');
  } else if (tec.endsWith('-remoto')) {
    tec = tec.slice(0, -7);
    ciudad = 'remoto';
  }

  for (const suffix of Object.keys(EXPERIENCE_SUFFIXES)) {
    if (tec.endsWith(`-${suffix}`)) {
      experiencia = suffix;
      tec = tec.slice(0, -(suffix.length + 1));
      break;
    }
  }

  for (const cKey of Object.keys(CONTRACT_TYPES)) {
    if (tec.endsWith(`-${cKey}`)) {
      contrato = cKey;
      tec = tec.slice(0, -(cKey.length + 1));
      break;
    } else if (tec.includes(`-${cKey}-`)) {
      contrato = cKey;
      tec = tec.replace(`-${cKey}-`, '-');
      break;
    } else if (tec.startsWith(`${cKey}-`)) {
      contrato = cKey;
      tec = tec.slice(cKey.length + 1);
      break;
    } else if (tec === cKey) {
      contrato = cKey;
      tec = '';
      break;
    }
  }

  if (tec === '') {
    tec = 'informatica-tecnologia';
  }

  const dbCategory = categoryMap[tec];
  return { tec, ciudad, experiencia, modalidad, contrato, dbCategory, salaryMin, salaryMax };
}

const getCompaniesBySector = cache(async (
  tec: string, 
  ciudad: string, 
  dbCategory: string | undefined, 
  experiencia: string = '', 
  modalidad: string = '',
  contrato: string = '',
  salaryMin?: number | null,
  salaryMax?: number | null
): Promise<CompanyRow[]> => {
  const client = await pool.connect();
  try {
    let sql = `
      SELECT company, COUNT(*) as count, AVG(CASE WHEN salary_min >= 12000 AND salary_max <= 150000 THEN (salary_min + salary_max)/2 ELSE NULL END) as average_salary
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
      } else if (tec === 'desarrollador-fullstack' || tec === 'fullstack') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
        paramsQuery.push('%fullstack%', '%full stack%');
        paramIndex += 2;
      } else if (tec === 'devops-engineer' || tec === 'devops') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%devops%', '%dev ops%', '%site reliability%');
        paramIndex += 3;
      } else if (tec === 'data-analyst' || tec === 'analista-datos') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
        paramsQuery.push('%data analyst%', '%analista de datos%');
        paramIndex += 2;
      } else if (tec === 'scrum-master') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
        paramsQuery.push('%scrum master%', '%scrum%');
        paramIndex += 2;
      } else if (tec === 'product-manager') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1})`;
        paramsQuery.push('%product manager%', '%gestor de producto%');
        paramIndex += 2;
      } else if (tec === 'qa-engineer') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2} OR title ILIKE $${paramIndex + 3})`;
        paramsQuery.push('%qa%', '%tester%', '%calidad%', '%test engineer%');
        paramIndex += 4;
      } else if (tec === 'ux-designer') {
        sql += ` AND (title ILIKE $${paramIndex} OR title ILIKE $${paramIndex + 1} OR title ILIKE $${paramIndex + 2})`;
        paramsQuery.push('%ux%', '%diseñador%ux%', '%diseño%ux%');
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

    if (modalidad === 'hibrido') {
      sql += ` AND (location ILIKE $${paramIndex} OR location ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2} OR description_snippet ILIKE $${paramIndex + 3})`;
      paramsQuery.push('%híbrido%', '%hibrido%', '%hybrid%', '%semipresencial%');
      paramIndex += 4;
    }

    if (experiencia && EXPERIENCE_SUFFIXES[experiencia]) {
      const expKeywords = EXPERIENCE_SUFFIXES[experiencia].keywords;
      const expConditions = expKeywords.map(() => {
        const cond = `(title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
        paramIndex++;
        return cond;
      }).join(' OR ');
      sql += ` AND (${expConditions})`;
      paramsQuery.push(...expKeywords.map(k => `%${k}%`));
    }

    if (contrato && CONTRACT_TYPES[contrato]) {
      const contractKeywords = CONTRACT_TYPES[contrato].keywords;
      const contractConditions = contractKeywords.map(() => {
        const cond = `(title ILIKE $${paramIndex} OR description_snippet ILIKE $${paramIndex})`;
        paramIndex++;
        return cond;
      }).join(' OR ');
      sql += ` AND (${contractConditions})`;
      paramsQuery.push(...contractKeywords.map(k => `%${k}%`));
    }

    if (salaryMin) {
      sql += ` AND (salary_min >= $${paramIndex} OR salary_max >= $${paramIndex})`;
      paramsQuery.push(salaryMin);
      paramIndex++;
    }
    if (salaryMax) {
      sql += ` AND (salary_min <= $${paramIndex} OR salary_max <= $${paramIndex})`;
      paramsQuery.push(salaryMax);
      paramIndex++;
    }

    sql += ` GROUP BY company ORDER BY count DESC LIMIT 60`;

    const result = await client.query(sql, paramsQuery);
    return result.rows.map((row: any) => ({
      company: row.company,
      count: parseInt(row.count || '0', 10),
      average_salary: row.average_salary ? Math.round(parseFloat(row.average_salary)) : null
    }));
  } catch (error) {
    console.error("Error cargando empresas de la BD:", error);
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
  
  const { tec, ciudad, experiencia, modalidad, contrato, dbCategory, salaryMin, salaryMax } = parseSector(sectorSlug);
  
  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoriaBonita = displayNameMapUsed[tec] || dbCategory || tec.replace(/-/g, ' ');

  const companies = await getCompaniesBySector(tec, ciudad, dbCategory, experiencia, modalidad, contrato, salaryMin, salaryMax);
  const totalCompanies = companies.length;

  const locLabel = ciudad ? (ciudad.toLowerCase() === 'remoto' ? (isEnglish ? ' Remote' : ' en Remoto') : (isEnglish ? ` in ${ciudad}` : ` en ${ciudad}`)) : (isEnglish ? ' in Spain' : ' en España');

  const title = isEnglish
    ? `Top Companies Hiring ${categoriaBonita} Professionals${locLabel} [2026]`
    : `Empresas que Contratan ${categoriaBonita}${locLabel} [Ranking 2026]`;

  const description = isEnglish
    ? `Discover the top ${totalCompanies} companies hiring for ${categoriaBonita} positions${locLabel}. Check salaries, active openings and company details.`
    : `Descubre las mejores ${totalCompanies} empresas que buscan profesionales de ${categoriaBonita}${locLabel}. Consulta ofertas de empleo, salarios y perfiles.`;

  const queryParam = isEnglish ? '?lang=en' : '';

  return {
    title: `${title} | Portal Trabajo`,
    description,
    alternates: {
      canonical: `${BASE_URL}/trabajos/${sectorSlug}/empresas${queryParam}`,
      languages: {
        'es-ES': `${BASE_URL}/trabajos/${sectorSlug}/empresas`,
        'en': `${BASE_URL}/trabajos/${sectorSlug}/empresas?lang=en`,
        'x-default': `${BASE_URL}/trabajos/${sectorSlug}/empresas`,
      }
    }
  };
}

export default async function SectorCompaniesPage({ params, searchParams }: Props) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const { tec, ciudad, experiencia, modalidad, contrato, dbCategory, salaryMin, salaryMax } = parseSector(sectorSlug);
  const companies = await getCompaniesBySector(tec, ciudad, dbCategory, experiencia, modalidad, contrato, salaryMin, salaryMax);

  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoriaBonita = displayNameMapUsed[tec] || dbCategory || tec.replace(/-/g, ' ');
  const locLabel = ciudad ? (ciudad.toLowerCase() === 'remoto' ? (isEnglish ? 'Remote' : 'en Remoto') : (isEnglish ? `in ${ciudad}` : `en ${ciudad}`)) : (isEnglish ? 'in Spain' : 'en España');

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Jobs' : 'Ofertas', href: isEnglish ? `/trabajos/${sectorSlug}?lang=en` : `/trabajos/${sectorSlug}` },
    { label: isEnglish ? 'Companies' : 'Empresas' }
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
    name: isEnglish ? `Companies hiring ${categoriaBonita} ${locLabel}` : `Empresas que contratan ${categoriaBonita} ${locLabel}`,
    numberOfItems: companies.length,
    itemListElement: companies.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/empresas/${slugify(c.company)}`,
      name: c.company
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8 font-sans">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {isEnglish ? `Companies hiring ${categoriaBonita} ${locLabel}` : `Empresas que contratan ${categoriaBonita} ${locLabel}`}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isEnglish 
              ? `List of top companies offering ${categoriaBonita} openings sorted by active job count.`
              : `Ranking de las principales empresas con vacantes activas de ${categoriaBonita} ordenadas por volumen.`}
          </p>
        </div>
        <Link href={`/trabajos/${sectorSlug}${isEnglish ? '?lang=en' : ''}`} className="text-indigo-600 hover:underline text-sm font-semibold whitespace-nowrap">
          {isEnglish ? '← View active jobs list' : '← Ver listado de ofertas'}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main ranking list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-150 flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>{isEnglish ? 'Company Name' : 'Nombre Empresa'}</span>
              <div className="flex gap-16 mr-4">
                <span>{isEnglish ? 'Estimated Salary' : 'Sueldo Medio'}</span>
                <span>{isEnglish ? 'Openings' : 'Vacantes'}</span>
              </div>
            </div>

            {companies.length === 0 ? (
              <div className="p-12 text-center text-gray-550 text-sm">
                🤷‍♂️ {isEnglish ? 'No companies found with these filters.' : 'No se encontraron empresas con estos filtros.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {companies.map((companyRow, index) => {
                  const companySlug = slugify(companyRow.company);
                  return (
                    <div key={companyRow.company} className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {index + 1}
                        </span>
                        <Link 
                          href={`/empresas/${companySlug}${isEnglish ? '?lang=en' : ''}`}
                          className="font-bold text-gray-900 hover:text-indigo-650 hover:underline text-sm sm:text-base"
                        >
                          {companyRow.company}
                        </Link>
                      </div>

                      <div className="flex items-center gap-8 sm:gap-16">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">
                          {companyRow.average_salary ? `${companyRow.average_salary.toLocaleString('es-ES')}€` : 'N/A'}
                        </span>
                        <Link 
                          href={`/empresas/${companySlug}${isEnglish ? '?lang=en' : ''}`}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 shadow-sm"
                        >
                          {companyRow.count} {isEnglish ? 'Jobs' : 'Ofertas'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <AdBanner variant="inline" />
          </div>
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
