import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
    { label: 'Python Remoto', href: '/trabajos/python-remoto' },
    { label: 'Node en Madrid', href: '/trabajos/node-en-madrid' },
    { label: 'React Junior', href: '/trabajos/react-junior' },
    { label: 'Python Senior', href: '/trabajos/python-senior' },
    { label: 'Backend Senior Madrid', href: '/trabajos/backend-en-madrid-senior' },
  ];

  const navigation = [
    { label: 'Inicio', href: '/' },
    { label: 'Buscador de Empleo', href: '/trabajos/informatica-tecnologia' },
    { label: '💰 Calculadora de Salarios', href: '/salarios' },
    { label: 'Talento Premium', href: '/talento-premium' },
    { label: 'Publicar Oferta', href: '/publicar-oferta' },
    { label: 'Blog', href: '/blog' },
  ];

  const legal = [
    { label: 'Política de Privacidad', href: '/privacy' },
    { label: 'Política de Cookies', href: '/cookies' },
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
