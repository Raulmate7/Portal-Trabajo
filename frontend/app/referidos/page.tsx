"use client";

import { useState } from "react";
import Link from "next/link";
import { getReferralStats } from "@/app/actions";

export default function ReferidosPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ count: number; success: boolean } | null>(null);
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setStats(null);
    setCopied(false);

    try {
      const res = await getReferralStats(email);
      setStats(res);
      
      if (res.success) {
        // Generar enlace base64
        const code = btoa(email.trim().toLowerCase());
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://portalempleoit.com";
        setReferralLink(`${baseUrl}/ref/${code}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white py-16 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-gray-950 to-purple-950/20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-2xl mx-auto text-center mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
          ← Volver al buscador
        </Link>
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
          Programa de{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Referidos IT
          </span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto">
          Comparte tu enlace con otros programadores. Si 3 amigos se suscriben, conseguiréis acceso prioritario y ventajas premium.
        </p>
      </div>

      <div className="relative max-w-xl mx-auto bg-gray-900/60 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <h2 className="text-xl font-bold mb-6 text-center">Consigue tu enlace de referido</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ref-email" className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Tu Email de Suscriptor
            </label>
            <input
              id="ref-email"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg disabled:opacity-50 text-sm"
          >
            {loading ? "Consultando..." : "Generar mi Enlace"}
          </button>
        </form>

        {stats && (
          <div className="mt-8 pt-8 border-t border-gray-800 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {stats.success ? (
              <>
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider block">Amigos Invitados</span>
                    <span className="text-3xl font-black text-white block mt-1">{stats.count}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Estado de Recompensa</span>
                    <span className="text-sm font-semibold block mt-1 text-gray-200">
                      {stats.count >= 3 ? "🎉 ¡PREMIUM ACTIVADO!" : `${stats.count}/3 registrados`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <span className="block text-xs font-bold text-gray-400 uppercase">Tu Enlace Personal</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-indigo-300 font-mono text-xs select-all outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      type="button"
                      className={`px-4 rounded-xl font-bold transition-all text-xs shrink-0 flex items-center gap-1 ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {copied ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-red-400 text-sm text-center font-medium">
                ⚠️ Ese correo no está suscrito a nuestro portal. Suscríbete en la página principal primero.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs text-gray-500">
        <div>
          <span className="text-2xl block mb-2">🔗</span>
          <h4 className="font-bold text-gray-300 mb-1">1. Comparte</h4>
          <p>Envía tu enlace personalizado a compañeros de profesión o compártelo en redes sociales.</p>
        </div>
        <div>
          <span className="text-2xl block mb-2">⚡</span>
          <h4 className="font-bold text-gray-300 mb-1">2. Regístrate</h4>
          <p>Tus amigos se suscriben gratis para recibir ofertas IT filtradas por stack.</p>
        </div>
        <div>
          <span className="text-2xl block mb-2">🎁</span>
          <h4 className="font-bold text-gray-300 mb-1">3. Gana</h4>
          <p>Cuando llegues a 3 referidos, activamos el estatus destacado y ventajas premium para todos.</p>
        </div>
      </div>
    </main>
  );
}
