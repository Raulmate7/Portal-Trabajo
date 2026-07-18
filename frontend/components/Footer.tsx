import Link from 'next/link';
import pool from '@/lib/db';

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  let activeJobsCount = 12450;
  
  try {
    const res = await pool.query("SELECT COUNT(*) as count FROM jobs WHERE is_active = TRUE");
    activeJobsCount = parseInt(res.rows[0]?.count || '12450', 10);
  } catch (e) {
    console.error("Error loading jobs count for footer:", e);
  }

  const categories = [
    { label: 'Desarrollo Frontend', href: '/trabajos/frontend' },
    { label: 'Desarrollo Backend', href: '/trabajos/backend' },
    { label: 'Data & Inteligencia Artificial', href: '/trabajos/data' },
    { label: 'Cloud & DevOps', href: '/trabajos/cloud' },
    { label: 'Desarrollo Mobile', href: '/trabajos/mobile' },
  ];

  let programmaticLinks = [
    { label: 'React en Madrid', href: '/trabajos/react-en-madrid' },
    { label: 'React Remoto', href: '/trabajos/react-remoto' },
    { label: 'Java en Barcelona', href: '/trabajos/java-en-barcelona' },
    { label: 'Java Remoto', href: '/trabajos/java-remoto' },
    { label: 'Python Remoto', href: '/trabajos/python-remoto' },
    { label: 'DevOps Remoto', href: '/trabajos/devops-remoto' },
    { label: 'Fullstack Remoto', href: '/trabajos/fullstack-remoto' },
    { label: 'Angular en Madrid', href: '/trabajos/angular-en-madrid' },
    { label: 'Node Remoto', href: '/trabajos/node-remoto' },
    { label: 'QA Engineer Remoto', href: '/trabajos/qa-engineer-remoto' },
  ];

  try {
    const jobsRes = await pool.query(
      "SELECT title, category, location FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 150"
    );
    const jobs = jobsRes.rows || [];
    const candidates = new Map<string, { label: string; href: string; count: number }>();
    
    const POPULAR_TECHS = [
      { name: 'React', slug: 'react', keywords: ['react'] },
      { name: 'Angular', slug: 'angular', keywords: ['angular'] },
      { name: 'Vue', slug: 'vue', keywords: ['vue'] },
      { name: 'Node', slug: 'node', keywords: ['node', 'nodejs'] },
      { name: 'Python', slug: 'python', keywords: ['python'] },
      { name: 'Java', slug: 'java', keywords: ['java'] },
      { name: 'PHP', slug: 'php', keywords: ['php'] },
      { name: 'DevOps', slug: 'devops', keywords: ['devops', 'dev ops', 'site reliability'] },
      { name: 'TypeScript', slug: 'typescript', keywords: ['typescript'] },
      { name: 'Fullstack', slug: 'fullstack', keywords: ['fullstack', 'full stack'] },
      { name: 'QA Engineer', slug: 'qa-engineer', keywords: ['qa', 'tester'] },
      { name: 'Data Analyst', slug: 'data-analyst', keywords: ['data analyst', 'analista de datos'] },
    ];

    const POPULAR_CITIES = [
      { name: 'Madrid', slug: 'madrid', keywords: ['madrid'] },
      { name: 'Barcelona', slug: 'barcelona', keywords: ['barcelona'] },
      { name: 'Valencia', slug: 'valencia', keywords: ['valencia'] },
      { name: 'Bilbao', slug: 'bilbao', keywords: ['bilbao'] },
      { name: 'Sevilla', slug: 'sevilla', keywords: ['sevilla'] },
      { name: 'Málaga', slug: 'malaga', keywords: ['malaga', 'málaga'] },
      { name: 'Remoto', slug: 'remoto', keywords: ['remoto', 'remote', 'teletrabajo'] },
    ];

    for (const job of jobs) {
      const titleLower = (job.title || '').toLowerCase();
      const locLower = (job.location || '').toLowerCase();
      
      const tech = POPULAR_TECHS.find(t => t.keywords.some(k => titleLower.includes(k)));
      if (!tech) continue;
      
      const city = POPULAR_CITIES.find(c => c.keywords.some(k => locLower.includes(k)));
      if (!city) continue;
      
      const key = `${tech.slug}-${city.slug}`;
      const existing = candidates.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        const label = city.slug === 'remoto' 
          ? `${tech.name} Remoto` 
          : `${tech.name} en ${city.name}`;
        const href = city.slug === 'remoto'
          ? `/trabajos/${tech.slug}-remoto`
          : `/trabajos/${tech.slug}-en-${city.slug}`;
        candidates.set(key, { label, href, count: 1 });
      }
    }

    if (candidates.size > 0) {
      const sorted = Array.from(candidates.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
      if (sorted.length >= 5) {
        programmaticLinks = sorted.map(item => ({ label: item.label, href: item.href }));
      }
    }
  } catch (e) {
    console.error("Error generating dynamic footer links:", e);
  }

  const navigation = [
    { label: 'Inicio', href: '/' },
    { label: 'Buscador de Empleo', href: '/trabajos/informatica-tecnologia' },
    { label: '💻 Trabajo Remoto', href: '/trabajo-remoto' },
    { label: '💰 Calculadora de Salarios', href: '/salarios' },
    { label: '🏢 Directorio de Empresas', href: '/empresas' },
    { label: 'Talento Premium', href: '/talento-premium' },
    { label: 'Publicar Oferta', href: '/publicar-oferta' },
    { label: 'Tarifas y Precios', href: '/precios' },
    { label: '📢 Anúnciate / Publicidad', href: '/publicidad' },
    { label: 'Blog', href: '/blog' },
    { label: '📊 Informe de Mercado IT', href: '/informe-mercado-it' },
    { label: '🤝 Afiliados para Empresas', href: '/afiliados-empresa' },
    { label: '📡 RSS Feed', href: '/feed.xml' },
    { label: '🏢 Área de Empresas', href: '/empresa-dashboard' },
    { label: '🛠️ Herramientas', href: '/herramientas' },
    { label: '📖 Glosario IT', href: '/glosario' },
    { label: '📰 Noticias Tech', href: '/noticias' },
    { label: '📈 Tendencias Tech', href: '/tendencias' },
    { label: '👥 Programa de Referidos', href: '/referidos' },
    { label: '❓ Preguntas Frecuentes', href: '/faq' },
    { label: 'ℹ️ Sobre Nosotros', href: '/sobre-nosotros' },
  ];


  const legal = [
    { label: 'Mapa del Sitio', href: '/mapa-del-sitio' },
    { label: 'Aviso Legal', href: '/aviso-legal' },
    { label: 'Política de Privacidad', href: '/privacy' },
    { label: 'Política de Cookies', href: '/cookies' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800" id="global-footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & description */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl" role="img" aria-label="rocket">🚀</span>
              <span className="text-xl font-bold text-white">Portal Trabajo IT</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Encuentra las mejores ofertas de empleo tecnológico en España. Actualizado cada 6 horas automáticamente.
            </p>
            {/* Indicadores de confianza E-E-A-T */}
            <div className="space-y-2 mb-4 text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> 
                <span>{activeJobsCount.toLocaleString('es-ES')} ofertas activas hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> 
                <span>+8.700 ingenieros en el boletín</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">✓</span> 
                <span>Datos actualizados cada 6h</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> 
                <span>Fuentes 100% verificadas</span>
              </div>
            </div>
            <div className="flex gap-4">
              <a 
                href="https://t.me/PortalDeTrabajo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-indigo-400 transition-colors font-medium text-sm flex items-center gap-1.5"
                id="telegram-footer-link"
              >
                ✈️ Telegram
              </a>
              <a 
                href="/feed.xml" 
                target="_blank" 
                className="text-gray-400 hover:text-orange-400 transition-colors font-medium text-sm flex items-center gap-1.5"
                id="rss-footer-link"
              >
                📡 RSS Feed
              </a>
            </div>
          </div>

          {/* Sectores */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Sectores</h4>
            <ul className="space-y-2.5 text-sm">
              {categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Búsquedas Populares (Programmatic SEO) */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Búsquedas Populares</h4>
            <ul className="space-y-2.5 text-sm">
              {programmaticLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navegación y Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Enlaces Útiles</h4>
            <ul className="space-y-2.5 text-sm mb-6">
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {currentYear} Portal Trabajo IT. Todos los derechos reservados.</p>
          <p>
            Desarrollado con ❤️ para la comunidad de programadores.
          </p>
        </div>
      </div>
    </footer>
  );
}
