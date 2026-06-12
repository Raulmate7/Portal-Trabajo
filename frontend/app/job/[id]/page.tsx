import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import CourseAffiliate from '@/components/CourseAffiliate';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import PushSubscribe from '@/components/PushSubscribe';
import Breadcrumbs from '@/components/Breadcrumbs';

export const revalidate = 60;

const BASE_URL = 'https://portal-trabajo.vercel.app';

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

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '')       // Elimina caracteres especiales
    .replace(/\-\-+/g, '-')         // Evita guiones dobles
    .replace(/^-+/, '')             // Quita guión inicial
    .replace(/-+$/, '');            // Quita guión final
}

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

function autoLinkDescription(desc: string | null | undefined): string {
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
    escaped = escaped.replace(regexPlaceholder, `<a href="/trabajos/${kw.slug}" class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline">$1</a>`);
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
      "SELECT title, company, location, description_snippet, is_active, created_at, title_es, description_snippet_es FROM jobs WHERE id = $1",
      [id]
    );

    const job = res.rows[0];
    if (!job) return { title: 'Oferta no encontrada' };

    const displayTitle = job.title_es || job.title;
    const displayDesc = job.description_snippet_es || job.description_snippet;
    const titulo = `${displayTitle} en ${job.location}`;
    const desc = `Oportunidad laboral en ${job.company}. ${displayDesc?.substring(0, 130) ?? ''}...`;

    const isOld = (new Date().getTime() - new Date(job.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
    const isExpired = job.is_active === false || isOld;

    return {
      title: `${titulo} | Portal Empleo`,
      description: desc,
      alternates: {
        canonical: `/job/${id}`,
      },
      robots: {
        index: !isExpired,
        follow: true,
      },
      openGraph: {
        title: titulo,
        description: desc,
        url: `${BASE_URL}/job/${id}`,
        siteName: 'Agregador de Empleo Tech',
        locale: 'es_ES',
        type: 'website',
        images: [
          {
            url: `${BASE_URL}/job/${id}/opengraph-image`,
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
        images: [`${BASE_URL}/job/${id}/opengraph-image`],
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

async function getSimilarJobs(currentId: string, category: string | null, title: string, limit: number = 3) {
  if (!process.env.DATABASE_URL) return [];
  const client = await pool.connect();
  try {
    let sql = "SELECT id, title, company, location, salary, created_at FROM jobs WHERE id != $1";
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

  const similarJobs = await getSimilarJobs(resolvedParams.id, job.category, job.title, 3);

  const isOld = (new Date().getTime() - new Date(job.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000;
  const isExpired = job.is_active === false || isOld;

  const hasTranslation = !!job.title_es;
  const displayTitle = job.title_es || job.title;
  const displayDesc = job.description_snippet_es || job.description_snippet;

  const sourceLabel = extractSource(job.description_snippet);

  const detectedTec = detectTechnology(job.title, job.description_snippet || '');
  const tecLabel = detectedTec ? (DISPLAY_NAMES[detectedTec] || detectedTec) : null;

  // Determinar la localización para el enlace
  const cleanLocation = job.location ? job.location.toLowerCase().trim() : '';
  const isRemoteLoc = cleanLocation.includes('remoto') || cleanLocation.includes('teletrabajo') || cleanLocation.includes('remote');
  const locationSlug = isRemoteLoc ? 'remoto' : slugify(job.location || 'espana');
  
  // Construir slugs y URLs
  const sectorUrl = detectedTec ? `/trabajos/${detectedTec}` : null;
  const sectorLocationUrl = detectedTec 
    ? (isRemoteLoc ? `/trabajos/${detectedTec}-remoto` : `/trabajos/${detectedTec}-en-${locationSlug}`)
    : null;

  // Inferencia para SEO
  const textForInference = `${job.title} ${job.description_snippet || ''}`.toLowerCase();
  const isRemote = textForInference.includes('remoto') || textForInference.includes('teletrabajo') || textForInference.includes('remote');
  const employmentTypes = inferEmploymentTypes(textForInference);

  const datePosted = new Date(job.created_at);
  const validThroughDate = new Date(datePosted.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 días después

  const baseSalaryObj = parseSalarySchema(job.salary);

  // Detección dinámica del país para evitar hardcodear 'ES' en ofertas globales
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
    countryCode = 'US'; // Valor genérico por defecto para scrapers globales si no es España
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

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: textToHtml(displayDesc) || `Oferta de empleo para ${job.title} en ${job.company}`,
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
        addressLocality: job.location || 'Remoto', 
        addressCountry: countryCode 
      },
    },
    employmentType: employmentTypes,
    directApply: true,
  };

  if (tecLabel) {
    jsonLd.skills = [tecLabel];
  }

  if (expRequirements) {
    jsonLd.experienceRequirements = expRequirements;
  }

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    // Si es teletrabajo global/worldwide, no requiere applicantLocationRequirements (según normas de Google)
    if (!isWorldwide) {
      jsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: countryCode
      };
    }
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `¿Hay vacantes de ${displayTitle} en ${job.company || 'esta empresa'} actualmente?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Sí, la oferta para ${displayTitle} en ${job.company || 'la empresa'} está disponible y activa en nuestro portal.`
        }
      },
      {
        '@type': 'Question',
        'name': `¿Cuál es el salario para el puesto de ${displayTitle}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `El salario para esta oferta de empleo es de ${job.salary && job.salary !== 'Consultar' ? job.salary : 'a consultar directamente con la empresa contratante'}.`
        }
      },
      {
        '@type': 'Question',
        'name': `¿Dónde está ubicado el puesto de trabajo de ${displayTitle}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `El empleo está ubicado en ${job.location || 'remoto (teletrabajo)'}.`
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

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
            {isExpired && (
              <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-start gap-4">
                <span className="text-3xl shrink-0">⚠️</span>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">Esta oferta de empleo ha expirado o tiene más de 30 días</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Es muy probable que este puesto ya esté cubierto. Te recomendamos revisar las ofertas recomendadas de la misma categoría en la parte inferior de la página para encontrar vacantes activas.
                  </p>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 md:p-8">
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

          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del puesto</h2>
            <div className="prose max-w-none text-gray-650 mb-8 leading-relaxed">
              {displayDesc ? (
                <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: autoLinkDescription(displayDesc) }} />
              ) : (
                <p className="whitespace-pre-line">Ver detalles en la web original.</p>
              )}
              {hasTranslation && (
                <p className="text-xs text-gray-400 italic mt-6 border-t border-gray-100 pt-3 flex items-center gap-1.5">
                  <span>🤖</span> Oferta traducida automáticamente al español. <a href={job.url_source} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold">Ver original</a>
                </p>
              )}
            </div>

            {/* Enlaces de Interlinking de SEO */}
            {detectedTec && tecLabel && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed mb-8">
                <span className="font-bold text-gray-700 block mb-1">🔍 Búsquedas Relacionadas:</span>
                ¿Buscas más oportunidades? Explora ofertas de{" "}
                <Link href={sectorUrl!} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline capitalize">
                  {tecLabel}
                </Link>
                {job.location && (
                  <>
                    {" "}o empleos de{" "}
                    <Link href={sectorLocationUrl!} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline capitalize">
                      {tecLabel} {isRemoteLoc ? 'en remoto' : `en ${job.location}`}
                    </Link>
                  </>
                )}
                . También puedes ver todas las ofertas de y para{" "}
                <Link href="/trabajos/informatica-tecnologia" className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">
                  Informática y Tecnología
                </Link>.
              </div>
            )}

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

        {/* Ofertas Recomendadas (Interlinking de SEO) */}
        {similarJobs && similarJobs.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>💼</span> Ofertas de empleo similares recomendadas
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {similarJobs.map((simJob: any) => (
                <div key={simJob.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <Link href={`/job/${simJob.id}`} className="font-bold text-indigo-900 hover:text-indigo-600 transition-colors line-clamp-1">
                      {simJob.title}
                    </Link>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      🏢 {simJob.company} · 📍 {simJob.location} {simJob.salary && simJob.salary !== 'Consultar' && `· 💰 ${simJob.salary}`}
                    </p>
                  </div>
                  <Link 
                    href={`/job/${simJob.id}`} 
                    className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold rounded-lg text-center"
                  >
                    Ver oferta
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-6 space-y-6">
              <SubscribeForm location={job.location || 'España'} />
              <PushSubscribe />
              <AdBanner variant="sidebar" />
            </div>
          </div>
        </div>

        {/* Enlaces de Interlinking Popular */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
            🔍 Empleos IT más buscados
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-500">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Tecnologías Principales</h4>
              <ul className="space-y-2">
                <li><Link href="/trabajos/react" className="hover:text-indigo-650 hover:underline">Ofertas de React</Link></li>
                <li><Link href="/trabajos/node" className="hover:text-indigo-650 hover:underline">Ofertas de Node.js</Link></li>
                <li><Link href="/trabajos/python" className="hover:text-indigo-650 hover:underline">Ofertas de Python</Link></li>
                <li><Link href="/trabajos/java" className="hover:text-indigo-650 hover:underline">Ofertas de Java</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Infraestructura y DevOps</h4>
              <ul className="space-y-2">
                <li><Link href="/trabajos/aws" className="hover:text-indigo-650 hover:underline">Ofertas de AWS</Link></li>
                <li><Link href="/trabajos/docker" className="hover:text-indigo-650 hover:underline">Ofertas de Docker</Link></li>
                <li><Link href="/trabajos/kubernetes" className="hover:text-indigo-650 hover:underline">Ofertas de Kubernetes</Link></li>
                <li><Link href="/trabajos/cloud" className="hover:text-indigo-650 hover:underline">Ofertas de Cloud Computing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Empleos por Ubicación</h4>
              <ul className="space-y-2">
                <li><Link href="/trabajos/informatica-tecnologia-remoto" className="hover:text-indigo-650 hover:underline">Trabajo 100% Remoto</Link></li>
                <li><Link href="/trabajos/informatica-tecnologia-en-madrid" className="hover:text-indigo-650 hover:underline">Trabajo en Madrid</Link></li>
                <li><Link href="/trabajos/informatica-tecnologia-en-barcelona" className="hover:text-indigo-650 hover:underline">Trabajo en Barcelona</Link></li>
                <li><Link href="/trabajos/informatica-tecnologia-en-valencia" className="hover:text-indigo-650 hover:underline">Trabajo en Valencia</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Otros Enlaces de Interés</h4>
              <ul className="space-y-2">
                <li><Link href="/salarios" className="hover:text-indigo-650 hover:underline font-bold text-indigo-600">Calculadora de Salarios IT</Link></li>
                <li><Link href="/empresas" className="hover:text-indigo-650 hover:underline">Directorio de Empresas</Link></li>
                <li><Link href="/blog" className="hover:text-indigo-650 hover:underline">Consejos de Empleo (Blog)</Link></li>
                <li><Link href="/talento-premium" className="hover:text-indigo-650 hover:underline">Registrarme como Candidato</Link></li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
