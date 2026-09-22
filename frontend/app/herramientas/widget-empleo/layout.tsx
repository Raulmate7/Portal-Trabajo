import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Generador de Widget de Empleo Embebible | Portal Trabajo IT',
  description: 'Crea tu propio widget de empleo IT para incrustar en blogs, webs universitarias o comunidades tech. Filtra por tecnología, ciudad y tema visual.',
  alternates: {
    canonical: `${BASE_URL}/herramientas/widget-empleo`,
  },
  openGraph: {
    title: 'Widget de Empleo IT Embebible | Portal Trabajo IT',
    description: 'Incrusta gratuitamente vacantes IT en tu web. Filtra por React, Python, Java y más.',
    url: `${BASE_URL}/herramientas/widget-empleo`,
  },
};

export default function WidgetEmpleoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
