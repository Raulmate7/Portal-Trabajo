// Banners de afiliado internos (no AdSense) — rápidos, sin JS externo, sin ad-blockers.
// Reemplaza los links "ejemplo.com" por tus links reales de afiliado.

const ADS = [
  {
    id: 'cv-builder',
    emoji: '📄',
    title: 'Crea un CV que pase los filtros ATS',
    desc: 'Plantillas profesionales optimizadas para recruiters.',
    cta: 'Crear mi CV gratis',
    href: 'https://ejemplo.com/afiliado-cv',
    colors: 'from-emerald-50 to-teal-50 border-emerald-200',
    ctaColors: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'hosting',
    emoji: '☁️',
    title: 'Despliega tu portfolio en minutos',
    desc: 'Hosting ultrarrápido para desarrolladores. Desde 2€/mes.',
    cta: 'Ver planes →',
    href: 'https://ejemplo.com/afiliado-hosting',
    colors: 'from-blue-50 to-indigo-50 border-blue-200',
    ctaColors: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'vpn',
    emoji: '🔒',
    title: 'Trabaja en remoto de forma segura',
    desc: 'VPN premium con descuento exclusivo para devs.',
    cta: 'Probar gratis',
    href: 'https://ejemplo.com/afiliado-vpn',
    colors: 'from-violet-50 to-purple-50 border-violet-200',
    ctaColors: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
];

/**
 * Muestra un banner de afiliado aleatorio cada vez que se renderiza.
 * Se puede usar en el sidebar, entre resultados de búsqueda, o en el footer.
 * 
 * @param variant - 'sidebar' muestra formato vertical compacto, 'inline' muestra formato horizontal
 */
export default function AdBanner({ variant = 'sidebar' }: { variant?: 'sidebar' | 'inline' }) {
  // Seleccionar un anuncio basado en la hora actual (cambia cada hora, sin estado cliente)
  const ad = ADS[new Date().getHours() % ADS.length];

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r ${ad.colors} border shadow-sm`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{ad.emoji}</span>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">{ad.title}</h4>
            <p className="text-gray-600 text-xs">{ad.desc}</p>
          </div>
        </div>
        <a
          href={ad.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`shrink-0 px-5 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${ad.ctaColors}`}
        >
          {ad.cta}
        </a>
      </div>
    );
  }

  // Sidebar (vertical)
  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br ${ad.colors} border shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{ad.emoji}</span>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Patrocinado</p>
      </div>
      <h4 className="font-bold text-gray-900 text-sm mb-1">{ad.title}</h4>
      <p className="text-gray-600 text-xs mb-4 leading-relaxed">{ad.desc}</p>
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block w-full text-center px-4 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${ad.ctaColors}`}
      >
        {ad.cta}
      </a>
    </div>
  );
}
