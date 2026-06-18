import pool from '@/lib/db';
import Link from 'next/link';

export const metadata = {
  title: 'Panel de Administración | Portal Trabajo IT',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ pw?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const isAuthorized = resolvedParams.pw === adminPassword;

  if (!isAuthorized) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-4xl">🔒</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Acceso Administrador</h1>
            <p className="text-sm text-slate-500">Introduce la clave de acceso para visualizar las métricas y conversiones.</p>
          </div>
          <form method="GET" className="space-y-4">
            <div>
              <input
                type="password"
                name="pw"
                required
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-98"
            >
              Entrar al Panel
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Fetch real statistics from database
  let totalSubscribers = 0;
  let dailySubscribers = 0;
  let weeklySubscribers = 0;
  let totalPremiumLeads = 0;
  let totalSponsoredJobs = 0;
  let sponsoredJobs: any[] = [];
  let totalEmailOpens = 0;
  let opensByCampaign: any[] = [];

  const client = await pool.connect();
  try {
    // 1. Total Subscribers
    const subRes = await client.query("SELECT COUNT(*) as count FROM subscribers");
    totalSubscribers = parseInt(subRes.rows[0]?.count || '0', 10);

    // 2. Frequency breakdown
    const freqRes = await client.query("SELECT frequency, COUNT(*) as count FROM subscribers GROUP BY frequency");
    for (const r of freqRes.rows) {
      if (r.frequency === 'daily') dailySubscribers = parseInt(r.count, 10);
      if (r.frequency === 'weekly') weeklySubscribers = parseInt(r.count, 10);
    }

    // 3. Premium Leads
    const leadsRes = await client.query("SELECT COUNT(*) as count FROM premium_leads");
    totalPremiumLeads = parseInt(leadsRes.rows[0]?.count || '0', 10);

    // 4. Sponsored Jobs
    const spCountRes = await client.query("SELECT COUNT(*) as count FROM sponsored_jobs");
    totalSponsoredJobs = parseInt(spCountRes.rows[0]?.count || '0', 10);

    const spRes = await client.query(
      "SELECT company_name, job_title, plan, status, created_at FROM sponsored_jobs ORDER BY created_at DESC LIMIT 6"
    );
    sponsoredJobs = spRes.rows || [];

    // 5. Email Opens
    const openRes = await client.query("SELECT COUNT(*) as count FROM email_tracking");
    totalEmailOpens = parseInt(openRes.rows[0]?.count || '0', 10);

    const campRes = await client.query(
      "SELECT campaign, COUNT(*) as count FROM email_tracking GROUP BY campaign ORDER BY count DESC LIMIT 6"
    );
    opensByCampaign = campRes.rows || [];

  } catch (err) {
    console.error("Error cargando estadísticas de administración:", err);
  } finally {
    client.release();
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h1 className="text-2xl font-black tracking-tight">Panel de Control IT</h1>
            </div>
            <p className="text-indigo-200 text-xs md:text-sm">Consolidado en tiempo real de monetización, registros e email tracking.</p>
          </div>
          <Link href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold text-xs rounded-xl border border-slate-700 text-center transition-colors">
            🏠 Volver al Portal
          </Link>
        </div>

        {/* Mallas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Subscribers */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Boletín Suscriptores</span>
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-lg">👥</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalSubscribers.toLocaleString('es-ES')}</p>
              <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                <span>⚡ {dailySubscribers} diarios</span>
                <span>📅 {weeklySubscribers} semanales</span>
              </div>
            </div>
          </div>

          {/* Card 2: Premium Leads */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talento Premium</span>
              <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-lg">⭐</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalPremiumLeads.toLocaleString('es-ES')}</p>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold inline-block mt-2">Leads Activos</span>
            </div>
          </div>

          {/* Card 3: Sponsored Jobs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ofertas Patrocinadas</span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-lg">💰</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalSponsoredJobs.toLocaleString('es-ES')}</p>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 px-2.5 py-0.5 rounded-full font-bold inline-block mt-2 border border-emerald-200 dark:border-emerald-900">Solicitudes</span>
            </div>
          </div>

          {/* Card 4: Email Opens */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aperturas Trackeadas</span>
              <span className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg text-lg">📧</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalEmailOpens.toLocaleString('es-ES')}</p>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 px-2.5 py-0.5 rounded-full font-bold inline-block mt-2">Aperturas Totales</span>
            </div>
          </div>

        </div>

        {/* Tablas de Detalles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Solicitudes de Patrocinio */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>💸</span> Patrocinios Recientes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                    <th className="p-4 text-xs tracking-wider uppercase font-bold">Empresa</th>
                    <th className="p-4 text-xs tracking-wider uppercase font-bold">Puesto</th>
                    <th className="p-4 text-xs tracking-wider uppercase font-bold">Plan</th>
                    <th className="p-4 text-xs tracking-wider uppercase font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sponsoredJobs.length > 0 ? (
                    sponsoredJobs.map((j: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-150">{j.company_name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 text-xs font-semibold">{j.job_title}</td>
                        <td className="p-4 text-xs font-bold text-indigo-650 dark:text-indigo-400 capitalize">{j.plan}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            j.status === 'aprobado' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/50' 
                              : 'bg-amber-50 dark:bg-amber-950/35 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-amber-900/50'
                          }`}>
                            {j.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">No hay solicitudes de patrocinio aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aperturas de Campañas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📈</span> Aperturas por Campaña
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                    <th className="p-4 text-xs tracking-wider uppercase font-bold">Campaña</th>
                    <th className="p-4 text-xs tracking-wider uppercase font-bold text-right">Aperturas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {opensByCampaign.length > 0 ? (
                    opensByCampaign.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">{c.campaign}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white text-right">{parseInt(c.count, 10).toLocaleString('es-ES')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-slate-400 italic">No hay datos de tracking de aperturas de email.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
