'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';
import { sendSafeGAEvent } from '@/lib/analytics';


interface ApplyButtonProps {
  url: string;
  company: string;
  title: string;
  lang?: string;
  jobId?: string | number;
}

export default function ApplyButton({ url, company, title, lang, jobId }: ApplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isEnglish = lang === 'en';

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setStatus('idle');
    setEmail('');
    setPrivacyAccepted(false);
    setMessage('');
  };

  const handleDirectRedirect = () => {
    sendSafeGAEvent({ event: 'click_apply', value: 'direct', company, job_title: title });
    if (jobId) {
      const queryParam = isEnglish ? '?lang=en' : '';
      window.open(`/redirect/${jobId}${queryParam}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    handleCloseModal();
  };

  const handleSubscribeAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!privacyAccepted) {
      setStatus('error');
      setMessage(isEnglish ? 'You must accept the Privacy Policy to subscribe.' : 'Debes aceptar la Política de Privacidad para suscribirte.');
      return;
    }

    setStatus('loading');

    // Preparar datos de suscripción basados en la oferta actual
    const formData = new FormData();
    formData.append('email', email);
    formData.append('pathname', typeof window !== 'undefined' ? window.location.pathname : '');
    formData.append('privacy_accepted', 'true');
    
    // Inferir tecnología del título
    const titleLower = title.toLowerCase();
    let detectedTech = '';
    const techs = ['react', 'node', 'python', 'java', 'aws', 'flutter'];
    for (const t of techs) {
      if (titleLower.includes(t)) {
        detectedTech = t;
        break;
      }
    }
    if (detectedTech) {
      formData.append('tech_keywords', detectedTech);
    }
    
    // Si la oferta dice remoto, preconfigurar remoto
    const isRemote = titleLower.includes('remoto') || titleLower.includes('remote') || titleLower.includes('teletrabajo');
    if (isRemote) {
      formData.append('location_pref', 'remoto');
    }

    const result = await subscribeUser(formData);

    if (result.success) {
      setStatus('success');
      setMessage(isEnglish ? 'Subscribed successfully! Redirecting...' : '¡Suscrito correctamente! Redirigiendo...');
      // Disparar eventos de conversión en GA4 con consentimiento verificado
      sendSafeGAEvent({ event: 'newsletter_signup', value: 'apply_modal', company, job_title: title });
      sendSafeGAEvent({ event: 'generate_lead', value: 'apply_modal', company, job_title: title });
      
      const targetHref = jobId ? `/redirect/${jobId}${isEnglish ? '?lang=en' : ''}` : url;
      const opened = window.open(targetHref, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = targetHref;
      }
      handleCloseModal();
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="ui-btn-press inline-flex w-full sm:w-auto justify-center items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm py-2.5 px-6 rounded-lg transition-colors cursor-pointer"
      >
        {isEnglish ? 'Apply on original website →' : 'Aplicar en la web original →'}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Modal Container */}
          <div className="relative w-full max-w-md ui-card rounded-2xl border-[var(--border-strong)] shadow-[var(--shadow-card-hover)] p-6 overflow-hidden text-[var(--text-primary)]">
            {/* Botón cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors"
              title={isEnglish ? 'Close' : 'Cerrar'}
              aria-label={isEnglish ? 'Close' : 'Cerrar'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icono de Alerta */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--accent-primary)] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-lg font-semibold tracking-tight text-center mb-2 leading-tight">
              {isEnglish
                ? 'Don\'t miss similar opportunities!'
                : '¡No dejes pasar ofertas similares!'}
            </h3>

            {/* Subtítulo */}
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] text-center mb-5 leading-relaxed">
              {isEnglish
                ? `Before applying at ${company}, subscribe to receive new Tech alerts matching your profile.`
                : `Antes de ir a la web de ${company}, suscríbete para recibir alertas de nuevos empleos Tech.`}
            </p>

            {status === 'success' ? (
              <div className="bg-[var(--status-emerald-tint)] border border-[var(--status-emerald)]/30 text-[var(--status-emerald)] p-4 rounded-xl text-center font-medium text-sm">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubscribeAndRedirect} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--accent-tint)] transition-colors text-sm"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] cursor-pointer text-left">
                  <input
                    type="checkbox"
                    required
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <span>
                    {isEnglish ? 'I have read and accept the ' : 'He leído y acepto la '}
                    <Link href="/privacy" target="_blank" className="text-[var(--accent-primary)] underline">
                      {isEnglish ? 'Privacy Policy' : 'Política de Privacidad'}
                    </Link>
                    {isEnglish ? ' and agree to receive job alerts.*' : ' y consiento recibir alertas de ofertas tech.*'}
                  </span>
                </label>

                {/* Primera capa informativa AEPD (RGPD Art. 13) */}
                <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg text-[10px] text-[var(--text-muted)] text-left space-y-0.5">
                  <p><strong>Responsable:</strong> Portal Trabajo IT.</p>
                  <p><strong>Finalidad:</strong> {isEnglish ? 'Sending tech job alerts.' : 'Envío de alertas de empleo tech.'}</p>
                  <p><strong>Legitimación:</strong> {isEnglish ? 'Your express consent (Art. 6.1.a GDPR).' : 'Tu consentimiento expreso (Art. 6.1.a RGPD).'}</p>
                  <p><strong>Destinatarios:</strong> {isEnglish ? 'No third-party transfer except technical delivery.' : 'Plataforma de envío (Resend). No se ceden datos a terceros.'}</p>
                  <p><strong>Derechos:</strong> {isEnglish ? 'Access, rectification, erasure and 1-click unsubscribe (' : 'Acceso, rectificación, supresión y baja en 1 clic ('}<Link href="/privacy" className="text-[var(--accent-primary)] underline">{isEnglish ? 'Privacy Policy' : 'Política de Privacidad'}</Link>).</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="ui-btn-press w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex justify-center cursor-pointer"
                  >
                    {status === 'loading'
                      ? (isEnglish ? 'Subscribing...' : 'Suscribiendo...')
                      : (isEnglish ? 'Subscribe and apply →' : 'Suscribirme y ver oferta →')}
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectRedirect}
                    className="ui-btn-press w-full bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium py-2 rounded-lg transition-colors text-xs cursor-pointer"
                  >
                    {isEnglish ? 'Continue directly without subscribing →' : 'Continuar directamente sin suscribirme →'}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="text-[var(--status-danger)] text-xs text-center mt-2 leading-relaxed">{message}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
