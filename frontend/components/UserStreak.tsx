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
  3:  { label: '🎁 3 días',  reward: 'Guía Salarial IT 2026 gratis',       href: '/salarios' },
  7:  { label: '🏆 7 días',  reward: 'Acceso a tendencias de empleo tech', href: '/tendencias' },
  30: { label: '💎 30 días', reward: 'Badge Premium de candidato experto',  href: '/talento-premium' },
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

function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '💎';
  if (streak >= 7) return '🏆';
  if (streak >= 3) return '🔥';
  return '🔥';
}

export default function UserStreak({ lang = 'es' }: { lang?: string }) {
  const isEnglish = lang === 'en';
  const [streak, setStreak] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setMounted(true);
    try {
      const storageKey = 'portal_streak_data';
      const raw = localStorage.getItem(storageKey);

      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localNow = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localNow.toISOString().split('T')[0];

      let data: StreakData = raw ? JSON.parse(raw) : { lastVisitDate: '', count: 0 };

      if (!data.lastVisitDate) {
        data = { lastVisitDate: todayStr, count: 1 };
      } else {
        const lastDate = new Date(data.lastVisitDate);
        const todayDate = new Date(todayStr);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          data = { ...data, lastVisitDate: todayStr, count: data.count + 1 };
          // Si se llegó a un hito exacto, mostrar el modal automáticamente
          if ([3, 7, 30].includes(data.count)) {
            setTimeout(() => setShowModal(true), 800);
          }
        } else if (diffDays > 1) {
          data = { ...data, lastVisitDate: todayStr, count: 1 };
        } else {
          data.lastVisitDate = todayStr;
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(data));
      setStreak(data.count);
      if (data.emailCaptured) setEmailSaved(true);
    } catch (error) {
      console.error('Error tracking user streak:', error);
    }
  }, []);

  const handleSaveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Introduce un email válido para recibir el recordatorio.');
      return;
    }
    setEmailError('');
    try {
      // Guardar en localStorage para el recordatorio visual
      const storageKey = 'portal_streak_data';
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        data.emailCaptured = trimmed;
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      // Suscribir también al newsletter si no está ya (silent)
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'streak_reminder' }),
      });
      setEmailSaved(true);
    } catch {
      setEmailSaved(true); // Guardar en local al menos
    }
  };

  if (streak === 0) return null;

  const milestoneReached = getMilestoneReached(streak);
  const nextMilestone = getNextMilestone(streak);
  const emoji = getStreakEmoji(streak);

  const renderModal = () => {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full border border-gray-100 dark:border-slate-800 text-center shadow-2xl relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold cursor-pointer text-lg leading-none"
          >
            ✕
          </button>

          <span className="text-6xl block mb-3 animate-bounce">{emoji}</span>

          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
            {isEnglish ? `${streak}-day streak!` : `¡${streak} días de racha!`}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed mb-4">
            {isEnglish
              ? 'Keep up the daily streak to stay fully updated with the latest IT jobs and tech trends.'
              : 'Mantén la racha diaria para estar al tanto de las mejores ofertas IT y tendencias del sector.'}
          </p>

          {/* Hito actual */}
          {milestoneReached && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-center">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                {milestoneReached.data.label} — ¡Premio Desbloqueado!
              </span>
              <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                {isEnglish ? 'You unlocked: ' : 'Has desbloqueado: '}<strong>{milestoneReached.data.reward}</strong>
              </p>
              <Link
                href={milestoneReached.data.href}
                onClick={() => setShowModal(false)}
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {isEnglish ? 'Claim reward 🎁' : 'Reclamar Premio 🎁'}
              </Link>
            </div>
          )}

          {/* Progreso hacia el siguiente hito */}
          {nextMilestone > streak && (
            <div className="mb-5 text-xs text-gray-500 dark:text-slate-500">
              <div className="flex justify-between mb-1 font-semibold">
                <span>{isEnglish ? `Current: ${streak} days` : `Actual: ${streak} días`}</span>
                <span>{isEnglish ? `Next: ${nextMilestone} days` : `Siguiente: ${nextMilestone} días`}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (streak / nextMilestone) * 100)}%` }}
                />
              </div>
              <p className="mt-2">
                {isEnglish
                  ? `${nextMilestone - streak} more days to unlock ${MILESTONE_REWARDS[nextMilestone]?.reward || 'the next reward'}`
                  : `${nextMilestone - streak} días más para desbloquear: ${MILESTONE_REWARDS[nextMilestone]?.reward || 'el siguiente premio'}`}
              </p>
            </div>
          )}

          {/* Captura de email para recordatorio */}
          {!emailSaved ? (
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
              <p className="text-xs text-gray-500 dark:text-slate-500 mb-3 font-semibold">
                {isEnglish ? '⏰ Get a reminder if you\'re about to lose your streak:' : '⏰ Recibe un aviso si estás a punto de perder la racha:'}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                  placeholder={isEnglish ? 'your@email.com' : 'tu@email.com'}
                  className="flex-1 text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={handleSaveEmail}
                  className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  {isEnglish ? 'Save' : 'Guardar'}
                </button>
              </div>
              {emailError && <p className="text-xs text-rose-600 mt-1.5">{emailError}</p>}
            </div>
          ) : (
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 text-xs text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-1.5">
              ✅ {isEnglish ? 'Reminder activated! We\'ll alert you before your streak breaks.' : '¡Recordatorio activado! Te avisaremos antes de que pierdas la racha.'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer select-none active:scale-95 animate-fade-in ${
          streak >= 30
            ? 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 text-violet-600 dark:text-violet-400'
            : streak >= 7
            ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-600 dark:text-blue-400'
            : 'bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400'
        }`}
        title={isEnglish ? 'Your visit streak!' : '¡Tu racha de visitas!'}
      >
        <span>{emoji}</span>
        <span>{streak} {isEnglish ? 'days' : 'días'}</span>
      </button>

      {mounted && typeof document !== 'undefined'
        ? createPortal(renderModal(), document.body)
        : null}
    </>
  );
}
