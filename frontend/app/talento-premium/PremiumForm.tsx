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

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 font-black text-base py-4 px-6 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {status === "loading" ? "Enviando..." : "Enviar mi perfil 🚀"}
        </button>

        <p className="text-center text-gray-500 text-xs mt-3">
          No compartiremos tus datos con nadie sin tu consentimiento.{' '}
          <Link href="/privacy" className="text-indigo-400 hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </form>
    </div>
  );
}
