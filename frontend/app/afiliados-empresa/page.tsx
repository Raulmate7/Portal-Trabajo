'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerRecruiterAffiliate } from '@/app/actions';

export default function AfiliadosEmpresaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{
    code: string;
    referrals: Array<{ referred_company_name: string; commission_paid: boolean; created_at: string }>;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await registerRecruiterAffiliate(email.trim());
      if (res.success && res.code) {
        setResult({
          code: res.code,
          referrals: res.referrals || [],
        });
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al unirse al programa.');
      }
    } catch (err) {
      setErrorMsg('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function getAffiliateLink() {
    if (!result) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://portalempleoit.com';
    return `${baseUrl}/publicar-oferta?ref=${result.code}`;
  }

  function handleCopy() {
    const link = getAffiliateLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-6 uppercase tracking-wider">
            🤝 PROGRAMA DE AFILIADOS B2B
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Gana un <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">20% de Comisión</span><br />
            Recomendando Empresas
          </h1>
          <p className="text-base md:text-lg text-gray-405 max-w-2xl mx-auto leading-relaxed">
            ¿Conoces empresas que busquen desarrolladores? Invítalas a publicar sus ofertas de trabajo destacadas en Portal Trabajo IT. Te pagamos el 20% de cada publicación realizada bajo tu recomendación.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full">
        <h2 className="text-xl font-bold mb-8 text-center text-gray-250">¿Cómo Funciona el Programa?</h2>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 text-center space-y-3">
            <span className="text-3xl block">1️⃣</span>
            <h3 className="font-bold text-white">Consigue tu Enlace</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Registra tu correo electrónico abajo para generar al instante tu código promocional y enlace personalizado de afiliado.</p>
          </div>
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 text-center space-y-3">
            <span className="text-3xl block">2️⃣</span>
            <h3 className="font-bold text-white">Recomienda a Empresas</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Comparte tu enlace con departamentos de recursos humanos, founders o reclutadores que estén contratando personal tecnológico.</p>
          </div>
          <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 text-center space-y-3">
            <span className="text-3xl block">3️⃣</span>
            <h3 className="font-bold text-white">Recibe tus Comisiones</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Cuando una empresa recomendada adquiera un plan destacado (Pro a 19€ o Enterprise a 49€), recibirás tu comisión vía PayPal/Stripe.</p>
          </div>
        </div>

        {/* Registro / Formulario */}
        <div className="max-w-xl mx-auto bg-gray-900/60 border border-gray-800 rounded-3xl p-8 shadow-xl relative mb-12">
          {!result ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Únete al Programa</h3>
                <p className="text-gray-450 text-xs mt-1">Introduce tu correo para obtener tu panel de afiliado y empezar a recomendar.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-550 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-xs"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-650 hover:from-purple-400 hover:to-indigo-550 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/10 disabled:opacity-60 text-xs cursor-pointer"
                >
                  {loading ? 'Generando código...' : 'Unirme al Programa →'}
                </button>
              </form>

              {errorMsg && <p className="text-red-400 text-xs text-center font-medium">{errorMsg}</p>}
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">¡Ya eres afiliado B2B!</span>
                <h3 className="text-lg font-bold text-white mt-1">Tu Código: {result.code}</h3>
              </div>

              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Enlace personalizado a compartir</span>
                <input
                  type="text"
                  readOnly
                  value={getAffiliateLink()}
                  className="w-full text-center bg-transparent text-indigo-300 font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="mt-2 py-1.5 px-4 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? '¡Copiado! ✓' : 'Copiar Enlace'}
                </button>
              </div>

              {/* Estadísticas de referidos */}
              <div className="border-t border-gray-800/80 pt-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Historial de Ventas y Comisiones</h4>
                {result.referrals.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Aún no has referido a ninguna empresa pagadora. ¡Comparte tu enlace para empezar!</p>
                ) : (
                  <div className="overflow-hidden border border-gray-850 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-950 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-850">
                          <th className="p-3">Empresa Referida</th>
                          <th className="p-3">Fecha</th>
                          <th className="p-3 text-right">Comisión</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-gray-300">
                        {result.referrals.map((ref, idx) => (
                          <tr key={idx} className="border-b border-gray-850/50 hover:bg-gray-900/20">
                            <td className="p-3 font-semibold">{ref.referred_company_name}</td>
                            <td className="p-3 text-gray-500">{new Date(ref.created_at).toLocaleDateString('es-ES')}</td>
                            <td className="p-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${ref.commission_paid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {ref.commission_paid ? 'Pagada ✓' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
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
