import { BASE_URL } from '@/lib/constants';
import { getJobSlug, slugify } from '@/lib/slug';

export interface CompanySchemaRecord {
  canonical_name?: string | null;
  domain?: string | null;
  logo_url?: string | null;
}

const PROVINCIAL_GEO_MAP: Array<{ regex: RegExp; locality: string; region: string; postalCode: string }> = [
  { regex: /\bmadrid\b/i, locality: 'Madrid', region: 'Madrid', postalCode: '28001' },
  { regex: /\bbarcelona\b|\bbcn\b/i, locality: 'Barcelona', region: 'Barcelona', postalCode: '08001' },
  { regex: /\bvalencia\b/i, locality: 'Valencia', region: 'Valencia', postalCode: '46001' },
  { regex: /\bsevilla\b/i, locality: 'Sevilla', region: 'Sevilla', postalCode: '41001' },
  { regex: /\bm[aá]laga\b/i, locality: 'Málaga', region: 'Málaga', postalCode: '29001' },
  { regex: /\bbilbao\b|\bvizcaya\b|\bbizkaia\b/i, locality: 'Bilbao', region: 'Bizkaia', postalCode: '48001' },
  { regex: /\bzaragoza\b/i, locality: 'Zaragoza', region: 'Zaragoza', postalCode: '50001' },
  { regex: /\balicante\b/i, locality: 'Alicante', region: 'Alicante', postalCode: '03001' },
  { regex: /\bmurcia\b/i, locality: 'Murcia', region: 'Murcia', postalCode: '30001' },
  { regex: /\bvalladolid\b/i, locality: 'Valladolid', region: 'Valladolid', postalCode: '47001' },
  { regex: /\bpalma\b|\bmallorca\b|\bbaleares\b/i, locality: 'Palma', region: 'Illes Balears', postalCode: '07001' },
  { regex: /\blas palmas\b|\bgran canaria\b/i, locality: 'Las Palmas de Gran Canaria', region: 'Las Palmas', postalCode: '35001' },
  { regex: /\btenerife\b/i, locality: 'Santa Cruz de Tenerife', region: 'Santa Cruz de Tenerife', postalCode: '38001' },
  { regex: /\bcoru[nñ]a\b/i, locality: 'A Coruña', region: 'A Coruña', postalCode: '15001' },
  { regex: /\bvigo\b|\bpontevedra\b/i, locality: 'Vigo', region: 'Pontevedra', postalCode: '36201' },
  { regex: /\boviedo\b|\bgij[oó]n\b|\basturias\b/i, locality: 'Oviedo', region: 'Asturias', postalCode: '33001' },
  { regex: /\bsantander\b|\bcantabria\b/i, locality: 'Santander', region: 'Cantabria', postalCode: '39001' },
  { regex: /\bpamplona\b|\bnavarra\b/i, locality: 'Pamplona', region: 'Navarra', postalCode: '31001' },
  { regex: /\bdonostia\b|\bsan sebasti[aá]n\b|\bgipuzkoa\b/i, locality: 'San Sebastián', region: 'Gipuzkoa', postalCode: '20001' },
  { regex: /\bvitoria\b|\b[aá]lava\b|\baraba\b/i, locality: 'Vitoria-Gasteiz', region: 'Álava', postalCode: '01001' },
  { regex: /\bgranada\b/i, locality: 'Granada', region: 'Granada', postalCode: '18001' },
  { regex: /\bc[oó]rdoba\b/i, locality: 'Córdoba', region: 'Córdoba', postalCode: '14001' },
  { regex: /\btoledo\b/i, locality: 'Toledo', region: 'Toledo', postalCode: '45001' },
  { regex: /\bsalamanca\b/i, locality: 'Salamanca', region: 'Salamanca', postalCode: '37001' },
  { regex: /\bbadajoz\b/i, locality: 'Badajoz', region: 'Badajoz', postalCode: '06001' },
  { regex: /\bc[aá]ceres\b/i, locality: 'Cáceres', region: 'Cáceres', postalCode: '10001' },
  { regex: /\bcastell[oó]n\b/i, locality: 'Castellón de la Plana', region: 'Castellón', postalCode: '12001' },
  { regex: /\btarragona\b/i, locality: 'Tarragona', region: 'Tarragona', postalCode: '43001' },
  { regex: /\bgirona\b/i, locality: 'Girona', region: 'Girona', postalCode: '17001' },
  { regex: /\blleida\b/i, locality: 'Lleida', region: 'Lleida', postalCode: '25001' },
  { regex: /\balmer[ií]a\b/i, locality: 'Almería', region: 'Almería', postalCode: '04001' },
  { regex: /\bc[aá]diz\b/i, locality: 'Cádiz', region: 'Cádiz', postalCode: '11001' },
  { regex: /\bhuelva\b/i, locality: 'Huelva', region: 'Huelva', postalCode: '21001' },
  { regex: /\bja[eé]n\b/i, locality: 'Jaén', region: 'Jaén', postalCode: '23001' },
  { regex: /\ble[oó]n\b/i, locality: 'León', region: 'León', postalCode: '24001' },
  { regex: /\bburgos\b/i, locality: 'Burgos', region: 'Burgos', postalCode: '09001' },
  { regex: /\blogro[nñ]o\b|\bla rioja\b/i, locality: 'Logroño', region: 'La Rioja', postalCode: '26001' },
  { regex: /\balbacete\b/i, locality: 'Albacete', region: 'Albacete', postalCode: '02001' },
  { regex: /\bciudad real\b/i, locality: 'Ciudad Real', region: 'Ciudad Real', postalCode: '13001' },
];

