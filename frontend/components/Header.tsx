'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const UserStreak = dynamic(() => import('./UserStreak'), {
  ssr: false,
  loading: () => (
    <div
      className="w-20 h-11 rounded-[var(--r-md)] bg-[var(--bg-subtle)]"
      aria-hidden="true"
    />
  ),
});

export default function Header({ defaultLang = 'es' }: { defaultLang?: 'es' | 'en' }) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramLang = searchParams?.get('lang');
  const lang: 'es' | 'en' =
    paramLang === 'en' || pathname.startsWith('/en')
      ? 'en'
      : paramLang === 'es'
      ? 'es'
      : defaultLang;
  const isEnglish = lang === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{
    email: string;
    fullName: string | null;
    emailNotificationsEnabled: boolean;
  } | null>(null);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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
    const handleAuthChange = () => loadAuthState();
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, [loadAuthState]);

  useEffect(() => {
    setIsOpen(false);
    setMegaOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setMegaOpen(false);
        setUserMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleQuickSearch = () => {
    const input = document.querySelector<HTMLInputElement>(
      'input[name="q"], input[type="search"], #search-q'
    );
    if (input) {
      input.focus();
      input.scrollIntoView({ block: 'center', behavior: 'instant' });
      return;
    }
    router.push(isEnglish ? '/en#search-q' : '/#search-q');
  };

  const openMegaWithDelay = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setMegaOpen(true), 150);
  };

  const closeMegaWithDelay = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    closeTimerRef.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const queryParam = paramLang === 'en' ? '?lang=en' : '';
  const isHome = pathname === '/' || pathname === '/en';

  const navLinks = [
    {
      label: isEnglish ? 'Jobs' : 'Empleos',
      href: `/trabajos/informatica-tecnologia${queryParam}`,
      match: ['/trabajos', '/trabajo-', '/trabajo/'],
    },
    {
      label: isEnglish ? 'Remote' : 'Remoto',
      href: `/trabajo-remoto${queryParam}`,
      match: ['/trabajo-remoto', '/empresas-remotas'],
    },
    {
      label: isEnglish ? 'Salaries' : 'Salarios',
      href: `/salarios${queryParam}`,
      match: ['/salarios', '/cuanto-gana'],
    },
    {
      label: isEnglish ? 'Companies' : 'Empresas',
      href: `/empresas${queryParam}`,
      match: ['/empresas', '/ranking-empresas-it'],
    },
    {
      label: isEnglish ? 'Resources' : 'Recursos',
      href: `/recursos${queryParam}`,
      match: [
        '/recursos',
        '/comparar',
        '/mapa-empleo',
        '/informe-mercado-it',
        '/tendencias',
        '/entrevistas',
        '/test-nivel',
        '/convertirse-en',
        '/certificaciones',
        '/glosario',
        '/blog',
        '/noticias',
      ],
      hasMega: true,
    },
  ];

  const megaColumns = [
    {
      heading: isEnglish ? 'Market Intelligence' : 'Inteligencia de Mercado',
      links: [
        { label: isEnglish ? 'Tech Comparison' : 'Comparador de Tecnologías', href: `/comparar${queryParam}` },
        { label: isEnglish ? 'IT Employment Map' : 'Mapa de Empleo IT', href: `/mapa-empleo${queryParam}` },
        { label: isEnglish ? '2026 Market Report' : 'Informe Mercado IT 2026', href: `/informe-mercado-it${queryParam}` },
        { label: isEnglish ? 'Tech Trends' : 'Tendencias Tech', href: `/tendencias${queryParam}` },
      ],
    },
    {
      heading: isEnglish ? 'Technical Prep' : 'Preparación Técnica',
      links: [
        { label: isEnglish ? 'Interview Questions' : 'Preguntas de Entrevista', href: `/entrevistas${queryParam}` },
        { label: isEnglish ? 'Skill Level Test' : 'Test de Nivel', href: `/test-nivel${queryParam}` },
        { label: isEnglish ? 'Career Guides' : 'Guías de Carrera', href: `/convertirse-en${queryParam}` },
        { label: isEnglish ? 'Certifications' : 'Certificaciones IT', href: `/certificaciones${queryParam}` },
        { label: isEnglish ? 'IT Glossary' : 'Glosario IT', href: `/glosario${queryParam}` },
      ],
    },
    {
      heading: isEnglish ? 'Editorial & Alerts' : 'Actualidad',
      links: [
        { label: isEnglish ? 'Engineering Blog' : 'Blog de Ingeniería', href: `/blog${queryParam}` },
        { label: isEnglish ? 'Tech News' : 'Noticias Tech', href: `/noticias${queryParam}` },
        { label: isEnglish ? 'Weekly Newsletter' : 'Boletín Semanal', href: `/newsletter${queryParam}` },
      ],
    },
  ];

  const isActiveLink = (match: string[]) =>
    match.some((prefix) => pathname.startsWith(prefix));

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 h-[var(--nav)] bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]"
      onMouseLeave={closeMegaWithDelay}
    >
      <div className="wrap h-full flex items-center justify-between gap-4 relative">
        <a className="skip-link" href="#top">
          {isEnglish ? 'Skip to content' : 'Saltar al contenido'}
        </a>

        {/* Left: Geometric Stack Mark + Wordmark */}
        <Link
          href={`/${queryParam}`}
          className="flex items-center gap-2.5 shrink-0 min-h-[44px] pr-2 text-[var(--text-primary)] no-underline"
        >
          <svg
            className="w-6 h-6 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            data-mark="stack"
          >
            <rect x="2" y="4" width="14" height="3.5" rx="1" fill="var(--accent-primary)" />
            <rect x="6" y="10.25" width="16" height="3.5" rx="1" fill="var(--text-primary)" />
            <rect x="2" y="16.5" width="12" height="3.5" rx="1" fill="var(--text-primary)" />
          </svg>
          <span className="text-[18px] font-medium tracking-[-0.025em] leading-none whitespace-nowrap">
            Portal Trabajo IT
          </span>
        </Link>

        {/* Center: 5 one-word nouns on Desktop (>= 1024px) */}
        <nav
          className="hidden lg:flex items-center gap-1 h-full"
          aria-label={isEnglish ? 'Primary navigation' : 'Navegación principal'}
        >
          {navLinks.map((link) => {
            const active = isActiveLink(link.match);
            return (
              <div
                key={link.href}
                className="relative h-full flex items-center"
                onMouseEnter={link.hasMega ? openMegaWithDelay : undefined}
              >
                <Link
                  href={link.href}
                  prefetch={true}
                  aria-current={active ? 'page' : undefined}
                  className={`relative h-full inline-flex items-center px-3 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span
                      className="absolute bottom-0 inset-x-3 h-[2px] bg-[var(--accent-primary)]"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Right: Desktop Actions (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {!isHome && (
            <button
              type="button"
              onClick={handleQuickSearch}
              aria-label={isEnglish ? 'Focus search (/)' : 'Buscar ofertas (/)'}
              className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <span>{isEnglish ? 'Search' : 'Buscar'}</span>
              <kbd className="font-mono text-[13px] leading-none px-1.5 py-0.5 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                /
              </kbd>
            </button>
          )}

          {authUser && (
            <Link
              href={`/ofertas-guardadas${queryParam}`}
              aria-label={isEnglish ? 'Saved jobs' : 'Ofertas guardadas'}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
            >
              <span>{isEnglish ? 'Saved' : 'Guardadas'}</span>
            </Link>
          )}

          <UserStreak lang={lang} />

          {authUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-[var(--r-md)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[14px] font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <span className="w-6 h-6 rounded-[var(--r-sm)] bg-[var(--accent-primary)] text-[var(--p-action-ink)] flex items-center justify-center font-mono text-[13px] font-medium uppercase">
                  {(authUser.fullName || authUser.email).charAt(0)}
                </span>
                <span className="max-w-[100px] truncate hidden xl:inline">
                  {authUser.fullName ? authUser.fullName.split(' ')[0] : authUser.email.split('@')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-[var(--r-md)] bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-[var(--shadow-overlay)] p-1.5 z-50">
                  <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] mb-1">
                    <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">
                      {authUser.fullName || authUser.email}
                    </p>
                    <p className="font-mono text-[13px] text-[var(--text-muted)] truncate mt-0.5">
                      {authUser.emailNotificationsEnabled
                        ? isEnglish
                          ? 'Alerts: Active'
                          : 'Alertas: Activas'
                        : isEnglish
                        ? 'Alerts: Off'
                        : 'Alertas: Desactivadas'}
                    </p>
                  </div>
                  <Link
                    href={`/mi-perfil${queryParam}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center min-h-[44px] px-3 rounded-[var(--r-sm)] text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  >
                    {isEnglish ? 'My profile & alerts' : 'Mi perfil y alertas'}
                  </Link>
                  <Link
                    href={`/ofertas-guardadas${queryParam}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center min-h-[44px] px-3 rounded-[var(--r-sm)] text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  >
                    {isEnglish ? 'Saved jobs' : 'Ofertas guardadas'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center min-h-[44px] px-3 rounded-[var(--r-sm)] text-[14px] font-medium text-[var(--status-danger)] hover:bg-[var(--status-danger-tint)] cursor-pointer"
                  >
                    {isEnglish ? 'Sign out' : 'Cerrar sesión'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/login${queryParam}`}
              className="inline-flex items-center min-h-[44px] px-3 text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
            >
              {isEnglish ? 'Sign in' : 'Acceder'}
            </Link>
          )}

          <Link
            href={`/publicar-oferta${queryParam}`}
            className="btn-primary whitespace-nowrap"
          >
            {isEnglish ? 'Post a job' : 'Publicar oferta'}
          </Link>
        </div>

        {/* Tablet (640px-1023px) & Mobile (<640px) Controls */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          {authUser && (
            <Link
              href={`/ofertas-guardadas${queryParam}`}
              aria-label={isEnglish ? 'Saved jobs' : 'Ofertas guardadas'}
              className="sm:hidden w-11 h-11 flex items-center justify-center rounded-[var(--r-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </Link>
          )}

          <div className="hidden sm:block">
            <UserStreak lang={lang} />
          </div>

          <Link
            href={`/publicar-oferta${queryParam}`}
            className="hidden sm:inline-flex btn-primary whitespace-nowrap"
          >
            {isEnglish ? 'Post a job' : 'Publicar oferta'}
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? isEnglish
                  ? 'Close navigation menu'
                  : 'Cerrar menú de navegación'
                : isEnglish
                ? 'Open navigation menu'
                : 'Abrir menú de navegación'
            }
            className="btn-secondary !px-0 w-11 h-11 min-w-[44px] min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Flat Mega Panel for "Recursos" */}
        {megaOpen && (
          <div
            className="hidden lg:block absolute top-full inset-x-0 mt-[1px] rounded-b-[var(--r-lg)] bg-[var(--bg-surface)] border border-t-0 border-[var(--border-subtle)] dark:shadow-[var(--shadow-overlay)] p-6 z-50"
            style={{ transformOrigin: 'top center' }}
            onMouseEnter={() => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            }}
            onMouseLeave={closeMegaWithDelay}
          >
            <div className="grid-12 items-start">
              {megaColumns.map((col) => (
                <div key={col.heading} className="col-span-3">
                  <p className="font-mono text-[13px] font-medium text-[var(--text-muted)] mb-3">
                    {col.heading}
                  </p>
                  <ul className="space-y-1">
                    {col.links.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMegaOpen(false)}
                          className="block py-1.5 text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="col-span-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-4">
                <p className="font-mono text-[13px] font-medium text-[var(--status-emerald)] mb-1.5">
                  {isEnglish ? 'Live Benchmark' : 'Referencia salarial'}
                </p>
                <p className="text-[15px] font-medium text-[var(--text-primary)] leading-snug mb-2">
                  {isEnglish
                    ? 'Compare Spain IT salaries by stack and seniority.'
                    : 'Consulta percentiles P25–P75 por tecnología y ciudad.'}
                </p>
                <Link
                  href={`/salarios${queryParam}`}
                  onClick={() => setMegaOpen(false)}
                  className="link-arrow text-[14px]"
                >
                  {isEnglish ? 'Open salary calculator →' : 'Abrir calculadora salarial →'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile & Tablet Full-Screen Sheet (100dvh) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[var(--nav)] h-[calc(100dvh-var(--nav))] z-50 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] overflow-y-auto">
          <div className="wrap py-4 flex flex-col min-h-full justify-between pb-[calc(24px+env(safe-area-inset-bottom))]">
            <div>
              <nav aria-label={isEnglish ? 'Mobile navigation' : 'Navegación móvil'}>
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between min-h-[56px] text-[16px] font-medium text-[var(--text-primary)]"
                      >
                        <span>{link.label}</span>
                        <span className="font-mono text-[13px] text-[var(--text-muted)]" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                <p className="font-mono text-[13px] font-medium text-[var(--text-muted)] mb-2">
                  {isEnglish ? 'Tools & Guides' : 'Herramientas y Guías'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: isEnglish ? 'Comparator' : 'Comparador', href: `/comparar${queryParam}` },
                    { label: isEnglish ? 'IT Map' : 'Mapa Empleo', href: `/mapa-empleo${queryParam}` },
                    { label: isEnglish ? 'Interviews' : 'Entrevistas', href: `/entrevistas${queryParam}` },
                    { label: isEnglish ? 'Blog' : 'Blog', href: `/blog${queryParam}` },
                  ].map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center min-h-[44px] px-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] text-[14px] font-medium text-[var(--text-primary)]"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between gap-2 sm:hidden">
                <UserStreak lang={lang} />
              </div>

              {authUser ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/mi-perfil${queryParam}`}
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary w-full"
                  >
                    {isEnglish ? 'Profile' : 'Mi perfil'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-[44px] px-4 rounded-[var(--r-btn)] border border-[var(--status-danger)] text-[var(--status-danger)] text-[15px] font-medium cursor-pointer"
                  >
                    {isEnglish ? 'Sign out' : 'Cerrar sesión'}
                  </button>
                </div>
              ) : (
                <Link
                  href={`/login${queryParam}`}
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary w-full"
                >
                  {isEnglish ? 'Sign in' : 'Acceder'}
                </Link>
              )}

              <Link
                href={`/publicar-oferta${queryParam}`}
                onClick={() => setIsOpen(false)}
                className="btn-primary w-full min-h-[48px]"
              >
                {isEnglish ? 'Post a job' : 'Publicar oferta'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
