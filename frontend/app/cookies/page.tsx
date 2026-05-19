import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies | Portal Trabajo IT',
  description: 'Información sobre las cookies utilizadas en Portal Trabajo IT.',
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <Link href="/" className="text-indigo-600 hover:underline mb-6 inline-block font-medium">
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
        <p className="text-gray-500 mb-8 text-sm">Última actualización: 19 de Mayo de 2026</p>

        <div className="prose text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio web.
              Nos permiten recordar tus preferencias y mejorar tu experiencia de navegación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies que utilizamos</h2>
            <p>En <strong>Portal Trabajo IT</strong> utilizamos exclusivamente cookies técnicas y funcionales:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Cookie de aceptación:</strong> Recuerda que has aceptado el banner de cookies
                para no volver a mostrártelo (<code>cookies_accepted</code>).
              </li>
              <li>
                <strong>Cookies de sesión:</strong> Necesarias para el correcto funcionamiento de la
                navegación y los formularios del sitio.
              </li>
              <li>
                <strong>Vercel Analytics:</strong> Recopilamos datos anónimos de tráfico (páginas visitadas,
                duración de la sesión) para mejorar el servicio. No se recopilan datos personales identificables.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies de terceros</h2>
            <p>
              Algunos enlaces de nuestra web redirigen a servicios externos (como plataformas de formación o PayPal).
              Estos servicios pueden establecer sus propias cookies cuando accedes a ellos. Portal Trabajo IT no
              controla estas cookies de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cómo desactivar las cookies</h2>
            <p>
              Puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se instale una.
              Ten en cuenta que, si desactivas las cookies, algunas funciones del sitio podrían no funcionar correctamente.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
