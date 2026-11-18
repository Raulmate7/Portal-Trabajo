import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import pool from '@/lib/db';
import { getBlogPosts } from '@/lib/blog';
import Link from 'next/link';
import { cache } from 'react';
import ShareButton from '@/components/ShareButton';
import CourseAffiliate from '@/components/CourseAffiliate';
import AmazonBooksWidget from '@/components/AmazonBooksWidget';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import PushSubscribe from '@/components/PushSubscribe';
import { ReferralWidget } from '@/components/Widgets';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL, safeJsonLdString } from '@/lib/constants';
import { getJobSlug, getNumericId, slugify } from '@/lib/slug';
import SaveJobButton from '@/components/SaveJobButton';
import ReactionButton from '@/components/ReactionButton';
import { getJobReactions } from '@/app/actions';
import ApplyButton from '@/components/ApplyButton';
import CompanyLogo from '@/components/CompanyLogo';
import Image from 'next/image';
import { RecentlyViewedTracker } from '@/components/RecentlyViewed';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import { getCurrentUser } from '@/lib/userAuth';

export const revalidate = 3600; // Cache de 1 hora — las ofertas individuales no cambian con frecuencia; las nuevas se indexan vía Google Indexing API

const TECNOLOGIAS = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'php', 'csharp', 'ruby', 'go', 
  'javascript', 'typescript', 'aws', 'docker', 'kubernetes', 'backend', 'frontend', 
  'data', 'cloud', 'mobile', 'nextjs', 'flutter', 'kotlin', 'swift', 'sql', 'salesforce', 
  'cybersecurity', 'graphql', 'redis', 'mongodb', 'django', 'fastapi', 'spring-boot',
  'laravel', 'spark', 'kafka', 'linux', 'azure', 'gcp', 'jenkins', 'ansible'
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
  'mobile': 'Mobile',
  'graphql': 'GraphQL',
  'redis': 'Redis',
  'mongodb': 'MongoDB',
  'django': 'Django',
  'fastapi': 'FastAPI',
  'spring-boot': 'Spring Boot',
  'laravel': 'Laravel',
  'spark': 'Apache Spark',
  'kafka': 'Apache Kafka',
  'linux': 'Linux',
  'azure': 'Azure',
  'gcp': 'Google Cloud',
  'jenkins': 'Jenkins',
  'ansible': 'Ansible'
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
    if (!job || !job.is_active) {
      return {
        title: 'Oferta no encontrada | Portal Empleo IT',
        robots: { index: false, follow: false }
      };
    }

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

    const isOld = (new Date().getTime() - new Date(job.created_at).getTime()) > 100 * 24 * 60 * 60 * 1000;
    const isExpired = !job.is_active || isOld;

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
    const job = res.rows[0] ?? null;
    if (job) {
      // Incrementar impresiones de forma asíncrona no bloqueante
      client.query("UPDATE jobs SET impressions_count = COALESCE(impressions_count, 0) + 1 WHERE id = $1", [id]).catch(e => {
        console.error('Error incrementing impressions:', e);
      });
    }
    return job;
  } catch (error) {
    console.error('Error cargando oferta:', error);
    return null;
  } finally {
    client.release();
  }
});

