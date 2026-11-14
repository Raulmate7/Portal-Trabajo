import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { BASE_URL, safeJsonLdString } from "@/lib/constants";
import Header from "@/components/Header";
import { Suspense } from "react";
import { headers } from "next/headers";
import ClientOnlyWidgets from "@/components/ClientOnlyWidgets";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const viewport = {
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  manifest: "/manifest.json",
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
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
      'en': `${BASE_URL}/en`,
      'x-default': BASE_URL,
    },
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
    },
  },
  other: {
    "impact-site-verification": "2348664d-36c1-45a5-8a74-a2dd472c4343",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reqHeaders = await headers();
  const nonce = reqHeaders.get("x-nonce") || undefined;
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";
  const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="es">
      <head>
        <meta name="impact-site-verification" content="2348664d-36c1-45a5-8a74-a2dd472c4343" />
        {/* Preconexión y dns-prefetch respetuosos con privacidad (solo fuentes tipográficas estables) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* WebSite Schema para Google Sitelinks Search Box */}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLdString({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Portal Trabajo IT",
              "url": BASE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${BASE_URL}/trabajos/informatica-tecnologia?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* Google Consent Mode v2 por defecto denegado (AEPD / RGPD / ePrivacy) */}
        <script
          nonce={nonce}
          id="google-consent-mode-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              var defaultConsent = {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              };

              try {
                var saved = localStorage.getItem('cookies_consent');
                if (saved) {
                  var parsed = JSON.parse(saved);
                  if (parsed.analytics) defaultConsent.analytics_storage = 'granted';
                  if (parsed.advertising) {
                    defaultConsent.ad_storage = 'granted';
                    defaultConsent.ad_user_data = 'granted';
                    defaultConsent.ad_personalization = 'granted';
                  }
                } else if (localStorage.getItem('cookies_accepted') === 'true') {
                  defaultConsent.analytics_storage = 'granted';
                  defaultConsent.ad_storage = 'granted';
                  defaultConsent.ad_user_data = 'granted';
                  defaultConsent.ad_personalization = 'granted';
                }
              } catch(e) {}

              gtag('consent', 'default', defaultConsent);
            `
          }}
        />
        {/* Inicializador de Tema Oscuro para evitar flash de color */}
        <script
          nonce={nonce}
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `
          }}
        />
        <script
          nonce={nonce}
          id="third-party-lazy-load"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var adsenseId = ${JSON.stringify(adsenseClientId || null)};
                var onesignalId = ${JSON.stringify(onesignalAppId || null)};
                var gaId = ${JSON.stringify(gaMeasurementId || null)};
                var adsenseLoaded = false;
                var onesignalLoaded = false;
                var gaLoaded = false;

                // Definir dataLayer y gtag inmediatamente para encolar llamadas de forma segura sin conectar a Google
                window.dataLayer = window.dataLayer || [];
                function gtag(){ window.dataLayer.push(arguments); }
                window.gtag = gtag;

                function getConsent() {
                  try {
                    var saved = localStorage.getItem('cookies_consent');
                    if (saved) {
                      var parsed = JSON.parse(saved);
                      var maxAgeMs = 365 * 24 * 60 * 60 * 1000;
                      if (parsed.updatedAt && (Date.now() - parsed.updatedAt > maxAgeMs)) {
                        return { analytics: false, advertising: false, notifications: false };
                      }
                      return {
                        analytics: !!parsed.analytics,
                        advertising: !!parsed.advertising,
                        notifications: !!parsed.notifications
                      };
                    }
                    var legacy = localStorage.getItem('cookies_accepted') === 'true';
                    return {
                      analytics: legacy,
                      advertising: legacy,
                      notifications: legacy
                    };
                  } catch(e) {
                    return { analytics: false, advertising: false, notifications: false };
                  }
                }

                function loadGA() {
                  if (gaLoaded || !gaId) return;
                  gaLoaded = true;
                  var gas = document.createElement('script');
                  gas.async = true;
                  gas.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
                  document.head.appendChild(gas);

                  gtag('js', new Date());
                  gtag('config', gaId, {
                    anonymize_ip: true,
                    page_path: window.location.pathname
                  });
                }

                function loadAdSense() {
                  if (adsenseLoaded || !adsenseId) return;
                  var excludedPaths = ['/publicar-oferta', '/precios', '/publicidad'];
                  var isExcluded = excludedPaths.some(function(p) {
                    return window.location.pathname.startsWith(p);
                  });
                  if (isExcluded) return;

                  adsenseLoaded = true;
                  var ads = document.createElement('script');
                  ads.async = true;
                  ads.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adsenseId;
                  ads.crossOrigin = 'anonymous';
                  document.head.appendChild(ads);
                }

                function loadOneSignal() {
                  if (onesignalLoaded || !onesignalId) return;
                  onesignalLoaded = true;
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
                          enable: false,
                        },
                      });
                    });
                  };
                  document.head.appendChild(os);
                }
                // Exponer loadOneSignal para activación voluntaria bajo demanda
                window.loadOneSignal = loadOneSignal;

                var consent = getConsent();

                // Carga condicionada de Google Analytics: SOLO con consentimiento analítico previo
                if (consent.analytics) {
                  loadGA();
                }

                // Carga condicionada de AdSense: SOLO si el usuario ha otorgado consentimiento publicitario
                if (consent.advertising) {
                  function triggerAdSenseOnInteraction() {
                    window.removeEventListener('scroll', triggerAdSenseOnInteraction);
                    window.removeEventListener('mousemove', triggerAdSenseOnInteraction);
                    window.removeEventListener('touchstart', triggerAdSenseOnInteraction);
                    window.removeEventListener('keydown', triggerAdSenseOnInteraction);
                    loadAdSense();
                  }
                  window.addEventListener('scroll', triggerAdSenseOnInteraction, { passive: true });
                  window.addEventListener('mousemove', triggerAdSenseOnInteraction, { passive: true });
                  window.addEventListener('touchstart', triggerAdSenseOnInteraction, { passive: true });
                  window.addEventListener('keydown', triggerAdSenseOnInteraction, { passive: true });
                  setTimeout(loadAdSense, 2000);
                }

                // Carga de OneSignal: solo si existe consentimiento explícito en cookies_consent Y permiso en el navegador (LEG-023)
                if ((consent.notifications || consent.analytics) && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  setTimeout(loadOneSignal, 2000);
                }

                // Escuchar evento de actualización dinámica de cookies (cuando el usuario interactúa con el banner)
                window.addEventListener('cookie_consent_updated', function(event) {
                  if (event && event.detail) {
                    if (event.detail.analytics) {
                      loadGA();
                    }
                    if (event.detail.advertising) {
                      loadAdSense();
                    }
                    if ((event.detail.notifications || event.detail.analytics) && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                      loadOneSignal();
                    }
                  }
                });
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100 transition-colors duration-200`}>
        <Suspense fallback={<div className="h-16 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800"></div>}>
          <Header />
        </Suspense>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <ClientOnlyWidgets />
        {/* Service Worker PWA */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration.scope);
                  }, function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
