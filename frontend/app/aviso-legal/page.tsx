import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import { LEGAL_CONFIG } from "@/lib/legalConfig";

export const metadata: Metadata = {
  title: 'Aviso Legal y Condiciones de Uso | Portal Trabajo IT',
  description: 'Términos y condiciones legales, estatuto de agregador de empleo y protocolo de retirada de Portal Trabajo IT.',
  alternates: {
    canonical: '/aviso-legal',
  },
};

export default function LegalPage() {
  const { owner: legalOwner, nif: legalNif, address: legalAddress, email: legalEmail, registry: legalRegistry, domain } = LEGAL_CONFIG;

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Aviso Legal' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
        ⚖️ Aviso Legal y Condiciones de Uso
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 text-gray-750 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">1. Datos Identificativos (LSSI-CE Art. 10 y TRLGDCU Art. 97)</h2>
          <p>
            En cumplimiento del deber de información general dispuesto en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), y en el artículo 97 del Real Decreto Legislativo 1/2007 (TRLGDCU), se facilitan de forma permanente, directa y gratuita los datos identificativos del prestador del servicio:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Titular / Denominación social:</strong> {legalOwner}</li>
            <li><strong>NIF / CIF:</strong> {legalNif}</li>
            <li><strong>Domicilio social y fiscal:</strong> {legalAddress}</li>
            <li><strong>Correo electrónico de contacto, soporte y ejercicio de derechos:</strong> {legalEmail}</li>
            <li><strong>Datos registrales:</strong> {legalRegistry}</li>
            <li><strong>Sitio Web Oficial:</strong> {domain}</li>
            <li><strong>Actividad:</strong> Directorio, metabuscador de ofertas tecnológicas y herramientas de orientación laboral para programadores en España.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">2. Usuarios</h2>
          <p>
            El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. Las citadas Condiciones serán de aplicación independientemente de las Condiciones Generales de Contratación que en su caso resulten de obligado cumplimiento para servicios comerciales específicos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">3. Uso del Portal</h2>
          <p>
            portalempleoit.com proporciona el acceso a multitud de informaciones, servicios, herramientas salariales o datos en Internet pertenecientes a Portal Trabajo IT o a sus licenciantes. El USUARIO asume la responsabilidad del uso del portal y se compromete a hacer un uso adecuado de los contenidos y servicios sin emplearlos para actividades ilícitas o lesivas de derechos de terceros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">4. Protección de Datos y Privacidad</h2>
          <p>
            Portal Trabajo IT cumple escrupulosamente con el Reglamento General de Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD). Para conocer detalladamente los tratamientos de datos personales, finalidades, derechos y el uso de balizas o cookies, consulta nuestra Política de Privacidad y Política de Cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">5. Estatuto de Metabuscador, Propiedad Intelectual y Enlazado Legal (Deep Linking)</h2>
          <p>
            Portal Trabajo IT opera como un <strong>motor de búsqueda y directorio agregador de hiperenlaces públicos de empleo tecnológico</strong>.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Doctrina Europea de Enlazado:</strong> Conforme a la doctrina consolidada del Tribunal de Justicia de la Unión Europea (asuntos <em>Svensson</em> C-466/12 y <em>GS Media</em> C-160/15), la facilitación de enlaces hipertextuales hacia contenidos libremente accesibles y publicados en Internet no constituye un acto de comunicación al público sujeto a autorización previa, al no emplearse una técnica de transmisión diferente ni dirigirse a un público nuevo.
            </li>
            <li>
              <strong>Enlace Directo vs. Framing:</strong> Portal Trabajo IT no practica el enmarcado (<em>framing</em>) ni oculta el origen de las ofertas. Al pulsar en &quot;Inscribirme en la oferta&quot;, el usuario es redirigido mediante enlace directo (<em>deep link</em>) a la página oficial del portal de empleo de origen o de la empresa contratante, donde se formaliza la candidatura.
            </li>
            <li>
              <strong>Extracción no sustancial (LPI art. 133 y ss.):</strong> Portal Trabajo IT no replica ni comercializa bases de datos ajenas de manera sustancial. Únicamente procesa de forma temporal metadatos referenciales mínimos e indispensables (título, empresa, provincia y enlace canónico) para permitir a los candidatos localizar las ofertas en sus fuentes oficiales.
            </li>
            <li>
              <strong>Signos distintivos y Marcas (Ley 17/2001, art. 37):</strong> Los nombres comerciales y marcas pertenecientes a terceros se citan de forma meramente referencial e informativa para identificar a la entidad ofertante del puesto de trabajo, de conformidad con el uso leal del derecho de marcas (uso nominativo).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">6. Protocolo de Desindexación, Verificación y Retirada Inmediata (Notice & Takedown - Reglamento UE 2022/2065 DSA)</h2>
          <p>
            Portal Trabajo IT actúa con la máxima diligencia y buena fe como intermediario neutral de la sociedad de la información. De conformidad con los artículos 16 y 17 del Reglamento de Servicios Digitales (DSA, UE 2022/2065) y el artículo 16 de la LSSI-CE, se establece un procedimiento reglado de notificación y retirada para titulares legítimos:
          </p>
          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <p className="font-semibold text-gray-900">Mecanismo ágil de notificación y retirada (Art. 16.2 DSA):</p>
            <ul className="list-disc pl-5 text-xs text-gray-650 space-y-1">
              <li>
                <strong>Canal electrónico directo y gratuito:</strong> Envía un correo electrónico a <strong>{legalEmail}</strong> o utiliza el botón <strong>&quot;🚩 Reportar&quot;</strong> disponible junto a cada contenido/reseña, sin exigencia de apoderamiento notarial ni firma electrónica cualificada previa para avisos ordinarios.
              </li>
              <li>
                <strong>Elementos mínimos del aviso (Art. 16.2 DSA):</strong> (1) Explicación suficientemente motivada de las razones por las que se considera que el contenido es ilícito o vulnera derechos; (2) indicación clara de la ubicación electrónica exacta (URL o identificador de la oferta/reseña); (3) nombre y dirección de correo electrónico del notificante (salvo en supuestos de delitos contemplados en el Art. 16.2.c DSA); y (4) declaración de que la información y las alegaciones contenidas en la notificación son exactas y completas de buena fe.
              </li>
              <li>
                <strong>Acuse de recibo y resolución motivada (Art. 16.4 y 16.5 DSA):</strong> Remitiremos acuse de recibo sin demora indebida a la dirección facilitada y comunicaremos la decisión motivada adoptada sobre la retirada, desindexación o mantenimiento del contenido en un plazo máximo de <strong>48 horas laborables</strong>.
              </li>
              <li>
                <strong>Uso abusivo:</strong> Las notificaciones manifiestamente infundadas de forma reiterada podrán motivar la suspensión temporal de tramitación conforme al Art. 23 DSA.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">7. Condiciones Generales de Contratación, Pasarelas de Pago (Stripe y PayPal), Facturación y Desistimiento (TRLGDCU, LSSI-CE y RD 1619/2012)</h2>
          <p>
            Portal Trabajo IT comercializa servicios digitales tanto en modalidad B2C para candidatos (informes salariales descargables y suscripción Candidato Premium) como en modalidad B2B para empresas (difusión destacada y patrocinio publicitario). Toda contratación se rige por las siguientes condiciones:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Excepción al Derecho de Desistimiento en Contenidos Digitales y Servicios Inmediatos (Art. 103.m TRLGDCU):</strong> Conforme al artículo 103 letra m) del Real Decreto Legislativo 1/2007, el derecho de desistimiento de 14 días no resulta aplicable al suministro de contenido digital sin soporte material (como el Informe de Mercado IT en PDF) cuando la ejecución ha comenzado con el previo consentimiento expreso del comprador y el reconocimiento de que en consecuencia pierde su derecho de desistimiento. Del mismo modo, en servicios de difusión o patrocinio publicitario inmediato, la ejecución comienza de forma instantánea tras la contratación previa aceptación expresa del usuario/empresa.
            </li>
            <li>
              <strong>Suscripciones Recurrentes y Cancelación sin Permanencia (Art. 108 bis TRLGDCU):</strong> El servicio de Candidato Premium opera mediante suscripción periódica mensual (4,99 €/mes, IVA incluido) con renovación automática. El usuario puede cancelar la renovación automática en cualquier momento, sin permanencia, penalización ni coste adicional, directamente desde la plataforma o enviando un correo a <strong>contacto@portalempleoit.com</strong> antes de la siguiente fecha de cargo.
            </li>
            <li>
              <strong>Pasarelas de Pago Seguras (Stripe y PayPal):</strong> Las transacciones se procesan mediante protocolos cifrados SSL/TLS a través de entidades de pago certificadas PCI-DSS: <strong>Stripe Technology Europe, Limited</strong> y <strong>PayPal Europe S.à r.l. et Cie, S.C.A.</strong> Portal Trabajo IT no almacena ni tiene acceso a los datos completos de tarjetas bancarias.
            </li>
            <li>
              <strong>Precios, Impuestos y Emisión de Facturas (RD 1619/2012 y Ley del IVA):</strong> Los precios para consumidores finales se expresan en euros (€) con el IVA correspondiente incluido. Los planes dirigidos a empresas y reclutadores se indican como precios netos (+21% de IVA legal aplicable). Para la emisión de factura legal según el RD 1619/2012, el comprador podrá introducir su Razón Social, NIF/CIF y domicilio fiscal durante el checkout o solicitarla fehacientemente a <strong>contacto@portalempleoit.com</strong>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">8. Responsabilidad por Contenidos de Usuarios y Régimen DSA (Reglamento UE 2022/2065)</h2>
          <p>
            Portal Trabajo IT pone a disposición de la comunidad un sistema público de valoraciones y experiencias sobre empresas empleadoras (UGC):
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong>Exención de Responsabilidad como Prestador de Alojamiento (Art. 6 DSA):</strong> Portal Trabajo IT actúa como mero intermediario técnico y no ejerce un control editorial previo sobre las opiniones introducidas voluntariamente por los usuarios. En consecuencia, no asume responsabilidad civil ni penal por los contenidos almacenados mientras no tenga conocimiento efectivo de su ilicitud o, teniéndolo, actúe con presteza para retirar o inhabilitar el acceso a los mismos.
            </li>
            <li>
              <strong>Normas de la Comunidad y Contenidos Prohibidos:</strong> Queda terminantemente prohibido verter expresiones injuriosas o calumniosas, imputaciones de delitos sin sentencia firme, difusión de secretos comerciales protegidos por la Ley 1/2019 de Secretos Empresariales o la revelación de datos personales de terceros sin su consentimiento.
            </li>
            <li>
              <strong>Mecanismo de Notificación y Acción (Art. 16 DSA):</strong> Cualquier empresa, entidad o particular afectado dispone de un botón directo de <strong>&quot;🚩 Reportar&quot;</strong> junto a cada reseña pública. Mediante este formulario legal motivado, el interesado puede solicitar la revisión y retirada inmediata del contenido ilícito, recibiendo el acuse de recibo y la resolución correspondiente.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">9. Exclusión de Garantías y Responsabilidad</h2>
          <p>
            Portal Trabajo IT no se hace responsable de la veracidad, exactitud o vigencia de los procesos de selección gestionados por terceras empresas u originados en fuentes externas, ni de los acuerdos contractuales o condiciones salariales definitivas que el usuario formalice con los empleadores.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">10. Legislación Aplicable, Jurisdicción y Resolución Alternativa de Litigios (ADR)</h2>
          <p>
            Para la resolución de todas las controversias o cuestiones relacionadas con el presente sitio web o de las actividades en él desarrolladas, será de aplicación la legislación española, siendo competentes para la resolución de todos los conflictos derivados o relacionados con su uso los Juzgados y Tribunales del domicilio del usuario consumidor, o los Juzgados de Madrid para controversias entre empresas (B2B).
          </p>
          <p className="mt-2">
            <strong>Resolución extrajudicial de litigios de consumo (Ley 7/2017 y Directiva 2013/11/UE):</strong> Tras la clausura de la antigua plataforma europea ODR dispuesta por el Reglamento (UE) 2024/3228, cualquier consumidor puede presentar reclamaciones directamente a través de nuestro canal de atención (<strong>{legalEmail}</strong>) o acudir a las Juntas Arbitrales de Consumo competentes en España y entidades de resolución alternativa acreditadas conforme a la Ley 7/2017.
          </p>
        </section>
      </div>
    </div>
  );
}
