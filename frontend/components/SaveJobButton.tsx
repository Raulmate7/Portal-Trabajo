"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

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

// Caché compartida en memoria para evitar N peticiones duplicadas cuando hay múltiples JobCards
let cachedAuthStatePromise: Promise<{ authenticated: boolean; savedIds: Set<string> }> | null = null;
let cachedSavedIds: Set<string> | null = null;
let cachedAuthenticated: boolean | null = null;

function resetAuthSavedCache() {
  cachedAuthStatePromise = null;
  cachedSavedIds = null;
  cachedAuthenticated = null;
}

async function fetchAuthSavedState(): Promise<{ authenticated: boolean; savedIds: Set<string> }> {
  if (cachedAuthenticated !== null && cachedSavedIds !== null) {
    return { authenticated: cachedAuthenticated, savedIds: cachedSavedIds };
  }
  if (!cachedAuthStatePromise) {
    cachedAuthStatePromise = (async () => {
      try {
        const res = await fetch('/api/auth/saved-jobs', { cache: 'no-store' });
        if (res.status === 401) {
          cachedAuthenticated = false;
          cachedSavedIds = new Set();
          return { authenticated: false, savedIds: cachedSavedIds };
        }
        const data = await res.json();
        if (data?.success && Array.isArray(data.savedJobs)) {
          cachedAuthenticated = true;
          cachedSavedIds = new Set(data.savedJobs.map((j: any) => String(j.job_id)));
          return { authenticated: true, savedIds: cachedSavedIds };
        }
      } catch {}
      cachedAuthenticated = false;
      cachedSavedIds = new Set();
      return { authenticated: false, savedIds: cachedSavedIds };
    })();
  }
  return cachedAuthStatePromise;
}

const LOCAL_SAVED_KEY = 'saved_jobs';

function readLocalSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(typeof item === 'object' && item !== null ? item.id ?? '' : item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeLocalSavedIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {}
}

export default function SaveJobButton({ job, variant = 'card' }: SaveJobButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let active = true;

    const sync = async () => {
      const state = await fetchAuthSavedState();
      if (!active) return;
      setIsAuthenticated(state.authenticated);
      if (state.authenticated) {
        const localIds = readLocalSavedIds();
        if (localIds.length > 0) {
          try {
            await fetch('/api/auth/saved-jobs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobIds: localIds }),
            });
            localIds.forEach((id) => state.savedIds.add(id));
            localStorage.removeItem(LOCAL_SAVED_KEY);
          } catch {}
        }
        if (job.id) {
          setIsSaved(state.savedIds.has(String(job.id)));
        }
      } else if (job.id) {
        setIsSaved(readLocalSavedIds().includes(String(job.id)));
      }
    };
    sync();

    const handleAuthChange = () => {
      resetAuthSavedCache();
      sync();
    };
    const handleSavedChange = () => {
      if (!job.id) return;
      if (cachedAuthenticated && cachedSavedIds) {
        setIsSaved(cachedSavedIds.has(String(job.id)));
      } else {
        setIsSaved(readLocalSavedIds().includes(String(job.id)));
      }
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('saved_jobs_changed', handleSavedChange);
    return () => {
      active = false;
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('saved_jobs_changed', handleSavedChange);
    };
  }, [job.id]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!job.id) return;

    const idStr = String(job.id);
    const nextSaved = !isSaved;

    if (!isAuthenticated) {
      const current = readLocalSavedIds();
      const updated = nextSaved ? [...current, idStr] : current.filter((id) => id !== idStr);
      writeLocalSavedIds(updated);
      setIsSaved(nextSaved);
      if (nextSaved) {
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
      }
      window.dispatchEvent(new Event('saved_jobs_changed'));
      return;
    }
    setIsSaved(nextSaved);
    if (cachedSavedIds) {
      if (nextSaved) cachedSavedIds.add(idStr);
      else cachedSavedIds.delete(idStr);
    }

    try {
      if (nextSaved) {
        await fetch('/api/auth/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobIds: [idStr] }),
        });
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
      } else {
        await fetch(`/api/auth/saved-jobs?jobId=${encodeURIComponent(idStr)}`, {
          method: 'DELETE',
        });
      }
      window.dispatchEvent(new Event('saved_jobs_changed'));
    } catch {
      // Revert optimistic update on network error
      setIsSaved(!nextSaved);
      if (cachedSavedIds) {
        if (!nextSaved) cachedSavedIds.add(idStr);
        else cachedSavedIds.delete(idStr);
      }
    }
  };

  const renderToast = () => {
    if (!showSavedToast) return null;
    return (
      <div className="fixed bottom-4 right-4 z-[90] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
        <span className="text-xl">✅</span>
        <div className="flex flex-col">
          <span className="font-bold text-sm">Oferta guardada</span>
          <span className="text-emerald-100 text-xs">Sincronizada con tu cuenta</span>
        </div>
      </div>
    );
  };

  if (variant === 'detail') {
    return (
      <>
        <button
          onClick={toggleSave}
          className={`ui-btn-press flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-colors duration-150 cursor-pointer ${
            isSaved
              ? 'bg-[var(--status-amber-tint)] text-[var(--status-amber)] border-[var(--border-featured)]'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
          }`}
          title={isSaved ? "Quitar de guardadas" : "Guardar esta oferta"}
        >
          <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.812l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.218-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.777-.56-.378-1.812.583-1.812h4.907a1 1 0 00.95-.69l1.519-4.674z" />
          </svg>
          <span>{isSaved ? "Guardada" : "Guardar Oferta"}</span>
        </button>
        {mounted && typeof document !== 'undefined' && createPortal(renderToast(), document.body)}
      </>
    );
  }

  return (
    <>
      <button
        onClick={toggleSave}
        className={`ui-btn-press w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 border shrink-0 cursor-pointer ${
          isSaved
            ? 'bg-[var(--status-amber-tint)] text-[var(--status-amber)] border-[var(--border-featured)]'
            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]'
        }`}
        title={isSaved ? "Quitar de guardadas" : "Guardar oferta"}
        aria-label={isSaved ? "Quitar de guardadas" : "Guardar oferta"}
      >
        <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.812l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.218-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.777-.56-.378-1.812.583-1.812h4.907a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      </button>
      {mounted && typeof document !== 'undefined' && createPortal(renderToast(), document.body)}
    </>
  );
}
