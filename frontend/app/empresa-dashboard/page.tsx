'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateRecruiterLoginLink, getRecruiterJobs } from '@/app/actions';

interface JobMetric {
  id: string;
  title: string;
  company: string;
  created_at: string;
  is_active: boolean | number;
  impressions_count: number | null;
  clicks_count: number | null;
}

interface SponsoredRequest {
  id: number;
  company_name: string;
  job_title: string;
  plan: string;
  status: string;
  created_at: string;
}

function EmpresaDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  // Dashboard stats
  const [authenticated, setAuthenticated] = useState(false);
  const [jobs, setJobs] = useState<JobMetric[]>([]);
  const [sponsoredJobs, setSponsoredJobs] = useState<SponsoredRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (emailParam && tokenParam) {
      loadDashboard(emailParam, tokenParam);
    }
  }, [emailParam, tokenParam]);

  async function loadDashboard(email: string, token: string) {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const res = await getRecruiterJobs(email, token);
      if (res.success) {
        setJobs(res.jobs || []);
        setSponsoredJobs(res.sponsoredJobs || []);
        setAuthenticated(true);
      } else {
        setErrorMsg(res.error || 'Acceso denegado.');
        setAuthenticated(false);
      }
    } catch (e) {
      setErrorMsg('Error de red al cargar el panel de empresa.');
      setAuthenticated(false);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleLoginRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    setGeneratedLink('');

    try {
      const res = await generateRecruiterLoginLink(emailInput.trim());
      if (res.success && res.loginLink) {
        setStatusMsg(res.message);
        setGeneratedLink(res.loginLink);
      } else {
        setErrorMsg(res.message || 'Error al procesar.');
      }
    } catch (e) {
      setErrorMsg('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    router.push('/empresa-dashboard');
    setAuthenticated(false);
    setJobs([]);
    setSponsoredJobs([]);
    setEmailInput('');
    setGeneratedLink('');
    setStatusMsg('');
  };

  // Metricas globales
  const totalImpressions = jobs.reduce((sum, j) => sum + (j.impressions_count || 0), 0);
  const totalClicks = jobs.reduce((sum, j) => sum + (j.clicks_count || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  if (loadingData) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-550 font-medium">Cargando panel de reclutador...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>🏢</span> Área de Empresas y Reclutadores
            </h1>
            <p className="text-gray-500 text-sm mt-1">Consulta el rendimiento de tus ofertas de empleo y tus solicitudes patrocinadas.</p>
          </div>
          {authenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              🚪 Cerrar sesión ({emailParam})
            </button>
          )}
        </div>

        {/* Auth Error Box */}
        {errorMsg && !authenticated && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1. Login Panel (no autenticado) */}
        {!authenticated ? (
          <div className="max-w-md mx-auto bg-white border border-gray-150 rounded-3xl p-8 shadow-xl mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ingresar a mi panel</h2>
            <p className="text-gray-550 text-xs mb-6 leading-relaxed">
              Introduce el correo electrónico que utilizaste para publicar ofertas de empleo en nuestro portal. Te proporcionaremos un enlace de acceso seguro.
            </p>

            <form onSubmit={handleLoginRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Email de Contacto</label>
                <input
                  type="email"
                  required
                  placeholder="empresa@correo.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md disabled:opacity-60 text-sm cursor-pointer"
              >
                {loading ? 'Generando...' : 'Obtener Enlace de Acceso →'}
              </button>
            </form>

            {statusMsg && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs space-y-3">
                <p className="font-semibold">✅ {statusMsg}</p>
                {generatedLink && (
                  <div className="pt-2 border-t border-emerald-200/60">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Enlace de acceso generado (prueba de desarrollo):</p>
                    <Link
                      href={generatedLink}
                      className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                    >
                      Acceder a mi panel ahora 🚀
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          
          // 2. Dashboard View (autenticado)
          <div className="space-y-8">
            
            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <span className="text-4xl">👁️</span>
                <div>
                  <span className="text-3xl font-black text-gray-900 block">{totalImpressions.toLocaleString('es-ES')}</span>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Impresiones Totales</span>
                </div>
              </div>
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <span className="text-4xl">👆</span>
                <div>
                  <span className="text-3xl font-black text-indigo-600 block">{totalClicks.toLocaleString('es-ES')}</span>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Clics de Candidatos</span>
                </div>
              </div>
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <span className="text-4xl">📈</span>
                <div>
                  <span className="text-3xl font-black text-emerald-650 block">{avgCtr}%</span>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">CTR Promedio (Clics/Visitas)</span>
                </div>
              </div>
            </div>

            {/* Ofertas Activas y Métricas */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                <span>📋</span> Tus ofertas de empleo publicadas ({jobs.length})
              </h2>
              <p className="text-xs text-gray-450 mb-6">Métricas de visualización y clics recopiladas en tiempo real en nuestro portal.</p>

              {jobs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-4xl block mb-3">📭</span>
                  <p className="text-gray-500 font-medium">No se encontraron ofertas activas en la base de datos principal.</p>
                  <p className="text-xs text-gray-400 mt-1">Las ofertas cargadas mediante patrocinio aparecerán aquí una vez activadas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <th className="pb-3 pr-4">Título del puesto</th>
                        <th className="pb-3 px-4">Fecha Publicación</th>
                        <th className="pb-3 px-4 text-center">Estado</th>
                        <th className="pb-3 px-4 text-right">Impresiones</th>
                        <th className="pb-3 px-4 text-right">Clics</th>
                        <th className="pb-3 pl-4 text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {jobs.map((job) => {
                        const imp = job.impressions_count || 0;
                        const cli = job.clicks_count || 0;
                        const ctr = imp > 0 ? ((cli / imp) * 100).toFixed(2) : '0.00';
                        return (
                          <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 pr-4 font-bold text-gray-900 max-w-xs truncate">
                              <Link href={`/job/${job.id}`} className="hover:text-indigo-600 hover:underline">
                                {job.title}
                              </Link>
                            </td>
                            <td className="py-4 px-4 text-xs text-gray-500">
                              {new Date(job.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                job.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}>
                                {job.is_active ? 'Activo' : 'Expirado'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold font-mono text-xs">{imp.toLocaleString('es-ES')}</td>
                            <td className="py-4 px-4 text-right font-semibold font-mono text-xs text-indigo-650">{cli.toLocaleString('es-ES')}</td>
                            <td className="py-4 pl-4 text-right font-black font-mono text-xs text-emerald-650">{ctr}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Solicitudes Patrocinadas (Stripe) */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                <span>💎</span> Historial de compras y planes patrocinados ({sponsoredJobs.length})
              </h2>
              <p className="text-xs text-gray-450 mb-6">Estado de tus solicitudes de publicación destacada.</p>

              {sponsoredJobs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-sm">
                  No tienes solicitudes de patrocinio cargadas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <th className="pb-3 pr-4">Puesto Solicitado</th>
                        <th className="pb-3 px-4">Fecha Solicitud</th>
                        <th className="pb-3 px-4">Plan Adquirido</th>
                        <th className="pb-3 pl-4 text-right">Estado Solicitud</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {sponsoredJobs.map((sj) => (
                        <tr key={sj.id}>
                          <td className="py-4 pr-4 font-bold text-gray-900">{sj.job_title}</td>
                          <td className="py-4 px-4 text-xs text-gray-500">
                            {new Date(sj.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-4 px-4 font-medium text-xs uppercase text-indigo-650">
                            {sj.plan.replace('_', ' ')}
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sj.status === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {sj.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CTA to post new jobs */}
            <div className="bg-gradient-to-r from-indigo-900 to-violet-900 text-white rounded-3xl p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-bold mb-1">¿Necesitas contratar más desarrolladores?</h3>
                <p className="text-indigo-200 text-xs max-w-lg leading-relaxed">Publica tus nuevas ofertas de empleo IT y destácalas en las tecnologías con más tráfico para recibir más clics.</p>
              </div>
              <Link
                href="/publicar-oferta"
                className="shrink-0 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
              >
                ➕ Publicar Nueva Oferta →
              </Link>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

export default function EmpresaDashboardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Cargando panel de reclutador...</p>
      </main>
    }>
      <EmpresaDashboardContent />
    </Suspense>
  );
}
