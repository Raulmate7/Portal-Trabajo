'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface StreakData {
  lastVisitDate: string;
  count: number;
}

export default function UserStreak({ lang = 'es' }: { lang?: string }) {
  const isEnglish = lang === 'en';
  const [streak, setStreak] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storageKey = 'portal_streak_data';
      const raw = localStorage.getItem(storageKey);
      
      const now = new Date();
      // Formato YYYY-MM-DD en hora local
      const offset = now.getTimezoneOffset();
      const localNow = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localNow.toISOString().split('T')[0];
      
      let data: StreakData = raw ? JSON.parse(raw) : { lastVisitDate: '', count: 0 };
      
      if (!data.lastVisitDate) {
        // Primera visita
        data = { lastVisitDate: todayStr, count: 1 };
      } else {
        const lastDate = new Date(data.lastVisitDate);
        const todayDate = new Date(todayStr);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Visita al día siguiente
          data = { lastVisitDate: todayStr, count: data.count + 1 };
        } else if (diffDays > 1) {
          // Racha perdida, reiniciar
          data = { lastVisitDate: todayStr, count: 1 };
        } else {
          // Misma fecha, mantener
          data.lastVisitDate = todayStr; 
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(data));
      setStreak(data.count);
    } catch (error) {
      console.error('Error tracking user streak:', error);
    }
  }, []);

  if (streak === 0) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black transition-all cursor-pointer select-none active:scale-95 animate-fade-in"
        title={isEnglish ? 'Your visit streak!' : '¡Tu racha de visitas!'}
      >
        <span>🔥</span>
        <span>{streak} {isEnglish ? 'days' : 'días'}</span>
      </button>

      {/* MODAL DE RECOMPENSA DE RACHA */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full border border-gray-100 dark:border-slate-800 text-center shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>

            <span className="text-6xl block mb-4 animate-pulse">🔥</span>
            
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isEnglish ? `Visiting streak: ${streak} days!` : `¡Racha de visitas: ${streak} días!`}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2.5 leading-relaxed">
              {isEnglish 
                ? 'Great! Keep up the daily streak to stay fully updated with the latest IT job openings and tech trends.'
                : '¡Excelente! Mantén la racha diaria para estar al tanto de las ofertas de programación más recientes y tendencias del sector.'}
            </p>

            {streak >= 3 ? (
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">🎁 ¡Premio Desbloqueado!</span>
                <p className="text-xs text-gray-600 dark:text-slate-350 leading-relaxed mb-3">
                  {isEnglish 
                    ? 'You have unlocked free access to our IT Salary Guide 2026.'
                    : 'Has desbloqueado el acceso gratuito para descargar nuestra Guía Salarial IT 2026.'}
                </p>
                <Link
                  href="/salarios"
                  onClick={() => setShowModal(false)}
                  className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {isEnglish ? 'Download Guide 📁' : 'Descargar Guía 📁'}
                </Link>
              </div>
            ) : (
              <div className="mt-5 text-xs text-gray-450 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800/80 pt-4">
                {isEnglish
                  ? `Reach a 3-day streak to unlock our IT Salary Guide (Current: ${streak}/3)`
                  : `Llega a 3 días de racha para descargar la Guía Salarial IT (Actual: ${streak}/3)`}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
