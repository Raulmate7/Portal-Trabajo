export interface GlossaryTerm {
  term: string;
  slug: string;
  letter: string;
  definition: string;
  relevance: string;
  linkedJobsSlug?: string;
  linkedSalariesSlug?: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'API (Application Programming Interface)',
    slug: 'api',
    letter: 'A',
    definition: 'Una API es un conjunto de definiciones y protocolos que permite que dos aplicaciones de software se comuniquen entre sí de manera estandarizada.',
    relevance: 'Es un concepto básico fundamental en el desarrollo moderno. Casi el 95% de las ofertas backend solicitan experiencia consumiendo o diseñando APIs REST o GraphQL.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'Agile (Metodologías Ágiles)',
    slug: 'agile',
    letter: 'A',
    definition: 'Conjunto de marcos de trabajo y prácticas para el desarrollo de software basados en el desarrollo iterativo, la colaboración constante y la adaptación al cambio.',
    relevance: 'La mayoría de las empresas tecnológicas trabajan con filosofías ágiles. Se solicita habitualmente para roles de gestión y coordinación de equipos.',
    linkedJobsSlug: 'scrum-master',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'Angular',
    slug: 'angular',
    letter: 'A',
    definition: 'Framework de código abierto desarrollado por Google utilizado para crear aplicaciones web de una sola página (SPA) robustas y estructuradas.',
    relevance: 'Es una de las tres tecnologías frontend líderes en España, con una altísima presencia en el sector corporativo, consultoría y entidades financieras.',
    linkedJobsSlug: 'angular',
    linkedSalariesSlug: 'angular'
  },
  {
    term: 'AWS (Amazon Web Services)',
    slug: 'aws',
    letter: 'A',
    definition: 'Plataforma de servicios de computación en la nube pública líder en el mercado, desarrollada por Amazon.',
    relevance: 'AWS es la nube con mayor demanda en las ofertas de empleo españolas. Conocer sus servicios principales (EC2, S3, RDS, Lambda) es clave para ingenieros cloud y DevOps.',
    linkedJobsSlug: 'aws',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Azure (Microsoft Azure)',
    slug: 'azure',
    letter: 'A',
    definition: 'Plataforma de computación en la nube pública operada por Microsoft, enfocada en la gestión de servicios empresariales e híbridos.',
    relevance: 'Es el segundo proveedor cloud más solicitado, con gran penetración en administraciones públicas e integradoras multinacionales.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Backend',
    slug: 'backend',
    letter: 'B',
    definition: 'Capa de desarrollo de software encargada del procesamiento lógico, interacción con bases de datos, APIs, seguridad e infraestructura que el usuario no ve.',
    relevance: 'Los puestos backend representan más del 40% de las ofertas de empleo del sector. Java, Python y Node.js son los lenguajes principales.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'CI/CD (Integración y Entrega Continua)',
    slug: 'ci-cd',
    letter: 'C',
    definition: 'Práctica de DevOps que automatiza el proceso de compilar, probar e implementar cambios de código en entornos de producción con frecuencia y fiabilidad.',
    relevance: 'Es una competencia obligatoria para DevOps, y cada vez más solicitada a desarrolladores backend para garantizar la autonomía en el ciclo de vida del producto.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Cloud Computing (Computación en la Nube)',
    slug: 'cloud-computing',
    letter: 'C',
    definition: 'Entrega bajo demanda de potencia de cómputo, almacenamiento, bases de datos, aplicaciones y otros recursos de TI a través de Internet.',
    relevance: 'La migración hacia la nube ha redefinido el perfil de los administradores de sistemas y ha disparado la retribución de los Cloud Architects.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Ciberseguridad',
    slug: 'ciberseguridad',
    letter: 'C',
    definition: 'Práctica de proteger sistemas, redes y programas de ataques digitales y accesos no autorizados.',
    relevance: 'Es una de las especialidades con mayor proyección en 2026. Hay escasez de analistas de seguridad, auditores y especialistas en hacking ético.',
    linkedJobsSlug: 'cybersecurity',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'Docker',
    slug: 'docker',
    letter: 'D',
    definition: 'Docker es una plataforma de software de código abierto que permite automatizar la implementación de aplicaciones dentro de contenedores autónomos.',
    relevance: 'Se ha convertido en el estándar de facto de la industria. Saber empaquetar aplicaciones en contenedores Docker es una competencia básica requerida en backend.',
    linkedJobsSlug: 'docker',
    linkedSalariesSlug: 'docker'
  },
  {
    term: 'DevOps',
    slug: 'devops',
    letter: 'D',
    definition: 'Metodología y conjunto de prácticas que combinan el desarrollo de software (Dev) y las operaciones de TI (Ops) para acelerar el ciclo de entrega.',
    relevance: 'Los ingenieros DevOps disfrutan de algunas de las bandas salariales más elevadas debido a la complejidad de las herramientas de infraestructura automatizada.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Frontend',
    slug: 'frontend',
    letter: 'F',
    definition: 'La parte de una aplicación o web que interactúa directamente con los usuarios, abarcando el diseño visual, interfaz y rendimiento en el navegador.',
    relevance: 'Es un área en constante evolución, con una altísima demanda de profesionales con dominio de JavaScript, TypeScript y React.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Fullstack',
    slug: 'fullstack',
    letter: 'F',
    definition: 'Desarrollador con competencias transversales capaz de trabajar tanto en la capa cliente (Frontend) como en la capa servidor (Backend).',
    relevance: 'Muy demandados por startups y empresas ágiles que necesitan perfiles polivalentes capaces de sacar funcionalidades completas al mercado.',
    linkedJobsSlug: 'fullstack',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Flutter',
    slug: 'flutter',
    letter: 'F',
    definition: 'SDK de código abierto desarrollado por Google que permite construir aplicaciones compiladas nativamente para móvil, web y escritorio desde una base de código única.',
    relevance: 'Es uno de los frameworks multiplataforma más populares para el desarrollo móvil en España, ideal para startups que buscan optimizar costes.',
    linkedJobsSlug: 'flutter',
    linkedSalariesSlug: 'flutter'
  },
  {
    term: 'Git',
    slug: 'git',
    letter: 'G',
    definition: 'Git es un sistema de control de versiones distribuido que registra los cambios en los archivos y coordina el trabajo conjunto en un proyecto.',
    relevance: 'Imprescindible para el 100% de los desarrolladores profesionales. Cualquier proceso de entrevista técnica dará por sentado el dominio de flujos Git (como GitFlow).',
    linkedJobsSlug: 'informatica-tecnologia',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Go (Golang)',
    slug: 'go',
    letter: 'G',
    definition: 'Lenguaje de programación de código abierto diseñado por Google enfocado en la simplicidad, concurrencia y alto rendimiento de ejecución.',
    relevance: 'Muy cotizado para la creación de microservicios de alto tráfico y herramientas Cloud Native. Sueldos senior superiores a la media del sector backend.',
    linkedJobsSlug: 'go',
    linkedSalariesSlug: 'go'
  },
  {
    term: 'Java',
    slug: 'java',
    letter: 'J',
    definition: 'Lenguaje de programación orientado a objetos clásico y multiplataforma, base de millones de sistemas empresariales mundiales.',
    relevance: 'Líder absoluto en volumen de ofertas corporativas en España. Garantía de empleabilidad a largo plazo, sobre todo dominando el framework Spring Boot.',
    linkedJobsSlug: 'java',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'JavaScript',
    slug: 'javascript',
    letter: 'J',
    definition: 'Lenguaje de programación interpretado que permite añadir interactividad dinámica y complejidad a las páginas web.',
    relevance: 'El lenguaje que hace funcionar la web. Prácticamente obligatorio para cualquier rol que involucre el navegador.',
    linkedJobsSlug: 'javascript',
    linkedSalariesSlug: 'javascript'
  },
  {
    term: 'Kubernetes (K8s)',
    slug: 'kubernetes',
    letter: 'K',
    definition: 'Plataforma de código abierto para automatizar la implementación, escalado y administración de aplicaciones en contenedores.',
    relevance: 'Es el estándar para orquestar contenedores a gran escala en producción. Altamente cotizado y con excelentes retribuciones.',
    linkedJobsSlug: 'kubernetes',
    linkedSalariesSlug: 'docker'
  },
  {
    term: 'Kotlin',
    slug: 'kotlin',
    letter: 'K',
    definition: 'Lenguaje de programación moderno y tipado desarrollado por JetBrains, declarado de soporte oficial preferente para Android por Google.',
    relevance: 'Estándar obligatorio para desarrolladores nativos en el ecosistema Android.',
    linkedJobsSlug: 'kotlin',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'Machine Learning (Aprendizaje Automático)',
    slug: 'machine-learning',
    letter: 'M',
    definition: 'Subcampo de la Inteligencia Artificial que permite a los ordenadores aprender y predecir resultados a partir de datos históricos sin programación explícita.',
    relevance: 'Sector con crecimiento masivo. Las empresas buscan científicos de datos y especialistas en IA con dominio de Python y sus librerías.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Microservicios',
    slug: 'microservicios',
    letter: 'M',
    definition: 'Enfoque de arquitectura de software en el que una aplicación se compone de pequeños servicios independientes que se comunican mediante protocolos ligeros.',
    relevance: 'Patrón de diseño por defecto en sistemas distribuidos modernos. Se valora altamente en puestos Mid y Senior.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'NoSQL',
    slug: 'nosql',
    letter: 'N',
    definition: 'Clasificación amplia de bases de datos que no utilizan el esquema relacional de tablas clásicas SQL, diseñadas para datos no estructurados y gran escalabilidad.',
    relevance: 'MongoDB, Redis o DynamoDB son demandadas frecuentemente como complemento a bases de datos relacionales en arquitecturas web.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'Node.js',
    slug: 'node-js',
    letter: 'N',
    definition: 'Entorno de ejecución para JavaScript en el lado del servidor construido sobre el motor V8 de Google Chrome.',
    relevance: 'Permite crear APIs rápidas e implementar JS en todo el stack técnico. Muy utilizado por startups y empresas tecnológicas ágiles.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'Python',
    slug: 'python',
    letter: 'P',
    definition: 'Lenguaje de programación interpretado de propósito general y sintaxis extremadamente limpia y legible.',
    relevance: 'Es el lenguaje líder para Inteligencia Artificial, Ciencia de Datos y automatizaciones, y cuenta con un sólido ecosistema backend (Django, FastAPI).',
    linkedJobsSlug: 'python',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'QA (Quality Assurance) / Testing',
    slug: 'qa-testing',
    letter: 'Q',
    definition: 'Capa de la ingeniería de software enfocada en asegurar y validar la calidad del código, buscando fallos antes del despliegue en producción.',
    relevance: 'Roles muy demandados con especialización hacia el testing automatizado (usando frameworks como Cypress, Playwright o Selenium).',
    linkedJobsSlug: 'qa-engineer',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'React',
    slug: 'react',
    letter: 'R',
    definition: 'Biblioteca JavaScript de código abierto desarrollada por Facebook para construir interfaces de usuario de forma declarativa e interactiva basada en componentes.',
    relevance: 'La tecnología frontend más demandada del mercado en España con diferencia. Gran volumen de ofertas disponibles.',
    linkedJobsSlug: 'react',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Rust',
    slug: 'rust',
    letter: 'R',
    definition: 'Lenguaje de programación de sistemas enfocado en la seguridad, velocidad y gestión de memoria eficiente sin recolector de basura.',
    relevance: 'Especialmente valorado para infraestructuras críticas, criptografía y desarrollo de bajo nivel. Horquillas salariales elevadas por su nicho de mercado.',
    linkedJobsSlug: 'rust',
    linkedSalariesSlug: 'go'
  },
  {
    term: 'SQL (Structured Query Language)',
    slug: 'sql',
    letter: 'S',
    definition: 'Lenguaje estándar utilizado para interactuar con bases de datos relacionales (consultar, insertar, actualizar y borrar registros).',
    relevance: 'Competencia universal obligatoria para cualquier puesto de desarrollo, administración de sistemas o análisis de datos.',
    linkedJobsSlug: 'sql',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'TypeScript',
    slug: 'typescript',
    letter: 'T',
    definition: 'Superconjunto tipado de JavaScript desarrollado por Microsoft que añade tipado estático opcional y clases al lenguaje web estándar.',
    relevance: 'Se ha convertido en el estándar absoluto para proyectos medianos y grandes de JavaScript en el frontend y backend para prevenir errores en producción.',
    linkedJobsSlug: 'typescript',
    linkedSalariesSlug: 'typescript'
  }
];
