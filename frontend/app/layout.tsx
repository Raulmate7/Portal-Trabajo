import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://portal-trabajo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Portal Trabajo IT | Ofertas de Empleo Tech en España",
    template: "%s | Portal Trabajo IT",
  },
  description:
    "Agregador de ofertas de empleo para programadores en España. Vacantes de Java, Python, React, Node.js, DevOps, Data Science, AWS y más. Actualizado cada 6 horas.",
  keywords: [
    "ofertas trabajo programación españa",
    "empleo desarrollador",
    "trabajo java españa",
    "trabajo python españa",
    "trabajo react españa",
    "trabajo remoto programacion",
    "trabajo frontend backend madrid barcelona",
    "vacantes IT españa",
    "empleo informatica",
  ],
  authors: [{ name: "Portal Trabajo IT" }],
  creator: "Portal Trabajo IT",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: BASE_URL,
    siteName: "Portal Trabajo IT",
    title: "Portal Trabajo IT | Ofertas de Empleo Tech en España",
    description:
      "Las mejores ofertas de trabajo para programadores en España. Java, Python, React, DevOps y más. Actualizado cada 6 horas.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Portal Trabajo IT — Ofertas de empleo para desarrolladores en España",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal Trabajo IT | Ofertas de Empleo Tech en España",
    description:
      "Las mejores ofertas de trabajo para programadores en España. Actualizado cada 6 horas.",
    images: [`${BASE_URL}/og-image.png`],
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: BASE_URL,
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
    },
  },
  other: {
    "impact-site-verification": "58afcc07-f733-4e3d-99c2-05e359693a4c",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900`}>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
