import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Portal Trabajo IT",
  description: "Información legal sobre el uso de datos en Portal Trabajo IT.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <Link href="/" className="text-indigo-600 hover:underline mb-6 inline-block font-medium">
          ← Volver al inicio
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-500 mb-8 text-sm">Última actualización: 19 de Mayo de 2026</p>
        
        <div className="prose text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introducción</h2>
            <p>
              En <strong>Portal Trabajo IT</strong>, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. 
              Esta política explica cómo recopilamos, usamos y protegemos tu información cuando utilizas nuestro sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Información que recopilamos</h2>
            <p>Recopilamos la siguiente información según el servicio que utilices:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Suscripción al boletín:</strong> Correo electrónico, proporcionado voluntariamente.</li>
              <li><strong>Talento Premium:</strong> Nombre completo, email profesional, stack tecnológico, años de experiencia y, opcionalmente, enlace de LinkedIn.</li>
              <li><strong>Publicar Oferta (empresas):</strong> Nombre de la empresa, email de contacto, teléfono (opcional), datos del puesto ofertado y URL de candidatura.</li>
              <li><strong>Datos de navegación:</strong> Datos anónimos a través de Vercel Analytics para medir el tráfico del sitio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Uso de la información</h2>
            <p>Utilizamos tus datos exclusivamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enviarte resúmenes de ofertas de empleo relevantes (si te suscribes al boletín).</li>
              <li>Conectarte con oportunidades laborales exclusivas (si te registras en Talento Premium).</li>
              <li>Gestionar y publicar ofertas de empleo patrocinadas (si eres una empresa).</li>
              <li>Notificarte sobre cambios importantes en el servicio.</li>
            </ul>
            <p className="mt-2"><strong>Jamás venderemos ni cederemos tus datos a terceros para fines comerciales.</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
            <p>
              Este sitio utiliza cookies técnicas necesarias para recordar tus preferencias (como la aceptación del aviso de cookies). 
              No utilizamos cookies de seguimiento publicitario invasivo. Para más información, consulta nuestra{' '}
              <Link href="/cookies" className="text-indigo-600 hover:underline">Política de Cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Tus derechos</h2>
            <p>
              Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO) contactándonos 
              directamente. Si te suscribiste al boletín, puedes darte de baja en cualquier momento haciendo clic 
              en el enlace &quot;Darse de baja&quot; que aparece al final de cada correo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Seguridad</h2>
            <p>
              Tus datos se almacenan en servidores seguros con conexión cifrada (SSL/TLS). 
              Aplicamos medidas técnicas y organizativas para proteger tu información frente a accesos no autorizados.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
