"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Job {
  id?: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at?: string;
  title_es?: string | null;
}

interface SaveJobButtonProps {
  job: Job;
  variant?: 'card' | 'detail';
}

export default function SaveJobButton({ job, variant = 'card' }: SaveJobButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && job.id) {
      const savedJobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
      const found = savedJobs.some((j: any) => String(j.id) === String(job.id));
      setIsSaved(found);
      // Pre-fill email if previously captured
      const captured = localStorage.getItem('saved_jobs_email');
      if (captured) setEmail(captured);
    }
  }, [job.id]);

  useEffect(() => {
    if (showEmailModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showEmailModal]);

  const hasEmailCaptured = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('saved_jobs_email');
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!job.id) return;

    const savedJobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    if (isSaved) {
      const updated = savedJobs.filter((j: any) => String(j.id) !== String(job.id));
      localStorage.setItem('saved_jobs', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedJobs.push({ ...job, saved_at: new Date().toISOString() });
      localStorage.setItem('saved_jobs', JSON.stringify(savedJobs));
      setIsSaved(true);
      // Show email modal if email not yet captured
      if (!hasEmailCaptured()) {
        setTimeout(() => setShowEmailModal(true), 300);
      }
    }
  };

  const handleEmailSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Introduce un email válido.');
      return;
    }
    setEmailError('');
    try {
      localStorage.setItem('saved_jobs_email', trimmed);
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'saved_jobs_reminder' }),
      });
      setEmailSent(true);
    } catch {
      localStorage.setItem('saved_jobs_email', trimmed);
      setEmailSent(true);
    }
  };

  const renderModal = () => {
    if (!showEmailModal) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full border border-gray-100 dark:border-slate-800 shadow-2xl relative">
          <button
            onClick={() => setShowEmailModal(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold cursor-pointer text-lg leading-none"
          >
            ✕
          </button>

          <span className="text-4xl block mb-3">⭐</span>
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">
            ¡Oferta guardada!
          </h3>

          {!emailSent ? (
            <>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-5">
                Te enviamos un recordatorio en <strong>48 horas</strong> con las ofertas que has guardado por si se acercan a su fecha límite. Sin spam.
              </p>
              <div className="space-y-3">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="tu@email.com"
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {emailError && <p className="text-xs text-rose-600">{emailError}</p>}
                <button
                  onClick={handleEmailSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl transition-colors text-sm shadow-md"
                >
                  Activar Recordatorio ⏰
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
                >
                  No, gracias — solo quiero guardar la oferta
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <span className="text-4xl block mb-3">✅</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">¡Recordatorio activado!</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Te avisaremos en 48 horas con las ofertas guardadas que estén próximas a expirar.
              </p>
              <button
                onClick={() => setShowEmailModal(false)}
                className="mt-5 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (variant === 'detail') {
    return (
      <>
        <button
          onClick={toggleSave}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all duration-200 ${
            isSaved
              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={isSaved ? "Quitar de favoritos" : "Guardar esta oferta"}
        >
          <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.812l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.218-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.777-.56-.378-1.812.583-1.812h4.907a1 1 0 00.95-.69l1.519-4.674z" />
          </svg>
          <span>{isSaved ? "Guardada" : "Guardar Oferta"}</span>
        </button>
        {mounted && typeof document !== 'undefined' && createPortal(renderModal(), document.body)}
      </>
    );
  }

  return (
    <>
      <button
        onClick={toggleSave}
        className={`p-2 rounded-lg transition-colors border shrink-0 ${
          isSaved
            ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100'
            : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600 hover:bg-gray-50'
        }`}
        title={isSaved ? "Quitar de guardadas" : "Guardar oferta"}
        aria-label={isSaved ? "Quitar de guardadas" : "Guardar oferta"}
      >
        <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.812l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.218-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.777-.56-.378-1.812.583-1.812h4.907a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      </button>
      {mounted && typeof document !== 'undefined' && createPortal(renderModal(), document.body)}
    </>
  );
}
