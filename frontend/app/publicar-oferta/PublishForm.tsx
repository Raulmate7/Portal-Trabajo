"use client";

import { useState, useEffect } from "react";
import { submitSponsoredJob } from "@/app/actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isSafeStripeRedirectUrl } from "@/lib/urlSafety";
import { VALID_JOB_PLAN_IDS, JOB_PRICING_PLANS } from "@/lib/pricingPlans";
import { buildPayPalCheckoutUrl } from "@/lib/paypal";

const jobSchema = z.object({
  company_name: z.string().min(2, "El nombre de la empresa o razón social es muy corto"),
  company_nif: z.string().optional(),
  company_fiscal_address: z.string().optional(),
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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  // VULN-22: Validación estricta del plan seleccionado vía parámetro de consulta
  useEffect(() => {
    if (urlPlan) {
      const normalized = urlPlan.trim().toLowerCase();
      if (normalized === "basico" || VALID_JOB_PLAN_IDS.has(normalized)) {
        setSelectedPlan(normalized as any);
      }
    }
  }, [urlPlan]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
  });

  const isLoading = status === "loading" || isSubmitting;

  const onSubmitForm = async (data: JobFormValues) => {
    // VULN-21: Trampa honeypot silenciosa para mitigar bots en envíos gratuitos
    if (honeypot) {
      setStatus("success");
      setMessage("Tu solicitud ha sido recibida y está en proceso de revisión.");
      return;
    }

    if (!privacyAccepted) {
      setStatus("error");
      setMessage("Debes aceptar la Política de Privacidad para continuar.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.append("plan", selectedPlan);
    formData.append("website_hp", honeypot);
    formData.append("privacy_accepted", "true");

    if (selectedPlan === "basico") {
      const result = await submitSponsoredJob(formData);
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        setStatus(result.success ? "success" : "error");
        setMessage(result.message);
      }
    } else {
      if (!waiverAccepted) {
        setStatus("error");
        setMessage("Debes aceptar la renuncia expresa al derecho de desistimiento para la difusión inmediata del anuncio de empleo (Art. 103.m TRLGDCU).");
        return;
      }

      if (!data.company_nif || data.company_nif.trim().length < 5 || !data.company_fiscal_address || data.company_fiscal_address.trim().length < 5) {
        setStatus("error");
        setMessage("Para planes de pago es obligatorio indicar el NIF/CIF y domicilio fiscal de la empresa o profesional para la emisión de factura legal (RD 1619/2012).");
        return;
      }

      try {
        // 1. Guardar la oferta en la base de datos como solicitud pendiente
        const result = await submitSponsoredJob(formData);
        if (!result.success) {
          throw new Error(result.message || "No se pudo registrar la oferta en el sistema.");
        }

        // 2. Redirigir a PayPal con desglose de IVA (21%) y dirección de facturación (RD 1619/2012)
        const planConfig = JOB_PRICING_PLANS[selectedPlan];
        const price = planConfig?.priceEur || 19;
        const planName = planConfig?.name || "Oferta Destacada";

        const paypalUrl = buildPayPalCheckoutUrl({
          amount: price,
          itemName: `${planName} - Portal Trabajo IT ("${data.job_title}")`,
          returnUrl: `${window.location.origin}/publicar-oferta?success=true&plan=${selectedPlan}`,
          cancelUrl: `${window.location.origin}/publicar-oferta?canceled=true`,
          custom: `job_${selectedPlan}_${data.company_email}_${data.company_nif.trim()}`,
          buyerEmail: data.company_email,
          applyVat21: true,
          requireBillingAddress: true,
        });

        window.location.href = paypalUrl;
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Error al conectar con la pasarela de PayPal.");
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
          Recibirás el justificante de la transacción y la factura legal correspondiente por correo electrónico.
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
            <span className="block text-xs text-gray-400 mt-0.5">Destaque 30d + Inclusión en la Newsletter semanal</span>
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
        {/* VULN-21: Campo trampa honeypot invisible para humanos pero capturado por bots spammers */}
        <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label htmlFor="company_website_hp">No rellenar</label>
          <input
            id="company_website_hp"
            name="company_website_hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

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
            {selectedPlan !== "basico" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-800/70">
                <div>
                  <label htmlFor="company_nif" className="block text-sm font-medium text-gray-300 mb-1.5">
                    NIF / CIF / VAT ID (Facturación RD 1619/2012) *
                  </label>
                  <input
                    id="company_nif"
                    {...register("company_nif")}
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="Ej: B12345678"
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="company_fiscal_address" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Domicilio Fiscal Completo *
                  </label>
                  <input
                    id="company_fiscal_address"
                    {...register("company_fiscal_address")}
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="Calle, Nº, CP, Ciudad, País"
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}
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
                <label htmlFor="job_salary" className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Rango salarial bruto anual</span>
                  <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">Recomendado (Directiva UE 2023/970)</span>
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

            {/* Aviso de Transparencia Retributiva y No Discriminación */}
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200/90 leading-relaxed space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <span aria-hidden="true">⚖️</span> Transparencia Retributiva e Igualdad (Directiva UE 2023/970 y Ley 15/2022)
              </div>
              <p className="text-[11px] text-gray-300">
                Se recomienda encarecidamente publicar el rango retributivo previsto. Conforme al Art. 5 de la Directiva (UE) 2023/970, los candidatos tienen derecho a conocer la retribución inicial antes de la entrevista y <strong>queda terminantemente prohibido preguntar al solicitante su historial salarial previo</strong>. Asimismo, la descripción de la vacante debe formularse con criterios objetivos y neutros sin discriminación directa o indirecta por razón de sexo, edad, origen o salud (Ley 15/2022).
              </p>
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

        {/* Consentimiento RGPD y Primera Capa Informativa */}
        <div className="space-y-3 pt-2 text-left">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/80">
            <input
              type="checkbox"
              id="privacy-accepted-job"
              required
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
            />
            <label htmlFor="privacy-accepted-job" className="text-xs text-gray-300 leading-tight cursor-pointer">
              He leído y acepto la{' '}
              <Link href="/privacy" target="_blank" className="text-indigo-400 underline hover:text-indigo-300">
                Política de Privacidad
              </Link>{' '}
              y las <Link href="/aviso-legal" target="_blank" className="text-indigo-400 underline hover:text-indigo-300">Condiciones Generales de Contratación</Link>. Declaro bajo mi responsabilidad que la vacante es veraz, no contiene requisitos discriminatorios contrarios a la Ley 15/2022 o a la legislación laboral (LISOS) y autorizo el tratamiento de los datos de contacto corporativos.*
            </label>
          </div>

          {/* Primera capa informativa AEPD */}
          <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-850 text-[10px] text-gray-400 leading-relaxed space-y-1">
            <p className="font-semibold text-gray-300">Información básica sobre protección de datos:</p>
            <ul className="list-disc pl-3.5 space-y-0.5 text-gray-400">
              <li><strong>Responsable:</strong> Portal Trabajo IT.</li>
              <li><strong>Finalidad:</strong> Moderación, publicación y gestión de la oferta de empleo, facturación y contacto con la empresa.</li>
              <li><strong>Legitimación:</strong> Ejecución de la relación precontractual / contractual (Art. 6.1.b RGPD).</li>
              <li><strong>Destinatarios:</strong> No se ceden datos de contacto a terceros; los datos públicos de la oferta serán visibles en el portal.</li>
              <li><strong>Derechos:</strong> Acceso, rectificación, supresión y demás derechos en contacto@portalempleoit.com (+ info en <Link href="/privacy" className="text-indigo-400 underline">Política de Privacidad</Link>).</li>
            </ul>
          </div>
        </div>

        {selectedPlan !== "basico" && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/80 text-left">
            <input
              type="checkbox"
              id="waiver-job"
              required
              checked={waiverAccepted}
              onChange={(e) => setWaiverAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
            />
            <label htmlFor="waiver-job" className="text-xs text-gray-300 leading-tight cursor-pointer">
              Solicito la publicación y difusión inmediata del anuncio de empleo y <strong className="text-white">renuncio expresamente a mi derecho de desistimiento de 14 días</strong> una vez iniciada la ejecución del servicio de difusión (Art. 103.m TRLGDCU). Facturación B2B.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full font-black text-base py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer ${
            selectedPlan !== "basico"
              ? "bg-[#0070ba] hover:bg-[#003087] text-white shadow-blue-900/30 hover:shadow-blue-900/50"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/20 hover:shadow-indigo-500/40"
          }`}
        >
          {isLoading
            ? "Enviando..."
            : selectedPlan === "basico"
            ? "Solicitar oferta Básica (Gratis)"
            : `Pagar y Destacar con PayPal (${getPlanPrice()}) 🅿️`}
        </button>

        <p className="text-center text-gray-500 text-xs mt-3">
          {selectedPlan !== "basico"
            ? "Procesamiento de pago seguro e instantáneo mediante PayPal (saldo o tarjeta)."
            : "Revisión manual y moderación previa por nuestro equipo."}
        </p>
      </form>
    </div>
  );
}
