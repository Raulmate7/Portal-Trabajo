"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  // Leemos los valores actuales de la URL
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  // Función para actualizar la URL sin recargar la página
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (location) {
      params.set("location", location);
    } else {
      params.delete("location");
    }

    replace(`/?${params.toString()}`);
  };

  // Permite buscar al pulsar ENTER
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Input Buscador (Python, Java...) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Palabra clave</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Python, Junior, React..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Input Ubicación */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Madrid, Remoto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">📍</span>
          </div>
        </div>

        {/* Botón Buscar */}
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
