export interface ProfessionDetail {
  slug: string;
  title: string;
  description: string;
  techKey: string;
  steps: {
    title: string;
    description: string;
    skills: string[];
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export const PROFESSIONS: Record<string, ProfessionDetail> = {
  'frontend-developer': {
    slug: 'frontend-developer',
    title: 'Cómo convertirse en Frontend Developer',
    description: 'Aprende a diseñar y programar la interfaz visual y la experiencia de usuario de sitios y aplicaciones web modernas utilizando HTML, CSS, JavaScript y React.',
    techKey: 'frontend',
    steps: [
      {
        title: 'Paso 1: Fundamentos Web (HTML y CSS)',
        description: 'Domina la estructura de una página web, accesibilidad (a11y), maquetación con Flexbox, CSS Grid y diseño responsivo.',
        skills: ['HTML5', 'CSS3 Semántico', 'Diseño Responsive', 'Media Queries']
      },
      {
        title: 'Paso 2: Lógica de Programación (JavaScript)',
        description: 'Aprende JavaScript moderno (ES6+), manipulación del DOM, llamadas asíncronas a APIs (Fetch/Axios) y promesas.',
        skills: ['JavaScript ES6+', 'Event Loop', 'JSON', 'Asincronía (Promises)']
      },
      {
        title: 'Paso 3: Sistemas de Control de Versiones',
        description: 'Imprescindible para trabajar en cualquier equipo. Aprende a gestionar ramas y colaborar a través de repositorios remotos.',
        skills: ['Git', 'GitHub', 'Pull Requests', 'Ramas']
      },
      {
        title: 'Paso 4: Frameworks Modernos (React)',
        description: 'React es la librería de UI más demandada. Domina hooks, estados, efectos y enrutamiento en entornos SPA y SSR como Next.js.',
        skills: ['React.js', 'Hooks', 'Next.js', 'Tailwind CSS', 'TypeScript']
      }
    ],
    faq: [
      {
        question: '¿Cuánto tiempo se tarda en ser Frontend Developer?',
        answer: 'Para una persona dedicada, el tiempo aproximado es de 6 a 9 meses de estudio diario para dominar los fundamentos y construir un portafolio inicial competitivo.'
      },
      {
        question: '¿Qué framework de JavaScript debería aprender primero?',
        answer: 'Recomendamos aprender React debido a su inmensa cuota de mercado en España y la gran cantidad de ofertas de empleo activas que lo solicitan.'
      }
    ]
  },
  'backend-developer': {
    slug: 'backend-developer',
    title: 'Cómo convertirse en Backend Developer',
    description: 'Especialízate en la lógica del servidor, creación de APIs, modelado de bases de datos relacionales y optimización de rendimiento en sistemas distribuidos.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Elige un Lenguaje de Servidor',
        description: 'Domina un lenguaje fuerte para backend como Node.js (JavaScript/TypeScript), Python o Java.',
        skills: ['Node.js', 'Python', 'Java', 'TypeScript']
      },
      {
        title: 'Paso 2: Bases de Datos y Modelado',
        description: 'Aprende cómo estructurar, guardar y recuperar información de forma robusta. Prioriza bases de datos relacionales y lenguaje SQL.',
        skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQL', 'ORM (Prisma / Hibernate)']
      },
      {
        title: 'Paso 3: Desarrollo de APIs RESTful',
        description: 'Entiende cómo comunicar el frontend con el backend utilizando endpoints REST, cabeceras, códigos de estado HTTP y autenticación.',
        skills: ['Express', 'Spring Boot', 'FastAPI', 'JWT Auth', 'APIs']
      },
      {
        title: 'Paso 4: Despliegue y Conceptos Cloud',
        description: 'Aprende a empaquetar tu código en contenedores Docker y subirlo a servicios básicos de la nube.',
        skills: ['Docker', 'AWS (S3 / EC2)', 'Linux CLI', 'CI/CD']
      }
    ],
    faq: [
      {
        question: '¿Qué lenguaje es mejor para empezar en Backend?',
        answer: 'Node.js (JavaScript) es excelente por su flexibilidad y cercanía al frontend. Python es ideal por su legibilidad, y Java es muy recomendado si buscas estabilidad en grandes corporaciones de España.'
      },
      {
        question: '¿Es obligatorio saber SQL?',
        answer: 'Sí, el modelado y la consulta de bases de datos relacionales con SQL es un requisito fundamental en el 90% de las vacantes de backend.'
      }
    ]
  },
  'devops-engineer': {
    slug: 'devops-engineer',
    title: 'Cómo convertirse en DevOps Engineer',
    description: 'Conviértete en el puente entre el desarrollo de software y la infraestructura Cloud, automatizando despliegues y garantizando la resiliencia de los sistemas.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Administración de Sistemas y Redes',
        description: 'Domina el sistema operativo Linux, scripts de Bash, protocolos de red (HTTP/HTTPS, SSH, DNS, TCP/IP) y seguridad.',
        skills: ['Linux Admin', 'Bash Scripting', 'SSH & Keys', 'Protocolos de Red']
      },
      {
        title: 'Paso 2: Contenedores y Microservicios',
        description: 'Aísla aplicaciones usando contenedores Docker y aprende a orquestarlas a gran escala con Kubernetes.',
        skills: ['Docker', 'Kubernetes (K8s)', 'Configuración de Pods', 'Helm']
      },
      {
        title: 'Paso 3: Infraestructura como Código (IaC)',
        description: 'Aprende a declarar y aprovisionar servidores y bases de datos usando plantillas configurables e independientes de la interfaz del proveedor.',
        skills: ['Terraform', 'Ansible', 'YAML', 'CloudFormation']
      },
      {
        title: 'Paso 4: Proveedores Cloud y Pipelines CI/CD',
        description: 'Domina los principales proveedores cloud y automatiza el flujo completo de entrega de software.',
        skills: ['AWS (o Azure / GCP)', 'GitHub Actions', 'Jenkins', 'Monitorización (Prometheus)']
      }
    ],
    faq: [
      {
        question: '¿Es DevOps una posición adecuada para juniors?',
        answer: 'Generalmente no. Requiere experiencia previa en desarrollo o administración de sistemas, ya que gestionas la infraestructura del software de toda la empresa.'
      },
      {
        question: '¿Qué nube pública debería aprender primero?',
        answer: 'AWS es el líder del mercado en España y ofrece el mayor volumen de empleo para ingenieros DevOps.'
      }
    ]
  },
  'data-scientist': {
    slug: 'data-scientist',
    title: 'Cómo convertirse en Data Scientist',
    description: 'Especialízate en analizar grandes volúmenes de datos mediante matemáticas, programación y modelos predictivos de Machine Learning para guiar decisiones de negocio.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: Fundamentos de Python e Idioma de Datos',
        description: 'Domina la sintaxis de Python y sus librerías esenciales de análisis estadístico y manipulación tabular.',
        skills: ['Python', 'Pandas', 'NumPy', 'Jupyter Notebooks']
      },
      {
        title: 'Paso 2: Matemáticas y Estadística Avanzada',
        description: 'Aprende álgebra lineal, cálculo, distribuciones de probabilidad, contrastes de hipótesis y regresiones estadísticas.',
        skills: ['Estadística Inferencial', 'Álgebra Lineal', 'Probabilidad']
      },
      {
        title: 'Paso 3: Visualización de Datos y Business Intelligence',
        description: 'Traduce datos en insights de negocio mediante dashboards interactivos y gráficas descriptivas claras.',
        skills: ['Matplotlib / Seaborn', 'Tableau', 'PowerBI', 'SQL avanzado']
      },
      {
        title: 'Paso 4: Modelos de Machine Learning',
        description: 'Aprende a entrenar modelos predictivos (clasificación, regresión, clustering) y redes neuronales básicas.',
        skills: ['Scikit-Learn', 'Supervised Learning', 'Clustering', 'Deep Learning (TensorFlow/PyTorch)']
      }
    ],
    faq: [
      {
        question: '¿Qué diferencia hay entre Data Analyst y Data Scientist?',
        answer: 'El Data Analyst interpreta datos históricos para responder preguntas de negocio. El Data Scientist va un paso más allá usando modelos predictivos y programación avanzada para anticipar comportamientos.'
      },
      {
        question: '¿Necesito un doctorado o carrera para ser Data Scientist?',
        answer: 'Aunque un background en Matemáticas, Física o Estadística ayuda, hoy en día muchas empresas valoran el portfolio técnico y certificaciones específicas sobre la titulación tradicional.'
      }
    ]
  },
  'mobile-developer': {
    slug: 'mobile-developer',
    title: 'Cómo convertirse en Mobile Developer',
    description: 'Aprende a diseñar y construir aplicaciones nativas e híbridas para smartphones y tablets Android e iOS.',
    techKey: 'mobile',
    steps: [
      {
        title: 'Paso 1: Lógica de Programación Móvil',
        description: 'Domina las bases de la programación orientada a objetos aplicadas a interfaces táctiles y ciclos de vida móviles.',
        skills: ['Estructura de Apps', 'OOP', 'UI Components']
      },
      {
        title: 'Paso 2: Desarrollo Multiplataforma (Recomendado)',
        description: 'Flutter y React Native permiten crear una app para Android e iOS con un único código fuente, ahorrando costes.',
        skills: ['Flutter (Dart)', 'React Native (JS/TS)', 'State Management']
      },
      {
        title: 'Paso 3: Desarrollo Nativo (Opcional/Avanzado)',
        description: 'Si buscas rendimiento extremo, especialízate en las tecnologías propietarias de Apple o Google.',
        skills: ['Kotlin (Android)', 'Swift (iOS)', 'Xcode / Android Studio']
      },
      {
        title: 'Paso 4: Despliegue en Tiendas oficiales',
        description: 'Aprende los procesos de revisión y publicación de aplicaciones en Apple App Store y Google Play Store.',
        skills: ['App Store Connect', 'Google Play Console', 'Firma de Apps']
      }
    ],
    faq: [
      {
        question: '¿Qué conviene más: Nativo o Multiplataforma?',
        answer: 'Multiplataforma (especialmente Flutter) es ideal para startups por su velocidad de desarrollo y coste. El desarrollo nativo se reserva para grandes corporaciones o aplicaciones con requisitos exigentes de hardware.'
      }
    ]
  },
  'fullstack-developer': {
    slug: 'fullstack-developer',
    title: 'Cómo convertirse en Full Stack Developer',
    description: 'Domina tanto las interfaces visibles del cliente (Frontend) como la arquitectura y lógica interna del servidor (Backend), obteniendo una visión global ágil.',
    techKey: 'fullstack',
    steps: [
      {
        title: 'Paso 1: Especialización Inicial en Frontend',
        description: 'Comienza dominando HTML, CSS y React. No intentes aprender ambos lados del desarrollo desde el día uno.',
        skills: ['HTML5 / CSS3', 'JavaScript ES6+', 'React.js', 'Tailwind CSS']
      },
      {
        title: 'Paso 2: Lógica Backend con el mismo Lenguaje',
        description: 'Reutiliza tus conocimientos de JavaScript para programar en el servidor utilizando Node.js y bases de datos relacionales.',
        skills: ['Node.js', 'Express', 'SQL', 'PostgreSQL / MySQL']
      },
      {
        title: 'Paso 3: APIs e Integración Completa',
        description: 'Aprende a conectar ambos mundos mediante APIs seguras, autenticación persistente y control de estados.',
        skills: ['JWT Authentication', 'REST APIs', 'TypeScript', 'Axios / Fetch']
      },
      {
        title: 'Paso 4: Despliegue, Contenedores y DevOps básico',
        description: 'Aprende a empaquetar tu solución completa en contenedores e integrarla en pipelines automatizados.',
        skills: ['Docker', 'AWS / Vercel', 'Git & GitHub', 'CI/CD']
      }
    ],
    faq: [
      {
        question: '¿Es realista ser Full Stack de verdad?',
        answer: 'Sí. A menudo te especializarás más en un lado (Frontend o Backend), pero dominar ambos te convierte en una pieza clave para startups y equipos pequeños por tu autonomía y versatilidad.'
      }
    ]
  }
};
