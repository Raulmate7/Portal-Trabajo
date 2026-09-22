import CityLandingPage from "@/components/CityLandingPage";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const CITY_SLUG = "bilbao";
const CITY_NAME = "Bilbao";

export async function generateMetadata(): Promise<Metadata> {
  const title = `Informatika eta Programazio Lanak Bilbon [2026] | Portal Trabajo IT`;
  const description = `Aurkitu informatikako eta software garapeneko lan-eskaintza onenak Bilbon. React, Java, Python, DevOps eta gehiago.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/eu/trabajo-bilbao`,
      languages: {
        'es-ES': `${BASE_URL}/trabajo-bilbao`,
        'eu': `${BASE_URL}/eu/trabajo-bilbao`,
        'en': `${BASE_URL}/trabajo-bilbao?lang=en`,
        'x-default': `${BASE_URL}/trabajo-bilbao`,
      }
    },
    openGraph: {
      title: `IT Lan Eskaintzak Bilbon — Euskal Herria Tech`,
      description,
      url: `${BASE_URL}/eu/trabajo-bilbao`,
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
