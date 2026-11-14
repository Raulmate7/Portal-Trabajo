import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Declaración de Accesibilidad | Portal Trabajo IT",
  description: "Declaración oficial de accesibilidad web de Portal Trabajo IT conforme a la Ley 11/2023, la Directiva UE 2019/882 y las pautas WCAG 2.1 AA.",
  alternates: {
    canonical: "/accesibilidad",
  },
};

export default function AccesibilidadPage() {
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Declaración de Accesibilidad" }
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-10 space-y-6 text-gray-700 dark:text-slate-300 text-sm leading-relaxed mt-4">
          <header className="border-b border-gray-100 dark:border-slate-800 pb-5">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
              ♿ Declaración de Accesibilidad Web
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              En cumplimiento de la Ley 11/2023, de 8 de mayo, la Directiva (UE) 2019/882 (Acta Europea de Accesibilidad) y las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1 Nivel AA).
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              Última revisión y actualización técnica: Noviembre de 2026.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. Compromiso con la Accesibilidad Universal</h2>
            <p>
              Portal Trabajo IT tiene el firme compromiso de garantizar que todos los desarrolladores, ingenieros y profesionales del sector tecnológico puedan acceder a nuestras ofertas de empleo, guías salariales y recursos informativos en igualdad de condiciones, sin que la edad, discapacidades visuales, auditivas, motrices o cognitivas supongan una barrera de acceso.
            </p>
            <p>
              Para ello, la arquitectura técnica de este portal ha sido diseñada y desarrollada siguiendo las pautas <strong>WCAG 2.1 en su nivel de conformidad AA</strong> y la norma técnica europea <strong>UNE-EN 301 549</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. Estado de Cumplimiento Técnico</h2>
            <p>
              Este sitio web es <strong>parcialmente conforme con las pautas WCAG 2.1 nivel AA</strong> y la norma <strong>UNE-EN 301 549</strong> debido a las áreas en proceso de mejora continua detalladas en el apartado siguiente, contando con las siguientes medidas activas:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Navegación completa por teclado:</strong> Todos los elementos interactivos (menús, botones de filtros, formularios, acordeones y enlaces de postulación) disponen de indicadores de foco visibles y pueden ser operados mediante el tabulador y las teclas estándar sin bloqueos de teclado (*keyboard traps*).
              </li>
              <li>
                <strong>Compatibilidad con lectores de pantalla (Screen Readers):</strong> Uso de HTML5 semántico (<code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;footer&gt;</code>), atributos ARIA descriptivos (<code>aria-label</code>, <code>aria-current</code>, <code>aria-hidden</code>) y etiquetado explícito de campos de formulario mediante <code>htmlFor</code> e <code>id</code>.
              </li>
              <li>
                <strong>Ratios de contraste cromático optimizados:</strong> Todo el texto estático y componentes de interfaz cumplen o superan el ratio mínimo de contraste de 4.5:1 para texto normal y 3:1 para textos grandes o iconos interactivos (contrastes adaptados tanto en modo claro como en modo oscuro).
              </li>
              <li>
                <strong>Alternativas textuales en imágenes y logotipos:</strong> Todas las imágenes corporativas y de contenido cuentan con atributos <code>alt</code> descriptivos y nominativos, omitiendo la carga de elementos decorativos redundantes en tecnologías de asistencia.
              </li>
              <li>
                <strong>Diseño adaptable y zoom sin pérdida:</strong> El diseño responsive permite ampliar el contenido hasta un 200% mediante el zoom del navegador sin truncamiento de textos ni solapamiento de contenedores.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. Contenido No Accesible y Limitaciones Conocidas</h2>
            <p>
              Seguimos auditando componentes interactivos, contrastes en modo oscuro y anuncios dinámicos (`aria-live`). Actualmente existen las siguientes excepciones o limitaciones conocidas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Componentes de terceros y publicidad (AdSense / afiliación):</strong> Algunos bloques incrustados externos pueden introducir variaciones de contraste o desplazamiento visual en proceso de estabilización.
              </li>
              <li>
                <strong>Páginas web de destino de terceros:</strong> Al pulsar en &quot;Aplicar en la web original&quot;, el usuario es redirigido a las bolsas de trabajo, Applicant Tracking Systems (ATS) o portales de empleo de las empresas contratantes. Portal Trabajo IT no ostenta control técnico sobre la accesibilidad de dichas plataformas externas.
              </li>
              <li>
                <strong>Documentos PDF archivísticos generados con anterioridad</strong> a la entrada en vigor de los requerimientos técnicos de la Ley 11/2023.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">4. Mecanismo de Notificación y Contacto de Accesibilidad</h2>
            <p>
              Si encuentras cualquier dificultad o barrera de acceso en nuestro sitio web, detectas un incumplimiento de accesibilidad o deseas solicitar información en un formato alternativo, puedes comunicarte directamente con nuestro equipo técnico y de cumplimiento:
            </p>
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 text-xs sm:text-sm">
              <p><strong>Canal de Accesibilidad:</strong> Correo electrónico a <a href="mailto:contacto@portalempleoit.com?subject=Incidencia%20de%20Accesibilidad%20Web" className="text-indigo-650 font-bold underline">contacto@portalempleoit.com</a></p>
              <p><strong>Asunto recomendado:</strong> &quot;Incidencia de Accesibilidad Web — [Breve descripción]&quot;</p>
              <p><strong>Plazo de respuesta:</strong> Nos comprometemos a responder y evaluar cualquier sugerencia o incidencia en un plazo inferior a <strong>5 días laborables</strong>.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">5. Procedimiento de Reclamación</h2>
            <p>
              Si tras formular una queja o solicitud de información accesible la respuesta fuera desestimada o no estuvieras conforme con la resolución adoptada, podrás iniciar una reclamación de conformidad con los trámites previstos en la <strong>Ley 11/2023</strong> y el <strong>Real Decreto 1112/2018</strong> ante la autoridad ministerial o autonómica competente en materia de no discriminación y accesibilidad de servicios de la sociedad de la información.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

