'use client';

import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { subscribeUser } from '@/app/actions';

const TECH_OPTIONS = [
  { value: 'react', label: 'React / Frontend' },
  { value: 'node', label: 'Node.js / Backend' },
  { value: 'python', label: 'Python / Data' },
  { value: 'java', label: 'Java / Spring' },
  { value: 'aws', label: 'Cloud / DevOps' },
  { value: 'flutter', label: 'Mobile' },
];

export default function SubscribeForm({ location }: { location: string }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedTech, setSelectedTech] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    formData.append('pathname', pathname);
    formData.append('tech_keywords', selectedTech);
    formData.append('location_pref', remoteOnly ? 'remoto' : '');
    formData.append('frequency', frequency);

    const result = await subscribeUser(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      if (emailRef.current) emailRef.current.value = '';
    } else {
      setStatus('error');
      setMessage(result.message);
    }

    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  }

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white border border-gray-800">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">⚡</span>
        <h3 className="font-bold text-lg text-white">Alertas de Empleo</h3>
      </div>
      <p className="text-gray-400 text-xs mb-4 leading-relaxed">
        Recibe ofertas de <strong className="text-gray-200">{location}</strong> directamente en tu inbox.
      </p>

      {status === 'success' ? (
        <div className="bg-green-500/20 border border-green-500 text-green-200 p-3 rounded-lg text-sm text-center font-medium animate-pulse">
          {message}
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-3">
          <input
            ref={emailRef}
            id="subscribe-email-input"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />

          {/* Botón para mostrar opciones de personalización */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 transition-colors py-1"
          >
            <span>{showOptions ? '▲' : '▼'}</span>
            {showOptions ? 'Ocultar filtros' : 'Personalizar mis alertas (opcional)'}
          </button>

          {showOptions && (
            <div className="space-y-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700 animate-in fade-in">
              {/* Selección de stack tecnológico */}
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">🔧 Tecnología preferida</label>
                <div className="flex flex-wrap gap-1.5">
                  {TECH_OPTIONS.map((tech) => (
                    <button
                      key={tech.value}
                      type="button"
                      onClick={() => setSelectedTech(selectedTech === tech.value ? '' : tech.value)}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all ${
                        selectedTech === tech.value
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {tech.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro remoto */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  id="remote-toggle"
                  className={`w-9 h-5 rounded-full border-2 transition-all relative ${
                    remoteOnly ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
                </button>
                <label htmlFor="remote-toggle" className="text-xs text-gray-300 cursor-pointer">Solo ofertas en remoto</label>
              </div>

              {/* Frecuencia */}
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">📅 Frecuencia de envío</label>
                <div className="flex gap-2">
                  {['daily', 'weekly'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f as 'daily' | 'weekly')}
                      className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-all ${
                        frequency === f
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {f === 'daily' ? '⚡ Diario' : '📋 Semanal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow-md flex justify-center"
          >
            {status === 'loading' ? 'Guardando...' : '🔔 Suscribirme Gratis'}
          </button>

          {status === 'error' && (
            <p className="text-red-400 text-xs text-center mt-2">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
