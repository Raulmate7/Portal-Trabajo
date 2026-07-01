import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import pool from '@/lib/db';
import { getBlogPosts } from '@/lib/blog';
import Link from 'next/link';
import { cache } from 'react';
import ShareButton from '@/components/ShareButton';
import CourseAffiliate from '@/components/CourseAffiliate';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import PushSubscribe from '@/components/PushSubscribe';
import { ReferralWidget } from '@/components/Widgets';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';
import { getJobSlug, getNumericId } from '@/lib/slug';
import SaveJobButton from '@/components/SaveJobButton';
import ReactionButton from '@/components/ReactionButton';
import { getJobReactions } from '@/app/actions';
import ApplyButton from '@/components/ApplyButton';
import CompanyLogo from '@/components/CompanyLogo';
import { RecentlyViewedTracker } from '@/components/RecentlyViewed';

export const revalidate = 60;

const TECNOLOGIAS = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'php', 'csharp', 'ruby', 'go', 
  'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'backend', 'frontend', 
  'data', 'cloud', 'mobile', 'nextjs', 'flutter', 'kotlin', 'swift', 'sql', 'salesforce', 
  'cybersecurity'
];

const DISPLAY_NAMES: Record<string, string> = {
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
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data',
  'cloud': 'Cloud',
  'mobile': 'Mobile'
};

function textToHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .split('\n')
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return `<li>${trimmed.substring(1).trim()}</li>`;
      }
      return `<p>${trimmed}</p>`;
    })
    .filter(Boolean)
    .join('')
    .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
}

function autoLinkDescription(desc: string | null | undefined, isEnglish: boolean): string {
  if (!desc) return '';
  
  let escaped = desc
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    
  const keywords = [
    { name: 'React', slug: 'react' },
    { name: 'Angular', slug: 'angular' },
    { name: 'Vue', slug: 'vue' },
    { name: 'Node.js', slug: 'node' },
    { name: 'Nodejs', slug: 'node' },
    { name: 'Python', slug: 'python' },
    { name: 'Java', slug: 'java' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'Docker', slug: 'docker' },
    { name: 'Kubernetes', slug: 'kubernetes' },
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'Nextjs', slug: 'nextjs' },
    { name: 'Flutter', slug: 'flutter' },
    { name: 'Kotlin', slug: 'kotlin' },
    { name: 'Swift', slug: 'swift' },
    { name: 'SQL', slug: 'sql' },
    { name: 'DevOps', slug: 'cloud' },
    { name: 'AWS', slug: 'aws' },
    { name: 'Ciberseguridad', slug: 'cybersecurity' },
    { name: 'Cybersecurity', slug: 'cybersecurity' }
  ];

  const sortedKeywords = [...keywords].sort((a, b) => b.name.length - a.name.length);

  for (const kw of sortedKeywords) {
    const regex = new RegExp(`(?<![\\w\\-\\/])(${kw.name.replace('.', '\\.')})(?![\\w\\-\\/])`, 'i');
    const match = escaped.match(regex);
    if (match) {
      const matchedText = match[0];
      const placeholder = `___LINK_${kw.slug}_START___${matchedText}___LINK_${kw.slug}_END___`;
      escaped = escaped.replace(regex, placeholder);
    }
  }

  for (const kw of sortedKeywords) {
    const regexPlaceholder = new RegExp(`___LINK_${kw.slug}_START___(.*?)___LINK_${kw.slug}_END___`, 'g');
    const queryParam = isEnglish ? '?lang=en' : '';
    escaped = escaped.replace(regexPlaceholder, `<a href="/trabajos/${kw.slug}${queryParam}" class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">$1</a>`);
  }

  return escaped;
}

function detectTechnology(title: string, desc: string): string | null {
  const text = `${title} ${desc}`.toLowerCase();
  for (const tec of TECNOLOGIAS) {
    if (tec === 'csharp' && (text.includes('c#') || text.includes('c-sharp') || text.includes('csharp'))) {
      return 'csharp';
    }
    if (tec === 'nextjs' && (text.includes('next.js') || text.includes('nextjs') || text.includes('next-js'))) {
      return 'nextjs';
    }
    const regex = new RegExp(`\\b${tec}\\b`, 'i');
    if (regex.test(text)) {
      return tec;
    }
  }
  return null;
}

