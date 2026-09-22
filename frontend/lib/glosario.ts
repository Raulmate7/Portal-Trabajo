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
  // A
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
    term: 'Ansible',
    slug: 'ansible',
    letter: 'A',
    definition: 'Herramienta de automatización de TI y gestión de configuraciones de código abierto que permite aprovisionar y desplegar servidores mediante código declarativo YAML.',
    relevance: 'Muy solicitado en ofertas de DevOps y SysAdmin para la automatización de la infraestructura y mantenimiento de servidores a gran escala.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Apache Kafka',
    slug: 'apache-kafka',
    letter: 'A',
    definition: 'Plataforma distribuida de transmisión de eventos de alto rendimiento diseñada para manejar flujos de datos en tiempo real con baja latencia.',
    relevance: 'Fundamental en arquitecturas basadas en eventos (EDA), Big Data y microservicios de grandes empresas tecnológicas y sector fintech.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'Architect (Arquitecto de Software)',
    slug: 'architect',
    letter: 'A',
    definition: 'Perfil técnico senior responsable de tomar las decisiones estructurales y técnicas de alto nivel de un sistema informático.',
    relevance: 'Uno de los perfiles con las bandas salariales más elevadas del sector IT en España.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  // B
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
    term: 'Big Data',
    slug: 'big-data',
    letter: 'B',
    definition: 'Conjunto de datos masivos que superan la capacidad del software convencional para ser procesados, almacenados y analizados de forma tradicional.',
    relevance: 'Alta demanda de Data Engineers y Data Scientists especializados en Spark, Hadoop y almacenes de datos cloud.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Bootstrap',
    slug: 'bootstrap',
    letter: 'B',
    definition: 'Framework CSS de código abierto enfocado en el diseño de interfaces web adaptativas (responsive) mediante rejillas y componentes predefinidos.',
    relevance: 'Un clásico en proyectos web tradicionales, admin dashboards y aplicaciones corporativas.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Babel',
    slug: 'babel',
    letter: 'B',
    definition: 'Transpilador de JavaScript de código abierto que convierte código de versiones modernas de ECMAScript en versiones retrocompatibles.',
    relevance: 'Herramienta esencial en la cadena de construcción (build pipeline) del desarrollo frontend moderno.',
    linkedJobsSlug: 'javascript',
    linkedSalariesSlug: 'javascript'
  },
  {
    term: 'Blockchain',
    slug: 'blockchain',
    letter: 'B',
    definition: 'Tecnología de registro distribuido e inmutable de datos estructurada en bloques enlazados criptográficamente.',
    relevance: 'Demanda de desarrolladores Smart Contracts (Solidity, Rust) en sectores Web3, DeFi y finanzas descentralizadas.',
    linkedJobsSlug: 'rust',
    linkedSalariesSlug: 'go'
  },
  // C
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
    term: 'C# / .NET',
    slug: 'csharp-dotnet',
    letter: 'C',
    definition: 'Lenguaje de programación orientado a objetos de Microsoft y framework de ejecución para construir aplicaciones web, móviles y de escritorio.',
    relevance: 'Sólida demanda en grandes empresas y consultoras en España, compitiendo directamente con Java.',
    linkedJobsSlug: 'csharp',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'CSS3',
    slug: 'css3',
    letter: 'C',
    definition: 'Lenguaje de hojas de estilo utilizado para describir la presentación y el diseño visual de un documento escrito en HTML.',
    relevance: 'Base fundamental e imprescindible para todo desarrollador frontend.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Containerization (Contenedorización)',
    slug: 'containerization',
    letter: 'C',
    definition: 'Método de virtualización a nivel de sistema operativo para desplegar y ejecutar aplicaciones sin necesidad de lanzar una máquina virtual completa.',
    relevance: 'Pilar fundamental del desarrollo web cloud-native y prácticas de CI/CD.',
    linkedJobsSlug: 'docker',
    linkedSalariesSlug: 'docker'
  },
  {
    term: 'Cypress',
    slug: 'cypress',
    letter: 'C',
    definition: 'Framework de pruebas automatizadas de extremo a extremo (E2E) basado en JavaScript para aplicaciones web modernas.',
    relevance: 'Una de las herramientas de automatización de pruebas más populares entre ingenieros QA y desarrolladores frontend.',
    linkedJobsSlug: 'qa-engineer',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'CRM (Customer Relationship Management)',
    slug: 'crm',
    letter: 'C',
    definition: 'Sistema de software utilizado por las empresas para gestionar las interacciones con clientes, ventas y soporte comercial.',
    relevance: 'Perfiles especializados en plataformas como Salesforce o HubSpot tienen elevada empleabilidad.',
    linkedJobsSlug: 'salesforce',
    linkedSalariesSlug: 'java'
  },
  // D
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
    term: 'Data Science (Ciencia de Datos)',
    slug: 'data-science',
    letter: 'D',
    definition: 'Disciplina interdisciplinaria que combina estadísticas, algoritmos y métodos científicos para extraer conocimiento a partir de datos estructurados y no estructurados.',
    relevance: 'Alta demanda en empresas de e-commerce, banca y logística para análisis predictivo.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Django',
    slug: 'django',
    letter: 'D',
    definition: 'Framework web de alto nivel en Python que fomenta un desarrollo rápido y un diseño limpio y pragmático.',
    relevance: 'Opción popular en backend para proyectos que requieren panel de administración nativo y seguridad integrada.',
    linkedJobsSlug: 'python',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Domain-Driven Design (DDD)',
    slug: 'ddd',
    letter: 'D',
    definition: 'Enfoque de diseño de software centrado en modelar el sistema basándose en el dominio del negocio y su vocabulario complejo.',
    relevance: 'Muy apreciado en roles Senior y Staff Engineer para evitar monolitos incontrolables.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'DevSecOps',
    slug: 'devsecops',
    letter: 'D',
    definition: 'Evolución de DevOps que integra la seguridad informática como una responsabilidad compartida continua a lo largo de todo el ciclo de desarrollo.',
    relevance: 'Especialidad en auge para proteger los pipelines de despliegue automático.',
    linkedJobsSlug: 'cybersecurity',
    linkedSalariesSlug: 'aws'
  },
  // E
  {
    term: 'Elasticsearch',
    slug: 'elasticsearch',
    letter: 'E',
    definition: 'Motor de búsqueda y analítica distribuido de código abierto basado en Lucene, optimizado para búsquedas de texto completo y análisis de logs.',
    relevance: 'Muy requerido en arquitecturas de gran volumen de datos, e-commerce y observabilidad de sistemas (stack ELK).',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'Express.js',
    slug: 'express-js',
    letter: 'E',
    definition: 'Framework web mínimo y flexible para Node.js que proporciona un conjunto sólido de características para aplicaciones web y móviles.',
    relevance: 'El framework de servidor más clásico del entorno Node.js.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'Event-Driven Architecture (EDA)',
    slug: 'event-driven-architecture',
    letter: 'E',
    definition: 'Patrón de arquitectura de software centrado en la producción, detección, consumo y reacción ante eventos de negocio.',
    relevance: 'Esencial para sistemas altamente escalables y desacoplados.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'ETL (Extract, Transform, Load)',
    slug: 'etl',
    letter: 'E',
    definition: 'Proceso de extracción de datos de distintas fuentes, su transformación para limpieza o formato, y su carga en un almacén de datos (Data Warehouse).',
    relevance: 'Habilidad básica indispensable para ingenieros de datos y analistas BI.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'sql'
  },
  // F
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
    term: 'FastAPI',
    slug: 'fastapi',
    letter: 'F',
    definition: 'Framework web moderno y de alto rendimiento en Python para construir APIs basado en el tipado de datos estándar de Python 3.8+ y Pydantic.',
    relevance: 'Elección preferida para nuevos desarrollos de backend con Python e integración de modelos de IA.',
    linkedJobsSlug: 'python',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Firebase',
    slug: 'firebase',
    letter: 'F',
    definition: 'Plataforma de desarrollo de aplicaciones móviles y web respaldada por Google que ofrece backend como servicio (BaaS).',
    relevance: 'Muy usada para prototipado rápido y aplicaciones móviles.',
    linkedJobsSlug: 'mobile',
    linkedSalariesSlug: 'flutter'
  },
  // G
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
    term: 'GraphQL',
    slug: 'graphql',
    letter: 'G',
    definition: 'Lenguaje de consultas y entorno de ejecución del lado del servidor para APIs que permite a los clientes solicitar exactamente los datos que necesitan.',
    relevance: 'Alternativa o complemento a REST API en arquitecturas cliente-servidor complejas.',
    linkedJobsSlug: 'react',
    linkedSalariesSlug: 'typescript'
  },
  {
    term: 'GCP (Google Cloud Platform)',
    slug: 'gcp',
    letter: 'G',
    definition: 'Suite de servicios de computación en la nube ofrecida por Google que opera sobre la misma infraestructura interna de la compañía.',
    relevance: 'Tercer proveedor en la nube con fuerte tracción en proyectos de datos e Inteligencia Artificial.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },
  // H
  {
    term: 'HTML5',
    slug: 'html5',
    letter: 'H',
    definition: 'Quinta revisión del lenguaje estándar de marcado para la estructuración y presentación de contenidos en la World Wide Web.',
    relevance: 'Bloque de construcción fundamental de cualquier sitio o aplicación web.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'javascript'
  },
  {
    term: 'Helm',
    slug: 'helm',
    letter: 'H',
    definition: 'Gestor de paquetes para Kubernetes que simplifica la definición, instalación y actualización de aplicaciones complejas mediante plantillas.',
    relevance: 'Muy cotizado en ofertas para perfiles DevOps e ingenieros de plataforma.',
    linkedJobsSlug: 'kubernetes',
    linkedSalariesSlug: 'docker'
  },
  // I
  {
    term: 'IaC (Infrastructure as Code)',
    slug: 'iac',
    letter: 'I',
    definition: 'Práctica de gestionar y aprovisionar la infraestructura informática mediante archivos de configuración legibles en lugar de configuraciones manuales.',
    relevance: 'Especialidad clave en DevOps con herramientas líderes como Terraform o CloudFormation.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'IoT (Internet de las Cosas)',
    slug: 'iot',
    letter: 'I',
    definition: 'Red de objetos físicos equipados con sensores, software y otras tecnologías para conectar e intercambiar datos con otros dispositivos.',
    relevance: 'Demanda especializada en ingeniería de firmware, C/C++ y protocolos como MQTT.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  // J
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
    term: 'Jenkins',
    slug: 'jenkins',
    letter: 'J',
    definition: 'Servidor de automatización de código abierto que ayuda a automatizar partes del proceso de desarrollo de software relacionadas con la compilación e integración.',
    relevance: 'Una de las herramientas pioneras de CI/CD con amplia implantación en el ámbito empresarial.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'JWT (JSON Web Token)',
    slug: 'jwt',
    letter: 'J',
    definition: 'Estándar abierto para la creación de tokens de acceso que permiten la transmisión segura de información en formato JSON entre partes.',
    relevance: 'Estándar dominante para la autenticación sin estado en servicios web y APIs REST.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  // K
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
  // L
  {
    term: 'Laravel',
    slug: 'laravel',
    letter: 'L',
    definition: 'Framework de código abierto para PHP con sintaxis elegante y expresiva enfocado en simplificar tareas comunes en el desarrollo web.',
    relevance: 'El framework de PHP más demandado para desarrollo web a medida.',
    linkedJobsSlug: 'php',
    linkedSalariesSlug: 'php'
  },
  {
    term: 'Linux',
    slug: 'linux',
    letter: 'L',
    definition: 'Familia de sistemas operativos de código abierto basados en Unix que impulsan la inmensa mayoría de servidores web y entornos de producción.',
    relevance: 'Requisito fundamental para profesionales de sistemas, desarrollo backend y DevOps.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'LLM (Large Language Model)',
    slug: 'llm',
    letter: 'L',
    definition: 'Modelo de aprendizaje profundo entrenado sobre volúmenes masivos de texto capaz de comprender y generar lenguaje humano.',
    relevance: 'Revolucionando la industria del software. Alta demanda de ingenieros de IA capaces de integrar LLMs vía API o RAG.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  // M
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
    term: 'MongoDB',
    slug: 'mongodb',
    letter: 'M',
    definition: 'Base de datos NoSQL orientada a documentos que almacena datos en estructuras BSON flexibles y escalables.',
    relevance: 'Una de las bases de datos no relacionales más extendidas en el desarrollo con Node.js.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'MLOps (Machine Learning Operations)',
    slug: 'mlops',
    letter: 'M',
    definition: 'Práctica que aplica los principios de DevOps a la construcción, despliegue y mantenimiento continuo de modelos de Machine Learning.',
    relevance: 'Perfil híbrido muy cotizado para llevar proyectos de Inteligencia Artificial a entornos de producción reales.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  // N
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
    term: 'Next.js',
    slug: 'next-js',
    letter: 'N',
    definition: 'Framework de React creado por Vercel que permite el renderizado en servidor (SSR), generación de sitios estáticos (SSG) y optimización SEO nativa.',
    relevance: 'El estándar de la industria para construir aplicaciones web profesionales con React optimizadas para buscadores.',
    linkedJobsSlug: 'react',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Nginx',
    slug: 'nginx',
    letter: 'N',
    definition: 'Servidor web, proxy inverso y balanceador de carga HTTP ligero y de alto rendimiento.',
    relevance: 'Ampliamente utilizado para servir aplicaciones frontend y gestionar el tráfico entrante en arquitecturas web.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  // O
  {
    term: 'OAuth 2.0',
    slug: 'oauth-20',
    letter: 'O',
    definition: 'Protocolo marco de autorización que permite a aplicaciones de terceros obtener acceso limitado a cuentas de usuarios en servicios HTTP.',
    relevance: 'Estándar para implementar inicio de sesión social (Google, GitHub) y seguridad en APIs.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'OpenTelemetry',
    slug: 'opentelemetry',
    letter: 'O',
    definition: 'Marco de trabajo de observabilidad estándar de la CNCF para la generación, recopilación y exportación de datos de telemetría (métricas, trazas y logs).',
    relevance: 'Cada vez más solicitado en la monitorización de sistemas distribuidos y microservicios.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  // P
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
    term: 'PHP',
    slug: 'php',
    letter: 'P',
    definition: 'Lenguaje de código abierto para desarrollo web del lado del servidor ampliamente extendido en Internet.',
    relevance: 'Presente en más del 70% de las webs actuales gracias a WordPress y frameworks modernos como Laravel o Symfony.',
    linkedJobsSlug: 'php',
    linkedSalariesSlug: 'php'
  },
  {
    term: 'PostgreSQL',
    slug: 'postgresql',
    letter: 'P',
    definition: 'Sistema de gestión de bases de datos relacional de código abierto avanzado y potente orientado a objetos.',
    relevance: 'La base de datos relacional favorita del desarrollo de software moderno por su solidez y riqueza de tipos de datos.',
    linkedJobsSlug: 'sql',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'Playwright',
    slug: 'playwright',
    letter: 'P',
    definition: 'Biblioteca de pruebas Node.js creada por Microsoft para automatizar navegadores Chromium, Firefox y WebKit con una sola API.',
    relevance: 'Evolución líder en el testing automatizado End-to-End.',
    linkedJobsSlug: 'qa-engineer',
    linkedSalariesSlug: 'typescript'
  },
  // Q
  {
    term: 'QA (Quality Assurance) / Testing',
    slug: 'qa-testing',
    letter: 'Q',
    definition: 'Capa de la ingeniería de software enfocada en asegurar y validar la calidad del código, buscando fallos antes del despliegue en producción.',
    relevance: 'Roles muy demandados con especialización hacia el testing automatizado (usando frameworks como Cypress, Playwright o Selenium).',
    linkedJobsSlug: 'qa-engineer',
    linkedSalariesSlug: 'react'
  },
  // R
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
    term: 'React Native',
    slug: 'react-native',
    letter: 'R',
    definition: 'Framework desarrollado por Meta para crear aplicaciones móviles nativas para iOS y Android utilizando React y JavaScript.',
    relevance: 'Una de las tecnologías líderes para desarrollo de aplicaciones móviles multiplataforma.',
    linkedJobsSlug: 'react',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Redis',
    slug: 'redis',
    letter: 'R',
    definition: 'Almacén de estructura de datos en memoria de código abierto utilizado como base de datos, caché y intermediario de mensajes.',
    relevance: 'Imprescindible para acelerar el rendimiento de consultas y gestionar sesiones de usuario.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'REST API',
    slug: 'rest-api',
    letter: 'R',
    definition: 'Estilo de arquitectura de software para diseñar servicios web basados en las normas y métodos del protocolo HTTP.',
    relevance: 'El estándar de comunicación entre cliente y servidor más utilizado en el mundo.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
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
  // S
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
    term: 'Spring Boot',
    slug: 'spring-boot',
    letter: 'S',
    definition: 'Framework basado en Java que simplifica el proceso de creación y despliegue de aplicaciones y microservicios listos para producción.',
    relevance: 'Dominador indiscutible del sector empresarial bancario y corporativo en España.',
    linkedJobsSlug: 'java',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'Scrum',
    slug: 'scrum',
    letter: 'S',
    definition: 'Marco de trabajo ágil iterativo para la gestión de proyectos de desarrollo de software dividido en ciclos temporales denominados sprints.',
    relevance: 'El marco ágil más implantado a nivel organizativo.',
    linkedJobsSlug: 'scrum-master',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'SRE (Site Reliability Engineering)',
    slug: 'sre',
    letter: 'S',
    definition: 'Disciplina que aplica aspectos de la ingeniería de software a problemas de infraestructura y operaciones de sistemas a gran escala.',
    relevance: 'Uno de los perfiles mejor pagados del ámbito técnico y cloud.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Swift',
    slug: 'swift',
    letter: 'S',
    definition: 'Lenguaje de programación potente e intuitivo creado por Apple para desarrollar aplicaciones para iOS, macOS, watchOS y tvOS.',
    relevance: 'Requisito imprescindible para desarrolladores móviles nativos de Apple.',
    linkedJobsSlug: 'mobile',
    linkedSalariesSlug: 'flutter'
  },
  {
    term: 'System Design (Diseño de Sistemas)',
    slug: 'system-design',
    letter: 'S',
    definition: 'Proceso de definición de la arquitectura, módulos, interfaces y datos de un sistema para satisfacer requisitos especificados.',
    relevance: 'Filtro crítico en entrevistas técnicas para puestos de nivel Senior y Staff.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  // T
  {
    term: 'TypeScript',
    slug: 'typescript',
    letter: 'T',
    definition: 'Superconjunto tipado de JavaScript desarrollado por Microsoft que añade tipado estático opcional y clases al lenguaje web estándar.',
    relevance: 'Se ha convertido en el estándar absoluto para proyectos medianos y grandes de JavaScript en el frontend y backend para prevenir errores en producción.',
    linkedJobsSlug: 'typescript',
    linkedSalariesSlug: 'typescript'
  },
  {
    term: 'Tailwind CSS',
    slug: 'tailwind-css',
    letter: 'T',
    definition: 'Framework CSS de utilidades de primera mano para crear rápidamente interfaces personalizadas directamente en el marcado HTML/JSX.',
    relevance: 'El framework CSS de mayor adopción en el ecosistema React y Next.js.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Terraform',
    slug: 'terraform',
    letter: 'T',
    definition: 'Herramienta de código abierto de infraestructura como código (IaC) creada por HashiCorp para definir y aprovisionar recursos cloud mediante lenguaje HCL.',
    relevance: 'El estándar de la industria para aprovisionamiento multi-cloud.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'TDD (Test-Driven Development)',
    slug: 'tdd',
    letter: 'T',
    definition: 'Práctica de desarrollo de software donde se escriben primero las pruebas unitarias que fallan y posteriormente el código necesario para hacerlas pasar.',
    relevance: 'Práctica muy valorada para asegurar la calidad y mantenibilidad del software.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  // U
  {
    term: 'UI / UX Design',
    slug: 'ui-ux-design',
    letter: 'U',
    definition: 'Diseño de Interfaz de Usuario (UI) y Experiencia de Usuario (UX) enfocados en crear productos digitales funcionales, atractivos e intuitivos.',
    relevance: 'Perfiles clave para colaborar de cerca con el equipo de frontend en la creación de productos digitales.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  // V
  {
    term: 'Vue.js',
    slug: 'vue-js',
    letter: 'V',
    definition: 'Framework progresivo de JavaScript de código abierto para crear interfaces de usuario y aplicaciones de una sola página.',
    relevance: 'Una de las tres librerías frontend más extendidas por su suave curva de aprendizaje.',
    linkedJobsSlug: 'vue',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Vite',
    slug: 'vite',
    letter: 'V',
    definition: 'Herramienta de compilación frontend rápida de nueva generación que revoluciona la experiencia de desarrollo web.',
    relevance: 'Reemplazo moderno de Webpack para empaquetado de proyectos web.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  // W
  {
    term: 'WebAssembly (Wasm)',
    slug: 'webassembly',
    letter: 'W',
    definition: 'Formato de código binario portable y de bajo nivel para ejecutar código compilado (C++, Rust, Go) en el navegador a velocidad casi nativa.',
    relevance: 'Permite llevar aplicaciones de alto rendimiento gráfico o computacional a la web.',
    linkedJobsSlug: 'rust',
    linkedSalariesSlug: 'go'
  },
  {
    term: 'WebSockets',
    slug: 'websockets',
    letter: 'W',
    definition: 'Protocolo de red que proporciona canales de comunicación bidireccionales y a tiempo real sobre una sola conexión TCP.',
    relevance: 'Imprescindible para chats, juegos multijugador, dashboards financieros y notificaciones push.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'Webpack',
    slug: 'webpack',
    letter: 'W',
    definition: 'Empaquetador de módulos de código abierto para aplicaciones JavaScript modernas.',
    relevance: 'Herramienta clásica en la compilación y optimización de proyectos frontend.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'javascript'
  },
  // X
  {
    term: 'Xcode',
    slug: 'xcode',
    letter: 'X',
    definition: 'Entorno de desarrollo integrado (IDE) oficial de Apple utilizado para crear software para macOS, iOS, watchOS y tvOS.',
    relevance: 'Herramienta obligatoria para compilar aplicaciones iOS.',
    linkedJobsSlug: 'mobile',
    linkedSalariesSlug: 'flutter'
  },
  // Y
  {
    term: 'YAML',
    slug: 'yaml',
    letter: 'Y',
    definition: 'Formato de serialización de datos legible por humanos utilizado frecuentemente para archivos de configuración en Kubernetes, Docker Compose y CI/CD.',
    relevance: 'Formato omnipresente en el mundo de la infraestructura y DevOps.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  // Z
  {
    term: 'Zero Trust (Confianza Cero)',
    slug: 'zero-trust',
    letter: 'Z',
    definition: 'Modelo de seguridad de red que exige una verificación estricta de la identidad para cada persona y dispositivo que intente acceder a recursos.',
    relevance: 'Arquitectura de seguridad moderna adoptada masivamente tras el aumento del trabajo remoto.',
    linkedJobsSlug: 'cybersecurity',
    linkedSalariesSlug: 'sql'
  },
  // IA & Generative AI
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    slug: 'rag-retrieval-augmented-generation',
    letter: 'R',
    definition: 'Técnica de Inteligencia Artificial que combina la búsqueda de datos relevantes en una base de conocimientos externa con modelos de lenguaje (LLM) para generar respuestas precisas y actualizadas.',
    relevance: 'La arquitectura más demandada en 2026 para construir chatbots corporativos y asistentes IA empresariales.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Prompt Engineering',
    slug: 'prompt-engineering',
    letter: 'P',
    definition: 'Disciplina enfocada en estructurar, refinar y optimizar las instrucciones de entrada para modelos de lenguaje con el fin de obtener respuestas precisas y consistentes.',
    relevance: 'Habilidad transversal clave para desarrolladores que integran APIs de IA como OpenAI, Anthropic o Gemini.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Fine-Tuning (Ajuste Fino)',
    slug: 'fine-tuning',
    letter: 'F',
    definition: 'Proceso de reentrenamiento de un modelo de IA preentrenado con un conjunto de datos específico para adaptarlo a un dominio o tarea concreta.',
    relevance: 'Crucial para especializar modelos de código abierto (Llama, Mistral) en contextos médicos, legales o financieros.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Vector Database (Base de Datos Vectorial)',
    slug: 'vector-database',
    letter: 'V',
    definition: 'Base de datos optimizada para almacenar e indexar embeddings vectoriales de alta dimensión, permitiendo búsquedas por similitud semántica a alta velocidad.',
    relevance: 'Componente indispensable en arquitecturas RAG e IA conversacional (Pinecone, Qdrant, ChromaDB, pgvector).',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Embeddings',
    slug: 'embeddings',
    letter: 'E',
    definition: 'Representaciones numéricas en forma de vectores continuos de texto, imágenes o código que capturan las relaciones semánticas del contenido.',
    relevance: 'Fundamento matemático que permite a los motores de búsqueda semántica entender el significado del texto.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'AI Agent (Agente Autónomo de IA)',
    slug: 'ai-agent',
    letter: 'A',
    definition: 'Sistema de software impulsado por un LLM capaz de planificar, tomar decisiones, utilizar herramientas externas (APIs) y ejecutar tareas complejas de forma autónoma.',
    relevance: 'La nueva frontera del desarrollo de software en 2026, sustituyendo a la automatización de procesos tradicional.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'LangChain',
    slug: 'langchain',
    letter: 'L',
    definition: 'Framework de código abierto en Python y TypeScript diseñado para simplificar la creación de aplicaciones impulsadas por modelos de lenguaje de gran tamaño.',
    relevance: 'Estándar para encadenar modelos, bases de datos vectoriales y agentes inteligentes.',
    linkedJobsSlug: 'python',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'LlamaIndex',
    slug: 'llamaindex',
    letter: 'L',
    definition: 'Framework de datos especializado en conectar fuentes de datos privadas (documentos, bases de datos) con modelos de lenguaje para arquitecturas RAG.',
    relevance: 'Muy solicitado para proyectos empresariales de búsqueda semántica sobre documentos internos.',
    linkedJobsSlug: 'python',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'PyTorch',
    slug: 'pytorch',
    letter: 'P',
    definition: 'Biblioteca de código abierto para Machine Learning y Deep Learning desarrollada por el laboratorio de investigación de IA de Meta.',
    relevance: 'Framework preferido por investigadores y científicos de datos para construir y entrenar redes neuronales.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'TensorFlow',
    slug: 'tensorflow',
    letter: 'T',
    definition: 'Plataforma integral de código abierto para aprendizaje automático desarrollada por Google, orientada a producción y despliegue en servidor o dispositivos.',
    relevance: 'Ampliamente utilizada en entornos corporativos para modelos de visión por computador y procesamiento de lenguaje.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Hugging Face',
    slug: 'hugging-face',
    letter: 'H',
    definition: 'Plataforma y comunidad global líder para compartir modelos preentrenados, conjuntos de datos y aplicaciones de IA de código abierto.',
    relevance: 'El "GitHub de la Inteligencia Artificial", imprescindible para trabajar con modelos Open Source.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'LoRA (Low-Rank Adaptation)',
    slug: 'lora',
    letter: 'L',
    definition: 'Técnica eficiente de ajuste fino que congela los pesos del modelo preentrenado e introduce matrices de bajo rango para entrenar modelos gigantes con menos memoria GPU.',
    relevance: 'Permite a startups personalizar LLMs masivos con un coste de cómputo mínimo.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Quantization (Cuantización)',
    slug: 'quantization',
    letter: 'Q',
    definition: 'Proceso de reducción de la precisión numérica de los pesos de un modelo de IA (ej. de 16-bit a 4-bit) para reducir el consumo de RAM y aumentar la velocidad de inferencia.',
    relevance: 'Esencial para ejecutar modelos de IA locales en servidores convencionales o dispositivos móviles.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Agentic Workflow',
    slug: 'agentic-workflow',
    letter: 'A',
    definition: 'Patrón de diseño donde múltiples agentes de IA especializados colaboran iterativamente (planificación, ejecución, crítica, corrección) para resolver tareas complejas.',
    relevance: 'Evolución clave en el desarrollo de software asistido por IA.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'GPU Computing (Cómputo en GPU)',
    slug: 'gpu-computing',
    letter: 'G',
    definition: 'Uso de procesadores gráficos (NVIDIA CUDA) para acelerar cálculos matemáticos paralelos requeridos en el entrenamiento e inferencia de modelos de IA.',
    relevance: 'Alta demanda en infraestructura Cloud para entrenamiento de modelos.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },

  // Cloud & Platform Engineering
  {
    term: 'Platform Engineering (Ingeniería de Plataforma)',
    slug: 'platform-engineering',
    letter: 'P',
    definition: 'Disciplina enfocada en construir y operar plataformas internas de desarrollo (IDP) que proporcionan portales de autoservicio y aceleran la entrega de software.',
    relevance: 'La evolución de DevOps para reducir la carga cognitiva de los desarrolladores en grandes empresas.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'GitOps',
    slug: 'gitops',
    letter: 'G',
    definition: 'Práctica de gestión de infraestructura y aplicaciones donde los repositorios Git actúan como la única fuente de verdad para el estado deseado del sistema.',
    relevance: 'Estándar para despliegues continuos en Kubernetes mediante herramientas como ArgoCD o Flux.',
    linkedJobsSlug: 'kubernetes',
    linkedSalariesSlug: 'docker'
  },
  {
    term: 'FinOps (Cloud Financial Operations)',
    slug: 'finops',
    letter: 'F',
    definition: 'Marco de trabajo operativo que combina finanzas, ingeniería y negocio para optimizar los costes de infraestructura en la nube.',
    relevance: 'Puesto estratégico de alta demanda en empresas con grandes facturas de AWS, Azure o GCP.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'eBPF (Extended Berkeley Packet Filter)',
    slug: 'ebpf',
    letter: 'E',
    definition: 'Tecnología revolucionaria del núcleo Linux que permite ejecutar programas seguros en el kernel sin modificar el código fuente ni cargar módulos.',
    relevance: 'Base de las herramientas modernas de observabilidad, seguridad y red de alto rendimiento en Kubernetes (Cilium).',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Service Mesh (Malla de Servicios)',
    slug: 'service-mesh',
    letter: 'S',
    definition: 'Capa de infraestructura dedicada a gestionar la comunicación service-to-service segura, rápida y fiable en arquitecturas de microservicios.',
    relevance: 'Instalada en clústeres complejos para cifrado mTLS, enrutamiento y observabilidad (Istio, Linkerd).',
    linkedJobsSlug: 'kubernetes',
    linkedSalariesSlug: 'docker'
  },
  {
    term: 'Serverless Edge',
    slug: 'serverless-edge',
    letter: 'S',
    definition: 'Modelo de ejecución sin servidor que ejecuta código JavaScript/WASM en servidores distribuidos geográficamente cerca del usuario final.',
    relevance: 'Reduce la latencia global a milisegundos (Vercel Edge Functions, Cloudflare Workers).',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'ArgoCD',
    slug: 'argocd',
    letter: 'A',
    definition: 'Herramienta declarativa de entrega continua GitOps para Kubernetes que sincroniza automáticamente el estado del clúster con repositorios Git.',
    relevance: 'La herramienta GitOps más solicitada en ofertas de empleo DevOps.',
    linkedJobsSlug: 'kubernetes',
    linkedSalariesSlug: 'docker'
  },
  {
    term: 'Prometheus',
    slug: 'prometheus',
    letter: 'P',
    definition: 'Sistema de monitorización y alerta de código abierto basado en métricas de series temporales, estándar de la CNCF.',
    relevance: 'De facto el motor de métricas para entornos Kubernetes.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Grafana',
    slug: 'grafana',
    letter: 'G',
    definition: 'Plataforma interactiva de visualización y análisis de datos que permite crear dashboards en tiempo real conectando métricas de diversas fuentes.',
    relevance: 'Imprescindible para equipos de operaciones y SRE.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Pulumi',
    slug: 'pulumi',
    letter: 'P',
    definition: 'Plataforma de infraestructura como código (IaC) que permite definir recursos cloud utilizando lenguajes de programación reales (TypeScript, Python, Go).',
    relevance: 'Alternativa moderna a Terraform apreciada por desarrolladores.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'HashiCorp Vault',
    slug: 'hashicorp-vault',
    letter: 'H',
    definition: 'Herramienta para la gestión segura de secretos, claves de API, certificados y cifrado de datos sensible en entornos cloud.',
    relevance: 'Requisito habitual para cumplimiento de seguridad en banca y fintech.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Cloud Native',
    slug: 'cloud-native',
    letter: 'C',
    definition: 'Enfoque de construcción y ejecución de aplicaciones que aprovecha plenamente el modelo de computación en la nube (contenedores, microservicios, APIs).',
    relevance: 'Filosofía dominante en el desarrollo de software actual respaldada por la CNCF.',
    linkedJobsSlug: 'cloud',
    linkedSalariesSlug: 'aws'
  },

  // Frontend Avanzado
  {
    term: 'React Server Components (RSC)',
    slug: 'react-server-components',
    letter: 'R',
    definition: 'Componentes de React que se ejecutan exclusivamente en el servidor, enviando cero JavaScript cliente al navegador y permitiendo acceso directo a bases de datos.',
    relevance: 'La mayor innovación de arquitectura en React 19 y Next.js App Router.',
    linkedJobsSlug: 'react',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Islands Architecture (Arquitectura de Islas)',
    slug: 'islands-architecture',
    letter: 'I',
    definition: 'Patrón web que sirve HTML estático por defecto e hidrata únicamente componentes interactivos aislados ("islas") en el navegador.',
    relevance: 'Mejora radicalmente el rendimiento web y el tiempo de carga en frameworks como Astro o Fresh.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Resumability (Reanudabilidad)',
    slug: 'resumability',
    letter: 'R',
    definition: 'Capacidad de un framework de reconstruir el estado de la aplicación en el cliente sin necesidad de ejecutar hidratación de JavaScript.',
    relevance: 'Pionera en frameworks de nueva generación como Qwik para lograr un TTFB e INP instantáneos.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'javascript'
  },
  {
    term: 'Signals (Señales)',
    slug: 'signals',
    letter: 'S',
    definition: 'Primitiva de reactividad fina en JavaScript que actualiza directamente los nodos del DOM modificados sin re-renderizar componentes completos.',
    relevance: 'Adoptada por SolidJS, Angular, Preact y Vue para un rendimiento reactivo superior.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Micro Frontends',
    slug: 'micro-frontends',
    letter: 'M',
    definition: 'Patrón de arquitectura donde una aplicación web frontend se divide en módulos independientes desarrollados y desplegados por equipos autónomos.',
    relevance: 'Muy utilizado en plataformas de gran escala y e-commerce multinacionales.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'INP (Interaction to Next Paint)',
    slug: 'inp-interaction-to-next-paint',
    letter: 'I',
    definition: 'Métrica oficial de Core Web Vitals de Google que mide la capacidad de respuesta visual de una página web ante la interacción del usuario.',
    relevance: 'Métrica crítica de posicionamiento SEO introducida en 2024.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'javascript'
  },
  {
    term: 'Web Vitals',
    slug: 'web-vitals',
    letter: 'W',
    definition: 'Conjunto de métricas de calidad unificadas definidas por Google para medir la experiencia de usuario en la web (LCP, CLS, INP).',
    relevance: 'Factor directo de ranking en el algoritmo de búsqueda de Google.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'javascript'
  },
  {
    term: 'Turbopack',
    slug: 'turbopack',
    letter: 'T',
    definition: 'Empaquetador de módulos incremental de alto rendimiento para JavaScript y TypeScript escrito en Rust, diseñado como sucesor de Webpack.',
    relevance: 'Motor de compilación integrado por defecto en Next.js.',
    linkedJobsSlug: 'react',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Bun',
    slug: 'bun',
    letter: 'B',
    definition: 'Entorno de ejecución de JavaScript, empaquetador, ejecutor de tests y gestor de paquetes ultra-rápido escrito en Zig.',
    relevance: 'Competidor directo de Node.js y Deno centrado en el rendimiento extremo.',
    linkedJobsSlug: 'javascript',
    linkedSalariesSlug: 'typescript'
  },

  // Backend & Arquitectura de Sistemas
  {
    term: 'CQRS (Command Query Responsibility Segregation)',
    slug: 'cqrs',
    letter: 'C',
    definition: 'Patrón de diseño que separa las operaciones de lectura (queries) de las operaciones de escritura o modificación (commands) en un sistema de datos.',
    relevance: 'Esencial para escalar sistemas con alta carga de lecturas o escrituras complejas.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'Event Sourcing',
    slug: 'event-sourcing',
    letter: 'E',
    definition: 'Patrón de arquitectura donde los cambios en el estado del sistema se almacenan como una secuencia cronológica inmutable de eventos.',
    relevance: 'Muy aplicado en banca, contabilidad y sistemas que requieren auditoría total.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'Circuit Breaker (Interruptor de Autoprotección)',
    slug: 'circuit-breaker',
    letter: 'C',
    definition: 'Patrón de diseño en sistemas distribuidos que previene fallos en cascada deteniendo temporalmente las llamadas a un servicio que está fallando.',
    relevance: 'Requisito clave para garantizar la resiliencia en microservicios.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'gRPC',
    slug: 'grpc',
    letter: 'G',
    definition: 'Framework de llamada a procedimiento remoto (RPC) de código abierto y alto rendimiento desarrollado por Google utilizando HTTP/2 y Protocol Buffers.',
    relevance: 'Estándar para la comunicación interna ultrarrápida entre microservicios.',
    linkedJobsSlug: 'go',
    linkedSalariesSlug: 'go'
  },
  {
    term: 'Protocol Buffers (Protobuf)',
    slug: 'protocol-buffers',
    letter: 'P',
    definition: 'Mecanismo neutral e independiente del lenguaje de serialización de datos estructurados binarios creado por Google.',
    relevance: 'Más rápido y compacto que JSON para transmisión de datos en red.',
    linkedJobsSlug: 'go',
    linkedSalariesSlug: 'go'
  },
  {
    term: 'Rate Limiting (Limitación de Tasa)',
    slug: 'rate-limiting',
    letter: 'R',
    definition: 'Técnica de control de tráfico que limita el número de solicitudes HTTP que un usuario o cliente puede realizar a una API en un periodo de tiempo.',
    relevance: 'Protección esencial contra ataques DDoS y abuso de recursos.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'RabbitMQ',
    slug: 'rabbitmq',
    letter: 'R',
    definition: 'Gestor de colas de mensajes de código abierto que implementa el protocolo AMQP para desacoplar sistemas distribuidos.',
    relevance: 'Extremadamente popular en arquitecturas asíncronas empresariales.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'Server-Sent Events (SSE)',
    slug: 'server-sent-events',
    letter: 'S',
    definition: 'Estándar web que permite a un servidor enviar actualizaciones de datos unidireccionales en tiempo real al navegador a través de una conexión HTTP.',
    relevance: 'Usado para la recepción en streaming de respuestas de modelos de IA.',
    linkedJobsSlug: 'node',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'Hexagonal Architecture (Arquitectura Hexagonal / Puertos y Adaptadores)',
    slug: 'hexagonal-architecture',
    letter: 'H',
    definition: 'Patrón de diseño de software que aísla el núcleo de dominio de la aplicación de los detalles técnicos externos (bases de datos, UI, frameworks).',
    relevance: 'El estándar de arquitectura limpia más recomendado para proyectos de larga duración.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'SOLID Principles (Principios SOLID)',
    slug: 'solid-principles',
    letter: 'S',
    definition: 'Cinco principios fundamentales de diseño orientado a objetos (SRP, OCP, LSP, ISP, DIP) enfocados en crear software mantenible y flexible.',
    relevance: 'Pregunta obligatoria en entrevistas técnicas para desarrolladores Mid y Senior.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'java'
  },

  // Ciberseguridad
  {
    term: 'SAST (Static Application Security Testing)',
    slug: 'sast-static-application-security-testing',
    letter: 'S',
    definition: 'Herramientas de análisis de código fuente estático que identifican vulnerabilidades de seguridad antes de compilar o desplegar la aplicación.',
    relevance: 'Pilar del desplazamiento a la izquierda (Shift Left) en la seguridad DevSecOps.',
    linkedJobsSlug: 'cybersecurity',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'DAST (Dynamic Application Security Testing)',
    slug: 'dast-dynamic-application-security-testing',
    letter: 'D',
    definition: 'Pruebas de seguridad dinámicas que evalúan una aplicación en ejecución desde el exterior simulando ataques reales.',
    relevance: 'Complemento fundamental a SAST para detectar fallos de configuración en producción.',
    linkedJobsSlug: 'cybersecurity',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'SBOM (Software Bill of Materials)',
    slug: 'sbom',
    letter: 'S',
    definition: 'Inventario formal y estructurado de todos los componentes, bibliotecas y dependencias de código abierto utilizados en una pieza de software.',
    relevance: 'Requisito regulatorio emergente para la seguridad de la cadena de suministro.',
    linkedJobsSlug: 'cybersecurity',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'OIDC (OpenID Connect)',
    slug: 'oidc-openid-connect',
    letter: 'O',
    definition: 'Capa de identidad simple construida sobre el protocolo OAuth 2.0 que permite la verificación de la identidad del cliente.',
    relevance: 'Estándar del mercado para autenticación Single Sign-On (SSO).',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'node'
  },
  {
    term: 'PKCE (Proof Key for Code Exchange)',
    slug: 'pkce',
    letter: 'P',
    definition: 'Extensión de seguridad para OAuth 2.0 diseñada para prevenir ataques de interceptación de códigos de autorización en clientes públicos (SPA, móviles).',
    relevance: 'Obligatorio en aplicaciones React, Angular y móviles modernas.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'CORS (Cross-Origin Resource Sharing)',
    slug: 'cors',
    letter: 'C',
    definition: 'Mecanismo de seguridad basado en cabeceras HTTP que permite a un servidor indicar qué orígenes externos tienen permiso para cargar recursos.',
    relevance: 'Concepto clave que todo desarrollador web debe configurar correctamente.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'javascript'
  },

  // Bases de Datos & Data Engineering
  {
    term: 'Change Data Capture (CDC)',
    slug: 'change-data-capture',
    letter: 'C',
    definition: 'Técnica de ingeniería de datos que identifica y captura automáticamente los cambios realizados en una base de datos y los transmite en tiempo real.',
    relevance: 'Fundamental para replicar datos en tiempo real hacia almacenes de datos o buscadores (Debezium).',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'Data Lakehouse',
    slug: 'data-lakehouse',
    letter: 'D',
    definition: 'Arquitectura de datos moderna que combina la flexibilidad de almacenamiento de bajo coste de un Data Lake con las capacidades transaccionales ACID de un Data Warehouse.',
    relevance: 'El estándar dominante en ingeniería de datos (Databricks, Delta Lake).',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'ClickHouse',
    slug: 'clickhouse',
    letter: 'C',
    definition: 'Sistema de gestión de bases de datos analíticas orientada a columnas (OLAP) de código abierto y rendimiento ultra-rápido.',
    relevance: 'Muy utilizada para analítica web en tiempo real, métricas y dashboards masivos.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'sql'
  },
  {
    term: 'DuckDB',
    slug: 'duckdb',
    letter: 'D',
    definition: 'Sistema de gestión de bases de datos relacional analítico en memoria embetible diseñado para análisis de datos rápidos.',
    relevance: 'Considerada el "SQLite de los datos analíticos".',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'python'
  },
  {
    term: 'Snowflake',
    slug: 'snowflake',
    letter: 'S',
    definition: 'Plataforma de almacenamiento de datos en la nube completamente gestionada (Data Warehouse as a Service) con separación de cómputo y almacenamiento.',
    relevance: 'Una de las tecnologías de datos empresariales más solicitadas.',
    linkedJobsSlug: 'data',
    linkedSalariesSlug: 'sql'
  },

  // QA, Testing & Metodologías
  {
    term: 'Contract Testing (Pruebas de Contrato)',
    slug: 'contract-testing',
    letter: 'C',
    definition: 'Técnica de pruebas que asegura que dos servicios independientes (proveedor y consumidor de API) se comunican respetando un acuerdo o contrato acordado previamente.',
    relevance: 'Esencial para verificar microservicios sin desplegar todos los entornos (Pact).',
    linkedJobsSlug: 'qa-engineer',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Mutation Testing',
    slug: 'mutation-testing',
    letter: 'M',
    definition: 'Técnica avanzada de testing donde se introducen pequeños fallos ("mutaciones") en el código para verificar si los tests unitarios son capaces de detectarlos.',
    relevance: 'Mide la verdadera calidad y efectividad de las pruebas unitarias.',
    linkedJobsSlug: 'qa-engineer',
    linkedSalariesSlug: 'java'
  },
  {
    term: 'DORA Metrics (Métricas DORA)',
    slug: 'dora-metrics',
    letter: 'D',
    definition: 'Cuatro métricas clave (Deployment Frequency, Lead Time for Changes, Change Failure Rate, Time to Restore Service) para evaluar el rendimiento de DevOps.',
    relevance: 'Utilizadas por líderes de ingeniería para medir la madurez del equipo.',
    linkedJobsSlug: 'devops-engineer',
    linkedSalariesSlug: 'aws'
  },
  {
    term: 'Developer Experience (DX)',
    slug: 'developer-experience',
    letter: 'D',
    definition: 'Experiencia global de un desarrollador al interactuar con las herramientas, procesos, documentación e infraestructura interna de una empresa.',
    relevance: 'Foco prioritario para retener talento técnico y maximizar la productividad.',
    linkedJobsSlug: 'frontend',
    linkedSalariesSlug: 'react'
  },
  {
    term: 'Trunk-Based Development',
    slug: 'trunk-based-development',
    letter: 'T',
    definition: 'Práctica de control de versiones en la que todos los desarrolladores integran sus cambios frecuentemente en una única rama principal ("trunk").',
    relevance: 'Alternativa moderna a GitFlow preferida en equipos de alto rendimiento con CI/CD.',
    linkedJobsSlug: 'backend',
    linkedSalariesSlug: 'react'
  }
];