async function getSimilarJobs(currentId: string, category: string | null, title: string, tech: string | null, limit: number = 3) {
  if (!process.env.DATABASE_URL && !process.env.DB_PROXY_URL && !process.env.MYSQL_USER) return [];
  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, title_es, company, location, salary, salary_min, salary_max, created_at";
    const params: (string | number)[] = [currentId];
    let paramIndex = 2;

    const techFilter = tech ? `%${tech}%` : null;

    if (techFilter) {
      sql += `, (CASE WHEN title ILIKE $${paramIndex} THEN 2 WHEN description_snippet ILIKE $${paramIndex} THEN 1 ELSE 0 END) as relevance`;
      params.push(techFilter);
      paramIndex++;
    } else {
      sql += ", 0 as relevance";
    }

    sql += " FROM jobs WHERE id != $1 AND is_active = TRUE";

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

    if (techFilter) {
      sql += " ORDER BY relevance DESC, created_at DESC";
    } else {
      sql += " ORDER BY created_at DESC";
    }

    sql += ` LIMIT $${paramIndex}`;
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
  const trimmed = salaryStr.trim();
  if (!trimmed || /^(consultar|sin especificar)$/i.test(trimmed)) return null;

  const lower = trimmed.toLowerCase();

  let currency = 'EUR';
  if (/(\$|usd|dólar|dolar|dollar)/.test(lower)) currency = 'USD';
  else if (/(£|gbp|libra|pound)/.test(lower)) currency = 'GBP';

  // BUG-012: Normalizar sufijos 'k' (40k, 45.5k, 45,5k), decimales (,50/.50) y separadores de miles (40.000 / 100,000)
  let normalized = lower.replace(/(\d+)[.,](\d{1,2})\s*k\b/g, (_, a, b) =>
    String(Math.round(parseFloat(`${a}.${b}`) * 1000))
  );
  normalized = normalized.replace(/(\d+)\s*k\b/g, '$1000');
  normalized = normalized.replace(/(?<=\d)[.,]\d{2}(?!\d)/g, '');
  normalized = normalized.replace(/(?<=\d)[.,](?=\d{3}\b)/g, '');

  const numbers = normalized.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;

  const parsedNums = numbers.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n) && n > 0);
  if (parsedNums.length === 0) return null;

  let unitText = 'YEAR';
  if (/(\/h\b|por hora|per hour|hourly|\/hora)/.test(lower)) {
    unitText = 'HOUR';
  } else if (/(\/d\b|\/día|\/dia|por día|por dia|per day|daily)/.test(lower)) {
    unitText = 'DAY';
  } else if (/(mes|mensual|month|monthly|\/m\b)/.test(lower) || parsedNums[0] < 6000) {
    unitText = 'MONTH';
  }

  const minBound = unitText === 'HOUR' ? 8 : unitText === 'DAY' ? 50 : 100;
  const maxBound = unitText === 'HOUR' ? 500 : unitText === 'DAY' ? 5000 : 1000000;

  if (parsedNums.length >= 2) {
    const minVal = Math.min(parsedNums[0], parsedNums[1]);
    const maxVal = Math.max(parsedNums[0], parsedNums[1]);

    if (minVal < minBound || maxVal > maxBound) return null;

    return {
      '@type': 'MonetaryAmount',
      currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: minVal,
        maxValue: maxVal,
        unitText,
      },
    };
  } else {
    const val = parsedNums[0];
    if (val < minBound || val > maxBound) return null;

    return {
      '@type': 'MonetaryAmount',
      currency,
      value: {
        '@type': 'QuantitativeValue',
        value: val,
        unitText,
      },
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

  if (!job.is_active) {
    let savedByCurrentUser = false;
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const client = await pool.connect();
        try {
          const savedRes = await client.query(
            'SELECT 1 FROM user_saved_jobs WHERE user_id = $1 AND job_id = $2 LIMIT 1',
            [currentUser.id, String(job.id)]
          );
          savedByCurrentUser = (savedRes.rows?.length || 0) > 0;
        } finally {
          client.release();
        }
      }
    } catch {
      savedByCurrentUser = false;
    }

    if (!savedByCurrentUser) {
      notFound();
    }
  }

  const ageMs = new Date().getTime() - new Date(job.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const isOld = ageDays >= 100;
  const isExpired = !job.is_active || isOld;
  const graceDaysLeft = Math.max(0, Math.ceil(110 - ageDays));

  const correctSlug = getJobSlug(job);
  const lang = resolvedSearchParams?.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  // Redirección permanente solo para ofertas activas si la URL no contiene el slug descriptivo correcto (BUG-044)
  if (!isExpired && idParam !== correctSlug) {
    const queryStr = isEnglish ? '?lang=en' : '';
    permanentRedirect(`/job/${correctSlug}${queryStr}`);
  }

  const detectedTec = detectTechnology(job.title, job.description_snippet || '');
  const tecLabel = detectedTec ? (DISPLAY_NAMES[detectedTec] || detectedTec) : null;

  const fetchCompanyRating = async () => {
    if (!job.company || job.company === 'Desconocida') return null;
    const companySlug = slugify(job.company);
    if (!companySlug) return null;
    const client = await pool.connect();
    try {
      const res = await client.query(
        "SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews FROM company_reviews WHERE company_slug = $1",
        [companySlug]
      );
      if (res.rows[0] && res.rows[0].total_reviews > 0) {
        return {
          ratingValue: parseFloat(res.rows[0].avg_rating).toFixed(1),
          reviewCount: parseInt(res.rows[0].total_reviews, 10),
        };
      }
    } catch (e) {
      console.error('Error fetching company rating:', e);
    } finally {
      client.release();
    }
    return null;
  };

  // FUNC-038: Paralelizar consultas independientes en lugar de ejecutarlas secuencialmente
  const [similarJobs, reactions, companyRating] = await Promise.all([
    getSimilarJobs(numericId, job.category, job.title, detectedTec, 3),
    getJobReactions(job.id),
    fetchCompanyRating(),
  ]);

  const hasTranslation = !!job.title_es && !isEnglish;
  const displayTitle = isEnglish ? job.title : (job.title_es || job.title);
  const displayDesc = isEnglish ? job.description_snippet : (job.description_snippet_es || job.description_snippet);

  const sourceLabel = extractSource(job.description_snippet);

  const cleanLocation = job.location ? job.location.toLowerCase().trim() : '';
  const isRemoteLoc = cleanLocation.includes('remoto') || cleanLocation.includes('teletrabajo') || cleanLocation.includes('remote');
  const rawCityPart = (job.location || '').split(',')[0].split('(')[0].split('/')[0].trim();
  const parsedCitySlug = slugify(rawCityPart);
  const locationSlug = isRemoteLoc ? 'remoto' : (parsedCitySlug && !/^[0-9a-f]{4}$/i.test(parsedCitySlug) ? parsedCitySlug : 'espana');
  
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
  const validThroughDate = new Date(datePosted.getTime() + 100 * 24 * 60 * 60 * 1000);

  let baseSalaryObj = null;
  if (job.salary_min || job.salary_max) {
    const minVal = job.salary_min ? Math.round(parseFloat(job.salary_min.toString())) : null;
    const maxVal = job.salary_max ? Math.round(parseFloat(job.salary_max.toString())) : null;
    const currency = job.salary_currency || 'EUR';
    
    if (minVal && maxVal && minVal >= 1000 && maxVal <= 1000000) {
      baseSalaryObj = {
        "@type": "MonetaryAmount",
        "currency": currency,
        "value": {
          "@type": "QuantitativeValue",
          "minValue": minVal,
          "maxValue": maxVal,
          "unitText": "YEAR"
        }
      };
    } else if ((minVal || maxVal) && (minVal || maxVal)! >= 1000) {
      baseSalaryObj = {
        "@type": "MonetaryAmount",
        "currency": currency,
        "value": {
          "@type": "QuantitativeValue",
          "value": minVal || maxVal,
          "unitText": "YEAR"
        }
      };
    }
  }
  
  if (!baseSalaryObj) {
    baseSalaryObj = parseSalarySchema(job.salary);
  }

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

  const REGION_BY_CITY: Array<[RegExp, string]> = [
    [/\bmadrid\b/i, 'Madrid'],
    [/\bbarcelona\b|\bbcn\b/i, 'Barcelona'],
    [/\bvalencia\b/i, 'Valencia'],
    [/\bsevilla\b/i, 'Sevilla'],
    [/\bbilbao\b|\bvizcaya\b|\bbizkaia\b/i, 'Bizkaia'],
    [/\bm[aá]laga\b/i, 'Málaga'],
    [/\bzaragoza\b/i, 'Zaragoza'],
    [/\balicante\b/i, 'Alicante'],
    [/\bmurcia\b/i, 'Murcia'],
    [/\bvalladolid\b/i, 'Valladolid'],
    [/\bpalma\b|\bmallorca\b|\bbaleares\b/i, 'Illes Balears'],
    [/\blas palmas\b|\bgran canaria\b/i, 'Las Palmas'],
    [/\btenerife\b/i, 'Santa Cruz de Tenerife'],
    [/\bcoru[nñ]a\b/i, 'A Coruña'],
    [/\bvigo\b|\bpontevedra\b/i, 'Pontevedra'],
    [/\boviedo\b|\bgij[oó]n\b|\basturias\b/i, 'Asturias'],
    [/\bsantander\b|\bcantabria\b/i, 'Cantabria'],
    [/\bpamplona\b|\bnavarra\b/i, 'Navarra'],
    [/\bdonostia\b|\bsan sebasti[aá]n\b|\bgipuzkoa\b/i, 'Gipuzkoa'],
    [/\bvitoria\b|\b[aá]lava\b|\baraba\b/i, 'Álava'],
    [/\bgranada\b/i, 'Granada'],
    [/\bc[oó]rdoba\b/i, 'Córdoba'],
    [/\btoledo\b/i, 'Toledo'],
    [/\bsalamanca\b/i, 'Salamanca'],
    [/\bbadajoz\b/i, 'Badajoz'],
    [/\bc[aá]ceres\b/i, 'Cáceres'],
    [/\bcastell[oó]n\b/i, 'Castellón'],
    [/\btarragona\b/i, 'Tarragona'],
    [/\bgirona\b/i, 'Girona'],
    [/\blleida\b/i, 'Lleida'],
    [/\balmer[ií]a\b/i, 'Almería'],
    [/\bc[aá]diz\b/i, 'Cádiz'],
    [/\bhuelva\b/i, 'Huelva'],
    [/\bja[eé]n\b/i, 'Jaén'],
    [/\ble[oó]n\b/i, 'León'],
    [/\bburgos\b/i, 'Burgos'],
    [/\blogro[nñ]o\b|\bla rioja\b/i, 'La Rioja'],
    [/\balbacete\b/i, 'Albacete'],
    [/\bciudad real\b/i, 'Ciudad Real'],
  ];

  const cleanLocForAddress = job.location || '';
  const addressRegion = REGION_BY_CITY.find(([regex]) => regex.test(cleanLocForAddress))?.[1];

  const jobLocationObj: any = {
    '@type': 'Place',
    address: { 
      '@type': 'PostalAddress', 
      addressCountry: countryCode 
    },
  };

  if (!isRemote) {
    jobLocationObj.address.addressLocality = job.location || 'España';
    if (addressRegion) {
      jobLocationObj.address.addressRegion = addressRegion;
    }
  }

  // companyRating ya obtenido en paralelo arriba (FUNC-038)

  const isDirectNativeJob = Boolean(
    job.company_email ||
    job.stripe_session_id ||
    (job.url_source && String(job.url_source).includes('portalempleoit.com'))
  );

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: displayTitle,
    description: textToHtml(displayDesc) || `Oferta de empleo para ${displayTitle} en ${hiringOrgName}`,
    datePosted: datePosted.toISOString(),
    validThrough: validThroughDate.toISOString(),
    hiringOrganization: { 
      '@type': 'Organization', 
      name: hiringOrgName,
      ...(hiringOrgName === 'Portal Trabajo IT' ? { logo: `${BASE_URL}/logo.png` } : {}),
      ...(companyRating ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: companyRating.ratingValue,
          reviewCount: companyRating.reviewCount
        }
      } : {})
    },
    identifier: {
      '@type': 'PropertyValue',
      name: hiringOrgName,
      value: `job-${job.id}`
    },
    jobLocation: jobLocationObj,
    employmentType: employmentTypes,
    directApply: isDirectNativeJob,
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
  }

  // Beneficios para trabajo remoto (SEO-003: siempre incluir applicantLocationRequirements en TELECOMMUTE)
  if (isRemote) {
    jsonLd.jobBenefits = isEnglish
      ? 'Remote work (telecommute), flexible schedule'
      : 'Teletrabajo (trabajo remoto), horario flexible';
    jsonLd.jobLocationType = 'TELECOMMUTE';
    jsonLd.applicantLocationRequirements = {
      '@type': 'Country',
      name: countryCode || 'ES'
    };
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
      },
      {
        '@type': 'Question',
        'name': isEnglish
          ? `How can I apply for this position at ${hiringOrgName}?`
          : `¿Cómo puedo inscribirme a esta oferta en ${hiringOrgName}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': isEnglish
            ? `Click on the 'Apply for Job' button to access the candidacy form and send your resume directly.`
            : `Haz clic en el botón 'Solicitar Empleo' para acceder al proceso de candidaturas e inscribirte directamente.`
        }
      }
    ]
  };

  // VideoObject schema disabled due to lack of actual video ID in database (avoiding Google penalty for mock URLs)
  const videoJsonLd: any = null;

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-8 md:py-12 px-4 md:px-8">
      <RecentlyViewedTracker job={{ id: job.id, title: displayTitle, company: job.company, location: job.location, salary: job.salary }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(faqJsonLd) }} />
      {videoJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdString(videoJsonLd) }} />
      )}

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
            { label: isEnglish ? 'Jobs' : 'Ofertas', href: isEnglish ? '/trabajos/informatica-tecnologia?lang=en' : '/trabajos/informatica-tecnologia' },
            { label: displayTitle }
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <Link href={isEnglish ? '/?lang=en' : '/'} className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors">
            {isEnglish ? '← Back to search' : '← Volver al buscador'}
          </Link>

          <ShareButton title={displayTitle} company={job.company} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {isExpired && (
              <div className="mb-6 p-4 sm:p-5 rounded-xl border border-[var(--border-featured)] bg-[var(--status-amber-tint)] flex items-start gap-3.5">
                <svg className="w-5 h-5 text-[var(--status-amber)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                    {isEnglish
                      ? 'This job offer has expired'
                      : 'Esta oferta de empleo ha expirado'}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {isEnglish
                      ? `This vacancy is no longer publicly listed (over 100 days old). Because you saved it, it will remain visible here for ${graceDaysLeft} more day(s) before permanent deletion.`
                      : `Esta vacante ya no aparece en el buscador público (supera los 100 días). La sigues viendo porque la guardaste; se eliminará definitivamente en ${graceDaysLeft} día(s).`}
                  </p>
                </div>
              </div>
            )}

            <div className="ui-card rounded-xl overflow-hidden">
              <div className="bg-[#090C10] text-white p-6 md:p-8 border-b border-white/[0.08] flex flex-col md:flex-row gap-5 md:items-center">
                <CompanyLogo company={job.company} size={14} />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold mb-3 leading-snug tracking-tight text-white flex flex-wrap items-center gap-2">
                    {displayTitle}
                    {hasTranslation && (
                      <span className="inline-flex items-center font-mono text-[10px] bg-white/[0.08] text-slate-300 px-2 py-0.5 rounded border border-white/[0.12] font-medium uppercase tracking-wider" title={`Título original: ${job.title}`}>
                        Traducido
                      </span>
                    )}
                  </h1>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {job.company && job.company !== 'Desconocida' ? (
                      <Link href={`/empresas/${slugify(job.company)}`} className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 px-2.5 py-1 rounded-md transition-colors" title={`Ver todas las ofertas de ${job.company}`}>
                        {job.company}
                      </Link>
                    ) : (
                      <span className="bg-white/[0.06] border border-white/[0.1] text-slate-200 px-2.5 py-1 rounded-md">
                        {job.company || 'Desconocida'}
                      </span>
                    )}
                    <span className="bg-white/[0.06] border border-white/[0.1] text-slate-300 px-2.5 py-1 rounded-md">
                      {job.location}
                    </span>
                    <span className="bg-white/[0.06] border border-white/[0.1] text-slate-400 tabular-nums px-2.5 py-1 rounded-md">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)] mb-4">
                  {isEnglish ? 'Job Description' : 'Descripción del puesto'}
                </h2>
                <div className="prose max-w-none text-[var(--text-secondary)] dark:prose-invert mb-8 leading-relaxed job-description text-sm sm:text-base">
                  {displayDesc ? (
                    <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: autoLinkDescription(displayDesc, isEnglish) }} />
                  ) : (
                    <p className="whitespace-pre-line">
                      {isEnglish ? 'View details on original website.' : 'Ver detalles en la web original.'}
                    </p>
                  )}
                  {hasTranslation && (
                    <p className="text-xs text-[var(--text-muted)] italic mt-6 border-t border-[var(--border-subtle)] pt-3 flex items-center gap-1.5">
                      <span>Oferta traducida automáticamente al español.</span>
                      <a href={job.url_source} target="_blank" rel={job.is_featured ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} className="text-[var(--accent-primary)] hover:underline font-medium">
                        Ver original
                      </a>
                    </p>
                  )}
                </div>

                {/* Banner publicitario inline de alta visibilidad */}
                <div className="mb-8">
                  <AdBanner variant="inline" />
                </div>

                {relatedBlogPost && (
                  <div className="mb-8 p-5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl flex flex-col md:flex-row items-center gap-5 group">
                    <div className="relative w-full md:w-44 h-32 md:h-28 rounded-lg overflow-hidden shrink-0 bg-[#090C10] border border-[var(--border-subtle)]">
                      <Image
                        src={`/blog/${relatedBlogPost.slug}/opengraph-image`}
                        alt={relatedBlogPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 176px"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)] block mb-1">
                        {isEnglish ? 'BEFORE YOU APPLY, READ THIS' : 'GUÍA RECOMENDADA'}
                      </span>
                      <h4 className="text-base font-semibold text-[var(--text-primary)] leading-snug mb-1">
                        {relatedBlogPost.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                        {relatedBlogPost.excerpt}
                      </p>
                      <Link
                        href={`/blog/${relatedBlogPost.slug}${queryParam}`}
                        className="ui-btn-press inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors text-xs font-medium text-white rounded-lg cursor-pointer"
                      >
                        {isEnglish ? 'Read practical guide →' : 'Leer guía práctica →'}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Enlaces de Interlinking Contextual de SEO */}
                <div className="mt-6 p-5 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-subtle)] text-sm leading-relaxed mb-8">
                  <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)] block mb-3 uppercase tracking-wider">
                    {isEnglish ? 'Related Navigation & Resources' : 'Recursos Relacionados'}
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    {job.company && job.company !== 'Desconocida' && (
                      <Link
                        href={`/empresas/${slugify(job.company)}${queryParam}`}
                        className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                      >
                        {isEnglish ? `All ${job.company} jobs` : `Ofertas de ${job.company}`}
                      </Link>
                    )}
                    {detectedTec && tecLabel && (
                      <>
                        <Link
                          href={sectorUrl!}
                          className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                        >
                          {isEnglish ? `Jobs for ${tecLabel}` : `Ofertas de ${tecLabel}`}
                        </Link>
                        {sectorLocationUrl && (
                          <Link
                            href={sectorLocationUrl}
                            className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                          >
                            {tecLabel} {isRemoteLoc ? (isEnglish ? 'remote' : 'en remoto') : (isEnglish ? `in ${job.location}` : `en ${job.location}`)}
                          </Link>
                        )}
                        <Link
                          href={`/salarios/${detectedTec}${queryParam}`}
                          className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                        >
                          {isEnglish ? `${tecLabel} Salaries` : `Salarios de ${tecLabel}`}
                        </Link>
                        <Link
                          href={`/entrevistas/${detectedTec}${queryParam}`}
                          className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                        >
                          {isEnglish ? `${tecLabel} Interview Questions` : `Entrevistas ${tecLabel}`}
                        </Link>
                        <Link
                          href={`/trabajos/${detectedTec}-mid${queryParam}`}
                          className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                        >
                          {isEnglish ? `${tecLabel} Mid-Level` : `${tecLabel} Mid-Level`}
                        </Link>
                        <Link
                          href={`/glosario/${detectedTec}${queryParam}`}
                          className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--border-accent)] transition-colors"
                        >
                          {isEnglish ? `${tecLabel} Glossary` : `Glosario ${tecLabel}`}
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <CourseAffiliate title={job.title} />
                <div className="mt-5">
                  <AmazonBooksWidget contextTitle={job.title} lang={lang} />
                </div>

                <div className="p-6 rounded-xl border border-[var(--border-accent)] bg-[var(--accent-tint)] text-center mt-8">
                  <p className="text-[var(--text-primary)] mb-1 text-sm font-semibold">
                    {isEnglish ? (
                      <>Job opportunity indexed from <strong>{sourceLabel}</strong></>
                    ) : (
                      <>Oportunidad laboral indexada desde <strong>{sourceLabel}</strong></>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
                    {isEnglish
                      ? 'Portal Trabajo IT functions as a search aggregator. Applications are processed directly on the official source site.'
                      : 'Portal Trabajo IT actúa como motor de búsqueda y agregación de enlaces. La postulación se realiza directamente en la plataforma oficial de origen.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <ApplyButton url={job.url_source} company={job.company} title={displayTitle} lang={lang} jobId={job.id} />
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
                      <SaveJobButton job={job} variant="detail" />
                      <ReactionButton jobId={job.id} initialLikes={reactions.likes} initialDislikes={reactions.dislikes} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-center">
                    <a
                      href={`mailto:contacto@portalempleoit.com?subject=${encodeURIComponent(`[Retirada de oferta verificada] ID: ${job.id} - ${job.company}`)}&body=${encodeURIComponent(`Hola equipo legal de Portal Trabajo IT,\n\nSolicito la desindexación / actualización de la siguiente oferta de empleo:\n\nTítulo: ${job.title}\nEmpresa: ${job.company}\nURL: ${BASE_URL}/job/${correctSlug}\n\nDATOS DE ACREDITACIÓN OBLIGATORIOS (Reglamento UE 2022/2065 - DSA):\n- Nombre y apellidos del solicitante:\n- Cargo o relación con la empresa / portal fuente:\n- Correo corporativo del dominio oficial de la empresa (obligatorio; no se tramitan solicitudes desde cuentas gratuitas como gmail/hotmail):\n- Motivo de la solicitud (ej. puesto cubierto, error en datos, exclusión de agregador):\n\nDeclaro bajo mi responsabilidad que ostento la representación legítima de la entidad indicada. Las solicitudes fraudulentas o realizadas de mala fe podrán ser puestas en conocimiento de las autoridades competentes.`)}`}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] underline transition-colors"
                      title="Canal de exclusión y retirada inmediata para empleadores y portales titulares"
                    >
                      {isEnglish ? 'Are you the employer or source platform? Request verified removal or update' : '¿Eres el empleador o la plataforma de origen? Solicitar retirada o actualización verificada'}
                    </a>
                  </div>
                </div>

                <AdBanner variant="multiplex" />
              </div>
            </div>

            {/* Sección Visual de Preguntas Frecuentes (FAQ) */}
            <div className="mt-8 ui-card p-6 rounded-xl space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {isEnglish ? `Frequently Asked Questions about this position` : `Preguntas Frecuentes sobre esta Vacante`}
              </h3>
              <div className="space-y-3 pt-1">
                {faqJsonLd.mainEntity.map((faq: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 flex items-start gap-2">
                      <span className="font-mono text-[var(--accent-primary)]">Q.</span> {faq.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-6">
                      {faq.acceptedAnswer.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ofertas Recomendadas */}
            {similarJobs && similarJobs.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {isEnglish ? 'Recommended similar job offers' : 'Ofertas de empleo similares recomendadas'}
                </h3>
                <div className="grid grid-cols-1 gap-3.5">
                  {similarJobs.map((simJob: any) => {
                    const simSlug = getJobSlug(simJob);
                    const simUrl = `/job/${simSlug}${queryParam}`;
                    const displaySimTitle = isEnglish ? simJob.title : (simJob.title_es || simJob.title);
                    return (
                      <div key={simJob.id} className="relative group ui-card ui-card-interactive p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <Link href={simUrl} className="after:absolute after:inset-0 font-semibold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                            {displaySimTitle}
                          </Link>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-x-2">
                            <span className="font-medium">{simJob.company}</span>
                            <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
                            <span>{simJob.location}</span>
                            {simJob.salary && simJob.salary !== 'Consultar' && (
                              <>
                                <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-[var(--status-emerald)]">{simJob.salary}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors"
                        >
                          {isEnglish ? 'View offer →' : 'Ver oferta →'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-20 space-y-5">
              <SubscribeForm
                location={job.location || 'España'}
                defaultTech={detectedTec || undefined}
                defaultLocation={isRemote ? 'remoto' : undefined}
              />
              <PushSubscribe />
              <ReferralWidget lang={lang} />
              <AdBanner variant="sidebar" enableRefresh={true} />
            </div>
          </div>
        </div>

        {/* Enlaces de Interlinking Popular */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
          <h3 className="font-mono text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            {isEnglish ? 'Most Searched IT Jobs' : 'Empleos IT más buscados'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-[var(--text-secondary)]">
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">{isEnglish ? 'Core Technologies' : 'Tecnologías Principales'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/trabajos/react${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'React Jobs' : 'Ofertas de React'}</Link></li>
                <li><Link href={`/trabajos/node${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Node.js Jobs' : 'Ofertas de Node.js'}</Link></li>
                <li><Link href={`/trabajos/python${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Python Jobs' : 'Ofertas de Python'}</Link></li>
                <li><Link href={`/trabajos/java${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Java Jobs' : 'Ofertas de Java'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">{isEnglish ? 'Infrastructure & DevOps' : 'Infraestructura y DevOps'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/trabajos/aws${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'AWS Jobs' : 'Ofertas de AWS'}</Link></li>
                <li><Link href={`/trabajos/docker${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Docker Jobs' : 'Ofertas de Docker'}</Link></li>
                <li><Link href={`/trabajos/kubernetes${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Kubernetes Jobs' : 'Ofertas de Kubernetes'}</Link></li>
                <li><Link href={`/trabajos/cloud${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Cloud Jobs' : 'Ofertas de Cloud Computing'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">{isEnglish ? 'Jobs by Location' : 'Empleos por Ubicación'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/trabajo-remoto${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? '100% Remote Jobs' : 'Trabajo 100% Remoto'}</Link></li>
                <li><Link href={`/trabajo-madrid${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Jobs in Madrid' : 'Trabajo en Madrid'}</Link></li>
                <li><Link href={`/trabajo-barcelona${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Jobs in Barcelona' : 'Trabajo en Barcelona'}</Link></li>
                <li><Link href={`/trabajo-valencia${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Jobs in Valencia' : 'Trabajo en Valencia'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2">{isEnglish ? 'Other Links' : 'Otros Enlaces de Interés'}</h4>
              <ul className="space-y-2">
                <li><Link href={`/salarios${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline font-medium text-[var(--accent-primary)]">{isEnglish ? 'IT Salary Calculator' : 'Calculadora de Salarios IT'}</Link></li>
                <li><Link href={`/empresas${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Company Directory' : 'Directorio de Empresas'}</Link></li>
                <li><Link href={`/blog${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Career Advice (Blog)' : 'Consejos de Empleo (Blog)'}</Link></li>
                <li><Link href={`/login${queryParam}`} className="hover:text-[var(--accent-primary)] hover:underline">{isEnglish ? 'Register as Candidate' : 'Registrarme como Candidato'}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <StickyDesktopAd />
      </div>
    </main>
  );
}
