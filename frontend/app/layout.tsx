import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 👇 AQUÍ ESTÁ EL CAMBIO: Usamos 'next' en lugar de 'react' como pide Vercel
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal de Trabajo IT",
  description: "Encuentra las mejores ofertas de empleo tech automatizadas.",
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
        <Analytics />
      </body>
    </html>
  );
}
