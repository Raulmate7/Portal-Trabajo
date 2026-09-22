import InterviewTechPage, { generateMetadata as baseGenerateMetadata, generateStaticParams as baseGenerateStaticParams } from '@/app/entrevistas/[tech]/page';
import { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants';

type Props = {
  params: Promise<{ tech: string }>;
};

export async function generateStaticParams() {
  return baseGenerateStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const metadata = await baseGenerateMetadata({ params });
  const { tech } = await params;
  return {
    ...metadata,
    alternates: {
      canonical: `${BASE_URL}/en/entrevistas/${tech}`,
      languages: {
        'es-ES': `${BASE_URL}/entrevistas/${tech}`,
        'en': `${BASE_URL}/en/entrevistas/${tech}`,
        'x-default': `${BASE_URL}/entrevistas/${tech}`,
      }
    }
  };
}

export default async function EnInterviewTechPage({ params }: Props) {
  return <InterviewTechPage params={params} />;
}
