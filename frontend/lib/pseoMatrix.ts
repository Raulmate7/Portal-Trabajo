import pool from '@/lib/db';
import { getProgrammaticMarketInsights, ProgrammaticMarketInsights } from '@/lib/seoInsights';

export interface PseoRoleInfo {
  label: string;
  searchTerms: string[];
  roleTitle: string;
}

export const PSEO_ROLES: Record<string, PseoRoleInfo> = {
  python: { label: 'Python', searchTerms: ['python', 'django', 'fastapi'], roleTitle: 'Programador Python' },
  react: { label: 'React', searchTerms: ['react', 'reactjs', 'next.js'], roleTitle: 'Desarrollador React' },
  node: { label: 'Node.js', searchTerms: ['node', 'nodejs', 'nestjs'], roleTitle: 'Desarrollador Node.js' },
  java: { label: 'Java', searchTerms: ['java', 'spring'], roleTitle: 'Programador Java' },
  typescript: { label: 'TypeScript', searchTerms: ['typescript'], roleTitle: 'Desarrollador TypeScript' },
  javascript: { label: 'JavaScript', searchTerms: ['javascript', 'js'], roleTitle: 'Programador JavaScript' },
  aws: { label: 'AWS', searchTerms: ['aws', 'amazon web services'], roleTitle: 'Ingeniero AWS' },
  docker: { label: 'Docker', searchTerms: ['docker', 'contenedores'], roleTitle: 'Ingeniero Docker / DevOps' },
  kubernetes: { label: 'Kubernetes', searchTerms: ['kubernetes', 'k8s'], roleTitle: 'Ingeniero Kubernetes' },
  go: { label: 'Go', searchTerms: ['golang', 'go '], roleTitle: 'Programador Go' },
  rust: { label: 'Rust', searchTerms: ['rust'], roleTitle: 'Programador Rust' },
  php: { label: 'PHP', searchTerms: ['php', 'laravel', 'symfony'], roleTitle: 'Programador PHP' },
  csharp: { label: 'C# / .NET', searchTerms: ['c#', '.net', 'csharp'], roleTitle: 'Desarrollador .NET' },
  flutter: { label: 'Flutter', searchTerms: ['flutter', 'dart'], roleTitle: 'Desarrollador Flutter' },
  sql: { label: 'SQL', searchTerms: ['sql', 'postgresql', 'mysql'], roleTitle: 'Especialista SQL / Datos' },
  cybersecurity: { label: 'Ciberseguridad', searchTerms: ['ciberseguridad', 'cybersecurity', 'pentest', 'soc'], roleTitle: 'Especialista en Ciberseguridad' },
  terraform: { label: 'Terraform', searchTerms: ['terraform', 'iac'], roleTitle: 'Ingeniero Terraform' },
  devops: { label: 'DevOps', searchTerms: ['devops', 'sre', 'ci/cd'], roleTitle: 'Ingeniero DevOps' },
  backend: { label: 'Backend', searchTerms: ['backend', 'back-end'], roleTitle: 'Desarrollador Backend' },
  frontend: { label: 'Frontend', searchTerms: ['frontend', 'front-end'], roleTitle: 'Desarrollador Frontend' },
  fullstack: { label: 'Full Stack', searchTerms: ['fullstack', 'full-stack', 'full stack'], roleTitle: 'Desarrollador Full Stack' },
  data: { label: 'Data & IA', searchTerms: ['data engineer', 'data scientist', 'machine learning', 'datos'], roleTitle: 'Ingeniero de Datos / IA' },
  mobile: { label: 'Mobile', searchTerms: ['android', 'ios', 'mobile', 'kotlin', 'swift'], roleTitle: 'Desarrollador Mobile' },
  angular: { label: 'Angular', searchTerms: ['angular'], roleTitle: 'Desarrollador Angular' },
  vue: { label: 'Vue.js', searchTerms: ['vue', 'vuejs', 'nuxt'], roleTitle: 'Desarrollador Vue.js' },
  salesforce: { label: 'Salesforce', searchTerms: ['salesforce', 'apex'], roleTitle: 'Desarrollador Salesforce' },
};

export interface MatrixQueryResult {
  role: PseoRoleInfo;
  slug: string;
  jobs: any[];
  totalCount: number;
  avgSalary: number | null;
  p25: number | null;
  p75: number | null;
  remotePct: number;
  topCompanies: Array<{ name: string; count: number; avgSalary: number | null }>;
  insights: ProgrammaticMarketInsights | null;
  isIndexable: boolean;
}

