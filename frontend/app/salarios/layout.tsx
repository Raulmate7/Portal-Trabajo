import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculadora de Salarios IT en España [2025] | Portal Trabajo',
  description: 'Descubre cuánto cobra un programador en España. Salarios reales de React, Python, Java, Node.js, DevOps y más. Datos de miles de ofertas de empleo actualizadas.',
  openGraph: {
    title: 'Calculadora de Salarios IT — ¿Cuánto cobran los programadores en España?',
    description: 'Datos reales de salarios tech en España: React, Python, Java, Cloud y más. Filtra por tecnología, ciudad y experiencia.',
    url: 'https://portal-trabajo.vercel.app/salarios',
  },
  alternates: {
    canonical: 'https://portal-trabajo.vercel.app/salarios',
  },
};

export default function SalariosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
