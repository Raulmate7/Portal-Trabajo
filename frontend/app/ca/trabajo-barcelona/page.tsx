import CityLandingPage from "@/components/CityLandingPage";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const CITY_SLUG = "barcelona";
const CITY_NAME = "Barcelona";

export async function generateMetadata(): Promise<Metadata> {
  const title = `Feina d'Informàtica i Programació a Barcelona [2026] | Portal Treball IT`;
  const description = `Trobada de les millors ofertes de feina d'informàtica i desenvolupament de programari a Barcelona. Oportunitats en React, Java, Python, DevOps i més.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/ca/trabajo-barcelona`,
      languages: {
        'es-ES': `${BASE_URL}/trabajo-barcelona`,
        'ca': `${BASE_URL}/ca/trabajo-barcelona`,
        'en': `${BASE_URL}/trabajo-barcelona?lang=en`,
        'x-default': `${BASE_URL}/trabajo-barcelona`,
      }
    },
    openGraph: {
      title: `Ofertes de Feina IT a Barcelona — Hub Tecnològic`,
      description,
      url: `${BASE_URL}/ca/trabajo-barcelona`,
    },
  };
}

export default async function Page({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  return (
    <CityLandingPage 
      citySlug={CITY_SLUG} 
      cityName={CITY_NAME} 
      searchParams={resolvedSearchParams} 
    />
  );
}
