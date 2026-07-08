import CityLandingPage from "@/components/CityLandingPage";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const CITY_SLUG = "zaragoza";
const CITY_NAME = "Zaragoza";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const isPaged = !isNaN(page) && page > 1;
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';

  const title = isEnglish
    ? `IT and Programming Jobs in ${CITY_NAME}${isPaged ? ` - Page ${page}` : ''} [2026] | IT Job Portal`
    : `Trabajo de Informática y Programación en ${CITY_NAME}${isPaged ? ` - Página ${page}` : ''} [2026] | Portal Trabajo IT`;

  const description = isEnglish
    ? `Find the best IT and software development job offers in ${CITY_NAME}. Apply to active openings for React, Java, Python, DevOps, and more.${isPaged ? ` (Page ${page})` : ''}`
    : `Encuentra las mejores ofertas de empleo informático y desarrollo de software en ${CITY_NAME} y alrededores. Trabaja en React, Java, Python, DevOps y más.${isPaged ? ` (Página ${page})` : ''}`;

  const queryParam = isEnglish ? '?lang=en' : '';
  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/trabajo-${CITY_SLUG}${queryParam}`,
      languages: {
        'es-ES': `${BASE_URL}/trabajo-${CITY_SLUG}`,
        'en': `${BASE_URL}/trabajo-${CITY_SLUG}?lang=en`,
        'x-default': `${BASE_URL}/trabajo-${CITY_SLUG}`,
      }
    },
    openGraph: {
      title: isEnglish ? `IT Jobs in ${CITY_NAME} — Tech Hub` : `Empleo IT en ${CITY_NAME} — Ofertas Activas`,
      description,
      url: `${BASE_URL}/trabajo-${CITY_SLUG}${queryParam}`,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Empleo IT en ${CITY_NAME}`,
        },
      ],
    },
  };

  if (isPaged) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
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
