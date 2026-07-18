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
  title: 'Trabajo Freelance de Programador y Sistemas | Portal Trabajo IT',
  description: 'Encuentra ofertas de empleo freelance, autónomo y contractor para desarrolladores de software y técnicos en España.',
  alternates: {
    canonical: '/trabajo-freelance-it',
  }
};

async function getFreelanceJobs() {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT * FROM jobs 
      WHERE is_active = TRUE 
        AND (title ILIKE '%freelance%' 
             OR title ILIKE '%autonomo%' 
             OR title ILIKE '%autónomo%' 
             OR title ILIKE '%contractor%'
             OR description_snippet ILIKE '%freelance%'
             OR description_snippet ILIKE '%autónomo%')
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const res = await client.query(sql);
    return res.rows;
  } catch (error) {
    console.error("Error cargando ofertas freelance:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function TrabajoFreelancePage() {
  const jobs = await getFreelanceJobs();

  const faqItems = [
    {
      question: '¿Qué es un contrato Freelance o Contractor en IT?',
      answer: 'Un programador freelance o contractor trabaja como autónomo independiente, facturando por horas o por hitos de proyecto a sus clientes, en lugar de estar contratado en nómina por cuenta ajena.'
    },
    {
      question: '¿Puedo facturar a empresas extranjeras desde España como freelance?',
      answer: 'Sí. A través de la figura del autónomo en España, puedes emitir facturas exentas de IVA a clientes fuera de España si estás dado de alta en el ROI (para clientes de la UE) o de forma estándar para el resto del mundo (como EE.UU.).'
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
        { label: 'Trabajo Freelance IT' }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          Trabajo Freelance y Autónomo IT en España
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl">
          Explora proyectos freelance de programación, bases de datos y DevOps. Trabaja de forma independiente con contratos flexibles y alta remuneración.
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
                🤷‍♂️ No hay ofertas de tipo freelance/autónomo activas ahora mismo. Vuelve a consultar más tarde.
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
              <span>❓</span> FAQ sobre Trabajo Freelance IT
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
          <SubscribeForm location="Freelance IT" />
          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
}
