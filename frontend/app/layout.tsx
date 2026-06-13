import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { BASE_URL } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

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
    "empleo programador 2026",
    "trabajo informatica sin experiencia",
    "bolsa empleo tech España",
    "vacantes IT España 2026",
    "salarios programadores españa"
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
    languages: {
      'es-ES': BASE_URL,
      'x-default': BASE_URL,
    },
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
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  return (
    <html lang="es">
      <head>
        <script
          id="third-party-lazy-load"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var adsenseId = ${adsenseClientId ? `"${adsenseClientId}"` : 'null'};
                var onesignalId = ${onesignalAppId ? `"${onesignalAppId}"` : 'null'};
                var loaded = false;

                function loadThirdParty() {
                  if (loaded) return;
                  loaded = true;

                  // Quitar listeners
                  window.removeEventListener('scroll', loadThirdParty);
                  window.removeEventListener('mousemove', loadThirdParty);
                  window.removeEventListener('touchstart', loadThirdParty);
                  window.removeEventListener('keydown', loadThirdParty);

                  // Inyectar AdSense
                  if (adsenseId) {
                    var ads = document.createElement('script');
                    ads.async = true;
                    ads.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adsenseId;
                    ads.crossOrigin = 'anonymous';
                    document.head.appendChild(ads);
                  }

                  // Inyectar OneSignal
                  if (onesignalId) {
                    var os = document.createElement('script');
                    os.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
                    os.defer = true;
                    os.onload = function() {
                      window.OneSignalDeferred = window.OneSignalDeferred || [];
                      window.OneSignalDeferred.push(async function(OneSignal) {
                        await OneSignal.init({
                          appId: onesignalId,
                          safari_web_id: "web.onesignal.auto.portaltrabajo",
                          notifyButton: {
                            enable: true,
                          },
                        });
                      });
                    };
                    document.head.appendChild(os);
                  }
                }

                // Registrar listeners para interacción del usuario
                window.addEventListener('scroll', loadThirdParty, { passive: true });
                window.addEventListener('mousemove', loadThirdParty, { passive: true });
                window.addEventListener('touchstart', loadThirdParty, { passive: true });
                window.addEventListener('keydown', loadThirdParty, { passive: true });

                // Carga diferida en 4 segundos como salvaguarda
                setTimeout(loadThirdParty, 4000);
              })();
            `
          }}
        />
      </head>
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
