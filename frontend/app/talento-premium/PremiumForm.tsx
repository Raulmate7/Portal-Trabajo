"use client";

import { useState } from "react";
import { submitPremiumLead } from "@/app/actions";
import Link from "next/link";

export default function PremiumForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    formData.append("pathname", "/talento-premium");

    const result = await submitPremiumLead(formData);

    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  };

  if (status === "success") {
    return (
      <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-amber-500/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ⭐
        </div>
        <h2 className="text-2xl md:text-3xl font-black mb-4">
          ¡Perfil recibido!
        </h2>
        <p className="text-gray-300 mb-8 max-w-md mx-auto">
          {message} Nos pondremos en contacto contigo en los próximos días cuando encontremos ofertas que encajen con tu perfil.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-amber-500 hover:text-amber-400 font-bold"
        >
          ← Volver al formulario
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-2xl">
      <h2 className="text-2xl md:text-3xl font-black text-center mb-2">
        Únete al programa
      </h2>
      <p className="text-gray-400 text-center mb-8 text-sm">
        Déjanos tus datos y te contactaremos de forma confidencial con ofertas de +45K.
      </p>

      {status === "error" && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={status === "loading"}
            placeholder="Ej: Ana García"
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
            Email profesional
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={status === "loading"}
            placeholder="ana@empresa.com"
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="stack" className="block text-sm font-medium text-gray-300 mb-1.5">
            Stack principal
          </label>
          <input
            id="stack"
            name="stack"
            type="text"
            required
            disabled={status === "loading"}
            placeholder="Ej: React, Node.js, AWS"
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-300 mb-1.5">
            Años de experiencia
          </label>
          <select
            id="experience"
            name="experience"
            required
            disabled={status === "loading"}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
          >
            <option value="">Selecciona...</option>
            <option value="2-4">2 – 4 años (Mid)</option>
            <option value="4-7">4 – 7 años (Senior)</option>
            <option value="7+">7+ años (Staff / Lead)</option>
          </select>
        </div>

        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300 mb-1.5">
            LinkedIn (opcional)
          </label>
          <input
            id="linkedin"
            name="linkedin"
            type="url"
            disabled={status === "loading"}
            placeholder="https://linkedin.com/in/tu-perfil"
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
          />
        </div>

        {/* Consentimiento expreso y Primera Capa Informativa RGPD */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              name="privacy_accepted"
              required
              defaultChecked={false}
              disabled={status === "loading"}
              className="mt-0.5 h-4 w-4 rounded border-gray-700 bg-gray-800 text-amber-500 focus:ring-amber-500/50"
            />
            <span>
              He leído y acepto la{" "}
              <Link href="/privacy" target="_blank" className="text-amber-400 hover:underline">
                Política de Privacidad
              </Link>{" "}
              y consiento el tratamiento de mis datos de perfil para recibir ofertas laborales relevantes. *
            </span>
          </label>
        </div>

        {/* Primera capa informativa AEPD (RGPD Art. 13) */}
        <div className="p-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-[11px] text-gray-400 space-y-1">
          <p className="font-semibold text-gray-300">Información básica sobre protección de datos (RGPD):</p>
          <ul className="space-y-0.5 list-disc pl-4 text-gray-400">
            <li><strong>Responsable:</strong> Portal Trabajo IT.</li>
            <li><strong>Finalidad:</strong> Gestión y valoración de tu perfil profesional para comunicarte ofertas de empleo acordes a tu stack y experiencia.</li>
            <li><strong>Legitimación:</strong> Tu consentimiento expreso (Art. 6.1.a RGPD).</li>
            <li><strong>Destinatarios:</strong> No se cederán datos a empresas contratadoras sin tu visto bueno previo y confidencial.</li>
            <li><strong>Decisiones automatizadas:</strong> No se adoptan decisiones automatizadas ni perfiles discriminatorios con efectos jurídicos sin intervención humana (Art. 22 RGPD). La adecuación y recomendación se realiza bajo supervisión humana.</li>
            <li><strong>Derechos:</strong> Acceso, rectificación, supresión y otros derechos detallados en nuestra{" "}
              <Link href="/privacy" target="_blank" className="text-amber-400 underline">Política de Privacidad</Link>.
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-black text-base py-4 px-6 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {status === "loading" ? "Enviando..." : "Enviar mi perfil 🚀"}
        </button>
      </form>
    </div>
  );
}
