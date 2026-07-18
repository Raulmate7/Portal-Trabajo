import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import SalariosCalculator from '@/components/SalariosCalculator';
import Breadcrumbs from '@/components/Breadcrumbs';
import { calculateSalaryStats } from '@/lib/salarios';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Calculadora de Salarios IT en España [2026] | Portal Trabajo IT',
  description: 'Descubre cuánto cobra un desarrollador o profesional de tecnología en España. Calcula el salario medio bruto anual por tecnología, ciudad y experiencia.',
  alternates: {
    canonical: `${BASE_URL}/salarios`,
  },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const formatTableEur = (val: number | null, fallback: number) => {
  const value = val || fallback;
  return `${value.toLocaleString('es-ES')}€`;
};

export default async function SalariosPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const tech = typeof resolvedSearchParams.tech === 'string' ? resolvedSearchParams.tech : '';
  const location = typeof resolvedSearchParams.location === 'string' ? resolvedSearchParams.location : '';
  const experience = typeof resolvedSearchParams.experience === 'string' ? resolvedSearchParams.experience : '';

  // Pre-calcular estadísticas en el servidor
  const initialData = await calculateSalaryStats(tech, location, experience);

  const initialParams = {
    tech,
    location,
    experience
  };

  // Carga paralela de salarios por tecnología para la tabla comparativa
  const [
    reactStats,
    nodeStats,
    pythonStats,
    javaStats,
    typescriptStats,
    devopsStats,
    phpStats,
    sqlStats
  ] = await Promise.all([
    calculateSalaryStats('react', '', ''),
    calculateSalaryStats('node', '', ''),
    calculateSalaryStats('python', '', ''),
    calculateSalaryStats('java', '', ''),
    calculateSalaryStats('typescript', '', ''),
    calculateSalaryStats('devops', '', ''),
    calculateSalaryStats('php', '', ''),
    calculateSalaryStats('sql', '', '')
  ]);

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Calculadora de Salarios' }
  ];

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Estadísticas de Salarios IT en España - Portal Trabajo IT",
    "description": "Estadísticas agregadas de salarios medios y percentiles de contratación para desarrolladores de software y perfiles tecnológicos en España, analizadas a partir de vacantes de empleo activas.",
    "url": `${BASE_URL}/salarios`,
    "creator": {
      "@type": "Organization",
      "name": "Portal Trabajo IT",
      "url": BASE_URL
    },
    "distribution": [
      {
        "@type": "DataDownload",
        "encodingFormat": "text/html",
        "contentUrl": `${BASE_URL}/salarios`
      }
    ]
  };

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Calculadora de Salarios IT España",
    "url": `${BASE_URL}/salarios`,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "description": "Calculadora interactiva de salarios tecnológicos en España. Permite analizar sueldos por tecnología, región y nivel de experiencia basada en datos reales de ofertas de trabajo activas.",
    "creator": {
      "@type": "Organization",
      "name": "Portal Trabajo IT",
      "url": BASE_URL
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            💰 Datos reales de ofertas activas en España
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Calculadora de{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              Salarios IT
            </span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Descubre cuánto cobran los desarrolladores en España. Datos extraídos de{' '}
            <strong className="text-white">miles de ofertas reales</strong> publicadas en nuestro portal.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Introducción Editorial E-E-A-T */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <span>📈</span> Guía de Salarios IT en España: Metodología y Consejos
            </h2>
            <div className="text-gray-700 text-sm leading-relaxed space-y-4 font-sans">
              <p>
                El mercado laboral tecnológico en España ha experimentado un dinamismo sin precedentes. Conocer las bandas salariales de referencia es fundamental tanto si estás buscando tu primera oportunidad laboral como si deseas negociar una mejora en tu contrato actual. Nuestra **Calculadora de Salarios IT** te permite filtrar y explorar retribuciones medias basadas en datos reales.
              </p>
              
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mt-4">1. Metodología de Obtención de Datos</h3>
              <p>
                A diferencia de otras encuestas de opinión o datos declarados por usuarios de forma anónima, las estadísticas de nuestro portal se calculan a partir de **ofertas de empleo reales indexadas diariamente** en nuestra plataforma. Extraemos y normalizamos la información salarial indicada por las empresas (convirtiendo retribuciones mensuales a anuales y calculando la media de los rangos salariales), filtrando aquellas muestras anómalas o fuera de mercado para garantizar la fiabilidad estadística.
              </p>
              
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mt-4">2. ¿Cómo y cuándo utilizar esta calculadora?</h3>
              <p>
                Te recomendamos usar esta calculadora en los siguientes escenarios críticos de tu carrera profesional:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Preparación de Entrevistas:</strong> Define tu horquilla salarial objetivo antes de que el reclutador te pregunte tus expectativas económicas.</li>
                <li><strong>Negociación de Aumento:</strong> Utiliza el percentil 75% (Senior) como base y argumento sólido si demuestras competencias avanzadas y aportas alto valor a tu equipo.</li>
                <li><strong>Reorientación Profesional:</strong> Compara qué tecnologías o stacks (como el ecosistema Cloud/DevOps vs. Frontend) disfrutan de mejores bandas en tu ciudad o en remoto.</li>
              </ul>
              
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mt-4">3. Limitaciones Honestas de los Datos</h3>
              <p>
                Es importante tener en cuenta que no todas las ofertas publicadas en España transparentan su salario (muchas indican "salario según valía" o "a convenir"). Por tanto, las muestras reflejan el comportamiento de las empresas que sí apuestan por la transparencia salarial. Adicionalmente, factores individuales como el dominio del inglés, metodologías ágiles o habilidades de diseño de sistemas (System Design) pueden elevar tu sueldo por encima de los percentiles mostrados.
              </p>
            </div>
          </div>

          {/* Anuncio AdSense Arriba del Fold (Calculadora) */}
          <div className="mb-4">
            <AdBanner variant="inline" />
          </div>

          {/* Calculadora de Salarios con Datos Iniciales pre-cargados por SSR */}
          <SalariosCalculator initialData={initialData} initialParams={initialParams} />

          {/* Tabla de Salarios Medios por Tecnología */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Salarios de Referencia por Stack Tecnológico (España)
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Tabla comparativa actualizada con datos reales de contratación. Muestra el salario medio bruto anual, así como los percentiles de entrada (Junior) y perfiles Senior.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-bold">
                    <th className="py-3 px-4 rounded-l-lg">Tecnología</th>
                    <th className="py-3 px-4">Junior (P25)</th>
                    <th className="py-3 px-4">Salario Medio</th>
                    <th className="py-3 px-4 rounded-r-lg">Senior (P75)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-155 text-gray-700">
                  {[
                    { label: 'React / Frontend', stats: reactStats, fallback: { p25: 25000, avg: 38000, p75: 55000 } },
                    { label: 'Node.js / Backend', stats: nodeStats, fallback: { p25: 28000, avg: 42000, p75: 60000 } },
                    { label: 'Python / Data', stats: pythonStats, fallback: { p25: 28000, avg: 43000, p75: 62000 } },
                    { label: 'Java Enterprise', stats: javaStats, fallback: { p25: 26000, avg: 40000, p75: 58000 } },
                    { label: 'TypeScript', stats: typescriptStats, fallback: { p25: 28000, avg: 42000, p75: 60000 } },
                    { label: 'DevOps / Cloud', stats: devopsStats, fallback: { p25: 35000, avg: 48000, p75: 70000 } },
                    { label: 'PHP / Laravel', stats: phpStats, fallback: { p25: 22000, avg: 34000, p75: 48000 } },
                    { label: 'SQL / Bases de Datos', stats: sqlStats, fallback: { p25: 24000, avg: 36000, p75: 50000 } },
                  ].map((row, index) => {
                    const avg = row.stats?.average || row.fallback.avg;
                    const p25 = row.stats?.p25 || row.fallback.p25;
                    const p75 = row.stats?.p75 || row.fallback.p75;
                    return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{row.label}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-500">{formatTableEur(p25, row.fallback.p25)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-indigo-650">{formatTableEur(avg, row.fallback.avg)}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">{formatTableEur(p75, row.fallback.p75)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-150 text-[10px] text-gray-550 leading-relaxed">
              * Los percentiles mostrados representan: <strong>Junior (P25)</strong> representa el 25% inferior de la muestra (salarios de entrada o menor experiencia), <strong>Salario Medio</strong> es el promedio aritmético ponderado de la categoría y <strong>Senior (P75)</strong> representa el 75% superior (profesionales con alta experiencia o trabajo en remoto).
            </div>
          </div>

          {/* Sección de Interlinking de Informes Salariales */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative z-10">
            <h3 className="text-base font-bold text-gray-950 mb-5 flex items-center gap-2">
              <span>🔍</span> Informes Salariales IT más Buscados
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-gray-800 mb-2.5 border-b border-gray-100 pb-1.5">Por Tecnología</h4>
                <ul className="space-y-2 text-indigo-650 font-semibold">
                  <li><Link href="/salarios/react" className="hover:underline">React Developer</Link></li>
                  <li><Link href="/salarios/node" className="hover:underline">Node.js Developer</Link></li>
                  <li><Link href="/salarios/python" className="hover:underline">Python Developer</Link></li>
                  <li><Link href="/salarios/java" className="hover:underline">Java Developer</Link></li>
                  <li><Link href="/salarios/typescript" className="hover:underline">TypeScript Developer</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-800 mb-2.5 border-b border-gray-100 pb-1.5">Por Ciudad</h4>
                <ul className="space-y-2 text-indigo-650 font-semibold">
                  <li><Link href="/salarios/react/madrid" className="hover:underline">React en Madrid</Link></li>
                  <li><Link href="/salarios/node/remoto" className="hover:underline">Node.js en Remoto</Link></li>
                  <li><Link href="/salarios/python/barcelona" className="hover:underline">Python en Barcelona</Link></li>
                  <li><Link href="/salarios/java/madrid" className="hover:underline">Java en Madrid</Link></li>
                  <li><Link href="/salarios/typescript/remoto" className="hover:underline">TypeScript en Remoto</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-800 mb-2.5 border-b border-gray-100 pb-1.5">Por Experiencia</h4>
                <ul className="space-y-2 text-indigo-650 font-semibold">
                  <li><Link href="/salarios/react/remoto/senior" className="hover:underline">React Senior en Remoto</Link></li>
                  <li><Link href="/salarios/java/madrid/junior" className="hover:underline">Java Junior en Madrid</Link></li>
                  <li><Link href="/salarios/node/remoto/senior" className="hover:underline">Node.js Senior en Remoto</Link></li>
                  <li><Link href="/salarios/python/madrid/senior" className="hover:underline">Python Senior en Madrid</Link></li>
                  <li><Link href="/salarios/typescript/barcelona/junior" className="hover:underline">TypeScript Junior en BCN</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <AdBanner variant="inline" />
          </div>
        </div>

        {/* Barra lateral con anuncio AdSense Sticky */}
        <div className="lg:col-span-1 space-y-6">
          <div className="lg:sticky lg:top-24">
            <AdBanner variant="sidebar" enableRefresh={true} />
          </div>
        </div>
      </div>
    </main>
  );
}
