'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface StreakData {
  lastVisitDate: string;
  count: number;
  reminderEmailSent?: boolean;
  emailCaptured?: string;
}

const MILESTONE_REWARDS: Record<number, { label: string; reward: string; href: string }> = {
  3:  { label: 'Hito · 3 días',  reward: 'Guía Salarial IT 2026 gratis',       href: '/salarios' },
  7:  { label: 'Hito · 7 días',  reward: 'Acceso a tendencias de empleo tech', href: '/tendencias' },
  30: { label: 'Hito · 30 días', reward: 'Badge de candidato experto',         href: '/mi-perfil' },
};

function getMilestoneReached(streak: number): { milestone: number; data: typeof MILESTONE_REWARDS[number] } | null {
  const milestones = [30, 7, 3];
  for (const m of milestones) {
    if (streak >= m) {
      return { milestone: m, data: MILESTONE_REWARDS[m] };
    }
  }
  return null;
}

function getNextMilestone(streak: number): number {
  if (streak < 3) return 3;
  if (streak < 7) return 7;
  if (streak < 30) return 30;
  return 30;
}

export default function UserStreak({ lang = 'es' }: { lang?: string }) {
  const isEnglish = lang === 'en';
  const [streak, setStreak] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setMounted(true);
    fetch('/api/streak', { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData && typeof serverData.count === 'number') {
          setStreak(serverData.count);
          if (serverData.milestoneReached) {
            setTimeout(() => setShowModal(true), 800);
          }
          try {
            const storageKey = 'portal_streak_data';
            const raw = localStorage.getItem(storageKey);
            const existing: StreakData = raw ? JSON.parse(raw) : { lastVisitDate: '', count: 0 };
            localStorage.setItem(
              storageKey,
              JSON.stringify({ ...existing, lastVisitDate: serverData.lastVisitDate, count: serverData.count })
            );
            if (existing.emailCaptured) setEmailSaved(true);
          } catch {}
        }
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem('portal_streak_data');
          if (raw) {
            const parsed: StreakData = JSON.parse(raw);
            if (typeof parsed.count === 'number') setStreak(parsed.count);
            if (parsed.emailCaptured) setEmailSaved(true);
          }
        } catch {}
      });
  }, []);

  const handleSaveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(isEnglish ? 'Enter a valid email address.' : 'Introduce un email válido para recibir el recordatorio.');
      return;
    }
    if (!privacyAccepted) {
      setEmailError(isEnglish ? 'You must accept the Privacy Policy.' : 'Debes aceptar la Política de Privacidad para activar el aviso.');
      return;
    }
    setEmailError('');
    try {
      const storageKey = 'portal_streak_data';
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        data.emailCaptured = trimmed;
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'streak_reminder', privacy_accepted: true }),
      });
      setEmailSaved(true);
    } catch {
      setEmailSaved(true);
    }
  };

  if (streak === 0) return null;

  const milestoneReached = getMilestoneReached(streak);
  const nextMilestone = getNextMilestone(streak);

  const dotColor =
    streak >= 30
      ? 'bg-[var(--accent-primary)]'
      : streak >= 7
      ? 'bg-[var(--status-emerald)]'
      : 'bg-[var(--status-amber)]';

  const renderModal = () => {
    if (!showModal) return null;
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-modal-title"
      >
        <div className="bg-[var(--bg-surface)] rounded-[var(--r-lg)] p-6 max-w-md w-full border border-[var(--border-strong)] shadow-[var(--shadow-overlay)] relative text-left">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            aria-label={isEnglish ? 'Close streak modal' : 'Cerrar ventana de racha de visitas'}
            className="absolute right-3 top-3 w-11 h-11 flex items-center justify-center rounded-[var(--r-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer font-mono text-[14px]"
          >
            ✕
          </button>

          <p className="font-mono text-[13px] font-medium text-[var(--status-amber)] mb-1">
            {isEnglish ? 'Activity ledger' : 'Registro de actividad'}
          </p>
          <h3 id="streak-modal-title" className="text-[22px] font-medium text-[var(--text-primary)] tracking-[-0.025em] mb-2 pr-10">
            {isEnglish ? `${streak}-day visit streak` : `Racha de ${streak} días`}
          </h3>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-5">
            {isEnglish
              ? 'Keep up the daily streak to stay updated with verified IT roles and compensation benchmarks.'
              : 'Mantén tu consulta diaria para seguir las últimas vacantes IT y referencias salariales del sector.'}
          </p>

          {milestoneReached && (
            <div className="mb-5 p-4 rounded-[var(--r-md)] bg-[var(--status-amber-tint)] border border-[var(--border-featured)]">
              <span className="font-mono text-[13px] font-medium text-[var(--status-amber)] block mb-1">
                {milestoneReached.data.label} · Desbloqueado
              </span>
              <p className="text-[14px] text-[var(--text-primary)] mb-3">
                {milestoneReached.data.reward}
              </p>
              <Link
                href={milestoneReached.data.href}
                onClick={() => setShowModal(false)}
                className="btn-primary w-full"
              >
                {isEnglish ? 'Open resource →' : 'Abrir recurso →'}
              </Link>
            </div>
          )}

          {nextMilestone > streak && (
            <div className="mb-5">
              <div className="flex justify-between mb-1.5 font-mono text-[13px] tabular-nums text-[var(--text-secondary)]">
                <span>{isEnglish ? `Current: ${streak}d` : `Actual: ${streak} días`}</span>
                <span>{isEnglish ? `Target: ${nextMilestone}d` : `Objetivo: ${nextMilestone} días`}</span>
              </div>
              <div className="w-full bg-[var(--bg-subtle)] rounded-[var(--r-sm)] h-2 overflow-hidden">
                <div
                  className="bg-[var(--status-emerald)] h-2 transition-all duration-300"
                  style={{ width: `${Math.min(100, (streak / nextMilestone) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                {isEnglish
                  ? `${nextMilestone - streak} days remaining for: ${MILESTONE_REWARDS[nextMilestone]?.reward || 'next milestone'}`
                  : `Faltan ${nextMilestone - streak} días para: ${MILESTONE_REWARDS[nextMilestone]?.reward || 'siguiente hito'}`}
              </p>
            </div>
          )}

          {!emailSaved ? (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <label htmlFor="streak-reminder-email" className="block text-[14px] font-medium text-[var(--text-primary)] mb-2">
                {isEnglish ? 'Email reminder before streak resets' : 'Aviso por correo antes de perder la racha'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="streak-reminder-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                  placeholder={isEnglish ? 'you@company.com' : 'tu@correo.es'}
                  className="flex-1 min-h-[48px] text-[16px] border border-[var(--border-strong)] rounded-[var(--r-md)] px-3.5 bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  className="btn-primary whitespace-nowrap"
                >
                  {isEnglish ? 'Save' : 'Guardar'}
                </button>
              </div>

              <label className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded-[var(--r-sm)] border-[var(--border-strong)] accent-[var(--accent-primary)] shrink-0"
                />
                <span>
                  {isEnglish ? 'I accept the ' : 'Acepto la '}
                  <Link href="/privacy" target="_blank" className="underline text-[var(--text-primary)] hover:text-[var(--accent-primary)]">
                    {isEnglish ? 'Privacy Policy' : 'Política de Privacidad'}
                  </Link>
                  {isEnglish ? ' for streak reminders.' : ' para recibir recordatorios de racha.'}
                </span>
              </label>

              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--r-md)] text-[13px] text-[var(--text-secondary)] space-y-1 mt-3 leading-snug">
                <p><strong>Responsable:</strong> Portal Trabajo IT.</p>
                <p><strong>Finalidad:</strong> {isEnglish ? 'Sending streak reminder alerts.' : 'Envío de recordatorio de mantenimiento de racha.'}</p>
                <p><strong>Legitimación:</strong> {isEnglish ? 'Express consent (Art. 6.1.a GDPR).' : 'Consentimiento expreso (Art. 6.1.a RGPD).'}</p>
                <p><strong>Derechos:</strong> <a href="mailto:contacto@portalempleoit.com" className="underline">contacto@portalempleoit.com</a> (<Link href="/privacy" className="underline">{isEnglish ? 'Privacy Policy' : 'Privacidad'}</Link>).</p>
              </div>

              {emailError && <p className="text-[13px] text-[var(--status-danger)] mt-2">{emailError}</p>}
            </div>
          ) : (
            <div className="border-t border-[var(--border-subtle)] pt-4 text-[14px] text-[var(--status-emerald)] font-medium">
              {isEnglish ? 'Reminder activated.' : 'Recordatorio activado correctamente.'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label={isEnglish ? `Current visit streak: ${streak} days` : `Racha de visitas actual: ${streak} días`}
        className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] font-mono text-[13px] font-medium tabular-nums text-[var(--text-primary)] ui-btn-press cursor-pointer select-none whitespace-nowrap"
        title={isEnglish ? 'Your visit streak' : 'Tu racha de visitas'}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
        <span>{streak} {isEnglish ? 'd' : 'días'}</span>
      </button>

      {mounted && typeof document !== 'undefined'
        ? createPortal(renderModal(), document.body)
        : null}
    </>
  );
}
