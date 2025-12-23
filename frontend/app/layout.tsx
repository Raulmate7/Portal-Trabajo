import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Usamos fuente de Google
import "./globals.css";

// 1. Configuramos la fuente Inter (se descarga sola, no da error)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal Trabajo | Ofertas de Empleo IT en España",
  description: "Encuentra las mejores ofertas de trabajo para programadores.",
  
  // 2. Aquí está la verificación de Impact (Udemy)
  other: {
    'impact-site-verification': '4f0a2a9d-8d83-4f33-851f-1663a9270bdb',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* 3. Aplicamos la clase de la fuente Inter aquí */}
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
