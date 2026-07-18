import Link from 'next/link';
import AdBanner from '@/components/AdBanner';

export default function NotFound() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Página no encontrada (404) | Portal Trabajo IT",
    "description": "La página solicitada no está disponible. Explora ofertas de empleo tecnológico y desarrollo de software actualizadas en España.",
    "url": "https://portalempleoit.com/404"
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-16 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <div className="max-w-3xl mx-auto text-center space-y-10">
        
        {/* Encabezado 404 */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <span className="text-7xl block mb-2 animate-bounce">🔍</span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Página no encontrada (404)
          </h1>
          <p className="text-gray-550 dark:text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Parece que la oferta de empleo ha caducado o el enlace que has seguido ya no existe.
            ¡No te preocupes! Tenemos ofertas actualizadas esperándote.
          </p>

          {/* Formulario de Búsqueda Integrado */}
          <div className="pt-2">
            <form action="/" method="GET" className="relative max-w-md mx-auto">
              <input
                type="text"
                name="q"
                required
                placeholder="Busca cargos, stacks (React, Python, Java)..."
                className="w-full pl-5 pr-12 py-3 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-slate-950 text-gray-900 dark:text-white text-sm transition-all"
              />
              <button type="submit" className="absolute right-4 top-3.5 text-gray-450 hover:text-indigo-650 transition-colors cursor-pointer">
                🔍
              </button>
            </form>
          </div>
        </div>

        {/* Categorías populares recomendadas */}
        <div className="space-y-4 text-left animate-in fade-in duration-300">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 px-1">
            <span>⚡</span> Explora ofertas por categoría popular:
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'React', slug: 'react', emoji: '⚛️' },
              { label: 'Node.js', slug: 'node', emoji: '🟢' },
              { label: 'Python', slug: 'python', emoji: '🐍' },
              { label: 'Java', slug: 'java', emoji: '☕' },
              { label: 'TypeScript', slug: 'typescript', emoji: '🟦' },
              { label: 'DevOps / Cloud', slug: 'cloud', emoji: '☁️' }
            ].map((tech) => (
              <Link
                key={tech.slug}
                href={`/trabajos/${tech.slug}`}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800/65 hover:shadow-md transition-all flex items-center gap-3 hover:border-indigo-200/50 dark:hover:border-indigo-950/50"
              >
                <span className="text-2xl">{tech.emoji}</span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {tech.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Enlaces Rápidos y Navegación */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-sm shadow-indigo-200/50 cursor-pointer"
          >
            Buscador Principal 🏠
          </Link>
          <Link
            href="/salarios"
            className="px-5 py-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 text-gray-700 dark:text-slate-350 font-extrabold rounded-xl text-sm transition-all border border-gray-200 dark:border-slate-800 shadow-sm cursor-pointer"
          >
            Calculadora Salarial 💰
          </Link>
          <Link
            href="/trabajo-remoto"
            className="px-5 py-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 text-gray-700 dark:text-slate-350 font-extrabold rounded-xl text-sm transition-all border border-gray-200 dark:border-slate-800 shadow-sm cursor-pointer"
          >
            Empleos en Remoto 🌐
          </Link>
        </div>

        {/* Anuncio AdSense para monetizar tráfico perdido */}
        <div className="border-t border-gray-200 dark:border-slate-800/80 pt-8 max-w-xl mx-auto">
          <AdBanner variant="inline" />
        </div>

      </div>
    </main>
  );
}