async function getRelatedBlogPost(title: string, desc: string, isRemote: boolean) {
  const posts = await getBlogPosts();
  const text = `${title} ${desc}`.toLowerCase();
  
  if (text.includes('react')) {
    const p = posts.find(post => post.slug === 'como-superar-entrevista-tecnica-react');
    if (p) return p;
  }
  if (text.includes('java')) {
    const p = posts.find(post => post.slug === 'guia-superar-entrevista-tecnica-java-spring-boot');
    if (p) return p;
  }
  if (text.includes('python')) {
    const p = posts.find(post => post.slug === 'salario-python-espana-2026');
    if (p) return p;
  }
  if (text.includes('backend') || text.includes('node') || text.includes('django') || text.includes('spring')) {
    const p = posts.find(post => post.slug === 'tecnologias-backend-mas-demandadas-espana-2026');
    if (p) return p;
  }
  if (text.includes('data') || text.includes('inteligencia artificial') || text.includes('machine learning') || text.includes(' ia ') || text.includes(' ai ')) {
    const p = posts.find(post => post.slug === 'trabajo-data-scientist-inteligencia-artificial');
    if (p) return p;
  }

  if (isRemote) {
    const p = posts.find(post => post.slug === 'trabajo-remoto-programadores-espana');
    if (p) return p;
  }

  return posts.find(post => post.slug === 'como-optimizar-cv-programador-filtros-ats') || posts[0] || null;
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedParams.id;
  const numericId = getNumericId(idParam);

  const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(numericId) || /^\d+$/.test(numericId);
  if (!isValidId) {
    return { title: 'Oferta no encontrada' };
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT id, title, company, location, description_snippet, is_active, created_at, title_es, description_snippet_es FROM jobs WHERE id = $1",
      [numericId]
    );

    const job = res.rows[0];
    if (!job) return { title: 'Oferta no encontrada' };

    const lang = resolvedSearchParams?.lang === 'en' ? 'en' : 'es';
    const isEnglish = lang === 'en';

    const displayTitle = isEnglish ? job.title : (job.title_es || job.title);
    const displayDesc = isEnglish ? job.description_snippet : (job.description_snippet_es || job.description_snippet);
    const titulo = isEnglish 
      ? `${displayTitle} in ${job.location}` 
      : `${displayTitle} en ${job.location}`;
    const desc = isEnglish 
      ? `Job opportunity at ${job.company}. ${displayDesc?.substring(0, 130) ?? ''}...`
      : `Oportunidad laboral en ${job.company}. ${displayDesc?.substring(0, 130) ?? ''}...`;

    const isOld = (new Date().getTime() - new Date(job.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
    const isExpired = job.is_active === false || isOld;

    const correctSlug = getJobSlug(job);
    const canonicalUrl = isEnglish 
      ? `${BASE_URL}/job/${correctSlug}?lang=en` 
      : `${BASE_URL}/job/${correctSlug}`;

    return {
      title: isEnglish ? `${titulo} | IT Job Portal` : `${titulo} | Portal Empleo`,
      description: desc,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'es-ES': `${BASE_URL}/job/${correctSlug}`,
          'en': `${BASE_URL}/job/${correctSlug}?lang=en`,
          'x-default': `${BASE_URL}/job/${correctSlug}`,
        },
        types: {
          'application/rss+xml': `${BASE_URL}/feed.xml`,
        },
      },
      robots: {
        index: isExpired ? false : true,
        follow: true,
      },
      openGraph: {
        title: titulo,
        description: desc,
        url: canonicalUrl,
        siteName: 'Portal Trabajo IT',
        locale: isEnglish ? 'en_US' : 'es_ES',
        type: 'website',
        images: [
          {
            url: `${BASE_URL}/job/${correctSlug}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: `Oferta de empleo: ${titulo}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: titulo,
        description: desc,
        images: [`${BASE_URL}/job/${correctSlug}/opengraph-image`],
      },
    };
  } catch (e) {
    return { title: 'Portal de Empleo' };
  } finally {
    client.release();
  }
}

const getJob = cache(async (id: string) => {
  if (!process.env.DATABASE_URL && !process.env.DB_PROXY_URL && !process.env.MYSQL_USER) return null;
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
});

async function getSimilarJobs(currentId: string, category: string | null, title: string, limit: number = 3) {
  if (!process.env.DATABASE_URL && !process.env.DB_PROXY_URL && !process.env.MYSQL_USER) return [];
  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, title_es, company, location, salary, created_at FROM jobs WHERE id != $1 AND is_active = TRUE";
    const params: (string | number)[] = [currentId];
    let paramIndex = 2;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    } else {
      const firstWord = title.split(' ')[0];
      if (firstWord && firstWord.length > 2) {
        sql += ` AND title ILIKE $${paramIndex}`;
        params.push(`%${firstWord}%`);
        paramIndex++;
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const res = await client.query(sql, params);
    return res.rows;
  } catch (error) {
    console.error('Error cargando ofertas similares:', error);
    return [];
  } finally {
    client.release();
  }
}

function extractSource(descriptionSnippet: string | null | undefined): string {
  if (!descriptionSnippet) return 'Internet';
  const match = descriptionSnippet.match(/^\[Fuente:\s*(.+?)\]/);
  return match ? match[1] : 'Internet';
}

function parseSalarySchema(salaryStr: string | null | undefined): any {
  if (!salaryStr) return null;
  
  const cleanStr = salaryStr.toLowerCase().replace(/\./g, '').replace(/\s/g, '');
  
  const numbers = cleanStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  
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

export default async function JobPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const idParam = resolvedParams.id;
  const numericId = getNumericId(idParam);

  const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(numericId) || /^\d+$/.test(numericId);
  if (!isValidId) {
    notFound();
  }

  const job = await getJob(numericId);

  if (!job) {
    notFound();
  }

  const isOld = (new Date().getTime() - new Date(job.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
  const isExpired = job.is_active === false || isOld;

  const correctSlug = getJobSlug(job);
  const lang = resolvedSearchParams?.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  // Redirección permanente si la URL no contiene el slug descriptivo correcto
  if (idParam !== correctSlug) {
    const queryStr = isEnglish ? '?lang=en' : '';
    permanentRedirect(`/job/${correctSlug}${queryStr}`);
  }

  const similarJobs = await getSimilarJobs(numericId, job.category, job.title, 3);
  const reactions = await getJobReactions(job.id);

  const hasTranslation = !!job.title_es && !isEnglish;
  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);
  const displayDesc = isEnglish ? job.description_snippet : (job.description_snippet_es || job.description_snippet);

  const sourceLabel = extractSource(job.description_snippet);

  const detectedTec = detectTechnology(job.title, job.description_snippet || '');
  const tecLabel = detectedTec ? (DISPLAY_NAMES[detectedTec] || detectedTec) : null;

  const cleanLocation = job.location ? job.location.toLowerCase().trim() : '';
  const isRemoteLoc = cleanLocation.includes('remoto') || cleanLocation.includes('teletrabajo') || cleanLocation.includes('remote');
  const locationSlug = isRemoteLoc ? 'remoto' : correctSlug.split('-').slice(-2, -1)[0] || 'espana'; // usar ciudad del slug
  
  const queryParam = isEnglish ? '?lang=en' : '';
  const sectorUrl = detectedTec ? `/trabajos/${detectedTec}${queryParam}` : null;
  const sectorLocationUrl = detectedTec 
    ? (isRemoteLoc ? `/trabajos/${detectedTec}-remoto${queryParam}` : `/trabajos/${detectedTec}-en-${locationSlug}${queryParam}`)
    : null;

  const textForInference = `${job.title} ${job.description_snippet || ''}`.toLowerCase();
  const isRemote = textForInference.includes('remoto') || textForInference.includes('teletrabajo') || textForInference.includes('remote');
  const employmentTypes = inferEmploymentTypes(textForInference);
  const relatedBlogPost = await getRelatedBlogPost(job.title, job.description_snippet || '', isRemote);

  const datePosted = new Date(job.created_at);
  const validThroughDate = new Date(datePosted.getTime() + 45 * 24 * 60 * 60 * 1000);

  const baseSalaryObj = parseSalarySchema(job.salary);

  let countryCode = 'ES';
  const cleanLocationForLd = job.location ? job.location.toLowerCase().trim() : '';
  const isGlobalSource = ['weworkremotely', 'remotive', 'himalayas', 'python.org', 'workingnomads', 'remoteok'].includes(sourceLabel.toLowerCase());
  const mentionsSpain = cleanLocationForLd.includes('spain') || cleanLocationForLd.includes('españa') || cleanLocationForLd.includes('madrid') || cleanLocationForLd.includes('barcelona');

  if (cleanLocationForLd.includes('usa') || cleanLocationForLd.includes('united states') || cleanLocationForLd.includes('eeuu') || cleanLocationForLd.includes('ee.uu.')) {
    countryCode = 'US';
  } else if (cleanLocationForLd.includes('germany') || cleanLocationForLd.includes('alemania')) {
    countryCode = 'DE';
  } else if (cleanLocationForLd.includes('united kingdom') || cleanLocationForLd.includes('uk') || cleanLocationForLd.includes('reino unido') || cleanLocationForLd.includes('london')) {
    countryCode = 'GB';
  } else if (cleanLocationForLd.includes('canada')) {
    countryCode = 'CA';
  } else if (cleanLocationForLd.includes('france') || cleanLocationForLd.includes('francia')) {
    countryCode = 'FR';
  } else if (cleanLocationForLd.includes('netherlands') || cleanLocationForLd.includes('holanda') || cleanLocationForLd.includes('países bajos')) {
    countryCode = 'NL';
  } else if (cleanLocationForLd.includes('portugal')) {
    countryCode = 'PT';
  } else if (cleanLocationForLd.includes('italy') || cleanLocationForLd.includes('italia')) {
    countryCode = 'IT';
  } else if (cleanLocationForLd.includes('argentina')) {
    countryCode = 'AR';
  } else if (cleanLocationForLd.includes('mexico') || cleanLocationForLd.includes('méxico')) {
    countryCode = 'MX';
  } else if (cleanLocationForLd.includes('colombia')) {
    countryCode = 'CO';
  } else if (cleanLocationForLd.includes('chile')) {
    countryCode = 'CL';
  } else if (isGlobalSource && !mentionsSpain) {
    countryCode = 'US';
  }

  const isWorldwide = cleanLocationForLd.includes('worldwide') || cleanLocationForLd.includes('global') || cleanLocationForLd.includes('anywhere') || cleanLocationForLd.includes('todo el mundo');

  const titleLower = job.title.toLowerCase();
  let expRequirements = undefined;
  if (titleLower.includes('junior') || titleLower.includes('jr') || titleLower.includes('sin experiencia')) {
    expRequirements = {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": 12
    };
  } else if (titleLower.includes('senior') || titleLower.includes('sr') || titleLower.includes('lead')) {
    expRequirements = {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": 36
    };
  }

  const hiringOrgName = (job.company && job.company !== 'Desconocida') 
    ? job.company 
    : (sourceLabel && sourceLabel !== 'Internet' ? sourceLabel : 'Portal Trabajo IT');

  let postalCode = '28001';
  let streetAddress = 'Calle Gran Vía, 1';
  let addressRegion = 'Madrid';

  const cleanLocForAddress = (job.location || '').toLowerCase();
  if (cleanLocForAddress.includes('barcelona') || cleanLocForAddress.includes('bcn')) {
    addressRegion = 'Barcelona';
    postalCode = '08001';
    streetAddress = 'La Rambla, 1';
  } else if (cleanLocForAddress.includes('valencia')) {
    addressRegion = 'Valencia';
    postalCode = '46001';
    streetAddress = 'Plaza del Ayuntamiento, 1';
  } else if (cleanLocForAddress.includes('sevilla')) {
    addressRegion = 'Sevilla';
    postalCode = '41001';
    streetAddress = 'Avenida de la Constitución, 1';
  } else if (cleanLocForAddress.includes('bilbao')) {
    addressRegion = 'Bizkaia';
    postalCode = '48001';
    streetAddress = 'Gran Vía de Don Diego López de Haro, 1';
  } else if (cleanLocForAddress.includes('málaga') || cleanLocForAddress.includes('malaga')) {
    addressRegion = 'Málaga';
    postalCode = '29001';
    streetAddress = 'Calle Larios, 1';
  }

  let fallbackSalaryObj: any = null;
  if (!baseSalaryObj) {
    let estMin = 30000;
    let estMax = 45000;

    const tLower = job.title.toLowerCase();
    if (tLower.includes('senior') || tLower.includes('sr') || tLower.includes('lead') || tLower.includes('principal') || tLower.includes('architect')) {
      estMin = 45000;
      estMax = 70000;
    } else if (tLower.includes('junior') || tLower.includes('becario') || tLower.includes('trainee') || tLower.includes('jr') || tLower.includes('prácticas') || tLower.includes('sin experiencia')) {
      estMin = 22000;
      estMax = 30000;
    }

    if (detectedTec === 'react' || detectedTec === 'typescript' || detectedTec === 'node') {
      estMin = Math.round(estMin * 1.05);
      estMax = Math.round(estMax * 1.05);
    } else if (detectedTec === 'aws' || detectedTec === 'docker' || detectedTec === 'kubernetes' || detectedTec === 'cloud' || detectedTec === 'devops') {
      estMin = Math.round(estMin * 1.15);
      estMax = Math.round(estMax * 1.15);
    }

    fallbackSalaryObj = {
      "@type": "MonetaryAmount",
      "currency": job.salary_currency || "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": estMin,
        "maxValue": estMax,
        "unitText": "YEAR"
      }
    };
  }

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: displayTitle,
    description: textToHtml(displayDesc) || `Oferta de empleo para ${displayTitle} en ${hiringOrgName}`,
    datePosted: datePosted.toISOString(),
    validThrough: validThroughDate.toISOString(),
    hiringOrganization: { 
      '@type': 'Organization', 
      name: hiringOrgName
    },
    identifier: {
      '@type': 'PropertyValue',
      name: hiringOrgName,
      value: `job-${job.id}`
    },
    jobLocation: {
      '@type': 'Place',
      address: { 
        '@type': 'PostalAddress', 
        addressLocality: job.location || 'Madrid', 
        addressRegion: addressRegion,
        postalCode: postalCode,
        streetAddress: streetAddress,
        addressCountry: countryCode 
      },
    },
    employmentType: employmentTypes,
    directApply: true,
    industry: "Information Technology",
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.job-description']
    }
  };

  if (tecLabel) {
    jsonLd.skills = [tecLabel];
  }

  if (expRequirements) {
    jsonLd.experienceRequirements = expRequirements;
  }

  // URL canónica de la oferta (campo requerido por Google para Rich Results)
  jsonLd.url = `${BASE_URL}/job/${correctSlug}`;

  // Moneda del salario explícita (mejora la precisión del Rich Result de salario)
  if (baseSalaryObj) {
    const currency = job.salary_currency || 'EUR';
    baseSalaryObj.currency = currency;
    jsonLd.baseSalary = baseSalaryObj;
  } else if (fallbackSalaryObj) {
    jsonLd.baseSalary = fallbackSalaryObj;
  }

  // Beneficios para trabajo remoto
  if (isRemote) {
    jsonLd.jobBenefits = isEnglish
      ? 'Remote work (telecommute), flexible schedule'
      : 'Teletrabajo (trabajo remoto), horario flexible';
    jsonLd.jobLocationType = 'TELECOMMUTE';
    if (!isWorldwide) {
      jsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: countryCode
      };
    }
  }

  // Requisitos formativos inferidos del título
  const titleForEdu = job.title.toLowerCase();
  if (
    titleForEdu.includes('junior') ||
    titleForEdu.includes('becario') ||
    titleForEdu.includes('trainee') ||
    titleForEdu.includes('prácticas')
  ) {
    jsonLd.educationRequirements = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: isEnglish ? 'bachelor degree' : 'grado universitario o FP Superior'
    };
  } else if (
    titleForEdu.includes('senior') ||
    titleForEdu.includes('lead') ||
    titleForEdu.includes('architect')
  ) {
    jsonLd.educationRequirements = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: isEnglish ? 'bachelor degree' : 'grado universitario'
    };
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isEnglish ? 'Home' : 'Inicio',
        item: isEnglish ? `${BASE_URL}/?lang=en` : BASE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isEnglish ? 'Jobs' : 'Ofertas',
        item: isEnglish ? `${BASE_URL}/trabajos/informatica-tecnologia?lang=en` : `${BASE_URL}/trabajos/informatica-tecnologia`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayTitle,
        item: isEnglish ? `${BASE_URL}/job/${correctSlug}?lang=en` : `${BASE_URL}/job/${correctSlug}`
      }
    ]
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': isEnglish 
          ? `Are there vacancies for ${displayTitle} at ${hiringOrgName} currently?`
          : `¿Hay vacantes de ${displayTitle} en ${hiringOrgName} actualmente?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': isEnglish 
            ? `Yes, the job offer for ${displayTitle} at ${hiringOrgName} is available and active on our portal.`
            : `Sí, la oferta para ${displayTitle} en ${hiringOrgName} está disponible y activa en nuestro portal.`
        }
      },
      {
        '@type': 'Question',
        'name': isEnglish 
          ? `What is the salary for the position of ${displayTitle}?`
          : `¿Cuál es el salario para el puesto de ${displayTitle}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': isEnglish 
            ? `The salary for this job offer is ${job.salary && job.salary !== 'Consultar' ? job.salary : 'to be negotiated directly with the hiring company'}.`
            : `El salario para esta oferta de empleo es de ${job.salary && job.salary !== 'Consultar' ? job.salary : 'a consultar directamente con la empresa contratante'}.`
        }
      },
      {
        '@type': 'Question',
        'name': isEnglish 
          ? `Where is the job located for ${displayTitle}?`
          : `¿Dónde está ubicado el puesto de trabajo de ${displayTitle}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': isEnglish 
            ? `The job is located in ${job.location || 'remote (telecommuting)'}.`
            : `El empleo está ubicado en ${job.location || 'remoto (teletrabajo)'}.`
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <RecentlyViewedTracker job={{ id: job.id, title: displayTitle, company: job.company, location: job.location, salary: job.salary }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
            { label: isEnglish ? 'Jobs' : 'Ofertas', href: isEnglish ? '/trabajos/informatica-tecnologia?lang=en' : '/trabajos/informatica-tecnologia' },
            { label: displayTitle }
          ]} 
        />
        
        <div className="flex justify-between items-center mb-6">
          <Link href={isEnglish ? '/?lang=en' : '/'} className="text-indigo-600 hover:underline inline-flex items-center gap-2 font-medium">
            {isEnglish ? '← Back to search' : '← Volver al buscador'}
          </Link>

          <ShareButton title={displayTitle} company={job.company} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {isExpired && (
              <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-start gap-4">
                <span className="text-3xl shrink-0">⚠️</span>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">
                    {isEnglish ? 'This job offer has expired or is more than 30 days old' : 'Esta oferta de empleo ha expirado o tiene más de 30 días'}
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {isEnglish 
                      ? 'It is very likely that this position is already filled. We recommend checking the recommended similar offers at the bottom of the page to find active vacancies.'
                      : 'Es muy probable que este puesto ya esté cubierto. Te recomendamos revisar las ofertas recomendadas de la misma categoría en la parte inferior de la página para encontrar vacantes activas.'}
                  </p>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                <CompanyLogo company={job.company} size={16} />
                <div className="flex-grow">
                  <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight flex flex-wrap items-center gap-2">
                    {displayTitle}
                    {hasTranslation && (
                      <span className="inline-flex items-center text-[10px] bg-white/20 text-white px-2 py-0.5 rounded border border-white/10 font-bold uppercase tracking-wider" title={`Título original: ${job.title}`}>
                        🤖 Traducido
                      </span>
                    )}
                  </h1>
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
            </div>

              <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {isEnglish ? 'Job Description' : 'Descripción del puesto'}
                </h2>
                <div className="prose max-w-none text-gray-650 mb-8 leading-relaxed job-description">
                  {displayDesc ? (
                    <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: autoLinkDescription(displayDesc, isEnglish) }} />
                  ) : (
                    <p className="whitespace-pre-line">
                      {isEnglish ? 'View details on original website.' : 'Ver detalles en la web original.'}
                    </p>
                  )}
                  {hasTranslation && (
                    <p className="text-xs text-gray-400 italic mt-6 border-t border-gray-100 pt-3 flex items-center gap-1.5">
                      <span>🤖</span> Oferta traducida automáticamente al español. <a href={job.url_source} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold">Ver original</a>
                    </p>
                  )}
                </div>

                {relatedBlogPost && (
                  <div className="mb-8 p-5 bg-gradient-to-br from-indigo-50 via-indigo-50/70 to-white border border-indigo-100 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <span className="text-2xl shrink-0">📖</span>
                    <div>
                      <h4 className="font-extrabold text-indigo-950 text-sm mb-1">
                        {isEnglish ? 'Recommended Career Guide:' : 'Guía de Empleo Recomendada:'}
                      </h4>
                      <Link 
                        href={`/blog/${relatedBlogPost.slug}${queryParam}`}
                        className="text-base font-bold text-indigo-705 hover:text-indigo-900 hover:underline"
                      >
                        {relatedBlogPost.title}
                      </Link>
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-normal">
                        {relatedBlogPost.excerpt}
                      </p>
                    </div>
                  </div>
                )}

                {/* Enlaces de Interlinking de SEO */}
                {detectedTec && tecLabel && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed mb-8">
                    <span className="font-bold text-gray-700 block mb-1">
                      {isEnglish ? '🔍 Related Searches:' : '🔍 Búsquedas Relacionadas:'}
                    </span>
                    {isEnglish ? 'Looking for more opportunities? Explore jobs for ' : '¿Buscas más oportunidades? Explora ofertas de '}
                    <Link href={sectorUrl!} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline capitalize">
                      {tecLabel}
                    </Link>
                    {job.location && (
                      <>
                        {isEnglish ? ' or ' : ' o '}
                        <Link href={sectorLocationUrl!} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline capitalize">
                          {tecLabel} {isRemoteLoc ? (isEnglish ? 'remote' : 'en remoto') : (isEnglish ? `in ${job.location}` : `en ${job.location}`)}
                        </Link>
                      </>
                    )}
                    . {isEnglish ? 'You can also view all offers for ' : ' También puedes ver todas las ofertas de y para '}
                    <Link href="/trabajos/informatica-tecnologia" className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">
                      {isEnglish ? 'IT and Technology' : 'Informática y Tecnología'}
                    </Link>.
                  </div>
                )}

                <CourseAffiliate title={job.title} />

                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center mt-8">
                  <p className="text-indigo-900 mb-4 text-sm font-medium">
                    {isEnglish ? (
                      <>This offer was found on <strong>{sourceLabel}</strong></>
                    ) : (
                      <>Esta oferta fue encontrada en <strong>{sourceLabel}</strong></>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <ApplyButton url={job.url_source} company={job.company} title={displayTitle} lang={lang} />
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
                      <SaveJobButton job={job} variant="detail" />
                      <ReactionButton jobId={job.id} initialLikes={reactions.likes} initialDislikes={reactions.dislikes} />
                    </div>
                  </div>
                </div>

                <AdBanner variant="multiplex" />
              </div>
            </div>

            {/* Banner publicitario inline adicional antes de recomendados */}
            <div className="my-6">
              <AdBanner variant="inline" />
            </div>

            {/* Ofertas Recomendadas */}
            {similarJobs && similarJobs.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>💼</span> {isEnglish ? 'Recommended similar job offers' : 'Ofertas de empleo similares recomendadas'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {similarJobs.map((simJob: any) => {
                    const simSlug = getJobSlug(simJob);
                    const simUrl = `/job/${simSlug}${queryParam}`;
                    const displaySimTitle = isEnglish ? simJob.title : (simJob.title_es || simJob.title);
                    return (
                      <div key={simJob.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <Link href={simUrl} className="font-bold text-indigo-900 hover:text-indigo-600 transition-colors line-clamp-1">
                            {displaySimTitle}
                          </Link>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            🏢 {simJob.company} · 📍 {simJob.location} {simJob.salary && simJob.salary !== 'Consultar' && `· 💰 ${simJob.salary}`}
                          </p>
                        </div>
                        <Link 
                          href={simUrl} 
                          className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold rounded-lg text-center"
                        >
                          {isEnglish ? 'View offer' : 'Ver oferta'}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-6">
              <SubscribeForm 
                location={job.location || 'España'} 
                defaultTech={detectedTec || undefined}
                defaultLocation={isRemote ? 'remoto' : undefined}
              />
              <PushSubscribe />
              <ReferralWidget lang={lang} />
              <div className="lg:sticky lg:top-24">
                <AdBanner variant="sidebar" />
              </div>
            </div>
          </div>
        </div>

        {/* Enlaces de Interlinking Popular */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
            {isEnglish ? '🔍 Most Searched IT Jobs' : '🔍 Empleos IT más buscados'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-500">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">{isEnglish ? 'Core Technologies' : 'Tecnologías Principales'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/trabajos/react${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'React Jobs' : 'Ofertas de React'}</Link></li>
                <li><Link href={`/trabajos/node${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Node.js Jobs' : 'Ofertas de Node.js'}</Link></li>
                <li><Link href={`/trabajos/python${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Python Jobs' : 'Ofertas de Python'}</Link></li>
                <li><Link href={`/trabajos/java${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Java Jobs' : 'Ofertas de Java'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">{isEnglish ? 'Infrastructure & DevOps' : 'Infraestructura y DevOps'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/trabajos/aws${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'AWS Jobs' : 'Ofertas de AWS'}</Link></li>
                <li><Link href={`/trabajos/docker${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Docker Jobs' : 'Ofertas de Docker'}</Link></li>
                <li><Link href={`/trabajos/kubernetes${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Kubernetes Jobs' : 'Ofertas de Kubernetes'}</Link></li>
                <li><Link href={`/trabajos/cloud${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Cloud Jobs' : 'Ofertas de Cloud Computing'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">{isEnglish ? 'Jobs by Location' : 'Empleos por Ubicación'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/trabajos/informatica-tecnologia-remoto${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? '100% Remote Jobs' : 'Trabajo 100% Remoto'}</Link></li>
                <li><Link href={`/trabajos/informatica-tecnologia-en-madrid${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Jobs in Madrid' : 'Trabajo en Madrid'}</Link></li>
                <li><Link href={`/trabajos/informatica-tecnologia-en-barcelona${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Jobs in Barcelona' : 'Trabajo en Barcelona'}</Link></li>
                <li><Link href={`/trabajos/informatica-tecnologia-en-valencia${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Jobs in Valencia' : 'Trabajo en Valencia'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">{isEnglish ? 'Other Links' : 'Otros Enlaces de Interés'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/salarios${queryParam}`} className="hover:text-indigo-650 hover:underline font-bold text-indigo-600">{isEnglish ? 'IT Salary Calculator' : 'Calculadora de Salarios IT'}</Link></li>
                <li><Link href={`/empresas${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Company Directory' : 'Directorio de Empresas'}</Link></li>
                <li><Link href={`/blog${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Career Advice (Blog)' : 'Consejos de Empleo (Blog)'}</Link></li>
                <li><Link href={`/talento-premium${queryParam}`} className="hover:text-indigo-650 hover:underline">{isEnglish ? 'Register as Candidate' : 'Registrarme como Candidato'}</Link></li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
