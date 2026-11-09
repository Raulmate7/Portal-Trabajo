import Link from "next/link";
import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import CookiePreferencesButton from "@/components/CookiePreferencesButton";

export const metadata: Metadata = {
  title: "Política de Privacidad | Portal Trabajo IT",
  description: "Información legal y transparencia sobre el tratamiento de datos personales en Portal Trabajo IT de acuerdo con el RGPD y la LOPDGDD.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  const legalOwner = process.env.NEXT_PUBLIC_LEGAL_OWNER || 'Raúl Mateo (Portal Trabajo IT)';
  const legalNif = process.env.NEXT_PUBLIC_LEGAL_NIF || 'Disponible previa solicitud acreditada en contacto@portalempleoit.com';
  const legalAddress = process.env.NEXT_PUBLIC_LEGAL_ADDRESS || 'Madrid, España (Atención al usuario y notificaciones: contacto@portalempleoit.com)';

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <Link href="/" className="text-indigo-650 hover:underline mb-6 inline-block font-semibold">
          ← Volver al inicio
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-550 mb-8 text-sm">Última actualización: Noviembre de 2026 (Adaptada al RGPD y LOPDGDD)</p>
        
        <div className="prose text-gray-700 space-y-6 text-sm leading-relaxed font-sans">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Responsable del Tratamiento de Datos (Art. 13.1.a RGPD)</h2>
            <p>
              En cumplimiento del Reglamento General de Protección de Datos (Reglamento UE 2016/679 - RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), se informa que el responsable del tratamiento de los datos recopilados en este portal es:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Identidad del Responsable:</strong> {legalOwner}</li>
              <li><strong>NIF / CIF:</strong> {legalNif}</li>
              <li><strong>Domicilio postal:</strong> {legalAddress}</li>
              <li><strong>Contacto de Privacidad y Ejercicio de Derechos:</strong> contacto@portalempleoit.com</li>
              <li><strong>Actividad principal:</strong> Agregador y metabuscador de empleo tecnológico en España, calculadora salarial y servicios de difusión para reclutadores.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Información que recopilamos, Finalidad y Base Jurídica</h2>
            <p>Recopilamos la siguiente información estrictamente necesaria según los servicios utilizados en la plataforma:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Suscripción a alertas y boletín de empleo:</strong> Dirección de correo electrónico y preferencias técnicas seleccionadas voluntariamente.
                <br />
                <em>Finalidad:</em> Envío periódico de vacantes personalizadas y medición técnica agregada de entrega y efectividad de las alertas mediante baliza gráfica transparente de 1×1 píxeles y enlaces con redirección segura (Art. 22.2 LSSI-CE y Directrices 02/2023 del EDPB). Esta medición permite depurar listas inactivas y evitar envíos desatendidos. Puedes evitarla deshabilitando la carga automática de imágenes remotas en tu cliente de correo (Gmail, Outlook, Apple Mail), activando la cabecera Do Not Track (DNT) / Sec-GPC o ejerciendo la baja instantánea con un clic en el pie de cada correo.
                <br />
                <em>Base legal:</em> Consentimiento expreso del interesado (Art. 6.1.a RGPD).
              </li>
              <li>
                <strong>Alertas Push en navegador (OneSignal):</strong> Identificador técnico anónimo asignado por el navegador tras solicitar permiso en pantalla.
                <br />
                <em>Base legal:</em> Consentimiento expreso otorgado en el navegador (Art. 6.1.a RGPD).
              </li>
              <li>
                <strong>Publicación y patrocinio de ofertas B2B:</strong> Nombre de la empresa, email de facturación/contacto y URL de postulación.
                <br />
                <em>Base legal:</em> Ejecución de la relación contractual o de servicio solicitada (Art. 6.1.b RGPD).
              </li>
              <li>
                <strong>Compras digitales (Informes de Mercado IT y Candidato Premium):</strong> Email de entrega y datos de transacción gestionados mediante Stripe Payments Europe Ltd.
                <br />
                <em>Base legal:</em> Ejecución contractual y cumplimiento de obligaciones fiscales y contables (Art. 6.1.b y 6.1.c RGPD).
              </li>
              <li>
                <strong>Opiniones y valoraciones de empresas (UGC):</strong> Alias o rol profesional y valoración cualitativa introducida voluntariamente por el usuario.
                <br />
                <em>Base legal:</em> Consentimiento expreso y libertad de expresión e información (Art. 6.1.a RGPD).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Encargados del Tratamiento y Seguridad en el Flujo de Datos</h2>
            <p>
              De conformidad con el artículo 28 del RGPD y dentro de nuestro Registro de Actividades de Tratamiento (RAT), tus datos personales pueden ser procesados a través de proveedores de infraestructura que actúan como encargados de tratamiento bajo estrictas cláusulas de confidencialidad y seguridad:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Pasarelas de Pagos:</strong> Stripe Payments Europe, Ltd. (sede en Irlanda, UE) y PayPal Europe S.à r.l. et Cie, S.C.A. (Luxemburgo, UE), ambas certificadas bajo el estándar de seguridad PCI-DSS.</li>
              <li><strong>Notificaciones Push en Navegador:</strong> OneSignal, Inc. (adherida al marco de privacidad Data Privacy Framework UE-EE.UU.), actuando únicamente si el usuario activa voluntariamente las alertas push.</li>
              <li><strong>Programas de Afiliación (Cursos y Recursos):</strong> Enlaces recomendados a plataformas educativas externas (Udemy Ireland Ltd., Coursera Inc., Domestika, Platzi y Amazon EU). Al hacer clic en un enlace de afiliado, el usuario es redirigido a la plataforma externa con parámetros de campaña sin que Portal Trabajo IT transmita datos de carácter personal.</li>
              <li><strong>Infraestructura de Alojamiento y Despliegue:</strong> Servidores en la Unión Europea protegidos mediante cifrado TLS v1.3 y túneles proxy de base de datos con autenticación reforzada y listas de control de acceso por IP.</li>
              <li><strong>Comunicaciones por Correo:</strong> Servidores SMTP y servicio transaccional (Resend Inc., bajo Cláusulas Contractuales Tipo de la UE) con políticas SPF, DKIM y DMARC activas.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-650">
              No vendemos, cedemos ni transferimos datos personales a terceros comerciales ni a redes de compraventa de datos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Analítica Web, Cookies y Consent Mode</h2>
            <p>
              Este sitio web opera bajo el protocolo <strong>Google Consent Mode v2</strong>. Las cookies analíticas (Google Analytics) y publicitarias (Google AdSense) permanecen estrictamente deshabilitadas por defecto hasta que el usuario manifieste su consentimiento activo en el banner de cookies. Puedes consultar el detalle de cada cookie o revocar tu consentimiento en cualquier momento en nuestra{' '}
              <Link href="/cookies" className="text-indigo-650 hover:underline font-semibold">Política de Cookies</Link> o pulsando el botón de configuración:
            </p>
            <div className="mt-2 inline-block bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <CookiePreferencesButton />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Plazos de Conservación de los Datos (Art. 13.2.a RGPD)</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Suscriptores de alertas y boletín:</strong> Se conservan hasta que el usuario decida darse de baja o revoque su consentimiento mediante el enlace de baja en 1 clic o en <Link href="/darse-de-baja" className="underline text-indigo-600">/darse-de-baja</Link>.</li>
              <li><strong>Datos de facturación y compras comerciales:</strong> Se conservan durante el plazo legal obligatorio de <strong>4 años</strong> (obligaciones tributarias, Art. 66 Ley General Tributaria) y <strong>6 años</strong> (libros de contabilidad y facturas, Art. 30 Código de Comercio).</li>
              <li><strong>Telemetría técnica y registros de entrega:</strong> Las métricas técnicas de apertura y clics se purgan periódicamente en un plazo no superior a 12 meses.</li>
              <li><strong>Reseñas y moderación UGC:</strong> Mientras se mantenga la ficha de la empresa y durante los plazos de prescripción de acciones legales civiles aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Ejercicio de Derechos (Acceso, Rectificación, Supresión y Oposición)</h2>
            <p>
              Cualquier usuario puede ejercer sus derechos de acceso, rectificación, supresión (derecho al olvido), limitación del tratamiento, portabilidad y oposición enviando un mensaje identificativo a: <strong>contacto@portalempleoit.com</strong>.
            </p>
            <p className="mt-2">
              Asimismo, puedes cancelar de forma inmediata cualquier suscripción haciendo clic en el enlace &quot;Darse de baja&quot; presente al final de todos nuestros correos. Si consideras que tus derechos no han sido debidamente atendidos, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD, <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-indigo-650 hover:underline">www.aepd.es</a>).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Decisiones Automatizadas y Elaboración de Perfiles (Art. 22 RGPD)</h2>
            <p>
              De conformidad con el artículo 22 del RGPD, Portal Trabajo IT <strong>no adopta decisiones basadas exclusivamente en el tratamiento automatizado ni elabora perfiles discriminatorios</strong> (<em>profiling</em>) que produzcan efectos jurídicos sobre los candidatos o afecten de forma similar y significativa a sus derechos laborales. 
            </p>
            <p className="mt-2">
              Los sistemas de búsqueda y sugerencias de vacantes operan mediante filtrado objetivo y directo parametrizado por el propio usuario (tecnologías, ubicación o rangos retributivos). Cualquier proceso de valoración cualitativa en el programa de Talento Premium cuenta con intervención, contraste y supervisión de profesionales humanos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Inteligencia Artificial y Transparencia Algorítmica (Reglamento UE 2024/1689 - AI Act)</h2>
            <p>
              En estricto cumplimiento de las exigencias de transparencia del Reglamento Europeo de Inteligencia Artificial (AI Act, Reglamento UE 2024/1689):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Transparencia de contenidos (Art. 50.2 AI Act):</strong> En la redacción de informes sectoriales, estadísticas de mercado o artículos divulgativos del blog pueden utilizarse herramientas analíticas y de lenguaje asistido por IA. Todo contenido publicado es revisado, contrastado y avalado bajo la supervisión y responsabilidad editorial de un autor humano identificado.</li>
              <li><strong>Exclusión de sistemas de alto riesgo:</strong> La plataforma no utiliza algoritmos de IA clasificados como de alto riesgo bajo el Anexo III del AI Act para el descarte automático, análisis psicométrico o clasificación biométrica/conductual de solicitantes de empleo.</li>
              <li><strong>Prohibición de cesión a LLMs públicos:</strong> Los datos de carácter personal de candidatos, currículos, correos o datos de facturación no son enviados, comercializados ni utilizados para entrenar modelos fundacionales de inteligencia artificial de terceros.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
