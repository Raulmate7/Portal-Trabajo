import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Contacto | Portal Trabajo IT',
  description: 'Ponte en contacto con el equipo de Portal Trabajo IT para sugerencias, soporte o publicidad.',
  alternates: {
    canonical: '/contacto',
  },
};

export default function ContactoPage() {
  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Contacto' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
        📬 Contacta con Nosotros
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 text-gray-700">
        <p className="text-sm md:text-base leading-relaxed">
          ¿Tienes alguna duda, sugerencia o propuesta de colaboración? ¿Quieres anunciar las ofertas de tu empresa en el portal? Estaremos encantados de atenderte.
        </p>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-center">
            <span className="text-2xl mb-2">📧 Correo Electrónico</span>
            <a 
              href="mailto:contacto@portalempleoit.com" 
              className="text-indigo-650 hover:underline font-semibold text-sm break-all"
            >
              contacto@portalempleoit.com
            </a>
            <span className="text-[10px] text-gray-500 mt-1">Respondemos en menos de 24 horas laborables</span>
          </div>

          <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-center">
            <span className="text-2xl mb-2">✈️ Canal de Telegram</span>
            <a 
              href="https://t.me/PortalDeTrabajo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-650 hover:underline font-semibold text-sm"
            >
              @PortalDeTrabajo
            </a>
            <span className="text-[10px] text-gray-500 mt-1">Únete a nuestra comunidad activa</span>
          </div>
        </div>

        {/* Content Guidelines info */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-bold text-gray-900 text-sm mb-2">📢 Para Empresas y Reclutadores</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Si deseas patrocinar una oferta de empleo para posicionarla en la parte superior del portal y recibir máxima visibilidad ante candidatos cualificados, puedes hacerlo directamente desde nuestra sección de <Link href="/publicar-oferta" className="text-indigo-600 hover:underline font-medium">Publicar Oferta</Link>. Para planes personalizados de contratación de volumen, escríbenos un correo a la dirección de arriba.
          </p>
        </div>

        {/* Cláusula Informativa de Protección de Datos (RGPD Art. 13) */}
        <div className="border-t border-gray-100 pt-6">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 text-xs text-gray-500 space-y-1.5 leading-relaxed">
            <h4 className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
              <span>🛡️</span> Información Básica sobre Protección de Datos (RGPD / LOPDGDD)
            </h4>
            <p>
              <strong>Responsable:</strong> Portal Trabajo IT.
            </p>
            <p>
              <strong>Finalidad:</strong> Atender y resolver tus consultas, propuestas de colaboración, solicitudes comerciales o incidencias remitidas por correo electrónico.
            </p>
            <p>
              <strong>Legitimación:</strong> Tu consentimiento al remitir voluntariamente la consulta y el interés legítimo en atender las comunicaciones recibidas (Art. 6.1.a y 6.1.f RGPD).
            </p>
            <p>
              <strong>Destinatarios:</strong> No se cederán datos a terceros salvo imperativo legal o soporte técnico directo del servidor de correo.
            </p>
            <p>
              <strong>Plazo de conservación:</strong> Los datos se conservarán durante el tiempo indispensable para atender tu solicitud y cumplir con las responsabilidades legales aplicables.
            </p>
            <p>
              <strong>Derechos:</strong> Tienes derecho a acceder, rectificar, limitar y suprimir tus datos solicitándolo a través del propio correo de contacto o consultando nuestra{' '}
              <Link href="/privacy" className="text-indigo-600 underline font-medium">
                Política de Privacidad
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
