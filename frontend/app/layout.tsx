import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner"; // <--- Importamos el banner

const inter = Inter({ subsets: ["latin"] });

// 1. AQUÍ CAMBIAMOS EL TÍTULO Y LA DESCRIPCIÓN PARA GOOGLE
export const metadata: Metadata = {
  title: "Portal Trabajo IT | Ofertas de Empleo Tech en España",
  description: "El mejor agregador de ofertas de empleo para programadores. Encuentra trabajo de Java, Python, React, Ciberseguridad y más en un solo lugar. Actualizado cada 6 horas.",
  icons: {
    icon: '/favicon.ico', // Asegúrate de tener un favicon si quieres, si no, usa el de Vercel por defecto
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900`}>
        {/* El contenido de la página */}
        {children}
        
        {/* El Banner de Cookies (siempre al final) */}
        <CookieBanner />
      </body>
    </html>
  );
}	

