import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Informe del Mercado Laboral IT en España',
  description: 'Análisis de salarios, tecnologías más demandadas y tendencias del empleo tecnológico en España.',
  alternates: {
    canonical: `${BASE_URL}/informe-mercado-it`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
