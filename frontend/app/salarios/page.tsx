import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import SalariosCalculator from '@/components/SalariosCalculator';
import { calculateSalaryStats } from '@/lib/salarios';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculadora de Salarios IT en España [2026] | Portal Trabajo IT',
  description: 'Descubre cuánto cobra un desarrollador o profesional de tecnología en España. Calcula el salario medio bruto anual por tecnología, ciudad y experiencia.',
  alternates: {
    canonical: '/salarios',
  },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SalariosPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const tech = typeof resolvedSearchParams.tech === 'string' ? resolvedSearchParams.tech : '';
  const location = typeof resolvedSearchParams.location === 'string' ? resolvedSearchParams.location : '';
  const experience = typeof resolvedSearchParams.experience === 'string' ? resolvedSearchParams.experience : '';

  // Pre-calcular estadísticas en el servidor
  const initialData = await calculateSalaryStats(tech, location, experience);

  const initialParams = {
    tech,
    location,
    experience
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            💰 Datos reales de ofertas activas en España
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Calculadora de{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              Salarios IT
            </span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Descubre cuánto cobran los desarrolladores en España. Datos extraídos de{' '}
            <strong className="text-white">miles de ofertas reales</strong> publicadas en nuestro portal.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Calculadora de Salarios con Datos Iniciales pre-cargados por SSR */}
          <SalariosCalculator initialData={initialData} initialParams={initialParams} />

          {/* Sección de Interlinking de Informes Salariales */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative z-10">
            <h3 className="text-base font-bold text-gray-950 mb-5 flex items-center gap-2">
              <span>🔍</span> Informes Salariales IT más Buscados
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-gray-800 mb-2.5 border-b border-gray-100 pb-1.5">Por Tecnología</h4>
                <ul className="space-y-2 text-indigo-650 font-semibold">
                  <li><Link href="/salarios/react" className="hover:underline">React Developer</Link></li>
                  <li><Link href="/salarios/node" className="hover:underline">Node.js Developer</Link></li>
                  <li><Link href="/salarios/python" className="hover:underline">Python Developer</Link></li>
                  <li><Link href="/salarios/java" className="hover:underline">Java Developer</Link></li>
                  <li><Link href="/salarios/typescript" className="hover:underline">TypeScript Developer</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-800 mb-2.5 border-b border-gray-100 pb-1.5">Por Ciudad</h4>
                <ul className="space-y-2 text-indigo-650 font-semibold">
                  <li><Link href="/salarios/react/madrid" className="hover:underline">React en Madrid</Link></li>
                  <li><Link href="/salarios/node/remoto" className="hover:underline">Node.js en Remoto</Link></li>
                  <li><Link href="/salarios/python/barcelona" className="hover:underline">Python en Barcelona</Link></li>
                  <li><Link href="/salarios/java/madrid" className="hover:underline">Java en Madrid</Link></li>
                  <li><Link href="/salarios/typescript/remoto" className="hover:underline">TypeScript en Remoto</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-800 mb-2.5 border-b border-gray-100 pb-1.5">Por Experiencia</h4>
                <ul className="space-y-2 text-indigo-650 font-semibold">
                  <li><Link href="/salarios/react/remoto/senior" className="hover:underline">React Senior en Remoto</Link></li>
                  <li><Link href="/salarios/java/madrid/junior" className="hover:underline">Java Junior en Madrid</Link></li>
                  <li><Link href="/salarios/node/remoto/senior" className="hover:underline">Node.js Senior en Remoto</Link></li>
                  <li><Link href="/salarios/python/madrid/senior" className="hover:underline">Python Senior en Madrid</Link></li>
                  <li><Link href="/salarios/typescript/barcelona/junior" className="hover:underline">TypeScript Junior en BCN</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <AdBanner variant="inline" />
          </div>
        </div>

        {/* Barra lateral con anuncio AdSense Sticky */}
        <div className="lg:col-span-1 space-y-6">
          <div className="lg:sticky lg:top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </main>
  );
}
