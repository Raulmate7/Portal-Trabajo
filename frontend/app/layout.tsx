import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal Trabajo IT - Ofertas de Programación",
  description: "Encuentra las mejores ofertas de trabajo para programadores en España. Agregador de empleo IT en tiempo real.",
  // Icono del navegador (Favicon) - Un cohete 🚀
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>',
  },
  // Tu verificación de Google Search Console (NO BORRAR)
  verification: {
    google: 't_9xzCLX7FDr1hVx2MrXOUum-LuUBaWe2V3h51PDECA',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        {/* Google Analytics: Cambia el ID cuando tengas el tuyo real */}
        <GoogleAnalytics gaId="G-PON_TU_ID_AQUI" />
      </body>
    </html>
  );
}
