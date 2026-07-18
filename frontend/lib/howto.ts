import type { InterviewTech } from '@/lib/entrevistas';

/**
 * Generate a JSON‑LD HowTo schema for an interview tech page.
 * The steps are a hybrid of static template and dynamic data.
 * Static parts ensure consistent tone (professional & friendly),
 * while the tech name is injected dynamically.
 */
export function generateHowToSteps(item: InterviewTech) {
  const steps = [
    {
      '@type': 'HowToStep',
      name: `Investiga la tecnología ${item.name}`,
      url: `${item.url || ''}`,
      image: `${item.image || ''}`,
      text: `Lee la documentación oficial, blogs y tutoriales de ${item.name} para comprender conceptos clave y buenas prácticas.`,
    },
    {
      '@type': 'HowToStep',
      name: `Practica preguntas de entrevista para ${item.name}`,
      text: `Resuelve al menos 5 preguntas típicas de nivel junior, medio y senior (puedes usar la sección de preguntas de esta página).`,
    },
    {
      '@type': 'HowToStep',
      name: `Prepara tu portfolio y CV orientado a ${item.name}`,
      text: `Incluye proyectos reales o de código abierto que usen ${item.name}, resaltando responsabilidades y resultados.`,
    },
    {
      '@type': 'HowToStep',
      name: `Simula la entrevista para ${item.name}`,
      text: `Practica con un compañero o una herramienta de entrevista simulada, enfocándote en explicar conceptos de ${item.name} con claridad.`,
    },
    {
      '@type': 'HowToStep',
      name: `Revisa feedback y mejora`,
      text: `Analiza la retroalimentación recibida y fortalece los puntos débiles antes de la entrevista real.`,
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Cómo preparar una entrevista de ${item.name}`,
    description: `Guía paso a paso para preparar la entrevista técnica de ${item.name} (junior, mid, senior).`,
    publisher: {
      '@type': 'Organization',
      name: 'Portal Trabajo IT',
      logo: { '@type': 'ImageObject', url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo.png` },
    },
    step: steps,
  };
}
