"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompareFloatingPill() {
  const [count, setCount] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
      setCount(compared.length);
      setIds(compared);
    }

    const handleUpdate = () => {
      const compared = JSON.parse(localStorage.getItem('compared_jobs') || '[]');
      setCount(compared.length);
      setIds(compared);
    };

    window.addEventListener('compared_jobs_updated', handleUpdate);
    return () => window.removeEventListener('compared_jobs_updated', handleUpdate);
  }, []);

  if (!mounted || count === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 md:right-10 z-[80] animate-in slide-in-from-bottom duration-300">
      <Link
        href={`/comparar-ofertas?ids=${ids.join(',')}`}
        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full shadow-2xl border border-indigo-500 font-extrabold text-xs md:text-sm tracking-wide transition-all scale-100 hover:scale-105 active:scale-95"
      >
        <span>⚖️</span>
        <span>Comparar ({count}) ofertas</span>
      </Link>
    </div>
  );
}
