'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompareFloatingPill() {
  const [count, setCount] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const readCompared = () => {
      try {
        const compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
        setCount(Array.isArray(compared) ? compared.length : 0);
        setIds(Array.isArray(compared) ? compared : []);
      } catch {
        setCount(0);
        setIds([]);
      }
    };

    readCompared();
    window.addEventListener('compared_jobs_updated', readCompared);
    return () => window.removeEventListener('compared_jobs_updated', readCompared);
  }, []);

  if (!mounted || count === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[80]">
      <Link
        href={`/comparar-ofertas?ids=${ids.join(',')}`}
        className="inline-flex items-center gap-2.5 min-h-[44px] px-4 rounded-[var(--r-md)] bg-[var(--p-inv-bg)] text-[var(--p-inv-ink)] border border-[var(--border-strong)] shadow-[var(--shadow-overlay)] font-mono text-[13px] font-medium tabular-nums ui-btn-press"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--p-inv-accent)] shrink-0" aria-hidden="true" />
        <span>Comparar ({count}) ofertas →</span>
      </Link>
    </div>
  );
}
