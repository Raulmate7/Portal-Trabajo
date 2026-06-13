"use client"; // Esto es obligatorio para botones interactivos

import { useState } from "react";

export default function ShareButton({ title, company }: { title: string, company: string }) {
  const [copied, setCopied] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleShare = async () => {
    // Si es un móvil, abrimos el menú nativo de compartir
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Oferta: ${title}`,
          text: `Mira esta oferta de trabajo en ${company}`,
          url: window.location.href,
        });
        setUnlocked(true);
        setShowPopup(true);
      } catch (err) {
        // Si el usuario cancela, no pasa nada
      }
    } else {
      // Si es un PC, copiamos al portapapeles
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setUnlocked(true);
        setShowPopup(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Error al copiar", err);
      }
    }
  };

  return (
    <div className="relative inline-block text-right">
      <button
        onClick={handleShare}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer text-sm
          ${copied 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm" 
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:scale-98"
          }
        `}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>¡Enlace copiado!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l4.885 2.502M9.62 17.518l4.885-2.502m-7.228-2.33a3 3 0 110-6 3 3 0 010 6zm8.8 5.48a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            <span>Compartir oferta</span>
          </>
        )}
      </button>

      {unlocked && showPopup && (
        <div className="absolute right-0 mt-3 z-50 w-80 sm:w-96 bg-white border border-gray-100 rounded-xl p-5 shadow-2xl text-left transition-all duration-300 ease-out transform scale-100 origin-top-right">
          {/* Botón de cerrar */}
          <button 
            onClick={() => setShowPopup(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badge Regalo */}
          <div className="inline-flex items-center gap-1 text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 mb-3">
            🎁 Regalo de Referido Desbloqueado
          </div>

          <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5">
            ¡Muchas gracias por compartir! 🚀
          </h4>
          
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Como agradecimiento, te regalamos nuestra <strong>Plantilla de CV Profesional de Alto Impacto</strong> (ATS-friendly) optimizada para programadores y perfiles IT.
          </p>

          <div className="bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-100 rounded-lg p-3.5 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-lg shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-800 truncate">Plantilla CV IT Premium</p>
                <p className="text-[10px] text-gray-500">Google Docs / Formato Editable</p>
              </div>
            </div>
          </div>

          <a
            href="https://docs.google.com/document/d/1v3H3X3Q5m_88n-s4Y23V8k4Y23V/copy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors duration-150 shadow-sm"
          >
            <span>Crear copia en Google Docs</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

