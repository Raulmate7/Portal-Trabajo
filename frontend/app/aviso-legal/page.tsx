import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: 'Aviso Legal | Portal Trabajo IT',
  description: 'Términos y condiciones de uso de la plataforma de empleo tecnológico Portal Trabajo IT.',
  alternates: {
    canonical: '/aviso-legal',
  },
};

export default function LegalPage() {
  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Aviso Legal' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
        ⚖️ Aviso Legal
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 text-gray-750 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">1. Datos Identificativos</h2>
          <p>
            En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se reflejan los siguientes datos:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Titular:</strong> Portal Trabajo IT</li>
            <li><strong>Contacto principal:</strong> contacto@portalempleoit.com</li>
            <li><strong>Sitio Web:</strong> portalempleoit.com</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">2. Usuarios</h2>
          <p>
            El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. Las citadas Condiciones serán de aplicación independientemente de las Condiciones Generales de Contratación que en su caso resulten de obligado cumplimiento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">3. Uso del Portal</h2>
          <p>
            portalempleoit.com proporciona el acceso a multitud de informaciones, servicios o datos (en adelante, "los contenidos") en Internet pertenecientes a Portal Trabajo IT o a sus licenciantes a los que el USUARIO pueda tener acceso. El USUARIO asume la responsabilidad del uso del portal. Dicha responsabilidad se extiende al registro que fuese necesario para acceder a determinados servicios o contenidos (como el envío de alertas de empleo o el registro de candidatos).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">4. Protección de Datos</h2>
          <p>
            Portal Trabajo IT cumple con las directrices del Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales, y vela por garantizar un correcto uso y tratamiento de los datos personales del usuario. Para más detalles, por favor consulta nuestra Política de Privacidad.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">5. Propiedad Intelectual e Industrial</h2>
          <p>
            Portal Trabajo IT por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo: imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, etc.). Todos los derechos reservados.
          </p>
          <p className="mt-2">
            Las ofertas de empleo que proceden de fuentes de terceros siguen perteneciendo a sus respectivos autores y marcas, y se indexan de forma pública bajo el amparo de la libertad de agregación de información.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">6. Exclusión de Garantías y Responsabilidad</h2>
          <p>
            Portal Trabajo IT no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">7. Modificaciones</h2>
          <p>
            Portal Trabajo IT se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su portal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">8. Enlaces</h2>
          <p>
            En el caso de que en portalempleoit.com se dispusiesen enlaces o hipervínculos hacía otros sitios de Internet, Portal Trabajo IT no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso asumirá responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-950 mb-2">9. Modificación de las Presentes Condiciones y Duración</h2>
          <p>
            Portal Trabajo IT podrá modificar en cualquier momento las condiciones aquí determinadas, siendo debidamente publicadas como aquí aparecen. La vigencia de las citadas condiciones irá en función de su exposición y estarán vigentes hasta que sean modificadas por otras debidamente publicadas.
          </p>
        </section>
      </div>
    </div>
  );
}
