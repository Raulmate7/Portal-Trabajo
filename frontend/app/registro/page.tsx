'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LEGAL_CONFIG } from '@/lib/legalConfig';

const TECH_OPTIONS = [
  'React',
  'Node.js',
  'Python',
  'Java',
  'Cloud / DevOps',
  'TypeScript',
  'PHP / Laravel',
  'SQL',
  'C# / .NET',
  'Go',
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'candidate' | 'company' | 'recruiter'>('candidate');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [wantsEmails, setWantsEmails] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'weekly' | 'daily'>('weekly');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordHasLength = password.length >= 8;
  const passwordHasLetterAndNumber = /[a-zA-Z]/.test(password) && /\d/.test(password);
  const strengthScore =
    (passwordHasLength ? 1 : 0) +
    (passwordHasLetterAndNumber ? 1 : 0) +
    (password.length >= 12 ? 1 : 0);

  const toggleTech = (tech: string) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!privacyAccepted) {
      setErrorMsg(
        isEnglish
          ? 'You must accept the Privacy Policy and Terms of Use.'
          : 'Debes aceptar la Política de Privacidad y los Términos de Uso.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          privacyAccepted: true,
          wantsEmails,
          techKeywords: selectedTechs.length > 0 ? selectedTechs.join(',') : 'todas',
          locationPref: remoteOnly ? 'remoto' : 'Remoto/España',
          frequency,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error ||
            (isEnglish ? 'Could not create your account.' : 'No se pudo completar el registro.')
        );
        return;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth_state_changed'));
      }
      router.push(`/mi-perfil${queryParam}`);
      router.refresh();
    } catch {
      setErrorMsg(
        isEnglish
          ? 'Network error while connecting to the server.'
          : 'Error de conexión con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl">
            🚀
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {isEnglish ? 'Create your account' : 'Crear cuenta en Portal Trabajo IT'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {isEnglish
              ? 'Save jobs in the cloud, sync your streak and manage email alerts.'
              : 'Guarda ofertas en la nube, sincroniza tu actividad y controla si quieres recibir correos.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
              {isEnglish ? 'Full name' : 'Nombre completo'}
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isEnglish ? 'Laura García' : 'Laura García'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
              {isEnglish ? 'Email address' : 'Correo electrónico'}
            </label>
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
              {isEnglish ? 'Password' : 'Contraseña'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showPassword ? (isEnglish ? 'Hide' : 'Ocultar') : isEnglish ? 'Show' : 'Mostrar'}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        strengthScore >= step
                          ? strengthScore === 3
                            ? 'bg-emerald-500'
                            : strengthScore === 2
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                          : 'bg-gray-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  {isEnglish
                    ? 'Minimum 8 characters, including letters and numbers.'
                    : 'Mínimo 8 caracteres, incluyendo letras y números.'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
              {isEnglish ? 'Account profile' : 'Tipo de perfil'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'candidate', label: isEnglish ? 'Candidate' : 'Candidato' },
                { id: 'company', label: isEnglish ? 'Company' : 'Empresa' },
                { id: 'recruiter', label: isEnglish ? 'Recruiter' : 'Reclutador' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id as 'candidate' | 'company' | 'recruiter')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    role === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opción marcable por el usuario para recibir o no correos electrónicos */}
          <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsEmails}
                onChange={(e) => setWantsEmails(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-gray-800 dark:text-slate-200 leading-snug">
                <strong className="font-bold">
                  {isEnglish
                    ? 'I want to receive emails with IT job alerts, weekly digest and updates (optional)'
                    : 'Quiero recibir correos electrónicos con alertas de empleo IT, boletín semanal y novedades (opcional)'}
                </strong>
                <span className="block text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  {isEnglish
                    ? 'Leave unchecked if you only want an account without emails. You can change this anytime in your profile.'
                    : 'Déjala desmarcada si solo quieres crear tu cuenta sin recibir correos. Podrás activarlo o desactivarlo cuando quieras desde tu perfil.'}
                </span>
              </span>
            </label>

            {wantsEmails && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 mb-1.5">
                    {isEnglish ? 'Technologies of interest (optional):' : 'Tecnologías de interés (opcional):'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TECH_OPTIONS.map((tech) => {
                      const active = selectedTechs.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleTech(tech)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          {tech}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">
                      {isEnglish ? 'Frequency:' : 'Frecuencia:'}
                    </span>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as 'weekly' | 'daily')}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-semibold"
                    >
                      <option value="weekly">{isEnglish ? 'Weekly' : 'Semanal'}</option>
                      <option value="daily">{isEnglish ? 'Daily' : 'Diaria'}</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={remoteOnly}
                      onChange={(e) => setRemoteOnly(e.target.checked)}
                      className="h-3.5 w-3.5 rounded text-indigo-600"
                    />
                    {isEnglish ? 'Remote only' : 'Solo remoto'}
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Casilla obligatoria de Privacidad y Términos */}
          <label className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
            />
            <span className="leading-snug">
              {isEnglish ? 'I have read and accept the ' : 'He leído y acepto la '}
              <Link href="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
                {isEnglish ? 'Privacy Policy' : 'Política de Privacidad'}
              </Link>
              {isEnglish ? ' and ' : ' y los '}
              <Link href="/terminos" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
                {isEnglish ? 'Terms of Use' : 'Términos de Uso'}
              </Link>
              . *
            </span>
          </label>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black text-sm shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {loading
              ? isEnglish
                ? 'Creating account...'
                : 'Creando cuenta...'
              : isEnglish
              ? 'Create account'
              : 'Crear mi cuenta'}
          </button>
        </form>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 text-[10px] text-gray-500 dark:text-slate-400 leading-relaxed">
          <p>
            <strong>Responsable:</strong> {LEGAL_CONFIG.owner} ({LEGAL_CONFIG.email}).{' '}
            <strong>Finalidad:</strong> Gestión de tu cuenta de usuario (Art. 6.1.b RGPD) y, únicamente si marcas la casilla opcional, envío de alertas y boletín IT (Art. 6.1.a RGPD).
          </p>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-slate-400">
          {isEnglish ? 'Already have an account? ' : '¿Ya tienes cuenta? '}
          <Link href={`/login${queryParam}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            {isEnglish ? 'Sign in' : 'Iniciar sesión'}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
