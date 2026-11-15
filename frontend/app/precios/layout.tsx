import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Planes y Precios para Empresas y Reclutadores',
  description: 'Publica ofertas de empleo IT destacadas y conecta con desarrolladores en España.',
  alternates: {
    canonical: `${BASE_URL}/precios`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
