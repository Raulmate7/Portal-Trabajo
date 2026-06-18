"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [location, setLocation] = useState(searchParams?.get("location") || "");
  const [modality, setModality] = useState(searchParams?.get("modality") || "");
  const [experience, setExperience] = useState(searchParams?.get("experience") || "");
  const [minSalary, setMinSalary] = useState(searchParams?.get("min_salary") || "");
  const [dateRange, setDateRange] = useState(searchParams?.get("date_range") || "");

  const [showAdvanced, setShowAdvanced] = useState(
    !!searchParams?.get("modality") || 
    !!searchParams?.get("experience") || 
    !!searchParams?.get("min_salary") || 
    !!searchParams?.get("date_range")
  );

  // BÚSQUEDA AUTOMÁTICA CON DEBOUNCE (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (query.trim()) params.set("q", query);
      if (location.trim()) params.set("location", location);
      if (modality) params.set("modality", modality);
      if (experience) params.set("experience", experience);
      if (minSalary) params.set("min_salary", minSalary);
      if (dateRange) params.set("date_range", dateRange);

      const lang = searchParams?.get("lang");
      if (lang === "en") params.set("lang", "en");

      replace(`/?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, location, modality, experience, minSalary, dateRange, replace, searchParams]);

  // Limpiar todos los filtros
  const clearFilters = () => {
    setQuery("");
    setLocation("");
    setModality("");
    setExperience("");
    setMinSalary("");
    setDateRange("");
    const params = new URLSearchParams();
    const lang = searchParams?.get("lang");
    if (lang === "en") params.set("lang", "en");
    replace(`/?${params.toString()}`);
  };

  const hasActiveFilters = !!query || !!location || !!modality || !!experience || !!minSalary || !!dateRange;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800/80 transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        {/* BUSCADOR */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">¿Qué cargo o tecnología buscas?</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Ej: React, Node, Python, C#..."
              list="tech-suggestions"
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white transition-all text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-red-500 font-bold px-1.5 cursor-pointer text-xs"
                title="Borrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* UBICACIÓN */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">¿En qué ciudad o provincia?</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">📍</span>
            <input
              type="text"
              placeholder="Ej: Madrid, Barcelona, Remoto..."
              list="location-suggestions"
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white transition-all text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {location && (
              <button 
                onClick={() => setLocation("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-red-500 font-bold px-1.5 cursor-pointer text-xs"
                title="Borrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS AVANZADOS EXPANDIBLES */}
      {showAdvanced && (
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          
          {/* MODALIDAD */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">Modalidad</label>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white transition-all text-sm cursor-pointer"
            >
              <option value="">Cualquier modalidad</option>
              <option value="remoto">🌐 100% Teletrabajo</option>
              <option value="hibrido">🏢 Híbrido / Mixto</option>
              <option value="presencial">📍 Oficina / Presencial</option>
            </select>
          </div>

          {/* EXPERIENCIA */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">Experiencia</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white transition-all text-sm cursor-pointer"
            >
              <option value="">Cualquier experiencia</option>
              <option value="junior">🌱 Junior (0 - 2 años)</option>
              <option value="mid">⚖️ Mid-level (2 - 5 años)</option>
              <option value="senior">🏆 Senior / Lead (5+ años)</option>
            </select>
          </div>

          {/* RANGO SALARIAL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">Salario Mínimo</label>
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white transition-all text-sm cursor-pointer"
            >
              <option value="">Cualquier salario</option>
              <option value="20000">Más de 20.000€</option>
              <option value="30000">Más de 30.000€</option>
              <option value="40000">Más de 40.000€</option>
              <option value="50000">Más de 50.000€</option>
              <option value="60000">Más de 60.000€</option>
            </select>
          </div>

          {/* FECHA DE PUBLICACIÓN */}
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-slate-550 uppercase mb-1.5 tracking-wider">Fecha de Publicación</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white transition-all text-sm cursor-pointer"
            >
              <option value="">Cualquier fecha</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>

        </div>
      )}

      {/* ACCIONES Y CHIPS */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100 dark:border-slate-800/60 pt-4">
        {/* Sugerencias rápidas (Chips) */}
        <div className="flex flex-wrap gap-1.5 items-center text-xs">
          <span className="font-semibold text-gray-400 mr-1">Rápido:</span>
          {["React", "Node", "Python", "DevOps"].map((tech) => {
            const isActive = query.toLowerCase() === tech.toLowerCase();
            return (
              <button
                key={tech}
                onClick={() => setQuery(query === tech ? "" : tech)}
                type="button"
                className={`px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {tech}
              </button>
            );
          })}
          <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 mx-1 hidden sm:block" />
          <button
            onClick={() => setModality(modality === "remoto" ? "" : "remoto")}
            type="button"
            className={`px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer ${
              modality === "remoto"
                ? "bg-emerald-600 border-emerald-500 text-white font-semibold shadow-sm"
                : "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            🌐 Remoto
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-red-500 hover:text-red-650 transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showAdvanced ? "▲ Ocultar" : "▼ Más"}</span>
            <span>filtros avanzados</span>
          </button>
        </div>
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