function extractNumericSalary(row: any): number | null {
  let val = 0;
  const sMin = row.salary_min ? Number(row.salary_min) : 0;
  const sMax = row.salary_max ? Number(row.salary_max) : 0;
  if (sMin > 0 && sMax >= sMin) val = (sMin + sMax) / 2;
  else if (sMin > 0) val = sMin;
  else if (row.salary && !/consultar|no especificado|a convenir/i.test(String(row.salary))) {
    const clean = String(row.salary).replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
    const nums = clean.match(/\d+(\.\d+)?/g);
    if (!nums) return null;
    const parsed = nums.map((n) => parseFloat(n)).filter((n) => !isNaN(n));
    if (parsed.length >= 2) val = (parsed[0] + parsed[1]) / 2;
    else if (parsed.length === 1) val = parsed[0];
  }
  if (val > 0 && val < 5000) val *= 12;
  if (val >= 14000 && val <= 160000) return Math.round(val);
  return null;
}

export async function queryPseoMatrix(
  slug: string,
  mode: 'junior' | 'freelance' | 'remote_companies' | 'salary_guide'
): Promise<MatrixQueryResult | null> {
  const cleanSlug = slug.toLowerCase().trim();
  const role = PSEO_ROLES[cleanSlug];
  if (!role) return null;

  const client = await pool.connect();
  try {
    const params: any[] = [];
    const termConds = role.searchTerms.map((term) => {
      params.push(`%${term}%`);
      const p1 = `$${params.length}`;
      params.push(`%${term}%`);
      const p2 = `$${params.length}`;
      return `(title ILIKE ${p1} OR description_snippet ILIKE ${p2})`;
    });
    let where = `is_active = TRUE AND (${termConds.join(' OR ')})`;

    if (mode === 'junior') {
      where += ` AND (title ILIKE '%junior%' OR title ILIKE '%jr%' OR title ILIKE '%trainee%' OR title ILIKE '%beca%' OR title ILIKE '%prácticas%' OR description_snippet ILIKE '%sin experiencia%' OR seniority_level = 'junior')`;
    } else if (mode === 'freelance') {
      where += ` AND (title ILIKE '%freelance%' OR title ILIKE '%contractor%' OR title ILIKE '%autónomo%' OR description_snippet ILIKE '%freelance%' OR description_snippet ILIKE '%contractor%')`;
    } else if (mode === 'remote_companies') {
      where += ` AND (location ILIKE '%remoto%' OR location ILIKE '%remote%' OR location ILIKE '%teletrabajo%' OR location ILIKE '%worldwide%')`;
    }

    const [jobsRes, countRes, statsRes, insights] = await Promise.all([
      client.query(
        `SELECT id, title, title_es, company, location, salary, salary_min, salary_max, category, created_at, url_source, is_featured
         FROM jobs
         WHERE ${where}
         ORDER BY is_featured DESC, created_at DESC
         LIMIT 24`,
        params
      ),
      client.query(`SELECT COUNT(*) AS cnt FROM jobs WHERE ${where}`, params),
      client.query(
        `SELECT company, salary, salary_min, salary_max, location
         FROM jobs
         WHERE ${where}
         LIMIT 400`,
        params
      ),
      getProgrammaticMarketInsights(cleanSlug),
    ]);

    const totalCount = parseInt(countRes.rows?.[0]?.cnt || '0', 10);
    const statRows = statsRes.rows || [];
    const salaries: number[] = [];
    let remoteCnt = 0;
    const companyMap = new Map<string, { count: number; salaries: number[] }>();

    for (const r of statRows) {
      const loc = String(r.location || '').toLowerCase();
      if (/remoto|remote|teletrabajo|worldwide/.test(loc)) remoteCnt++;

      const sal = extractNumericSalary(r);
      if (sal) salaries.push(sal);

      const comp = String(r.company || '').trim();
      if (comp && comp !== 'Desconocida' && comp !== 'Confidencial') {
        const cur = companyMap.get(comp) || { count: 0, salaries: [] };
        cur.count += 1;
        if (sal) cur.salaries.push(sal);
        companyMap.set(comp, cur);
      }
    }

    salaries.sort((a, b) => a - b);
    const avgSalary =
      salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : insights?.salaryAvg ?? null;
    const p25 = salaries.length >= 4 ? salaries[Math.floor(salaries.length * 0.25)] : insights?.salaryP25 ?? null;
    const p75 = salaries.length >= 4 ? salaries[Math.floor(salaries.length * 0.75)] : insights?.salaryP75 ?? null;
    const remotePct = statRows.length > 0 ? Math.round((remoteCnt / statRows.length) * 100) : insights?.remotePct ?? 0;

    const topCompanies = Array.from(companyMap.entries())
      .map(([name, info]) => ({
        name,
        count: info.count,
        avgSalary: info.salaries.length > 0 ? Math.round(info.salaries.reduce((a, b) => a + b, 0) / info.salaries.length) : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const isIndexable =
      mode === 'salary_guide'
        ? Boolean((insights && insights.isIndexable) || totalCount >= 5 || salaries.length >= 5)
        : totalCount >= 5;

    return {
      role,
      slug: cleanSlug,
      jobs: jobsRes.rows || [],
      totalCount,
      avgSalary,
      p25,
      p75,
      remotePct,
      topCompanies,
      insights,
      isIndexable,
    };
  } finally {
    client.release();
  }
}
