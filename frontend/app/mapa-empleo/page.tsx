import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';
import { slugify } from '@/lib/slug';

export const revalidate = 86400; // Cache de 24h (ISR)

export const metadata: Metadata = {
  title: 'Mapa del Empleo IT en España 2026 | Estadísticas y Salarios',
  description: 'Descubre en qué comunidades autónomas y ciudades hay más ofertas de empleo tecnológico en España. Consulta salarios medios y vacantes activas.',
  alternates: {
    canonical: '/mapa-empleo',
  }
};

interface CcaaStat {
  name: string;
  count: number;
  averageSalary: number | null;
  code: string;
  colorClass: string;
}

function mapLocationToCcaa(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes('madrid')) return 'Madrid';
  if (loc.includes('barcelona') || loc.includes('girona') || loc.includes('tarragona') || loc.includes('lleida') || loc.includes('cataluña') || loc.includes('catalunya')) return 'Cataluña';
  if (loc.includes('valencia') || loc.includes('alicante') || loc.includes('castellon') || loc.includes('comunidad valenciana')) return 'Comunidad Valenciana';
  if (loc.includes('sevilla') || loc.includes('malaga') || loc.includes('málaga') || loc.includes('granada') || loc.includes('cordoba') || loc.includes('cádiz') || loc.includes('cadiz') || loc.includes('almeria') || loc.includes('huelva') || loc.includes('jaen') || loc.includes('andalucía') || loc.includes('andalucia')) return 'Andalucía';
  if (loc.includes('bilbao') || loc.includes('san sebastian') || loc.includes('vitoria') || loc.includes('vizcaya') || loc.includes('alava') || loc.includes('guipuzcoa') || loc.includes('país vasco') || loc.includes('pais vasco') || loc.includes('euskadi')) return 'País Vasco';
  if (loc.includes('zaragoza') || loc.includes('huesca') || loc.includes('teruel') || loc.includes('aragón') || loc.includes('aragon')) return 'Aragón';
  if (loc.includes('santiago') || loc.includes('coruña') || loc.includes('vigo') || loc.includes('lugo') || loc.includes('ourense') || loc.includes('pontevedra') || loc.includes('galicia')) return 'Galicia';
  if (loc.includes('asturias') || loc.includes('gijon') || loc.includes('oviedo')) return 'Asturias';
  if (loc.includes('cantabria') || loc.includes('santander')) return 'Cantabria';
  if (loc.includes('navarra') || loc.includes('pamplona')) return 'Navarra';
  if (loc.includes('rioja') || loc.includes('logroño')) return 'La Rioja';
  if (loc.includes('murcia')) return 'Murcia';
  if (loc.includes('baleares') || loc.includes('mallorca') || loc.includes('ibiza') || loc.includes('menorca')) return 'Islas Baleares';
  if (loc.includes('canarias') || loc.includes('tenerife') || loc.includes('gran canaria') || loc.includes('palma')) return 'Islas Canarias';
  if (loc.includes('toledo') || loc.includes('ciudad real') || loc.includes('cuenca') || loc.includes('guadalajara') || loc.includes('albacete') || loc.includes('castilla la mancha') || loc.includes('castilla-la mancha')) return 'Castilla-La Mancha';
  if (loc.includes('valladolid') || loc.includes('leon') || loc.includes('león') || loc.includes('burgos') || loc.includes('salamanca') || loc.includes('segovia') || loc.includes('soria') || loc.includes('palencia') || loc.includes('zamora') || loc.includes('avila') || loc.includes('ávila') || loc.includes('castilla y leon') || loc.includes('castilla y león')) return 'Castilla y León';
  if (loc.includes('badajoz') || loc.includes('caceres') || loc.includes('cáceres') || loc.includes('extremadura')) return 'Extremadura';
  if (loc.includes('remoto') || loc.includes('remote') || loc.includes('teletrabajo')) return 'Remoto';
  return 'Otros';
}

