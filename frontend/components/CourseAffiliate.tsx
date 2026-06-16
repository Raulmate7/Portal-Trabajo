// Enlaces de afiliado de alto valor (High-Ticket)
const CV_BUILDER_LINK = "https://trk.udemy.com/9VMAEj"; 

const getUdemyLink = (techKey: string | null) => {
  const defaultBase = "https://trk.udemy.com/9VMAEj";
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
    <div className="mt-8 space-y-4">
      {/* Banner Principal - Bootcamp */}
      <div className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 rounded-2xl border border-indigo-500/30 shadow-2xl">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Recomendación Premium
          </div>
          
          <h3 className="text-white font-black text-2xl md:text-3xl mb-2 tracking-tight">
            {course.emoji} {course.name}
          </h3>
          
          <p className="text-indigo-200 text-sm md:text-base mb-6 max-w-xl leading-relaxed">
            {course.desc} Las empresas están buscando este perfil de forma urgente. 
            Aprovecha para formarte en un entorno inmersivo.
          </p>
          
          <a
            href={bootcampLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex justify-center items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 text-base font-bold py-3 px-8 rounded-xl hover:from-green-300 hover:to-emerald-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)]"
          >
            Ver Bootcamp Completo →
          </a>
        </div>
      </div>

      {/* Banner Secundario - CV Builder */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-xl">
            📄
          </div>
          <div>
            <h4 className="text-gray-900 font-bold text-sm">¿Tu CV no pasa los filtros?</h4>
            <p className="text-gray-500 text-xs">Usa plantillas optimizadas para ATS y destaca.</p>
          </div>
        </div>
        <a 
          href={CV_BUILDER_LINK}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-indigo-700 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          Mejorar CV
        </a>
      </div>
    </div>
  );
}
