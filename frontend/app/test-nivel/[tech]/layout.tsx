import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';
import { QUIZZES } from '@/lib/test-nivel';

type Props = {
  params: Promise<{ tech: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tech } = await params;
  const quiz = Object.values(QUIZZES).find(q => q.slug === tech)
    ?? QUIZZES[tech];
  const name = quiz?.name ?? tech.charAt(0).toUpperCase() + tech.slice(1);

  return {
    title: `Test de Nivel ${name} | Evalúa tu Nivel IT`,
    description: `Comprueba tu nivel técnico de ${name} con 10 preguntas reales de entrevistas. Obtén tu diagnóstico Junior, Mid o Senior en menos de 5 minutos.`,
    alternates: {
      canonical: `${BASE_URL}/test-nivel/${tech}`,
    },
    openGraph: {
      title: `Test de Nivel ${name} | Portal Trabajo IT`,
      description: `Evalúa tu nivel de ${name} con preguntas reales de entrevistas IT.`,
      url: `${BASE_URL}/test-nivel/${tech}`,
    },
  };
}

export default function TestNivelTechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
