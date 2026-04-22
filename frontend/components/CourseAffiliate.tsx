// Enlace de afiliado de Udemy — todos los clics pasan por aquí para que
// Udemy registre la cookie de seguimiento y se te atribuyan las ventas.
const UDEMY_AFFILIATE_LINK = "https://trk.udemy.com/9VMAEj";

// Mapa de cursos relevantes por tecnología detectada en el título de la oferta.
// El href siempre es el link de afiliado para garantizar el seguimiento.
const COURSE_MAP: Record<string, { name: string; emoji: string }> = {
  python:   { name: "Master en Python — De Cero a Experto",       emoji: "🐍" },
  react:    { name: "React.js — Guía Completa con Proyectos",      emoji: "⚛️" },
  java:     { name: "Java Profesional para Empresas",              emoji: "☕" },
  ".net":   { name: "Desarrollo con .NET y C#",                    emoji: "🔷" },
  "c#":     { name: "Desarrollo con .NET y C#",                    emoji: "🔷" },
  angular:  { name: "Angular — De Principiante a Profesional",     emoji: "🅰️" },
  vue:      { name: "Vue.js 3 — Guía Completa",                    emoji: "💚" },
  node:     { name: "Node.js — Desarrollo Backend Moderno",        emoji: "🟢" },
  docker:   { name: "Docker y Kubernetes para Desarrolladores",    emoji: "🐳" },
  aws:      { name: "AWS Certificación — Arquitecto de Soluciones",emoji: "☁️" },
  devops:   { name: "DevOps con Docker, CI/CD y AWS",              emoji: "⚙️" },
  sql:      { name: "SQL y Bases de Datos — Curso Completo",       emoji: "🗄️" },
  data:     { name: "Data Science con Python y Machine Learning",  emoji: "📊" },
  machine:  { name: "Machine Learning con Python",                 emoji: "🤖" },
  flutter:  { name: "Flutter — Aplicaciones Móviles con Dart",    emoji: "📱" },
  kotlin:   { name: "Kotlin para Android — Guía Completa",         emoji: "📱" },
};

const DEFAULT_COURSE = { name: "Fullstack Developer — Bootcamp Completo", emoji: "🚀" };

export default function CourseAffiliate({ title }: { title: string }) {
  const titleLower = title.toLowerCase();

  // Busca la primera tecnología que coincida con el título de la oferta
  const matchedKey = Object.keys(COURSE_MAP).find((key) =>
    titleLower.includes(key)
  );

  const course = matchedKey ? COURSE_MAP[matchedKey] : DEFAULT_COURSE;

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
        Curso recomendado · Patrocinado
      </p>
      <h3 className="text-indigo-900 font-bold text-lg mb-1">
        {course.emoji} {course.name}
      </h3>
      <p className="text-indigo-700 text-sm mb-4">
        Mejora tu perfil y prepárate para la entrevista técnica.
        Accede ahora con descuento en Udemy.
      </p>
      <a
        href={UDEMY_AFFILIATE_LINK}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold py-2.5 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        Ver curso en Udemy →
      </a>
    </div>
  );
}
