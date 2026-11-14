'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const UserStreak = dynamic(() => import('./UserStreak'), {
  ssr: false,
  loading: () => <div className="w-20 h-8 rounded-xl bg-indigo-50/50 dark:bg-slate-900/50 animate-pulse" />
});

export default function Header() {
  const searchParams = useSearchParams();
  const pathname = usePathname() || '/';
  const router = useRouter();
  const lang = searchParams?.get('lang') === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const cleanEsParams = (searchParams?.toString() || '').replace(/(^|&)lang=en(?=&|$)/g, '').replace(/^&|&$/g, '');
  const esHref = cleanEsParams ? `${pathname}?${cleanEsParams}` : pathname;
  const enParams = new URLSearchParams(searchParams?.toString() || '');
  enParams.set('lang', 'en');
  const enHref = `${pathname}?${enParams.toString()}`;

  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [authUser, setAuthUser] = useState<{
    email: string;
    fullName: string | null;
    emailNotificationsEnabled: boolean;
  } | null>(null);

  const loadAuthState = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data?.authenticated && data?.user) {
        setAuthUser({
          email: data.user.email,
          fullName: data.user.fullName || null,
          emailNotificationsEnabled: Boolean(data.user.emailNotificationsEnabled),
        });
      } else {
        setAuthUser(null);
      }
    } catch {
      setAuthUser(null);
    }
  }, []);

  useEffect(() => {
    // Detectar el tema actual de la etiqueta HTML
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    loadAuthState();

    const handleAuthChange = () => {
      loadAuthState();
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, [loadAuthState]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setAuthUser(null);
    setUserMenuOpen(false);
    setIsOpen(false);
    window.dispatchEvent(new Event('auth_state_changed'));
    router.refresh();
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const queryParam = isEnglish ? '?lang=en' : '';
  const queryParamAmp = isEnglish ? '&lang=en' : '';

  // Enlaces de navegación
  const navLinks = [
    { label: isEnglish ? 'Jobs' : 'Empleos', href: `/trabajos/informatica-tecnologia${queryParam}` },
    { label: isEnglish ? 'Remote' : 'Remoto', href: `/trabajo-remoto${queryParam}` },
    { label: isEnglish ? 'Salaries' : 'Salarios', href: `/salarios${queryParam}` },
    { label: isEnglish ? 'Companies' : 'Empresas', href: `/empresas${queryParam}` },
    { label: isEnglish ? 'Interviews' : 'Entrevistas', href: `/entrevistas${queryParam}` },
    { label: isEnglish ? 'Careers' : 'Guías Carrera', href: `/convertirse-en${queryParam}` },
    { label: isEnglish ? 'Glossary' : 'Glosario', href: `/glosario${queryParam}` },
    { label: isEnglish ? 'News' : 'Noticias', href: `/noticias${queryParam}` },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href={`/${queryParam}`} className="group flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--accent-primary)] font-mono text-xs font-bold flex items-center justify-center transition-colors group-hover:bg-[var(--accent-primary)] group-hover:text-white">
              &lt;/&gt;
            </span>
            <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Portal Trabajo IT
            </span>
          </Link>

          {/* Menú de Navegación de Escritorio */}
          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-[var(--text-secondary)]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className="px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors duration-150 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTAs de Escritorio (Tema, Idioma, Publicar) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            
            {/* Ofertas Guardadas */}
            <Link
              href={`/ofertas-guardadas${queryParam}`}
              aria-label={isEnglish ? 'View saved jobs' : 'Ver ofertas guardadas'}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium ui-btn-press cursor-pointer select-none"
              title={isEnglish ? 'Saved jobs' : 'Ofertas guardadas'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="hidden lg:inline">{isEnglish ? 'Saved' : 'Guardadas'}</span>
            </Link>

            {/* Racha de Visitas */}
            <UserStreak lang={lang} />

            {/* Cambiador de Idioma */}
            <Link
              href={isEnglish ? esHref : enHref}
              className="font-mono text-[11px] font-medium px-2 h-8 inline-flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title={isEnglish ? 'Switch to Spanish' : 'Cambiar a Inglés'}
            >
              {isEnglish ? 'ES' : 'EN'}
            </Link>

            {/* Alternador de Tema */}
            {theme !== null && (
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center ui-btn-press cursor-pointer"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                aria-label={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {theme === 'dark' ? (
                  /* Sol */
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  /* Luna */
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}

            {/* Cuenta de Usuario (Login / Registro o Menú de Perfil) */}
            {authUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] ui-btn-press cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-md bg-[var(--accent-primary)] text-white flex items-center justify-center font-mono text-[10px] font-bold uppercase">
                    {(authUser.fullName || authUser.email).charAt(0)}
                  </span>
                  <span className="max-w-[90px] truncate hidden xl:inline">
                    {authUser.fullName ? authUser.fullName.split(' ')[0] : authUser.email.split('@')[0]}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-lg p-1.5 z-50 space-y-0.5">
                    <div className="px-2.5 py-2 border-b border-[var(--border-subtle)] mb-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {authUser.fullName || authUser.email}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {authUser.emailNotificationsEnabled
                          ? isEnglish
                            ? 'Emails: Active'
                            : 'Correos: Activados'
                          : isEnglish
                          ? 'Emails: Off'
                          : 'Correos: Desactivados'}
                      </p>
                    </div>
                    <Link
                      href={`/mi-perfil${queryParam}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      {isEnglish ? 'My Profile & Emails' : 'Mi Perfil y Correos'}
                    </Link>
                    <Link
                      href={`/ofertas-guardadas${queryParam}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      {isEnglish ? 'Saved Jobs' : 'Ofertas Guardadas'}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--status-danger)] hover:bg-rose-500/10 cursor-pointer transition-colors"
                    >
                      {isEnglish ? 'Sign out' : 'Cerrar sesión'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/login${queryParam}`}
                  className="h-8 px-2.5 inline-flex items-center rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  {isEnglish ? 'Sign in' : 'Entrar'}
                </Link>
                <Link
                  href={`/registro${queryParam}`}
                  className="h-8 px-2.5 inline-flex items-center rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] text-[var(--text-primary)] ui-btn-press"
                >
                  {isEnglish ? 'Register' : 'Crear cuenta'}
                </Link>
              </div>
            )}

            {/* CTA Publicar Oferta */}
            <Link
              href={`/publicar-oferta${queryParam}`}
              className="h-8 px-3.5 inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium shadow-2xs ui-btn-press whitespace-nowrap"
            >
              {isEnglish ? 'Post a Job' : 'Publicar Oferta'}
            </Link>
          </div>

          {/* Panel Lateral e Interacciones Móviles */}
          <div className="flex md:hidden items-center gap-1.5">
            
            {/* Ofertas Guardadas Móvil */}
            <Link
              href={`/ofertas-guardadas${queryParam}`}
              aria-label={isEnglish ? 'View saved jobs' : 'Ver ofertas guardadas'}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ui-btn-press cursor-pointer"
              title={isEnglish ? 'Saved jobs' : 'Ofertas guardadas'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </Link>

            {/* Racha Móvil */}
            <UserStreak lang={lang} />

            {/* Alternador de Tema Móvil */}
            {theme !== null && (
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] cursor-pointer ui-btn-press"
                aria-label={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label={isOpen ? (isEnglish ? 'Close navigation menu' : 'Cerrar menú de navegación') : (isEnglish ? 'Open navigation menu' : 'Abrir menú de navegación')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {isOpen && (
        <div className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-4 space-y-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium py-2 px-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <hr className="border-[var(--border-subtle)] my-2" />

          <div className="flex items-center justify-between gap-4 px-3">
            <span className="text-xs font-medium text-[var(--text-muted)]">{isEnglish ? 'Language' : 'Idioma'}:</span>
            <Link
              href={isEnglish ? esHref : enHref}
              onClick={() => setIsOpen(false)}
              className="font-mono text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            >
              {isEnglish ? 'ES · Español' : 'EN · English'}
            </Link>
          </div>

          <div className="pt-2 space-y-2">
            {authUser ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/mi-perfil${queryParam}`}
                  onClick={() => setIsOpen(false)}
                  className="text-center bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium py-2.5 rounded-lg text-xs"
                >
                  {isEnglish ? 'My Profile' : 'Mi Perfil'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-center bg-rose-500/10 text-[var(--status-danger)] font-medium py-2.5 rounded-lg text-xs border border-rose-500/20 cursor-pointer"
                >
                  {isEnglish ? 'Sign out' : 'Cerrar sesión'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/login${queryParam}`}
                  onClick={() => setIsOpen(false)}
                  className="text-center bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium py-2.5 rounded-lg text-xs"
                >
                  {isEnglish ? 'Sign in' : 'Iniciar sesión'}
                </Link>
                <Link
                  href={`/registro${queryParam}`}
                  onClick={() => setIsOpen(false)}
                  className="text-center bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] font-medium py-2.5 rounded-lg text-xs"
                >
                  {isEnglish ? 'Create account' : 'Crear cuenta'}
                </Link>
              </div>
            )}
            <Link
              href={`/publicar-oferta${queryParam}`}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm py-2.5 rounded-lg ui-btn-press"
            >
              {isEnglish ? 'Post a Job' : 'Publicar Oferta'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
