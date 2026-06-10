'use client';

import { useState } from 'react';
import Link from 'next/link';

const TECH_OPTIONS = [
  { value: '', label: 'Todas las tecnologías' },
  { value: 'react', label: '⚛️ React' },
  { value: 'node', label: '🟩 Node.js' },
  { value: 'python', label: '🐍 Python' },
  { value: 'java', label: '☕ Java' },
  { value: 'typescript', label: '🔷 TypeScript' },
  { value: 'aws', label: '☁️ AWS / Cloud' },
  { value: 'docker', label: '🐳 Docker / DevOps' },
  { value: 'flutter', label: '📱 Flutter / Mobile' },
  { value: 'csharp', label: '🔵 C# / .NET' },
  { value: 'php', label: '🐘 PHP' },
  { value: 'sql', label: '🗃️ SQL / Data' },
];

const LOCATION_OPTIONS = [
  { value: '', label: 'Toda España' },
  { value: 'remoto', label: '🌐 Remoto' },
  { value: 'madrid', label: '🏙️ Madrid' },
  { value: 'barcelona', label: '🏛️ Barcelona' },
  { value: 'valencia', label: '🌊 Valencia' },
  { value: 'bilbao', label: '🏔️ Bilbao' },
  { value: 'sevilla', label: '☀️ Sevilla' },
];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Todos los niveles' },
  { value: 'junior', label: '🌱 Junior (0–2 años)' },
  { value: 'senior', label: '🏆 Senior (5+ años)' },
];

interface SalaryData {
  count: number;
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  p25: number | null;
  p75: number | null;
  message?: string;
}

function formatEur(val: number | null): string {
  if (val === null) return 'N/D';
  return `${val.toLocaleString('es-ES')}€`;
}

export default function SalariosPage() {
  const [tech, setTech] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);

  const techLabel = TECH_OPTIONS.find(t => t.value === tech)?.label?.replace(/^.{2}\s/, '') || 'IT';
  const locLabel = LOCATION_OPTIONS.find(l => l.value === location)?.label?.replace(/^.{2}\s/, '') || 'España';
  const expLabel = EXPERIENCE_OPTIONS.find(e => e.value === experience)?.label?.replace(/^.{2}\s/, '') || '';

  async function calculate() {
    setLoading(true);
    setQueried(true);
    try {
      const params = new URLSearchParams();
      if (tech) params.set('tech', tech);
      if (location) params.set('location', location);
      if (experience) params.set('experience', experience);
      const res = await fetch(`/api/salarios?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const rangePercent = data?.min && data?.max && data?.average
    ? Math.round(((data.average - data.min) / (data.max - data.min)) * 100)
    : 50;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            💰 Datos reales de ofertas activas en España
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Calculadora de{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              Salarios IT
            </span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Descubre cuánto cobran los desarrolladores en España. Datos extraídos de{' '}
            <strong className="text-white">miles de ofertas reales</strong> publicadas en nuestro portal.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Formulario de filtros */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 -mt-8 relative z-10">
          <h2 className="text-lg font-bold text-gray-800 mb-6">🔍 Personaliza tu búsqueda salarial</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Tecnología</label>
              <select
                id="sal-tech"
                value={tech}
                onChange={e => setTech(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {TECH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Ubicación</label>
              <select
                id="sal-location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {LOCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Experiencia</label>
              <select
                id="sal-experience"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <button
            id="sal-calculate-btn"
            onClick={calculate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-60"
          >
            {loading ? '⚙️ Calculando...' : '💰 Calcular Salario'}
          </button>
        </div>

        {/* Resultados */}
        {queried && (
          <div className="mt-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Calculando salarios...</p>
              </div>
            ) : !data || data.count === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-5xl block mb-4">📭</span>
                <p className="text-gray-600 font-medium">{data?.message || 'No hay suficientes datos para este filtro.'}</p>
                <p className="text-sm text-gray-400 mt-2">Prueba una tecnología diferente o amplía los filtros.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tarjeta principal */}
                <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-2xl p-8 text-white text-center shadow-xl">
                  <p className="text-indigo-300 text-sm font-medium mb-1">
                    Salario medio de {techLabel}{expLabel ? ` ${expLabel}` : ''} en {locLabel}
                  </p>
                  <p className="text-6xl font-black mb-2">{formatEur(data.average)}</p>
                  <p className="text-indigo-300 text-xs">Bruto anual estimado · {data.count} ofertas analizadas</p>

                  {/* Barra de rango */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-indigo-300 mb-1">
                      <span>Mínimo: {formatEur(data.min)}</span>
                      <span>Máximo: {formatEur(data.max)}</span>
                    </div>
                    <div className="relative h-3 bg-indigo-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-700"
                        style={{ width: `${rangePercent}%` }}
                      />
                      <div
                        className="absolute top-0 w-3 h-3 bg-white rounded-full shadow-md transition-all duration-700"
                        style={{ left: `calc(${rangePercent}% - 6px)` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cards de percentiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Percentil 25%', value: data.p25, icon: '📉', desc: 'Salario bajo' },
                    { label: 'Mediana (P50)', value: data.median, icon: '⚖️', desc: 'Salario típico' },
                    { label: 'Percentil 75%', value: data.p75, icon: '📈', desc: 'Buen salario' },
                    { label: 'Máximo', value: data.max, icon: '🏆', desc: 'Mejor salario' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                      <span className="text-2xl block mb-1">{card.icon}</span>
                      <p className="text-xl font-bold text-indigo-700">{formatEur(card.value)}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{card.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 mb-1">¿Quieres llegar al P75?</h3>
                    <p className="text-sm text-amber-700">Los perfiles senior con certificaciones cloud cobran de media un 40% más. Forma tu perfil con cursos especializados.</p>
                  </div>
                  <a
                    href="https://trk.udemy.com/9VMAEj"
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="shrink-0 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Ver Cursos →
                  </a>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-xs text-gray-400">
                  * Datos calculados a partir de las ofertas publicadas en{' '}
                  <Link href="/" className="text-indigo-500 hover:underline">Portal Trabajo IT</Link>{' '}
                  con salario visible. Pueden no representar el mercado completo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Estado inicial - guía de uso */}
        {!queried && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Datos Reales', desc: 'Calculamos a partir de ofertas de empleo activas con salario visible publicadas en nuestra plataforma.' },
              { icon: '📊', title: 'Percentiles Salariales', desc: 'No solo el promedio: te mostramos el rango completo y los percentiles P25, P50 y P75.' },
              { icon: '🔗', title: 'Comparte tu resultado', desc: 'Comparte esta herramienta con tu red para negociar mejor tu próximo salario.' },
            ].map(card => (
              <div key={card.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                <span className="text-4xl block mb-3">{card.icon}</span>
                <h3 className="font-bold text-gray-800 mb-1 text-sm">{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
