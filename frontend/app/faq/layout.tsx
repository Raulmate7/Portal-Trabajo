import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes (FAQ) | Portal Trabajo IT',
  description: 'Resolvemos todas tus dudas sobre el portal: cómo funcionan las ofertas de empleo IT, cómo calcular tu salario, privacidad, publicar vacantes y mucho más.',
  alternates: {
    canonical: `${BASE_URL}/faq`,
  },
  openGraph: {
    title: 'Preguntas Frecuentes | Portal Trabajo IT',
    description: 'Todo lo que necesitas saber sobre Portal Trabajo IT: ofertas de empleo, salarios, privacidad y cómo funciona el portal.',
    url: `${BASE_URL}/faq`,
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
