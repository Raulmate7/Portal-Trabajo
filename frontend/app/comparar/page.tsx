import { Metadata } from 'next';
import Link from 'next/link';
import { BASE_URL } from '@/lib/constants';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdBanner from '@/components/AdBanner';

export const revalidate = 86400; // Cache 24h

export const metadata: Metadata = {
  title: 'Directorio de Comparativas Tech y Salarios | Portal Trabajo IT',
  description: 'Compara salarios, demanda laboral, teletrabajo y futuro profesional entre los principales lenguajes de programación, frameworks, herramientas cloud y ciudades de España.',
  alternates: {
    canonical: `${BASE_URL}/comparar`,
  },
  openGraph: {
    title: 'Directorio de Comparativas Tecnológicas y Geográficas | Portal Trabajo',
    description: 'Compara tecnologías (React vs Angular, Python vs Java) y ciudades (Madrid vs Barcelona) en volumen de empleo y salarios brutos.',
    url: `${BASE_URL}/comparar`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Directorio de Comparativas Tech',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Directorio de Comparativas Tech y Salarios | Portal Trabajo IT',
    description: 'Compara lenguajes, frameworks y ciudades en ofertas reales de empleo.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

const COMPARISONS_DATA = [
  // Frameworks Frontend & Web
  { slug: 'react-vs-angular', title: 'React vs Angular', category: 'Frontend', desc: 'Comparativa de empleo, salarios y ofertas de trabajo entre React y Angular en España.' },
  { slug: 'vue-vs-react', title: 'Vue vs React', category: 'Frontend', desc: 'Análisis de demanda laboral y flexibilidad remota para desarrolladores Vue y React.' },
  { slug: 'react-vs-vue', title: 'React vs Vue', category: 'Frontend', desc: 'Comparación retributiva y cuota de mercado laboral en España.' },
  { slug: 'vue-vs-angular', title: 'Vue vs Angular', category: 'Frontend', desc: 'Ecosistema de ofertas de empleo y curva de adopción corporativa.' },
  { slug: 'nextjs-vs-react', title: 'Next.js vs React', category: 'Frontend', desc: 'La evolución del desarrollo web en ofertas de trabajo Fullstack.' },

  // Backend & Lenguajes
  { slug: 'python-vs-java', title: 'Python vs Java', category: 'Backend', desc: 'Dos gigantes del backend: salarios de referencia y volumen de contratación.' },
  { slug: 'javascript-vs-typescript', title: 'JavaScript vs TypeScript', category: 'Backend & Frontend', desc: 'La transición al tipado fuerte en ofertas de empleo en España.' },
  { slug: 'node-vs-python', title: 'Node.js vs Python', category: 'Backend', desc: 'Rendimiento en contrataciones de startups y empresas consolidadas.' },
  { slug: 'go-vs-rust', title: 'Go vs Rust', category: 'Sistemas & Backend', desc: 'Los lenguajes modernos de mayor proyección salarial y demanda.' },
  { slug: 'php-vs-node', title: 'PHP vs Node.js', category: 'Backend', desc: 'Comparativa de sueldos y ofertas activas en desarrollo backend.' },
  { slug: 'csharp-vs-java', title: 'C# (.NET) vs Java', category: 'Enterprise', desc: 'Los dos pilares del desarrollo empresarial corporativo en España.' },
  { slug: 'java-vs-kotlin', title: 'Java vs Kotlin', category: 'Backend & Mobile', desc: 'Evolución en desarrollo backend Spring Boot y aplicaciones Android.' },
  { slug: 'php-vs-laravel', title: 'PHP vs Laravel', category: 'Backend', desc: 'Ofertas de empleo y salarios en el ecosistema web PHP.' },
  { slug: 'elixir-vs-ruby', title: 'Elixir vs Ruby', category: 'Backend', desc: 'Comparativa de tecnologías funcionales y salarios de nicho.' },
  { slug: 'scala-vs-java', title: 'Scala vs Java', category: 'Big Data & Backend', desc: 'Retribución media en perfiles de datos e infraestructura masiva.' },

  // Cloud, DevOps & Infraestructura
  { slug: 'aws-vs-kubernetes', title: 'AWS vs Kubernetes', category: 'Cloud & DevOps', desc: 'Demanda de perfiles Cloud Architect y DevOps Engineer.' },
  { slug: 'docker-vs-kubernetes', title: 'Docker vs Kubernetes', category: 'DevOps', desc: 'Contenedores y orquestación en vacantes de empleo IT.' },
  { slug: 'aws-vs-azure', title: 'AWS vs Microsoft Azure', category: 'Cloud', desc: 'La batalla de los proveedores cloud en puestos de infraestructura.' },
  { slug: 'devops-vs-sre', title: 'DevOps vs SRE', titleAlt: 'Site Reliability Engineering', category: 'DevOps', desc: 'Comparativa entre dos de los roles mejor pagados de la industria tech.' },
  { slug: 'terraform-vs-ansible', title: 'Terraform vs Ansible', category: 'DevOps', desc: 'Infraestructura como código (IaC) y automatización en vacantes activas.' },

  // Móvil & Multiplataforma
  { slug: 'react-native-vs-flutter', title: 'React Native vs Flutter', category: 'Mobile', desc: 'Desarrollo móvil multiplataforma: sueldos y cuota de empleo.' },
  { slug: 'kotlin-vs-swift', title: 'Kotlin (Android) vs Swift (iOS)', category: 'Mobile', desc: 'Comparación entre el mercado nativo de Android e iOS en España.' },

  // Bases de Datos & Data
  { slug: 'sql-vs-nosql', title: 'SQL vs NoSQL', category: 'Data', desc: 'Bases de datos relacionales frente a documentos en puestos de empleo.' },
  { slug: 'mysql-vs-postgresql', title: 'MySQL vs PostgreSQL', category: 'Data', desc: 'Análisis de demanda en puestos de administradores de bases de datos y backend.' },
  { slug: 'mongodb-vs-postgresql', title: 'MongoDB vs PostgreSQL', category: 'Data', desc: 'Persistencia de datos en startups y empresas tradicionales.' },

  // Geográficas / Hubs de Empleo
  { slug: 'madrid-vs-barcelona', title: 'Madrid vs Barcelona', category: 'Geografía IT', desc: 'Comparativa de los dos principales hubs tecnológicos de España en volumen y salarios.' },
  { slug: 'valencia-vs-malaga', title: 'Valencia vs Málaga', category: 'Geografía IT', desc: 'Los dos grandes polos emergentes de contratación tech en el Mediterráneo.' },
  { slug: 'madrid-vs-remoto', title: 'Madrid vs Teletrabajo Remoto', category: 'Geografía IT', desc: '¿Merece la pena el salario presencial en Madrid frente al trabajo 100% remoto?' },
];

export default function CompararIndexPage() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Directorio de Comparativas Tecnológicas y Geográficas IT',
    description: 'Compara salarios, demanda laboral y teletrabajo entre tecnologías y ciudades en España.',
    url: `${BASE_URL}/comparar`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: COMPARISONS_DATA.length,
      itemListElement: COMPARISONS_DATA.map((c, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${BASE_URL}/comparar/${c.slug}`,
        name: c.title
      }))
    }
  };

  const categories = Array.from(new Set(COMPARISONS_DATA.map(c => c.category)));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-6">
            ⚖️ Herramienta de Análisis Comparativo
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Directorio de Comparativas Tech
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Compara salarios reales, demanda de ofertas activas y porcentaje de teletrabajo entre los lenguajes, frameworks y ciudades de España.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Comparativas' }
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <AdBanner variant="inline" />

        {/* Listado por Categorías */}
        {categories.map((category) => {
          const items = COMPARISONS_DATA.filter(c => c.category === category);
          return (
            <section key={category} className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {category}
                </h2>
                <div className="h-px bg-gray-200 dark:bg-slate-800 flex-grow" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link 
                    key={item.slug} 
                    href={`/comparar/${item.slug}`}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900 inline-block mb-3">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
                        {item.desc}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver informe comparativo →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <div className="pt-6">
          <AdBanner variant="multiplex" />
        </div>
      </div>
    </main>
  );
}
