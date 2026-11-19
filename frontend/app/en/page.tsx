import Home, { generateMetadata as baseGenerateMetadata } from '@/app/page';
import { Metadata } from 'next';

export const revalidate = 300;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const englishSearchParams = Promise.resolve({ ...resolvedSearchParams, lang: 'en' });
  return baseGenerateMetadata({ searchParams: englishSearchParams });
}

export default async function EnHomePage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const englishSearchParams = Promise.resolve({ ...resolvedSearchParams, lang: 'en' });
  return <Home searchParams={englishSearchParams} />;
}
