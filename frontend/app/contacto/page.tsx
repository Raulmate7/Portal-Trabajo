import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";

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
            Si deseas patrocinar una oferta de empleo para posicionarla en la parte superior del portal y recibir máxima visibilidad ante candidatos cualificados, puedes hacerlo directamente desde nuestra sección de <a href="/publicar-oferta" className="text-indigo-600 hover:underline font-medium">Publicar Oferta</a>. Para planes personalizados de contratación de volumen, escríbenos un correo a la dirección de arriba.
          </p>
        </div>
      </div>
    </div>
  );
}
