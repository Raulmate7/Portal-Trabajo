"use client";

import { useState } from "react";
import { submitSponsoredJob } from "@/app/actions";

export default function PublishForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"basico" | "destacado">("destacado");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    formData.append("plan", selectedPlan);

    const result = await submitSponsoredJob(formData);

    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
  };

  if (status === "success") {
    return (
      <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-green-500/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ✓
        </div>
        <h2 className="text-2xl md:text-3xl font-black mb-4">
          ¡Solicitud recibida!
        </h2>
        <p className="text-gray-300 mb-4 max-w-md mx-auto">
          {message}
        </p>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
          Te contactaremos en menos de 24 horas para confirmar los detalles y activar tu oferta.
        </p>
        <button
          onClick={() => { setStatus("idle"); setMessage(""); }}
          className="text-indigo-400 hover:text-indigo-300 font-bold"
        >
          ← Enviar otra oferta
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-2xl">
      <h2 className="text-2xl md:text-3xl font-black text-center mb-2">
        Publicar tu oferta
      </h2>
      <p className="text-gray-400 text-center mb-8 text-sm">
        Rellena los datos y nos pondremos en contacto contigo para activarla.
      </p>

      {/* Plan Selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          type="button"
          onClick={() => setSelectedPlan("basico")}
          className={`p-4 rounded-xl border-2 text-center transition-all ${
            selectedPlan === "basico"
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-gray-700 hover:border-gray-600"
          }`}
        >
          <span className="block text-sm font-bold">Básico</span>
          <span className="block text-xl font-black mt-1">49€</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedPlan("destacado")}
          className={`p-4 rounded-xl border-2 text-center transition-all ${
            selectedPlan === "destacado"
              ? "border-amber-500 bg-amber-500/10"
              : "border-gray-700 hover:border-gray-600"
          }`}
        >
          <span className="block text-sm font-bold">⭐ Destacado</span>
          <span className="block text-xl font-black mt-1">149€</span>
        </button>
      </div>

      {status === "error" && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos de la empresa */}
        <div className="pb-4 mb-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Datos de contacto</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nombre de la empresa
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                disabled={status === "loading"}
                placeholder="Ej: Acme Technologies"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email de contacto
                </label>
                <input
                  id="company_email"
                  name="company_email"
                  type="email"
                  required
                  disabled={status === "loading"}
                  placeholder="rrhh@empresa.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Teléfono (opcional)
                </label>
                <input
                  id="company_phone"
                  name="company_phone"
                  type="tel"
                  disabled={status === "loading"}
                  placeholder="+34 600 123 456"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Datos de la oferta */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Datos de la oferta</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-300 mb-1.5">
                Título del puesto
              </label>
              <input
                id="job_title"
                name="job_title"
                type="text"
                required
                disabled={status === "loading"}
                placeholder="Ej: Senior React Developer"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="job_location" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Ubicación
                </label>
                <input
                  id="job_location"
                  name="job_location"
                  type="text"
                  required
                  disabled={status === "loading"}
                  placeholder="Ej: Madrid / Remoto"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="job_salary" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Salario (opcional)
                </label>
                <input
                  id="job_salary"
                  name="job_salary"
                  type="text"
                  disabled={status === "loading"}
                  placeholder="Ej: 40.000€ - 55.000€"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="job_description" className="block text-sm font-medium text-gray-300 mb-1.5">
                Descripción del puesto
              </label>
              <textarea
                id="job_description"
                name="job_description"
                required
                disabled={status === "loading"}
                rows={5}
                placeholder="Describe las responsabilidades, requisitos y beneficios..."
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50 resize-none"
              />
            </div>
            <div>
              <label htmlFor="job_url" className="block text-sm font-medium text-gray-300 mb-1.5">
                URL de candidatura
              </label>
              <input
                id="job_url"
                name="job_url"
                type="url"
                required
                disabled={status === "loading"}
                placeholder="https://tu-empresa.com/careers/oferta-123"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`w-full font-black text-base py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 ${
            selectedPlan === "destacado"
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 hover:from-amber-300 hover:to-yellow-400 shadow-amber-500/20 hover:shadow-amber-500/40"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/20 hover:shadow-indigo-500/40"
          }`}
        >
          {status === "loading"
            ? "Enviando..."
            : selectedPlan === "destacado"
            ? "Solicitar oferta Destacada ⭐"
            : "Solicitar oferta Básica"}
        </button>

        <p className="text-center text-gray-500 text-xs mt-3">
          Te contactaremos por email para confirmar y activar tu oferta.
        </p>
      </form>
    </div>
  );
}
