'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  generateCandidateLoginLink,
  getSubscriberPreferences,
  updateSubscriberPreferences,
  getReferralStats,
  getReferralLink,
  revokeSecureToken,
} from '@/app/actions';
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
  { value: 'csharp', label: 'C# / .NET' },
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
  const [authMode, setAuthMode] = useState<'none' | 'session' | 'magic'>('none');
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState(tokenParam);
  const [emailInput, setEmailInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Account & Candidate Data States
  const [loadingData, setLoadingData] = useState(true);
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState<'candidate' | 'company' | 'recruiter'>('candidate');
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [emailConsentUpdatedAt, setEmailConsentUpdatedAt] = useState<string | null>(null);
  const [subData, setSubData] = useState<SubscriberData | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralLink, setReferralLink] = useState('');

  // Saved Jobs & Streak
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  // Alert Preferences States
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [operator, setOperator] = useState<'OR' | 'AND'>('OR');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Security / Password / Delete Account States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const parseTechPrefs = (sub: SubscriberData) => {
    let kws: string[] = [];
    let op: 'OR' | 'AND' = 'OR';
    if (sub.tech_keywords_json) {
      try {
        const parsed = JSON.parse(sub.tech_keywords_json);
        kws = parsed.keywords || [];
        op = parsed.operator || 'OR';
      } catch {
        kws = sub.tech_keywords ? sub.tech_keywords.split(',').map((s: string) => s.trim()) : [];
      }
    } else if (sub.tech_keywords && sub.tech_keywords !== 'todas') {
      kws = sub.tech_keywords.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    setSelectedTechs(kws);
    setOperator(op);
    setFrequency(sub.frequency || 'weekly');
    setRemoteOnly((sub.location_pref || '').toLowerCase().includes('remoto'));
  };

  useEffect(() => {
    let localSaved: SavedJob[] = [];
    if (typeof window !== 'undefined') {
      try {
        localSaved = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
        setSavedJobs(localSaved);
        const streakData = JSON.parse(localStorage.getItem('portal_streak_data') || 'null');
        if (streakData && streakData.count) {
          setStreakCount(streakData.count);
        }
      } catch {}
    }

    if (emailParam && tokenParam) {
      setSessionToken(tokenParam);
      loadMagicProfile(emailParam, tokenParam);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('email');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } else {
      loadSessionProfile(localSaved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam, tokenParam]);

  async function loadSessionProfile(localSaved: SavedJob[]) {
    setLoadingData(true);
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data?.authenticated && data?.user) {
        setAuthMode('session');
        setAuthenticated(true);
        setFullName(data.user.fullName || '');
        setUserRole(data.user.role || 'candidate');
        setEmailNotificationsEnabled(Boolean(data.user.emailNotificationsEnabled));
        setEmailConsentUpdatedAt(data.user.emailConsentUpdatedAt || null);

        const sub: SubscriberData = {
          email: data.user.email,
          tech_keywords: data.preferences?.tech_keywords || '',
          location_pref: data.preferences?.location_pref || 'Remoto/España',
          frequency: data.preferences?.frequency || 'weekly',
          tech_keywords_json: data.preferences?.tech_keywords_json || null,
        };
        setSubData(sub);
        parseTechPrefs(sub);
        setReferralCount(Number(data.preferences?.referrals_count || 0));

        try {
          const encLink = await getReferralLink(data.user.email);
          if (encLink) setReferralLink(encLink);
        } catch {}

        // Sincronizar ofertas guardadas locales con la nube
        try {
          const localIds = localSaved.map((j) => String(j.id)).filter(Boolean);
          if (localIds.length > 0) {
            await fetch('/api/auth/saved-jobs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobIds: localIds }),
            });
          }
          const cloudRes = await fetch('/api/auth/saved-jobs', { cache: 'no-store' });
          const cloudData = await cloudRes.json();
          if (cloudData?.success && Array.isArray(cloudData.savedJobs)) {
            const cloudJobs: SavedJob[] = cloudData.savedJobs
              .filter((r: any) => r.title)
              .map((r: any) => ({
                id: r.job_id,
                title: r.title_es || r.title,
                company: r.company || 'Empresa IT',
                location: r.location || 'Remoto',
                salary: r.salary || null,
              }));
            if (cloudJobs.length > 0) {
              const mergedMap = new Map<string, SavedJob>();
              for (const j of cloudJobs) mergedMap.set(String(j.id), j);
              for (const j of localSaved) {
                if (!mergedMap.has(String(j.id))) mergedMap.set(String(j.id), j);
              }
              setSavedJobs(Array.from(mergedMap.values()));
            }
          }
        } catch {}
      } else {
        setAuthenticated(false);
        setAuthMode('none');
      }
    } catch {
      setAuthenticated(false);
      setAuthMode('none');
    } finally {
      setLoadingData(false);
    }
  }

  async function loadMagicProfile(email: string, token: string) {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const res = await getSubscriberPreferences(email, token);
      if (res.success && res.subscriber) {
        const sub = res.subscriber as SubscriberData;
        setAuthMode('magic');
        setSubData(sub);
        setEmailNotificationsEnabled(true);
        parseTechPrefs(sub);
        setAuthenticated(true);
        if (res.sessionToken) setSessionToken(res.sessionToken);

        const refRes = await getReferralStats(email, res.sessionToken || token);
        if (refRes.success) setReferralCount(refRes.count || 0);

        try {
          const encLink = await getReferralLink(email);
          if (encLink) setReferralLink(encLink);
        } catch {}
      } else {
        setErrorMsg(res.error || 'Enlace de acceso no válido o caducado.');
        setAuthenticated(false);
      }
    } catch {
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

    try {
      const res = await generateCandidateLoginLink(emailInput.trim());
      if (res.success) {
        setStatusMsg(res.message);
      } else {
        setErrorMsg(res.message || 'Error al solicitar acceso.');
      }
    } catch {
      setErrorMsg('Error de red.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSavePreferences(nextEmailOpt?: boolean) {
    if (!subData) return;
    const effectiveEmailPref = nextEmailOpt !== undefined ? nextEmailOpt : emailNotificationsEnabled;
    setSaveLoading(true);
    setSaveSuccess('');

    try {
      const techKeywords = selectedTechs.join(',');
      const locationPref = remoteOnly ? 'remoto' : 'Remoto/España';
      const techKeywordsJson = JSON.stringify({ keywords: selectedTechs, operator });

      if (authMode === 'session') {
        const res = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim() || undefined,
            emailNotificationsEnabled: effectiveEmailPref,
            techKeywords,
            locationPref,
            frequency,
            techKeywordsJson,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setEmailNotificationsEnabled(effectiveEmailPref);
          setEmailConsentUpdatedAt(new Date().toISOString());
          window.dispatchEvent(new Event('auth_state_changed'));
          setSaveSuccess(
            effectiveEmailPref
              ? isEnglish
                ? 'Preferences saved. Email alerts are active.'
                : 'Preferencias guardadas. Tienes activado el envío de correos.'
              : isEnglish
              ? 'Preferences saved. You will not receive emails.'
              : 'Preferencias guardadas. Has desactivado el envío de correos.'
          );
          setTimeout(() => setSaveSuccess(''), 4000);
        } else {
          alert(data.error || 'Error al guardar las preferencias.');
        }
      } else {
        const res = await updateSubscriberPreferences(
          subData.email,
          sessionToken,
          techKeywords,
          locationPref,
          frequency,
          techKeywordsJson
        );
        if (res.success) {
          if (res.sessionToken) setSessionToken(res.sessionToken);
          setSaveSuccess('Preferencias actualizadas correctamente.');
          setTimeout(() => setSaveSuccess(''), 4000);
        } else {
          alert('Error al guardar las preferencias.');
        }
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg(isEnglish ? 'Password updated.' : 'Contraseña actualizada correctamente.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordErr(data.error || 'No se pudo cambiar la contraseña.');
      }
    } catch {
      setPasswordErr('Error de red.');
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (
      !window.confirm(
        isEnglish
          ? 'Are you sure you want to permanently delete your account and all your data?'
          : '¿Seguro que deseas eliminar permanentemente tu cuenta y todos tus datos? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event('auth_state_changed'));
        router.push('/');
        router.refresh();
      } else {
        alert(data.error || 'No se pudo eliminar la cuenta.');
      }
    } catch {
      alert('Error de red.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const handleRemoveSavedJob = async (jobId: string | number) => {
    const updated = savedJobs.filter((j) => String(j.id) !== String(jobId));
    localStorage.setItem('saved_jobs', JSON.stringify(updated));
    setSavedJobs(updated);
    window.dispatchEvent(new Event('compared_jobs_updated'));
    if (authMode === 'session') {
      fetch(`/api/auth/saved-jobs?jobId=${encodeURIComponent(String(jobId))}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const handleLogout = async () => {
    if (authMode === 'session') {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      window.dispatchEvent(new Event('auth_state_changed'));
    } else if (sessionToken) {
      revokeSecureToken(sessionToken).catch(() => {});
    }
    setSessionToken('');
    setAuthenticated(false);
    setAuthMode('none');
    setSubData(null);
    setSelectedTechs([]);
    router.push(isEnglish ? '/mi-perfil?lang=en' : '/mi-perfil');
  };

  const getReferralUrl = () => {
    if (referralLink) return referralLink;
    if (!subData) return '';
    return typeof window !== 'undefined' ? `${window.location.origin}/referidos` : 'https://portalempleoit.com/referidos';
  };

  if (loadingData) {
    return (
      <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
        <p className="text-xs font-mono text-[var(--text-muted)]">
          {isEnglish ? 'Loading your profile...' : 'Cargando tu perfil...'}
        </p>
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
              {isEnglish ? 'My Personal Area' : 'Mi Área Personal'}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {isEnglish
                ? 'Manage your email preferences, saved jobs and account security.'
                : 'Gestiona tus preferencias de correo, alertas, ofertas guardadas y seguridad.'}
            </p>
          </div>
          {authenticated && (
            <button
              onClick={handleLogout}
              className="ui-card ui-card-interactive ui-btn-press px-3.5 py-2 rounded-lg text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              {isEnglish ? 'Sign out' : 'Cerrar sesión'} ({subData?.email})
            </button>
          )}
        </div>

        {errorMsg && !authenticated && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {!authenticated ? (
          <div className="max-w-lg mx-auto space-y-5 mt-4">
            <div className="ui-card rounded-xl p-6 sm:p-8 text-center space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {isEnglish ? 'Sign in to access your profile' : 'Accede a tu cuenta'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {isEnglish
                  ? 'Create a free account or sign in to save jobs and decide whether you want to receive emails.'
                  : 'Inicia sesión o crea tu cuenta gratuita para guardar ofertas en la nube y elegir si quieres recibir correos.'}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href={`/login${queryParam}`}
                  className="ui-btn-press py-2.5 px-4 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm transition-colors"
                >
                  {isEnglish ? 'Sign in' : 'Iniciar sesión'}
                </Link>
                <Link
                  href={`/registro${queryParam}`}
                  className="ui-btn-press py-2.5 px-4 rounded-lg bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-sm transition-colors"
                >
                  {isEnglish ? 'Create account' : 'Crear cuenta'}
                </Link>
              </div>
            </div>

            <div className="ui-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {isEnglish ? 'Newsletter subscriber without password?' : '¿Suscrito al boletín sin contraseña?'}
              </h3>
              <p className="text-[var(--text-secondary)] text-xs mb-4 leading-relaxed">
                Introduce tu correo de suscripción y te enviaremos un enlace temporal de acceso.
              </p>

              <form onSubmit={handleLoginRequest} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="nombre@correo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] text-sm"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="ui-btn-press bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  {authLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>

              {statusMsg && (
                <p className="mt-3 text-xs font-medium text-[var(--status-emerald)]">
                  {statusMsg}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Izquierda */}
            <div className="lg:col-span-2 space-y-6">
              <AdBanner variant="inline" />

              {/* Control Principal de Correos Electrónicos */}
              {authMode === 'session' && (
                <div className="ui-card rounded-xl p-6 md:p-7 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        {isEnglish ? 'Email Preferences' : 'Preferencias de Correos Electrónicos'}
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {isEnglish
                          ? 'Choose whether you want to receive job alerts and our weekly newsletter.'
                          : 'Marca o desmarca esta casilla en cualquier momento para recibir o dejar de recibir correos.'}
                      </p>
                    </div>
                    <span
                      className={`font-mono px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                        emailNotificationsEnabled
                          ? 'bg-[var(--status-emerald-tint)] text-[var(--status-emerald)] border-[var(--status-emerald)]/25'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {emailNotificationsEnabled
                        ? isEnglish
                          ? 'Emails Active'
                          : 'Correos Activados'
                        : isEnglish
                        ? 'Emails Off'
                        : 'Correos Desactivados'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase text-[var(--text-muted)] mb-1.5">
                        {isEnglish ? 'Full name' : 'Nombre completo'}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase text-[var(--text-muted)] mb-1.5">
                        {isEnglish ? 'Account type' : 'Perfil'}
                      </label>
                      <div className="px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm font-mono text-[var(--text-secondary)] capitalize">
                        {userRole}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border-accent)] bg-[var(--accent-tint)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotificationsEnabled}
                      onChange={(e) => handleSavePreferences(e.target.checked)}
                      disabled={saveLoading}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] shrink-0 cursor-pointer"
                    />
                    <span className="text-sm text-[var(--text-primary)]">
                      <strong className="font-semibold block">
                        {isEnglish
                          ? 'Yes, send me IT job alerts and the weekly newsletter by email'
                          : 'Sí, quiero recibir correos electrónicos con alertas de empleo IT y boletín semanal'}
                      </strong>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {emailConsentUpdatedAt
                          ? `${isEnglish ? 'Last updated:' : 'Última actualización:'} ${new Date(
                              emailConsentUpdatedAt
                            ).toLocaleString()}`
                          : isEnglish
                          ? 'You can toggle this option anytime.'
                          : 'Puedes activar o desactivar esta opción al instante.'}
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {/* Alertas de Empleo (si emails activos o en modo magic link) */}
              {(emailNotificationsEnabled || authMode === 'magic') && (
                <div className="ui-card rounded-xl p-6 md:p-7 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {isEnglish ? 'Job Alert Filters' : 'Configuración de Alertas de Empleo'}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {isEnglish
                        ? 'Choose the technologies and frequency for your email alerts.'
                        : 'Configura las tecnologías y la frecuencia con la que quieres recibir vacantes.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="font-mono text-[11px] font-medium uppercase text-[var(--text-muted)] tracking-wider mb-2 block">
                        Tecnologías Preferidas
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {TECH_LIST.map((t) => {
                          const active = selectedTechs.includes(t.value);
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() =>
                                setSelectedTechs((prev) =>
                                  prev.includes(t.value) ? prev.filter((v) => v !== t.value) : [...prev, t.value]
                                )
                              }
                              className={`ui-btn-press font-mono text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                                  : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                              }`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="font-mono text-[11px] font-medium uppercase text-[var(--text-muted)] tracking-wider mb-1.5 block">
                          Frecuencia
                        </label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
                        >
                          <option value="weekly">Semanal (Resumen)</option>
                          <option value="daily">Diaria</option>
                          <option value="biweekly">Quincenal</option>
                          <option value="monthly">Mensual</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--text-primary)]">
                          <input
                            type="checkbox"
                            checked={remoteOnly}
                            onChange={(e) => setRemoteOnly(e.target.checked)}
                            className="h-4 w-4 rounded text-[var(--accent-primary)]"
                          />
                          Solo ofertas 100% remoto
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePreferences()}
                      disabled={saveLoading}
                      className="ui-btn-press px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white font-medium text-xs sm:text-sm cursor-pointer transition-colors"
                    >
                      {saveLoading ? 'Guardando...' : 'Guardar preferencias'}
                    </button>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-[var(--status-emerald-tint)] border border-[var(--status-emerald)]/25 text-xs font-medium text-[var(--status-emerald)]">
                  {saveSuccess}
                </div>
              )}

              {/* Ofertas Guardadas */}
              <div className="ui-card rounded-xl p-6 md:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {isEnglish ? 'Saved Jobs' : 'Ofertas Guardadas'}
                  </h2>
                  <span className="font-mono tabular-nums bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--accent-primary)] text-xs font-semibold px-2.5 py-0.5 rounded-md">
                    {savedJobs.length}
                  </span>
                </div>

                {savedJobs.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {isEnglish
                      ? 'You have no saved jobs yet.'
                      : 'Aún no tienes ofertas guardadas. Usa el botón de guardar en cualquier vacante.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {savedJobs.map((j) => {
                      const slug = getJobSlug({ id: j.id, title: j.title, company: j.company });
                      return (
                        <div
                          key={String(j.id)}
                          className="flex items-center justify-between gap-4 p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                        >
                          <div className="min-w-0">
                            <Link
                              href={`/job/${slug}${queryParam}`}
                              className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] truncate block transition-colors"
                            >
                              {j.title}
                            </Link>
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                              {j.company} · {j.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/job/${slug}${queryParam}`}
                              className="ui-btn-press px-3 py-1.5 rounded-md bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
                            >
                              Ver
                            </Link>
                            <button
                              onClick={() => handleRemoveSavedJob(j.id)}
                              className="w-7 h-7 flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--status-danger)] rounded-md transition-colors cursor-pointer"
                              title="Eliminar de guardados"
                              aria-label="Eliminar de guardados"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seguridad y Eliminación RGPD */}
              {authMode === 'session' && (
                <div className="ui-card rounded-xl p-6 md:p-7 space-y-5">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {isEnglish ? 'Security & Data Control' : 'Seguridad de Cuenta y Privacidad'}
                  </h2>

                  <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase text-[var(--text-muted)] mb-1.5">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase text-[var(--text-muted)] mb-1.5">
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="ui-btn-press py-2 px-4 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium cursor-pointer transition-colors"
                    >
                      Cambiar contraseña
                    </button>
                  </form>
                  {passwordMsg && <p className="text-xs font-medium text-[var(--status-emerald)]">{passwordMsg}</p>}
                  {passwordErr && <p className="text-xs font-medium text-[var(--status-danger)]">{passwordErr}</p>}

                  <form
                    onSubmit={handleDeleteAccount}
                    className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-between"
                  >
                    <div className="flex-1 w-full sm:max-w-xs">
                      <label className="block font-mono text-[11px] font-medium uppercase text-[var(--status-danger)] mb-1.5">
                        Eliminar cuenta permanentemente (Art. 17 RGPD)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Confirma tu contraseña"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/5 text-sm text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={deleteLoading}
                      className="ui-btn-press py-2 px-4 rounded-lg border border-rose-500/40 text-[var(--status-danger)] hover:bg-rose-500/10 text-xs font-medium cursor-pointer transition-colors"
                    >
                      {deleteLoading ? 'Eliminando...' : 'Borrar mi cuenta'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Columna Derecha: Racha y Referidos */}
            <div className="lg:col-span-1 space-y-5">
              <div className="ui-card rounded-xl p-5 space-y-3.5">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Racha de Visitas Diarias</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-3xl font-bold text-[var(--status-amber)]">{streakCount}</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Días activos</span>
                </div>
                <div className="w-full bg-[var(--bg-subtle)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="bg-[var(--status-amber)] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (streakCount / 7) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Visita diariamente para mantener tu racha y desbloquear guías de salarios y recursos.
                </p>
              </div>

              <div className="ui-card rounded-xl p-5 space-y-3.5">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Programa de Recomendación</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-3xl font-bold text-[var(--accent-primary)]">{referralCount}</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Amigos suscritos</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
                  <p>Consigue que 3 compañeros se unan y obtendrás acceso premium sin anuncios.</p>
                  <div className="pt-1">
                    <label className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                      Tu enlace exclusivo:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={getReferralUrl()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] select-all focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky top-20">
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
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <p className="text-xs font-mono text-[var(--text-muted)]">Cargando...</p>
        </main>
      }
    >
      <MiPerfilContent />
    </Suspense>
  );
}
