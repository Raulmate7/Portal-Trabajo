'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AISearchBar() {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      setRecentSearches(saved);
    } catch (e) {}

    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent, directQuery?: string) => {
    e.preventDefault();
    const q = (directQuery || query).trim();
    if (!q) return;

    // Guardar búsqueda
    const updatedSearches = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updatedSearches);
    try {
      localStorage.setItem('recent_searches', JSON.stringify(updatedSearches));
    } catch (e) {}

    setIsFocused(false);

    startTransition(() => {
      const qLower = q.toLowerCase();

      // FUNC-009: Tabla declarativa ordenada por especificidad con límites de palabra (\b)
      const TECH_PATTERNS: Array<{ slug: string; regex: RegExp }> = [
        { slug: 'typescript', regex: /\btypescript\b/i },
        { slug: 'javascript', regex: /\bjavascript\b/i },
        { slug: 'kubernetes', regex: /\bkubernetes\b|\bk8s\b/i },
        { slug: 'python', regex: /\bpython\b/i },
        { slug: 'devops', regex: /\bdevops\b|\bsre\b/i },
        { slug: 'angular', regex: /\bangular\b/i },
        { slug: 'react', regex: /\breact(?:\.?js)?\b/i },
        { slug: 'node', regex: /\bnode(?:\.?js)?\b/i },
        { slug: 'java', regex: /\bjava\b/i },
        { slug: 'aws', regex: /\baws\b/i },
        { slug: 'docker', regex: /\bdocker\b/i },
        { slug: 'vue', regex: /\bvue(?:\.?js)?\b/i },
        { slug: 'golang', regex: /\bgolang\b|\bgo\b/i },
      ];

      const CITY_PATTERNS: Array<{ slug: string; regex: RegExp }> = [
        { slug: 'madrid', regex: /\bmadrid\b/i },
        { slug: 'barcelona', regex: /\bbarcelona\b/i },
        { slug: 'valencia', regex: /\bvalencia\b/i },
        { slug: 'sevilla', regex: /\bsevilla\b/i },
        { slug: 'bilbao', regex: /\bbilbao\b/i },
        { slug: 'malaga', regex: /\bm[aá]laga\b/i },
        { slug: 'remoto', regex: /\bremoto\b|\bteletrabajo\b|\bremote\b/i },
      ];

      const tech = TECH_PATTERNS.find((t) => t.regex.test(qLower))?.slug || '';
      const city = CITY_PATTERNS.find((c) => c.regex.test(qLower))?.slug || '';

      let salary = '';
      if (/\b(50k|50\.000)\b/i.test(qLower)) salary = 'salario-mas-de-50k';
      else if (/\b(40k|40\.000)\b/i.test(qLower)) salary = 'salario-mas-de-40k';
      else if (/\b(30k|30\.000)\b/i.test(qLower)) salary = 'salario-mas-de-30k';

      let targetPath = `/?q=${encodeURIComponent(q)}`;
      if (tech) {
        const parts = [tech];
        if (salary) parts.push(salary);
        if (city) {
          parts.push(city === 'remoto' ? 'remoto' : `en-${city}`);
        }
        targetPath = `/trabajos/${parts.join('-')}`;
      } else if (city) {
        targetPath = city === 'remoto' ? '/trabajo-remoto' : `/trabajo-${city}`;
      }

      router.push(targetPath);
    });
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  return (
    <form ref={formRef} onSubmit={(e) => handleSearch(e)} className="w-full max-w-2xl mx-auto my-4 relative">
      <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-indigo-100 p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all z-20">
        <span className="pl-3 text-xl">✨</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Búsqueda rápida asistida: ej. 'React en Madrid con más de 40k'..."
          aria-label="Buscar empleo por tecnología, ciudad o salario"
          title="Filtrado semántico y directo de tecnologías, ciudades y rangos salariales"
          className="w-full px-3 py-2 text-sm text-gray-900 focus:outline-none bg-transparent placeholder-gray-400 font-medium"
        />
        <button
          type="submit"
          disabled={isPending}
          title="Ejecutar filtrado asistido de ofertas"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
        >
          {isPending ? 'Buscando...' : 'Búsqueda Rápida →'}
        </button>
      </div>
      <div className="flex justify-between items-center px-3 pt-1 text-[10px] text-gray-400">
        <span>✨ Detección automática de tecnología, ubicación y rango salarial por filtrado directo.</span>
      </div>

      {/* Dropdown de Búsquedas Recientes */}
      {isFocused && recentSearches.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Búsquedas Recientes</span>
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Borrar
            </button>
          </div>
          <ul className="py-1">
            {recentSearches.map((s, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-gray-700 flex items-center gap-2 transition-colors"
                  onClick={(e) => {
                    setQuery(s);
                    handleSearch(e, s);
                  }}
                >
                  <span className="text-gray-400">🕒</span>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
