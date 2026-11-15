import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Publicidad y Patrocinios en Portal Trabajo IT',
  description: 'Patrocina nuestra newsletter y llega a miles de programadores e ingenieros de software en España.',
  alternates: {
    canonical: `${BASE_URL}/publicidad`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
