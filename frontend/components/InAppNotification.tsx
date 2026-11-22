'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InAppNotification() {
  const [showToast, setShowToast] = useState(false);
  const [freshCount, setFreshCount] = useState(0);
  const [techList, setTechList] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    if (sessionStorage.getItem('fresh_alerts_shown') === 'true') return;

    const timer = setTimeout(async () => {
      const rawKws = localStorage.getItem('subscriber_tech_keywords');
      if (!rawKws) return;

      const kws = rawKws.split(',').map((k) => k.trim()).filter(Boolean);
      if (kws.length === 0) return;

      try {
        const response = await fetch(`/api/fresh-alerts?keywords=${encodeURIComponent(rawKws)}`);
        const data = await response.json();

        if (data.count && data.count > 0) {
          setFreshCount(data.count);
          setTechList(kws.join(', ').toUpperCase());
          setShowToast(true);
          sessionStorage.setItem('fresh_alerts_shown', 'true');
        }
      } catch (err) {
        console.error('Error fetching in-app notifications:', err);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !showToast) return null;

  const searchUrl = '/trabajos/informatica-tecnologia';

  return (
    <div
      className="fixed bottom-6 left-4 sm:left-6 z-[85] max-w-sm w-[calc(100%-32px)] bg-[var(--p-inv-bg)] border border-white/15 border-l-[3px] border-l-[var(--status-emerald)] text-[var(--p-inv-ink)] rounded-[var(--r-lg)] p-4 shadow-[var(--shadow-overlay)]"
      role="status"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-mono text-[13px] font-medium text-[#34d399]">
          Nuevas vacantes detectadas
        </p>
        <button
          type="button"
          onClick={() => setShowToast(false)}
          aria-label="Cerrar notificación"
          className="w-11 h-11 -mt-2 -mr-2 flex items-center justify-center rounded-[var(--r-md)] text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] font-mono text-[14px] shrink-0 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <p className="text-[14px] text-[var(--p-inv-muted)] leading-relaxed mb-3">
        Hay <strong className="font-mono tabular-nums text-[var(--p-inv-ink)]">{freshCount}</strong> vacantes nuevas de{' '}
        <strong className="text-[var(--p-inv-ink)]">{techList}</strong> publicadas en las últimas 2 horas.
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={searchUrl}
          onClick={() => setShowToast(false)}
          className="btn-primary !min-h-[44px] !px-4 !text-[14px]"
        >
          Ver ofertas →
        </Link>
        <button
          type="button"
          onClick={() => setShowToast(false)}
          className="min-h-[44px] px-3 rounded-[var(--r-btn)] text-[14px] font-medium text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] cursor-pointer"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
