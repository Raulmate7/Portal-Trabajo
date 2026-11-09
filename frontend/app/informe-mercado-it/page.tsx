'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';
import { isSafeStripeRedirectUrl } from '@/lib/urlSafety';
import { buildPayPalCheckoutUrl } from '@/lib/paypal';

function InformeMercadoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const tokenParam = searchParams.get('token') || '';

  const [checkoutVerified, setCheckoutVerified] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState('full');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Verificación segura en servidor del pago (Stripe o PayPal)
  useEffect(() => {
    const paypalSuccess = searchParams.get('paypal_success') === 'true';
    const typeParam = searchParams.get('type') || 'full';
    const emailParam = searchParams.get('email') || '';
    const txParam = searchParams.get('tx') || searchParams.get('PayerID') || '';

    if (paypalSuccess && emailParam) {
      setVerifyingPayment(true);
      setVerifyError('');
      fetch(`/api/checkout/report/verify?paypal_order=true&email=${encodeURIComponent(emailParam)}&plan=${encodeURIComponent(typeParam)}&tx=${encodeURIComponent(txParam)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setCheckoutVerified(true);
            setCheckoutEmail(emailParam);
            setCheckoutPlan(typeParam);
            setDownloadUrl(data.downloadUrl || '');
          } else {
            setVerifyError(data.error || 'No se pudo verificar el pedido de PayPal.');
          }
        })
        .catch(() => {
          setVerifyError('Error al validar la confirmación del pago.');
        })
        .finally(() => {
          setVerifyingPayment(false);
        });
    } else if (sessionId && sessionId.startsWith('cs_')) {
      setVerifyingPayment(true);
      setVerifyError('');
      fetch(`/api/checkout/report/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setCheckoutVerified(true);
            setCheckoutEmail(data.email || '');
            setCheckoutPlan(data.plan || 'full');
            setDownloadUrl(data.downloadUrl || '');
          } else {
            setVerifyError(data.error || 'No se pudo verificar el pago en la pasarela.');
          }
        })
        .catch(() => {
          setVerifyError('Error de red al comprobar el estado del pago con Stripe.');
        })
        .finally(() => {
          setVerifyingPayment(false);
        });
    } else if (tokenParam) {
      setCheckoutVerified(true);
      setDownloadUrl(`/api/checkout/report/download?token=${encodeURIComponent(tokenParam)}`);
    }
  }, [sessionId, tokenParam, searchParams]);

  // Free report (lead magnet) states
  const [freeEmail, setFreeEmail] = useState('');
  const [freePrivacyAccepted, setFreePrivacyAccepted] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [freeError, setFreeError] = useState('');

  // Paid report states
  const [paidEmail, setPaidEmail] = useState('');
  const [reportType, setReportType] = useState<'full' | 'enterprise'>('full');
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);
  const [paidError, setPaidError] = useState('');

  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freeEmail.trim()) return;

    if (!freePrivacyAccepted) {
      setFreeError('Debes aceptar la Política de Privacidad para descargar el informe.');
      return;
    }

    setFreeLoading(true);
    setFreeError('');

    const formData = new FormData();
    formData.append('email', freeEmail.trim());
    formData.append('pathname', '/informe-mercado-it');
    formData.append('tech_keywords', 'reporte_mercado_2026');
    formData.append('privacy_accepted', 'true');

    try {
      const res = await subscribeUser(formData);
      if (res.success) {
        setFreeSuccess(true);
      } else {
        setFreeError(res.message);
      }
    } catch (err) {
      setFreeError('Error al procesar la suscripción.');
    } finally {
      setFreeLoading(false);
    }
  }

  async function handlePaidCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!paidEmail.trim()) return;

    if (!waiverAccepted) {
      setPaidError('Debes aceptar expresamente la renuncia al derecho de desistimiento de 14 días para la descarga de contenido digital (Art. 103.m TRLGDCU).');
      return;
    }

    setPaidLoading(true);
    setPaidError('');

    try {
      const amount = reportType === 'enterprise' ? 49 : 9.99;
      const itemName = reportType === 'enterprise'
        ? 'Informe de Mercado IT Custom Empresas (PDF)'
        : 'Informe de Mercado IT Completo (PDF)';

      const paypalUrl = buildPayPalCheckoutUrl({
        amount,
        itemName,
        returnUrl: `${window.location.origin}/informe-mercado-it?paypal_success=true&type=${reportType}&email=${encodeURIComponent(paidEmail.trim())}`,
        cancelUrl: `${window.location.origin}/informe-mercado-it?paypal_canceled=true`,
        custom: `report_${reportType}_${paidEmail.trim()}`,
        buyerEmail: paidEmail.trim(),
        applyVat21: reportType === 'enterprise',
        requireBillingAddress: true,
      });

      window.location.href = paypalUrl;
    } catch (err) {
      setPaidError('Error al redirigir a la pasarela de PayPal.');
      setPaidLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
      {/* Hero / Header */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-gray-950 to-purple-900/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
          >
            ← Volver al buscador
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-6 uppercase tracking-wider">
            📊 INFORME DE MERCADO IT 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Salarios y Tendencias de Contratación<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Tech en España
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-405 max-w-2xl mx-auto leading-relaxed">
            Analizamos datos agregados de más de 12.000 ofertas de empleo tecnológicas en España para ofrecerte un mapa detallado del sector: salarios reales, demanda de stacks, teletrabajo y hubs de contratación.
          </p>
        </div>
      </section>

      {/* Qué contiene el informe */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6">
            <span className="text-3xl block mb-4">💰</span>
            <h3 className="font-bold text-white mb-2">Salarios Reales</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Comparativa detallada de sueldos brutos por tecnología (React, Node, Python, Java...) y experiencia (Junior, Mid, Senior).</p>
          </div>
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6">
            <span className="text-3xl block mb-4">📍</span>
            <h3 className="font-bold text-white mb-2">Geografía y Remoto</h3>
            <p className="text-xs text-gray-400 leading-relaxed">¿Dónde se contrata más? Análisis de Madrid, Barcelona, Valencia, hubs emergentes y el porcentaje real de teletrabajo 100%.</p>
          </div>
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6">
            <span className="text-3xl block mb-4">⚙️</span>
            <h3 className="font-bold text-white mb-2">Tecnologías en Alza</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Los frameworks y lenguajes que más aumentan su sueldo y demanda este año, y cuáles están perdiendo cuota de mercado.</p>
          </div>
        </div>
      </section>

      {/* Opciones de descarga */}
      <section className="max-w-5xl mx-auto px-4 py-12 w-full grid md:grid-cols-2 gap-8 items-stretch">
        
        {/* Opción 1: Reporte Básico (Lead Magnet - Suscripción) */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              Gratis
            </span>
            <h3 className="text-xl font-bold text-white">Informe Resumido 2026</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Consigue el resumen ejecutivo del informe IT de forma gratuita a cambio de suscribirte a nuestra newsletter semanal. Recibirás el PDF al instante en tu bandeja de entrada.
            </p>
            
            <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside pt-4">
              <li>Salarios medios nacionales de los 5 stacks clave</li>
              <li>Mediana general de teletrabajo en España</li>
              <li>Actualizaciones del portal 1 vez por mes</li>
            </ul>
          </div>

          <div className="pt-8 border-t border-gray-800/80 mt-8">
            {freeSuccess ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-center text-xs font-bold">
                🎉 ¡Suscrito con éxito! Revisa tu bandeja de entrada para descargar el informe básico.
              </div>
            ) : (
              <form onSubmit={handleFreeSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={freeEmail}
                  onChange={(e) => setFreeEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-550 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs"
                />

                <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    required
                    checked={freePrivacyAccepted}
                    onChange={(e) => setFreePrivacyAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-700 bg-gray-950 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>
                    He leído y acepto la{' '}
                    <Link href="/privacy" target="_blank" className="text-emerald-400 underline">
                      Política de Privacidad
                    </Link>{' '}
                    y consiento recibir el informe básico y novedades por email.*
                  </span>
                </label>

                {/* Primera capa informativa AEPD (RGPD Art. 13) */}
                <div className="p-2.5 bg-gray-950/80 border border-gray-800 rounded-xl text-[10px] text-gray-400 text-left space-y-0.5">
                  <p><strong>Responsable:</strong> Portal Trabajo IT.</p>
                  <p><strong>Finalidad:</strong> Envío del informe de mercado y boletín de novedades.</p>
                  <p><strong>Legitimación:</strong> Consentimiento expreso (Art. 6.1.a RGPD).</p>
                  <p><strong>Destinatarios:</strong> Plataforma de envío (Resend). No se ceden datos a terceros.</p>
                  <p><strong>Derechos:</strong> Baja inmediata en cada email o en <a href="mailto:contacto@portalempleoit.com" className="text-emerald-400 underline">contacto@portalempleoit.com</a> (+ info en <Link href="/privacy" className="text-emerald-400 underline">Política de Privacidad</Link>).</p>
                </div>

                <button
                  type="submit"
                  disabled={freeLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-xs disabled:opacity-60 cursor-pointer"
                >
                  {freeLoading ? 'Enviando...' : 'Obtener Informe Básico Gratis →'}
                </button>
              </form>
            )}
            {freeError && <p className="text-red-400 text-xs text-center mt-3 font-medium">{freeError}</p>}
          </div>
        </div>

        {/* Opción 2: Reporte Completo / Enterprise (Pago Stripe) */}
        <div className="bg-gray-900/60 border border-purple-500/30 rounded-3xl p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Premium
            </span>
            
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setReportType('full')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  reportType === 'full' 
                    ? 'bg-purple-650 text-white border-purple-500' 
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                Completo (9,99€ IVA incl.)
              </button>
              <button
                type="button"
                onClick={() => setReportType('enterprise')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  reportType === 'enterprise' 
                    ? 'bg-purple-650 text-white border-purple-500' 
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                Empresa (49€ + IVA)
              </button>
            </div>

            <h3 className="text-xl font-bold text-white">
              {reportType === 'full' ? 'Informe de Mercado IT Completo' : 'Informe Custom / Empresas'}
            </h3>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              {reportType === 'full' 
                ? 'Accede al dossier completo con datos pormenorizados de más de 20 tecnologías en España, segmentación por 7 ciudades, tablas de negociación laboral y consejos de contratación.'
                : 'Diseñado para departamentos de RRHH y reclutadores. Incluye el dataset completo en CSV con el histórico de salarios brutos de ofertas IT en España de los últimos 12 meses.'}
            </p>
          </div>

          <div className="pt-8 border-t border-gray-800/80 mt-8">
            {verifyingPayment ? (
              <div className="p-6 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-purple-200">Verificando compra segura con Stripe...</p>
              </div>
            ) : checkoutVerified ? (
              <div className="p-6 bg-purple-950/70 border border-purple-500/50 rounded-2xl text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-300 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  ✓
                </div>
                <h4 className="text-base font-bold text-white">¡Pago verificado con éxito!</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Hemos verificado tu compra en Stripe del <strong>Informe de Mercado IT ({checkoutPlan === 'enterprise' ? 'Empresa' : 'Completo'})</strong>.
                  {checkoutEmail && <> Se ha emitido la licencia a nombre de <strong>{checkoutEmail}</strong>.</>}
                </p>
                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    className="inline-block px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
                  >
                    📥 Descargar Informe Completo (Dataset Verificado) →
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaidCheckout} className="space-y-3">
                {verifyError && (
                  <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl text-xs text-center mb-2">
                    {verifyError}
                  </div>
                )}
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={paidEmail}
                  onChange={(e) => setPaidEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-550 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
                />

                {/* Cláusula y renuncia al desistimiento conforme al Art. 103.m TRLGDCU */}
                <div className="flex items-start gap-2.5 pt-1 text-left bg-purple-950/40 p-3 rounded-xl border border-purple-800/50">
                  <input
                    type="checkbox"
                    id="waiver-report"
                    required
                    checked={waiverAccepted}
                    onChange={(e) => setWaiverAccepted(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-purple-700 bg-gray-950 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="waiver-report" className="text-[11px] text-gray-300 leading-tight cursor-pointer">
                    Solicito la entrega y descarga inmediata del informe digital en PDF y <strong className="text-white">renuncio expresamente a mi derecho de desistimiento de 14 días</strong> al iniciar la descarga (Art. 103.m TRLGDCU). Acepto las <Link href="/aviso-legal" target="_blank" className="text-purple-300 underline">Condiciones de Contratación</Link> y la <Link href="/privacy" target="_blank" className="text-purple-300 underline">Política de Privacidad</Link>. Precios finales con IVA incluido.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={paidLoading}
                  className="w-full py-3 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl transition-all text-xs disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
                >
                  <span className="text-sm font-black text-white">🅿️</span>
                  {paidLoading ? 'Redirigiendo a PayPal...' : `Pagar con PayPal (${reportType === 'full' ? '9,99€ IVA incl.' : '49€ + IVA'}) →`}
                </button>
              </form>
            )}
            {paidError && <p className="text-red-400 text-xs text-center mt-3 font-medium">{paidError}</p>}
          </div>
        </div>

      </section>

      {/* Recursos de Navegación y Herramientas SEO */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 space-y-4">
          <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <span>🔗</span> Explora el Mercado IT en Tiempo Real
          </h3>
          <p className="text-xs text-gray-400">
            Complementa este informe de mercado utilizando nuestras herramientas interactivas de análisis salarial y empleo:
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-semibold pt-2">
            <Link href="/salarios" className="px-3.5 py-2 bg-gray-950 border border-gray-800 text-indigo-300 rounded-xl hover:bg-indigo-900/40 hover:text-white transition-all">
              💰 Calculadora Salarial General
            </Link>
            <Link href="/recursos/guia-salarios-it" className="px-3.5 py-2 bg-gray-950 border border-gray-800 text-indigo-300 rounded-xl hover:bg-indigo-900/40 hover:text-white transition-all">
              📘 Guía Completa de Salarios IT
            </Link>
            <Link href="/empresas-remotas" className="px-3.5 py-2 bg-gray-950 border border-gray-800 text-emerald-300 rounded-xl hover:bg-emerald-900/40 hover:text-white transition-all">
              🏠 Ranking de Empresas en Remoto
            </Link>
            <Link href="/comparar/madrid-vs-barcelona" className="px-3.5 py-2 bg-gray-950 border border-gray-800 text-purple-300 rounded-xl hover:bg-purple-900/40 hover:text-white transition-all">
              ⚖️ Comparativa Madrid vs Barcelona
            </Link>
            <Link href="/glosario" className="px-3.5 py-2 bg-gray-950 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-all">
              📖 Glosario de Términos IT
            </Link>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t border-gray-900 py-10 text-center text-gray-505 text-sm bg-gray-950/80">
        <p className="mb-2">
          © {new Date().getFullYear()} Portal Trabajo IT · Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Volver al buscador</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
          <span>·</span>
          <Link href="/publicar-oferta" className="hover:text-white transition-colors">Publicar Oferta</Link>
        </div>
      </footer>
    </main>
  );
}

export default function InformeMercadoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <InformeMercadoContent />
    </Suspense>
  );
}
