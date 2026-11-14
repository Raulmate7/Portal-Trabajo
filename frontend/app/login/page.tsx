'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateCandidateLoginLink } from '@/app/actions';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  const nextParam = searchParams.get('next') || '';
  const safeNext =
    nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : `/mi-perfil${queryParam}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Acceso alternativo con enlace mágico para antiguos suscriptores sin contraseña
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicStatus, setMagicStatus] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error ||
            (isEnglish ? 'Invalid email or password.' : 'Correo o contraseña incorrectos.')
        );
        return;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth_state_changed'));
      }
      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMsg(
        isEnglish
          ? 'Could not connect to the server.'
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setMagicLoading(true);
    setMagicStatus('');
    setErrorMsg('');
    try {
      const res = await generateCandidateLoginLink(magicEmail.trim());
      if (res.success) {
        setMagicStatus(res.message);
      } else {
        setErrorMsg(res.message || 'No se pudo enviar el enlace.');
      }
    } catch {
      setErrorMsg('Error de red.');
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl">
            🔐
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {isEnglish ? 'Sign in' : 'Iniciar sesión'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {isEnglish
              ? 'Access your saved jobs and email notification settings.'
              : 'Accede a tus ofertas guardadas y gestiona tus preferencias de correo.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
              {isEnglish ? 'Email address' : 'Correo electrónico'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                {isEnglish ? 'Password' : 'Contraseña'}
              </label>
              <Link
                href={`/recuperar-password${queryParam}`}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isEnglish ? 'Forgot password?' : '¿Olvidaste tu contraseña?'}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
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
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>{isEnglish ? 'Keep me signed in (30 days)' : 'Mantener sesión iniciada (30 días)'}</span>
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
                ? 'Signing in...'
                : 'Entrando...'
              : isEnglish
              ? 'Sign in'
              : 'Entrar en mi cuenta'}
          </button>
        </form>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-4 text-center space-y-3">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {isEnglish ? "Don't have an account yet? " : '¿Todavía no tienes cuenta? '}
            <Link
              href={`/registro${queryParam}`}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isEnglish ? 'Create one free' : 'Regístrate gratis'}
            </Link>
          </p>

          <div>
            <button
              type="button"
              onClick={() => setShowMagicLink(!showMagicLink)}
              className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
            >
              {isEnglish
                ? 'Subscribed earlier without password? Request a magic link'
                : '¿Ya estabas suscrito al boletín sin contraseña? Entrar por enlace al correo'}
            </button>

            {showMagicLink && (
              <form onSubmit={handleMagicRequest} className="mt-3 space-y-2 text-left bg-gray-50 dark:bg-slate-800/70 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
                <input
                  type="email"
                  required
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={magicLoading}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {magicLoading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
                {magicStatus && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {magicStatus}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
