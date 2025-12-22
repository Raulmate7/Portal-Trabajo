'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

const locations = [
  { name: 'Todas', value: '' },
  { name: 'Remoto', value: 'Remoto' },
  { name: 'Madrid', value: 'Madrid' },
  { name: 'Barcelona', value: 'Barcelona' },
  { name: 'Valencia', value: 'Valencia' },
  { name: 'Sevilla', value: 'Sevilla' },
  { name: 'Bilbao', value: 'Bilbao' },
];

export default function LocationFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleLocationChange = (location: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (location) {
      params.set('ubicacion', location);
    } else {
      params.delete('ubicacion');
    }
    
    replace(`${pathname}?${params.toString()}`);
  };

  const currentFilter = searchParams.get('ubicacion') || '';

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>📍</span> Ubicación
      </h3>
      <div className="flex flex-col space-y-1">
        {locations.map((loc) => (
          <button
            key={loc.name}
            onClick={() => handleLocationChange(loc.value)}
            className={`text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
              (currentFilter === loc.value) || (loc.value === '' && !currentFilter)
                ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-500 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:pl-4 border-l-4 border-transparent'
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
