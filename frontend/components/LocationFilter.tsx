'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useRef } from 'react';

const popularLocations = [
  { name: 'Remoto', value: 'Remoto' },
  { name: 'Madrid', value: 'Madrid' },
  { name: 'Barcelona', value: 'Barcelona' },
];

export default function LocationFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Maneja lo que escribes en la caja (Zaragoza, Vigo...)
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set('ubicacion', term);
    } else {
      params.delete('ubicacion');
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  // 2. Maneja los clics en los botones rápidos
  const handleQuickClick = (value: string) => {
    if (inputRef.current) inputRef.current.value = value;
    handleSearch(value);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <span>🌍</span> Ubicación
      </h3>
      
      {/* CAJA DE BÚSQUEDA DE CIUDAD */}
      <div className="relative">
        <input
          ref={inputRef}
          id="location-input"
          className="block w-full rounded-md border border-gray-300 py-2 pl-9 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Ciudad (ej: Sevilla)..."
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('ubicacion')?.toString()}
        />
        {/* Icono chincheta */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400">
          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.62.829.799 1.654 1.38 2.274 1.766a11.267 11.267 0 001.04.574c.002.001.003.001.004.001zM10 13a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
        </svg>
      </div>

      {/* BOTONES RÁPIDOS (Píldoras) */}
      <div className="flex flex-wrap gap-2">
        {popularLocations.map((loc) => (
          <button
            key={loc.name}
            onClick={() => handleQuickClick(loc.value)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
          >
            {loc.name}
          </button>
        ))}
        <button 
           onClick={() => handleQuickClick('')}
           className="text-xs text-gray-500 hover:text-indigo-600 underline px-1"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
