'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqCategory {
  icon: string;
  title: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    icon: '🔍',
    title: 'Sobre las Ofertas de Empleo',
    items: [
      {
        q: '¿De dónde provienen las ofertas de empleo?',
        a: (
          <>
            Agregamos vacantes de más de una decena de fuentes especializadas en empleo tecnológico en España —incluyendo bolsas de trabajo de grandes empresas, portales IT nacionales e internacionales y publicaciones directas de equipos de People & Talent. Nuestro sistema revisa todas las fuentes cada 6 horas para incorporar las novedades en tiempo real.
          </>
        ),
      },
      {
        q: '¿Con qué frecuencia se actualizan las ofertas?',
        a: (
          <>
            El pipeline de ingesta y deduplicación se ejecuta de forma automática <strong>cada 6 horas</strong>. Esto significa que el catálogo de vacantes activas se renueva aproximadamente 4 veces al día, ofreciéndote siempre la información más fresca disponible en el mercado español.
          </>
        ),
      },
      {
        q: '¿Por qué veo algunas ofertas sin salario indicado?',
        a: (
          <>
            Lamentablemente, una parte significativa de las empresas en España aún publica sus vacantes sin indicar el rango salarial. Nosotros mostramos los datos tal y como los publica la empresa original, sin inventar ni estimarsal arios. Para aquellas sin dato, te recomendamos usar nuestra{' '}
            <Link href="/salarios" className="text-indigo-600 hover:underline font-medium">Calculadora de Salarios IT</Link>
            {' '}para obtener una referencia de mercado real.
          </>
        ),
      },
      {
        q: '¿Cómo se eliminan las ofertas duplicadas?',
        a: (
          <>
            Aplicamos un proceso de deduplicación semántica y estructural: comparamos el título del puesto, la empresa, la descripción y la URL de origen para detectar publicaciones idénticas o muy similares procedentes de distintas plataformas. Solo conservamos la primera entrada original para evitar el ruido en los resultados.
          </>
        ),
      },
      {
        q: '¿Cómo puedo filtrar por trabajo remoto o híbrido?',
        a: (
          <>
            En nuestro{' '}
            <Link href="/trabajos/informatica-tecnologia" className="text-indigo-600 hover:underline font-medium">Buscador IT</Link>
            {' '}encontrarás filtros rápidos de modalidad (100% Remoto, Híbrido, Presencial). También puedes acceder directamente a nuestra sección de{' '}
            <Link href="/trabajo-remoto" className="text-indigo-600 hover:underline font-medium">Trabajo Remoto</Link>
            {' '}con las mejores vacantes sin necesidad de desplazamiento.
          </>
        ),
      },
    ],
  },
  {
    icon: '💶',
    title: 'Salarios y Calculadora',
    items: [
      {
        q: '¿Cómo funciona la Calculadora de Salarios IT?',
        a: (
          <>
            Nuestra{' '}
            <Link href="/salarios" className="text-indigo-600 hover:underline font-medium">Calculadora de Salarios IT</Link>
            {' '}cruza los datos salariales reales extraídos de las ofertas activas para calcular percentiles de mercado (P25, mediana P50 y P75) según tu tecnología, nivel de experiencia (Junior / Mid / Senior) y modalidad de trabajo. Los datos se actualizan periódicamente para reflejar el estado real del mercado.
          </>
        ),
      },
      {
        q: '¿Los salarios son brutos o netos?',
        a: (
          <>
            Todos los rangos salariales que mostramos son <strong>brutos anuales</strong> (salario bruto anual en euros), tal y como los publicitan las empresas en sus ofertas. Para estimar tu salario neto aproximado, puedes aplicar las tablas del IRPF vigentes en España o utilizar un simulador fiscal externo.
          </>
        ),
      },
      {
        q: '¿Los datos salariales son representativos del mercado real?',
        a: (
          <>
            Son una referencia basada en las ofertas que sí detallan su rango salarial en España, que representan aproximadamente el 30-40% del total de vacantes publicadas. Para los puestos restantes las empresas no divulgan el dato públicamente. Por ello, los percentiles deben entenderse como una guía orientativa y no como una media estadísticamente perfecta de todo el sector.
          </>
        ),
      },
      {
        q: '¿Por qué varía el salario según la tecnología?',
        a: (
          <>
            El mercado retribuye de forma diferente cada especialidad en función de la demanda y la oferta de talento disponible. Tecnologías con menor número de profesionales cualificados (ej: Rust, Go, Scala o Ciberseguridad) suelen tener salarios notablemente superiores a stacks de mayor adopción masiva. Consulta la comparativa detallada en nuestra{' '}
            <Link href="/salarios" className="text-indigo-600 hover:underline font-medium">sección de salarios</Link>.
          </>
        ),
      },
    ],
  },
  {
    icon: '👤',
    title: 'Para Candidatos',
    items: [
      {
        q: '¿Tengo que registrarme para ver las ofertas?',
        a: (
          <>
            No. Puedes navegar por todas las ofertas, aplicar filtros, consultar los detalles de cada vacante y acceder a la calculadora de salarios de forma completamente gratuita y sin necesidad de crear ninguna cuenta. El registro es opcional y únicamente añade funcionalidades como guardar favoritos o crear alertas de empleo.
          </>
        ),
      },
      {
        q: '¿Cómo puedo guardar ofertas para revisarlas después?',
        a: (
          <>
            Puedes guardar cualquier vacante haciendo clic en el icono de marcador (🔖) en la tarjeta de la oferta. Las ofertas guardadas quedan almacenadas en tu dispositivo y son accesibles desde la sección de{' '}
            <Link href="/ofertas-guardadas" className="text-indigo-600 hover:underline font-medium">Ofertas Guardadas</Link>
            {' '}sin necesidad de registrarte.
          </>
        ),
      },
      {
        q: '¿El portal recoge y vende mis datos personales?',
        a: (
          <>
            No vendemos ni compartimos datos personales de nuestros usuarios con terceros. El portal utiliza cookies de analítica web (Google Analytics) para mejorar la experiencia y cookies de publicidad contextual (Google AdSense) para financiar el mantenimiento del servicio gratuito. Puedes consultar todos los detalles en nuestra{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline font-medium">Política de Privacidad</Link>
            {' '}y gestionar tus preferencias en el banner de cookies.
          </>
        ),
      },
      {
        q: '¿Cómo puedo recibir alertas de nuevas ofertas?',
        a: (
          <>
            Puedes suscribirte a notificaciones push desde el navegador (a través del botón que aparece en la esquina inferior derecha de la página, gestionado por OneSignal). También puedes seguir nuestro canal de Telegram{' '}
            <a href="https://t.me/PortalDeTrabajo" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">@PortalDeTrabajo</a>
            {' '}donde publicamos las nuevas vacantes en tiempo real.
          </>
        ),
      },
    ],
  },
  {
    icon: '🏢',
    title: 'Para Empresas y Reclutadores',
    items: [
      {
        q: '¿Cómo puedo publicar una oferta de empleo?',
        a: (
          <>
            Accede a nuestra sección de{' '}
            <Link href="/publicar-oferta" className="text-indigo-600 hover:underline font-medium">Publicar Oferta</Link>
            {' '}para enviar los detalles de tu vacante. Las ofertas patrocinadas aparecen destacadas en la parte superior de los resultados y tienen mayor visibilidad ante candidatos cualificados activos. Consulta nuestros{' '}
            <Link href="/precios" className="text-indigo-600 hover:underline font-medium">planes y precios</Link>
            {' '}para más detalles.
          </>
        ),
      },
      {
        q: '¿Puedo solicitar que se retire una oferta indexada?',
        a: (
          <>
            Sí. Si eres la empresa o el representante autorizado de la empresa que publicó la vacante y deseas que la retiremos de nuestro índice, escríbenos a{' '}
            <a href="mailto:contacto@portalempleoit.com" className="text-indigo-600 hover:underline font-medium">contacto@portalempleoit.com</a>
            {' '}indicando la URL de la oferta. Gestionaremos la baja en un plazo máximo de 48 horas laborables.
          </>
        ),
      },
      {
        q: '¿Disponéis de opciones de publicidad o patrocinio?',
        a: (
          <>
            Sí. Ofrecemos espacios de publicidad contextual y patrocinio de categorías para empresas que deseen aumentar su visibilidad ante un público de desarrolladores y profesionales IT en España. Consulta nuestra{' '}
            <Link href="/publicidad" className="text-indigo-600 hover:underline font-medium">página de publicidad</Link>
            {' '}o contáctanos directamente para recibir un presupuesto personalizado.
          </>
        ),
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-indigo-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-indigo-50/30 transition-colors"
        aria-expanded={isOpen}
      >
        <span className={`text-sm md:text-base font-semibold leading-snug ${isOpen ? 'text-indigo-700' : 'text-gray-800'}`}>
          {item.q}
        </span>
        <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-200 ${isOpen ? 'bg-indigo-600 border-indigo-600 rotate-45' : 'bg-white border-gray-200'}`}>
          <svg className={`w-3 h-3 transition-colors ${isOpen ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 bg-white border-t border-indigo-50">
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build JSON-LD schema
  const allQAs = FAQ_DATA.flatMap(cat => cat.items);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allQAs.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        // Render React nodes to plain text for schema
        text: typeof item.a === 'string' ? item.a : item.q,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Breadcrumb manual */}
        <nav className="text-xs text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Inicio</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">Preguntas Frecuentes</span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
            ❓ Centro de Ayuda
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 mb-4 tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Todo lo que necesitas saber sobre cómo funciona el portal, las ofertas de empleo, los salarios y cómo sacar el máximo partido al buscador.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {FAQ_DATA.map((category, catIdx) => (
            <section key={catIdx} className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
              </div>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  return (
                    <AccordionItem
                      key={key}
                      item={item}
                      isOpen={!!openItems[key]}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* CTA Final */}
        <div className="mt-14 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 rounded-2xl border border-indigo-100 p-8 text-center space-y-4">
          <p className="text-lg font-bold text-gray-900">¿No has encontrado lo que buscabas?</p>
          <p className="text-sm text-gray-500">
            Escríbenos directamente y te respondemos en menos de 24 horas laborables.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contacto"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow"
            >
              Contactar con el Equipo
            </Link>
            <Link
              href="/trabajos/informatica-tecnologia"
              className="inline-block bg-white hover:bg-gray-50 text-gray-800 font-bold px-6 py-3 rounded-xl text-sm transition-all border border-gray-200 hover:border-gray-300"
            >
              Buscar Ofertas IT
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
