'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateCandidateLoginLink, getSubscriberPreferences, updateSubscriberPreferences, getReferralStats } from '@/app/actions';
import AdBanner from '@/components/AdBanner';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import { getJobSlug } from '@/lib/slug';

interface SubscriberData {
  email: string;
  tech_keywords: string;
  location_pref: string;
  frequency: string;
  tech_keywords_json?: string | null;
}

interface SavedJob {
  id: string | number;
  title: string;
  company: string;
  location: string;
  salary?: string | null;
}

const TECH_LIST = [
  { value: 'react', label: 'React / Frontend' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'aws', label: 'Cloud / DevOps' },
  { value: 'flutter', label: 'Mobile' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'php', label: 'PHP / Laravel' },
  { value: 'go', label: 'Go (Golang)' },
  { value: 'sql', label: 'SQL / Bases de Datos' },
  { value: 'csharp', label: 'C# / .NET' }
];

function MiPerfilContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  // Auth States
  const [authenticated, setAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginLink, setLoginLink] = useState('');

  // Candidate Data States
  const [loadingData, setLoadingData] = useState(false);
  const [subData, setSubData] = useState<SubscriberData | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  
  // LocalStorage data
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  // Form States (Alerts)
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [operator, setOperator] = useState<'OR' | 'AND'>('OR');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load local storage items
    if (typeof window !== 'undefined') {
      const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      setSavedJobs(jobs);

      const streakData = JSON.parse(localStorage.getItem('portal_streak_data') || 'null');
      if (streakData && streakData.count) {
        setStreakCount(streakData.count);
      }
    }
  }, []);

  useEffect(() => {
    if (emailParam && tokenParam) {
      loadProfile(emailParam, tokenParam);
    }
  }, [emailParam, tokenParam]);

  async function loadProfile(email: string, token: string) {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const res = await getSubscriberPreferences(email, token);
      if (res.success && res.subscriber) {
        const sub = res.subscriber as SubscriberData;
        setSubData(sub);
        setFrequency(sub.frequency || 'weekly');
        setRemoteOnly((sub.location_pref || '').toLowerCase().includes('remoto'));
        
        let kws: string[] = [];
        let op: 'OR' | 'AND' = 'OR';
        
        if (sub.tech_keywords_json) {
          try {
            const parsed = JSON.parse(sub.tech_keywords_json);
            kws = parsed.keywords || [];
            op = parsed.operator || 'OR';
          } catch (e) {
            kws = sub.tech_keywords ? sub.tech_keywords.split(',').map((s: string) => s.trim()) : [];
          }
        } else {
          kws = sub.tech_keywords ? sub.tech_keywords.split(',').map((s: string) => s.trim()) : [];
        }

        setSelectedTechs(kws);
        setOperator(op);
        setAuthenticated(true);

        // Load referrals
        const refRes = await getReferralStats(email);
        if (refRes.success) {
          setReferralCount(refRes.count || 0);
        }
      } else {
        setErrorMsg(res.error || 'Enlace de acceso no válido o caducado.');
        setAuthenticated(false);
      }
    } catch (e) {
      setErrorMsg('Error al conectar con el servidor.');
      setAuthenticated(false);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleLoginRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setAuthLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    setLoginLink('');

    try {
      const res = await generateCandidateLoginLink(emailInput.trim());
      if (res.success && res.loginLink) {
        setStatusMsg(res.message);
        setLoginLink(res.loginLink);
      } else {
        setErrorMsg(res.message || 'Error al solicitar acceso.');
      }
    } catch (err) {
      setErrorMsg('Error de red.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSavePreferences() {
    if (!subData) return;
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const techKeywords = selectedTechs.join(',');
      const locationPref = remoteOnly ? 'remoto' : '';
      const techKeywordsJson = JSON.stringify({ keywords: selectedTechs, operator });

      const res = await updateSubscriberPreferences(
        subData.email,
        tokenParam,
        techKeywords,
        locationPref,
        frequency,
        techKeywordsJson
      );

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Error al guardar las preferencias.');
      }
    } catch (err) {
      alert('Error de conexión.');
    } finally {
      setSaveLoading(false);
    }
  }

  const handleRemoveSavedJob = (jobId: string | number) => {
    const updated = savedJobs.filter(j => String(j.id) !== String(jobId));
    localStorage.setItem('saved_jobs', JSON.stringify(updated));
    setSavedJobs(updated);
    window.dispatchEvent(new Event('compared_jobs_updated'));
  };

  const handleLogout = () => {
    router.push('/mi-perfil');
    setAuthenticated(false);
    setSubData(null);
    setSelectedTechs([]);
  };

  // Referral link encoding (Standard base64 like mailer)
  const getReferralUrl = () => {
    if (!subData) return '';
    try {
      const base64Email = Buffer.from(subData.email).toString('base64');
      return `${window.location.origin}/ref/${base64Email}`;
    } catch (e) {
      return '';
    }
  };

  if (loadingData) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-slate-450 font-medium">Cargando tu perfil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>👤</span> Área Personal del Candidato
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gestiona tus alertas, ofertas guardadas y recompensas por recomendación.</p>
          </div>
          {authenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              🚪 Cerrar sesión ({subData?.email})
            </button>
          )}
        </div>

        {/* Auth status error */}
        {errorMsg && !authenticated && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 text-sm font-medium dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Panel no autenticado */}
        {!authenticated ? (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xl mt-8">
            <h2 className="text-lg font-bold text-gray-950 dark:text-white mb-2">Ingresar a mi perfil</h2>
            <p className="text-gray-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
              Introduce el correo electrónico con el que estás suscrito a nuestro boletín semanal. Te enviaremos un enlace de acceso instantáneo.
            </p>

            <form onSubmit={handleLoginRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Tu Email</label>
                <input
                  type="email"
                  required
                  placeholder="nombre@correo.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md disabled:opacity-60 text-sm cursor-pointer"
              >
                {authLoading ? 'Validando...' : 'Obtener Enlace de Acceso →'}
              </button>
            </form>

            {statusMsg && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs space-y-3">
                <p className="font-semibold">✅ {statusMsg}</p>
                {loginLink && (
                  <div className="pt-2 border-t border-emerald-250">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Enlace de acceso generado (entorno de desarrollo):</p>
                    <Link
                      href={loginLink}
                      className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                    >
                      Entrar a mi perfil ahora 🚀
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          
          // Dashboard view
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Configuración de Alertas */}
            <div className="lg:col-span-2 space-y-8">
              
              <AdBanner variant="inline" />

              {/* Alertas de Empleo */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-950 dark:text-white flex items-center gap-2">
                    <span>🔔</span> Configuración de Alertas de Empleo
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Configura las tecnologías y la frecuencia con la que quieres recibir vacantes.</p>
                </div>

                <div className="space-y-4">
                  {/* Tags de tecnología */}
                  <div>
                    <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block">Tecnologías Preferidas</label>
                    <div className="flex flex-wrap gap-2">
                      {TECH_LIST.map((t) => {
                        const active = selectedTechs.includes(t.value);
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              setSelectedTechs(prev =>
                                prev.includes(t.value)
                                  ? prev.filter((v) => v !== t.value)
                                  : [...prev, t.value]
                              );
                            }}
                            className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-gray-100 dark:bg-slate-800 border-gray-250 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500'
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lógica de coincidencia */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block">Lógica de Coincidencia</label>
                      <div className="flex gap-2">
                        {['OR', 'AND'].map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => setOperator(op as 'OR' | 'AND')}
                            className={`flex-1 text-xs py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                              operator === op
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-white dark:bg-slate-800 border-gray-250 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500'
                            }`}
                          >
                            {op === 'OR' ? 'Alguna tecnología (OR)' : 'Todas las tecnologías (AND)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frecuencia */}
                    <div>
                      <label className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 block">Frecuencia de envío</label>
                      <div className="flex gap-2">
                        {['daily', 'weekly'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFrequency(f)}
                            className={`flex-1 text-xs py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                              frequency === f
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-white dark:bg-slate-800 border-gray-250 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500'
                            }`}
                          >
                            {f === 'daily' ? '⚡ Diario' : '📋 Semanal'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Teletrabajo */}
                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setRemoteOnly(!remoteOnly)}
                      id="remote-only-toggle"
                      className={`w-11 h-6 rounded-full border-2 transition-all relative cursor-pointer ${
                        remoteOnly ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-200 dark:bg-slate-800 border-gray-350 dark:border-slate-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${remoteOnly ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <label htmlFor="remote-only-toggle" className="text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                      Recibir únicamente ofertas 100% en remoto
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center gap-4">
                  <button
                    onClick={handleSavePreferences}
                    disabled={saveLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {saveLoading ? 'Guardando...' : '💾 Guardar Preferencias'}
                  </button>
                  
                  {saveSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                      ¡Preferencias actualizadas con éxito!
                    </span>
                  )}
                </div>
              </div>

              {/* Ofertas Guardadas */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-gray-950 dark:text-white flex items-center gap-2">
                  <span>⭐</span> Tus Ofertas Guardadas ({savedJobs.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-450 leading-relaxed">
                  Las ofertas marcadas como favoritas en tu navegador. Puedes eliminarlas o verlas en detalle.
                </p>

                {savedJobs.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 dark:bg-slate-950 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-3xl block mb-2">📭</span>
                    <p className="text-xs text-gray-500 dark:text-slate-500">Aún no tienes ofertas guardadas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedJobs.map((j) => {
                      const jobSlug = getJobSlug({ ...j, id: j.id });
                      return (
                        <div 
                          key={j.id} 
                          className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 flex justify-between items-center gap-4"
                        >
                          <div className="space-y-0.5 truncate">
                            <Link 
                              href={`/job/${jobSlug}${queryParam}`} 
                              className="font-bold text-gray-900 dark:text-white text-sm hover:text-indigo-600 hover:underline truncate block"
                            >
                              {j.title}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-slate-400 block truncate">🏢 {j.company} | 📍 {j.location}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/job/${jobSlug}${queryParam}`} 
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                            >
                              Ver Oferta
                            </Link>
                            <button
                              onClick={() => handleRemoveSavedJob(j.id)}
                              className="p-1.5 border border-gray-250 dark:border-slate-800 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar de guardados"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Columna Derecha: Racha y Referidos */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Racha de Visitas */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <span className="text-3xl block">🔥</span>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">Racha de Visitas Diarias</h3>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-500">{streakCount}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Días activos</span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (streakCount / 7) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed font-sans">
                  ¡Sigue visitando diariamente para mantener tu racha y desbloquear guías de salarios premium y recursos exclusivos!
                </p>
              </div>

              {/* Programa de Referidos */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <span className="text-3xl block">📢</span>
                <h3 className="font-bold text-gray-950 dark:text-white text-base">Programa de Recomendación</h3>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{referralCount}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Amigos suscritos</span>
                </div>

                <div className="text-xs text-gray-600 dark:text-slate-450 leading-relaxed space-y-2">
                  <p>Consigue que **3 compañeros** se suscriban al boletín y obtendrás acceso premium sin anuncios en toda la web.</p>
                  
                  <div className="pt-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Tu enlace exclusivo:</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={getReferralUrl()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-mono font-bold select-all focus:outline-none"
                    />
                    <p className="text-[9px] text-gray-450 mt-1">Haz clic para seleccionar y copiar tu enlace.</p>
                  </div>
                </div>
              </div>

              <div className="sticky top-24">
                <AdBanner variant="sidebar" enableRefresh={true} />
              </div>

            </div>

          </div>
        )}

      </div>
      <StickyDesktopAd />
    </main>
  );
}

export default function MiPerfilPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-550 dark:text-slate-450 font-medium">Cargando...</p>
      </main>
    }>
      <MiPerfilContent />
    </Suspense>
  );
}
