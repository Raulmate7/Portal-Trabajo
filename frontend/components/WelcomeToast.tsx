'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WelcomeToast() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isFirstVisit = !localStorage.getItem('has_visited_before');

    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem('has_visited_before', 'true');
  };

  if (!mounted || !show) return null;

  return (
    <div
      className="fixed bottom-6 left-4 sm:left-6 z-[85] max-w-sm w-[calc(100%-32px)] bg-[var(--bg-surface)] border border-[var(--border-strong)] border-l-[3px] border-l-[var(--accent-primary)] rounded-[var(--r-lg)] p-5 shadow-[var(--shadow-overlay)]"
      role="region"
      aria-label="Guía rápida de bienvenida"
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-[var(--r-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] font-mono text-[14px] cursor-pointer"
        aria-label="Cerrar bienvenida"
      >
        ✕
      </button>

      <div className="mb-4 pr-8">
        <p className="font-mono text-[13px] font-medium text-[var(--accent-primary)] mb-1">
          Primeros pasos
        </p>
        <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-1">
          Bienvenido a Portal Trabajo IT
        </h4>
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          Tres acciones rápidas para aprovechar el buscador y los datos salariales:
        </p>
      </div>

      <ul className="space-y-2.5 mb-5">
        <li className="flex items-start gap-2.5">
          <span className="font-mono text-[13px] font-medium px-1.5 py-0.5 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shrink-0">
            01
          </span>
          <p className="text-[14px] text-[var(--text-secondary)]">
            <strong className="font-medium text-[var(--text-primary)]">Crea tu alerta:</strong> recibe vacantes verificadas en tu correo.
          </p>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="font-mono text-[13px] font-medium px-1.5 py-0.5 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shrink-0">
            02
          </span>
          <p className="text-[14px] text-[var(--text-secondary)]">
            <Link href="/salarios" onClick={handleClose} className="text-[var(--accent-primary)] hover:underline font-medium">
              Calcula tu percentil salarial
            </Link>{' '}
            por stack y ciudad.
          </p>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="font-mono text-[13px] font-medium px-1.5 py-0.5 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shrink-0">
            03
          </span>
          <p className="text-[14px] text-[var(--text-secondary)]">
            <strong className="font-medium text-[var(--text-primary)]">Guarda ofertas:</strong> márcalas para compararlas después.
          </p>
        </li>
      </ul>

      <button
        type="button"
        onClick={handleClose}
        className="btn-primary w-full"
      >
        Entendido
      </button>
    </div>
  );
}
