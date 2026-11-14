'use client';

import { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';
import { sendSafeGAEvent, hasAnalyticsConsent } from '@/lib/analytics';
import RgpdFirstLayerNotice from '@/components/RgpdFirstLayerNotice';


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
    // Asignación de la variante para el test A/B respetando consentimiento de cookies (LSSI Art. 22.2)
    if (hasAnalyticsConsent()) {
      const savedVariant = localStorage.getItem('newsletter_cta_variant');
      if (savedVariant === 'A' || savedVariant === 'B') {
        setCtaVariant(savedVariant);
      } else {
        const chosenVariant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem('newsletter_cta_variant', chosenVariant);
        setCtaVariant(chosenVariant);
      }
    } else {
      setCtaVariant(Math.random() < 0.5 ? 'A' : 'B');
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
    const resolvedLocationPref = remoteOnly
      ? 'remoto'
      : (defaultLocation || (location && location !== 'España' ? location : ''));
    formData.append('location_pref', resolvedLocationPref);
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
      // Evento de GA4 para registrar la conversión y su respectiva variante A/B con consentimiento verificado
      sendSafeGAEvent({ event: 'newsletter_signup', value: ctaVariant });
      
      // Redirigir a página de gracias
      window.location.href = '/gracias';
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
    displayButtonText = 'Recibir ofertas IT →';
  }

  return (
    <div className="bg-[#0D1117] p-5 sm:p-6 rounded-xl text-white border border-white/[0.1]">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" aria-hidden="true" />
        <h3 className="font-semibold text-base tracking-tight text-white">{displayTitle}</h3>
      </div>
      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        {displaySubtitle}
      </p>

      {status === 'success' ? (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs text-center font-medium">
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
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.12] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />

          {/* Botón para mostrar opciones de personalización */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full text-xs text-slate-400 hover:text-indigo-400 flex items-center justify-center gap-1.5 transition-colors py-1 cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-150 ${showOptions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            {showOptions ? 'Ocultar filtros' : 'Personalizar alertas (opcional)'}
          </button>

          {showOptions && (
            <div className="space-y-3 p-3.5 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              {/* Selección de stack tecnológico */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2 block">Tecnología preferida</label>
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
                      className={`ui-btn-press font-mono text-[10px] px-2 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                        selectedTech.includes(tech.value)
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'bg-white/[0.04] border-white/[0.1] text-slate-300 hover:border-white/[0.25]'
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
                  className={`w-9 h-5 rounded-full border transition-colors relative cursor-pointer ${
                    remoteOnly ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'bg-white/[0.08] border-white/[0.15]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
                </button>
                <label htmlFor="remote-toggle" className="text-xs text-slate-300 cursor-pointer">Solo ofertas en remoto</label>
              </div>

              {/* Lógica de filtrado */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1.5 block">Lógica de coincidencia</label>
                <div className="flex gap-2">
                  {['OR', 'AND'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op as 'OR' | 'AND')}
                      className={`ui-btn-press flex-1 text-xs py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
                        operator === op
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'bg-white/[0.04] border-white/[0.1] text-slate-300 hover:border-white/[0.25]'
                      }`}
                    >
                      {op === 'OR' ? 'Alguna (OR)' : 'Todas (AND)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1.5 block">Frecuencia de envío</label>
                <div className="flex gap-2">
                  {['daily', 'weekly'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f as 'daily' | 'weekly')}
                      className={`ui-btn-press flex-1 text-xs py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
                        frequency === f
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'bg-white/[0.04] border-white/[0.1] text-slate-300 hover:border-white/[0.25]'
                      }`}
                    >
                      {f === 'daily' ? 'Diario' : 'Semanal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Casillas de consentimiento no premarcadas + Primera Capa Informativa AEPD (LEG-017) */}
          <RgpdFirstLayerNotice
            purpose="Envío de alertas de empleo tech y, si lo autorizas expresamente, comunicaciones formativas o comerciales."
            includeMarketingCheckbox={true}
            dark={true}
          />

          <button
            type="submit"
            disabled={status === 'loading'}
            className="ui-btn-press w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-xs sm:text-sm flex justify-center cursor-pointer"
          >
            {status === 'loading' ? 'Guardando...' : displayButtonText}
          </button>

          <p className="text-[10px] text-slate-500 leading-normal text-center pt-1">
            Puedes darte de baja en cualquier momento con 1 clic desde el pie de cada correo. Medimos de forma agregada las aperturas para evitar envíos innecesarios.
          </p>

          {status === 'error' && (
            <p className="text-rose-400 text-xs text-center mt-2">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
