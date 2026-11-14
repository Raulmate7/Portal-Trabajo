import Link from 'next/link';
import pool from '@/lib/db';
import { unstable_cache } from 'next/cache';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';

// ─── Funciones cacheadas con TTL de 1 hora ────────────────────────────────────
// Evitan ejecutar SQL en cada request de usuario para datos que cambian poco.
const getCachedJobsCount = unstable_cache(
  async (): Promise<number | null> => {
    try {
      const res = await pool.query("SELECT COUNT(*) as count FROM jobs WHERE is_active = TRUE");
      const parsed = parseInt(String(res.rows[0]?.count ?? ''), 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    } catch {
      return null;
    }
  },
  ['footer-jobs-count'],
  { revalidate: 3600, tags: ['footer'] }
);

const getCachedProgrammaticLinks = unstable_cache(
  async () => {
    const DEFAULT_LINKS = [
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
          const label = city.slug === 'remoto' ? `${tech.name} Remoto` : `${tech.name} en ${city.name}`;
          const href = city.slug === 'remoto' ? `/trabajos/${tech.slug}-remoto` : `/trabajos/${tech.slug}-en-${city.slug}`;
          candidates.set(key, { label, href, count: 1 });
        }
      }
      if (candidates.size > 0) {
        const sorted = Array.from(candidates.values()).sort((a, b) => b.count - a.count).slice(0, 15);
        if (sorted.length >= 5) return sorted.map(item => ({ label: item.label, href: item.href }));
      }
    } catch (e) {
      console.error("Error generating dynamic footer links:", e);
    }
    return DEFAULT_LINKS;
  },
  ['footer-programmatic-links'],
  { revalidate: 3600, tags: ['footer'] }
);
// ─────────────────────────────────────────────────────────────────────────────

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  // Datos cacheados: solo se ejecuta SQL una vez por hora por el servidor
  const [activeJobsCount, programmaticLinks] = await Promise.all([
    getCachedJobsCount(),
    getCachedProgrammaticLinks(),
  ]);

  const categories = [
    { label: 'Desarrollo Frontend', href: '/trabajos/frontend' },
    { label: 'Desarrollo Backend', href: '/trabajos/backend' },
    { label: 'Data & Inteligencia Artificial', href: '/trabajos/data' },
    { label: 'Cloud & DevOps', href: '/trabajos/cloud' },
    { label: 'Desarrollo Mobile', href: '/trabajos/mobile' },
  ];

  const navigation = [
    { label: 'Inicio', href: '/' },
    { label: 'Buscador de Empleo', href: '/trabajos/informatica-tecnologia' },
    { label: 'Trabajo Remoto', href: '/trabajo-remoto' },
    { label: 'Empresas en Remoto', href: '/empresas-remotas' },
    { label: 'Calculadora de Salarios', href: '/salarios' },
    { label: 'Salarios por Nivel de Experiencia', href: '/salarios/por-nivel' },
    { label: 'Salarios por Empresa', href: '/salarios/por-empresa' },
    { label: 'Guía de Salarios IT', href: '/recursos/guia-salarios-it' },
    { label: 'Preguntas de Entrevistas', href: '/entrevistas' },
    { label: 'Hub de Guías de Carrera IT', href: '/convertirse-en' },
    { label: 'Prácticas y Becas IT', href: '/practicas-informatica' },
    { label: 'Directorio de Comparativas', href: '/comparar' },
    { label: 'Directorio de Empresas', href: '/empresas' },
    { label: 'Talento Premium', href: '/talento-premium' },
    { label: 'Publicar Oferta', href: '/publicar-oferta' },
    { label: 'Tarifas y Precios', href: '/precios' },
    { label: 'Anúnciate / Publicidad', href: '/publicidad' },
    { label: 'Blog', href: '/blog' },
    { label: 'Informe de Mercado IT', href: '/informe-mercado-it' },
    { label: 'Afiliados para Empresas', href: '/afiliados-empresa' },
    { label: 'RSS Feed', href: '/feed.xml' },
    { label: 'Área de Empresas', href: '/empresa-dashboard' },
    { label: 'Herramientas', href: '/herramientas' },
    { label: 'Glosario IT', href: '/glosario' },
    { label: 'Noticias Tech', href: '/noticias' },
    { label: 'Tendencias Tech', href: '/tendencias' },
    { label: 'Programa de Referidos', href: '/referidos' },
    { label: 'Preguntas Frecuentes', href: '/faq' },
    { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
  ];


  const legal = [
    { label: 'Mapa del Sitio', href: '/mapa-del-sitio' },
    { label: 'Aviso Legal', href: '/aviso-legal' },
    { label: 'Términos y Condiciones', href: '/terminos' },
    { label: 'Política de Privacidad', href: '/privacy' },
    { label: 'Política de Cookies', href: '/cookies' },
    { label: 'Declaración de Accesibilidad', href: '/accesibilidad' },
    { label: 'PortalTrabajoITBot', href: '/bot' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <footer className="bg-[#090C10] text-slate-400 border-t border-white/[0.08]" id="global-footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & description */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
                &lt;/&gt;
              </span>
              <span className="text-sm font-semibold tracking-tight text-white">Portal Trabajo IT</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Agregador especializado de empleo tecnológico en España y remoto. Actualizado cada 6 horas automáticamente.
            </p>
            {/* Indicadores de confianza E-E-A-T */}
            <div className="space-y-2 mb-5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  {activeJobsCount !== null ? (
                    <>
                      <span className="font-mono tabular-nums text-emerald-400 font-medium">{activeJobsCount.toLocaleString('es-ES')}</span> ofertas activas hoy
                    </>
                  ) : 'Ofertas tecnológicas activas hoy'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>Comunidad activa de profesionales IT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                <span>Sincronización cada 6h</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                <span>Fuentes verificadas</span>
              </div>
            </div>
            <div className="flex gap-4">
              <a 
                href="https://t.me/PortalDeTrabajo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors font-mono text-xs flex items-center gap-1.5"
                id="telegram-footer-link"
              >
                Telegram →
              </a>
              <a 
                href="/feed.xml" 
                target="_blank" 
                className="text-slate-400 hover:text-white transition-colors font-mono text-xs flex items-center gap-1.5"
                id="rss-footer-link"
              >
                RSS Feed →
              </a>
            </div>
          </div>

          {/* Sectores */}
          <div>
            <h4 className="text-white font-mono font-semibold mb-4 text-[11px] uppercase tracking-wider">Sectores</h4>
            <ul className="space-y-2 text-xs">
              {categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-slate-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Búsquedas Populares (Programmatic SEO) */}
          <div>
            <h4 className="text-white font-mono font-semibold mb-4 text-[11px] uppercase tracking-wider">Búsquedas Populares</h4>
            <ul className="space-y-2 text-xs">
              {programmaticLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-slate-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navegación y Legal */}
          <div>
            <h4 className="text-white font-mono font-semibold mb-4 text-[11px] uppercase tracking-wider">Enlaces Útiles</h4>
            <ul className="space-y-2 text-xs mb-6">
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-slate-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-white font-mono font-semibold mb-3 text-[11px] uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors text-slate-400">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookiePreferencesButton />
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p className="font-mono">© {currentYear} Portal Trabajo IT</p>
          <p>
            Infraestructura de empleo tecnológico en España.
          </p>
        </div>
      </div>
    </footer>
  );
}
