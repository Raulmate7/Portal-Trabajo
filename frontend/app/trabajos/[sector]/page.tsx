import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import SubscribeForm from "@/components/SubscribeForm";
import AdBanner from "@/components/AdBanner";
import PushSubscribe from "@/components/PushSubscribe";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";
import { cache } from "react";
import { BASE_URL } from "@/lib/constants";
import { getJobSlug, slugify } from "@/lib/slug";

export const revalidate = 300;

// Tipos
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

const adMap: Record<string, { title: string, text: string, link: string }> = {
  'backend': { 
    title: '¿Quieres ser experto en Java/Spring?', 
    text: 'Las empresas pagan +40k a los seniors. Fórmate aquí.', 
    link: 'https://trk.udemy.com/9VMAEj' 
  },
  'data': { 
    title: 'Domina el Big Data y PowerBI', 
    text: 'El perfil más demandado de 2026.', 
    link: 'https://trk.udemy.com/9VMAEj'
  }
};

const TECH_DESCRIPTIONS: Record<string, { es: string; en: string }> = {
  react: {
    es: "React es la biblioteca de JavaScript más demandada para el desarrollo de interfaces de usuario modernas. El dominio de su ecosistema (incluyendo Next.js, Redux, y Tailwind CSS) es clave para acceder a proyectos punteros.",
    en: "React is the most sought-after JavaScript library for developing modern user interfaces. Mastering its ecosystem (including Next.js, Redux, and Tailwind CSS) is key to accessing cutting-edge projects."
  },
  node: {
    es: "Node.js se ha consolidado como el entorno de ejecución backend preferido para construir servicios rápidos y escalables en JavaScript, facilitando la creación de APIs REST y arquitecturas de microservicios.",
    en: "Node.js has consolidated as the preferred backend runtime for building fast and scalable services in JavaScript, facilitating the creation of REST APIs and microservice architectures."
  },
  python: {
    es: "Python es el lenguaje de referencia en Inteligencia Artificial, Ciencia de Datos y automatización de procesos. Su ecosistema de frameworks como Django, FastAPI y Pandas goza de una inmensa oferta laboral.",
    en: "Python is the language of choice for Artificial Intelligence, Data Science, and process automation. Its ecosystem of frameworks such as Django, FastAPI, and Pandas enjoys an immense job supply."
  },
  java: {
    es: "Java sigue liderando el desarrollo de software a nivel empresarial y bancario en España. Las competencias en Spring Boot, Hibernate y servicios cloud son de las más cotizadas del mercado.",
    en: "Java continues to lead software development at the enterprise and banking levels in Spain. Competences in Spring Boot, Hibernate, and cloud services are among the most valued in the market."
  },
  php: {
    es: "PHP sustenta una gran parte de la web moderna. El conocimiento avanzado de Laravel o Symfony es altamente valorado por agencias y empresas de desarrollo para construir aplicaciones robustas.",
    en: "PHP powers a massive portion of the modern web. Advanced knowledge of Laravel or Symfony is highly valued by development agencies and companies to build robust applications."
  },
  csharp: {
    es: "C# y el ecosistema de .NET son pilares en el desarrollo de software empresarial, videojuegos (Unity) y soluciones en la nube de Microsoft Azure, con alta demanda de ingenieros de software.",
    en: "C# and the .NET ecosystem are pillars in corporate software development, video games (Unity), and Microsoft Azure cloud solutions, with high demand for software engineers."
  },
  devops: {
    es: "La cultura DevOps y la gestión de la nube son esenciales en el desarrollo moderno. El dominio de AWS, Docker, Kubernetes y CI/CD es la base de las posiciones mejor remuneradas del sector tech.",
    en: "DevOps culture and cloud management are essential in modern development. Mastering AWS, Docker, Kubernetes, and CI/CD forms the basis of the highest-paying positions in the tech sector."
  },
  'devops-engineer': {
    es: "Los ingenieros de DevOps optimizan el flujo de entrega de software mediante automatización de infraestructura, Kubernetes, Docker, Terraform e integración continua.",
    en: "DevOps engineers optimize the software delivery workflow through infrastructure automation, Kubernetes, Docker, Terraform, and continuous integration."
  },
  cybersecurity: {
    es: "La seguridad digital es una prioridad crítica para toda organización. Los especialistas en ciberseguridad, pentesting, análisis forense y cumplimiento de seguridad disfrutan de pleno empleo.",
    en: "Digital security is a critical priority for every organization. Specialists in cybersecurity, pentesting, forensics, and compliance enjoy full employment."
  },
  ciberseguridad: {
    es: "La seguridad digital es una prioridad crítica para toda organización. Los especialistas en ciberseguridad, pentesting, análisis forense y cumplimiento de seguridad disfrutan de pleno empleo.",
    en: "Digital security is a critical priority for every organization. Specialists in cybersecurity, pentesting, forensics, and compliance enjoy full employment."
  },
  data: {
    es: "El análisis de datos y la inteligencia de negocio guían las decisiones empresariales actuales. Perfiles hábiles en SQL, Python, Tableau y PowerBI son buscados diariamente por reclutadores.",
    en: "Data analytics and business intelligence guide current corporate decisions. Profiles skilled in SQL, Python, Tableau, and PowerBI are sought daily by recruiters."
  },
  'data-analyst': {
    es: "El analista de datos extrae conocimiento valioso a partir de conjuntos de información complejos usando herramientas como Python, SQL y visualizadores de BI.",
    en: "The data analyst extracts valuable knowledge from complex datasets using tools like Python, SQL, and BI visualization software."
  },
  frontend: {
    es: "Los desarrolladores frontend crean la interfaz visible y la experiencia de usuario del software. El conocimiento de HTML, CSS, JavaScript y frameworks como React, Angular o Vue es imprescindible.",
    en: "Frontend developers create the visible interface and user experience of software. Knowledge of HTML, CSS, JavaScript, and frameworks like React, Angular, or Vue is essential."
  },
  backend: {
    es: "El desarrollador backend diseña la lógica interna, bases de datos y seguridad que sostienen las aplicaciones web, requiriendo dominio de lenguajes como Java, Python, Node.js o PHP.",
    en: "The backend developer designs the internal logic, databases, and security that sustain web applications, requiring mastery of languages like Java, Python, Node.js, or PHP."
  },
  fullstack: {
    es: "Los programadores full stack dominan tanto el frontend como el backend, proporcionando una visión versátil y ágil muy apreciada en startups y equipos ágiles.",
    en: "Full stack programmers master both the frontend and the backend, providing a versatile and agile vision highly appreciated in startups and agile teams."
  },
  'desarrollador-fullstack': {
    es: "Los programadores full stack dominan tanto el frontend como el backend, proporcionando una visión versátil y ágil muy apreciada en startups y equipos ágiles.",
    en: "Full stack programmers master both the frontend and the backend, providing a versatile and agile vision highly appreciated in startups and agile teams."
  }
};

