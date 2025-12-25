"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [location, setLocation] = useState(searchParams?.get("location") || "");

  // --- MAGIA AQUÍ: Búsqueda automática al escribir/borrar ---
  useEffect(() => {
    // Creamos un temporizador de 300ms
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (query.trim()) params.set("q", query);
      if (location.trim()) params.set("location", location);

      // Actualizamos la URL (esto lanza la búsqueda en el servidor)
      replace(`/?${params.toString()}`);
    }, 300); // Espera 300ms después de que dejes de escribir

    // Si sigues escribiendo, cancelamos el temporizador anterior
    return () => clearTimeout(timer);
  }, [query, location, replace]); // Se ejecuta cada vez que cambias query o location

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qué buscas</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Python..."
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {/* Botón X para borrar rápido */}
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dónde</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Madrid..."
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {location && (
              <button 
                onClick={() => setLocation("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
