export interface CertificationGuide {
  slug: string;
  title: string;
  provider: string;
  badgeEmoji: string;
  category: string;
  description: string;
  examDetails: {
    duration: string;
    price: string;
    format: string;
    passingScore: string;
    validity: string;
  };
  salaryImpact: {
    averageSalaryWithCert: string;
    salaryBoostPercentage: string;
    demandLevel: string;
  };
  techKey: string;
  prerequisites: string[];
  syllabus: {
    domain: string;
    weight: string;
    description: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  udemySearchQuery: string;
}

export const CERTIFICATIONS: Record<string, CertificationGuide> = {
  'aws': {
    slug: 'aws',
    title: 'Guía de Certificaciones AWS (Solutions Architect & Developer)',
    provider: 'Amazon Web Services',
    badgeEmoji: '☁️',
    category: 'Cloud Computing',
    description: 'Descubre cómo preparar las certificaciones AWS Solutions Architect Associate y Professional, el estándar de oro en infraestructura cloud.',
    examDetails: {
      duration: '130 minutos',
      price: '150 USD (~140€)',
      format: '65 preguntas tipo test / respuesta múltiple',
      passingScore: '720 / 1000 puntos',
      validity: '3 años'
    },
    salaryImpact: {
      averageSalaryWithCert: '52.000€ - 75.000€',
      salaryBoostPercentage: '+22%',
      demandLevel: 'Muy Alta'
    },
    techKey: 'aws',
    prerequisites: [
      'Conocimientos básicos de redes y servidores',
      'Experiencia previa de 6-12 meses usando la consola de AWS o CLI',
      'Comprensión de conceptos de alta disponibilidad y seguridad'
    ],
    syllabus: [
      { domain: 'Diseño de Arquitecturas Seguras', weight: '30%', description: 'IAM, cifrado S3/EBS, KMS, VPC security groups y NACLs.' },
      { domain: 'Diseño de Arquitecturas Resilientes', weight: '26%', description: 'Auto Scaling, Load Balancers (ALB/NLB), Multi-AZ y estrategias DR.' },
      { domain: 'Arquitecturas de Alto Rendimiento', weight: '24%', description: 'Caching con ElastiCloud / CloudFront, almacenamiento de alto throughput.' },
      { domain: 'Diseño Optimizado en Costes', weight: '20%', description: 'Spot Instances, Reserved / Savings Plans, S3 Storage Classes.' }
    ],
    faq: [
      {
        question: '¿Merece la pena la certificación AWS Solutions Architect Associate?',
        answer: 'Sí. Es una de las certificaciones técnicas más reconocidas por reclutadores en España y aumenta significativamente la tasa de respuesta en candidaturas Cloud.'
      },
      {
        question: '¿Puedo presentarme al examen de AWS de forma remota desde casa?',
        answer: 'Sí. Puedes realizar el examen supervisado a través de Pearson VUE en tu propio ordenador con cámara web.'
      }
    ],
    udemySearchQuery: 'AWS Certified Solutions Architect Associate'
  },
  'kubernetes': {
    slug: 'kubernetes',
    title: 'Guía de Certificación CKA (Certified Kubernetes Administrator)',
    provider: 'Cloud Native Computing Foundation (CNCF)',
    badgeEmoji: '🐳',
    category: 'DevOps & Containers',
    description: 'La certificación práctica por excelencia para administradores e ingenieros de DevOps especializados en orquestación de contenedores Kubernetes.',
    examDetails: {
      duration: '2 horas',
      price: '395 USD (~365€)',
      format: 'Examen 100% práctico en consola de comandos',
      passingScore: '66%',
      validity: '2 años'
    },
    salaryImpact: {
      averageSalaryWithCert: '55.000€ - 80.000€',
      salaryBoostPercentage: '+25%',
      demandLevel: 'Extrema'
    },
    techKey: 'kubernetes',
    prerequisites: [
      'Dominio de la línea de comandos de Linux y arquitectura de contenedores Docker',
      'Conocimientos de red en Kubernetes (Services, Ingress, CNI)',
      'Uso fluido del editor Vim o Nano en la terminal'
    ],
    syllabus: [
      { domain: 'Arquitectura, Instalación y Configuración del Clúster', weight: '25%', description: 'Kubeadm, RBAC, actualización de nodos y backup de etcd.' },
      { domain: 'Cargas de Trabajo y Planificación (Workloads & Scheduling)', weight: '15%', description: 'Deployments, DaemonSets, Taints/Tolerations y Resource Quotas.' },
      { domain: 'Servicios y Redes (Services & Networking)', weight: '20%', description: 'Ingress Controllers, CoreDNS, ClusterIP/NodePort y NetworkPolicies.' },
      { domain: 'Almacenamiento (Storage)', weight: '10%', description: 'PersistentVolumes (PV), PersistentVolumeClaims (PVC) y StorageClasses.' },
      { domain: 'Solución de Problemas (Troubleshooting)', weight: '30%', description: 'Logs de Kubelet, fallos de nodos, estado de Pods y filtrado crictl.' }
    ],
    faq: [
      {
        question: '¿Por qué el examen CKA se considera uno de los más exigentes?',
        answer: 'Porque no es un test de preguntas múltiples. Consiste en resolver 17 problemas reales en vivo editando ficheros YAML y ejecutando comandos kubectl en terminales Linux bajo tiempo límite.'
      }
    ],
    udemySearchQuery: 'Certified Kubernetes Administrator CKA'
  },
  'google-cloud': {
    slug: 'google-cloud',
    title: 'Guía de Certificación GCP Professional Cloud Architect',
    provider: 'Google Cloud',
    badgeEmoji: '🌐',
    category: 'Cloud Computing',
    description: 'Especialízate en diseñar soluciones en la nube de Google optimizadas para analítica de datos, Inteligencia Artificial y microservicios.',
    examDetails: {
      duration: '2 horas',
      price: '200 USD (~185€)',
      format: '50 preguntas tipo test y casos de estudio prácticos',
      passingScore: '70% aproximado',
      validity: '2 años'
    },
    salaryImpact: {
      averageSalaryWithCert: '50.000€ - 72.000€',
      salaryBoostPercentage: '+20%',
      demandLevel: 'Alta'
    },
    techKey: 'cloud',
    prerequisites: [
      'Experiencia previa en computación en la nube',
      'Comprensión de BigQuery, GKE (Google Kubernetes Engine) y Cloud Run',
      'Conocimientos de seguridad e IAM en GCP'
    ],
    syllabus: [
      { domain: 'Diseño y Planificación de Arquitectura Cloud', weight: '30%', description: 'Estrategias de migración, diseño de cargas analíticas y GKE.' },
      { domain: 'Gestión y Aprovisionamiento de Infraestructura Cloud', weight: '20%', description: 'Terraform en GCP, VPC Service Controls y Cloud Identity.' },
      { domain: 'Diseño para Seguridad y Cumplimiento Normativo', weight: '20%', description: 'Cifrado de datos en reposo y tránsito, cumplimiento GDPR.' },
      { domain: 'Optimización de Procesos de Negocio', weight: '15%', description: 'Casos de estudio reales (EHR Healthcare, Mountkirk Games).' },
      { domain: 'Fiabilidad y Monitorización', weight: '15%', description: 'Google Cloud Operations (Stackdriver), SLIs/SLOs y alertas.' }
    ],
    faq: [
      {
        question: '¿Qué ventaja tiene certificarme en Google Cloud frente a AWS?',
        answer: 'GCP destaca especialmente en proyectos de Big Data, Machine Learning e Inteligencia Artificial, donde la integración nativa con BigQuery y Vertex AI ofrece grandes oportunidades laborales.'
      }
    ],
    udemySearchQuery: 'GCP Professional Cloud Architect'
  },
  'ciberseguridad': {
    slug: 'ciberseguridad',
    title: 'Guía de Certificaciones de Ciberseguridad (CompTIA Security+ & CISSP)',
    provider: 'CompTIA / (ISC)²',
    badgeEmoji: '🛡️',
    category: 'Ciberseguridad',
    description: 'Las acreditaciones de seguridad informática más solicitadas para validar habilidades de defensa, análisis de vulnerabilidades y auditoría.',
    examDetails: {
      duration: '90 - 180 minutos',
      price: '392 USD - 749 USD',
      format: 'Preguntas tipo test y simulaciones de rendimiento',
      passingScore: '750 / 900 puntos',
      validity: '3 años'
    },
    salaryImpact: {
      averageSalaryWithCert: '48.000€ - 85.000€',
      salaryBoostPercentage: '+28%',
      demandLevel: 'Muy Alta'
    },
    techKey: 'cybersecurity',
    prerequisites: [
      'Fundamentos sólidos de redes informáticas (TCP/IP, Wireshark)',
      'Conocimientos de administración de sistemas Windows y Linux',
      'Comprensión básica de criptografía y vectores de ataque OWASP'
    ],
    syllabus: [
      { domain: 'Amenazas, Ataques y Vulnerabilidades', weight: '24%', description: 'Malware, ingeniería social, ataques web y análisis de exploits.' },
      { domain: 'Arquitectura y Diseño de Seguridad', weight: '21%', description: 'Zero Trust, seguridad en la nube, segmentación de red.' },
      { domain: 'Implementación de Medidas de Seguridad', weight: '25%', description: 'PKI, autenticación MFA, protocolos seguros (TLS, SSH).' },
      { domain: 'Operaciones y Respuesta ante Incidentes', weight: '16%', description: 'Análisis de logs SIEM, forense digital, continuidad de negocio.' },
      { domain: 'Gobernanza, Riesgo y Cumplimiento', weight: '14%', description: 'Normativa ISO 27001, NIS2, GDPR y gestión de riesgos.' }
    ],
    faq: [
      {
        question: '¿Cuál es la diferencia entre CompTIA Security+ y CISSP?',
        answer: 'CompTIA Security+ es la certificación de entrada ideal para perfiles Junior/Mid. CISSP está dirigida a profesionales Senior y Managers con al menos 5 años de experiencia demostrable en seguridad.'
      }
    ],
    udemySearchQuery: 'CompTIA Security+ SY0-701'
  },
  'scrum': {
    slug: 'scrum',
    title: 'Guía de Certificación PSM I (Professional Scrum Master)',
    provider: 'Scrum.org',
    badgeEmoji: '📜',
    category: 'Agile & Management',
    description: 'Acredita tu conocimiento sobre el marco ágil Scrum con la certificación sin caducidad más respetada del sector del software.',
    examDetails: {
      duration: '60 minutos',
      price: '150 USD (~140€)',
      format: '80 preguntas tipo test y verdadero/falso (en inglés)',
      passingScore: '85% (68 de 80 respuestas correctas)',
      validity: 'De por vida (Sin renovación)'
    },
    salaryImpact: {
      averageSalaryWithCert: '42.000€ - 60.000€',
      salaryBoostPercentage: '+15%',
      demandLevel: 'Alta'
    },
    techKey: 'fullstack',
    prerequisites: [
      'Lectura completa y comprensión de la Guía Oficial de Scrum (Scrum Guide)',
      'Conocimientos básicos de dinámicas de equipo de desarrollo',
      'Inglés técnico de lectura de nivel intermedio (B2)'
    ],
    syllabus: [
      { domain: 'Teoría y Valores de Scrum', weight: '30%', description: 'Empirismo (Inspección, Adaptación, Transparencia) y valores ágiles.' },
      { domain: 'Roles de Scrum', weight: '25%', description: 'Responsabilidades del Scrum Master, Product Owner y Developers.' },
      { domain: 'Eventos de Scrum', weight: '25%', description: 'Sprint, Sprint Planning, Daily Scrum, Sprint Review y Retrospective.' },
      { domain: 'Artefactos y Definición de Hecho (DoD)', weight: '20%', description: 'Product Backlog, Sprint Backlog, Incremento y Definition of Done.' }
    ],
    faq: [
      {
        question: '¿Por qué elegir PSM I de Scrum.org frente a CSM de Scrum Alliance?',
        answer: 'PSM I no requiere realizar un curso presencial obligatorio (puedes estudiarlo de forma autodidacta) y la certificación NUNCA caduca, a diferencia de CSM que exige renovaciones cuotas bienales.'
      }
    ],
    udemySearchQuery: 'Professional Scrum Master PSM I'
  }
};

export function getCertificationGuide(slug: string): CertificationGuide | undefined {
  return CERTIFICATIONS[slug];
}
