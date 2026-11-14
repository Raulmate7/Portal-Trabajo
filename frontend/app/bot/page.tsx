import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'PortalTrabajoITBot | Información Técnica y Política de Rastreo',
  description: 'Documentación técnica, política de cortesía, buenas prácticas y canal de exclusión (opt-out) para webmasters de PortalTrabajoITBot.',
  alternates: {
    canonical: '/bot',
  },
};

export default function BotPage() {
  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'PortalTrabajoITBot' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🤖</span>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            PortalTrabajoITBot
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">
            User-Agent: PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot; bot@portalempleoit.com)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 md:p-8 space-y-6 text-gray-750 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">1. ¿Qué es PortalTrabajoITBot y cuál es su misión?</h2>
          <p>
            <strong>PortalTrabajoITBot</strong> es el rastreador e indexador automatizado operado por <strong>Portal Trabajo IT</strong> (<Link href="/" className="text-indigo-600 underline">portalempleoit.com</Link>).
          </p>
          <p className="mt-2">
            Su cometido exclusivo es <strong>descubrir, agregar e indexar ofertas de empleo tecnológico de acceso público</strong> en España y el mercado hispanohablante. La plataforma actúa como un motor de búsqueda y agregador de hiperenlaces cuyo único fin es <strong>redirigir tráfico de candidatos técnicos cualificados directamente a las plataformas oficiales de origen o a los sitios web corporativos de las empresas empleadoras</strong> mediante enlace directo (<em>deep linking</em>).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">2. Política de Cortesía y Buenas Prácticas Técnicas (RFC 9309)</h2>
          <p>
            PortalTrabajoITBot opera con la máxima diligencia para garantizar un impacto nulo en el rendimiento de los servidores web de terceros:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-xs text-gray-650">
            <li>
              <strong>Cumplimiento riguroso de Robots.txt y TDMRep:</strong> El rastreador consulta y obedece las directivas de exclusión de <code>robots.txt</code>, cabeceras <code>TDM-Reservation: 1</code> (Directiva UE 2019/790) y <code>X-Robots-Tag</code> con carácter previo a cualquier descarga, priorizando APIs y feeds públicos autorizados.
            </li>
            <li>
              <strong>Limitación estricta de velocidad y concurrencia:</strong> Aplica retardos mínimos de cortesía entre peticiones (entre 3 y 5 segundos por dominio) y mantiene una concurrencia máxima de 1 sola petición simultánea por host.
            </li>
            <li>
              <strong>Identificación transparente:</strong> Todas las peticiones HTTP viajan acompañadas de la cabecera <code>User-Agent</code> oficial que identifica al bot, facilitando este enlace informativo y el correo de contacto para administradores de sistemas.
            </li>
            <li>
              <strong>Extracción no sustancial (LPI Art. 133 / Directiva 96/9/CE):</strong> El robot no descarga ni replica bases de datos de forma íntegra o sustancial. Únicamente extrae metadatos indispensables para la referencia (título del puesto, empresa, ubicación aproximada y breves citas o extractos descriptivos no superiores a 200 caracteres con mención expresa de la fuente).
            </li>
            <li>
              <strong>Uso leal de signos distintivos (Ley de Marcas 17/2001, Art. 37):</strong> Los nombres comerciales y logotipos referenciales se gestionan mediante proxy interno cacheado en servidor sin exponer direcciones IP de los visitantes a terceros y con finalidad estrictamente identificativa de la vacante.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">3. Instrucciones de Exclusión para Webmasters (Opt-Out)</h2>
          <p>
            Si administras un sitio web o portal de empleo y deseas impedir que PortalTrabajoITBot indexe tus ofertas, puedes gestionarlo de dos formas inmediatas:
          </p>

          <div className="mt-3 p-4 bg-gray-900 text-gray-100 rounded-xl space-y-2 font-mono text-xs">
            <p className="text-gray-400"># Opción A: Bloqueo mediante robots.txt</p>
            <p className="text-emerald-400">User-agent: PortalTrabajoITBot</p>
            <p className="text-emerald-400">Disallow: /</p>
          </div>

          <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-150 rounded-xl space-y-2">
            <h3 className="font-bold text-indigo-950 text-xs">Opción B: Solicitud formal de exclusión por correo</h3>
            <p className="text-xs text-indigo-900/80">
              Escríbenos a <a href="mailto:bot@portalempleoit.com" className="font-bold text-indigo-600 underline">bot@portalempleoit.com</a> o <a href="mailto:contacto@portalempleoit.com" className="font-bold text-indigo-600 underline">contacto@portalempleoit.com</a> indicando tu dominio corporativo. Tramitaremos la exclusión de tu sitio de la lista de rastreo y la desindexación de cualquier oferta agregada en un plazo máximo de <strong>48 horas laborables</strong>, conforme a los Arts. 16 y 17 del Reglamento Europeo de Servicios Digitales (DSA, UE 2022/2065).
            </p>
          </div>
        </section>

        <section className="pt-2 border-t border-gray-150">
          <p className="text-xs text-gray-500">
            Para más información sobre el régimen legal y los términos de uso del servicio, consulta nuestro <Link href="/aviso-legal" className="text-indigo-600 underline">Aviso Legal</Link> y nuestra <Link href="/privacy" className="text-indigo-600 underline">Política de Privacidad</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}

