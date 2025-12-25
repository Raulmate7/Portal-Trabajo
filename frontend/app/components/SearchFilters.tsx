"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  // Usamos useEffect para leer la URL solo cuando el componente ya está montado
  useEffect(() => {
    if (searchParams) {
      setQuery(searchParams.get("q") || "");
      setLocation(searchParams.get("location") || "");
    }
  }, [searchParams]);

  const handleSearch = () => {
    // Creamos los params basados en la URL actual, no vacíos
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    
    if (query.trim()) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (location.trim()) {
      params.set("location", location);
    } else {
      params.delete("location");
    }

    replace(`/?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qué buscas</label>
          <input
            type="text"
            placeholder="Ej: Python..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dónde</label>
          <input
            type="text"
            placeholder="Ej: Madrid..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
