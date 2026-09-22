import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '¡Suscripción Confirmada! | Portal Trabajo IT',
  description: 'Gracias por suscribirte a nuestras alertas de empleo.',
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        <span className="text-6xl block mb-6 animate-bounce">🎉</span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          ¡Estás dentro!
        </h1>
        <p className="text-lg text-indigo-200 mb-8 max-w-xl mx-auto leading-relaxed">
          Tu suscripción se ha confirmado correctamente. A partir de ahora recibirás las mejores ofertas de empleo IT directamente en tu inbox.
        </p>
        
        <div className="bg-indigo-950/50 rounded-2xl p-6 mb-8 border border-indigo-500/30">
          <h2 className="text-xl font-bold text-white mb-3">🔥 Siguiente paso recomendado</h2>
          <p className="text-indigo-300 text-sm mb-5">
            Únete a nuestra comunidad privada de Telegram donde publicamos ofertas exclusivas que no llegan a la newsletter.
          </p>
          <a 
            href="https://t.me/empleo_it" // Cambiar a la URL real del grupo si existe
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-[#0088cc]/30"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.19 3.44-.49.33-.93.5-1.33.49-.44-.01-1.28-.25-1.91-.45-.77-.25-1.38-.38-1.33-.81.03-.22.34-.45.94-.69 3.67-1.6 6.13-2.63 7.37-3.15 3.51-1.46 4.24-1.72 4.71-1.73.1 0 .34.02.46.12.1.08.13.2.14.31-.01.07-.01.16-.02.28z"/></svg>
            Unirse al Canal de Telegram
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/trabajos/informatica-tecnologia"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all border border-white/10"
          >
            Ver ofertas actuales
          </Link>
          <Link 
            href="/salarios"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
          >
            Calcular mi salario ideal
          </Link>
        </div>
      </div>
    </main>
  );
}
