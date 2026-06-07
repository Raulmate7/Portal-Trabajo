export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'como-superar-entrevista-tecnica-react',
    title: 'Cómo superar una entrevista técnica en React en 2026',
    excerpt: 'Descubre las preguntas más frecuentes y cómo estructurar tus respuestas para conseguir ese puesto de Frontend Developer.',
    content: `
Las entrevistas técnicas pueden ser desafiantes, especialmente en tecnologías tan demandadas como React. En 2026, las empresas buscan no solo que sepas usar hooks, sino que entiendas el ciclo de vida, la optimización de rendimiento (como Server Components) y la arquitectura.

## 1. Entiende Server Components vs Client Components
Con Next.js y React 19+, la distinción entre dónde se ejecuta el código es vital. Asegúrate de poder explicar cuándo usar \`"use client"\` y cuándo aprovechar la renderización en el servidor para reducir el JavaScript que se envía al navegador.

## 2. Dominio de Hooks Customizados
Cualquiera puede usar \`useState\`. Los entrevistadores buscan candidatos que sepan abstraer lógica compleja en custom hooks limpios y testeables.

## 3. Optimización de Rendimiento
Te preguntarán sobre \`useMemo\`, \`useCallback\`, y cómo evitar re-renderizados innecesarios. Prepárate para hablar sobre herramientas como React Profiler.

**Consejo final:** Sé honesto. Si no sabes algo, explica cómo lo buscarías o cómo te enfrentarías al problema. La actitud cuenta tanto como el conocimiento técnico.
    `,
    date: '2026-05-20',
    author: 'Equipo Portal Empleo',
  },
  {
    slug: 'guia-salarios-programadores-espana-2026',
    title: 'Guía de salarios para programadores en España (2026)',
    excerpt: '¿Cuánto deberías cobrar? Analizamos las tendencias salariales para perfiles Junior, Mid y Senior en las principales ciudades.',
    content: `
El mercado tecnológico en España sigue evolucionando. La consolidación del trabajo remoto ha igualado en gran medida los salarios entre ciudades, pero aún existen diferencias clave.

## Salarios por Nivel de Experiencia
* **Junior (0-2 años):** El rango suele estar entre 22.000€ y 28.000€ brutos anuales, dependiendo de la tecnología y el tamaño de la empresa.
* **Mid-Level (2-5 años):** Aquí es donde ocurre el mayor salto. Los salarios oscilan entre 30.000€ y 45.000€.
* **Senior (5+ años):** A partir de 45.000€, pudiendo superar los 65.000€ o incluso 80.000€ en roles de liderazgo técnico o trabajando en remoto para empresas extranjeras.

## Tecnologías Mejor Pagadas
Actualmente, los perfiles relacionados con **Cloud Computing (AWS, GCP)**, **Data Engineering**, y **Ciberseguridad** lideran las tablas salariales. En el desarrollo web, **Go** y **Python** (vinculado a IA) muestran ligeras ventajas sobre ecosistemas más saturados como el desarrollo frontend básico.

Recuerda que el salario no lo es todo: valora también el ambiente de trabajo, la flexibilidad y el proyecto tecnológico.
    `,
    date: '2026-05-25',
    author: 'Equipo Portal Empleo',
  },
  {
    slug: 'como-optimizar-cv-programador-filtros-ats',
    title: 'Cómo optimizar tu CV de programador para superar los filtros ATS',
    excerpt: 'Aprende cómo estructurar tu currículum y qué palabras clave incluir para evitar que el software de reclutamiento descarte tu candidatura.',
    content: `
Hoy en día, la mayoría de las medianas y grandes empresas tecnológicas utilizan sistemas ATS (Applicant Tracking Systems) para filtrar currículums antes de que lleguen a ojos humanos. Si tu CV no está optimizado, podría ser descartado automáticamente.

## 1. El Formato es Clave
Evita las plantillas con dos columnas, barras de nivel de habilidades (por ejemplo, "React: 4/5") o elementos gráficos complejos. Los lectores de ATS analizan el texto de forma secuencial de izquierda a derecha. Usa una sola columna y formatos estándar como PDF o DOCX.

## 2. Palabras Clave Basadas en la Oferta
El software ATS compara tu CV con la descripción del puesto. Si la oferta pide "TypeScript, Node.js y Docker", estas palabras exactas deben aparecer en tu currículum. No uses sinónimos rebuscados; cíñete a los términos estándar de la industria.

## 3. Estructura Clara y Limpia
Usa encabezados sencillos e inequívocos para tus secciones: "Experiencia Profesional", "Formación Académica", "Habilidades Técnicas". Los nombres creativos de secciones confunden al parser del ATS, haciendo que tu información se clasifique de forma errónea o directamente se pierda.
    `,
    date: '2026-06-02',
    author: 'Equipo Portal Empleo',
  },
  {
    slug: 'tecnologias-backend-mas-demandadas-espana-2026',
    title: 'Las 5 tecnologías backend más demandadas y mejor pagadas en España (2026)',
    excerpt: 'Analizamos las tendencias del mercado laboral backend en España: qué lenguajes y frameworks lideran los salarios y el número de ofertas.',
    content: `
El desarrollo backend es la columna vertebral de cualquier aplicación web. En España, durante 2026, la demanda de perfiles backend sigue siendo muy fuerte, impulsada por la migración a la nube y el desarrollo de APIs para modelos de inteligencia artificial.

## 1. Java y Spring Boot
Sigue siendo el rey indiscutible en entornos corporativos, banca y grandes consultoras. Las ofertas son abundantes y los salarios para perfiles Senior (+5 años de experiencia) superan con facilidad los 50.000€ anuales.

## 2. Python (Django/FastAPI)
Su crecimiento está muy ligado al ecosistema de Inteligencia Artificial y Data Science. FastAPI se ha consolidado como el framework de referencia para crear microservicios rápidos y modernos en Python.

## 3. Node.js (TypeScript / NestJS)
Muy demandado por startups y empresas de producto tecnológico. El uso de TypeScript junto con NestJS ha profesionalizado enormemente el desarrollo backend con JavaScript, ofreciendo arquitecturas limpias y mantenibles.

## 4. Go (Golang)
Es el lenguaje preferido para sistemas distribuidos de alto rendimiento y herramientas nativas de la nube. Aunque hay menos ofertas en comparación con Java, los salarios suelen ser más elevados debido a la escasez de profesionales.

## 5. C# y .NET Core
Al igual que Java, tiene una fuerte presencia en la empresa tradicional. .NET 8 y versiones superiores han renovado la popularidad de este ecosistema gracias a su gran rendimiento y soporte multiplataforma.
    `,
    date: '2026-06-05',
    author: 'Equipo Portal Empleo',
  },
  {
    slug: 'guia-superar-entrevista-tecnica-java-spring-boot',
    title: 'Guía completa para superar una entrevista técnica de Java y Spring Boot',
    excerpt: 'Recopilamos las preguntas teóricas y prácticas más comunes que te formularán en una entrevista para puestos de desarrollo Java.',
    content: `
Java sigue siendo uno de los lenguajes más demandados en España. Las entrevistas técnicas para puestos de Java y Spring Boot suelen combinar preguntas de teoría sólida sobre el lenguaje con conceptos avanzados del framework Spring.

## Preguntas Teóricas Clave de Java
* **¿Qué es la Programación Orientada a Objetos (POO)?** Prepárate para definir con tus palabras Abstracción, Encapsulamiento, Herencia y Polimorfismo.
* **Garbage Collector y Memoria:** Debes entender cómo funciona la gestión de memoria en la JVM (Heap vs Stack) y cómo el Garbage Collector libera memoria.
* **Concurrencia:** Preguntas sobre Threads, la palabra clave \`synchronized\`, y estructuras de datos seguras para hilos (como ConcurrentHashMap).

## Conceptos Cruciales de Spring Boot
* **Inyección de Dependencias (IoC):** Cómo Spring gestiona el ciclo de vida de los Beans y cómo funciona la inversión de control.
* **Spring Data JPA y Hibernate:** Problema de las N+1 consultas y cómo solucionarlo usando \`join fetch\` o \`EntityGraph\`.
* **Gestión de Transacciones:** Funcionamiento de la anotación \`@Transactional\` y los niveles de aislamiento.

**Consejo de oro:** En las pruebas de código en vivo (Live Coding), enfócate primero en dar una solución funcional sencilla y luego explica cómo optimizarías el rendimiento (complejidad temporal y espacial).
    `,
    date: '2026-06-07',
    author: 'Equipo Portal Empleo',
  }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug);
}
