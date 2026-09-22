"use client";

import { useState, useEffect } from "react";
import { submitSponsoredJob } from "@/app/actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const jobSchema = z.object({
  company_name: z.string().min(2, "El nombre de la empresa es muy corto"),
  company_email: z.string().email("Correo electrónico inválido"),
  company_phone: z.string().optional(),
  job_title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  job_location: z.string().min(2, "Especifica una ubicación"),
  job_salary: z.string().optional(),
  job_description: z.string().min(50, "La descripción debe tener al menos 50 caracteres"),
  job_url: z.string().url("Debe ser una URL válida (ej. https://...)")
});
type JobFormValues = z.infer<typeof jobSchema>;

export default function PublishForm() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const free = searchParams.get("free") === "true";
  const urlPlan = searchParams.get("plan");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"basico" | "destacado_basico" | "destacado_pro" | "destacado_enterprise">("destacado_pro");

  useEffect(() => {
    if (urlPlan && ["basico", "destacado_basico", "destacado_pro", "destacado_enterprise"].includes(urlPlan)) {
      setSelectedPlan(urlPlan as any);
    }
  }, [urlPlan]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
  });

  const isLoading = status === "loading" || isSubmitting;

  const onSubmitForm = async (data: JobFormValues) => {
    setStatus("loading");
    setMessage("");

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
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
      try {
        const refCode = searchParams.get("ref");
        const jobData = {
          title: data.job_title,
          company: data.company_name,
          location: data.job_location,
          salary: data.job_salary,
          description_snippet: data.job_description,
          url_source: data.job_url,
          category: "Otros",
          plan: selectedPlan,
          affiliate_code: refCode || undefined,
        };

        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });

        const resData = await res.json();
        if (resData.url) {
          window.location.href = resData.url;
        } else {
          throw new Error(resData.error || "No se pudo iniciar la pasarela de Stripe");
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
            Si deseas darle el máximo alcance y colocarla arriba, puedes destacarla eligiendo uno de nuestros planes premium.
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

  const getPlanPrice = () => {
    if (selectedPlan === "destacado_basico") return "9€";
    if (selectedPlan === "destacado_pro") return "19€";
    if (selectedPlan === "destacado_enterprise") return "49€";
    return "Gratis";
  };

  return (
    <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-2xl">
      <h2 className="text-2xl md:text-3xl font-black text-center mb-2">
        Publicar tu oferta
      </h2>
      <p className="text-gray-400 text-center mb-8 text-sm">
        Rellena los datos de tu oferta y selecciona el plan de visibilidad.
      </p>

      {/* Plan Selector */}
      <div className="space-y-3.5 mb-8">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selecciona tu Plan de Publicación</label>
        
        {/* Plan Gratis */}
        <button
          type="button"
          onClick={() => setSelectedPlan("basico")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-4 ${
            selectedPlan === "basico"
              ? "border-indigo-500 bg-indigo-500/10 text-white"
              : "border-gray-800 hover:border-gray-700 text-gray-300"
          }`}
        >
          <div>
            <span className="block text-sm font-bold">📋 Básico</span>
            <span className="block text-xs text-gray-400 mt-0.5">Listado regular por 30 días sin destaque ni prioridad</span>
          </div>
          <span className="text-lg font-black shrink-0">Gratis</span>
        </button>

        {/* Plan Destacado Básico */}
        <button
          type="button"
          onClick={() => setSelectedPlan("destacado_basico")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-4 ${
            selectedPlan === "destacado_basico"
              ? "border-amber-500 bg-amber-500/10 text-white"
              : "border-gray-800 hover:border-gray-700 text-gray-300"
          }`}
        >
          <div>
            <span className="block text-sm font-bold">⚡ Destacado Básico</span>
            <span className="block text-xs text-gray-400 mt-0.5">Fijada arriba en búsquedas y diseño premium durante 15 días</span>
          </div>
          <span className="text-lg font-black text-amber-400 shrink-0">9€</span>
        </button>

        {/* Plan Destacado Pro */}
        <button
          type="button"
          onClick={() => setSelectedPlan("destacado_pro")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-4 ${
            selectedPlan === "destacado_pro"
              ? "border-amber-500 bg-amber-500/10 text-white"
              : "border-gray-800 hover:border-gray-700 text-gray-300"
          }`}
        >
          <div>
            <span className="block text-sm font-bold">⭐ Destacado Pro</span>
            <span className="block text-xs text-gray-400 mt-0.5">Destaque 30d + Inclusión en la Newsletter semanal (+8.700 devs)</span>
          </div>
          <span className="text-lg font-black text-amber-400 shrink-0">19€</span>
        </button>

        {/* Plan Destacado Enterprise */}
        <button
          type="button"
          onClick={() => setSelectedPlan("destacado_enterprise")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-4 ${
            selectedPlan === "destacado_enterprise"
              ? "border-purple-500 bg-purple-500/10 text-white"
              : "border-gray-800 hover:border-gray-700 text-gray-300"
          }`}
        >
          <div>
            <span className="block text-sm font-bold">🚀 Enterprise</span>
            <span className="block text-xs text-gray-400 mt-0.5">Destaque 30d + Newsletter exclusiva + Telegram + Redes Sociales</span>
          </div>
          <span className="text-lg font-black text-purple-400 shrink-0">49€</span>
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

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
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
                {...register("company_name")}
                type="text"
                disabled={isLoading}
                placeholder="Ej: Acme Technologies"
                className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 ${errors.company_name ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
              />
              {errors.company_name && <p className="text-red-500 text-xs mt-1.5">{errors.company_name.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email de contacto
                </label>
                <input
                  id="company_email"
                  {...register("company_email")}
                  type="email"
                  disabled={isLoading}
                  placeholder="rrhh@empresa.com"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 ${errors.company_email ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
                />
                {errors.company_email && <p className="text-red-500 text-xs mt-1.5">{errors.company_email.message}</p>}
              </div>
              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Teléfono (opcional)
                </label>
                <input
                  id="company_phone"
                  {...register("company_phone")}
                  type="tel"
                  disabled={isLoading}
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
                {...register("job_title")}
                type="text"
                disabled={isLoading}
                placeholder="Ej: Senior React Developer"
                className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 ${errors.job_title ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
              />
              {errors.job_title && <p className="text-red-500 text-xs mt-1.5">{errors.job_title.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="job_location" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Ubicación
                </label>
                <input
                  id="job_location"
                  {...register("job_location")}
                  type="text"
                  disabled={isLoading}
                  placeholder="Ej: Madrid / Remoto"
                  className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 ${errors.job_location ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
                />
                {errors.job_location && <p className="text-red-500 text-xs mt-1.5">{errors.job_location.message}</p>}
              </div>
              <div>
                <label htmlFor="job_salary" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Salario (opcional)
                </label>
                <input
                  id="job_salary"
                  {...register("job_salary")}
                  type="text"
                  disabled={isLoading}
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
                {...register("job_description")}
                disabled={isLoading}
                rows={5}
                placeholder="Describe las responsabilidades, requisitos y beneficios..."
                className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 resize-none ${errors.job_description ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
              />
              {errors.job_description && <p className="text-red-500 text-xs mt-1.5">{errors.job_description.message}</p>}
            </div>
            <div>
              <label htmlFor="job_url" className="block text-sm font-medium text-gray-300 mb-1.5">
                URL de candidatura
              </label>
              <input
                id="job_url"
                {...register("job_url")}
                type="url"
                disabled={isLoading}
                placeholder="https://tu-empresa.com/careers/oferta-123"
                className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 ${errors.job_url ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-indigo-500'}`}
              />
              {errors.job_url && <p className="text-red-500 text-xs mt-1.5">{errors.job_url.message}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full font-black text-base py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 ${
            selectedPlan !== "basico"
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 hover:from-amber-300 hover:to-yellow-400 shadow-amber-500/20 hover:shadow-amber-500/40"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/20 hover:shadow-indigo-500/40"
          }`}
        >
          {isLoading
            ? "Enviando..."
            : selectedPlan === "basico"
            ? "Solicitar oferta Básica (Gratis)"
            : `Pagar y Destacar Oferta (${getPlanPrice()}) 💳`}
        </button>

        <p className="text-center text-gray-500 text-xs mt-3">
          Procesamiento de pago seguro mediante Stripe.
        </p>
      </form>
    </div>
  );
}
