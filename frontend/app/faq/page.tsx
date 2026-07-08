import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import FaqClient from '@/components/FaqClient';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // Cache por 1 día

const FAQ_DATA = [
  {
    icon: '🔍',
    title: 'Sobre las Ofertas de Empleo',
    items: [
      {
        q: '¿De dónde provienen las ofertas de empleo?',
        plainText: 'Agregamos vacantes de más de una decena de fuentes especializadas en empleo tecnológico en España —incluyendo bolsas de trabajo de grandes empresas, portales IT nacionales e internacionales y publicaciones directas de equipos de People & Talent. Nuestro sistema revisa todas las fuentes cada 6 horas para incorporar las novedades en tiempo real.'
      },
      {
        q: '¿Con qué frecuencia se actualizan las ofertas?',
        plainText: 'El pipeline de ingesta y deduplicación se ejecuta de forma automática cada 6 horas. Esto significa que el catálogo de vacantes activas se renueva aproximadamente 4 veces al día, ofreciéndote siempre la información más fresca disponible en el mercado español.'
      },
      {
        q: '¿Por qué veo algunas ofertas sin salario indicado?',
        plainText: 'Lamentablemente, una parte significativa de las empresas en España aún publica sus vacantes sin indicar el rango salarial. Nosotros mostramos los datos tal y como los publica la empresa original, sin inventar ni estimar salarios. Para aquellas sin dato, te recomendamos usar nuestra Calculadora de Salarios IT para obtener una referencia de mercado real.'
      },
      {
        q: '¿Cómo se eliminan las ofertas duplicadas?',
        plainText: 'Aplicamos un proceso de deduplicación semántica y estructural: comparamos el título del puesto, la empresa, la descripción y la URL de origen para detectar publicaciones idénticas o muy similares procedentes de distintas plataformas. Solo conservamos la primera entrada original para evitar el ruido en los resultados.'
      },
      {
        q: '¿Cómo puedo filtrar por trabajo remoto o híbrido?',
        plainText: 'En nuestro Buscador IT encontrarás filtros rápidos de modalidad (100% Remoto, Híbrido, Presencial). También puedes acceder directamente a nuestra sección de Trabajo Remoto con las mejores vacantes sin necesidad de desplazamiento.'
      },
    ],
  },
  {
    icon: '💶',
    title: 'Salarios y Calculadora',
    items: [
      {
        q: '¿Cómo funciona la Calculadora de Salarios IT?',
        plainText: 'Nuestra Calculadora de Salarios IT cruza los datos salariales reales extraídos de las ofertas activas para calcular percentiles de mercado (P25, mediana P50 y P75) según tu tecnología, nivel de experiencia (Junior / Mid / Senior) y modalidad de trabajo. Los datos se actualizan periódicamente para reflejar el estado real del mercado.'
      },
      {
        q: '¿Los salarios son brutos o netos?',
        plainText: 'Todos los rangos salariales que mostramos son brutos anuales (salario bruto anual en euros), tal y como los publicitan las empresas en sus ofertas. Para estimar tu salario neto aproximado, puedes aplicar las tablas del IRPF vigentes en España o utilizar un simulador fiscal externo.'
      },
      {
        q: '¿Los datos salariales son representativos del mercado real?',
        plainText: 'Son una referencia basada en las ofertas que sí detallan su rango salarial en España, que representan aproximadamente el 30-40% del total de vacantes publicadas. Para los puestos restantes las empresas no divulgan el dato públicamente. Por ello, los percentiles deben entenderse como una guía orientativa y no como una media estadísticamente perfecta de todo el sector.'
      },
      {
        q: '¿Por qué varía el salario según la tecnología?',
        plainText: 'El mercado retribuye de forma diferente cada especialidad en función de la demanda y la oferta de talento disponible. Tecnologías con menor número de profesionales cualificados (ej: Rust, Go, Scala o Ciberseguridad) suelen tener salarios notablemente superiores a stacks de mayor adopción masiva. Consulta la comparativa detallada en nuestra sección de salarios.'
      },
    ],
  },
  {
    icon: '👤',
    title: 'Para Candidatos',
    items: [
      {
        q: '¿Tengo que registrarme para ver las ofertas?',
        plainText: 'No. Puedes navegar por todas las ofertas, aplicar filtros, consultar los detalles de cada vacante y acceder a la calculadora de salarios de forma completamente gratuita y sin necesidad de crear ninguna cuenta. El registro es opcional y únicamente añade funcionalidades como guardar favoritos o crear alertas de empleo.'
      },
      {
        q: '¿Cómo puedo guardar ofertas para revisarlas después?',
        plainText: 'Puedes guardar cualquier vacante haciendo clic en el icono de marcador (🔖) en la tarjeta de la oferta. Las ofertas guardadas quedan almacenadas en tu dispositivo y son accesibles desde la sección de Ofertas Guardadas sin necesidad de registrarte.'
      },
      {
        q: '¿El portal recoge y vende mis datos personales?',
        plainText: 'No vendemos ni compartimos datos personales de nuestros usuarios con terceros. El portal utiliza cookies de analítica web (Google Analytics) para mejorar la experiencia y cookies de publicidad contextual (Google AdSense) para financiar el mantenimiento del servicio gratuito. Puedes consultar todos los detalles en nuestra Política de Privacidad y gestionar tus preferencias en el banner de cookies.'
      },
      {
        q: '¿Cómo puedo recibir alertas de nuevas ofertas?',
        plainText: 'Puedes suscribirte a notificaciones push desde el navegador (a través del botón que aparece en la esquina inferior derecha de la página, gestionado por OneSignal). También puedes seguir nuestro canal de Telegram @PortalDeTrabajo donde publicamos las nuevas vacantes en tiempo real.'
      },
    ],
  },
  {
    icon: '🏢',
    title: 'Para Empresas y Reclutadores',
    items: [
      {
        q: '¿Cómo puedo publicar una oferta de empleo?',
        plainText: 'Accede a nuestra sección de Publicar Oferta para enviar los detalles de tu vacante. Las ofertas patrocinadas aparecen destacadas en la parte superior de los resultados y tienen mayor visibilidad ante candidatos cualificados activos. Consulta nuestros planes y precios para más detalles.'
      },
      {
        q: '¿Puedo solicitar que se retire una oferta indexada?',
        plainText: 'Sí. Si eres la empresa o el representante autorizado de la empresa que publicó la vacante y deseas que la retiremos de nuestro índice, escríbenos a contacto@portalempleoit.com indicando la URL de la oferta. Gestionaremos la baja en un plazo máximo de 48 horas laborables.'
      },
      {
        q: '¿Disponéis de opciones de publicidad o patrocinio?',
        plainText: 'Sí. Ofrecemos espacios de publicidad contextual y patrocinio de categorías para empresas que deseen aumentar su visibilidad ante un público de desarrolladores y profesionales IT en España. Consulta nuestra página de publicidad o contáctanos directamente para recibir un presupuesto personalizado.'
      },
    ],
  },
];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const title = isEnglish
    ? 'Frequently Asked Questions (FAQ) | IT Job Portal'
    : 'Preguntas Frecuentes (FAQ) | Portal Trabajo IT';

  const description = isEnglish
    ? 'Everything you need to know about the IT Job Portal, tech vacancies in Spain, salaries, and how to make the most of the search engine.'
    : 'Todo lo que necesitas saber sobre el funcionamiento del portal, las ofertas de empleo tecnológico en España, los salarios y cómo buscar trabajo.';

  const queryParam = isEnglish ? '?lang=en' : '';
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/faq${queryParam}`,
      languages: {
        'es-ES': `${BASE_URL}/faq`,
        'en': `${BASE_URL}/faq?lang=en`,
        'x-default': `${BASE_URL}/faq`,
      }
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/faq${queryParam}`,
      siteName: 'Portal Trabajo IT',
      locale: isEnglish ? 'en_US' : 'es_ES',
    }
  };
}

