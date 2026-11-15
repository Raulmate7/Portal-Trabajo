export interface SalaryInput {
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
}

const FX_TO_EUR: Record<string, number> = {
  USD: 0.92,
  GBP: 1.17,
  EUR: 1.0,
};

function convertRawSalaryToEur(raw: string): string | null {
  const lower = raw.toLowerCase();
  const isUsd = lower.includes('$') || lower.includes('usd') || lower.includes('dollar') || lower.includes('dólar');
  const isGbp = lower.includes('£') || lower.includes('gbp') || lower.includes('pound') || lower.includes('libra');

  if (!isUsd && !isGbp) return null;

  const rate = isUsd ? FX_TO_EUR.USD : FX_TO_EUR.GBP;
  // Extraer tokens numéricos (ej. 80k, 120,000, 90.000)
  const matches = raw.match(/\d+(?:[.,]\d{1,3})*(?:\s*k)?/gi);
  if (!matches || matches.length === 0) return null;

  const values: number[] = [];
  for (const m of matches) {
    const clean = m.toLowerCase().replace(/\s+/g, '');
    const hasK = clean.endsWith('k');
    const numStr = clean.replace(/k$/, '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.');
    const num = parseFloat(numStr);
    if (!isNaN(num) && num > 0) {
      values.push(hasK ? num * 1000 : num);
    }
  }

  if (values.length === 0) return null;

  // Si parecen salarios horarios (<150), convertir a anual aprox (1760h)
  const isHourly = lower.includes('/h') || lower.includes('hour') || lower.includes('hora');
  const multiplier = isHourly ? 1760 : 1;

  const minVal = Math.round((Math.min(...values) * multiplier * rate) / 1000);
  const maxVal = Math.round((Math.max(...values) * multiplier * rate) / 1000);

  if (minVal <= 0) return null;
  if (values.length >= 2 && maxVal > minVal) {
    return `~${minVal}k–${maxVal}k €`;
  }
  return `~${minVal}k €`;
}

/**
 * Formatea el salario de una oferta priorizando siempre mostrarlo en euros (€).
 */
export function formatSalaryEur(
  job: SalaryInput,
  options: { isEnglish?: boolean; includePeriod?: boolean } = {}
): { text: string; isKnown: boolean } {
  const { isEnglish = false, includePeriod = false } = options;
  const fallback = isEnglish ? 'Negotiable' : 'Consultar';
  const periodSuffix = includePeriod ? (isEnglish ? '/yr' : '/año') : '';

  const minNum = job.salary_min ? Number(job.salary_min) : 0;
  const maxNum = job.salary_max ? Number(job.salary_max) : 0;

  if (minNum > 0 && maxNum > 0) {
    const minK = Math.round(minNum / 1000);
    const maxK = Math.round(maxNum / 1000);
    if (minK === maxK) {
      return { text: `${minK}k €${periodSuffix}`, isKnown: true };
    }
    return { text: `${minK}k–${maxK}k €${periodSuffix}`, isKnown: true };
  }
  if (minNum > 0) {
    const minK = Math.round(minNum / 1000);
    return {
      text: isEnglish ? `From ${minK}k €${periodSuffix}` : `Desde ${minK}k €${periodSuffix}`,
      isKnown: true,
    };
  }
  if (maxNum > 0) {
    const maxK = Math.round(maxNum / 1000);
    return {
      text: isEnglish ? `Up to ${maxK}k €${periodSuffix}` : `Hasta ${maxK}k €${periodSuffix}`,
      isKnown: true,
    };
  }

  const raw = (job.salary || '').trim();
  if (!raw || ['consultar', 'negotiable', 'ver salario', 'sin especificar'].includes(raw.toLowerCase())) {
    return { text: fallback, isKnown: false };
  }

  // Si viene en USD o GBP, convertir a EUR
  const converted = convertRawSalaryToEur(raw);
  if (converted) {
    return { text: `${converted}${periodSuffix}`, isKnown: true };
  }

  return { text: raw, isKnown: true };
}
