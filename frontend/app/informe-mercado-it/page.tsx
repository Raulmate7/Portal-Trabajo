'use client';

import { useState } from 'react';
import Link from 'next/link';
import { subscribeUser } from '@/app/actions';

export default function InformeMercadoPage() {
  // Free report (lead magnet) states
  const [freeEmail, setFreeEmail] = useState('');
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [freeError, setFreeError] = useState('');

  // Paid report states
  const [paidEmail, setPaidEmail] = useState('');
  const [reportType, setReportType] = useState<'full' | 'enterprise'>('full');
  const [paidLoading, setPaidLoading] = useState(false);
  const [paidError, setPaidError] = useState('');

  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freeEmail.trim()) return;

    setFreeLoading(true);
    setFreeError('');

    const formData = new FormData();
    formData.append('email', freeEmail.trim());
    formData.append('pathname', '/informe-mercado-it');
    formData.append('tech_keywords', 'reporte_mercado_2026');

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

    setPaidLoading(true);
    setPaidError('');

    try {
      const response = await fetch('/api/checkout/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: paidEmail.trim(),
          type: reportType,
        }),
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url; // Redirigir a Stripe Checkout
      } else {
        setPaidError(data.error || 'Ocurrió un error al procesar el pago.');
      }
    } catch (err) {
      setPaidError('Error de red. Inténtalo de nuevo.');
    } finally {
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
                Completo (9.99€)
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
                Empresa (49€)
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
            <form onSubmit={handlePaidCheckout} className="space-y-3">
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={paidEmail}
                onChange={(e) => setPaidEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-550 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
              />
              <button
                type="submit"
                disabled={paidLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors text-xs disabled:opacity-60 cursor-pointer"
              >
                {paidLoading ? 'Redirigiendo...' : `Comprar Informe (${reportType === 'full' ? '9.99€' : '49€'}) →`}
              </button>
            </form>
            {paidError && <p className="text-red-400 text-xs text-center mt-3 font-medium">{paidError}</p>}
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
