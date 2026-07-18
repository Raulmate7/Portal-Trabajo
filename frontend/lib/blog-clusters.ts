// Estructura de Pillar Pages y Clusters de Contenido del Blog
// Cada pillar page es un artículo "paraguas" que enlaza a los artículos satélite del mismo tema.

export interface BlogCluster {
  id: string;
  pillarSlug: string;        // slug del artículo pilar principal
  pillarTitle: string;       // título visible del pilar
  topic: string;             // tema general del cluster
  emoji: string;
  description: string;
  slugs: string[];           // slugs de los artículos satélite de este cluster
}

export const BLOG_CLUSTERS: BlogCluster[] = [
  {
    id: 'carrera-it',
    pillarSlug: 'negociar-salario-oferta-empleo-tech',
    pillarTitle: 'Guía completa para tu carrera en IT',
    topic: 'Carrera y Empleo IT',
    emoji: '🚀',
    description: 'Todo lo que necesitas saber para encontrar trabajo, negociar tu salario y crecer profesionalmente en el sector tecnológico en España.',
    slugs: [
      'negociar-salario-oferta-empleo-tech',
      'portfolio-programador-github-2026',
      'trabajo-freelance-programador-espana',
      'cv-programador-espana-2026',
      'linkedin-programador-optimizar-perfil',
      'entrevista-conductual-comportamiento-tech',
    ]
  },
  {
    id: 'formacion-cloud',
    pillarSlug: 'certificaciones-cloud-aws-azure-gcp',
    pillarTitle: 'Certificaciones y Formación Cloud',
    topic: 'Formación y Certificaciones',
    emoji: '🎓',
    description: 'Las mejores certificaciones de AWS, Azure y GCP, cursos recomendados y cómo planificar tu carrera en cloud.',
    slugs: [
      'certificaciones-cloud-aws-azure-gcp',
      'salario-devops-cloud-espana-2026',
      'bootcamp-programacion-espana-merece-pena',
      'aprender-programar-online-gratis',
    ]
  },
  {
    id: 'mercado-laboral',
    pillarSlug: 'mercado-laboral-it-espana-2026',
    pillarTitle: 'Mercado Laboral IT en España',
    topic: 'Análisis de Mercado',
    emoji: '📊',
    description: 'Análisis del estado del empleo tecnológico en España: salarios, teletrabajo, tecnologías más demandadas y perspectivas de futuro.',
    slugs: [
      'mercado-laboral-it-espana-2026',
      'salario-programador-espana-2026',
      'teletrabajo-programadores-espana',
      'ciudades-empleo-tech-espana',
    ]
  },
];

/**
 * Dado el slug de un artículo, devuelve el cluster al que pertenece (si existe).
 */
export function getClusterBySlug(slug: string): BlogCluster | undefined {
  return BLOG_CLUSTERS.find(cluster => cluster.slugs.includes(slug));
}

/**
 * Dado el slug de un artículo, devuelve los slugs de los artículos relacionados del mismo cluster
 * (excluyendo el propio artículo), limitado a maxItems.
 */
export function getRelatedClusterSlugs(slug: string, maxItems = 3): string[] {
  const cluster = getClusterBySlug(slug);
  if (!cluster) return [];
  return cluster.slugs.filter(s => s !== slug).slice(0, maxItems);
}
