'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';
import { sendGAEvent } from '@next/third-parties/google';


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
    sendGAEvent({ event: 'click_apply', value: 'direct', company, job_title: title });
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
      // Disparar eventos de conversión en GA4
      sendGAEvent({ event: 'newsletter_signup', value: 'apply_modal', company, job_title: title });
      sendGAEvent({ event: 'generate_lead', value: 'apply_modal', company, job_title: title });
      
      setTimeout(() => {
        if (jobId) {
          const queryParam = isEnglish ? '?lang=en' : '';
          window.open(`/redirect/${jobId}${queryParam}`, '_blank', 'noopener,noreferrer');
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        handleCloseModal();
      }, 1500);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="inline-flex w-full sm:w-auto justify-center items-center bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        {isEnglish ? '👉 Apply on original website' : '👉 Aplicar en la web original'}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-900 dark:text-white animate-in zoom-in duration-200">
            {/* Botón cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold p-1 cursor-pointer"
              title={isEnglish ? 'Close' : 'Cerrar'}
            >
              ✕
            </button>

            {/* Icono de Alerta */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-4xl">
                📬
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-extrabold text-center mb-2 leading-tight">
              {isEnglish 
                ? 'Don\'t miss similar opportunities!' 
                : '¡No dejes pasar ofertas similares!'}
            </h3>

            {/* Subtítulo */}
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
              {isEnglish
                ? `Before applying at ${company}, subscribe to receive new Tech alerts matching your profile.`
                : `Antes de ir a la web de ${company}, suscríbete para recibir alertas de nuevos empleos Tech.`}
            </p>

            {status === 'success' ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-250 p-4 rounded-xl text-center font-medium animate-pulse text-sm">
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
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    required
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {isEnglish ? 'I have read and accept the ' : 'He leído y acepto la '}
                    <Link href="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline">
                      {isEnglish ? 'Privacy Policy' : 'Política de Privacidad'}
                    </Link>
                    {isEnglish ? ' and agree to receive job alerts.*' : ' y consiento recibir alertas de ofertas tech.*'}
                  </span>
                </label>

                {/* Primera capa informativa AEPD (RGPD Art. 13) */}
                <div className="p-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 rounded-lg text-[10px] text-gray-500 dark:text-slate-400 text-left space-y-0.5">
                  <p><strong>Responsable:</strong> Portal Trabajo IT.</p>
                  <p><strong>Finalidad:</strong> {isEnglish ? 'Sending tech job alerts.' : 'Envío de alertas de empleo tech.'}</p>
                  <p><strong>Legitimación:</strong> {isEnglish ? 'Your express consent (Art. 6.1.a GDPR).' : 'Tu consentimiento expreso (Art. 6.1.a RGPD).'}</p>
                  <p><strong>Destinatarios:</strong> {isEnglish ? 'No third-party transfer except technical delivery.' : 'Plataforma de envío (Resend). No se ceden datos a terceros.'}</p>
                  <p><strong>Derechos:</strong> {isEnglish ? 'Access, rectification, erasure and 1-click unsubscribe (' : 'Acceso, rectificación, supresión y baja en 1 clic ('}<Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 underline">{isEnglish ? 'Privacy Policy' : 'Política de Privacidad'}</Link>).</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold py-3 rounded-lg transition-colors text-sm shadow-md flex justify-center cursor-pointer"
                  >
                    {status === 'loading' 
                      ? (isEnglish ? 'Subscribing...' : 'Suscribiendo...') 
                      : (isEnglish ? '🔔 Yes, subscribe and apply' : '🔔 Sí, suscribirme y ver oferta')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDirectRedirect}
                    className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-lg transition-colors text-xs cursor-pointer"
                  >
                    {isEnglish ? 'No thanks, just view the job' : 'No gracias, solo ver oferta'}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="text-red-500 dark:text-red-400 text-xs text-center mt-2 leading-relaxed">{message}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