const ccaaCodes: Record<string, string> = {
  'Madrid': 'MD',
  'Cataluña': 'CT',
  'Comunidad Valenciana': 'VC',
  'Andalucía': 'AN',
  'País Vasco': 'PV',
  'Aragón': 'AR',
  'Galicia': 'GA',
  'Asturias': 'AS',
  'Cantabria': 'CB',
  'Navarra': 'NC',
  'La Rioja': 'RI',
  'Murcia': 'MC',
  'Islas Baleares': 'IB',
  'Islas Canarias': 'CN',
  'Castilla-La Mancha': 'CM',
  'Castilla y León': 'CL',
  'Extremadura': 'EX',
  'Remoto': 'RM',
  'Otros': 'OT'
};

async function getJobStatsByCcaa(): Promise<CcaaStat[]> {
  const client = await pool.connect();
  try {
    const res = await pool.query(
      `SELECT location, salary_min, salary_max FROM jobs WHERE is_active = TRUE`
    );
    
    const ccaaStats: Record<string, { count: number; salarySum: number; salaryCount: number }> = {};
    
    const ccaas = [
      'Madrid', 'Cataluña', 'Comunidad Valenciana', 'Andalucía', 'País Vasco', 'Aragón', 'Galicia',
      'Asturias', 'Cantabria', 'Navarra', 'La Rioja', 'Murcia', 'Islas Baleares', 'Islas Canarias',
      'Castilla-La Mancha', 'Castilla y León', 'Extremadura', 'Remoto'
    ];
    
    ccaas.forEach(c => {
      ccaaStats[c] = { count: 0, salarySum: 0, salaryCount: 0 };
    });
    ccaaStats['Otros'] = { count: 0, salarySum: 0, salaryCount: 0 };

    for (const row of res.rows) {
      const ccaa = mapLocationToCcaa(row.location || '');
      ccaaStats[ccaa].count++;

      // Calcular salarios medios
      if (row.salary_min) {
        const min = parseFloat(row.salary_min);
        const max = row.salary_max ? parseFloat(row.salary_max) : min;
        const avg = (min + max) / 2;
        if (avg >= 12000 && avg <= 150000) {
          ccaaStats[ccaa].salarySum += avg;
          ccaaStats[ccaa].salaryCount++;
        }
      }
    }

    return Object.keys(ccaaStats).map(name => {
      const s = ccaaStats[name];
      const count = s.count;
      const averageSalary = s.salaryCount > 0 ? Math.round(s.salarySum / s.salaryCount) : null;
      const code = ccaaCodes[name] || 'OT';

      // Asignar colores según volumen
      let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      if (count > 400) {
        colorClass = 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700';
      } else if (count > 150) {
        colorClass = 'bg-indigo-150 text-indigo-850 border-indigo-200 hover:bg-indigo-200/80';
      } else if (count > 50) {
        colorClass = 'bg-violet-50 text-violet-850 border-violet-100 hover:bg-violet-100/85';
      } else if (count > 5) {
        colorClass = 'bg-slate-50 text-slate-800 border-gray-200 hover:bg-slate-100';
      }

      return {
        name,
        count,
        averageSalary,
        code,
        colorClass
      };
    }).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error al obtener estadísticas por CCAA:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function MapaEmpleoPage() {
  const stats = await getJobStatsByCcaa();
  const totalActiveJobs = stats.reduce((sum, s) => sum + s.count, 0);

  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    'name': 'Distribución Geográfica del Empleo IT en España 2026',
    'description': 'Datos agregados sobre vacantes activas e ingresos promedio de programadores y técnicos por comunidad autónoma en España.',
    'creator': {
      '@type': 'Organization',
      'name': 'Portal Trabajo IT'
    },
    'distribution': [
      {
        '@type': 'DataDownload',
        'encodingFormat': 'application/json',
        'contentUrl': `${BASE_URL}/api/stats/ccaa`
      }
    ]
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': '¿Dónde hay más ofertas de empleo tecnológico en España?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'La Comunidad de Madrid y Cataluña (principalmente Barcelona) concentran más del 60% de las ofertas de empleo IT en España, seguidas de la modalidad de teletrabajo (100% remoto) y la Comunidad Valenciana.'
        }
      },
      {
        '@type': 'Question',
        'name': '¿Cuál es el salario medio de un programador en Madrid comparado con remoto?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Las ofertas en modalidad 100% remota y en Madrid registran los salarios promedio más altos del país, superando habitualmente la mediana nacional debido a la competencia por perfiles experimentados.'
        }
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen font-sans">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Recursos', href: '/recursos' },
        { label: 'Mapa de Empleo IT' }
      ]} />

      {/* Hero Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black mb-4 border border-indigo-100">
          🗺️ Geografía del Mercado Laboral Tech 2026
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
          Mapa de Empleo IT y Salarios en España
        </h1>
        <p className="text-gray-650 text-base leading-relaxed">
          Analiza visualmente la oferta laboral por comunidades autónomas. Descubre dónde se concentran las mayores oportunidades y mejores retribuciones de nuestro portal.
        </p>
      </div>

      {/* Anuncio Leaderboard */}
      <div className="mb-8">
        <AdBanner variant="inline" />
      </div>

      {/* Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Mapa Visual Interactivo Simplificado (Oportunidad 1.7) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col justify-center items-center">
            <h2 className="text-lg font-bold text-gray-900 mb-4 self-start flex items-center gap-2">
              <span>📍</span> Distribución de Oportunidades Activas
            </h2>
            
            {/* Mapa de España Estilizado en Cuadrícula y Tarjetas Modernas */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {stats.slice(0, 9).map((s) => (
                <div 
                  key={s.name} 
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between ${s.colorClass}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-wider opacity-90">{s.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-bold">{s.code}</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black block leading-none">{s.count}</span>
                    <span className="text-[10px] opacity-75">{s.count === 1 ? 'Oferta' : 'Ofertas activas'}</span>
                  </div>
                  {s.averageSalary && (
                    <span className="text-[10px] font-semibold mt-2 block border-t border-white/10 pt-1.5">
                      💰 {s.averageSalary.toLocaleString('es-ES')}€ {isEnglish ? 'avg' : 'medio'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-gray-400 self-start">
              * El sombreado índigo oscuro representa las zonas con mayor densidad de ofertas laborales activas de desarrollo de software y sistemas.
            </div>
          </div>

          {/* Tabla de Datos de CCAA */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="bg-gray-50/75 p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 m-0">📊 Estadísticas Completas por Región</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100/40 text-gray-400 font-bold border-b border-gray-100 text-xs uppercase tracking-wider text-center">
                    <th className="p-4 text-left pl-6">Comunidad Autónoma</th>
                    <th className="p-4">Vacantes Activas</th>
                    <th className="p-4">Salario Promedio Estimado</th>
                    <th className="p-4 pr-6">Buscar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-center">
                  {stats.map((s) => (
                    <tr key={s.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900 text-left pl-6">{s.name}</td>
                      <td className="p-4 font-semibold text-gray-700">{s.count}</td>
                      <td className="p-4 font-semibold text-indigo-700">
                        {s.averageSalary ? `${s.averageSalary.toLocaleString('es-ES')}€` : 'N/A'}
                      </td>
                      <td className="p-4 pr-6">
                        <Link 
                          href={s.name === 'Remoto' ? '/trabajo-remoto' : `/trabajos/informatica-tecnologia-en-${slugify(s.name)}`}
                          className="text-xs font-bold text-indigo-650 hover:underline"
                        >
                          Ver ofertas &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <SubscribeForm location="España (Mapa de Empleo)" />
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-gray-950">💡 Datos clave detectados</h3>
            <ul className="text-xs text-gray-600 space-y-2.5 list-disc pl-4">
              <li>El **teletrabajo** (Remoto) es el segundo "hub" con más ofertas activas, ofreciendo máxima conciliación.</li>
              <li>**Madrid** y **Cataluña** representan el principal polo presencial y con mayor variedad de stacks técnicos.</li>
              <li>Comunidades como Andalucía (Málaga tech) y Comunidad Valenciana registran crecimientos notables en salarios de perfiles de datos y DevOps.</li>
            </ul>
          </div>

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}



const isEnglish = false;
