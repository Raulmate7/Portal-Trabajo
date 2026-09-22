import { Metadata } from 'next';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: 'Documentación de API Pública REST v1 | Portal Trabajo IT',
  description: 'Documentación oficial de la API pública REST de Portal Trabajo IT para desarrolladores. Consulta endpoints de vacantes, salarios y agregados.',
  alternates: {
    canonical: `${BASE_URL}/api-docs`,
  },
  openGraph: {
    title: 'API Pública REST IT | Portal Trabajo IT',
    description: 'Endpoints REST documentados para desarrolladores e integraciones de empleo.',
    url: `${BASE_URL}/api-docs`,
  }
};

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/jobs',
    description: 'Obtiene una lista paginada de ofertas activas con filtros opcionales por tecnología y ubicación.',
    params: [
      { name: 'tech', type: 'string', desc: 'Filtro por tecnología (ej: python, react, aws)' },
      { name: 'city', type: 'string', desc: 'Filtro por ciudad o remoto (ej: madrid, barcelona, remoto)' },
      { name: 'limit', type: 'integer', desc: 'Número máximo de resultados (1-100, default: 20)' },
      { name: 'page', type: 'integer', desc: 'Número de página (default: 1)' }
    ],
    responseExample: `{
  "total": 142,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "job-1024",
      "title": "Desarrollador Senior Python (FastAPI)",
      "company": "TechCorp",
      "location": "Madrid",
      "salary": "45.000€ - 55.000€",
      "url": "https://portalempleoit.com/job/desarrollador-senior-python-madrid-1024"
    }
  ]
}`
  },
  {
    method: 'GET',
    path: '/api/v1/salaries',
    description: 'Devuelve datos salariales agregados y estadísticas por tecnología y nivel de experiencia.',
    params: [
      { name: 'tech', type: 'string', desc: 'Clave de tecnología' },
      { name: 'level', type: 'string', desc: 'Nivel: junior, mid, senior' }
    ],
    responseExample: `{
  "technology": "Python",
  "level": "Senior",
  "averageSalary": 52000,
  "medianSalary": 50000,
  "currency": "EUR",
  "sampleSize": 85
}`
  }
];

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            ⚡ REST API v1.0 para Desarrolladores
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Documentación de API Pública
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Integra fácilmente los datos de empleo y tendencias salariales en tus aplicaciones, agregadores o proyectos personales.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'API Docs' }
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <AdBanner variant="inline" />

          {/* Intro Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-gray-900">🚀 Guía de Inicio Rápido</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              La API REST de Portal Trabajo IT es gratuita para consultas públicas. Todos los endpoints devuelven objetos JSON formateados en UTF-8 y admiten cabeceras CORS.
            </p>
            <div className="p-3 bg-gray-900 text-indigo-300 font-mono text-xs rounded-xl">
              Base URL: {BASE_URL}
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📚</span> Endpoints Disponibles
            </h2>

            {ENDPOINTS.map((ep, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-md">
                    {ep.method}
                  </span>
                  <code className="text-sm font-bold text-indigo-900 font-mono">{ep.path}</code>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{ep.description}</p>

                {ep.params.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-700">Parámetros de consulta (Query Params):</span>
                    <ul className="space-y-1">
                      {ep.params.map((p, pIdx) => (
                        <li key={pIdx} className="text-xs text-gray-600 flex items-center gap-2">
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px]">{p.name}</code>
                          <span className="text-gray-400">({p.type})</span>
                          <span>— {p.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-gray-700">Respuesta de ejemplo (200 OK):</span>
                  <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                    {ep.responseExample}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          <AdBanner variant="multiplex" />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900">🛡️ Rate Limits & Autenticación</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              El nivel público gratuito permite hasta 100 peticiones por día por dirección IP. Si necesitas un volumen mayor o acceso sin límites para tu empresa, puedes solicitar una API Key.
            </p>
            <Link href="/contacto" className="text-xs font-bold text-indigo-600 hover:underline block">
              Solicitar API Key Empresarial &rarr;
            </Link>
          </div>

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </aside>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
