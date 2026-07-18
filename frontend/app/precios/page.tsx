'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PreciosPage() {
  const [candidateEmail, setCandidateEmail] = useState('');
  const [b2cLoading, setB2cLoading] = useState(false);
  const [b2cError, setB2cError] = useState('');

  async function handleCandidateSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateEmail.trim()) return;

    setB2cLoading(true);
    setB2cError('');

    try {
      const response = await fetch('/api/checkout/premium-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidateEmail.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setB2cError(data.error || 'Ocurrió un error al procesar el pago.');
      }
    } catch (err) {
      setB2cError('Error de red. Inténtalo de nuevo.');
    } finally {
      setB2cLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
      {/* Header / Hero */}
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

          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Tarifas y Planes de Reclutamiento IT
          </h1>
          <p className="text-base md:text-lg text-gray-405 max-w-xl mx-auto mb-4 leading-relaxed">
            Consigue el mejor talento de programación y tecnología en España. 
            Elige el plan de difusión y visibilidad que se adapte a tus necesidades de contratación.
          </p>
        </div>
      </section>

      {/* Planes Grid (B2B Empresas) */}
      <section className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <h2 className="text-xl font-bold mb-8 text-center text-gray-250">Para Empresas y Reclutadores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-16">
          
          {/* Plan Básico (Gratis) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-gray-750 transition-all">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Plan Regular</span>
              <h2 className="text-xl font-extrabold text-white">Básico</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-white">Gratis</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Ideal para startups en fase inicial o equipos que prueban la plataforma por primera vez.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                Publicación estándar por 30 días
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                Indexación en buscadores y sector IT
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 font-bold">✓</span>
                Enlace directo a tu ATS
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-700">✗</span>
                Sin prioridad de orden (destacado)
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-700">✗</span>
                Sin boletín ni canales de Telegram
              </li>
            </ul>
            <Link
              href="/publicar-oferta?plan=basico"
              className="mt-6 text-center py-2.5 px-4 rounded-xl border border-gray-750 text-white font-bold hover:bg-gray-800 transition-all text-sm"
            >
              Publicar Gratis
            </Link>
          </div>

          {/* Plan Destacado Básico (9€) */}
          <div className="bg-gray-900/60 border border-amber-500/30 rounded-2xl p-6 flex flex-col hover:border-amber-500/50 transition-all">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500/70 block mb-1">Destaque Corto</span>
              <h2 className="text-xl font-extrabold text-white">Destacado Básico</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-amber-400">9€</span>
                <span className="text-gray-500 text-xs ml-2 mb-1">/ 15 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Visibilidad destacada temporal para captación rápida a bajo coste.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Fijada arriba</strong> en el buscador por 15 días</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Diseño premium destacado con bordes dorados
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Badge visual &quot;⭐ Destacada&quot;
              </li>
              <li className="flex items-start gap-2 text-gray-650">
                <span className="text-gray-700">✗</span>
                Sin envío a Newsletter semanal
              </li>
            </ul>
            <Link
              href="/publicar-oferta?plan=destacado_basico"
              className="mt-6 text-center py-2.5 px-4 rounded-xl border border-amber-500/50 text-amber-400 font-bold hover:bg-amber-500/10 transition-all text-sm"
            >
              Destacar por 9€
            </Link>
          </div>

          {/* Plan Destacado Pro (19€) */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border-2 border-amber-500 rounded-2xl p-6 flex flex-col shadow-xl shadow-amber-500/5 hover:scale-[1.01] transition-all">
            <div className="absolute -top-3.5 left-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold shadow-md uppercase tracking-wider">
                Recomendado
              </span>
            </div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block mb-1">Mayor Conversión</span>
              <h2 className="text-xl font-extrabold text-white">Destacado Pro</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-amber-400">19€</span>
                <span className="text-gray-500 text-xs ml-2 mb-1">/ 30 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Consigue la mayor visibilidad del portal sumando difusión directa por email.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span><strong>Fijada arriba</strong> en el buscador por 30 días</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Inclusión en la <strong>Newsletter semanal (8.700+ devs)</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Alerta push inmediata a navegadores suscriptores
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                Badge visual &quot;⭐ Destacada&quot; en todo el portal
              </li>
            </ul>
            <Link
              href="/publicar-oferta?plan=destacado_pro"
              className="mt-6 text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 text-sm"
            >
              Destacar por 19€
            </Link>
          </div>

          {/* Plan Destacado Enterprise (49€) */}
          <div className="bg-gray-900/60 border border-purple-500/40 rounded-2xl p-6 flex flex-col hover:border-purple-500 transition-all">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">Cobertura Total</span>
              <h2 className="text-xl font-extrabold text-white">Enterprise</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-3xl font-black text-purple-400">49€</span>
                <span className="text-gray-500 text-xs ml-2 mb-1">/ 30 días</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Máxima difusión omnicanal y branding personalizado para reclutamiento intensivo.
            </p>
            <ul className="space-y-3.5 text-xs text-gray-300 flex-1 border-t border-gray-800/80 pt-6">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                <span><strong>Fijada arriba</strong> en el buscador por 30 días</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Inclusión destacada en Newsletter semanal
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Difusión en <strong>Telegram, LinkedIn, Threads y Mastodon</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                Badge de empresa verificada premium
              </li>
            </ul>
            <Link
              href="/publicar-oferta?plan=destacado_enterprise"
              className="mt-6 text-center py-2.5 px-4 rounded-xl border border-purple-500 text-purple-400 font-bold hover:bg-purple-500/10 transition-all text-sm"
            >
              Contratar por 49€
            </Link>
          </div>
        </div>

        {/* B2C Plan: Candidato Premium */}
        <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="space-y-4 max-w-xl">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider">
                🥇 Para Candidatos (B2C)
              </span>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Acceso Candidato Premium</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Acelera tu búsqueda de empleo tecnológico. Suscríbete para ver ofertas prioritarias 24 horas antes que el público general, alertas instantáneas en tu correo y acceso completo a datos salariales.
              </p>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Ver ofertas 24h antes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Alertas push & email ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Calculadora de sueldos avanzada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Soporte prioritario de CV
                </li>
              </ul>
            </div>

            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-6 w-full md:w-80 shrink-0 text-center space-y-4">
              <div>
                <span className="text-4xl font-black text-indigo-400">4.99€</span>
                <span className="text-gray-500 text-xs ml-1 font-bold">/ mes</span>
              </div>
              
              <form onSubmit={handleCandidateSubscribe} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-750 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                />
                
                <button
                  type="submit"
                  disabled={b2cLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold transition-all text-xs shadow-md shadow-indigo-500/10 disabled:opacity-60 cursor-pointer"
                >
                  {b2cLoading ? 'Procesando...' : 'Suscribirme Premium →'}
                </button>
              </form>
              
              {b2cError && <p className="text-red-400 text-[10px] font-medium leading-relaxed">{b2cError}</p>}
            </div>
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
