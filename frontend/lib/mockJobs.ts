export interface MockJob {
  id: string | number;
  title: string;
  title_es?: string | null;
  company: string;
  location: string;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
}

export const MOCK_JOBS: MockJob[] = [
  {
    id: "mock-1",
    title: "Senior Fullstack Engineer (React & Node.js)",
    title_es: "Ingeniero Fullstack Senior (React y Node.js)",
    company: "Typeform",
    location: "Barcelona (Híbrido)",
    salary: "55k–70k €",
    salary_min: 55000,
    salary_max: 70000,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Buscamos un Ingeniero Fullstack Senior para liderar la arquitectura de nuestra plataforma de formularios interactivos con TypeScript, Next.js y microservicios en Go.",
    category: "Frontend",
    is_featured: true,
    is_active: true
  },
  {
    id: "mock-2",
    title: "Lead Cloud & DevOps Specialist (AWS, Kubernetes)",
    title_es: "Especialista Cloud & DevOps Lead (AWS, Kubernetes)",
    company: "Cabify",
    location: "Madrid / Remoto España",
    salary: "65k–80k €",
    salary_min: 65000,
    salary_max: 80000,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Responsable de diseñar y escalar clusters de Kubernetes en producción, observabilidad distribuida con Grafana/Prometheus y pipelines CI/CD altamente automatizados.",
    category: "DevOps",
    is_featured: true,
    is_active: true
  },
  {
    id: "mock-3",
    title: "Staff Data Engineer (Python, Spark & Snowflake)",
    title_es: "Ingeniero de Datos Staff (Python, Spark y Snowflake)",
    company: "Glovo",
    location: "Barcelona (Remoto)",
    salary: "60k–75k €",
    salary_min: 60000,
    salary_max: 75000,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Diseño y optimización de pipelines de datos masivos en tiempo real con PySpark, dbt y Snowflake. Modelado de datos multidimensional para analítica predictiva.",
    category: "Data",
    is_featured: true,
    is_active: true
  },
  {
    id: "mock-4",
    title: "Backend Developer (Go & PostgreSQL)",
    title_es: "Desarrollador Backend (Go y PostgreSQL)",
    company: "Factorial HR",
    location: "Barcelona",
    salary: "45k–60k €",
    salary_min: 45000,
    salary_max: 60000,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Desarrollo de microservicios transaccionales en Go de baja latencia con PostgreSQL optimizado y colas de mensajes Kafka.",
    category: "Backend",
    is_featured: false,
    is_active: true
  },
  {
    id: "mock-5",
    title: "Frontend Engineer (React 19 & Tailwind CSS)",
    title_es: "Ingeniero Frontend (React 19 y Tailwind CSS)",
    company: "RavenPack",
    location: "Marbella / Remoto",
    salary: "42k–55k €",
    salary_min: 42000,
    salary_max: 55000,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Construcción de dashboards de visualización de datos financieros de alto rendimiento con animaciones fluidas a 60fps y React Server Components.",
    category: "Frontend",
    is_featured: false,
    is_active: true
  },
  {
    id: "mock-6",
    title: "Mobile Engineer (React Native & Swift)",
    title_es: "Ingeniero Mobile (React Native y Swift)",
    company: "Holded",
    location: "Barcelona",
    salary: "45k–58k €",
    salary_min: 45000,
    salary_max: 58000,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Evolución de la aplicación móvil nativa empresarial para miles de pymes en Europa, optimizando experiencia offline y fluidez táctil.",
    category: "Mobile",
    is_featured: false,
    is_active: true
  },
  {
    id: "mock-7",
    title: "Senior Python & FastAPI Engineer",
    title_es: "Ingeniero Senior Python y FastAPI",
    company: "Fever",
    location: "Madrid (Híbrido)",
    salary: "50k–65k €",
    salary_min: 50000,
    salary_max: 65000,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Arquitectura de APIs asíncronas con FastAPI y Redis, soportando picos de millones de transacciones de ticketing y recomendación por IA.",
    category: "Backend",
    is_featured: false,
    is_active: true
  },
  {
    id: "mock-8",
    title: "Site Reliability Engineer (SRE)",
    title_es: "Ingeniero de Confiabilidad de Sitios (SRE)",
    company: "Wallapop",
    location: "Barcelona / Remoto España",
    salary: "55k–70k €",
    salary_min: 55000,
    salary_max: 70000,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    url_source: "https://portalempleoit.com",
    description_snippet: "Gestión de SLAs y SLIs, automatización de infraestructura como código (Terraform), mitigación proactiva de incidentes y resiliencia multi-cloud.",
    category: "DevOps",
    is_featured: false,
    is_active: true
  }
];
