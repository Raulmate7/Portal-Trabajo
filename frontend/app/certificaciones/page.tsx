import { Metadata } from 'next';
import Link from 'next/link';
import { CERTIFICATIONS } from '@/lib/certificaciones';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: 'Guías de Certificaciones IT [2026] | AWS, Kubernetes, GCP, Ciberseguridad y Scrum',
  description: 'Descubre las mejores certificaciones técnicas en la nube, DevOps, Ciberseguridad y metodologías ágiles. Precios de examen, temarios, impacto salarial y cursos.',
  alternates: {
    canonical: `${BASE_URL}/certificaciones`,
  },
  openGraph: {
    title: 'Guías de Certificaciones IT [2026] | AWS, K8s, GCP, Ciberseguridad',
    description: 'Prepara tus exámenes de certificación oficial IT con nuestras guías completas.',
    url: `${BASE_URL}/certificaciones`,
  }
};

export default function CertificacionesIndexPage() {
  const items = Object.values(CERTIFICATIONS);

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guías de Certificaciones IT y Cloud',
    description: 'Guías completas de preparación para las certificaciones tecnológicas más demandadas en España.',
    url: `${BASE_URL}/certificaciones`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((cert, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${BASE_URL}/certificaciones/${cert.slug}`,
        name: cert.title
      }))
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            🎓 Acreditaciones Oficiales IT 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Guías de Certificaciones IT
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Impulsa tu carrera técnica. Consulta temarios, precios oficiales, duraciones de examen y el incremento salarial estimado para cada certificación.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Certificaciones IT' }
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <AdBanner variant="inline" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((cert) => (
            <Link
              key={cert.slug}
              href={`/certificaciones/${cert.slug}`}
              className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                    {cert.badgeEmoji}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100">
                    Impacto: {cert.salaryImpact.salaryBoostPercentage}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{cert.provider}</span>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mt-0.5 leading-snug">
                    {cert.title}
                  </h2>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {cert.description}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Sueldo estimado:</span>
                  <strong className="text-gray-900">{cert.salaryImpact.averageSalaryWithCert}</strong>
                </div>
                <span className="text-xs font-bold text-indigo-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver Guía de Examen →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <AdBanner variant="multiplex" />
      </div>
    </main>
  );
}
