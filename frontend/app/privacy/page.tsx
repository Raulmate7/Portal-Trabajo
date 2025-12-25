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
        <p className="text-gray-500 mb-8 text-sm">Última actualización: 25 de Diciembre de 2025</p>
        
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
            <p>Actualmente, solo recopilamos la siguiente información:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Correo electrónico:</strong> Solo si decides voluntariamente suscribirte a nuestro boletín de ofertas.</li>
              <li><strong>Datos de navegación:</strong> Datos anónimos a través de cookies técnicas para el funcionamiento del sitio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Uso de la información</h2>
            <p>Utilizamos tu correo electrónico exclusivamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enviarte resúmenes de ofertas de empleo relevantes (Lunes y Viernes).</li>
              <li>Notificarte sobre cambios importantes en el servicio.</li>
            </ul>
            <p className="mt-2"><strong>Jamás venderemos ni cederemos tu correo a terceros para fines comerciales.</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
            <p>
              Este sitio utiliza cookies técnicas necesarias para recordar tus preferencias (como el filtro de búsqueda o la aceptación de este aviso). 
              No utilizamos cookies de seguimiento publicitario invasivo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Tus derechos</h2>
            <p>
              Puedes darte de baja de nuestro boletín en cualquier momento haciendo clic en el enlace "Darse de baja" que aparece al final de cada correo, 
              o contactándonos directamente.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
