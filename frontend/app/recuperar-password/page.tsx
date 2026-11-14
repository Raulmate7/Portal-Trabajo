'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function RecuperarPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
      } else {
        setErrorMsg(data.error || 'No se pudo procesar la solicitud.');
      }
    } catch {
      setErrorMsg('Error de red.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg(isEnglish ? 'Passwords do not match.' : 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
      } else {
        setErrorMsg(data.error || 'El enlace ha caducado o no es válido.');
      }
    } catch {
      setErrorMsg('Error de red.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl">
            🔑
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {token
              ? isEnglish
                ? 'Set a new password'
                : 'Nueva contraseña'
              : isEnglish
              ? 'Reset password'
              : 'Recuperar contraseña'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {token
              ? isEnglish
                ? 'Choose a strong password for your account.'
                : 'Elige una contraseña segura para tu cuenta.'
              : isEnglish
              ? 'Enter your email and we will send you a reset link.'
              : 'Introduce tu correo y te enviaremos un enlace válido durante 30 minutos.'}
          </p>
        </div>

        {token ? (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
                {isEnglish ? 'New password' : 'Nueva contraseña'}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5">
                {isEnglish ? 'Confirm password' : 'Repetir contraseña'}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}
            {statusMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 space-y-2">
                <p>{statusMsg}</p>
                <Link href={`/login${queryParam}`} className="inline-block font-black underline">
                  {isEnglish ? 'Go to Sign in →' : 'Ir a Iniciar sesión →'}
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black text-sm cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}
            {statusMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black text-sm cursor-pointer"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 dark:text-slate-400">
          <Link href={`/login${queryParam}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            ← {isEnglish ? 'Back to Sign in' : 'Volver a Iniciar sesión'}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <RecuperarPasswordContent />
    </Suspense>
  );
}
