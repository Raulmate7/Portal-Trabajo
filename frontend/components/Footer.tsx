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
        "SELECT title, category, location FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1500"
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
        const tech = POPULAR_TECHS.find((t) => t.keywords.some((k) => titleLower.includes(k)));
        if (!tech) continue;
        const city = POPULAR_CITIES.find((c) => c.keywords.some((k) => locLower.includes(k)));
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
        const sorted = Array.from(candidates.values()).sort((a, b) => b.count - a.count).slice(0, 12);
        if (sorted.length >= 5) return sorted.map((item) => ({ label: item.label, href: item.href }));
      }
    } catch (e) {
      console.error('Error generating dynamic footer links:', e);
    }
    return DEFAULT_LINKS;
  },
  ['footer-programmatic-links'],
  { revalidate: 86400, tags: ['footer'] }
);
// ─────────────────────────────────────────────────────────────────────────────

export default async function Footer() {
  const currentYear = new Date().getFullYear();

  const [activeJobsCount, programmaticLinks] = await Promise.all([
    getCachedJobsCount(),
    getCachedProgrammaticLinks(),
  ]);

  const categories = [
    { label: 'Desarrollo Frontend', href: '/trabajos/frontend' },
    { label: 'Desarrollo Backend', href: '/trabajos/backend' },
    { label: 'Cloud & DevOps', href: '/trabajos/cloud' },
    { label: 'Data & Inteligencia Artificial', href: '/trabajos/data' },
    { label: 'Ciberseguridad', href: '/trabajos/ciberseguridad' },
    { label: 'Desarrollo Mobile', href: '/trabajos/mobile' },
    { label: 'Empresas en Remoto', href: '/empresas-remotas' },
    { label: 'Prácticas y Becas IT', href: '/practicas-informatica' },
  ];

  const toolsAndResources = [
    { label: 'Calculadora de Salarios', href: '/salarios' },
    { label: 'Salarios por Nivel', href: '/salarios/por-nivel' },
    { label: 'Salarios por Empresa', href: '/salarios/por-empresa' },
    { label: 'Comparador IT', href: '/comparar' },
    { label: 'Mapa de Empleo IT', href: '/mapa-empleo' },
    { label: 'Tendencias Tech', href: '/tendencias' },
    { label: 'Área de Empresas', href: '/empresa-dashboard' },
    { label: 'Publicar Oferta', href: '/publicar-oferta' },
    { label: 'Blog de Ingeniería', href: '/blog' },
    { label: 'Informe Mercado IT', href: '/informe-mercado-it' },
    { label: 'Glosario IT', href: '/glosario' },
    { label: 'Noticias Tech', href: '/noticias' },
    { label: 'Entrevistas Técnicas', href: '/entrevistas' },
    { label: 'Guías de Carrera', href: '/convertirse-en' },
  ];

  const legal = [
    { label: 'Aviso Legal', href: '/aviso-legal' },
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Términos y Condiciones', href: '/terminos' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Accesibilidad', href: '/accesibilidad' },
    { label: 'Mapa del Sitio', href: '/mapa-del-sitio' },
    { label: 'PortalTrabajoITBot', href: '/bot' },
    { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { label: 'Preguntas Frecuentes', href: '/faq' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <footer
      className="closing bg-[var(--p-inv-bg)] text-[var(--p-inv-muted)] border-t border-white/12"
      id="global-footer"
    >
      <div className="wrap py-12 md:py-16">
        {/* Fila 1: close-type */}
        <div className="pb-10 mb-10 border-b border-white/12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-[clamp(1.75rem,2.4vw+0.75rem,2.5rem)] font-medium tracking-[-0.035em] leading-[1.1] text-[var(--p-inv-ink)] mb-3">
              Encuentra tu próximo rol técnico o publica una vacante verificada
            </h2>
            <p className="font-mono text-[13px] tabular-nums text-[var(--p-inv-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] shrink-0" aria-hidden="true" />
              <span>
                {activeJobsCount !== null
                  ? `Sincronización automática cada 6 horas · ${activeJobsCount.toLocaleString('es-ES')} vacantes activas hoy`
                  : 'Sincronización automática cada 6 horas · Vacantes tecnológicas verificadas'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/trabajos/informatica-tecnologia" className="btn-primary whitespace-nowrap">
              Explorar vacantes →
            </Link>
            <Link
              href="/publicar-oferta"
              className="btn-secondary !bg-transparent !text-[var(--p-inv-ink)] !border-white/25 hover:!bg-white/10 whitespace-nowrap"
            >
              Publicar oferta →
            </Link>
          </div>
        </div>

        {/* Fila 2: footer-dark (12-column directory) */}
        <div className="grid-12 mb-12">
          {/* Col 1-3: Brand & Live Status */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 text-[var(--p-inv-ink)] no-underline">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="4" width="14" height="3.5" rx="1" fill="var(--p-inv-accent)" />
                <rect x="6" y="10.25" width="16" height="3.5" rx="1" fill="var(--p-inv-ink)" />
                <rect x="2" y="16.5" width="12" height="3.5" rx="1" fill="var(--p-inv-ink)" />
              </svg>
              <span className="text-[16px] font-medium tracking-[-0.02em]">Portal Trabajo IT</span>
            </Link>
            <p className="text-[14px] leading-relaxed text-[var(--p-inv-muted)] mb-5">
              Agregador e infraestructura de inteligencia laboral tecnológica en España y remoto. Fuentes verificadas y transparencia salarial.
            </p>
            <div className="flex flex-wrap gap-4 font-mono text-[13px]">
              <a
                href="https://t.me/PortalDeTrabajo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--p-inv-ink)] hover:text-[var(--p-inv-accent)] transition-colors inline-flex items-center min-h-[44px]"
                id="telegram-footer-link"
              >
                Telegram →
              </a>
              <a
                href="/feed.xml"
                target="_blank"
                className="text-[var(--p-inv-ink)] hover:text-[var(--p-inv-accent)] transition-colors inline-flex items-center min-h-[44px]"
                id="rss-footer-link"
              >
                RSS Feed →
              </a>
            </div>
          </div>

          {/* Col 4-6: Sectores y Stacks */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <h3 className="font-mono text-[13px] font-medium text-[var(--p-inv-ink)] mb-4">
              Sectores y Stacks
            </h3>
            <ul className="space-y-2 text-[14px]">
              {categories.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 7-9: Búsquedas Frecuentes pSEO */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <h3 className="font-mono text-[13px] font-medium text-[var(--p-inv-ink)] mb-4">
              Búsquedas Frecuentes pSEO
            </h3>
            <ul className="space-y-2 text-[14px]">
              {programmaticLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 10-12: Herramientas y Legal */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <h3 className="font-mono text-[13px] font-medium text-[var(--p-inv-ink)] mb-4">
              Herramientas y Legal
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
              {toolsAndResources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="col-span-2 pt-1">
                <CookiePreferencesButton />
              </li>
            </ul>
          </div>
        </div>

        {/* Fila Legal Inferior */}
        <div className="pt-6 border-t border-white/12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-[13px] text-[var(--p-inv-muted)]">
          <p className="m-0">© {currentYear} Portal Trabajo IT</p>
          <p className="m-0">Infraestructura de empleo tecnológico en España.</p>
        </div>
      </div>
    </footer>
  );
}
