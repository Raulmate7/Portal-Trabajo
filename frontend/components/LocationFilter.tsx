'use client'; // Esto indica que es interactivo

import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce'; // Necesitaremos instalar esto

export default function LocationFilter() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Esta función espera 300ms a que dejes de escribir para no recargar a lo loco
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set('ubicacion', term);
    } else {
      params.delete('ubicacion');
    }
    
    // Actualiza la URL sin recargar la página completa
    replace(`?${params.toString()}`);
  }, 300);

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
        📍 Filtrar por Ciudad o Zona
      </label>
      <div className="relative">
        <input
          id="search"
          className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Ej: Madrid, Barcelona, Remoto..."
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('ubicacion')?.toString()}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-gray-400">🔍</span>
        </div>
      </div>
      
      {/* Botones rápidos (Apartado Madrid) */}
      <div className="mt-3 flex gap-2">
        <button 
            onClick={() => {
                const input = document.getElementById('search') as HTMLInputElement;
                input.value = 'Madrid';
                handleSearch('Madrid');
            }}
            className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
        >
            Madrid
        </button>
        <button 
            onClick={() => {
                const input = document.getElementById('search') as HTMLInputElement;
                input.value = 'Barcelona';
                handleSearch('Barcelona');
            }}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition"
        >
            Barcelona
        </button>
         <button 
            onClick={() => {
                const input = document.getElementById('search') as HTMLInputElement;
                input.value = 'Remoto';
                handleSearch('Remoto');
            }}
            className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100 transition"
        >
            Remoto
        </button>
      </div>
    </div>
  );
}
