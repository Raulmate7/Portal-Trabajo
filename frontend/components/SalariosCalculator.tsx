'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

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

interface SalariosCalculatorProps {
  initialData: SalaryData | null;
  initialParams: {
    tech: string;
    location: string;
    experience: string;
  };
}

function formatEur(val: number | null): string {
  if (val === null) return 'N/D';
  return `${val.toLocaleString('es-ES')}€`;
}

export default function SalariosCalculator({ initialData, initialParams }: SalariosCalculatorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [tech, setTech] = useState(initialParams.tech);
  const [location, setLocation] = useState(initialParams.location);
  const [experience, setExperience] = useState(initialParams.experience);
  const [currentSalary, setCurrentSalary] = useState('');
  const [data, setData] = useState<SalaryData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(true); // Siempre activo al iniciar con datos pre-cargados
  const [copiedShare, setCopiedShare] = useState(false);

  const techLabel = TECH_OPTIONS.find(t => t.value === tech)?.label?.replace(/^.{2}\s/, '') || 'IT';
  const locLabel = LOCATION_OPTIONS.find(l => l.value === location)?.label?.replace(/^.{2}\s/, '') || 'España';
  const expLabel = EXPERIENCE_OPTIONS.find(e => e.value === experience)?.label?.replace(/^.{2}\s/, '') || '';

  // Efecto para responder a cambios en los parámetros de la URL (por ejemplo, desde enlaces externos o navegador)
  useEffect(() => {
    const pTech = searchParams.get('tech') || '';
    const pLoc = searchParams.get('location') || '';
    const pExp = searchParams.get('experience') || '';

    setTech(pTech);
    setLocation(pLoc);
    setExperience(pExp);

    if (pTech || pLoc || pExp) {
      triggerCalculate(pTech, pLoc, pExp);
    } else {
      setData(initialData);
    }
  }, [searchParams, initialData]);

  async function triggerCalculate(t: string, l: string, e: string) {
    setLoading(true);
    setQueried(true);
    try {
      const params = new URLSearchParams();
      if (t) params.set('tech', t);
      if (l) params.set('location', l);
      if (e) params.set('experience', e);
      const res = await fetch(`/api/salarios?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function calculate() {
    const params = new URLSearchParams();
    if (tech) params.set('tech', tech);
    if (location) params.set('location', location);
    if (experience) params.set('experience', experience);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    await triggerCalculate(tech, location, experience);
  }

  const rangePercent = data?.min && data?.max && data?.average
    ? Math.round(((data.average - data.min) / (data.max - data.min)) * 100)
    : 50;

  return (
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

      {/* Comparativa salarial — ¿Cuánto cobro vs. cuánto debería? */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 mb-4">
        <label className="block text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
          <span>💡</span> ¿Cuánto cobras actualmente? <span className="text-amber-600 font-normal">(opcional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="sal-current"
            type="number"
            min="0"
            max="200000"
            step="1000"
            placeholder="Ej: 38000"
            value={currentSalary}
            onChange={e => setCurrentSalary(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
          />
          <span className="text-sm text-amber-700 font-semibold flex-shrink-0">€ brutos/año</span>
        </div>
        <p className="text-xs text-amber-600 mt-1.5">Compararemos tu salario actual con la media del mercado para tu perfil.</p>
      </div>
      <button
        id="sal-calculate-btn"
        onClick={calculate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-50 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-60 mb-6"
      >
        {loading ? '⚙️ Calculando...' : '💰 Calcular Salario'}
      </button>

      {/* Resultados */}
      {queried && (
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Calculando salarios...</p>
            </div>
          ) : !data || data.count === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-150 shadow-sm">
              <span className="text-5xl block mb-4">📭</span>
              <p className="text-gray-650 font-medium">{data?.message || 'No hay suficientes datos para este filtro.'}</p>
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

                {/* Botón de Compartir */}
                <div className="mt-6 pt-6 border-t border-indigo-800/60 flex justify-center">
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/salarios?tech=${tech}&location=${location}&experience=${experience}`;
                      const shareText = `El salario medio para ${techLabel}${expLabel ? ` ${expLabel}` : ''} en ${locLabel} es de ${formatEur(data.average)} según Portal Trabajo IT. ¡Calcula el tuyo!`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Calculadora de Salarios IT',
                            text: shareText,
                            url: url,
                          });
                        } catch (e) {}
                      } else {
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopiedShare(true);
                          setTimeout(() => setCopiedShare(false), 2000);
                        } catch (e) {}
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-sm font-bold text-white border border-white/10 cursor-pointer"
                  >
                    {copiedShare ? '✅ Enlace Copiado' : '📤 Compartir Resultado'}
                  </button>
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
                    <p className="text-xs text-gray-505 mt-0.5">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Comparativa cuánto cobro vs cuánto debería */}
              {currentSalary && data?.average && (() => {
                const current = parseInt(currentSalary, 10);
                if (isNaN(current) || current <= 0) return null;
                const market = data.average;
                const diff = market - current;
                const pct = Math.round((diff / market) * 100);
                const isUnder = diff > 0;
                const currentBar = Math.min(100, Math.round((current / Math.max(current, market)) * 100));
                const marketBar = Math.min(100, Math.round((market / Math.max(current, market)) * 100));
                return (
                  <div className={`rounded-2xl p-6 border ${isUnder ? 'bg-red-50/60 border-red-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
                    <h3 className={`font-bold text-base mb-1 ${isUnder ? 'text-red-900' : 'text-emerald-900'}`}>
                      {isUnder ? `⚠️ Podrías cobrar un ${Math.abs(pct)}% más` : `✅ Estás por encima de la media (${Math.abs(pct)}%)`}
                    </h3>
                    <p className={`text-xs mb-4 ${isUnder ? 'text-red-700' : 'text-emerald-700'}`}>
                      {isUnder
                        ? `Tu salario actual (${current.toLocaleString('es-ES')}€) está por debajo de la media de mercado (${market.toLocaleString('es-ES')}€). La diferencia es de ${Math.abs(diff).toLocaleString('es-ES')}€ anuales.`
                        : `Tu salario actual (${current.toLocaleString('es-ES')}€) está por encima de la media de mercado (${market.toLocaleString('es-ES')}€). ¡Bien posicionado!`
                      }
                    </p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-600">Tu salario actual</span>
                          <span className="text-gray-900">{current.toLocaleString('es-ES')}€</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-500 rounded-full" style={{ width: `${currentBar}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className={isUnder ? 'text-red-700' : 'text-emerald-700'}>Media del mercado</span>
                          <span className={`font-bold ${isUnder ? 'text-red-900' : 'text-emerald-900'}`}>{market.toLocaleString('es-ES')}€</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isUnder ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${marketBar}%` }} />
                        </div>
                      </div>
                    </div>
                    {isUnder && (
                      <p className="text-xs text-red-600 mt-4 font-medium">
                        💡 Consejo: Si llevas más de 1 año en tu empresa actual sin subida, es buen momento para negociar o explorar el mercado.
                      </p>
                    )}
                  </div>
                );
              })()}

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
    </div>
  );
}
