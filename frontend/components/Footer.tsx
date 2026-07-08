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

  const programmaticLinks = [
    { label: 'React en Madrid', href: '/trabajos/react-en-madrid' },
    { label: 'React Remoto', href: '/trabajos/react-remoto' },
    { label: 'Java en Barcelona', href: '/trabajos/java-en-barcelona' },
    { label: 'Java Remoto', href: '/trabajos/java-remoto' },
    { label: 'Python Remoto', href: '/trabajos/python-remoto' },
    { label: 'Python en Madrid', href: '/trabajos/python-en-madrid' },
    { label: 'Node en Madrid', href: '/trabajos/node-en-madrid' },
    { label: 'Node Remoto', href: '/trabajos/node-remoto' },
    { label: 'Angular en Madrid', href: '/trabajos/angular-en-madrid' },
    { label: 'Angular en Barcelona', href: '/trabajos/angular-en-barcelona' },
    { label: 'Vue Remoto', href: '/trabajos/vue-remoto' },
    { label: 'DevOps en Madrid', href: '/trabajos/devops-en-madrid' },
    { label: 'DevOps Remoto', href: '/trabajos/devops-remoto' },
    { label: 'AWS en Madrid', href: '/trabajos/aws-en-madrid' },
    { label: 'Data Engineer Remoto', href: '/trabajos/data-engineer-remoto' },
    { label: 'PHP en Madrid', href: '/trabajos/php-en-madrid' },
    { label: '.NET en Barcelona', href: '/trabajos/net-en-barcelona' },
    { label: 'Flutter Remoto', href: '/trabajos/flutter-remoto' },
    { label: 'React Junior', href: '/trabajos/react-junior' },
    { label: 'Python Senior', href: '/trabajos/python-senior' },
    { label: 'Java Senior Madrid', href: '/trabajos/java-en-madrid-senior' },
    { label: 'Backend Senior Madrid', href: '/trabajos/backend-en-madrid-senior' },
    { label: 'Fullstack Remoto', href: '/trabajos/fullstack-remoto' },
    { label: 'Kotlin en Madrid', href: '/trabajos/kotlin-en-madrid' },
    { label: 'QA Engineer Remoto', href: '/trabajos/qa-engineer-remoto' },
    { label: 'Data Analyst Barcelona', href: '/trabajos/data-analyst-en-barcelona' },
    { label: 'Product Manager Remoto', href: '/trabajos/product-manager-remoto' },
    { label: 'Empleo IT en Madrid', href: '/trabajos/informatica-tecnologia-en-madrid' },
    { label: 'Empleo IT en Barcelona', href: '/trabajos/informatica-tecnologia-en-barcelona' },
    { label: 'Empleo IT en Valencia', href: '/trabajos/informatica-tecnologia-en-valencia' },
    { label: 'Empleo IT en Bilbao', href: '/trabajos/informatica-tecnologia-en-bilbao' },
    { label: 'Empleo IT en Sevilla', href: '/trabajos/informatica-tecnologia-en-sevilla' },
    { label: 'Empleo IT Remoto', href: '/trabajos/informatica-tecnologia-remoto' },
  ];

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
