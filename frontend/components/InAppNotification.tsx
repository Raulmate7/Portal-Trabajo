"use client";
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

    // Solo comprobar una vez por sesión
    if (sessionStorage.getItem('fresh_alerts_shown') === 'true') return;

    const timer = setTimeout(async () => {
      const rawKws = localStorage.getItem('subscriber_tech_keywords');
      if (!rawKws) return;

      const kws = rawKws.split(',').map(k => k.trim()).filter(Boolean);
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
    }, 15000); // 15 segundos después de cargar la página (más rápido para propósitos de demostración/tests, pero retrasado lo suficiente para no interrumpir)

    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !showToast) return null;

  // Enlace a la sección filtrada
  const searchUrl = `/trabajos/informatica-tecnologia`;

  return (
    <div className="fixed bottom-6 left-6 z-[85] max-w-sm w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl animate-in slide-in-from-left duration-300 flex items-start gap-3">
      <span className="text-2xl mt-0.5 shrink-0">🔥</span>
      
      <div className="flex-grow space-y-1">
        <h4 className="font-bold text-xs text-white uppercase tracking-wider">¡Nuevas Ofertas Detectadas!</h4>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Hay <strong>{freshCount}</strong> vacantes nuevas de <strong>{techList}</strong> publicadas en las últimas 2 horas.
        </p>
        <div className="pt-2 flex items-center gap-2">
          <Link
            href={searchUrl}
            onClick={() => setShowToast(false)}
            className="inline-block py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-colors"
          >
            Ver ofertas ya →
          </Link>
          <button
            onClick={() => setShowToast(false)}
            className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors py-1 px-2"
          >
            Descartar
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => setShowToast(false)}
        className="text-slate-500 hover:text-white font-bold text-xs shrink-0 cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
