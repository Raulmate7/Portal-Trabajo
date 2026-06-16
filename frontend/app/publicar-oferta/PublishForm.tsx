"use client";

import { useState } from "react";
import { submitSponsoredJob } from "@/app/actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PublishForm() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const free = searchParams.get("free") === "true";

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"basico" | "destacado">("destacado");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    formData.append("plan", selectedPlan);

    if (selectedPlan === "basico") {
      const result = await submitSponsoredJob(formData);
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        setStatus(result.success ? "success" : "error");
        setMessage(result.message);
      }
    } else {
      // Flujo de Stripe para Plan Destacado
      try {
        const jobData = {
          title: formData.get("job_title"),
          company: formData.get("company_name"),
          location: formData.get("job_location"),
          salary: formData.get("job_salary"),
          description_snippet: formData.get("job_description"),
          url_source: formData.get("job_url"),
          category: "Otros",
        };

        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobData),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url; // Redirigir a Stripe Checkout
        } else {
          throw new Error(data.error || "No se pudo iniciar la pasarela de Stripe");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Error de red al conectar con Stripe.");
      }
    }
  };

  if (success) {
    if (free) {
      return (
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-green-500/50 shadow-2xl text-center shadow-green-500/10">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🚀
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-4">
            ¡Oferta publicada con éxito!
          </h2>
          <p className="text-gray-300 mb-4 max-w-md mx-auto">
            Tu oferta de empleo ya está activa y visible para miles de desarrolladores en nuestro listado regular del buscador.
          </p>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
            Si deseas darle el máximo alcance y colocarla arriba, puedes destacarla por 39€ en futuras ofertas.
          </p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
            Ir al Buscador
          </Link>
        </div>
      );
    }

    return (
      <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-green-500/50 shadow-2xl text-center shadow-green-500/10">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ⭐
        </div>
        <h2 className="text-2xl md:text-3xl font-black mb-4">
          ¡Pago completado con éxito!
        </h2>
        <p className="text-gray-300 mb-4 max-w-md mx-auto">
          Tu oferta ha sido publicada y destacada en el portal. Aparecerá en las posiciones prioritarias inmediatamente.
        </p>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
          Recibirás el recibo de la transacción de Stripe por correo electrónico.
        </p>
        <Link href="/" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
          Ir al Buscador
        </Link>
      </div>
    );
  }

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
          Te contactaremos por email en menos de 24 horas para confirmar y activar tu oferta gratuita.
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
          <span className="block text-xl font-black mt-1">Gratis</span>
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
          <span className="block text-xl font-black mt-1">39€</span>
        </button>
      </div>

      {canceled && (
        <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-sm text-center font-medium">
          ⚠️ El pago ha sido cancelado o no se completó. Puedes volver a intentarlo cuando desees.
        </div>
      )}

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
