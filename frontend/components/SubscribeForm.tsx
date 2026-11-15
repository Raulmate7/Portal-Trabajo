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
  
  let displayTitle = hasFilter ? 'Alertas para esta búsqueda' : 'Alertas de empleo';
  let displaySubtitle = (
    <>
      Resumen semanal de <strong className="text-[var(--text-primary)] font-medium">{location}</strong> en tu correo.
    </>
  );
  let displayButtonText = 'Suscribirme';

  if (ctaVariant === 'B') {
    displayTitle = 'Alertas de empleo IT';
    displaySubtitle = (
      <>
        Nuevas ofertas en <strong className="text-[var(--text-primary)] font-medium">{location}</strong> sin spam.
      </>
    );
    displayButtonText = 'Recibir alertas →';
  }

  return (
    <div className="ui-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" aria-hidden="true" />
        <h3 className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">{displayTitle}</h3>
      </div>
      <p className="text-[var(--text-secondary)] text-xs mb-3 leading-relaxed">
        {displaySubtitle}
      </p>

      {status === 'success' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-xs text-center font-medium">
          {message}
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-2.5">
          <input
            ref={emailRef}
            id="subscribe-email-input"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15 transition-colors"
          />

          {/* Botón para mostrar opciones de personalización */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center justify-center gap-1 transition-colors py-0.5 cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-150 ${showOptions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            {showOptions ? 'Ocultar filtros' : 'Filtrar alertas (opcional)'}
          </button>

          {showOptions && (
            <div className="space-y-2.5 p-3 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]">
              {/* Selección de stack tecnológico */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1.5 block">Tecnología</label>
                <div className="flex flex-wrap gap-1">
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
                      className={`ui-btn-press font-mono text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                        selectedTech.includes(tech.value)
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
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
                  className={`w-8 h-4.5 rounded-full border transition-colors relative cursor-pointer ${
                    remoteOnly ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'bg-[var(--bg-surface)] border-[var(--border-strong)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-xs transition-all ${remoteOnly ? 'left-4' : 'left-0.5'}`} />
                </button>
                <label htmlFor="remote-toggle" className="text-[11px] text-[var(--text-secondary)] cursor-pointer">Solo remoto</label>
              </div>

              {/* Lógica de filtrado */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1 block">Coincidencia</label>
                <div className="flex gap-1.5">
                  {['OR', 'AND'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op as 'OR' | 'AND')}
                      className={`ui-btn-press flex-1 text-[11px] py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                        operator === op
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {op === 'OR' ? 'Alguna (OR)' : 'Todas (AND)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1 block">Frecuencia</label>
                <div className="flex gap-1.5">
                  {['daily', 'weekly'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f as 'daily' | 'weekly')}
                      className={`ui-btn-press flex-1 text-[11px] py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                        frequency === f
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {f === 'daily' ? 'Diario' : 'Semanal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <RgpdFirstLayerNotice
            purpose="Envío de alertas de empleo tech y, si lo autorizas expresamente, comunicaciones formativas o comerciales."
            includeMarketingCheckbox={true}
            dark={true}
          />

          <button
            type="submit"
            disabled={status === 'loading'}
            className="ui-btn-press w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white font-medium py-2 px-3 rounded-lg transition-colors text-xs flex justify-center cursor-pointer"
          >
            {status === 'loading' ? 'Guardando...' : displayButtonText}
          </button>

          {status === 'error' && (
            <p className="text-rose-500 text-xs text-center mt-1">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
