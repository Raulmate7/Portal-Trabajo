import { Metadata } from 'next';
import Link from 'next/link';
import pool from '@/lib/db';
import JobCard from '@/components/JobCard';
import SubscribeForm from '@/components/SubscribeForm';
import AdBanner from '@/components/AdBanner';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 7200; // Cache de 2 horas (ISR)

export const metadata: Metadata = {
  title: 'Trabajo a Media Jornada y Part-time en Tecnología | Portal Trabajo IT',
  description: 'Explora ofertas de empleo a media jornada, part-time y horarios flexibles para programadores y técnicos de sistemas en España.',
  alternates: {
    canonical: '/trabajo-media-jornada-it',
  }
};

async function getPartTimeJobs() {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
        AND (title ILIKE '%media jornada%' 
             OR title ILIKE '%media-jornada%' 
             OR title ILIKE '%part time%' 
             OR title ILIKE '%part-time%'
             OR description_snippet ILIKE '%media jornada%'
             OR description_snippet ILIKE '%part-time%')
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const res = await client.query(sql);
    return res.rows;
  } catch (error) {
    console.error("Error cargando ofertas de media jornada:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function TrabajoMediaJornadaPage() {
  const jobs = await getPartTimeJobs();

  const faqItems = [
    {
      question: '¿Qué ventajas ofrece el trabajo a media jornada en el sector IT?',
      answer: 'Es ideal para compatibilizar tu empleo con estudios superiores, proyectos personales, bootcamps de especialización o conciliación familiar, manteniendo ingresos estables.'
    },
    {
      question: '¿Es habitual encontrar puestos part-time remotos?',
      answer: 'Sí. Cada vez más empresas de desarrollo de software ofrecen modelos híbridos o 100% en remoto también para posiciones de media jornada, facilitando la autonomía organizativa.'
    }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className="container mx-auto px-4 py-8 font-sans max-w-6xl min-h-screen">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} 
      />

      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Trabajo Media Jornada IT' }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          Trabajo a Media Jornada y Part-time en Tecnología
        </h1>
        <p className="text-sm text-gray-550 mt-2 max-w-2xl">
          Encuentra ofertas de empleo con horarios reducidos, flexibilidad de turnos e integración flexible en equipos de desarrollo.
        </p>
      </div>

      <div className="mb-6">
        <AdBanner variant="inline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-xl border border-gray-150 p-6">
                🤷‍♂️ No hay ofertas de tipo media jornada activas ahora mismo. Revisa en unas horas.
              </div>
            ) : (
              jobs.map((job: any) => (
                <JobCard key={job.id} job={job} lang="es" />
              ))
            )}
          </div>

          {/* FAQ section */}
          <div className="mt-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>❓</span> FAQ sobre Trabajo a Media Jornada IT
            </h2>
            <div className="space-y-6 divide-y divide-gray-100">
              {faqItems.map((item, idx) => (
                <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                  <h3 className="text-base font-bold text-gray-800 mb-2">{item.question}</h3>
                  <p className="text-sm text-gray-650 leading-relaxed m-0">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <SubscribeForm location="Media Jornada IT" />
          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
