'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function AISearchBar() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(() => {
      const qLower = query.toLowerCase();
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

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto my-4">
      <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-indigo-100 p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
        <span className="pl-3 text-xl">✨</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
    </form>
  );
}