export function cleanJobTitleForSchema(rawTitle: string): string {
  return rawTitle
    .replace(/\[[^\]]*(urgente|remoto|remote|híbrido|hibrido|new|nuevo)[^\]]*\]/gi, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatJobDescriptionHtml(
  rawDesc: string | null | undefined,
  fallbackTitle: string,
  orgName: string
): string {
  if (!rawDesc || rawDesc.trim().length < 40) {
    return `<p>Oferta de empleo para el puesto de <strong>${fallbackTitle}</strong> en <strong>${orgName}</strong>. Consulta los requisitos y condiciones completas en Portal Trabajo IT.</p>`;
  }

  const cleaned = rawDesc
    .replace(/^\[Fuente:\s*.+?\]\s*/i, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  const htmlBlocks: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (/^(requisitos|requirements|responsabilidades|responsibilities|qué ofrecemos|ofrecemos|beneficios|benefits|funciones|sobre el puesto)[:：]?$/i.test(line)) {
      if (inList) {
        htmlBlocks.push('</ul>');
        inList = false;
      }
      htmlBlocks.push(`<h3>${line.replace(/[:：]$/, '')}</h3>`);
    } else if (/^[-•*]/.test(line)) {
      if (!inList) {
        htmlBlocks.push('<ul>');
        inList = true;
      }
      htmlBlocks.push(`<li>${line.replace(/^[-•*]\s*/, '')}</li>`);
    } else {
      if (inList) {
        htmlBlocks.push('</ul>');
        inList = false;
      }
      htmlBlocks.push(`<p>${line}</p>`);
    }
  }
  if (inList) htmlBlocks.push('</ul>');

  return htmlBlocks.join('') || `<p>${fallbackTitle} - ${orgName}</p>`;
}

