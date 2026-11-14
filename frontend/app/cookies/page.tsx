import Link from 'next/link';
import type { Metadata } from 'next';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';

export const metadata: Metadata = {
  title: 'Política de Cookies y Tecnologías Similares | Portal Trabajo IT',
  description: 'Información legal transparente sobre el uso de cookies, balizas web y tecnologías de almacenamiento en Portal Trabajo IT.',
  alternates: {
    canonical: '/cookies',
  },
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <Link href="/" className="text-indigo-600 hover:underline mb-6 inline-block font-medium">
          ← Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies y Tecnologías de Seguimiento</h1>
        <p className="text-gray-500 mb-8 text-sm">Última actualización: Noviembre de 2026 (Adaptada a las directrices AEPD y EDPB)</p>

        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="text-sm text-indigo-950 font-bold">¿Deseas modificar o revocar tu consentimiento?</p>
            <p className="text-xs text-indigo-800">Puedes cambiar tus preferencias de cookies en cualquier momento con efecto inmediato.</p>
          </div>
          <div className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
            <CookiePreferencesButton />
          </div>
        </div>

        <div className="prose text-gray-700 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. ¿Qué son las cookies y tecnologías similares?</h2>
            <p>
              Una cookie es un pequeño fichero de texto que un sitio web almacena en tu navegador al visitarlo. Además de las cookies tradicionales, esta política abarca tecnologías similares sujetas al artículo 22.2 de la Ley 34/2002 (LSSI-CE), tales como balizas web (*web beacons*), píxeles invisibles de seguimiento de apertura en correos electrónicos y almacenamiento local (*localStorage* y *sessionStorage*).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Categorías de cookies utilizadas en este portal</h2>
            <p>Clasificamos las tecnologías de almacenamiento y recuperación de datos en tres niveles:</p>
            
            <div className="space-y-3 mt-3">
              <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-1">A. Cookies Técnicas y Esenciales (Exentas de consentimiento)</h3>
                <p className="text-xs text-gray-650">
                  Son indispensables para que la web funcione correctamente y no pueden desactivarse en nuestros sistemas. Permiten recordar tu sesión, mantener tus preferencias de modo oscuro (<code>theme</code>) y almacenar el propio estado de consentimiento que has otorgado (<code>cookies_consent</code>, <code>cookies_accepted</code>).
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-1">B. Cookies Analíticas y de Rendimiento (Google Analytics 4)</h3>
                <p className="text-xs text-gray-650">
                  Nos permiten cuantificar de forma agregada el número de visitantes, fuentes de tráfico y las secciones de empleo más consultadas. Se ejecutan con el protocolo <strong>Google Consent Mode v2</strong>, permaneciendo bloqueadas de forma predeterminada hasta que el usuario otorga su consentimiento expreso mediante el banner de cookies.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm mb-1">C. Cookies de Publicidad Contextual (Google AdSense)</h3>
                <p className="text-xs text-gray-650">
                  Permiten sostener económicamente este portal público y gratuito para candidatos. Google y sus socios publicitarios pueden utilizar cookies para mostrar anuncios relevantes según tu interacción o intereses generales. Solo se instalan con tu autorización expresa.
                </p>
              </div>
            </div>

            {/* Inventario detallado de cookies conforme a la Guía AEPD */}
            <h3 className="font-bold text-gray-900 text-sm mt-5 mb-2">Tabla de Inventario de Tecnologías y Cookies Utilizadas</h3>
            <div className="overflow-x-auto mt-2 border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Identificador</th>
                    <th className="p-2.5">Titular</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Finalidad</th>
                    <th className="p-2.5">Caducidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-650 bg-white">
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">theme</td>
                    <td className="p-2.5">Propia</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Técnica</span></td>
                    <td className="p-2.5">Recordar la preferencia de tema visual (claro u oscuro).</td>
                    <td className="p-2.5">1 año</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">cookies_consent</td>
                    <td className="p-2.5">Propia</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Técnica</span></td>
                    <td className="p-2.5">Almacenar las opciones de consentimiento otorgadas por el usuario.</td>
                    <td className="p-2.5">1 año</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">saved_jobs</td>
                    <td className="p-2.5">Propia</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Técnica</span></td>
                    <td className="p-2.5">Guardar localmente las vacantes favoritas sin crear cuentas en el servidor.</td>
                    <td className="p-2.5">Persistente</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">_ga, _ga_*</td>
                    <td className="p-2.5">Google LLC</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Analítica</span></td>
                    <td className="p-2.5">Métricas de tráfico agregadas. Sujeta a Google Consent Mode v2 denegado por defecto.</td>
                    <td className="p-2.5">Hasta 2 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">__gads, __gpi, IDE</td>
                    <td className="p-2.5">Google LLC</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Publicidad</span></td>
                    <td className="p-2.5">Impresión de anuncios y prevención de fraude publicitario en AdSense. Bloqueadas hasta consentimiento.</td>
                    <td className="p-2.5">13 meses</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">__os_* / OneSignal</td>
                    <td className="p-2.5">OneSignal Inc.</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Funcional</span></td>
                    <td className="p-2.5">Token push en IndexedDB/localStorage. Bloqueado estrictamente hasta consentimiento expreso en cookies y permiso del navegador.</td>
                    <td className="p-2.5">Hasta revocación</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">referrer_email</td>
                    <td className="p-2.5">Propia</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Funcional</span></td>
                    <td className="p-2.5">Cookie httpOnly firmada para atribuir el programa de referidos cuando accedes desde un enlace de invitación (`/ref/[code]`).</td>
                    <td className="p-2.5">30 días</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">admin_session</td>
                    <td className="p-2.5">Propia</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Técnica</span></td>
                    <td className="p-2.5">Cookie httpOnly de autenticación exclusiva para administradores en `/admin`.</td>
                    <td className="p-2.5">24 horas</td>
                  </tr>
                  <tr className="hover:bg-gray-50/60">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-gray-800">user_streak / streak_sig</td>
                    <td className="p-2.5">Propia</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Funcional</span></td>
                    <td className="p-2.5">Almacenamiento local y cookie httpOnly firmada para registrar la racha diaria de visitas (purgable al rechazar cookies opcionales).</td>
                    <td className="p-2.5">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Píxeles de seguimiento en comunicaciones por email</h2>
            <p>
              De conformidad con las Directrices 02/2023 del Comité Europeo de Protección de Datos (EDPB) y el criterio de la AEPD, te informamos de que nuestros boletines y alertas de empleo por correo electrónico pueden incorporar un píxel gráfico transparente e invisible de 1×1 píxeles (<code>track-open</code>).
            </p>
            <p className="mt-2 text-xs text-gray-600">
              <strong>Finalidad y tratamiento:</strong> Esta baliza técnica permite medir de manera agregada la tasa de apertura de los boletines informativos y la efectividad de las alertas para evitar enviar comunicaciones a cuentas inactivas. Si no deseas que se realice esta medición, puedes deshabilitar la carga automática de imágenes en la configuración de tu cliente de correo (como Gmail, Outlook o Apple Mail) o revocar tu suscripción en cualquier momento haciendo clic en el enlace de &quot;Darse de baja&quot; incluido al pie de cada correo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Cómo gestionar, desactivar o eliminar cookies</h2>
            <p>
              Puedes rechazar o ajustar en cualquier momento las cookies opcionales a través de nuestro botón de configuración disponible en el pie de página de todo el sitio web o configurando tu propio navegador web:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
              <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
              <li><strong>Mozilla Firefox:</strong> Ajustes &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.</li>
              <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
              <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos almacenados.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
