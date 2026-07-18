import SectorPage, { generateMetadata as baseGenerateMetadata } from '@/app/trabajos/[sector]/page';
import { Metadata } from 'next';

type Params = Promise<{ sector: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ 
  params, 
  searchParams 
}: { 
  params: Params; 
  searchParams: SearchParams;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const englishSearchParams = Promise.resolve({ ...resolvedSearchParams, lang: 'en' });
  return baseGenerateMetadata({ params, searchParams: englishSearchParams });
}

export default async function EnSectorPage({ 
  params, 
  searchParams 
}: { 
  params: Params; 
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const englishSearchParams = Promise.resolve({ ...resolvedSearchParams, lang: 'en' });
  return <SectorPage params={params} searchParams={englishSearchParams} />;
}
