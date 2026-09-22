import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CERTIFICATIONS, getCertificationGuide } from '@/lib/certificaciones';
import AdBanner from '@/components/AdBanner';
import SubscribeForm from '@/components/SubscribeForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import StickyDesktopAd from '@/components/StickyDesktopAd';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export const revalidate = 86400; // 24h

type Props = {
  params: Promise<{ slug: string }>;
};

async function getRelatedJobs(techKey: string) {
  const client = await pool.connect();
  try {
    const sql = `SELECT id, title, company, location, salary FROM jobs WHERE is_active = TRUE AND (title ILIKE $1 OR description_snippet ILIKE $1) ORDER BY created_at DESC LIMIT 3`;
    const res = await client.query(sql, [`%${techKey}%`]);
    return res.rows;
  } catch (error) {
    console.error("Error fetching jobs for certification:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function generateStaticParams() {
  return Object.keys(CERTIFICATIONS).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cert = getCertificationGuide(slug);

  if (!cert) {
    return { title: 'Certificación no encontrada' };
  }

  return {
    title: `${cert.title} [2026] | Temario, Precio y Sueldo`,
    description: cert.description,
    alternates: {
      canonical: `${BASE_URL}/certificaciones/${slug}`,
    },
    openGraph: {
      title: `${cert.title} [Examen 2026]`,
      description: cert.description,
      url: `${BASE_URL}/certificaciones/${slug}`,
    }
  };
}

export default async function CertificationDetailPage({ params }: Props) {
  const { slug } = await params;
  const cert = getCertificationGuide(slug);

  if (!cert) {
    notFound();
  }

  const relatedJobs = await getRelatedJobs(cert.techKey);

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: cert.title,
    description: cert.description,
    provider: {
      '@type': 'Organization',
      name: cert.provider,
      sameAs: BASE_URL
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cert.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-14 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-black px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            {cert.badgeEmoji} {cert.provider} · {cert.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {cert.title}
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            {cert.description}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Certificaciones IT', href: '/certificaciones' },
          { label: cert.title }
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <AdBanner variant="inline" />

          {/* Ficha técnica del examen */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span> Detalle Oficial del Examen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-bold block mb-0.5">Precio Examen</span>
                <strong className="text-sm font-extrabold text-gray-900">{cert.examDetails.price}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-bold block mb-0.5">Duración</span>
                <strong className="text-sm font-extrabold text-gray-900">{cert.examDetails.duration}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-bold block mb-0.5">Nota Aprobado</span>
                <strong className="text-sm font-extrabold text-gray-900">{cert.examDetails.passingScore}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-bold block mb-0.5">Validez</span>
                <strong className="text-sm font-extrabold text-gray-900">{cert.examDetails.validity}</strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 col-span-1 sm:col-span-2">
                <span className="text-emerald-800 font-bold block mb-0.5">Sueldo Estimado con Certificación</span>
                <strong className="text-sm font-extrabold text-emerald-950">{cert.salaryImpact.averageSalaryWithCert} ({cert.salaryImpact.salaryBoostPercentage})</strong>
              </div>
            </div>
          </div>

          {/* Temario del Examen */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📚</span> Temario y Peso por Dominios
            </h2>
            <div className="space-y-4">
              {cert.syllabus.map((domain, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>{domain.domain}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">{domain.weight}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{domain.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          {cert.faq.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>❓</span> Preguntas Frecuentes del Examen
              </h2>
              <div className="space-y-4 divide-y divide-gray-100">
                {cert.faq.map((item, idx) => (
                  <div key={idx} className={idx > 0 ? "pt-3" : ""}>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">{item.question}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cursos afiliados de Udemy */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-amber-900 mb-2">🎓 Curso de Preparación en Udemy</h3>
            <p className="text-amber-800 text-xs leading-relaxed mb-4">
              Prepara este examen de certificación oficial con cursos prácticos y simulacros de test en Udemy.
            </p>
            <a 
              href={`https://trk.udemy.com/9VMAEj?ulp=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3D${encodeURIComponent(cert.udemySearchQuery)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Ver Cursos de Preparación en Udemy &rarr;
            </a>
          </div>

          <AdBanner variant="multiplex" />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <SubscribeForm location={cert.title} />

          {/* Jobs related */}
          {relatedJobs.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900">💼 Ofertas que Valoran esta Tecnología</h3>
              <div className="space-y-2.5">
                {relatedJobs.map((j: any) => (
                  <div key={j.id} className="text-xs p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Link href={`/job/${j.id}`} className="font-bold text-indigo-900 hover:underline block leading-snug">
                      {j.title}
                    </Link>
                    <span className="text-gray-500 mt-1 block">{j.company} • {j.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sticky top-24">
            <AdBanner variant="sidebar" />
          </div>
        </aside>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
