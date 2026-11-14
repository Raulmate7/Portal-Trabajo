'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateRecruiterLoginLink, getRecruiterJobs, revokeSecureToken } from '@/app/actions';

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

  const [activeEmail, setActiveEmail] = useState(emailParam);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dashboard stats
  const [authenticated, setAuthenticated] = useState(false);
  const [jobs, setJobs] = useState<JobMetric[]>([]);
  const [sponsoredJobs, setSponsoredJobs] = useState<SponsoredRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (emailParam && tokenParam) {
      loadDashboard(emailParam, tokenParam);
      // Vector 14: Limpiar token y email de la URL del navegador inmediatamente tras leerlos
      // para evitar filtración vía cabecera HTTP Referer, historial o captura de pantalla.
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('email');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } else {
      // Intentar auto-login solo durante la sesión activa de la pestaña (sessionStorage, no localStorage permanente)
      const savedSession = sessionStorage.getItem('recruiter_session') || localStorage.getItem('recruiter_session');
      if (savedSession) {
        try {
          const { email, token } = JSON.parse(savedSession);
          if (email && token) {
            loadDashboard(email, token);
          }
        } catch (e) {
          sessionStorage.removeItem('recruiter_session');
        } finally {
          // Limpiar cualquier residuo de token en localStorage permanente (Vector 15)
          localStorage.removeItem('recruiter_session');
        }
      }
    }
  }, [emailParam, tokenParam]);

  async function loadDashboard(email: string, token: string) {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const res = await getRecruiterJobs(email, token);
      if (res.success) {
        const activeToken = res.sessionToken || token;
        setActiveEmail(email);
        setJobs(res.jobs || []);
        setSponsoredJobs(res.sponsoredJobs || []);
        setAuthenticated(true);
        // Guardar sesión exclusivamente en sessionStorage con el token rotado (Vector 15 y 18)
        sessionStorage.setItem('recruiter_session', JSON.stringify({ email, token: activeToken }));
        // Purgar almacenamiento persistente por seguridad (Vector 15)
        localStorage.removeItem('recruiter_session');
      } else {
        setErrorMsg(res.error || 'Acceso denegado.');
        setAuthenticated(false);
        sessionStorage.removeItem('recruiter_session');
        localStorage.removeItem('recruiter_session');
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

    try {
      const res = await generateRecruiterLoginLink(emailInput.trim());
      if (res.success) {
        setStatusMsg(res.message);
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
    try {
      const saved = sessionStorage.getItem('recruiter_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token) revokeSecureToken(parsed.token).catch(() => {});
      }
    } catch {}
    sessionStorage.removeItem('recruiter_session');
    localStorage.removeItem('recruiter_session');
    router.push('/empresa-dashboard');
    setActiveEmail('');
    setAuthenticated(false);
    setJobs([]);
    setSponsoredJobs([]);
    setEmailInput('');
    setStatusMsg('');
  };

  // Metricas globales
  const totalImpressions = jobs.reduce((sum, j) => sum + (j.impressions_count || 0), 0);
  const totalClicks = jobs.reduce((sum, j) => sum + (j.clicks_count || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  if (loadingData) {
    return (
      <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
        <p className="text-xs font-mono text-[var(--text-muted)]">Cargando panel de reclutador...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Área de Empresas y Reclutadores
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Consulta el rendimiento de tus ofertas de empleo y tus solicitudes patrocinadas.
            </p>
          </div>
          {authenticated && (
            <button
              onClick={handleLogout}
              className="ui-card ui-card-interactive ui-btn-press px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              Cerrar sesión ({activeEmail || emailParam})
            </button>
          )}
        </div>

        {/* Auth Error Box */}
        {errorMsg && !authenticated && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* 1. Login Panel (no autenticado) */}
        {!authenticated ? (
          <div className="max-w-md mx-auto ui-card rounded-xl p-6 sm:p-8 mt-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Ingresar a mi panel</h2>
            <p className="text-[var(--text-secondary)] text-xs mb-6 leading-relaxed">
              Introduce el correo electrónico que utilizaste para publicar ofertas de empleo en nuestro portal. Te proporcionaremos un enlace de acceso seguro.
            </p>

            <form onSubmit={handleLoginRequest} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  required
                  placeholder="empresa@correo.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] transition-colors text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ui-btn-press w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium py-2.5 px-5 rounded-lg transition-colors disabled:opacity-60 text-sm cursor-pointer"
              >
                {loading ? 'Generando...' : 'Obtener Enlace de Acceso →'}
              </button>
            </form>

            {statusMsg && (
              <div className="mt-5 p-4 bg-[var(--status-emerald-tint)] border border-[var(--status-emerald)]/25 text-[var(--status-emerald)] rounded-xl text-xs space-y-1.5">
                <p className="font-semibold">{statusMsg}</p>
                <p className="text-[var(--text-secondary)] text-[11px]">
                  Por motivos de seguridad, el enlace no se muestra en pantalla. Haz clic en el enlace recibido en tu bandeja de entrada para iniciar sesión.
                </p>
              </div>
            )}
          </div>
        ) : (

          // 2. Dashboard View (autenticado)
          <div className="space-y-6">

            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="ui-card rounded-xl p-5">
                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                  Impresiones Totales
                </span>
                <span className="font-mono tabular-nums text-3xl font-bold text-[var(--text-primary)] block mt-1.5">
                  {totalImpressions.toLocaleString('es-ES')}
                </span>
              </div>
              <div className="ui-card rounded-xl p-5">
                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                  Clics de Candidatos
                </span>
                <span className="font-mono tabular-nums text-3xl font-bold text-[var(--accent-primary)] block mt-1.5">
                  {totalClicks.toLocaleString('es-ES')}
                </span>
              </div>
              <div className="ui-card rounded-xl p-5">
                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                  CTR Promedio
                </span>
                <span className="font-mono tabular-nums text-3xl font-bold text-[var(--status-emerald)] block mt-1.5">
                  {avgCtr}%
                </span>
              </div>
            </div>

            {/* Ofertas Activas y Métricas */}
            <div className="ui-card rounded-xl p-6 md:p-7">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">
                Tus ofertas de empleo publicadas <span className="font-mono text-sm text-[var(--text-muted)]">({jobs.length})</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-5">
                Métricas de visualización y clics recopiladas en tiempo real en nuestro portal.
              </p>

              {jobs.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-subtle)] rounded-xl border border-dashed border-[var(--border-strong)]">
                  <p className="text-sm text-[var(--text-primary)] font-medium">No se encontraron ofertas activas en la base de datos principal.</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Las ofertas cargadas mediante patrocinio aparecerán aquí una vez activadas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] font-mono text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
                        <th className="pb-3 pr-4">Título del puesto</th>
                        <th className="pb-3 px-4">Fecha Publicación</th>
                        <th className="pb-3 px-4 text-center">Estado</th>
                        <th className="pb-3 px-4 text-right">Impresiones</th>
                        <th className="pb-3 px-4 text-right">Clics</th>
                        <th className="pb-3 pl-4 text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
                      {jobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((job) => {
                        const imp = job.impressions_count || 0;
                        const cli = job.clicks_count || 0;
                        const ctr = imp > 0 ? ((cli / imp) * 100).toFixed(2) : '0.00';
                        return (
                          <tr key={job.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                            <td className="py-3.5 pr-4 font-medium text-[var(--text-primary)] max-w-xs truncate">
                              <Link href={`/job/${job.id}`} className="hover:text-[var(--accent-primary)] hover:underline">
                                {job.title}
                              </Link>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-[var(--text-muted)]">
                              {new Date(job.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-medium border ${
                                job.is_active
                                  ? 'bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border-[var(--status-emerald)]/25'
                                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                              }`}>
                                {job.is_active ? 'Activo' : 'Expirado'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[var(--text-primary)]">{imp.toLocaleString('es-ES')}</td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[var(--accent-primary)]">{cli.toLocaleString('es-ES')}</td>
                            <td className="py-3.5 pl-4 text-right font-mono tabular-nums font-semibold text-xs text-[var(--status-emerald)]">{ctr}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Controles de Paginación */}
              {jobs.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--border-subtle)]">
                  <p className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, jobs.length)} de {jobs.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="ui-card ui-btn-press px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 text-[var(--text-primary)] cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil(jobs.length / itemsPerPage)}
                      className="ui-card ui-btn-press px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 text-[var(--text-primary)] cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Solicitudes Patrocinadas (Stripe) */}
            <div className="ui-card rounded-xl p-6 md:p-7">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">
                Historial de compras y planes patrocinados <span className="font-mono text-sm text-[var(--text-muted)]">({sponsoredJobs.length})</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-5">Estado de tus solicitudes de publicación destacada.</p>

              {sponsoredJobs.length === 0 ? (
                <div className="text-center py-8 bg-[var(--bg-subtle)] rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--text-muted)] text-xs">
                  No tienes solicitudes de patrocinio cargadas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] font-mono text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
                        <th className="pb-3 pr-4">Puesto Solicitado</th>
                        <th className="pb-3 px-4">Fecha Solicitud</th>
                        <th className="pb-3 px-4">Plan Adquirido</th>
                        <th className="pb-3 pl-4 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
                      {sponsoredJobs.map((sj) => (
                        <tr key={sj.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                          <td className="py-3.5 pr-4 font-medium text-[var(--text-primary)]">{sj.job_title}</td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-[var(--text-muted)]">
                            {new Date(sj.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs uppercase text-[var(--accent-primary)]">
                            {sj.plan.replace('_', ' ')}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-medium border ${
                              sj.status === 'aprobado'
                                ? 'bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border-[var(--status-emerald)]/25'
                                : 'bg-[var(--status-amber-tint)] text-[var(--status-amber)] border-[var(--border-featured)]'
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
            <div className="bg-[#090C10] text-white border border-white/[0.08] rounded-xl p-6 sm:p-7 flex flex-col md:flex-row justify-between items-center gap-5">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-white">¿Necesitas contratar más desarrolladores?</h3>
                <p className="text-slate-400 text-xs max-w-lg leading-relaxed">
                  Publica tus nuevas ofertas de empleo IT y destácalas en las tecnologías con más tráfico para recibir más clics.
                </p>
              </div>
              <Link
                href="/publicar-oferta"
                className="ui-btn-press shrink-0 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium px-5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors"
              >
                Publicar Nueva Oferta →
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
      <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
        <p className="text-xs font-mono text-[var(--text-muted)]">Cargando panel de reclutador...</p>
      </main>
    }>
      <EmpresaDashboardContent />
    </Suspense>
  );
}
