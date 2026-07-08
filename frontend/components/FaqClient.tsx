'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface FaqItem {
  q: string;
  a: React.ReactNode;
  plainText: string;
}

export interface FaqCategory {
  icon: string;
  title: string;
  items: FaqItem[];
}

function AccordionItem({ item, isOpen, onToggle }: { item: any; isOpen: boolean; onToggle: () => void }) {
  // Mapeamos los enlaces en las respuestas de forma segura
  const renderAnswer = (text: string) => {
    // Si contiene marcas o referencias específicas de enlaces
    if (text.includes("Calculadora de Salarios IT")) {
      return (
        <>
          Lamentablemente, una parte significativa de las empresas en España aún publica sus vacantes sin indicar el rango salarial. Nosotros mostramos los datos tal y como los publica la empresa original, sin inventar ni estimar salarios. Para aquellas sin dato, te recomendamos usar nuestra{' '}
          <Link href="/salarios" className="text-indigo-650 hover:underline font-semibold">Calculadora de Salarios IT</Link>
          {' '}para obtener una referencia de mercado real.
        </>
      );
    }
    if (text.includes("Buscador IT")) {
      return (
        <>
          En nuestro{' '}
          <Link href="/trabajos/informatica-tecnologia" className="text-indigo-650 hover:underline font-semibold">Buscador IT</Link>
          {' '}encontrarás filtros rápidos de modalidad (100% Remoto, Híbrido, Presencial). También puedes acceder directamente a nuestra sección de{' '}
          <Link href="/trabajo-remoto" className="text-indigo-650 hover:underline font-semibold">Trabajo Remoto</Link>
          {' '}con las mejores vacantes sin necesidad de desplazamiento.
        </>
      );
    }
    if (text.includes("Calculadora de Salarios IT cruza")) {
      return (
        <>
          Nuestra{' '}
          <Link href="/salarios" className="text-indigo-650 hover:underline font-semibold">Calculadora de Salarios IT</Link>
          {' '}cruza los datos salariales reales extraídos de las ofertas activas para calcular percentiles de mercado (P25, mediana P50 y P75) según tu tecnología, nivel de experiencia (Junior / Mid / Senior) y modalidad de trabajo. Los datos se actualizan periódicamente para reflejar el estado real del mercado.
        </>
      );
    }
    if (text.includes("sección de salarios")) {
      return (
        <>
          El mercado retribuye de forma diferente cada especialidad en función de la demanda y la oferta de talento disponible. Tecnologías con menor número de profesionales cualificados (ej: Rust, Go, Scala o Ciberseguridad) suelen tener salarios notablemente superiores a stacks de mayor adopción masiva. Consulta la comparativa detallada en nuestra{' '}
          <Link href="/salarios" className="text-indigo-650 hover:underline font-semibold">sección de salarios</Link>.
        </>
      );
    }
    if (text.includes("Ofertas Guardadas")) {
      return (
        <>
          Puedes guardar cualquier vacante haciendo clic en el icono de marcador (🔖) en la tarjeta de la oferta. Las ofertas guardadas quedan almacenadas en tu dispositivo y son accesibles desde la sección de{' '}
          <Link href="/ofertas-guardadas" className="text-indigo-650 hover:underline font-semibold">Ofertas Guardadas</Link>
          {' '}sin necesidad de registrarte.
        </>
      );
    }
    if (text.includes("Política de Privacidad")) {
      return (
        <>
          No vendemos ni compartimos datos personales de nuestros usuarios con terceros. El portal utiliza cookies de analítica web (Google Analytics) para mejorar la experiencia y cookies de publicidad contextual (Google AdSense) para financiar el mantenimiento del servicio gratuito. Puedes consultar todos los detalles en nuestra{' '}
          <Link href="/privacy" className="text-indigo-650 hover:underline font-semibold">Política de Privacidad</Link>
          {' '}y gestionar tus preferencias en el banner de cookies.
        </>
      );
    }
    if (text.includes("@PortalDeTrabajo")) {
      return (
        <>
          Puedes suscribirte a notificaciones push desde el navegador (a través del botón que aparece en la esquina inferior derecha de la página, gestionado por OneSignal). También puedes seguir nuestro canal de Telegram{' '}
          <a href="https://t.me/PortalDeTrabajo" target="_blank" rel="noopener noreferrer" className="text-indigo-650 hover:underline font-semibold font-sans">@PortalDeTrabajo</a>
          {' '}donde publicamos las nuevas vacantes en tiempo real.
        </>
      );
    }
    if (text.includes("Publicar Oferta")) {
      return (
        <>
          Accede a nuestra sección de{' '}
          <Link href="/publicar-oferta" className="text-indigo-650 hover:underline font-semibold">Publicar Oferta</Link>
          {' '}para enviar los detalles de tu vacante. Las ofertas patrocinadas aparecen destacadas en la parte superior de los resultados y tienen mayor visibilidad ante candidatos cualificados activos. Consulta nuestros{' '}
          <Link href="/precios" className="text-indigo-650 hover:underline font-semibold">planes y precios</Link>
          {' '}para más detalles.
        </>
      );
    }
    if (text.includes("contacto@portalempleoit.com")) {
      return (
        <>
          Sí. Si eres la empresa o el representante autorizado de la empresa que publicó la vacante y deseas que la retiremos de nuestro índice, escríbenos a{' '}
          <a href="mailto:contacto@portalempleoit.com" className="text-indigo-650 hover:underline font-semibold">contacto@portalempleoit.com</a>
          {' '}indicando la URL de la oferta. Gestionaremos la baja en un plazo máximo de 48 horas laborables.
        </>
      );
    }
    if (text.includes("página de publicidad")) {
      return (
        <>
          Sí. Ofrecemos espacios de publicidad contextual y patrocinio de categorías para empresas que deseen aumentar su visibilidad ante un público de desarrolladores y profesionales IT en España. Consulta nuestra{' '}
          <Link href="/publicidad" className="text-indigo-650 hover:underline font-semibold">página de publicidad</Link>
          {' '}o contáctanos directamente para recibir un presupuesto personalizado.
        </>
      );
    }
    return text;
  };

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
          <div className="text-sm md:text-base text-gray-650 leading-relaxed font-sans">
            {renderAnswer(item.plainText)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FaqClient({ categories }: { categories: any[] }) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-10">
      {categories.map((category, catIdx) => (
        <section key={catIdx} className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{category.icon}</span>
            <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
          </div>
          <div className="space-y-2">
            {category.items.map((item: any, itemIdx: number) => {
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
  );
}
