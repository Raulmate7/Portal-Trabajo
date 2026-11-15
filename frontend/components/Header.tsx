'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const UserStreak = dynamic(() => import('./UserStreak'), {
  ssr: false,
  loading: () => <div className="w-20 h-8 rounded-xl bg-indigo-50/50 dark:bg-slate-900/50 animate-pulse" />
});

export default function Header({ defaultLang = 'es' }: { defaultLang?: 'es' | 'en' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramLang = searchParams?.get('lang');
  const lang: 'es' | 'en' = paramLang === 'en' ? 'en' : paramLang === 'es' ? 'es' : defaultLang;
  const isEnglish = lang === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const queryParam = paramLang === 'en' ? '?lang=en' : '';

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
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xs flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M8 10l3 2.5L8 15" />
                <path d="M13 15h3" />
              </svg>
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

          {/* CTAs de Escritorio */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            
            {/* Ofertas Guardadas (solo usuarios registrados) */}
            {authUser && (
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
            )}

            {/* Racha de Visitas */}
            <UserStreak lang={lang} />

            {/* Cuenta de Usuario (Unirse o Menú de Perfil) */}
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
              <Link
                href={`/login${queryParam}`}
                className="h-8 px-3 inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-primary)] ui-btn-press whitespace-nowrap"
              >
                {isEnglish ? 'Join' : 'Unirse'}
              </Link>
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
            
            {/* Ofertas Guardadas Móvil (solo usuarios registrados) */}
            {authUser && (
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
            )}

            {/* Racha Móvil */}
            <UserStreak lang={lang} />

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

          <div className="pt-1 space-y-2">
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
              <Link
                href={`/login${queryParam}`}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium py-2.5 rounded-lg text-xs"
              >
                {isEnglish ? 'Join' : 'Unirse'}
              </Link>
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
