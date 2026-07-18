'use client';

import { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { subscribeUser } from '@/app/actions';
import { sendGAEvent } from '@next/third-parties/google';


const TECH_OPTIONS = [
  { value: 'react', label: 'React / Frontend' },
  { value: 'node', label: 'Node.js / Backend' },
  { value: 'python', label: 'Python / Data' },
  { value: 'java', label: 'Java / Spring' },
  { value: 'aws', label: 'Cloud / DevOps' },
  { value: 'flutter', label: 'Mobile' },
];

export default function SubscribeForm({ 
  location,
  defaultTech,
  defaultLocation
}: { 
  location: string;
  defaultTech?: string;
  defaultLocation?: string;
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(!!defaultTech || !!defaultLocation);
  
  const [selectedTech, setSelectedTech] = useState<string[]>(() => {
    if (defaultTech) {
      const val = defaultTech.toLowerCase().trim();
      const option = TECH_OPTIONS.find(o => o.value === val || val.includes(o.value) || o.value.includes(val));
      return option ? [option.value] : [];
    }
    return [];
  });

  const [remoteOnly, setRemoteOnly] = useState(() => {
    if (defaultLocation) {
      const val = defaultLocation.toLowerCase();
      return val.includes('remoto') || val.includes('remote') || val.includes('teletrabajo');
    }
    return location.toLowerCase().includes('remoto') || location.toLowerCase().includes('remote') || location.toLowerCase().includes('teletrabajo');
  });

  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [operator, setOperator] = useState<'OR' | 'AND'>('OR');
  const [referredBy, setReferredBy] = useState<string>('');
  const emailRef = useRef<HTMLInputElement>(null);
  const [ctaVariant, setCtaVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    // Asignación persistente de la variante para el test A/B
    const savedVariant = localStorage.getItem('newsletter_cta_variant');
    if (savedVariant === 'A' || savedVariant === 'B') {
      setCtaVariant(savedVariant);
    } else {
      const chosenVariant = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem('newsletter_cta_variant', chosenVariant);
      setCtaVariant(chosenVariant);
    }
  }, []);


  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const refCookie = cookies.find(c => c.trim().startsWith('referrer_email='));
      if (refCookie) {
        const val = refCookie.split('=')[1];
        if (val) {
          setReferredBy(decodeURIComponent(val));
        }
      }
    }
  }, []);

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    formData.append('pathname', pathname);
    formData.append('tech_keywords', selectedTech.join(','));
    formData.append('location_pref', remoteOnly ? 'remoto' : '');
    formData.append('frequency', frequency);
    formData.append('operator', operator);
    formData.append('referred_by', referredBy);

    const result = await subscribeUser(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      if (emailRef.current) emailRef.current.value = '';
      // Guardar palabras clave para compatibilidad local
      localStorage.setItem('subscriber_tech_keywords', selectedTech.join(','));
      // Evento de GA4 para registrar la conversión y su respectiva variante A/B
      sendGAEvent({ event: 'newsletter_signup', value: ctaVariant });
    } else {
      setStatus('error');
      setMessage(result.message);
    }

    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  }

  const hasFilter = !!defaultTech || !!defaultLocation;
  
  let displayTitle = hasFilter ? 'Alertas para esta Búsqueda' : 'Alertas de Empleo';
  let displaySubtitle = (
    <>
      Recibe ofertas de <strong className="text-gray-200">{location}</strong> directamente en tu inbox.
    </>
  );
  let displayButtonText = '🔔 Suscribirme Gratis';

  if (ctaVariant === 'B') {
    displayTitle = '🚀 ¡Sé el primero en enterarte!';
    displaySubtitle = (
      <>
        Únete a +5.000 programadores y recibe empleos de <strong className="text-gray-200">{location}</strong> directamente en tu inbox.
      </>
    );
    displayButtonText = '🔥 ¡Recibir Ofertas IT Ya!';
  }

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white border border-gray-800">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{ctaVariant === 'B' ? '🚀' : '⚡'}</span>
        <h3 className="font-bold text-lg text-white">{displayTitle}</h3>
      </div>
      <p className="text-gray-400 text-xs mb-4 leading-relaxed">
        {displaySubtitle}
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
                      onClick={() => {
                        setSelectedTech(prev =>
                          prev.includes(tech.value)
                            ? prev.filter((v) => v !== tech.value)
                            : [...prev, tech.value]
                        );
                      }}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all ${
                        selectedTech.includes(tech.value)
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

              {/* Lógica de filtrado */}
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1 block">🔍 Lógica de coincidencia</label>
                <div className="flex gap-2">
                  {['OR', 'AND'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op as 'OR' | 'AND')}
                      className={`flex-grow-0 flex-1 text-xs py-1.5 rounded-lg border font-medium transition-all ${
                        operator === op
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {op === 'OR' ? 'Alguna (OR)' : 'Todas (AND)'}
                    </button>
                  ))}
                </div>
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
            {status === 'loading' ? 'Guardando...' : displayButtonText}
          </button>

          {status === 'error' && (
            <p className="text-red-400 text-xs text-center mt-2">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
