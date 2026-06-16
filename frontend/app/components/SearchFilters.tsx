"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [location, setLocation] = useState(searchParams?.get("location") || "");

  // BÚSQUEDA AUTOMÁTICA (DEBOUNCE)
  // Se ejecuta cada vez que 'query' o 'location' cambian
  useEffect(() => {
    // Espera 300ms a que termines de escribir o borrar
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (query.trim()) params.set("q", query);
      if (location.trim()) params.set("location", location);

      replace(`/?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, location, replace]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        {/* BUSCADOR */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qué buscas</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Python..."
              list="tech-suggestions"
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-red-600 font-bold px-2"
                title="Borrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* UBICACIÓN */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dónde</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Madrid..."
              list="location-suggestions"
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {location && (
              <button 
                onClick={() => setLocation("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-red-600 font-bold px-2"
                title="Borrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CHIPS DE BÚSQUEDA RÁPIDA */}
      <div className="mt-4 flex flex-wrap gap-2 items-center text-xs text-gray-500">
        <span className="font-semibold text-gray-400 mr-1">Sugerencias:</span>
        {["React", "Node", "Python", "Java", "DevOps"].map((tech) => {
          const isActive = query.toLowerCase() === tech.toLowerCase();
          return (
            <button
              key={tech}
              onClick={() => setQuery(query === tech ? "" : tech)}
              type="button"
              className={`px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
                isActive
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm font-semibold scale-105"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 active:scale-95"
              }`}
            >
              {tech}
            </button>
          );
        })}
        <div className="h-4 w-px bg-gray-200 mx-1 hidden md:block" />
        {[
          { label: "📍 Remoto", value: "Remoto" },
          { label: "📍 Madrid", value: "Madrid" },
          { label: "📍 Barcelona", value: "Barcelona" }
        ].map((loc) => {
          const isActive = location.toLowerCase() === loc.value.toLowerCase();
          return (
            <button
              key={loc.value}
              onClick={() => setLocation(location === loc.value ? "" : loc.value)}
              type="button"
              className={`px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
                isActive
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm font-semibold scale-105"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 active:scale-95"
              }`}
            >
              {loc.label}
            </button>
          );
        })}
      </div>

      {/* Sugerencias de Autocompletado */}
      <datalist id="tech-suggestions">
        <option value="React" />
        <option value="Node.js" />
        <option value="Python" />
        <option value="Java" />
        <option value="DevOps" />
        <option value="TypeScript" />
        <option value="JavaScript" />
        <option value="Flutter" />
        <option value="Angular" />
        <option value="Vue" />
        <option value="AWS" />
        <option value="Docker" />
        <option value="Kubernetes" />
        <option value="PHP" />
        <option value="C#" />
        <option value="SQL" />
        <option value="Android" />
        <option value="iOS" />
      </datalist>

      <datalist id="location-suggestions">
        <option value="Remoto" />
        <option value="Híbrido" />
        <option value="Madrid" />
        <option value="Barcelona" />
        <option value="Valencia" />
        <option value="Sevilla" />
        <option value="Málaga" />
        <option value="Zaragoza" />
        <option value="Bilbao" />
      </datalist>
    </div>
  );
}
