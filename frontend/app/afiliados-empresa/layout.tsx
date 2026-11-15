import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Programa de Afiliados para Empresas IT',
  description: 'Colabora con Portal Trabajo IT y monetiza recomendando talento y ofertas tecnológicas.',
  alternates: {
    canonical: `${BASE_URL}/afiliados-empresa`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
