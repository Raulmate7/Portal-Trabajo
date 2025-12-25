"use client"; // Esto es obligatorio para botones interactivos

import { useState } from "react";

export default function ShareButton({ title, company }: { title: string, company: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Si es un móvil, abrimos el menú nativo de compartir
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Oferta: ${title}`,
          text: `Mira esta oferta de trabajo en ${company}`,
          url: window.location.href,
        });
      } catch (err) {
        // Si el usuario cancela, no pasa nada
      }
    } else {
      // Si es un PC, copiamos al portapapeles
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Error al copiar", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${copied 
          ? "bg-green-100 text-green-700 border border-green-200" 
          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }
      `}
    >
      {copied ? (
        <>✅ Enlace copiado</>
      ) : (
        <>
          📤 Compartir oferta
        </>
      )}
    </button>
  );
}
