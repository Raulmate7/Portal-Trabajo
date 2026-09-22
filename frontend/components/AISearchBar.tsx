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
      let tech = '';
      let city = '';
      let salary = '';

      // Detector de tecnología
      if (qLower.includes('react')) tech = 'react';
      else if (qLower.includes('python')) tech = 'python';
      else if (qLower.includes('java')) tech = 'java';
      else if (qLower.includes('node')) tech = 'node';
      else if (qLower.includes('devops')) tech = 'devops';
      else if (qLower.includes('typescript')) tech = 'typescript';

      // Detector de ciudad
      if (qLower.includes('madrid')) city = 'madrid';
      else if (qLower.includes('barcelona')) city = 'barcelona';
      else if (qLower.includes('valencia')) city = 'valencia';
      else if (qLower.includes('remoto') || qLower.includes('teletrabajo')) city = 'remoto';

      // Detector de salario
      if (qLower.includes('30k') || qLower.includes('30.000')) salary = 'salario-mas-de-30k';
      else if (qLower.includes('40k') || qLower.includes('40.000')) salary = 'salario-mas-de-40k';
      else if (qLower.includes('50k') || qLower.includes('50.000')) salary = 'salario-mas-de-50k';

      // Construcción del slug SEO programático
      let targetPath = '/trabajos/informatica-tecnologia';

      if (tech) {
        const parts = [tech];
        if (salary) parts.push(salary);
        if (city) {
          if (city === 'remoto') parts.push('remoto');
          else parts.push(`en-${city}`);
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
          placeholder="Búsqueda Inteligente: ej. 'React en Madrid con más de 40k'..."
          className="w-full px-3 py-2 text-sm text-gray-900 focus:outline-none bg-transparent placeholder-gray-400 font-medium"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
        >
          {isPending ? 'Buscando...' : 'Buscar con IA →'}
        </button>
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
