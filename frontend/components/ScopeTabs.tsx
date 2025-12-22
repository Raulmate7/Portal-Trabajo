'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function ScopeTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentScope = searchParams.get('scope') || 'espana'; // Por defecto España

  const handleTabChange = (scope: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('scope', scope);
    params.set('page', '1'); // Reseteamos página
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex space-x-1 rounded-xl bg-gray-200 p-1 mb-6 w-fit">
      <button
        onClick={() => handleTabChange('espana')}
        className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
          ${currentScope === 'espana' 
            ? 'bg-white text-indigo-700 shadow' 
            : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
          }`}
      >
        🇪🇸 España
      </button>
      <button
        onClick={() => handleTabChange('global')}
        className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
          ${currentScope === 'global' 
            ? 'bg-white text-blue-700 shadow' 
            : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
          }`}
      >
        🌍 Global
      </button>
    </div>
  );
}
