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
  }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug);
}