export function buildJobPostingJsonLd(params: {
  job: any;
  companyRecord?: CompanySchemaRecord | null;
  companyRating?: { ratingValue: string; reviewCount: number } | null;
  baseSalaryObj: any | null;
  employmentTypes: string[];
  tecLabel: string | null;
  sourceLabel: string;
  countryCode: string;
  isWorldwide: boolean;
  isEnglish: boolean;
  validThroughDate: Date;
}) {
  const {
    job,
    companyRecord,
    companyRating,
    baseSalaryObj,
    employmentTypes,
    tecLabel,
    sourceLabel,
    countryCode,
    isWorldwide,
    isEnglish,
    validThroughDate,
  } = params;

  const rawTitle = isEnglish ? job.title : (job.title_es || job.title);
  const cleanTitle = cleanJobTitleForSchema(rawTitle || 'Software Engineer');
  const rawDesc = isEnglish ? job.description_snippet : (job.description_snippet_es || job.description_snippet);
  const correctSlug = getJobSlug(job);
  const jobUrl = `${BASE_URL}/job/${correctSlug}`;

  const hiringOrgName = companyRecord?.canonical_name ||
    (job.company && job.company !== 'Desconocida'
      ? job.company
      : (sourceLabel && sourceLabel !== 'Internet' ? sourceLabel : 'Portal Trabajo IT'));
  const companySlug = slugify(hiringOrgName);

  const orgLogo = companyRecord?.logo_url
    ? companyRecord.logo_url
    : companyRecord?.domain
      ? `${BASE_URL}/api/company-logo?domain=${encodeURIComponent(companyRecord.domain)}`
      : `${BASE_URL}/logo.png`;

  const orgSameAs = companyRecord?.domain
    ? [`https://${companyRecord.domain}`, `${BASE_URL}/empresas/${companySlug}`]
    : companySlug
      ? [`${BASE_URL}/empresas/${companySlug}`]
      : undefined;

  const textForMode = `${job.title || ''} ${job.location || ''} ${job.description_snippet || ''}`.toLowerCase();
  const inferredHybrid = /\b(h[ií]brido|hybrid|semipresencial|semi-presencial)\b/i.test(textForMode);
  const inferredRemote = /\b(remoto|remote|teletrabajo)\b/i.test(textForMode);

  const workMode: 'remote' | 'hybrid' | 'onsite' =
    job.work_mode === 'remote' || job.work_mode === 'hybrid' || job.work_mode === 'onsite'
      ? job.work_mode
      : inferredHybrid
        ? 'hybrid'
        : inferredRemote
          ? 'remote'
          : 'onsite';

  const isRemoteOnly = workMode === 'remote';
  const isHybrid = workMode === 'hybrid';

  const geoMatch = PROVINCIAL_GEO_MAP.find(g => g.regex.test(job.location || ''));
  const cleanedLocality = (job.location || '')
    .split(',')[0]
    .split('(')[0]
    .split('/')[0]
    .replace(/\b(remoto|remote|h[ií]brido|hybrid|teletrabajo)\b/gi, '')
    .trim();

  const isDirectNativeJob = Boolean(
    (job.company_email || job.stripe_session_id) &&
    (!job.url_source || String(job.url_source).includes('portalempleoit.com'))
  );

  const datePosted = new Date(job.created_at);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: cleanTitle,
    description: formatJobDescriptionHtml(rawDesc, cleanTitle, hiringOrgName),
    datePosted: datePosted.toISOString(),
    validThrough: validThroughDate.toISOString(),
    url: jobUrl,
    directApply: isDirectNativeJob,
    employmentType: employmentTypes,
    industry: 'Information Technology',
    identifier: {
      '@type': 'PropertyValue',
      name: hiringOrgName,
      value: job.dedup_hash || `job-${job.id}`,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrgName,
      logo: orgLogo,
      ...(orgSameAs ? { sameAs: orgSameAs } : {}),
      ...(companyRating && companyRating.reviewCount > 0 ? {
        aggregateRating: {
          '@type': 'EmployerAggregateRating',
          ratingValue: companyRating.ratingValue,
          bestRating: '5',
          worstRating: '1',
          ratingCount: companyRating.reviewCount,
          reviewCount: companyRating.reviewCount,
        },
      } : {}),
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.job-description'],
    },
  };

  if (!isRemoteOnly) {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: geoMatch?.locality || cleanedLocality || 'España',
        addressRegion: geoMatch?.region || 'España',
        ...(geoMatch?.postalCode ? { postalCode: geoMatch.postalCode } : countryCode === 'ES' ? { postalCode: '28001' } : {}),
        addressCountry: countryCode || 'ES',
      },
    };
  } else {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: countryCode || 'ES',
      },
    };
  }

  if (isRemoteOnly || isHybrid) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.jobBenefits = isEnglish
      ? 'Remote work (telecommute), flexible schedule'
      : 'Teletrabajo (trabajo remoto), horario flexible';

    if (isHybrid && geoMatch) {
      schema.applicantLocationRequirements = {
        '@type': 'AdministrativeArea',
        name: geoMatch.region,
      };
    } else if (isWorldwide) {
      schema.applicantLocationRequirements = [
        { '@type': 'Country', name: 'ES' },
        { '@type': 'Country', name: 'US' },
        { '@type': 'Country', name: 'GB' },
        { '@type': 'Country', name: 'DE' },
      ];
    } else {
      schema.applicantLocationRequirements = {
        '@type': 'Country',
        name: countryCode || 'ES',
      };
    }
  }

  if (baseSalaryObj?.value) {
    const val = baseSalaryObj.value;
    if (val.minValue !== undefined && val.maxValue !== undefined) {
      schema.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: baseSalaryObj.currency || job.salary_currency || 'EUR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: Math.min(val.minValue, val.maxValue),
          maxValue: Math.max(val.minValue, val.maxValue),
          unitText: val.unitText || 'YEAR',
        },
      };
    } else if (val.value !== undefined) {
      schema.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: baseSalaryObj.currency || job.salary_currency || 'EUR',
        value: {
          '@type': 'QuantitativeValue',
          value: val.value,
          unitText: val.unitText || 'YEAR',
        },
      };
    }
  }

  if (tecLabel) {
    schema.skills = [tecLabel];
  }

  const titleLower = (job.title || '').toLowerCase();
  if (titleLower.includes('junior') || titleLower.includes('jr') || titleLower.includes('sin experiencia')) {
    schema.experienceRequirements = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: 12,
    };
  } else if (titleLower.includes('senior') || titleLower.includes('sr') || titleLower.includes('lead')) {
    schema.experienceRequirements = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: 36,
    };
  }

  if (
    titleLower.includes('junior') ||
    titleLower.includes('becario') ||
    titleLower.includes('trainee') ||
    titleLower.includes('prácticas')
  ) {
    schema.educationRequirements = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: isEnglish ? 'bachelor degree' : 'grado universitario o FP Superior',
    };
  } else if (
    titleLower.includes('senior') ||
    titleLower.includes('lead') ||
    titleLower.includes('architect')
  ) {
    schema.educationRequirements = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: isEnglish ? 'bachelor degree' : 'grado universitario',
    };
  }

  return schema;
}
