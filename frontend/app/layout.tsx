import './globals.css'
import { Inter } from 'next/font/google'
import Footer from '@/components/Footer' // <--- COMPRUEBA ESTA LÍNEA

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Usamos flex y min-h-screen para que el footer siempre esté abajo */}
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>
          <Footer /> {/* <--- COMPRUEBA QUE ESTO ESTÉ AQUÍ */}
        </div>
      </body>
    </html>
  )
}
