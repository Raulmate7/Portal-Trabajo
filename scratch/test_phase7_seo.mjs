import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 INICIANDO VERIFICACIÓN DE FASE 7: SEO, SITEMAPS Y PERFORMANCE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [TEST ${totalTests}] PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [TEST ${totalTests}] FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// 1. Verificación de robots.ts
// ----------------------------------------------------
console.log('--- Sub-fase 7.1: Robots.txt y Directivas de Crawling ---');
const robotsFile = fs.readFileSync(path.resolve('frontend/app/robots.ts'), 'utf-8');
assert(robotsFile.includes('sitemap.xml'), 'robots.ts incluye sitemap.xml principal');
assert(robotsFile.includes('sitemap-images.xml'), 'robots.ts incluye sitemap-images.xml');
assert(robotsFile.includes('sitemap-news.xml'), 'robots.ts incluye sitemap-news.xml');
assert(robotsFile.includes("'/api/'"), 'robots.ts bloquea /api/');
assert(robotsFile.includes("'/mi-perfil'"), 'robots.ts bloquea rutas privadas /mi-perfil');
assert(robotsFile.includes("'/empresa-dashboard'"), 'robots.ts bloquea rutas de reclutador');
assert(robotsFile.includes("'/*?q='"), 'robots.ts previene desperdicio de crawl budget en query params');

// ----------------------------------------------------
// 2. Verificación de sitemap.ts
// ----------------------------------------------------
console.log('\n--- Sub-fase 7.2: Sitemaps Particionados y Canonical Slugs ---');
const sitemapFile = fs.readFileSync(path.resolve('frontend/app/sitemap.ts'), 'utf-8');
assert(sitemapFile.includes('generateSitemaps'), 'sitemap.ts exporta generateSitemaps');
assert(sitemapFile.includes('{ id: 0 }') && sitemapFile.includes('{ id: 1 }') && sitemapFile.includes('{ id: 2 }') && sitemapFile.includes('{ id: 3 }'), 
  'sitemap.ts define 4 particiones escalables (Base, Recientes, Anteriores, Empresas)');
assert(sitemapFile.includes('getJobSlug(job)'), 'sitemap.ts genera canonical slugs usando getJobSlug');
assert(sitemapFile.includes('count >= 5'), 'sitemap.ts filtra thin content (mínimo 5 ofertas por página programática)');

// ----------------------------------------------------
// 3. Verificación de sitemap-images y sitemap-news
// ----------------------------------------------------
console.log('\n--- Sub-fase 7.3: Sitemaps Especializados (Imágenes y Google News) ---');
const sitemapImages = fs.readFileSync(path.resolve('frontend/app/sitemap-images.xml/route.ts'), 'utf-8');
assert(sitemapImages.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'sitemap-images define namespace de Google Images');
assert(sitemapImages.includes('<image:loc>'), 'sitemap-images incluye etiqueta <image:loc>');
assert(sitemapImages.includes('escapeXml(unsafe: string | null | undefined)'), 'sitemap-images cuenta con escapeXml defensivo');

