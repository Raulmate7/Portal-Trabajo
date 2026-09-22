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
  'ingeniero-ia': {
    slug: 'ingeniero-ia',
    title: 'Cómo convertirse en Ingeniero de Inteligencia Artificial',
    description: 'Aprende a integrar modelos de lenguaje (LLM), arquitecturas RAG, agentes inteligentes y modelos predictivos en productos de software reales.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: Fundamentos de Python y Matemáticas',
        description: 'Domina Python moderno, álgebra lineal, cálculo y manejo de datos con Pandas y NumPy.',
        skills: ['Python 3.11+', 'NumPy', 'Pandas', 'Álgebra Lineal']
      },
      {
        title: 'Paso 2: Frameworks de IA y Machine Learning',
        description: 'Construye y entrena modelos predictivos utilizando PyTorch, Scikit-Learn y Hugging Face Transformers.',
        skills: ['PyTorch', 'Transformers', 'Hugging Face', 'Scikit-Learn']
      },
      {
        title: 'Paso 3: Arquitecturas RAG y Bases Vectoriales',
        description: 'Conecta LLMs con fuentes de datos privadas usando LangChain, LlamaIndex y bases de datos vectoriales.',
        skills: ['LangChain', 'LlamaIndex', 'Pinecone / Qdrant', 'Embeddings']
      },
      {
        title: 'Paso 4: Agentes Autónomos y Despliegue',
        description: 'Aprende a diseñar agentes de IA con capacidades de ejecución de herramientas y despliégalos en la nube.',
        skills: ['AI Agents', 'FastAPI', 'Docker', 'AWS / Vercel AI SDK']
      }
    ],
    faq: [
      {
        question: '¿Qué diferencia a un Ingeniero de IA de un Data Scientist?',
        answer: 'El Data Scientist se enfoca en el análisis estadístico y entrenamiento de modelos. El Ingeniero de IA se centra en llevar esos modelos a producción integrándolos en aplicaciones cliente.'
      }
    ]
  },
  'experto-ciberseguridad': {
    slug: 'experto-ciberseguridad',
    title: 'Cómo convertirse en Especialista en Ciberseguridad',
    description: 'Protege las infraestructuras, redes y aplicaciones de las empresas mediante hacking ético, auditoría de seguridad y respuesta ante incidentes.',
    techKey: 'cybersecurity',
    steps: [
      {
        title: 'Paso 1: Redes y Administracion de Sistemas',
        description: 'Comprende a fondo los protocolos TCP/IP, modelos OSI, administración de Linux y configuración de firewalls.',
        skills: ['Linux Security', 'Wireshark', 'TCP/IP', 'Firewalls & VPNs']
      },
      {
        title: 'Paso 2: Hacking Ético y Pentesting',
        description: 'Aprende las metodologías de prueba de penetración para identificar y explotar vulnerabilidades de forma controlada.',
        skills: ['Metasploit', 'Burp Suite', 'Nmap', 'OWASP Top 10']
      },
      {
        title: 'Paso 3: Seguridad Cloud y DevSecOps',
        description: 'Implementa controles de seguridad en entornos AWS/Azure e integra herramientas SAST/DAST en pipelines CI/CD.',
        skills: ['Cloud Security', 'SAST / DAST', 'IAM Policies', 'Zero Trust']
      },
      {
        title: 'Paso 4: Certificaciones y Respuesta a Incidentes',
        description: 'Prepárate para certificaciones internacionales clave como CompTIA Security+, CEH o CISSP.',
        skills: ['SIEM', 'CompTIA Security+', 'Análisis Forense', 'ISO 27001']
      }
    ],
    faq: [
      {
        question: '¿Hace falta saber programar para trabajar en Ciberseguridad?',
        answer: 'Para roles iniciales de análisis de logs no es imprescindible, pero saber programar en Python o Bash es fundamental para auditar código y automatizar scripts de pentesting.'
      }
    ]
  },
  'cloud-architect': {
    slug: 'cloud-architect',
    title: 'Cómo convertirse en Cloud Architect',
    description: 'Diseña la arquitectura global de sistemas informáticos empresariales en la nube, garantizando alta disponibilidad, seguridad y optimización de costes.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Dominio de Proveedores Cloud Líderes',
        description: 'Especialízate en AWS, Microsoft Azure o Google Cloud Platform a nivel avanzado de infraestructura.',
        skills: ['AWS IAM / VPC', 'Azure Networking', 'GCP Compute', 'Storage Services']
      },
      {
        title: 'Paso 2: Infraestructura como Código y Contenedores',
        description: 'Define arquitecturas completas mediante código usando Terraform y orquesta servicios con Kubernetes.',
        skills: ['Terraform', 'Kubernetes', 'Docker', 'Ansible']
      },
      {
        title: 'Paso 3: Arquitecturas Distribuidas y FinOps',
        description: 'Diseña patrones de alta disponibilidad, tolerancia a fallos, recuperación ante desastres y optimización de costos.',
        skills: ['Multi-AZ', 'Disaster Recovery', 'Cost Optimization', 'FinOps']
      },
      {
        title: 'Paso 4: Certificaciones Oficiales Architect Level',
        description: 'Obtén la certificación AWS Certified Solutions Architect Professional o equivalente en Azure/GCP.',
        skills: ['AWS Solutions Architect Pro', 'Azure Solutions Architect', 'TOGAF']
      }
    ],
    faq: [
      {
        question: '¿Qué nivel salarial alcanza un Cloud Architect en España?',
        answer: 'Es una de las profesiones mejor remuneradas del sector IT en España, con bandas salariales para perfiles senior que superan habitualmente los 60.000€ - 85.000€ brutos anuales.'
      }
    ]
  },
  'site-reliability-engineer': {
    slug: 'site-reliability-engineer',
    title: 'Cómo convertirse en Site Reliability Engineer (SRE)',
    description: 'Aplica principios de ingeniería de software para resolver problemas de operaciones, garantizando la máxima disponibilidad y rendimiento de plataformas a gran escala.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Desarrollo de Software e Infraestructura',
        description: 'Combina habilidades de programación en Go o Python con administración avanzada de sistemas Linux.',
        skills: ['Go', 'Python', 'Linux Kernel', 'Bash Scripting']
      },
      {
        title: 'Paso 2: Observabilidad y Métricas',
        description: 'Implementa arquitecturas de telemetría completa usando Prometheus, Grafana y OpenTelemetry.',
        skills: ['Prometheus', 'Grafana', 'OpenTelemetry', 'ELK Stack']
      },
      {
        title: 'Paso 3: Gestión de SLIs, SLOs y Presupuestos de Error',
        description: 'Define y gestiona los indicadores de nivel de servicio (SLI) y los objetivos de disponibilidad del producto.',
        skills: ['SLI / SLO', 'Error Budgets', 'Chaos Engineering', 'Incident Management']
      },
      {
        title: 'Paso 4: Automatización y Gestión de Post-Mortems',
        description: 'Elimina el trabajo repetitivo (toil) creando herramientas internas y realizando análisis de incidentes sin culpa.',
        skills: ['Toil Reduction', 'Blameless Post-Mortems', 'Kubernetes', 'CI/CD']
      }
    ],
    faq: [
      {
        question: '¿En qué se diferencia un SRE de un DevOps Engineer?',
        answer: 'DevOps es una filosofía cultural. SRE es una implementación concreta creada por Google que aplica la mentalidad de desarrollo de software a las operaciones del sistema.'
      }
    ]
  },
  'platform-engineer': {
    slug: 'platform-engineer',
    title: 'Cómo convertirse en Platform Engineer',
    description: 'Crea plataformas internas de desarrollo (IDP) que simplifican el autoservicio de infraestructura y reducen la carga cognitiva de los desarrolladores.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Kubernetes y Ecosistema Cloud Native',
        description: 'Domina la orquestación de contenedores y los operadores nativos de Kubernetes.',
        skills: ['Kubernetes Operators', 'Helm', 'ArgoCD', 'Cilium']
      },
      {
        title: 'Paso 2: Desarrollo de Portales de Autoservicio',
        description: 'Construye portales internos usando herramientas como Backstage (Spotify) o desarrollos a medida.',
        skills: ['Backstage', 'Internal Developer Portals', 'Backstage Plugins', 'TypeScript']
      },
      {
        title: 'Paso 3: Automatización de Infraestructura',
        description: 'Conecta herramientas de IaC como Terraform o Crossplane con APIs de aprobación automática.',
        skills: ['Crossplane', 'Terraform Cloud', 'GitOps', 'CI/CD Pipelines']
      },
      {
        title: 'Paso 4: Developer Experience (DX)',
        description: 'Diseña la "Golden Path" para que cualquier desarrollador despliegue una aplicación en minutos.',
        skills: ['DX Frameworks', 'Golden Paths', 'System Architecture', 'Product Ownership']
      }
    ],
    faq: [
      {
        question: '¿Por qué las empresas buscan Platform Engineers?',
        answer: 'Porque permite a los equipos de desarrollo desplegar su propio software sin depender constantemente del equipo de operaciones, acelerando el ciclo de entrega.'
      }
    ]
  },
  'desarrollador-blockchain': {
    slug: 'desarrollador-blockchain',
    title: 'Cómo convertirse en Desarrollador Blockchain & Web3',
    description: 'Aprende a programar contratos inteligentes (Smart Contracts) y aplicaciones descentralizadas (dApps) en redes como Ethereum, Solana o Polygon.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Fundamentos de Criptografía y Redes P2P',
        description: 'Comprende las estructuras de datos inmutables, firmas digitales, funciones hash y algoritmos de consenso.',
        skills: ['Criptografía', 'SHA-256', 'Redes P2P', 'Consenso (PoW/PoS)']
      },
      {
        title: 'Paso 2: Programación de Smart Contracts',
        description: 'Especialízate en Solidity para la Ethereum Virtual Machine (EVM) o Rust para Solana.',
        skills: ['Solidity', 'Rust', 'EVM', 'Hardhat / Foundry']
      },
      {
        title: 'Paso 3: Desarrollo de Frontend Web3',
        description: 'Conecta aplicaciones cliente React con la blockchain utilizando bibliotecas como Ethers.js o Viem.',
        skills: ['Ethers.js', 'Viem / Wagmi', 'MetaMask Integration', 'React']
      },
      {
        title: 'Paso 4: Auditoría y Seguridad de Smart Contracts',
        description: 'Aprende a auditar código para evitar vulnerabilidades críticas como ataques de reentrada.',
        skills: ['Slither', 'Mythril', 'Reentrancy Attacks', 'Auditoría Web3']
      }
    ],
    faq: [
      {
        question: '¿Qué lenguaje es mejor para empezar en Web3?',
        answer: 'Solidity es el estándar indiscutible para la red Ethereum y EVM. Rust es la mejor opción si te orientas a Solana, Near o Polkadot.'
      }
    ]
  },
  'especialista-finops': {
    slug: 'especialista-finops',
    title: 'Cómo convertirse en Especialista FinOps Cloud',
    description: 'Aprende a auditar, analizar y reducir los costes de infraestructura cloud en AWS, Azure y GCP sin comprometer el rendimiento.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Modelos de Facturación Cloud',
        description: 'Comprende en detalle las métricas de cómputo, almacenamiento, transferencia de red y tipos de instancias.',
        skills: ['AWS Cost Explorer', 'Azure Cost Management', 'Savings Plans', 'Spot Instances']
      },
      {
        title: 'Paso 2: Herramientas de Monitorización de Costes',
        description: 'Implementa etiquetado (tagging) estandarizado y herramientas de análisis como Kubecost o Infracost.',
        skills: ['Kubecost', 'Infracost', 'Resource Tagging', 'Data Studio']
      },
      {
        title: 'Paso 3: Automatización de Apagados y Dimensionamiento',
        description: 'Crea automatizaciones para apagar entornos de desarrollo fuera de horario y ajustar capacidades (rightsizing).',
        skills: ['Rightsizing', 'Lambda Automation', 'CloudWatch Rules', 'FinOps Open Specification']
      },
      {
        title: 'Paso 4: Certificación FinOps Certified Practitioner',
        description: 'Obtén la certificación oficial otorgada por la FinOps Foundation.',
        skills: ['FinOps Practitioner Cert', 'Cloud Governance', 'KPIs Financieros']
      }
    ],
    faq: [
      {
        question: '¿Qué perfil técnico se requiere para FinOps?',
        answer: 'Un perfil híbrido entre ingeniería DevOps y análisis financiero. Es ideal para ingenieros cloud con visión estratégica de negocio.'
      }
    ]
  },
  'ingeniero-mlops': {
    slug: 'ingeniero-mlops',
    title: 'Cómo convertirse en Ingeniero MLOps',
    description: 'Automatiza el ciclo de vida completo de los modelos de Machine Learning desde el entrenamiento hasta el despliegue y monitorización continua.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: Pipeline de Datos e Ingeniería de Software',
        description: 'Domina Python, control de versiones de código y preparación de datasets escalables.',
        skills: ['Python', 'Git / DVC', 'SQL', 'Docker']
      },
      {
        title: 'Paso 2: Registro de Modelos y Control de Experimentos',
        description: 'Implementa herramientas para rastrear experimentos, hiperparámetros y artefactos de modelos.',
        skills: ['MLflow', 'W&B (Weights & Biases)', 'Neptune.ai', 'Feast (Feature Store)']
      },
      {
        title: 'Paso 3: Pipelines de CI/CD para Machine Learning',
        description: 'Automatiza el reentrenamiento y validación continua de modelos usando Kubeflow o AWS SageMaker.',
        skills: ['Kubeflow', 'AWS SageMaker', 'TFX (TensorFlow Extended)', 'GitHub Actions']
      },
      {
        title: 'Paso 4: Monitorización de Drift y Despliegue en API',
        description: 'Detecta degradación de precisión (concept drift) y despliega endpoints de alta velocidad.',
        skills: ['Evidently AI', 'Triton Inference Server', 'FastAPI', 'Model Monitoring']
      }
    ],
    faq: [
      {
        question: '¿Por qué MLOps es una profesión en auge?',
        answer: 'Porque más del 80% de los modelos de IA desarrollados en empresas nunca llegaban a producción por falta de automatización e infraestructura adecuada.'
      }
    ]
  },
  'desarrollador-rust': {
    slug: 'desarrollador-rust',
    title: 'Cómo convertirse en Desarrollador Rust',
    description: 'Especialízate en el lenguaje de programación de alto rendimiento más apreciado por los desarrolladores para construir infraestructuras seguras y rápidas.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Conceptos Únicos de Rust (Ownership y Borrowing)',
        description: 'Domina el verificador de préstamos (borrow checker), la gestión de memoria sin recolector de basura y el sistema de tipos.',
        skills: ['Ownership & Borrowing', 'Lifetimes', 'Pattern Matching', 'Cargo']
      },
      {
        title: 'Paso 2: Concurrencia Segura y Manejo de Errores',
        description: 'Aprende a programar tareas concurrentes sin condiciones de carrera utilizando la abstracción Result/Option.',
        skills: ['Concurrency', 'Tokio Async', 'Result & Option', 'Traits']
      },
      {
        title: 'Paso 3: Desarrollo Backend e Infraestructura',
        description: 'Crea APIs REST/gRPC de bajísima latencia utilizando frameworks como Axum o Actix-web.',
        skills: ['Axum', 'Actix-web', 'Diesel ORM', 'gRPC']
      },
      {
        title: 'Paso 4: WebAssembly y Sistemas',
        description: 'Compila código Rust a WebAssembly para ejecutar aplicaciones de alta velocidad en el navegador o entornos Edge.',
        skills: ['WebAssembly (WASM)', 'wasm-pack', 'Sistemas de bajo nivel']
      }
    ],
    faq: [
      {
        question: '¿Por qué Rust tiene sueldos tan elevados?',
        answer: 'Debido a su exigente curva de aprendizaje inicial y a su adopción masiva por parte de gigantes tecnológicos (Microsoft, Meta, Amazon) para componentes críticos.'
      }
    ]
  },
  'consultor-sap': {
    slug: 'consultor-sap',
    title: 'Cómo convertirse en Consultor y Desarrollador SAP',
    description: 'Especialízate en la implantación, parametrización y desarrollo ABAP/Fiori del ERP empresarial líder mundial.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Fundamentos de ERP y Módulos SAP',
        description: 'Entiende los procesos de negocio en módulos clave como FI/CO, SD, MM o S/4HANA.',
        skills: ['SAP S/4HANA', 'Procesos ERP', 'Módulos SAP']
      },
      {
        title: 'Paso 2: Programación ABAP y HANA Database',
        description: 'Aprende el lenguaje de programación propietario ABAP para realizar extensiones y desarrollos a medida.',
        skills: ['ABAP OO', 'Core Data Services (CDS)', 'SAP HANA DB']
      },
      {
        title: 'Paso 3: Desarrollo Frontend con SAP Fiori / UI5',
        description: 'Construye interfaces de usuario modernas basadas en JavaScript para el entorno SAP.',
        skills: ['SAP Fiori', 'SAPUI5', 'OData Services']
      },
      {
        title: 'Paso 4: Certificación Oficial SAP',
        description: 'Obtén la certificación oficial de consultor SAP en el módulo de tu especialización.',
        skills: ['SAP Certified Development Associate', 'Integración ERP']
      }
    ],
    faq: [
      {
        question: '¿Hay trabajo de SAP en España?',
        answer: 'SAP cuenta con un volumen inmenso de demanda en grandes multinacionales, ibex 35 y consultoras tecnológicas en España.'
      }
    ]
  },
  'administrador-sistemas-linux': {
    slug: 'administrador-sistemas-linux',
    title: 'Cómo convertirse en Administrador de Sistemas Linux',
    description: 'Especialízate en la instalación, configuración, mantenimiento y seguridad de servidores empresariales bajo distribuciones Linux.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Comando y Administración de Servidores',
        description: 'Domina la terminal Bash, gestión de usuarios, permisos (chmod/chown), discos (LVM) y paquetes.',
        skills: ['Bash CLI', 'RHEL / Ubuntu Server', 'LVM', 'Permisos Linux']
      },
      {
        title: 'Paso 2: Servicios de Red y Web',
        description: 'Configura servidores web Nginx/Apache, servidores DNS (Bind), DHCP y correo electrónico.',
        skills: ['Nginx / Apache', 'DNS / DHCP', 'SSH Hardening', 'IPTables / UFW']
      },
      {
        title: 'Paso 3: Automatización y Monitorización',
        description: 'Crea scripts automatizados y gestiona configuraciones centralizadas con Ansible.',
        skills: ['Ansible', 'Shell Scripting', 'Zabbix / Nagios', 'Systemd']
      },
      {
        title: 'Paso 4: Certificaciones RHCSA / LPIC',
        description: 'Prepárate para la certificación Red Hat Certified System Administrator (RHCSA).',
        skills: ['RHCSA', 'LPIC-1 / LPIC-2', 'Troubleshooting']
      }
    ],
    faq: [
      {
        question: '¿Sigue siendo relevante el SysAdmin tradicional?',
        answer: 'Sí. Además, el SysAdmin moderno que adopta conceptos de Cloud y DevOps se reconvierte fácilmente a posiciones de Infrastructure Engineer.'
      }
    ]
  },
  'especialista-salesforce': {
    slug: 'especialista-salesforce',
    title: 'Cómo convertirse en Desarrollador Salesforce',
    description: 'Especialízate en la plataforma CRM en la nube líder del mercado programando en Apex, Lightning Web Components y Visualforce.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Administración de Salesforce y Trailhead',
        description: 'Completa la ruta de administración en la plataforma oficial de aprendizaje Trailhead.',
        skills: ['Salesforce Admin', 'Data Model', 'Flows & Process Builder']
      },
      {
        title: 'Paso 2: Programación Backend en Apex',
        description: 'Aprende el lenguaje de programación en el servidor de Salesforce (similar a Java) y consultas SOQL.',
        skills: ['Apex Code', 'SOQL / SOSL', 'Triggers', 'Apex REST']
      },
      {
        title: 'Paso 3: Frontend con Lightning Web Components (LWC)',
        description: 'Desarrolla componentes de interfaz utilizando estándares web modernos (HTML, JS, CSS).',
        skills: ['Lightning Web Components', 'JavaScript', 'HTML5 / CSS']
      },
      {
        title: 'Paso 4: Certificación Platform Developer I',
        description: 'Obtén la certificación oficial Salesforce Certified Platform Developer I.',
        skills: ['Platform Developer I Cert', 'Salesforce DX', 'Deployment']
      }
    ],
    faq: [
      {
        question: '¿Qué empleabilidad tiene el ecosistema Salesforce?',
        answer: 'Altísima. Existe un déficit global de desarrolladores certificados en Salesforce, lo que garantiza salarios competitivos desde niveles Junior.'
      }
    ]
  },
  'desarrollador-unity': {
    slug: 'desarrollador-unity',
    title: 'Cómo convertirse en Desarrollador Unity & Videojuegos',
    description: 'Aprende a crear videojuegos 2D, 3D y aplicaciones de realidad aumentada/virtual utilizando el motor Unity y el lenguaje C#.',
    techKey: 'frontend',
    steps: [
      {
        title: 'Paso 1: Lenguaje C# Orientado a Objetos',
        description: 'Domina las estructuras del lenguaje C#, patrones de diseño y programación orientada a objetos.',
        skills: ['C#', 'OOP', 'Estructuras de Datos', 'Algoritmos']
      },
      {
        title: 'Paso 2: Motor Unity e Interfaz del Editor',
        description: 'Aprende la jerarquía de escenas, GameObjects, componentes, física y gestión de assets.',
        skills: ['Unity Editor', 'Physics 2D/3D', 'Prefabs', 'UI Canvas']
      },
      {
        title: 'Paso 3: Mecánicas de Juego y Animación',
        description: 'Programa la lógica de juego, sistemas de entrada (Input System) y máquinas de estados de animación (Animator).',
        skills: ['Input System', 'Animator Controller', 'NavMesh AI', 'Audio Engine']
      },
      {
        title: 'Paso 4: Optimización y Publicación Multiplataforma',
        description: 'Optimiza la tasa de cuadros por segundo (FPS) y exporta a PC, consolas o dispositivos móviles.',
        skills: ['Profiler', 'Draw Calls Optimization', 'Mobile Export', 'XR (VR/AR)']
      }
    ],
    faq: [
      {
        question: '¿Unity solo sirve para hacer videojuegos?',
        answer: 'No. Unity se utiliza masivamente en la industria automotriz, arquitectura, simulaciones industriales y experiencias de Realidad Virtual (VR).'
      }
    ]
  },
  'tester-qa-automatizacion': {
    slug: 'tester-qa-automatizacion',
    title: 'Cómo convertirse en QA Automation Engineer',
    description: 'Diseña y ejecuta suites de pruebas automatizadas para garantizar la calidad del software en aplicaciones web, móviles y APIs.',
    techKey: 'frontend',
    steps: [
      {
        title: 'Paso 1: Fundamentos de Testing y Estrategias',
        description: 'Domina los conceptos de pruebas unitarias, de integración, regresión y gestión de defectos.',
        skills: ['ISTQB Foundation', 'Casos de Prueba', 'Bug Tracking (Jira)']
      },
      {
        title: 'Paso 2: Lenguaje de Programación para Testing',
        description: 'Especialízate en JavaScript/TypeScript o Python para escribir scripts de prueba robustos.',
        skills: ['JavaScript / TypeScript', 'Python', 'Git']
      },
      {
        title: 'Paso 3: Frameworks de Automatización Web y API',
        description: 'Domina herramientas líderes como Playwright, Cypress, Selenium y Postman.',
        skills: ['Playwright', 'Cypress', 'Postman / REST Assured', 'Selenium']
      },
      {
        title: 'Paso 4: Integración en Pipelines CI/CD',
        description: 'Ejecuta las baterías de pruebas de forma automática tras cada commit en GitHub Actions o Jenkins.',
        skills: ['CI/CD Integration', 'Headless Browsers', 'Reportes de Test']
      }
    ],
    faq: [
      {
        question: '¿Cuál es la diferencia salarial entre QA Manual y QA Automation?',
        answer: 'Los ingenieros de automatización (QA Automation) perciben salarios sensiblemente superiores (entre un 30% y un 50% más) debido a sus habilidades de programación.'
      }
    ]
  },
  'scrum-master': {
    slug: 'scrum-master',
    title: 'Cómo convertirse en Scrum Master',
    description: 'Facilita la aplicación del marco Scrum en equipos de desarrollo de software, eliminando impedimentos y promoviendo la mejora continua.',
    techKey: 'fullstack',
    steps: [
      {
        title: 'Paso 1: Fundamentos del Marco Scrum y Agile',
        description: 'Estudia a fondo la Guía Oficial de Scrum, los valores ágiles, roles, eventos y artefactos.',
        skills: ['Scrum Guide', 'Manifiesto Ágil', 'Eventos Scrum', 'Artefactos']
      },
      {
        title: 'Paso 2: Facilitación y Gestión de Herramientas',
        description: 'Aprende a dinamizar retrospectivas, planificaciones y gestionar tableros en Jira o Azure DevOps.',
        skills: ['Jira / Confluence', 'Miro / Mural', 'Técnicas de Retrospectiva', 'Burndown Charts']
      },
      {
        title: 'Paso 3: Coaching de Equipo y Resolución de Conflictos',
        description: 'Desarrolla habilidades blandas para ayudar al Product Owner y proteger al equipo de desarrollo.',
        skills: ['Servant Leadership', 'Resolución de Conflictos', 'Métricas Ágiles (Velocity)']
      },
      {
        title: 'Paso 4: Certificación PSM I / CSM',
        description: 'Obtén la certificación Professional Scrum Master I (Scrum.org) o Certified ScrumMaster (Scrum Alliance).',
        skills: ['PSM I Certification', 'Escalado Ágil (SAFe / LeSS)']
      }
    ],
    faq: [
      {
        question: '¿Es necesario saber programar para ser Scrum Master?',
        answer: 'No es obligatorio saber escribir código, pero contar con un trasfondo técnico facilita enormemente la empatía y la comprensión de los impedimentos del equipo.'
      }
    ]
  },
  'product-manager-tech': {
    slug: 'product-manager-tech',
    title: 'Cómo convertirse en Technical Product Manager',
    description: 'Define la visión, hoja de ruta y priorización de productos digitales de base tecnológica uniendo negocio, diseño e ingeniería.',
    techKey: 'fullstack',
    steps: [
      {
        title: 'Paso 1: Descubrimiento de Producto y Estrategia',
        description: 'Aprende a analizar las necesidades de los usuarios, definir KPIs y construir el Roadmap del producto.',
        skills: ['Product Discovery', 'KPIs & OKRs', 'Roadmapping', 'Product Market Fit']
      },
      {
        title: 'Paso 2: Comprensión de Arquitectura Técnica',
        description: 'Entiende cómo funcionan las APIs, bases de datos y decisiones de arquitectura para comunicarte con los desarrolladores.',
        skills: ['Entendimiento de APIs', 'Arquitectura Web', 'SQL para Product Managers']
      },
      {
        title: 'Paso 3: Metodologías Ágiles y Priorización de Backlog',
        description: 'Domina frameworks de priorización (RICE, MoSCoW, WSJF) y la redacción de Historias de Usuario.',
        skills: ['User Stories', 'RICE Framework', 'Jira Product Discovery', 'Backlog Grooming']
      },
      {
        title: 'Paso 4: Analítica de Producto y Experimentos (A/B Testing)',
        description: 'Mide la adopción de funcionalidades utilizando herramientas de analítica y pruebas de hipótesis.',
        skills: ['Mixpanel / Amplitude', 'A/B Testing', 'Google Analytics 4', 'UX Research']
      }
    ],
    faq: [
      {
        question: '¿Cuál es la diferencia entre Product Owner y Product Manager?',
        answer: 'El Product Owner se enfoca en la ejecución táctica con el equipo de desarrollo. El Product Manager tiene una responsabilidad más amplia de estrategia, mercado y negocio.'
      }
    ]
  },
  'ux-engineer': {
    slug: 'ux-engineer',
    title: 'Cómo convertirse en UX Engineer / UI Developer',
    description: 'Especialízate en el punto de contacto entre el diseño de experiencia de usuario (UX) y el desarrollo frontend, construyendo sistemas de diseño interactivos.',
    techKey: 'frontend',
    steps: [
      {
        title: 'Paso 1: Herramientas de Diseño y Prototipado',
        description: 'Domina Figma, sistemas de diseño, tokens de diseño y principios de usabilidad.',
        skills: ['Figma', 'Design Systems', 'Design Tokens', 'Prototipado']
      },
      {
        title: 'Paso 2: HTML Semántico, CSS Avanzado y Accesibilidad',
        description: 'Especialízate en accesibilidad web (WCAG 2.2), animaciones CSS y maquetación fluida.',
        skills: ['WCAG 2.2 / A11y', 'CSS Architecture', 'Tailwind CSS', 'Framer Motion']
      },
      {
        title: 'Paso 3: Componentes React y Storybook',
        description: 'Crea bibliotecas de componentes reutilizables y documéntalas de forma aislada en Storybook.',
        skills: ['Storybook', 'React Component Architecture', 'TypeScript', 'Radix UI / Headless UI']
      },
      {
        title: 'Paso 4: Pruebas de Usabilidad e Interacción',
        description: 'Valida la interacción de los componentes mediante pruebas de usuarios e integración de micro-animaciones.',
        skills: ['Micro-interactions', 'User Testing', 'Performance Audit']
      }
    ],
    faq: [
      {
        question: '¿Qué valor aporta un UX Engineer?',
        answer: 'Cierra la brecha entre los diseñadores y los desarrolladores frontend, traduciendo diseños complejos en componentes de código accesibles y reutilizables.'
      }
    ]
  },
  'especialista-devrel': {
    slug: 'especialista-devrel',
    title: 'Cómo convertirse en Developer Relations (DevRel)',
    description: 'Construye y dinamiza comunidades de desarrolladores, creando contenido técnico, muestras de código y dando voz a los desarrolladores dentro de la empresa.',
    techKey: 'fullstack',
    steps: [
      {
        title: 'Paso 1: Sólida Base de Programación',
        description: 'Debes ser capaz de programar aplicaciones de ejemplo, SDKs y entender las necesidades de los desarrolladores.',
        skills: ['JavaScript / Python', 'APIs', 'GitHub', 'SDK Development']
      },
      {
        title: 'Paso 2: Creación de Contenido Técnico de Calidad',
        description: 'Aprende a redactar tutoriales en blog, crear guías rápidas y grabar vídeos demostrativos.',
        skills: ['Technical Blogging', 'Video Tutorials', 'Documentación', 'Live Coding']
      },
      {
        title: 'Paso 3: Gestión de Comunidades y Eventos',
        description: 'Organiza meetups, participaciones en conferencias tech, hackathons y gestiona canales como Discord o Slack.',
        skills: ['Community Management', 'Public Speaking', 'Hackathons', 'Discord / Slack']
      },
      {
        title: 'Paso 4: Feedback Loop de Producto',
        description: 'Recoge las fricciones de la comunidad técnica y trasládadas al equipo interno de producto.',
        skills: ['Developer Advocacy', 'Product Feedback', 'Metrics (DevRel ROI)']
      }
    ],
    faq: [
      {
        question: '¿Hace falta viajar mucho en puestos de DevRel?',
        answer: 'Depende de la empresa, pero habitualmente incluye asistencia a conferencias tecnológicas internacionales y meetups locales.'
      }
    ]
  },
  'ingeniero-datos': {
    slug: 'ingeniero-datos',
    title: 'Cómo convertirse en Data Engineer',
    description: 'Diseña y construye las tuberías (pipelines) de ingesta, procesamiento y almacenamiento de datos masivos que alimentan a los científicos de datos y dashboards.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: Python, SQL Avanzado y Modelado de Datos',
        description: 'Domina las consultas complejas en SQL, estructuras de datos y optimización de índices.',
        skills: ['Python', 'SQL Avanzado', 'Modelado Dimensional', 'PostgreSQL']
      },
      {
        title: 'Paso 2: Procesamiento Masivo con Apache Spark',
        description: 'Aprende a procesar terabytes de datos de forma distribuida utilizando PySpark.',
        skills: ['Apache Spark', 'PySpark', 'Hadoop HDFS', 'Parquet / Delta Lake']
      },
      {
        title: 'Paso 3: Orquestación de Data Pipelines',
        description: 'Automatiza y programa el flujo de ejecución de tareas de datos con Apache Airflow o Prefect.',
        skills: ['Apache Airflow', 'dbt (data build tool)', 'Kafka', 'ETL / ELT']
      },
      {
        title: 'Paso 4: Almacenes de Datos Cloud (Data Warehouse)',
        description: 'Especialízate en arquitecturas de datos en la nube con Snowflake, BigQuery o AWS Redshift.',
        skills: ['Snowflake', 'Google BigQuery', 'AWS Redshift', 'Databricks']
      }
    ],
    faq: [
      {
        question: '¿Por qué hay tanta demanda de Data Engineers?',
        answer: 'Porque las empresas han descubierto que no pueden hacer Inteligencia Artificial ni analítica avanzada sin una infraestructura de datos limpia y fiable.'
      }
    ]
  },
  'arquitecto-software': {
    slug: 'arquitecto-software',
    title: 'Cómo convertirse en Arquitecto de Software',
    description: 'Diseña la estructura técnica, selecciona las tecnologías y define las directrices de código para sistemas complejos de alto rendimiento.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Sólida Trayectoria como Senior Developer',
        description: 'Debes acumular años de experiencia resolviendo problemas reales en proyectos backend o fullstack.',
        skills: ['Java / C# / Node', 'Design Patterns', 'Clean Architecture', 'Refactoring']
      },
      {
        title: 'Paso 2: Patrones de Arquitectura y Microservicios',
        description: 'Especialízate en arquitectura orientada a eventos (EDA), DDD, CQRS y sistemas distribuidos.',
        skills: ['Domain-Driven Design (DDD)', 'Microservicios', 'CQRS', 'Event Sourcing']
      },
      {
        title: 'Paso 3: Evaluación de Requisitos No Funcionales (NFRs)',
        description: 'Diseña garantizando escalabilidad, seguridad, mantenibilidad y rendimiento.',
        skills: ['Scalability', 'Security Standards', 'System Performance', 'ADRs (Architecture Decision Records)']
      },
      {
        title: 'Paso 4: Liderazgo Técnico y Gobernanza',
        description: 'Comunica decisiones de arquitectura de forma clara a los equipos y stakeholders.',
        skills: ['Technical Leadership', 'UML / C4 Model', 'Vendor Evaluation']
      }
    ],
    faq: [
      {
        question: '¿Un Arquitecto de Software sigue escribiendo código?',
        answer: 'En organizaciones modernas, los mejores arquitectos siguen programando un porcentaje de su tiempo (creando prototipos o pruebas de concepto) para no perder contacto con la realidad técnica.'
      }
    ]
  },
  'desarrollador-python': {
    slug: 'desarrollador-python',
    title: 'Cómo convertirse en Desarrollador Python',
    description: 'Especialízate en uno de los lenguajes más versátiles y demandados para backend, automatización e Inteligencia Artificial.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Sintaxis Estándar y Programación Orientada a Objetos',
        description: 'Domina los tipos de datos, generadores, decoradores y programación orientada a objetos en Python 3.',
        skills: ['Python 3', 'Decorators', 'Generators', 'OOP']
      },
      {
        title: 'Paso 2: Frameworks Web Backend (FastAPI y Django)',
        description: 'Crea APIs RESTful modernas con FastAPI y aplicaciones web completas con Django.',
        skills: ['FastAPI', 'Django', 'Pydantic', 'SQLAlchemy / Peewee']
      },
      {
        title: 'Paso 3: Bases de Datos y Pruebas Unitarias',
        description: 'Conecta con PostgreSQL y escribe tests automatizados utilizando Pytest.',
        skills: ['PostgreSQL', 'Pytest', 'Asyncio', 'Redis']
      },
      {
        title: 'Paso 4: Despliegue en Contenedores',
        description: 'Empaqueta tus aplicaciones en imágenes Docker ligeras y despliégalas en servicios cloud.',
        skills: ['Docker', 'Gunicorn / Uvicorn', 'AWS / Vercel', 'CI/CD']
      }
    ],
    faq: [
      {
        question: '¿Vale la pena aprender Python en 2026?',
        answer: 'Absolutamente. Python es el lenguaje reina en la era de la Inteligencia Artificial y la Ciencia de Datos, manteniendo además una gran cuota en el backend.'
      }
    ]
  },
  'desarrollador-java': {
    slug: 'desarrollador-java',
    title: 'Cómo convertirse en Desarrollador Java',
    description: 'Aprende el lenguaje líder del desarrollo empresarial y banca en España utilizando el poderoso ecosistema Spring Boot.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Fundamentos de Java SE y Orientación a Objetos',
        description: 'Domina las versiones modernas de Java (Java 17 / 21 LTS), colecciones, streams y lambdas.',
        skills: ['Java 17 / 21', 'Streams API', 'Lambdas', 'Maven / Gradle']
      },
      {
        title: 'Paso 2: Framework Spring Boot y JPA',
        description: 'Crea microservicios empresariales utilizando Spring Boot, Spring Data JPA y Hibernate.',
        skills: ['Spring Boot', 'Spring Data JPA', 'Hibernate', 'REST APIs']
      },
      {
        title: 'Paso 3: Seguridad y Microservicios',
        description: 'Protege las APIs con Spring Security / OAuth2 e integra colas de mensajes con Apache Kafka.',
        skills: ['Spring Security', 'OAuth2', 'Apache Kafka', 'JUnit 5 / Mockito']
      },
      {
        title: 'Paso 4: Despliegue Cloud Native y Contenedores',
        description: 'Empaqueta aplicaciones Java con Docker y despliega en clústeres Kubernetes.',
        skills: ['Docker', 'Kubernetes', 'Microservicios', 'Cloud Native Java']
      }
    ],
    faq: [
      {
        question: '¿Por qué hay tantas ofertas de Java en España?',
        answer: 'Porque las principales entidades bancarias, aseguradoras, administraciones públicas y grandes consultoras en España tienen su núcleo de negocio construido sobre Java.'
      }
    ]
  },
  'desarrollador-go': {
    slug: 'desarrollador-go',
    title: 'Cómo convertirse en Desarrollador Go (Golang)',
    description: 'Aprende el lenguaje creado por Google enfocado en la simplicidad, la concurrencia nativa y la creación de microservicios ultrarrápidos.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Sintaxis de Go y Concurrencia (Goroutines)',
        description: 'Entiende los punteros, estructuras, interfaces y el modelo de concurrencia basado en Goroutines y Channels.',
        skills: ['Go Syntax', 'Goroutines', 'Channels', 'Interfaces']
      },
      {
        title: 'Paso 2: Creación de APIs y Microservicios',
        description: 'Crea servicios HTTP rápidos utilizando la librería estándar o frameworks como Gin o Chi.',
        skills: ['Gin / Chi Framework', 'HTTP Standard Library', 'gRPC', 'Protobuf']
      },
      {
        title: 'Paso 3: Bases de Datos y Pruebas Unitarias',
        description: 'Conecta con PostgreSQL usando sqlx o GORM y aprovecha el ejecutor de tests nativo de Go.',
        skills: ['PostgreSQL', 'GORM / sqlx', 'Go Testing Package', 'Benchmark Testing']
      },
      {
        title: 'Paso 4: Herramientas CLI y DevOps',
        description: 'Crea herramientas de línea de comandos (CLI) binarias autónomas para infraestructura.',
        skills: ['Cobra CLI', 'Docker', 'Kubernetes Ecosystem', 'Binary Cross-Compilation']
      }
    ],
    faq: [
      {
        question: '¿Qué perfil de empresas contrata desarrolladores Go?',
        answer: 'Empresas de infraestructura en la nube, plataformas fintech de alto tráfico y proyectos Cloud Native.'
      }
    ]
  },
  'desarrollador-ios': {
    slug: 'desarrollador-ios',
    title: 'Cómo convertirse en Desarrollador iOS Nativo',
    description: 'Aprende a diseñar y construir aplicaciones nativas premium para iPhone, iPad y Mac utilizando Swift y SwiftUI.',
    techKey: 'mobile',
    steps: [
      {
        title: 'Paso 1: Lenguaje Swift y Xcode IDE',
        description: 'Domina la sintaxis moderna de Swift 5+, opcionales, protocolos y el entorno de desarrollo Xcode.',
        skills: ['Swift 5+', 'Xcode', 'Optionam Unwrapping', 'Protocols']
      },
      {
        title: 'Paso 2: Interfaz Declarativa con SwiftUI',
        description: 'Diseña interfaces adaptativas utilizando el marco declarativo oficial de Apple.',
        skills: ['SwiftUI', 'Combine Framework', 'State & Binding', 'Navigation']
      },
      {
        title: 'Paso 3: Conexión de Datos y Almacenamiento Local',
        description: 'Consume APIs RESTful con URLSession y guarda información persistente con SwiftData o CoreData.',
        skills: ['URLSession', 'SwiftData / CoreData', 'Async/Await', 'JSON Parsing']
      },
      {
        title: 'Paso 4: Publicación en Apple App Store',
        description: 'Gestiona certificados de desarrollador, prueba mediante TestFlight y envía la app a revisión.',
        skills: ['TestFlight', 'App Store Connect', 'Certificados iOS', 'Human Interface Guidelines']
      }
    ],
    faq: [
      {
        question: '¿Necesito un ordenador Mac para aprender iOS?',
        answer: 'Sí. Xcode solo funciona en sistemas macOS, por lo que es imprescindible disponer de un Mac (o Mac Mini) para compilar aplicaciones iOS.'
      }
    ]
  },
  'desarrollador-android': {
    slug: 'desarrollador-android',
    title: 'Cómo convertirse en Desarrollador Android Nativo',
    description: 'Aprende a programar aplicaciones nativas para el sistema operativo móvil más utilizado del mundo utilizando Kotlin y Jetpack Compose.',
    techKey: 'mobile',
    steps: [
      {
        title: 'Paso 1: Lenguaje Kotlin y Android Studio',
        description: 'Domina la sintaxis de Kotlin, las Corrutinas para asincronía y el entorno Android Studio.',
        skills: ['Kotlin', 'Android Studio', 'Coroutines', 'Flow']
      },
      {
        title: 'Paso 2: Interfaces Modernas con Jetpack Compose',
        description: 'Abandona los antiguos XML y diseña pantallas dinámicas utilizando el toolkit declarativo Jetpack Compose.',
        skills: ['Jetpack Compose', 'Material Design 3', 'State Management']
      },
      {
        title: 'Paso 3: Arquitectura MVVM y Room Database',
        description: 'Implementa la arquitectura recomendada por Google utilizando ViewModel, Retrofit y la base de datos Room.',
        skills: ['MVVM Architecture', 'Retrofit', 'Room DB', 'Hilt / Koin (DI)']
      },
      {
        title: 'Paso 4: Publicación en Google Play Store',
        description: 'Firma la aplicación y gestiónala a través de Google Play Console.',
        skills: ['Google Play Console', 'App Bundles (.aab)', 'Firebase Cloud Messaging']
      }
    ],
    faq: [
      {
        question: '¿Es preferible saber Java o Kotlin para Android?',
        answer: 'Kotlin es el lenguaje preferente absoluto declarado por Google desde 2019. Todo nuevo desarrollo nativo en Android se realiza en Kotlin.'
      }
    ]
  },
  'ingeniero-prompts': {
    slug: 'ingeniero-prompts',
    title: 'Cómo convertirse en Prompt Engineer & Especialista IA',
    description: 'Especialízate en optimizar las instrucciones para modelos masivos de lenguaje, diseñando flujos de trabajo eficientes y evaluando respuestas.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: Técnicas de Prompting Avanzado',
        description: 'Domina patrones como Few-Shot Prompting, Chain-of-Thought (CoT), Tree of Thoughts y ReAct.',
        skills: ['Chain-of-Thought', 'Few-Shot Learning', 'System Prompts', 'Instruction Tuning']
      },
      {
        title: 'Paso 2: Programación en Python e Integración de APIs',
        description: 'Integra llamadas a las APIs de OpenAI, Anthropic y Google Gemini en scripts de automatización.',
        skills: ['Python', 'OpenAI API', 'Anthropic Claude API', 'Google Gemini API']
      },
      {
        title: 'Paso 3: Evaluación y Benchmarking de LLMs',
        description: 'Diseña frameworks de evaluación para medir la precisión, latencia, coste y sesgo de las respuestas.',
        skills: ['LLM Evaluation', 'Promptfoo', 'Ragas', 'Guardrails AI']
      },
      {
        title: 'Paso 4: Seguridad y Mitigación de Prompt Injection',
        description: 'Protege las aplicaciones frente a ataques de inyección de instrucciones y fugas de contexto.',
        skills: ['Prompt Injection Defense', 'Jailbreak Mitigation', 'Output Sanitization']
      }
    ],
    faq: [
      {
        question: '¿El Prompt Engineering es una carrera sostenible a largo plazo?',
        answer: 'Evoluciona rápidamente hacia roles de IA Application Engineer donde la habilidad de redactar prompts se combina con la programación y la arquitectura RAG.'
      }
    ]
  },
  'dba-database-administrator': {
    slug: 'dba-database-administrator',
    title: 'Cómo convertirse en Administrador de Bases de Datos (DBA)',
    description: 'Garantiza el rendimiento, disponibilidad, copias de seguridad y seguridad de los motores de bases de datos empresariales.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: Motor SQL y Optimización de Consultas',
        description: 'Especialízate en PostgreSQL, MySQL o Oracle DB a nivel interno de motor.',
        skills: ['PostgreSQL / MySQL / Oracle', 'Optimización SQL', 'EXPLAIN ANALYZE', 'Índices B-Tree / GIN']
      },
      {
        title: 'Paso 2: Copias de Seguridad y Recuperación (DR)',
        description: 'Configura respaldos lógicos y físicos (PITR), estrategias de failover y replicación maestro-esclavo.',
        skills: ['WAL Archiving', 'Replicación Streaming', 'Failover', 'Backup & Restore']
      },
      {
        title: 'Paso 3: Escalabilidad y Sharding',
        description: 'Implementa esquemas de particionado de tablas, agrupamiento (clustering) y balanceo de lecturas.',
        skills: ['Table Partitioning', 'PgBouncer', 'Connection Pooling', 'Sharding']
      },
      {
        title: 'Paso 4: Bases de Datos Cloud y NoSQL',
        description: 'Gestiona servicios como AWS RDS, Aurora, DynamoDB o MongoDB Atlas.',
        skills: ['AWS RDS / Aurora', 'MongoDB Atlas', 'Monitoring (pg_stat_statements)']
      }
    ],
    faq: [
      {
        question: '¿Sigue existiendo la figura del DBA con las bases de datos en la nube?',
        answer: 'Sí. Aunque la nube gestiona el hardware, el diseño de esquemas, optimización de consultas complejas y control de costes sigue requiriendo DBA expertos.'
      }
    ]
  },
  'especialista-bi': {
    slug: 'especialista-bi',
    title: 'Cómo convertirse en Analista de Business Intelligence (BI)',
    description: 'Transforma datos brutos de negocio en paneles de control visuales e informes estratégicos para la toma de decisiones empresariales.',
    techKey: 'data',
    steps: [
      {
        title: 'Paso 1: SQL y Extracción de Datos',
        description: 'Domina las consultas SQL para extraer, agrupar y filtrar datos de múltiples tablas.',
        skills: ['SQL Consultas', 'JOINs / Subqueries', 'Window Functions', 'Agregaciones']
      },
      {
        title: 'Paso 2: Herramientas de Visualización (Power BI / Tableau)',
        description: 'Diseña cuadros de mando interactivos y modelos de datos en estrella o copo de nieve.',
        skills: ['Power BI (DAX)', 'Tableau', 'Star Schema', 'Data Modeling']
      },
      {
        title: 'Paso 3: Proceso de ETL y Modelado de Negocio',
        description: 'Limpia y transforma datos utilizando Power Query o herramientas de ETL.',
        skills: ['Power Query', 'ETL', 'KPIs de Negocio', 'Excel Avanzado']
      },
      {
        title: 'Paso 4: Storytelling de Datos y Presentación',
        description: 'Comunica los hallazgos de forma clara a directivos e interesados de negocio.',
        skills: ['Data Storytelling', 'Dashboard UX', 'Presentación Ejecutiva']
      }
    ],
    faq: [
      {
        question: '¿Es un buen perfil para reconvertirse desde ADE o Economía al sector IT?',
        answer: 'Es una de las mejores puertas de entrada al sector tecnológico para profesionales con visión de negocio y habilidades analíticas.'
      }
    ]
  },
  'auditor-seguridad': {
    slug: 'auditor-seguridad',
    title: 'Cómo convertirse en Auditor de Ciberseguridad & Pentester',
    description: 'Evalúa la postura de seguridad de las empresas mediante pruebas de penetración autorizadas e informes de auditoría normativos.',
    techKey: 'cybersecurity',
    steps: [
      {
        title: 'Paso 1: Fundamentos de Sistemas y Redes',
        description: 'Domina los conceptos de redes, arquitectura de aplicaciones web y sistemas operativos.',
        skills: ['Redes', 'Linux', 'Web Architecture', 'Kali Linux']
      },
      {
        title: 'Paso 2: Pentesting Web y Redes',
        description: 'Aprende a usar Burp Suite, Nmap, Metasploit y técnicas de escalada de privilegios.',
        skills: ['Burp Suite', 'Escalada de Privilegios', 'Nmap', 'SQLi / XSS']
      },
      {
        title: 'Paso 3: Redacción de Informes Técnicos y Ejecutivos',
        description: 'Traduce los hallazgos técnicos en planes de remediación priorizados por impacto.',
        skills: ['Informes de Auditoría', 'CVSS Scoring', 'Remediación de Riesgos']
      },
      {
        title: 'Paso 4: Certificación OSCP (Offensive Security Certified Professional)',
        description: 'Obtén la certificación práctica de pentesting más respetada de la industria.',
        skills: ['OSCP Cert', 'eJPT', 'TryHackMe / HackTheBox']
      }
    ],
    faq: [
      {
        question: '¿Qué diferencia hay entre Red Team y Auditoría?',
        answer: 'La auditoría busca encontrar todas las vulnerabilidades según una norma. El Red Team simula un ataque adversario real para poner a prueba la respuesta de la empresa.'
      }
    ]
  },
  'solution-architect': {
    slug: 'solution-architect',
    title: 'Cómo convertirse en Solutions Architect',
    description: 'Diseña la solución técnica integral para responder a las necesidades específicas de un cliente o proyecto, conectando requisitos de negocio con software.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Visión Técnica Transversal',
        description: 'Domina conceptos de frontend, backend, bases de datos y la nube.',
        skills: ['Cloud Services', 'APIs & Integration', 'Database Choice', 'Security']
      },
      {
        title: 'Paso 2: Análisis de Requisitos de Negocio',
        description: 'Traduce peticiones comerciales en especificaciones técnicas viables y estimación de costos.',
        skills: ['Requirements Analysis', 'Cost Estimation', 'PoC (Proof of Concept)']
      },
      {
        title: 'Paso 3: Presentación a Clientes y Venta Técnica',
        description: 'Realiza demostraciones técnicas, diagramas de arquitectura y propuestas de valor.',
        skills: ['Pre-sales Support', 'Architecture Diagrams', 'Stakeholder Management']
      },
      {
        title: 'Paso 4: Certificaciones Cloud Solutions Architect',
        description: 'Obtén certificaciones reconocidas de AWS, Azure o GCP.',
        skills: ['AWS Solutions Architect', 'Azure Architect', 'Enterprise Architecture']
      }
    ],
    faq: [
      {
        question: '¿Requiere dotes comerciales el puesto de Solutions Architect?',
        answer: 'Sí. A menudo trabaja codo con codo con el equipo de ventas para explicar la propuesta técnica a clientes y tomar decisiones estratégicas.'
      }
    ]
  },
  'desarrollador-embedded': {
    slug: 'desarrollador-embedded',
    title: 'Cómo convertirse en Ingeniero de Sistemas Embebidos e IoT',
    description: 'Programa microcontroladores y dispositivos físicos en lenguajes C y C++ para sistemas embebidos, automoción e Internet de las Cosas.',
    techKey: 'backend',
    steps: [
      {
        title: 'Paso 1: Programación en C y C++ de Bajo Nivel',
        description: 'Domina la gestión directa de memoria, punteros, registros y optimización de recursos limitados.',
        skills: ['C / C++', 'Punteros', 'Gestión de Memoria', 'Bitwise Operations']
      },
      {
        title: 'Paso 2: Arquitectura de Microcontroladores (ARM / ESP32)',
        description: 'Aprende a programar placas electrónicas utilizando arquitecturas ARM Cortex, ESP32 o STM32.',
        skills: ['ARM Cortex', 'ESP32', 'STM32', 'FreeRTOS']
      },
      {
        title: 'Paso 3: Protocolos de Comunicación y Hardware',
        description: 'Comunícate con sensores y actuadores mediante UART, SPI, I2C, CAN Bus y MQTT.',
        skills: ['UART / SPI / I2C', 'CAN Bus', 'MQTT', 'Osciloscopio / Lógica']
      },
      {
        title: 'Paso 4: Sistemas Operativos en Tiempo Real (RTOS)',
        description: 'Especialízate en la programación multitarea en sistemas de tiempo real crítico.',
        skills: ['RTOS', 'Embedded Linux', 'Firmware Updates (OTA)']
      }
    ],
    faq: [
      {
        question: '¿Qué sectores contratan ingenieros embebidos en España?',
        answer: 'Automoción, aeronáutica, energías renovables, IoT industrial, dispositivos médicos y robótica.'
      }
    ]
  },
  'agile-coach': {
    slug: 'agile-coach',
    title: 'Cómo convertirse en Agile Coach Enterprise',
    description: 'Guía la transformación ágil a nivel de toda la organización, formando a directivos, Product Managers y Scrum Masters.',
    techKey: 'fullstack',
    steps: [
      {
        title: 'Paso 1: Experiencia Avanzada como Scrum Master',
        description: 'Acumula años facilitando equipos de software antes de escalar a nivel organizacional.',
        skills: ['Scrum', 'Kanban', 'Facilitación', 'Mentoring']
      },
      {
        title: 'Paso 2: Marcos de Escalado Ágil (SAFe / LeSS / Spotify)',
        description: 'Aprende a coordinar decenas de equipos alineados hacia una misma visión de producto.',
        skills: ['SAFe (Scaled Agile)', 'LeSS', 'OKRs', 'Value Stream Mapping']
      },
      {
        title: 'Paso 3: Transformación Cultural y Liderazgo',
        description: 'Trabaja con la alta dirección en la gestión del cambio y la cultura organizacional.',
        skills: ['Change Management', 'Executive Coaching', 'Cultura Ágil']
      },
      {
        title: 'Paso 4: Certificaciones Enterprise Agile',
        description: 'Obtén certificaciones de prestigio como SPC (SAFe Program Consultant) o ICP-ACC.',
        skills: ['SAFe SPC', 'ICP-ACC', 'Org Design']
      }
    ],
    faq: [
      {
        question: '¿Qué diferencia hay entre Scrum Master y Agile Coach?',
        answer: 'El Scrum Master trabaja directamente con uno o dos equipos de desarrollo. El Agile Coach opera a nivel directivo y estratégico en toda la empresa.'
      }
    ]
  },
  'technical-writer': {
    slug: 'technical-writer',
    title: 'Cómo convertirse en Technical Writer / Redactor Técnico IT',
    description: 'Redacta documentación técnica clara, guías de APIs, manuales de usuario y portales para desarrolladores.',
    techKey: 'fullstack',
    steps: [
      {
        title: 'Paso 1: Habilidades de Redacción y Claridad',
        description: 'Aprende a estructurar conceptos complejos de forma sencilla y precisa en español e inglés.',
        skills: ['Redacción Técnica', 'Inglés C1/C2', 'Estructura de Documentos']
      },
      {
        title: 'Paso 2: Entendimiento Técnico (Docs as Code)',
        description: 'Aprende a usar Markdown, Git, GitHub y generadores de sitios estáticos como Docusaurus.',
        skills: ['Markdown', 'Git & GitHub', 'Docusaurus / MkDocs', 'OpenAPI / Swagger']
      },
      {
        title: 'Paso 3: Documentación de APIs REST y GraphQL',
        description: 'Prueba endpoints con Postman y redacta referencias completas de APIs para desarrolladores.',
        skills: ['Postman', 'OpenAPI Spec', 'API Documentation', 'JSON / YAML']
      },
      {
        title: 'Paso 4: UX Writing e Información para el Usuario',
        description: 'Diseña portales de ayuda y guías interactivas centradas en la experiencia del desarrollador.',
        skills: ['UX Writing', 'Developer Portals', 'Information Architecture']
      }
    ],
    faq: [
      {
        question: '¿Es una buena opción para perfiles de comunicación o traducción?',
        answer: 'Excelente. Los perfiles con gran capacidad lingüística que aprenden conceptos básicos de programación son altamente cotizados en empresas de software SaaS.'
      }
    ]
  },
  'system-administrator': {
    slug: 'system-administrator',
    title: 'Cómo convertirse en System Administrator (SysAdmin)',
    description: 'Gestiona y mantiene la infraestructura informática, servidores, redes y backups de la empresa.',
    techKey: 'cloud',
    steps: [
      {
        title: 'Paso 1: Sistemas Operativos Linux y Windows Server',
        description: 'Domina la administración de Linux (Ubuntu/RedHat) y Windows Server (Active Directory).',
        skills: ['Linux', 'Windows Server', 'Active Directory', 'Group Policies (GPO)']
      },
      {
        title: 'Paso 2: Redes, Virtualización y Backups',
        description: 'Configura entornos de virtualización con VMware / Hyper-V y gestiona la seguridad de red.',
        skills: ['VMware vSphere', 'Hyper-V', 'Veeam Backup', 'VLANs / Firewalls']
      },
      {
        title: 'Paso 3: Automatización con PowerShell y Bash',
        description: 'Automatiza tareas repetitorias de mantenimiento mediante scripts.',
        skills: ['PowerShell', 'Bash Scripting', 'Ansible', 'Patching']
      },
      {
        title: 'Paso 4: Híbrido Cloud (AWS / Azure Administration)',
        description: 'Conecta la infraestructura local con servicios en la nube.',
        skills: ['Azure AD / Entra ID', 'AWS CloudSysAdmin', 'Hybrid Cloud']
      }
    ],
    faq: [
      {
        question: '¿Qué evolución profesional tiene un SysAdmin?',
        answer: 'Un SysAdmin puede evolucionar naturalmente hacia puestos de DevOps Engineer, Cloud Engineer o Ciberseguridad.'
      }
    ]
  }
};

