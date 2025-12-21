import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Esto hace que el contador de ofertas se actualice cada vez que alguien entra
export const revalidate = 0;

export default async function Home() {
  // Consultamos a Supabase cuántas ofertas tenemos en total (Solo el número)
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  const stats = [
    { label: 'Ofertas Activas', value: count || '500+' },
    { label: 'Actualización', value: 'Diaria' },
    { label: 'Fuentes', value: 'Múltiples' },
  ];

  const popularCities = ['Madrid', 'Barcelona', 'Valencia', 'Remoto', 'Sevilla', 'Bilbao'];

  return (
    <main className="min-h-screen bg-white">
      
      {/* --- HERO SECTION (La parte visual impactante) --- */}
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-2xl py-20 sm:py-32 lg:py-40 text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              🚀 Nueva funcionalidad: Alertas por email gratuitas.
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Tu próximo trabajo en <span className="text-indigo-600">Tecnología</span> está aquí
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Agregamos diariamente las mejores ofertas de empleo para programadores, data scientists y técnicos de toda España. Deja de buscar en 10 sitios distintos.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/trabajos/informatica-tecnologia"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Ver todas las ofertas
            </Link>
            <Link href="/trabajos/informatica-tecnologia?ubicacion=Remoto" className="text-sm font-semibold leading-6 text-gray-900">
              Ver trabajo remoto <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- ESTADÍSTICAS --- */}
      <div className="bg-white py-10 sm:py-16 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="mx-auto flex max-w-xs flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-600">{stat.label}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* --- CIUDADES POPULARES (SEO + UX) --- */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-10">
          Explora ofertas por ciudad
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {popularCities.map((city) => (
            <Link
              key={city}
              href={`/trabajos/informatica-tecnologia?ubicacion=${city}`}
              className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-4 text-sm font-medium text-gray-900 shadow-sm hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>

      {/* --- CARACTERÍSTICAS --- */}
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">¿Por qué usar este portal?</h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Creamos esta herramienta porque estábamos cansados de webs de empleo llenas de publicidad, registros obligatorios y ofertas caducadas.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
              <p>✨ Sin registro obligatorio</p>
              <p>⚡️ Actualización automática</p>
              <p>🔍 Filtros avanzados</p>
              <p>💸 100% Gratis</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
