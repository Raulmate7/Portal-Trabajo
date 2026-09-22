import pool from '@/lib/db';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';
import { slugify } from '@/lib/slug';

export const revalidate = 3600; // Cache 1 hora

export const metadata: Metadata = {
  title: 'Salarios IT por Empresa en España [2026] | Comparativa de Sueldos',
  description: 'Descubre los salarios medios pagados por las principales empresas tecnológicas que contratan programadores en España. Ranking por sueldo bruto estimado y teletrabajo.',
  alternates: {
    canonical: `${BASE_URL}/salarios/por-empresa`,
  },
  openGraph: {
    title: 'Salarios IT por Empresa en España [2026] | Portal Trabajo',
    description: 'Ranking y sueldos medios pagados por las empresas tech en España.',
    url: `${BASE_URL}/salarios/por-empresa`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Salarios IT por Empresa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salarios IT por Empresa en España [2026]',
    description: 'Ranking de sueldos medios por empresa tecnológica en España.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

async function getCompanySalaries() {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT company, COUNT(*) as job_count, GROUP_CONCAT(salary SEPARATOR '||') as salaries
      FROM jobs 
      WHERE is_active = TRUE AND company IS NOT NULL AND company != '' AND company != 'Desconocida'
      GROUP BY company
      HAVING job_count >= 2
      ORDER BY job_count DESC
      LIMIT 25
    `;
    const res = await client.query(sql);

    const companies = [];

    for (const row of res.rows) {
      const companyName = row.company;
      const slug = slugify(companyName);
      const salariesArr = Array.isArray(row.salaries)
        ? row.salaries
        : (typeof row.salaries === 'string' ? row.salaries.split('||') : []);

      let sumSalary = 0;
      let countWithSalary = 0;

      for (const salary of salariesArr) {
        if (!salary) continue;
        const cleanStr = salary.replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
        const numbers = cleanStr.match(/\d+(\.\d+)?/g);
        if (!numbers || numbers.length === 0) continue;

        const parsedNums = numbers.map((n: string) => parseFloat(n)).filter((n: number) => !isNaN(n));
        let val = 0;
        if (parsedNums.length >= 2) {
          val = (parsedNums[0] + parsedNums[1]) / 2;
        } else if (parsedNums.length === 1) {
          val = parsedNums[0];
        }

        if (val > 0 && val < 5000) val = val * 12;

        if (val >= 12000 && val <= 150000) {
          sumSalary += val;
          countWithSalary++;
        }
      }

      const avgSalary = countWithSalary > 0 ? Math.round(sumSalary / countWithSalary) : null;

      companies.push({
        name: companyName,
        slug,
        jobCount: Number(row.job_count),
        avgSalary
      });
    }

    return companies.sort((a, b) => (b.avgSalary || 0) - (a.avgSalary || 0));

  } catch (error) {
    console.error("Error cargando salarios por empresa:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function SalariosPorEmpresaPage() {
  const companies = await getCompanySalaries();

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Salarios Medios IT por Empresa en España',
    description: 'Ranking de empresas tecnológicas por salario medio bruto anual pagado a sus desarrolladores.',
    numberOfItems: companies.length,
    itemListElement: companies.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.name,
      url: `${BASE_URL}/empresas/${c.slug}`
    }))
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🏢 Salarios por Empresa IT 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Salarios IT por Empresa
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Compara la retribución bruta media estimada ofertada por las principales empresas que contratan perfiles de tecnología en España.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Salarios', href: '/salarios' },
          { label: 'Por Empresa' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <AdBanner variant="inline" />

        {/* Tabla / Ranking */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📊</span> Ranking de Retribución por Empresa
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Basado en análisis de ofertas de trabajo activas publicadas por cada empresa en España.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-850 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <th className="py-3.5 px-6">Posición / Empresa</th>
                  <th className="py-3.5 px-6">Ofertas Activas</th>
                  <th className="py-3.5 px-6 text-right">Salario Medio Estimado</th>
                  <th className="py-3.5 px-6 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                {companies.map((company, index) => (
                  <tr key={company.slug} className="hover:bg-gray-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 text-xs flex items-center justify-center font-extrabold shrink-0">
                        {index + 1}
                      </span>
                      <Link href={`/empresas/${company.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {company.name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-slate-400 text-xs">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 rounded-md font-semibold">
                        {company.jobCount} {company.jobCount === 1 ? 'oferta' : 'ofertas'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-indigo-650 dark:text-indigo-400 text-base">
                      {company.avgSalary ? `${company.avgSalary.toLocaleString('es-ES')} € / año` : 'Consultar'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/empresas/${company.slug}`}
                        className="inline-block px-3 py-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-xs transition"
                      >
                        Ver Ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AdBanner variant="multiplex" />
      </div>
    </main>
  );
}
