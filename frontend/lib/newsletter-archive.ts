export interface NewsletterEdition {
  slug: string;
  title: string;
  date: string;
  summary: string;
  highlights: string[];
  featuredTechs: string[];
  readTimeMinutes: number;
  content: {
    editorial: string;
    topJobsCount: number;
    salaryTrends: string;
    sponsoredNote?: string;
  };
}

export const NEWSLETTER_EDITIONS: NewsletterEdition[] = [
  {
    slug: 'edicion-32-subida-salarios-ia-remoto-2026',
    title: 'Edición #32: Subida Salarial en IA, Tendencias de Teletrabajo en España y Ofertas Destacadas',
    date: '2026-07-28',
    summary: 'Repasamos los salarios récord alcanzados en puestos de IA y Cloud en España, la demanda de perfiles Senior en remoto y las ofertas más destacadas de la semana.',
    highlights: [
      'Los salarios en puestos de RAG y MLOps suben un 18% en el primer semestre',
      'El 42% de las ofertas de desarrollo Backend mantienen opción de teletrabajo 100%',
      'Selección de las 15 vacantes con mejor retribución de la semana'
    ],
    featuredTechs: ['python', 'react', 'aws', 'data'],
    readTimeMinutes: 4,
    content: {
      editorial: 'Esta semana el mercado laboral IT en España muestra una aceleración notable en la contratación de especialistas en Inteligencia Artificial y Cloud Native. Las empresas están compitiendo activamente por talento Senior ofreciendo flexibilidad total de ubicación y paquetes de retribución por encima de la media histórica.',
      topJobsCount: 45,
      salaryTrends: 'Los perfiles de Python con especialización en FastAPI y LangChain han registrado una media salarial de 48.000€ - 65.000€ brutos anuales para posiciones Mid/Senior.',
      sponsoredNote: 'Esta edición cuenta con el patrocinio del Informe de Mercado IT 2026.'
    }
  },
  {
    slug: 'edicion-31-react-19-demanda-typescript-mercado-it',
    title: 'Edición #31: Adopción de React 19, Consolidación de TypeScript y Ranking de Salarios Frontend',
    date: '2026-07-21',
    summary: 'Análisis del mercado Frontend en España: el 85% de las vacantes exigen TypeScript y React Server Components se convierte en requisito habitual.',
    highlights: [
      'TypeScript se consolida como requisito imprescindible en el 85% de ofertas Frontend',
      'React Server Components y Next.js App Router dominan las entrevistas técnicas',
      'Las 10 mejores ofertas de empleo para desarrolladores Fullstack y Frontend'
    ],
    featuredTechs: ['react', 'typescript', 'nextjs', 'frontend'],
    readTimeMinutes: 5,
    content: {
      editorial: 'El ecosistema Frontend se encuentra en una etapa de consolidación madura. La migración masiva hacia TypeScript y Next.js ha elevado el listón técnico en los procesos de selección, exigiendo un dominio profundo del rendimiento y renderizado en servidor.',
      topJobsCount: 38,
      salaryTrends: 'Un desarrollador Frontend Senior con dominio de React y Next.js alcanza en España un rango medio de 45.000€ - 58.000€.',
    }
  },
  {
    slug: 'edicion-30-devops-kubernetes-salarios-cloud-espana',
    title: 'Edición #30: El Estado de Kubernetes en España, Platform Engineering y Guía Salarial DevOps',
    date: '2026-07-14',
    summary: 'Estudio de la demanda de ingenieros Cloud & DevOps: GitOps, Terraform y Kubernetes encabezan los requerimientos mejor pagados.',
    highlights: [
      'Platform Engineering reemplaza progresivamente al modelo DevOps tradicional',
      'Salarios medios en Kubernetes y AWS superan los 55.000€ en posiciones Senior',
      'Resumen de eventos IT y conferencias tecnológicas en España'
    ],
    featuredTechs: ['aws', 'docker', 'kubernetes', 'cloud'],
    readTimeMinutes: 4,
    content: {
      editorial: 'La infraestructura Cloud en España sigue experimentando una fuerte inversión. La automatización mediante GitOps (ArgoCD) e Infraestructura como Código (Terraform) se ha convertido en el estándar de la industria para garantizar despliegues continuos sin interrupción.',
      topJobsCount: 40,
      salaryTrends: 'Los ingenieros SRE y DevOps encabezan la tabla salarial dentro del área de infraestructura con medias de 52.000€ a 75.000€.',
    }
  }
];

export function getNewsletterEdition(slug: string): NewsletterEdition | undefined {
  return NEWSLETTER_EDITIONS.find(e => e.slug === slug);
}
