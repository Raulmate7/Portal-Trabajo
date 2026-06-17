'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Header() {
  const searchParams = useSearchParams();
  const lang = searchParams?.get('lang') === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    // Detectar el tema actual de la etiqueta HTML
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

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
    { label: isEnglish ? 'News' : 'Noticias', href: `/noticias${queryParam}` },
    { label: isEnglish ? 'Advertising' : 'Publicidad', href: `/publicidad${queryParam}` },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href={`/${queryParam}`} className="group flex items-center gap-2 shrink-0">
            <span className="text-2xl group-hover:scale-110 transition-transform">🚀</span>
            <span className="text-lg font-black bg-gradient-to-r from-indigo-900 to-indigo-650 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Portal Trabajo IT
            </span>
          </Link>

          {/* Menú de Navegación de Escritorio */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-650 dark:text-gray-300">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 dark:after:bg-indigo-450 hover:after:w-full after:transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTAs de Escritorio (Tema, Idioma, Publicar) */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            
            {/* Cambiador de Idioma */}
            <Link
              href={isEnglish ? `/${searchParams?.toString().replace(/lang=en&?|&lang=en/g, '')}` : `?lang=en`}
              className="text-xs font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors border border-gray-200/50 dark:border-slate-700/50"
              title={isEnglish ? 'Switch to Spanish' : 'Cambiar a Inglés'}
            >
              {isEnglish ? '🇪🇸 ES' : '🇬🇧 EN'}
            </Link>

            {/* Alternador de Tema */}
            {theme !== null && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-gray-200/30 dark:border-slate-700/30 text-yellow-500 dark:text-amber-400 transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {theme === 'dark' ? (
                  /* Sol */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  /* Luna */
                  <svg className="w-5 h-5 text-indigo-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}

            {/* CTA Publicar Oferta */}
            <Link
              href={`/publicar-oferta${queryParam}`}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-md shadow-green-500/20 active:scale-95"
            >
              {isEnglish ? 'Post a Job' : 'Publicar Oferta'}
            </Link>
          </div>

          {/* Panel Lateral e Interacciones Móviles */}
          <div className="flex md:hidden items-center gap-2">
            
            {/* Alternador de Tema Móvil */}
            {theme !== null && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 text-yellow-500 dark:text-amber-400 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <div className="md:hidden border-t border-gray-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 px-4 py-4 space-y-3 shadow-inner animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block font-bold py-2 px-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <hr className="border-gray-200/50 dark:border-slate-800/50 my-3" />

          <div className="flex items-center justify-between gap-4 px-3">
            {/* Idioma Móvil */}
            <span className="text-xs font-semibold text-gray-500">{isEnglish ? 'Language' : 'Idioma'}:</span>
            <Link
              href={isEnglish ? `/${searchParams?.toString().replace(/lang=en&?|&lang=en/g, '')}` : `?lang=en`}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold px-3 py-1.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
            >
              {isEnglish ? '🇪🇸 Español' : '🇬🇧 English'}
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href={`/publicar-oferta${queryParam}`}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-3 rounded-xl shadow-md active:scale-98"
            >
              {isEnglish ? 'Post a Job' : 'Publicar Oferta'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
