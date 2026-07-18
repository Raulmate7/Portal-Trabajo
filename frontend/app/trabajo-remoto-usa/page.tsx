import RemoteCountryLandingPage, { generateRemoteCountryMetadata } from "@/components/RemoteCountryLandingPage";
import { Metadata } from "next";

const countryKey = "usa";
const countryName = "Estados Unidos (USA)";
const countryNameEn = "United States (USA)";
const sqlFilter = "location ILIKE $1 OR location ILIKE $2 OR location ILIKE $3 OR location ILIKE $4";
const sqlParams = ["%usa%", "%united states%", "%eeuu%", "%ee.uu.%"];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  return generateRemoteCountryMetadata(countryKey, countryName, countryNameEn, sqlFilter, sqlParams, page, lang);
}

export default async function RemoteUSAPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';

  return (
    <RemoteCountryLandingPage
      countryKey={countryKey}
      countryName={countryName}
      countryNameEn={countryNameEn}
      sqlFilter={sqlFilter}
      sqlParams={sqlParams}
      page={page}
      lang={lang}
    />
  );
}