export default async function FaqPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

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
        text: item.plainText,
      },
    })),
  };

  const breadcrumbItems = [
    { label: isEnglish ? 'Home' : 'Inicio', href: isEnglish ? '/?lang=en' : '/' },
    { label: isEnglish ? 'Frequently Asked Questions' : 'Preguntas Frecuentes' }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
            ❓ {isEnglish ? 'Help Center' : 'Centro de Ayuda'}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 mb-4 tracking-tight">
            {isEnglish ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            {isEnglish
              ? 'Everything you need to know about how the portal works, job openings, salaries, and how to get the most out of our search tools.'
              : 'Todo lo que necesitas saber sobre cómo funciona el portal, las ofertas de empleo, los salarios y cómo sacar el máximo partido al buscador.'
            }
          </p>
        </div>

        {/* FAQ Categories Rendered Client Side */}
        <FaqClient categories={FAQ_DATA} />

        {/* CTA Final */}
        <div className="mt-14 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 rounded-2xl border border-indigo-100 p-8 text-center space-y-4">
          <p className="text-lg font-bold text-gray-900">
            {isEnglish ? 'Could not find what you were looking for?' : '¿No has encontrado lo que buscabas?'}
          </p>
          <p className="text-sm text-gray-500">
            {isEnglish
              ? 'Write to us directly and we will respond in less than 24 business hours.'
              : 'Escríbenos directamente y te respondemos en menos de 24 horas laborables.'
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isEnglish ? "/contacto?lang=en" : "/contacto"}
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow"
            >
              {isEnglish ? 'Contact Support' : 'Contactar con el Equipo'}
            </Link>
            <Link
              href={isEnglish ? "/trabajos/informatica-tecnologia?lang=en" : "/trabajos/informatica-tecnologia"}
              className="inline-block bg-white hover:bg-gray-50 text-gray-800 font-bold px-6 py-3 rounded-xl text-sm transition-all border border-gray-200 hover:border-gray-300"
            >
              {isEnglish ? 'Search IT Jobs' : 'Buscar Ofertas IT'}
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
