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
    canonical: `${BASE_URL}/practicas-informatica`,
  },
  openGraph: {
    title: 'Prácticas y Becas de Informática y Programación | Portal Trabajo',
    description: 'Encuentra tu primer empleo en tecnología. Ofertas de prácticas, becas y posiciones Junior/Trainee en España sin experiencia requerida.',
    url: `${BASE_URL}/practicas-informatica`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Prácticas y Becas de Informática',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prácticas y Becas de Informática y Programación',
    description: 'Ofertas de prácticas y posiciones Junior/Trainee en España sin experiencia.',
    images: [`${BASE_URL}/og-image.png`],
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
      answer: 'Muchas ofertas requieren estar cursando estudios oficiales (Grado Universitario, FP Dual DAW/DAM, etc.) para poder firmar un convenio de colaboración educativo con tu centro de estudios.'
    },
    {
      question: '¿Las ofertas de prácticas de informática son remuneradas?',
      answer: 'Sí. La gran mayoría de las empresas tecnológicas en España ofrecen una ayuda económica mensual de formación, que suele oscilar entre los 450€ y 950€ al mes para jornadas de 4 a 6 horas.'
    },
    {
      question: '¿Qué probabilidad hay de quedarse contratado tras las prácticas?',
      answer: 'En el sector informático la tasa de conversión es muy elevada: más del 70% de los estudiantes que completan satisfactoriamente su periodo de beca reciben una oferta de contrato indefinido Junior.'
    },
    {
      question: '¿Se pueden realizar prácticas de informática en modalidad 100% remota?',
      answer: 'Sí, cada vez más empresas ofrecen programas de becas con posibilidad de teletrabajo completo o modelos híbridos con 1-2 días presenciales.'
    },
    {
      question: '¿Qué lenguajes de programación son los más demandados en puestos becarios?',
      answer: 'Las empresas buscan principalmente conocimientos básicos en Java, Python, JavaScript/TypeScript, SQL y entornos web con React o Angular.'
    },
    {
      question: '¿Puedo aplicar a puestos Junior sin convenio de prácticas?',
      answer: 'Sí, los puestos rotulados como "Junior" o "Trainee" son contratos de trabajo ordinarios (contrato en prácticas o indefinido) que no exigen estar matriculado en una universidad o instituto.'
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

          {/* Recursos para Impulsar tu Carrera */}
          <div className="mt-8 bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-indigo-200 flex items-center gap-2">
              <span>🎓</span> ¿Buscas dar el salto a tu primer puesto Junior?
            </h3>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              Prepara tus entrevistas técnicas, orienta tu aprendizaje según la hoja de ruta del mercado y consulta salarios reales en España:
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs font-semibold">
              <Link href="/convertirse-en/fullstack" className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition">
                🗺️ Guías de Carrera IT
              </Link>
              <Link href="/entrevistas" className="px-3.5 py-2 bg-indigo-900 border border-indigo-700 hover:bg-indigo-800 text-white rounded-xl transition">
                🎯 Preguntas de Entrevista
              </Link>
              <Link href="/salarios" className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition">
                💰 Calculadora de Salarios
              </Link>
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
