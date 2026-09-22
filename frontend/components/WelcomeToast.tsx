'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WelcomeToast() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verificar si es la primera visita (no existe el flag en localStorage)
    const isFirstVisit = !localStorage.getItem('has_visited_before');
    
    if (isFirstVisit) {
      // Mostrar después de 3 segundos
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
    <div className="fixed bottom-6 left-6 z-[85] max-w-sm w-full bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-left duration-500">
      <button 
        onClick={handleClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        aria-label="Cerrar bienvenida"
      >
        ✕
      </button>
      
      <div className="flex items-start gap-4 mb-4">
        <span className="text-3xl mt-1">👋</span>
        <div>
          <h4 className="font-black text-gray-900 dark:text-white mb-1">¡Bienvenido a PortalEmpleo IT!</h4>
          <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
            Parece que es tu primera vez por aquí. Sácale el máximo partido al portal con estos 3 pasos rápidos:
          </p>
        </div>
      </div>

      <ul className="space-y-3 mb-5">
        <li className="flex items-start gap-3">
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
          <p className="text-xs text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Crea tu alerta:</strong> Usa el formulario lateral para recibir ofertas en tu correo.</p>
        </li>
        <li className="flex items-start gap-3">
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
          <p className="text-xs text-gray-700 dark:text-slate-300">
            <Link href="/salarios" onClick={handleClose} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">Calcula tu salario ideal</Link> para saber si estás cobrando lo justo en el mercado actual.
          </p>
        </li>
        <li className="flex items-start gap-3">
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
          <p className="text-xs text-gray-700 dark:text-slate-300"><strong className="text-gray-900 dark:text-white">Guarda ofertas:</strong> Usa el icono de guardar en cualquier oferta para no perderla de vista.</p>
        </li>
      </ul>

      <button 
        onClick={handleClose}
        className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
      >
        ¡Entendido, vamos allá! 🚀
      </button>
    </div>
  );
}
