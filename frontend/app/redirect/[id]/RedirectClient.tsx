'use client';

import { useEffect, useState } from 'react';
import AdBanner from '@/components/AdBanner';
import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';

interface Props {
  url: string;
  company: string;
  title: string;
  lang: string;
}

export default function RedirectClient({ url, company, title, lang }: Props) {
  const [countdown, setCountdown] = useState(4);
  const [redirected, setRedirected] = useState(false);
  const isEnglish = lang === 'en';

  useEffect(() => {
    sendGAEvent({ event: 'redirect_page_view', company, job_title: title });

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [company, title]);

  useEffect(() => {
    if (countdown === 0 && !redirected) {
      setRedirected(true);
      sendGAEvent({ event: 'redirect_auto', company, job_title: title });
      window.location.replace(url);
    }
  }, [countdown, redirected, url, company, title]);

  const handleManualRedirect = () => {
    sendGAEvent({ event: 'redirect_manual', company, job_title: title });
    setRedirected(true);
    window.location.replace(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / Brand */}
      <Link href="/" className="mb-10 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
        <span className="text-xl font-black text-white tracking-tight">Portal<span className="text-indigo-300">Empleo</span><span className="text-indigo-400">.it</span></span>
      </Link>

      {/* Card principal */}
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl">
        {/* Spinner de carga */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <svg
              className="w-16 h-16 -rotate-90 animate-spin-slow"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="32" cy="32" r="26"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
              />
              <circle
                cx="32" cy="32" r="26"
                stroke="#818cf8"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(4 - countdown) / 4 * 163.4} 163.4`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white">
              {countdown > 0 ? countdown : '✓'}
            </span>
          </div>
        </div>

        <h1 className="text-xl md:text-2xl font-black text-white mb-2 leading-snug">
          {isEnglish
            ? `Redirecting you to ${company}...`
            : `Redirigiéndote a la oferta en ${company}...`}
        </h1>
        <p className="text-indigo-300/80 text-sm mb-8 leading-relaxed">
          {isEnglish
            ? `You will be automatically redirected in ${countdown > 0 ? countdown : 0} second${countdown !== 1 ? 's' : ''}.`
            : `Serás redirigido automáticamente en ${countdown > 0 ? countdown : 0} segundo${countdown !== 1 ? 's' : ''}.`}
        </p>

        {/* Botón acción directa */}
        <button
          onClick={handleManualRedirect}
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 cursor-pointer mb-4 text-sm"
        >
          {isEnglish ? '→ Go to job now' : '→ Ir a la oferta ahora'}
        </button>

        <p className="text-indigo-400/60 text-xs">
          {isEnglish
            ? 'You will leave our site and go to the company\'s original job posting.'
            : 'Accederás al portal de empleo externo de la empresa anunciante.'}
        </p>
      </div>

      {/* Anuncio inline centrado — impresión monetizada durante la espera */}
      <div className="w-full max-w-lg mt-8">
        <p className="text-indigo-400/50 text-[10px] uppercase tracking-widest text-center mb-2">Anuncio</p>
        <AdBanner variant="inline" />
      </div>

      {/* Enlace de regreso */}
      <Link
        href="/"
        className="mt-8 text-indigo-400/70 hover:text-indigo-300 text-xs hover:underline transition-colors"
      >
        ← {isEnglish ? 'Back to job listings' : 'Volver al listado de ofertas'}
      </Link>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(-90deg); }
          to { transform: rotate(270deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </main>
  );
}
