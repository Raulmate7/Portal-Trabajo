"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";

const TECH_OPTIONS = ["React", "Node.js", "Python", "Java", "DevOps", "TypeScript", "JavaScript", "Flutter", "Angular", "Vue", "AWS", "Docker", "Kubernetes", "PHP", "C#", "SQL", "Android", "iOS"];
const LOC_OPTIONS = ["Remoto", "Híbrido", "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Zaragoza", "Bilbao"];

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const [location, setLocation] = useState(searchParams?.get("location") || "");
  const [modality, setModality] = useState(searchParams?.get("modality") || "");
  const [experience, setExperience] = useState(searchParams?.get("experience") || "");
  const [minSalary, setMinSalary] = useState(searchParams?.get("min_salary") || "");
  const [dateRange, setDateRange] = useState(searchParams?.get("date_range") || "");
  const [withSalary, setWithSalary] = useState(searchParams?.get("with_salary") === "1");
  const [sort, setSort] = useState(searchParams?.get("sort") || "recent");

  const [showTechSuggestions, setShowTechSuggestions] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const techRef = useRef<HTMLDivElement>(null);
  const locRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (techRef.current && !techRef.current.contains(event.target as Node)) {
        setShowTechSuggestions(false);
      }
      if (locRef.current && !locRef.current.contains(event.target as Node)) {
        setShowLocSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      if (withSalary) params.set("with_salary", "1");
      if (sort && sort !== "recent") params.set("sort", sort);

      const lang = searchParams?.get("lang");
      if (lang === "en") params.set("lang", "en");

      startTransition(() => {
        replace(`/?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [query, location, modality, experience, minSalary, dateRange, withSalary, sort, replace, searchParams]);

  // Limpiar todos los filtros
  const clearFilters = () => {
    setQuery("");
    setLocation("");
    setModality("");
    setExperience("");
    setMinSalary("");
    setDateRange("");
    setWithSalary(false);
    setSort("recent");
    const params = new URLSearchParams();
    const lang = searchParams?.get("lang");
    if (lang === "en") params.set("lang", "en");
    startTransition(() => {
      replace(`/?${params.toString()}`);
    });
  };

  const hasActiveFilters = !!query || !!location || !!modality || !!experience || !!minSalary || !!dateRange || withSalary || sort !== "recent";

  const filteredTech = TECH_OPTIONS.filter(t => t.toLowerCase().includes(query.toLowerCase()));
  const filteredLoc = LOC_OPTIONS.filter(l => l.toLowerCase().includes(location.toLowerCase()));

  return (
    <div role="search" className="ui-card rounded-xl p-3 sm:p-4">
      {/* BARRA UNIFICADA SPOTLIGHT / COMMAND-BAR */}
      <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)] focus-within:border-[var(--border-accent)] focus-within:ring-2 focus-within:ring-[var(--accent-tint)] transition-[border-color,box-shadow] duration-150">
        {/* BUSCADOR */}
        <div className="flex-1 relative" ref={techRef}>
          <label htmlFor="search-tech-input" className="sr-only">
            ¿Qué cargo o tecnología buscas?
          </label>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
          </span>
          <input
            id="search-tech-input"
            ref={searchInputRef}
            type="text"
            placeholder="Cargo, stack o empresa (React, Go, Python...)"
            className="w-full pl-10 pr-12 py-2.5 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowTechSuggestions(true);
            }}
            onFocus={() => setShowTechSuggestions(true)}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--status-danger)] p-1 rounded cursor-pointer transition-colors"
              title="Borrar"
              aria-label="Borrar búsqueda"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="hidden sm:inline-flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded pointer-events-none"
            >
              /
            </kbd>
          )}
          {showTechSuggestions && filteredTech.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1.5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg shadow-[var(--shadow-card-hover)] max-h-48 overflow-y-auto py-1">
              {filteredTech.map(tech => (
                <li
                  key={tech}
                  className="px-3.5 py-1.5 hover:bg-[var(--bg-subtle)] cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono transition-colors"
                  onMouseDown={() => {
                    setQuery(tech);
                    setShowTechSuggestions(false);
                  }}
                >
                  {tech}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* UBICACIÓN */}
        <div className="flex-1 md:max-w-xs relative" ref={locRef}>
          <label htmlFor="search-loc-input" className="sr-only">
            ¿En qué ciudad o provincia?
          </label>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.25" strokeWidth="1.75" />
            </svg>
          </span>
          <input
            id="search-loc-input"
            type="text"
            placeholder="Madrid, Barcelona, Remoto..."
            className="w-full pl-10 pr-9 py-2.5 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setShowLocSuggestions(true);
            }}
            onFocus={() => setShowLocSuggestions(true)}
          />
          {location && (
            <button
              type="button"
              onClick={() => setLocation("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--status-danger)] p-1 rounded cursor-pointer transition-colors"
              title="Borrar"
              aria-label="Borrar ubicación"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {showLocSuggestions && filteredLoc.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1.5 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg shadow-[var(--shadow-card-hover)] max-h-48 overflow-y-auto py-1">
              {filteredLoc.map(loc => (
                <li
                  key={loc}
                  className="px-3.5 py-1.5 hover:bg-[var(--bg-subtle)] cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  onMouseDown={() => {
                    setLocation(loc);
                    setShowLocSuggestions(false);
                  }}
                >
                  {loc}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* FILTROS AVANZADOS EXPANDIBLES */}
      {showAdvanced && (
        <div className="mt-3.5 pt-3.5 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* MODALIDAD */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wider">Modalidad</label>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] outline-none bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors text-sm cursor-pointer"
            >
              <option value="">Cualquier modalidad</option>
              <option value="remoto">100% Teletrabajo</option>
              <option value="hibrido">Híbrido / Mixto</option>
              <option value="presencial">Oficina / Presencial</option>
            </select>
          </div>

          {/* EXPERIENCIA */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wider">Experiencia</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] outline-none bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors text-sm cursor-pointer"
            >
              <option value="">Cualquier experiencia</option>
              <option value="junior">Junior (0 - 2 años)</option>
              <option value="mid">Mid-level (2 - 5 años)</option>
              <option value="senior">Senior / Lead (5+ años)</option>
            </select>
          </div>

          {/* RANGO SALARIAL */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wider">Salario Mínimo</label>
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] outline-none bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors text-sm cursor-pointer"
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
            <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wider">Publicación</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] outline-none bg-[var(--bg-subtle)] text-[var(--text-primary)] transition-colors text-sm cursor-pointer"
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
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
        {/* Sugerencias rápidas (Chips) */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-mono text-[var(--text-muted)] mr-1">Stack:</span>
          {["React", "Node", "Python", "DevOps"].map((tech) => {
            const isActive = query.toLowerCase() === tech.toLowerCase();
            return (
              <button
                key={tech}
                onClick={() => setQuery(query === tech ? "" : tech)}
                type="button"
                className={`ui-btn-press px-2.5 py-1 rounded-md border font-mono text-[11px] font-medium transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                    : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {tech}
              </button>
            );
          })}
          <div className="h-3.5 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block" />
          <button
            onClick={() => setModality(modality === "remoto" ? "" : "remoto")}
            type="button"
            className={`ui-btn-press inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[11px] font-medium transition-colors duration-150 cursor-pointer ${
              modality === "remoto"
                ? "bg-[var(--status-emerald-tint)] border-[var(--status-emerald)] text-[var(--status-emerald)]"
                : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-emerald)]" aria-hidden="true" />
            Remoto
          </button>
          <button
            onClick={() => setWithSalary(!withSalary)}
            type="button"
            className={`ui-btn-press inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-mono text-[11px] font-medium transition-colors duration-150 cursor-pointer ${
              withSalary
                ? "bg-[var(--status-emerald-tint)] border-[var(--status-emerald)] text-[var(--status-emerald)]"
                : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            }`}
          >
            💶 Con sueldo
          </button>
          {isPending && (
            <span className="text-[11px] font-mono text-[var(--text-muted)] ml-1" aria-live="polite">
              Filtrando…
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <select
            aria-label="Ordenar ofertas"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-2 py-1 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-xs font-medium outline-none focus:border-[var(--border-accent)] cursor-pointer"
          >
            <option value="recent">Más recientes</option>
            <option value="salary">Mayor salario</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-[var(--status-danger)] hover:underline transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-150 ${showAdvanced ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span>{showAdvanced ? "Ocultar filtros" : "Filtros avanzados"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
