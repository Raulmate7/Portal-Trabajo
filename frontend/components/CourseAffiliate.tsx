// Enlaces de afiliado configurables por entorno (FUNC-031)
const UDEMY_BASE_URL = process.env.NEXT_PUBLIC_UDEMY_AFFILIATE_URL || "https://trk.udemy.com/9VMAEj";
const CV_BUILDER_LINK = process.env.NEXT_PUBLIC_CV_AFFILIATE_URL || UDEMY_BASE_URL;

const getUdemyLink = (techKey: string | null) => {
  const defaultBase = UDEMY_BASE_URL;
  if (!techKey) {
    return `${defaultBase}?ulp=${encodeURIComponent("https://www.udemy.com/courses/search/?q=programacion")}`;
  }
  
  // Mapear claves a términos de búsqueda más específicos y optimizados para Udemy
  const terms: Record<string, string> = {
    python: "python data science machine learning",
    react: "react nodejs fullstack",
    java: "java spring backend",
    data: "data analytics sql",
    devops: "devops kubernetes aws docker"
  };

  const searchQuery = terms[techKey] || techKey;
  return `${defaultBase}?ulp=${encodeURIComponent(`https://www.udemy.com/courses/search/?q=${searchQuery}`)}`;
};

const COURSE_MAP: Record<string, { name: string; emoji: string; desc: string }> = {
  python:   { name: "Bootcamp Data Science & Machine Learning", emoji: "🤖", desc: "Domina Python y AI en 12 semanas. Pago a plazos disponible." },
  react:    { name: "Bootcamp Fullstack Web Developer", emoji: "⚛️", desc: "De cero a Fullstack con React y Node.js. Alta empleabilidad." },
  java:     { name: "Máster en Desarrollo Backend (Java/Spring)", emoji: "☕", desc: "Fórmate en las tecnologías más demandadas por grandes empresas." },
  data:     { name: "Bootcamp Data Analytics", emoji: "📊", desc: "Aprende SQL, Python y Tableau con casos reales." },
  devops:   { name: "Bootcamp Cloud & DevOps", emoji: "☁️", desc: "Despliega infraestructuras con AWS, Docker y Kubernetes." },
};

const DEFAULT_COURSE = { 
  name: "Bootcamp Fullstack Developer Intensivo", 
  emoji: "🚀", 
  desc: "Acelera tu carrera tech. Aprende haciendo proyectos y consigue empleo." 
};

export default function CourseAffiliate({ title }: { title: string }) {
  const titleLower = title.toLowerCase();

  const matchedKey = Object.keys(COURSE_MAP).find((key) =>
    titleLower.includes(key)
  );

  const course = matchedKey ? COURSE_MAP[matchedKey] : DEFAULT_COURSE;
  const bootcampLink = getUdemyLink(matchedKey || null);

  return (
    <div className="mt-8 space-y-3.5">
      {/* Recurso Formativo Editorial Nativo */}
      <div className="relative overflow-hidden p-5 sm:p-6 ui-card ui-card-interactive rounded-xl border-[var(--border-accent)]">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[var(--accent-primary)]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-3 rounded-md bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--accent-primary)] font-mono text-[10px] font-semibold uppercase tracking-wider">
            Patrocinado · Recurso Formativo
          </div>

          <h3 className="text-[var(--text-primary)] font-semibold text-base sm:text-lg mb-1.5 tracking-tight">
            {course.name}
          </h3>

          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-4 max-w-xl leading-relaxed">
            {course.desc} Formación orientada a los requisitos técnicos más demandados para este perfil.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <p className="font-mono text-[11px] text-[var(--text-muted)]">
              Enlace afiliado de Udemy · Sin coste adicional
            </p>
            <a
              href={bootcampLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="ui-btn-press inline-flex justify-center items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-lg transition-colors shrink-0"
            >
              Ver programa formativo →
            </a>
          </div>
        </div>
      </div>

      {/* Recurso Secundario */}
      <div className="ui-card ui-card-interactive flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl gap-3">
        <div className="min-w-0">
          <span className="inline-block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--status-amber)] bg-[var(--status-amber-tint)] border border-[var(--border-featured)] px-2 py-0.5 rounded-md mb-1.5">
            Patrocinado · Afiliado
          </span>
          <h4 className="text-[var(--text-primary)] font-semibold text-sm">¿Quieres reforzar tu perfil técnico?</h4>
          <p className="text-[var(--text-secondary)] text-xs">Explora cursos de preparación técnica y entrevistas en Udemy.</p>
        </div>
        <a
          href={CV_BUILDER_LINK}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ui-btn-press px-3.5 py-2 bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-center shrink-0"
        >
          Ver cursos →
        </a>
      </div>
    </div>
  );
}
