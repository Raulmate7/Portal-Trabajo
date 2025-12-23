import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// --- CONFIGURACIÓN SEO Y VERIFICACIONES ---
export const metadata: Metadata = {
  title: "Portal Trabajo | Ofertas de Empleo IT en España",
  description: "Encuentra las mejores ofertas de trabajo para programadores, analistas de datos y expertos en sistemas en España.",
  
  // Verificación para Impact.com (Udemy)
  other: {
    'impact-site-verification': '4f0a2a9d-8d83-4f33-851f-1663a9270bdb',
  },
};
// -------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
