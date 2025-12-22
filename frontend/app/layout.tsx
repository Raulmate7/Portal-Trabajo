import './globals.css'
import { Inter } from 'next/font/google'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

// CONFIGURACIÓN DE METADATOS Y GOOGLE
export const metadata = {
  title: 'Portal Trabajo IT - Encuentra tu próximo empleo',
  description: 'Las mejores ofertas de tecnología en un solo lugar. Encuentra trabajos de Programación, Sistemas y Data Science.',
  verification: {
    // REEMPLAZA el texto de abajo con el código largo que te dio Google
    google: 'PEGA_AQUI_TU_CODIGO_DE_VERIFICACION', 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {/* El contenido principal ocupa todo el espacio disponible */}
          <main className="flex-grow">
            {children}
          </main>
          
          {/* El footer se queda siempre al final */}
          <Footer />
        </div>
      </body>
    </html>
  )
}
