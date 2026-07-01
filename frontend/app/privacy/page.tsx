import Link from "next/link";
import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Privacidad | Portal Trabajo IT",
  description: "Información legal y transparencia sobre el tratamiento de datos personales en Portal Trabajo IT de acuerdo con el RGPD.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <Link href="/" className="text-indigo-650 hover:underline mb-6 inline-block font-semibold">
          ← Volver al inicio
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-550 mb-8 text-sm">Última actualización: 1 de Julio de 2026</p>
        
        <div className="prose text-gray-700 space-y-6 text-sm leading-relaxed font-sans">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Responsable del Tratamiento de Datos</h2>
            <p>
              En cumplimiento del Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), se informa que el responsable del tratamiento de los datos recopilados en este portal es:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Responsable:</strong> Raúl M.</li>
              <li><strong>Contacto de Privacidad:</strong> contacto@portalempleoit.com</li>
              <li><strong>Actividad principal:</strong> Agregador de empleo IT y calculadora de salarios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Información que recopilamos y Finalidad</h2>
            <p>Recopilamos la siguiente información según los servicios interactivos de la plataforma:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Suscripción al boletín:</strong> Correo electrónico proporcionado voluntariamente para el envío automático de ofertas de empleo del sector seleccionado.</li>
              <li><strong>Alertas Push (OneSignal):</strong> Token anónimo de notificación asignado por el navegador para enviar notificaciones de ofertas.</li>
              <li><strong>Publicar Oferta (empresas):</strong> Nombre de la empresa, email de contacto y URL de candidatura para la prestación del servicio de patrocinio de empleo.</li>
              <li><strong>Opiniones de empresas (UGC):</strong> Nombre o alias y texto de la opinión proporcionados libremente por el usuario para su indexación pública.</li>
            </ul>
            <p className="mt-2">
              Los datos se tratan bajo la base legal del <strong>consentimiento del interesado</strong> (suscripciones y opiniones) y la <strong>ejecución de un contrato</strong> (patrocinio de ofertas de pago). Jamás cederemos ni venderemos tu información personal a terceros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Google AdSense y Google Analytics</h2>
            <p>
              Este sitio web utiliza cookies de terceros para analizar el tráfico y personalizar la publicidad contextual de Google AdSense:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Google Analytics:</strong> Recopila datos anónimos de comportamiento de usuario para optimizar el rendimiento y las páginas del portal.</li>
              <li><strong>Google AdSense:</strong> Google utiliza cookies para publicar anuncios basados en visitas anteriores de los usuarios a este u otros sitios web. Los usuarios pueden inhabilitar la publicidad personalizada de Google accediendo a la <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-650 hover:underline">Configuración de anuncios de Google</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Conservación de los Datos</h2>
            <p>
              Los correos electrónicos suscritos al boletín se conservarán de forma indefinida hasta que el usuario decida retirar su consentimiento dándose de baja. Los datos de navegación e historial se borran o anonimizan de forma periódica en un plazo máximo de 14 meses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Tus Derechos (Derechos ARCO)</h2>
            <p>
              Como usuario, puedes ejercer tus derechos de acceso, rectificación, supresión (derecho al olvido), limitación del tratamiento, portabilidad y oposición enviando un correo electrónico detallando tu solicitud a: <strong>contacto@portalempleoit.com</strong>.
            </p>
            <p className="mt-2">
              También puedes revocar el boletín de empleo de forma instantánea haciendo clic en el enlace &quot;Darse de baja&quot; que se encuentra al pie de cada comunicación por correo electrónico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Seguridad de la Información</h2>
            <p>
              Portal Trabajo IT emplea protocolos de cifrado de extremo a extremo SSL/TLS en toda la navegación para evitar la interceptación de tus datos y mantiene medidas técnicas y organizativas robustas en sus servidores locales y de base de datos.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
