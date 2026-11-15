import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Orientación Profesional IT y Carrera Tech',
  description: 'Guía de orientación profesional para desarrolladores, perfiles IT y estudiantes de informática en España.',
  alternates: {
    canonical: `${BASE_URL}/orientacion-profesional`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