type Params = Promise<{ sector: string }>;

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

function parseSector(sectorSlug: string) {
  let tec = sectorSlug;
  let ciudad = '';
  let experiencia = '';
  let modalidad = '';

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

  const dbCategory = categoryMap[tec];
  return { tec, ciudad, experiencia, modalidad, dbCategory };
}

export async function generateMetadata({ params, searchParams }: { params: Params, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  
  const { tec, ciudad, experiencia, modalidad, dbCategory } = parseSector(sectorSlug);
  
  const jobs = await getJobs(tec, ciudad, dbCategory, experiencia, modalidad, page);
  const isThinPage = jobs.length === 0;
  const jobCount = jobs.length;

  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoriaBonita = displayNameMapUsed[tec] || dbCategory || tec.replace(/-/g, ' ');
  
  const expLabelObj = EXPERIENCE_SUFFIXES[experiencia];
  const expLabel = experiencia ? ` ${isEnglish ? expLabelObj?.labelEn : expLabelObj?.label}` : '';
  const modLabel = modalidad === 'hibrido' ? ' híbrido' : '';
  const modLabelEn = modalidad === 'hibrido' ? ' Hybrid' : '';
  const now = new Date();
  
  let tituloBase = "";
  let descBase = "";

  if (isEnglish) {
    tituloBase = `${categoriaBonita}${modLabelEn}${expLabel} Jobs`;
    descBase = `Active ${categoriaBonita}${modLabelEn}${expLabel ? ` (${expLabel.trim()})` : ''} job vacancies`;
    if (ciudad) {
      const ciudadBonita = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
      tituloBase += ` in ${ciudadBonita}`;
      descBase += ` in ${ciudadBonita}`;
    }
  } else {
    const mes = now.toLocaleDateString('es-ES', { month: 'long' });
    const anio = now.getFullYear();
    tituloBase = `Trabajo${modLabel}${expLabel} de ${categoriaBonita}`;
    descBase = `Ofertas de trabajo${modLabel}${expLabel ? ` para ${expLabel.trim()}` : ''} de ${categoriaBonita}`;
    if (ciudad) {
      const ciudadBonita = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
      tituloBase += ` en ${ciudadBonita}`;
      descBase += ` en ${ciudadBonita}`;
    }
    const countText = jobCount > 0 ? `${jobCount} ` : '';
    tituloBase = `${countText}${tituloBase} [${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}]`;
  }

  let tituloSeo = tituloBase;
  if (isPaged) {
    tituloSeo += isEnglish ? ` - Page ${page}` : ` - Página ${page}`;
  }
  
  const rssParams = new URLSearchParams();
  if (dbCategory) {
    rssParams.set('category', dbCategory);
  } else if (tec && tec !== 'informatica-tecnologia') {
    rssParams.set('q', tec);
  }
  if (ciudad) {
    rssParams.set('location', ciudad);
  }
  const rssQueryString = rssParams.toString();
  const rssUrl = rssQueryString 
    ? `${BASE_URL}/feed.xml?${rssQueryString}`
    : `${BASE_URL}/feed.xml`;

  const metaRobots = isPaged 
    ? { index: false, follow: true } 
    : { index: !isThinPage, follow: true };

  const queryParam = isEnglish ? '?lang=en' : '';
  const canonicalUrl = `${BASE_URL}/trabajos/${sectorSlug}${queryParam}`;

  return {
    title: isEnglish ? `${tituloSeo} | IT Job Portal` : `${tituloSeo} | Portal Trabajo`,
    description: isEnglish
      ? `${descBase} updated today. ${jobCount > 0 ? `${jobCount} vacancies available now.` : 'We aggregate offers from top tech companies.'}${isPaged ? ` (Page ${page})` : ''}`
      : `${descBase} actualizadas hoy. ${jobCount > 0 ? `${jobCount} vacantes disponibles ahora.` : 'Recopilamos ofertas de las mejores empresas tecnológicas.'}${isPaged ? ` (Página ${page})` : ''}`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'es-ES': `${BASE_URL}/trabajos/${sectorSlug}`,
        'en': `${BASE_URL}/trabajos/${sectorSlug}?lang=en`,
        'x-default': `${BASE_URL}/trabajos/${sectorSlug}`,
      },
      types: {
        'application/rss+xml': rssUrl,
      },
    },
    openGraph: {
      title: isEnglish ? `${tituloBase} — ${jobCount} Vacancies` : `${tituloBase} — ${jobCount > 0 ? `${jobCount} Vacantes Disponibles` : 'Vacantes Urgentes'}${isPaged ? ` (Página ${page})` : ''}`,
      description: isEnglish ? `Updated list of ${descBase.toLowerCase()}.` : `Listado actualizado de ${descBase.toLowerCase()}.`,
      url: canonicalUrl,
      images: [
        {
          url: `${BASE_URL}/trabajos/${sectorSlug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${tituloBase}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEnglish ? `${tituloBase} — ${jobCount} Vacancies` : `${tituloBase} — ${jobCount > 0 ? `${jobCount} Vacantes Disponibles` : 'Vacantes Urgentes'}${isPaged ? ` (Página ${page})` : ''}`,
      description: isEnglish ? `List of ${descBase.toLowerCase()}.` : `Listado de ${descBase.toLowerCase()}.`,
      images: [`${BASE_URL}/trabajos/${sectorSlug}/opengraph-image`],
    },
    robots: metaRobots
  };
}

const getJobs = cache(async (tec: string, ciudad: string, dbCategory: string | undefined, experiencia: string = '', modalidad: string = '', page: number = 1) => {
  const limit = 50;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let sql = "SELECT * FROM jobs WHERE is_active = TRUE";
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

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    paramsQuery.push(limit, offset);

    const result = await client.query(sql, paramsQuery);
    return result.rows;
  } catch (error) {
    console.error("Error cargando ofertas de BD:", error);
    return [];
  } finally {
    client.release();
  }
});

async function getFallbackJobs(tec: string, ciudad: string, dbCategory: string | undefined, page: number = 1) {
  if (ciudad && ciudad !== 'remoto') {
    const remoteJobs = await getJobs(tec, 'remoto', dbCategory, '', '', page);
    if (remoteJobs.length > 0) {
      return { jobs: remoteJobs, type: 'remote' };
    }
  }

  if (ciudad) {
    const nationalJobs = await getJobs(tec, '', dbCategory, '', '', page);
    if (nationalJobs.length > 0) {
      return { jobs: nationalJobs, type: 'national' };
    }
  }

  if (tec !== 'informatica-tecnologia') {
    const generalJobs = await getJobs('informatica-tecnologia', '', undefined, '', '', page);
    if (generalJobs.length > 0) {
      return { jobs: generalJobs, type: 'general' };
    }
  }

  return { jobs: [], type: 'none' };
}

function calculateStats(jobs: any[]) {
  let countWithSalary = 0;
  let sumSalary = 0;
  
  for (const job of jobs) {
    if (!job.salary) continue;
    const cleanStr = job.salary.replace(/\./g, '').replace(/\s/g, '');
    const numbers = cleanStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) continue;
    
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
  
  const averageSalary = countWithSalary > 0 ? Math.round(sumSalary / countWithSalary) : null;
  return {
    averageSalary,
    totalCount: jobs.length,
  };
}

export default async function SectorPage({ 
  params, 
  searchParams 
}: { 
  params: Params; 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const { tec, ciudad, experiencia, modalidad, dbCategory } = parseSector(sectorSlug);
  
  let jobs = await getJobs(tec, ciudad, dbCategory, experiencia, modalidad, validPage);
  let isFallback = false;
  let fallbackType = '';

  if (jobs.length === 0) {
    const fallbackResult = await getFallbackJobs(tec, ciudad, dbCategory, validPage);
    jobs = fallbackResult.jobs;
    isFallback = jobs.length > 0;
    fallbackType = fallbackResult.type;
  }
  
  const ad = adMap[tec];
  
  const displayNameMapUsed = isEnglish ? displayNameMapEn : displayNameMap;
  const categoriaBonita = displayNameMapUsed[tec] || dbCategory || tec.replace(/-/g, ' ');
  const expLabelObj = EXPERIENCE_SUFFIXES[experiencia];
  const expLabel = experiencia ? ` ${isEnglish ? expLabelObj?.labelEn : expLabelObj?.label}` : '';
  const modLabel = modalidad === 'hibrido' ? (isEnglish ? ' Hybrid' : ' híbrido') : '';
  const tituloMostrado = ciudad 
    ? (isEnglish ? `${categoriaBonita}${modLabel}${expLabel} in ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` : `${categoriaBonita}${modLabel}${expLabel} en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}`)
    : `${categoriaBonita}${modLabel}${expLabel}`;

  const queryParam = isEnglish ? '?lang=en' : '';

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Jobs' : 'Trabajos', href: `/trabajos/informatica-tecnologia${queryParam}` },
    { label: tituloMostrado }
  ];

  const stats = calculateStats(jobs);

  const CIUDADES_POPULARES = ['madrid', 'barcelona', 'valencia', 'remoto'];
  const TECNOLOGIAS_POPULARES = ['react', 'node', 'python', 'java', 'backend', 'frontend', 'data', 'cloud', 'mobile'];

  const relatedLinks: { label: string, href: string }[] = [];
  if (ciudad) {
    for (const t of TECNOLOGIAS_POPULARES) {
      if (t !== tec) {
        const tLabel = displayNameMapUsed[t] || t.charAt(0).toUpperCase() + t.slice(1);
        const cLabel = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
        relatedLinks.push({
          label: isEnglish ? `${tLabel} in ${cLabel}` : `${tLabel} en ${cLabel}`,
          href: ciudad === 'remoto' ? `/trabajos/${t}-remoto${queryParam}` : `/trabajos/${t}-en-${ciudad.replace(/\s+/g, '-')}${queryParam}`
        });
      }
    }
  } else {
    for (const c of CIUDADES_POPULARES) {
      const tLabel = displayNameMapUsed[tec] || tec.charAt(0).toUpperCase() + tec.slice(1);
      const cLabel = c.charAt(0).toUpperCase() + c.slice(1);
      relatedLinks.push({
        label: isEnglish ? `${tLabel} in ${cLabel}` : `${tLabel} en ${cLabel}`,
        href: c === 'remoto' ? `/trabajos/${tec}-remoto${queryParam}` : `/trabajos/${tec}-en-${c}${queryParam}`
      });
    }
  }

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
    name: isEnglish ? `${tituloMostrado} Vacancies` : `Ofertas de empleo de ${tituloMostrado}`,
    description: isEnglish ? `List of tech job offers for ${tituloMostrado} in Spain` : `Listado de ofertas de trabajo para ${tituloMostrado} en España`,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/job/${getJobSlug(job)}`,
      name: `${job.title} - ${job.company}`
    }))
  };

  const uniqueCompanies = Array.from(new Set(jobs.map(j => j.company).filter(c => c && c !== 'Desconocida'))).slice(0, 3);
  const companyListText = uniqueCompanies.length > 0 
    ? uniqueCompanies.join(', ') 
    : (isEnglish ? 'various tech companies' : 'diversas empresas del sector');

  const faqItems = [
    {
      question: isEnglish 
        ? `Are there active job offers for ${tituloMostrado} currently?` 
        : `¿Hay ofertas de empleo de ${tituloMostrado} actualmente?`,
      answer: isEnglish 
        ? `Yes, currently we have ${jobs.length} active job offers for ${tituloMostrado} on our technology portal. You can search by city or remote preference.` 
        : `Sí, actualmente contamos con ${jobs.length} ofertas de trabajo activas de ${tituloMostrado} en nuestro portal tecnológico. Puedes filtrar por localidad presencial o en remoto.`
    },
    stats.averageSalary ? {
      question: isEnglish 
        ? `What is the average salary for a ${categoriaBonita} profile?` 
        : `¿Cuál es el salario medio de un perfil de ${categoriaBonita}?`,
      answer: isEnglish 
        ? `The estimated average salary for a ${categoriaBonita} professional is approximately ${stats.averageSalary.toLocaleString('es-ES')}€ gross per year, calculated based on active offers that specify a salary.` 
        : `El salario medio estimado para un profesional de la categoría ${categoriaBonita} es de aproximadamente ${stats.averageSalary.toLocaleString('es-ES')}€ brutos anuales, calculado sobre ofertas con salario visible.`
    } : null,
    {
      question: isEnglish 
        ? `Which companies are hiring for ${tituloMostrado}?` 
        : `¿Qué empresas buscan activamente perfiles de ${tituloMostrado}?`,
      answer: isEnglish 
        ? `Some of the companies posting ${tituloMostrado} jobs on our portal recently include: ${companyListText}.` 
        : `Entre las empresas que más vacantes de ${tituloMostrado} publican actualmente en nuestro portal se encuentran: ${companyListText}.`
    },
    {
      question: isEnglish 
        ? `Are remote options available for ${tituloMostrado}?` 
        : `¿Hay opciones de teletrabajo para ${tituloMostrado}?`,
      answer: isEnglish 
        ? `Yes, remote work is a highly demanded option. A significant portion of the vacancies for ${categoriaBonita} offer full remote work or hybrid models.` 
        : `Sí, el teletrabajo es una opción muy común y demandada. Una parte importante de las vacantes de ${categoriaBonita} se publican en modalidad 100% remota o híbrida.`
    }
  ].filter(Boolean) as { question: string; answer: string }[];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      <Breadcrumbs items={breadcrumbItems} />
      
      <h1 className="text-3xl font-bold mb-4 capitalize text-gray-900">
        {isEnglish ? `${tituloMostrado} Job Openings` : `Ofertas de ${tituloMostrado}`}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="md:col-span-2 flex flex-col justify-center">
          <p className="text-gray-700 leading-relaxed m-0">
            {isEnglish ? (
              <>
                If you are looking for a <strong>{categoriaBonita}</strong> job{ciudad ? ` in ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` : ' in Spain'}, you are in the right place. 
                Currently we have <strong>{jobs.length} active offers</strong>. 
                The {categoriaBonita} profile is one of the most demanded in the current tech sector.
                Explore the vacancies below, including on-site, hybrid, and 100% remote options.
              </>
            ) : (
              <>
                Si buscas empleo de <strong>{categoriaBonita}</strong>{ciudad ? ` en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` : ' en España'}, estás en el lugar indicado. 
                Actualmente contamos con <strong>{jobs.length} ofertas activas</strong>. 
                El perfil de {categoriaBonita} es uno de los más demandados en el sector tecnológico actual.
                Explora las vacantes a continuación, que incluyen opciones tanto presenciales en oficina como en formato híbrido o 100% remoto.
              </>
            )}
          </p>
          {TECH_DESCRIPTIONS[tec.toLowerCase()] && (
            <p className="text-gray-500 text-xs md:text-sm mt-3 leading-relaxed border-t border-gray-100 pt-3">
              {isEnglish 
                ? TECH_DESCRIPTIONS[tec.toLowerCase()].en 
                : TECH_DESCRIPTIONS[tec.toLowerCase()].es}
            </p>
          )}
        </div>
        <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider m-0 mb-1">
            {isEnglish ? 'Category Stats' : 'Estadísticas de la categoría'}
          </h3>
          <p className="text-3xl font-extrabold text-indigo-700 m-0">
            {stats.averageSalary ? `${stats.averageSalary.toLocaleString('es-ES')}€` : 'N/A'}
          </p>
          <span className="text-xs text-gray-500 mt-1">
            {isEnglish ? 'Estimated average annual salary' : 'Salario medio anual estimado'}
          </span>
          <span className="text-[10px] text-gray-400 mt-2">
            {isEnglish ? 'Based on active offers with visible salary' : 'Basado en ofertas actuales con sueldo visible'}
          </span>
        </div>
      </div>

      {ad && !ciudad && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-lg font-bold text-indigo-900">{ad.title}</h3>
          <p className="text-indigo-700 mb-3">{ad.text}</p>
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            {isEnglish ? 'View Recommended Course →' : 'Ver Curso Recomendado →'}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {isFallback && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold m-0">
                  {isEnglish 
                    ? `No vacancies found for ${categoriaBonita} in ${ciudad === 'remoto' ? 'remote' : ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}.`
                    : `No encontramos ofertas de ${categoriaBonita} en ${ciudad === 'remoto' ? 'remoto' : ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}.`}
                </p>
                <p className="text-amber-800 text-xs mt-1 mb-0 leading-relaxed">
                  {fallbackType === 'remote' && (isEnglish ? 'Showing 100% remote job offers instead:' : 'Te mostramos ofertas 100% en remoto como alternativa:')}
                  {fallbackType === 'national' && (isEnglish ? 'Showing job offers in other cities in Spain:' : 'Te mostramos ofertas en otras ciudades de España:')}
                  {fallbackType === 'general' && (isEnglish ? 'No active offers in this category. Here are general recent IT jobs:' : 'No hay ofertas activas de esta categoría. Te sugerimos las ofertas de empleo IT generales más recientes:')}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs && jobs.length > 0 ? (
              <>
                {jobs.flatMap((job, index) => {
                  const card = <JobCard key={job.id} job={job as Job} lang={lang} />;
                  if (index === 3) {
                    return [
                      <div key={`ad-inline-1-${job.id}`} className="col-span-full my-2">
                        <AdBanner variant="inline" />
                      </div>,
                      card
                    ];
                  }
                  if (index === 9) {
                    return [
                      <div key={`ad-inline-2-${job.id}`} className="col-span-full my-2">
                        <AdBanner variant="inline" />
                      </div>,
                      card
                    ];
                  }
                  return [card];
                })}
                
                <div className="col-span-full flex justify-between items-center pt-6">
                  {validPage > 1 ? (
                    <Link
                      href={`/trabajos/${sector}?page=${validPage - 1}${queryParam ? `&lang=en` : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {isEnglish ? '← Previous' : '← Anterior'}
                    </Link>
                  ) : (
                    <div />
                  )}
                  <span className="text-sm text-gray-600">
                    {isEnglish ? `Page ${validPage}` : `Página ${validPage}`}
                  </span>
                  {jobs.length === 50 ? (
                    <Link
                      href={`/trabajos/${sector}?page=${validPage + 1}${queryParam ? `&lang=en` : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {isEnglish ? 'Next →' : 'Siguiente →'}
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">
                  {isEnglish ? `No offers for ${tituloMostrado} right now.` : `No hay ofertas de ${tituloMostrado} ahora mismo.`}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {isEnglish ? 'Check back tomorrow at 08:00.' : 'Vuelve mañana a las 08:00.'}
                </p>
              </div>
            )}
            {jobs && jobs.length > 0 && (
              <div className="mt-8">
                <AdBanner variant="multiplex" />
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <SubscribeForm location={ciudad ? ciudad : tec} />
            <PushSubscribe />
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>

      {/* FAQ Visual para SEO y E-E-A-T (Oportunidad 1.6) */}
      {faqItems.length > 0 && (
        <div className="mt-12 bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>❓</span> {isEnglish ? `FAQ about ${tituloMostrado} Jobs` : `Preguntas Frecuentes sobre Empleo de ${tituloMostrado}`}
          </h2>
          <div className="space-y-6 divide-y divide-gray-100">
            {faqItems.map((item, idx) => (
              <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                <h3 className="text-base font-bold text-gray-800 mb-2">{item.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed m-0">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {relatedLinks.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {isEnglish ? 'Popular Related Searches' : 'Búsquedas populares relacionadas'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link, idx) => (
              <Link 
                key={idx}
                href={link.href}
                className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-3 py-2 rounded-lg font-medium transition-colors border border-gray-200"
              >
                🔍 {isEnglish ? `Jobs for ${link.label}` : `Ofertas de ${link.label}`}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
