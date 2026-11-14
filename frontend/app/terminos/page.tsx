import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";
import { LEGAL_CONFIG } from "@/lib/legalConfig";

export const metadata: Metadata = {
  title: "Términos y Condiciones Generales de Contratación | Portal Trabajo IT",
  description: "Términos del servicio, condiciones de contratación de publicaciones para empresas, planes premium y desistimiento en Portal Trabajo IT.",
  alternates: {
    canonical: "/terminos",
  },
};

export default function TerminosPage() {
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Términos y Condiciones" }
  ];

  const { owner: legalOwner, nif: legalNif, address: legalAddress, email: legalEmail, registry: legalRegistry, domain } = LEGAL_CONFIG;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-6 text-gray-700 text-sm leading-relaxed mt-4">
          <header className="border-b border-gray-100 pb-5">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              📋 Términos y Condiciones Generales de Contratación
            </h1>
            <p className="text-xs text-gray-500">
              Regulación aplicable a los servicios digitales, metabuscador, suscripciones de candidatos y contratación de publicaciones empresariales en Portal Trabajo IT (TRLGDCU, LSSI-CE y Ley 15/2022).
            </p>
            <p className="text-xs text-indigo-650 font-semibold mt-1">
              Última actualización: Noviembre de 2026.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">1. Objeto y Datos del Prestador</h2>
            <p>
              Las presentes Condiciones Generales regulan el acceso, uso y contratación de los servicios prestados a través del sitio web <strong>{domain}</strong> por su titular:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Titular:</strong> {legalOwner}</li>
              <li><strong>NIF / CIF:</strong> {legalNif}</li>
              <li><strong>Domicilio:</strong> {legalAddress}</li>
              <li><strong>Datos registrales:</strong> {legalRegistry}</li>
              <li><strong>Correo Electrónico:</strong> {legalEmail}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">2. Servicios para Candidatos y Profesionales IT</h2>
            <p>
              El acceso al buscador de empleo, visualización de vacantes, calculadora salarial y guías de carrera es completamente <strong>gratuito e incondicional</strong> para los usuarios particulares.
            </p>
            <p>
              El servicio voluntario de <strong>Candidato Premium</strong> permite el acceso a recomendaciones exclusivas y priorización en ofertas mediante suscripción mensual (4,99 €/mes, IVA incluido). El usuario puede cancelar la suscripción en cualquier momento sin penalización ni permanencia desde su correo de confirmación o escribiendo a contacto@portalempleoit.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">3. Contratación de Publicaciones para Empresas (B2B)</h2>
            <p>
              Las empresas, consultoras y agencias de selección pueden contratar planes de difusión destacados (Básico, Pro o Enterprise) para publicar vacantes tecnológicas. Los precios se indican sin IVA (+21% legal aplicable) y se expide factura reglamentaria con arreglo al RD 1619/2012.
            </p>
            <p>
              Toda empresa contratante garantiza bajo su responsabilidad que la oferta de empleo es veraz, se ajusta a la legislación laboral y <strong>no contiene criterios discriminatorios</strong> prohibidos por la Ley 15/2022 o la Directiva (UE) 2023/970 de Transparencia Salarial.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">4. Excepción al Derecho de Desistimiento (Art. 103.m TRLGDCU)</h2>
            <p>
              En la adquisición de contenidos digitales sin soporte material (tales como el Informe de Mercado IT descargable de forma inmediata) o servicios cuya ejecución comienza instantáneamente con el previo consentimiento expreso del comprador, no será de aplicación el derecho de desistimiento de 14 días conforme al Art. 103 letra m) del TRLGDCU.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">5. Resolución de Litigios y Jurisdicción</h2>
            <p>
              Para consultar el clausulado completo de intermediación neutral, protocolo de retirada DSA o propiedad intelectual, puedes remitirte a nuestro{" "}
              <Link href="/aviso-legal" className="text-indigo-650 font-bold underline">
                Aviso Legal
              </Link>.
            </p>
            <p>
              <strong>Resolución extrajudicial de litigios de consumo (Ley 7/2017 y Directiva 2013/11/UE):</strong> Tras la clausura de la antigua plataforma europea ODR dispuesta por el Reglamento (UE) 2024/3228, puedes dirigir cualquier reclamación directa a nuestro servicio de atención en <strong>{legalEmail}</strong> (con respuesta en un plazo máximo de 15 días), así como acudir a las Juntas Arbitrales de Consumo competentes en España o a las entidades acreditadas de resolución alternativa de litigios en materia de consumo conforme a la Ley 7/2017.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

