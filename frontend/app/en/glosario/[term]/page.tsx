import GlossaryDetailPage, { generateMetadata as baseGenerateMetadata, generateStaticParams as baseGenerateStaticParams } from '@/app/glosario/[term]/page';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

type Props = {
  params: Promise<{ term: string }>;
};

export async function generateStaticParams() {
  return baseGenerateStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const metadata = await baseGenerateMetadata({ params });
  const { term } = await params;
  return {
    ...metadata,
    alternates: {
      canonical: `${BASE_URL}/en/glosario/${term}`,
      languages: {
        'es-ES': `${BASE_URL}/glosario/${term}`,
        'en': `${BASE_URL}/en/glosario/${term}`,
        'x-default': `${BASE_URL}/glosario/${term}`,
      }
    }
  };
}

export default async function EnGlossaryDetailPage({ params }: Props) {
  return <GlossaryDetailPage params={params} />;
}