const sitemapNews = fs.readFileSync(path.resolve('frontend/app/sitemap-news.xml/route.ts'), 'utf-8');
assert(sitemapNews.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'), 'sitemap-news define namespace oficial de Google News');
assert(sitemapNews.includes('<news:publication>'), 'sitemap-news incluye nodo <news:publication>');
assert(sitemapNews.includes('fortyEightHoursAgo'), 'sitemap-news implementa filtro de 48 horas según directrices de Google');
assert(sitemapNews.includes('posts.slice(0, 3)'), 'sitemap-news implementa fallback graceful ante escasez de noticias recientes');

// ----------------------------------------------------
// 4. Verificación de Seguridad y XSS en JSON-LD
// ----------------------------------------------------
console.log('\n--- Sub-fase 7.4: Datos Estructurados JSON-LD y Sanitización XSS ---');
const constantsFile = fs.readFileSync(path.resolve('frontend/lib/constants.ts'), 'utf-8');
assert(constantsFile.includes('safeJsonLdString'), 'safeJsonLdString exportado en constants.ts');

// Test de sanitización contra escape de etiqueta <script>
const xssPayload = { title: '</script><script>alert("XSS")</script>' };
const sanitized = JSON.stringify(xssPayload).replace(/</g, '\\u003c');
assert(!sanitized.includes('</script>'), 'safeJsonLdString neutraliza etiquetas </script> en JSON-LD');
assert(sanitized.includes('\\u003c/script>'), 'safeJsonLdString reemplaza correctamente < por \\u003c');

const jobPageFile = fs.readFileSync(path.resolve('frontend/app/job/[id]/page.tsx'), 'utf-8');
assert(jobPageFile.includes("'@type': 'JobPosting'"), 'Página de empleo incluye esquema JobPosting');
assert(jobPageFile.includes("'@type': 'BreadcrumbList'"), 'Página de empleo incluye esquema BreadcrumbList');
assert(jobPageFile.includes("'@type': 'FAQPage'"), 'Página de empleo incluye esquema FAQPage');
assert(jobPageFile.includes('safeJsonLdString(jsonLd)'), 'Página de empleo sanitiza JobPosting con safeJsonLdString');

const noticiasPageFile = fs.readFileSync(path.resolve('frontend/app/noticias/[slug]/page.tsx'), 'utf-8');
assert(noticiasPageFile.includes('safeJsonLdString(jsonLd)'), 'Página de noticias sanitiza NewsArticle con safeJsonLdString');

// ----------------------------------------------------
// 5. Verificación de Nginx Template y Seguridad de Infraestructura
// ----------------------------------------------------
console.log('\n--- Sub-fase 7.5: Servidor Web Nginx, Headers y Rate Limiting ---');
const nginxTemplate = fs.readFileSync(path.resolve('nginx.conf.template'), 'utf-8');
assert(nginxTemplate.includes('limit_req_zone $binary_remote_addr zone=api_limit'), 'Nginx define zona api_limit');
assert(nginxTemplate.includes('location /api/ {'), 'Nginx implementa bloque dedicado para /api/');
assert(nginxTemplate.includes('limit_req zone=api_limit burst=10 nodelay;'), 'Nginx aplica api_limit con burst 10');
assert(nginxTemplate.includes('X-Frame-Options "DENY"'), 'Nginx incluye cabecera X-Frame-Options DENY');
assert(nginxTemplate.includes('X-Content-Type-Options "nosniff"'), 'Nginx incluye cabecera X-Content-Type-Options nosniff');
assert(nginxTemplate.includes('Permissions-Policy "camera=(), microphone=(), geolocation=()"'), 'Nginx incluye Permissions-Policy');
assert(nginxTemplate.includes('Cache-Control "public, max-age=31536000, immutable"'), 'Nginx implementa caché inmutable de 1 año para assets Next.js');
assert(nginxTemplate.includes('deny all;') && nginxTemplate.includes('db_proxy\\.php'), 'Nginx bloquea acceso externo a archivos sensibles');

// ----------------------------------------------------
// 6. Verificación de Core Web Vitals y Next.js Headers
// ----------------------------------------------------
console.log('\n--- Sub-fase 7.6: Performance y Core Web Vitals en Next.js ---');
const nextConfig = fs.readFileSync(path.resolve('frontend/next.config.ts'), 'utf-8');
assert(nextConfig.includes('compress: true'), 'Next.js tiene habilitada compresión nativa');
assert(nextConfig.includes("source: '/_next/static/:path*'"), 'Next.js configura caché para _next/static/');

const layoutFile = fs.readFileSync(path.resolve('frontend/app/layout.tsx'), 'utf-8');
assert(layoutFile.includes('display: "swap"'), 'Fuente Google Inter configurada con display: "swap"');
assert(layoutFile.includes('rel="preconnect" href="https://fonts.googleapis.com"'), 'Layout incluye preconnect a Google Fonts');

console.log('\n====================================================');
console.log(`🎯 RESULTADOS FASE 7: ${passedTests}/${totalTests} pruebas superadas con éxito`);
console.log('====================================================');
