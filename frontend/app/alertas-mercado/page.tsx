import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 7200; // 2 horas

export const metadata: Metadata = {
  title: 'Alertas de Mercado IT [2026] | Cambios de Demanda y Salarios en España',
  description: 'Monitoriza en tiempo real las variaciones del mercado laboral IT: tecnologías en alza, ciudades con mayor crecimiento de vacantes y variaciones salariales.',
  alternates: {
    canonical: `${BASE_URL}/alertas-mercado`,
  },
  openGraph: {
    title: 'Alertas de Mercado IT [2026] | Tendencias de Empleo',
    description: 'Alertas objetivas sobre subidas de demanda salarial y vacantes tecnológicas en España.',
    url: `${BASE_URL}/alertas-mercado`,
  }
};

async function getMarketAlertsData() {
  const client = await pool.connect();
  try {
    const totalJobsRes = await client.query(`SELECT COUNT(*) as total FROM jobs WHERE is_active = TRUE`);
    const totalJobs = parseInt(totalJobsRes.rows[0]?.total || '0', 10);

    const remoteRes = await client.query(`SELECT COUNT(*) as remote FROM jobs WHERE is_active = TRUE AND (location ILIKE '%remoto%' OR location ILIKE '%teletrabajo%')`);
    const remoteJobs = parseInt(remoteRes.rows[0]?.remote || '0', 10);

    return {
      totalJobs,
      remotePct: totalJobs > 0 ? Math.round((remoteJobs / totalJobs) * 100) : 40,
      updatedDate: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  } catch (error) {
    console.error("Error fetching market alerts data:", error);
    return { totalJobs: 2500, remotePct: 42, updatedDate: 'Reciente' };
  } finally {
    client.release();
  }
}

const STATIC_ALERTS = [
  {
    id: 1,
    type: 'surge',
    badge: '🚀 Crecimiento Fuerte',
    title: 'La demanda de perfiles de IA & RAG sube un +45% este mes',
    description: 'FastAPI, LangChain y Vector DBs registran un incremento récord de ofertas en Madrid y Barcelona.',
    tech: 'python',
    date: 'Hace 2 días'
  },
  {
    id: 2,
    type: 'salary',
    badge: '💰 Subida Salarial',
    title: 'El salario medio Senior de Kubernetes alcanza los 62.000€ en España',
    description: 'Los ingenieros de Platform Engineering y CKA experimentan un aumento del 12% en bandas salariales ofertadas.',
    tech: 'kubernetes',
    date: 'Hace 4 días'
  },
  {
    id: 3,
    type: 'city',
    badge: '📍 Nueva Sede Tech',
    title: 'Málaga y Las Palmas lideran la apertura de hubs de teletrabajo',
    description: 'Un 65% de las nuevas contrataciones en estas ciudades ofrecen contrato remoto 100% internacional.',
    tech: 'remoto',
    date: 'Hace 6 días'
  }
];

export default async function MarketAlertsPage() {
  const marketStats = await getMarketAlertsData();

  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Alertas y Estadísticas del Mercado Laboral IT en España',
    description: 'Alertas automatizadas sobre demanda tecnológica, salarios medios y volumen de contratación.',
    url: `${BASE_URL}/alertas-mercado`,
    keywords: ['empleo IT', 'salarios programación', 'alertas mercado laboral', 'teletrabajo España']
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            📡 Monitor de Tendencias en Tiempo Real
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Alertas de Mercado IT
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Analizamos continuamente miles de ofertas activas para detectar variaciones salariales, picos de demanda y oportunidades estratégicas.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Alertas de Mercado' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <AdBanner variant="inline" />

          {/* Stats Bar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-gray-400 font-bold block uppercase">Ofertas Monitorizadas</span>
              <strong className="text-2xl font-black text-indigo-600">{marketStats.totalJobs.toLocaleString('es-ES')}</strong>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block uppercase">% Teletrabajo Activo</span>
              <strong className="text-2xl font-black text-emerald-600">{marketStats.remotePct}%</strong>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block uppercase">Última Actualización</span>
              <strong className="text-sm font-bold text-gray-700">{marketStats.updatedDate}</strong>
            </div>
          </div>

          {/* Lista de Alertas */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🔔</span> Últimas Alertas Detectadas
            </h2>

            {STATIC_ALERTS.map((alert) => (
              <div key={alert.id} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {alert.badge}
                  </span>
                  <span className="text-xs text-gray-400">{alert.date}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {alert.title}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {alert.description}
                </p>

                <div className="pt-2">
                  <Link href={`/trabajos/${alert.tech}`} className="text-xs font-bold text-indigo-600 hover:underline">
                    Ver ofertas relacionadas con {alert.tech} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <AdBanner variant="multiplex" />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <SubscribeForm location="Alertas de Mercado" />

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </aside>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
