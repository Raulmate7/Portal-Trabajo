'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export default function WidgetGeneratorPage() {
  const [tech, setTech] = useState('python');
  const [city, setCity] = useState('madrid');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const iframeCode = `<iframe src="${BASE_URL}/api/widget?tech=${tech}&city=${city}&theme=${theme}" width="100%" height="400" frameborder="0" style="border-radius:16px; border:1px solid #e2e8f0;"></iframe>`;

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-14 px-4 text-center">
        <span className="inline-block text-3xl mb-2">⚙️</span>
        <h1 className="text-3xl md:text-5xl font-black mb-3">Widget de Empleo Embebible</h1>
        <p className="text-indigo-200 text-sm md:text-base max-w-xl mx-auto">
          Incrusta de forma gratuita el widget interactivo de vacantes de Portal Trabajo IT en tu blog, web de universidad o comunidad técnica.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Herramientas', href: '/herramientas' },
          { label: 'Widget Embebible' }
        ]} />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Generator Controls */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
            🎨 Personalizar Widget
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tecnología Filter</label>
            <select 
              value={tech} 
              onChange={(e) => setTech(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
            >
              <option value="python">Python</option>
              <option value="react">React</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="aws">AWS</option>
              <option value="docker">Docker</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ciudad / Ubicación</label>
            <select 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800"
            >
              <option value="madrid">Madrid</option>
              <option value="barcelona">Barcelona</option>
              <option value="valencia">Valencia</option>
              <option value="remoto">100% Remoto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tema Visual</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} />
                Claro (Light)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                Oscuro (Dark)
              </label>
            </div>
          </div>
        </div>

        {/* Code Output */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">💻 Código HTML para copiar</h2>
            <p className="text-xs text-gray-500 mb-3">Copia y pega este código en tu web o CMS (WordPress, Webflow, Ghost):</p>
            <textarea
              readOnly
              rows={5}
              value={iframeCode}
              className="w-full p-3 bg-gray-900 text-indigo-300 font-mono text-xs rounded-xl border border-gray-800 focus:outline-none select-all"
            />
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(iframeCode);
              alert('¡Código de widget copiado al portapapeles!');
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
          >
            📋 Copiar Código HTML
          </button>
        </div>

      </div>
    </main>
  );
}
