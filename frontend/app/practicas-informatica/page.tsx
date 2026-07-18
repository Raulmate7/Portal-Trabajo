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
  title: 'Prácticas y Becas de Informática y Programación | Portal Trabajo IT',
  description: 'Encuentra tu primer empleo en tecnología. Ofertas de prácticas, becas y posiciones Junior/Trainee en España sin experiencia requerida.',
  alternates: {
    canonical: '/practicas-informatica',
  }
};

async function getInternshipJobs() {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
        AND (title ILIKE '%practicas%' 
             OR title ILIKE '%prácticas%' 
             OR title ILIKE '%beca%' 
             OR title ILIKE '%becario%'
             OR title ILIKE '%trainee%'
             OR title ILIKE '%internship%'
             OR description_snippet ILIKE '%prácticas%'
             OR description_snippet ILIKE '%becario%')
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const res = await client.query(sql);
    return res.rows;
  } catch (error) {
    console.error("Error cargando ofertas de practicas:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function PracticasInformaticaPage() {
  const jobs = await getInternshipJobs();

  const faqItems = [
    {
      question: '¿Qué requisitos suelen pedir para hacer prácticas de programación?',
      answer: 'Muchas ofertas requieren estar cursando estudios oficiales (Grado Universitario, FP Dual DAW/DAM, etc.) para poder firmar un convenio de colaboración con tu centro de estudios.'
    },
    {
      question: '¿Las ofertas de prácticas de informática son remuneradas?',
      answer: 'Sí. La gran mayoría de las empresas tecnológicas en España ofrecen una ayuda económica mensual de formación, que suele oscilar entre los 400€ y 900€ al mes para jornadas de 4 a 6 horas.'
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
        { label: 'Prácticas y Becas IT' }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          Prácticas y Becas de Informática y Programación
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl">
          Encuentra tu primera oportunidad profesional en el sector tecnológico. Becas, prácticas y puestos trainee para estudiantes y graduados sin experiencia.
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
                🤷‍♂️ No hay ofertas de tipo prácticas o becas activas en este momento. Vuelve a consultar mañana.
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
              <span>❓</span> FAQ sobre Prácticas de Programación
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
          <SubscribeForm location="Prácticas IT" />
          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
