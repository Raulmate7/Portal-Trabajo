"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Comprobamos si ya aceptó las cookies antes
    const accepted = localStorage.getItem('cookies_accepted');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShow(false);
  };

  // Si ya aceptó, no renderizamos nada
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-slate-700">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <div className="text-center sm:text-left">
          <p className="leading-relaxed">
            🍪 Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico. 
            Al continuar navegando, aceptas nuestra{' '}
            <Link href="/privacy" className="underline text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Política de Privacidad
            </Link>.
          </p>
        </div>
        <button 
          onClick={acceptCookies}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-md"
        >
          Aceptar y Cerrar
        </button>
      </div>
    </div>
  );
}
