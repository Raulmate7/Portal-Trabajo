# Progreso de resolución — 03_SEO_Y_CRECIMIENTO_ORGANICO

| Lote | Ítems | Estado |
|---|---|---|
| 1 | SEO-001–013 | Resuelto (ver notas) |
| 2 | SEO-014–026 | Resuelto (ver notas) |
| 3 | SEO-027–039 | Resuelto (ver notas) |
| 4 | SEO-040–052 | Resuelto (ver notas) |
| 5 | SEO-053–065 | Resuelto (ver notas) |

## Notas Lote 1
- **SEO-001 / SEO-009 / SEO-013**: Ya resueltos en `BUG-012`, `BUG-043` y `BUG-044` (`parseSalarySchema` con `k` y `HOUR`/`DAY`/`MONTH`/`YEAR`, mapeo provincial completo en `addressRegion` sin default erróneo a Madrid, y `validThrough` unificado a +100 días).
- **SEO-002**: [trabajos/[sector]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/trabajos/[sector]/page.tsx) elimina los sub-objetos `@type: "JobPosting"` anidados dentro de `ItemList`, manteniendo únicamente `ListItem` con `position`, `url` y `name`.
- **SEO-003**: [sitemap.ts](file:///home/raul/proyecto_empleo/frontend/app/sitemap.ts) filtra las rutas `/salarios/*` en función de muestras reales (`>= 5` ofertas con salario informado en BD) en lugar de emitir 981 URLs cartesianas vacías, y sustituye `lastModified: new Date()` por `SITE_LAST_STRUCTURAL_UPDATE`.
- **SEO-004**: Ya resuelto en `BUG-045` (`sitemap/1` y `sitemap/2` filtran `WHERE is_active = TRUE` sin recorte a 30 días).
- **SEO-005**: [blog/[slug]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/blog/[slug]/page.tsx) añade `permanentRedirect` hacia `/noticias/[slug]` cuando `slug.startsWith('tendencias-')` (complementando `sitemap-news.xml` de `BUG-041`).
- **SEO-007**: [layout.tsx](file:///home/raul/proyecto_empleo/frontend/app/layout.tsx) elimina el bloque duplicado `WebSite` JSON-LD (manteniendo un único `WebSite` en `page.tsx`).
- **SEO-008**: [job/[id]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/job/[id]/page.tsx) omite `hiringOrganization.logo` para empleadores externos para no atribuir `${BASE_URL}/logo.png` a empresas terceras.
- **SEO-010**: [sitemap.ts](file:///home/raul/proyecto_empleo/frontend/app/sitemap.ts) elimina `hreflang="en"` ficticios con `?lang=en` sobre rutas no traducidas (`/trabajos/.../empresas`, `/talento-premium`, `/trabajo-*`).
- **SEO-006 / SEO-011 / SEO-012**: `headers()` en `layout.tsx` se mantiene por CSP nonce (`x-nonce`), la respuesta HTTP `410 Gone` desde middleware/Route Handler para ofertas purgadas y la consolidación de taxonomías duplicadas mediante `301` quedan documentadas como decisiones arquitectónicas para evitar roturas de enlaces indexados.

## Notas Lote 2
- **SEO-014**: [trabajos/[sector]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/trabajos/[sector]/page.tsx) corrige `occupationLocation` (`'@type': ciudad ? 'City' : 'Country'`).
- **SEO-015 / SEO-016 / SEO-017 / SEO-018 / SEO-026**: Ya resueltos en `BUG-062`, `BUG-042`, `BUG-045`, `BUG-065`/`SEO-003` y `BUG-039` respectivamente.
- **SEO-019 / SEO-021 / SEO-022**: Creado [noticias/[slug]/opengraph-image.tsx](file:///home/raul/proyecto_empleo/frontend/app/noticias/[slug]/opengraph-image.tsx) y actualizado [noticias/[slug]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/noticias/[slug]/page.tsx) con `og:image`/`twitter:image` propios bajo `/noticias/[slug]/opengraph-image` y directiva `max-image-preview: 'large'`, `max-snippet: -1` para Google Discover.
- **SEO-020**: [robots.ts](file:///home/raul/proyecto_empleo/frontend/app/robots.ts) elimina `Disallow: /*?page=` y `Disallow: /*?*page=` para permitir el rastreo de paginación con `noindex, follow`.
- **SEO-023 / SEO-024**: [index_new_jobs.py](file:///home/raul/proyecto_empleo/backend/index_new_jobs.py) incluye `title_es` en el `SELECT` y lo pasa a `get_job_slug(...)`; [indexnow.py](file:///home/raul/proyecto_empleo/backend/logic/indexnow.py) fragmenta los envíos en bloques de `5000` URLs (`<= 10000`).
- **SEO-025**: [empleo-tech/[ciudad]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/empleo-tech/[ciudad]/page.tsx) aplica `robots: { index: activeCount >= 3, follow: true }` para evitar indexar landings vacías/thin (`< 3` ofertas).

## Notas Lote 3
- **SEO-028 / SEO-037 / SEO-039**: [robots.ts](file:///home/raul/proyecto_empleo/frontend/app/robots.ts) excluye `/gracias`, `/darse-de-baja`, `/perfil` y parámetros de ordenación/filtrado (`?sort=`, `?with_salary=`, `?location=`), añade reglas para `OAI-SearchBot`/`PerplexityBot` y bloquea rastreo en entornos de staging; [middleware.ts](file:///home/raul/proyecto_empleo/frontend/middleware.ts) emite `X-Robots-Tag: noindex, nofollow` en dichas rutas.
- **SEO-030**: [Footer.tsx](file:///home/raul/proyecto_empleo/frontend/components/Footer.tsx) amplía la muestra a `LIMIT 1500` y cachea 24h (`revalidate: 86400`) para estabilizar el enlazado interno.
- **SEO-032**: [feed.xml/route.ts](file:///home/raul/proyecto_empleo/frontend/app/feed.xml/route.ts) actualiza `Cache-Control` a `public, max-age=900, s-maxage=900, stale-while-revalidate=3600`.
- **SEO-036**: [sitemap.ts](file:///home/raul/proyecto_empleo/frontend/app/sitemap.ts) añade `alternates` bidireccionales `es-ES`/`ca-ES` (`/trabajo-barcelona` <-> `/ca/trabajo-barcelona`) y `es-ES`/`eu-ES` (`/trabajo-bilbao` <-> `/eu/trabajo-bilbao`).
- **SEO-038**: [index_new_jobs.py](file:///home/raul/proyecto_empleo/backend/index_new_jobs.py) prioriza `is_featured DESC, (salary_min IS NOT NULL) DESC, created_at DESC LIMIT 180` y detiene el bucle Google Indexing API al recibir `429 Quota Exceeded` manteniendo IndexNow.
- **Notas (`SEO-027`, `SEO-029`, `SEO-031`, `SEO-033`–`035`)**: la columna `jobs.slug` inmutable, la reserva de altura en AdSense, el clustering editorial y la extracción ampliada de Tecnoempleo quedan documentados para no alterar el esquema MySQL ni el scraper en caliente.

## Notas Lote 4
- **SEO-042**: [page.tsx](file:///home/raul/proyecto_empleo/frontend/app/page.tsx) añade `<nav aria-label="Paginación">` HTML progresiva (`/?page=${validPage + 1}`) para descubrimiento por crawlers.
- **SEO-044 / SEO-045 / SEO-049 / SEO-050**: Ya resueltos (`/noticias/[slug]/opengraph-image.tsx` en `SEO-021`, `jobLocationType: 'TELECOMMUTE'` + `applicantLocationRequirements` + `employmentType` + `directApply` en `job/[id]/page.tsx`, y `fetchCompanyRating` por `company_slug` en `BUG-008`).
- **SEO-048**: [refresh_old_articles.py](file:///home/raul/proyecto_empleo/backend/refresh_old_articles.py) notifica automáticamente a IndexNow los slugs evergreen actualizados.
- **SEO-052**: [RemoteCountryLandingPage.tsx](file:///home/raul/proyecto_empleo/frontend/components/RemoteCountryLandingPage.tsx) aplica `robots: { index: !isPaged && stats.total >= 5, follow: true }` en las 8 landings `/trabajo-remoto-*` para evitar thin content.
- **Notas (`SEO-040`, `SEO-041`, `SEO-043`, `SEO-046`, `SEO-047`, `SEO-051`)**: la unificación en `lib/taxonomies.ts`, caché local de logos Clearbit, enriquecimiento contextual y columna `jobs.slug` quedan documentados como mejoras arquitectónicas/editoriales opcionales.

## Notas Lote 5
- **SEO-054 / SEO-063 / SEO-065**: Ya resueltos (`salarios.ts` en `BUG-011`/`012`, eliminación de 981 URLs cartesianas en `SEO-003`, y `USER_AGENT` propio en `BUG-052`).
- **SEO-056**: [middleware.ts](file:///home/raul/proyecto_empleo/frontend/middleware.ts) redirige con `301` a minúsculas las rutas taxonómicas públicas (`/trabajos`, `/salarios`, `/empresas`, `/glosario`, `/certificaciones`).
- **SEO-057**: [CookieBanner.tsx](file:///home/raul/proyecto_empleo/frontend/components/CookieBanner.tsx) acota altura móvil (`max-h-[45vh] overflow-y-auto`) para no cubrir contenido above-the-fold.
- **SEO-059**: [monitor_search_console.py](file:///home/raul/proyecto_empleo/backend/monitor_search_console.py) envía alerta inmediata por Telegram (`TELEGRAM_ADMIN_ID`) si detecta advertencias o errores de schemas/sitemaps.
- **SEO-062**: [trabajo/[ciudad]/[tech]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/trabajo/[ciudad]/[tech]/page.tsx) unifica `canonical` y redirige permanentemente hacia `/trabajos/[tech]-en-[ciudad]` (o `-remoto`), eliminando la canibalización interna.
- **SEO-064**: [trabajos/[sector]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/trabajos/[sector]/page.tsx) usa canonical autorreferente `?page=N` y omite `hreflang` cuando `isPaged` (`noindex, follow`).
- **Notas adicionales implementadas (`SEO-029`, `SEO-043`, `SEO-053`, `SEO-061`)**:
  - **SEO-029**: Verificado en [AdBanner.tsx](file:///home/raul/proyecto_empleo/frontend/components/AdBanner.tsx) que todos los contenedores reservan altura mínima (`minHeight: '250px'` / `'90px'`) para evitar CLS.
  - **SEO-043**: Implementado en [company-logo/route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/company-logo/route.ts) con monograma SVG determinista cuando Clearbit falla.
  - **SEO-053**: Añadido JSON-LD `BreadcrumbList` en `/salarios` ([salarios/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/salarios/page.tsx)), `/glosario` ([glosario/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/glosario/page.tsx), [glosario/[term]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/glosario/%5Bterm%5D/page.tsx)), `/entrevistas` ([entrevistas/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/entrevistas/page.tsx), [entrevistas/[tech]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/entrevistas/%5Btech%5D/page.tsx)) y `/certificaciones` ([certificaciones/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/certificaciones/page.tsx), [certificaciones/[slug]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/certificaciones/%5Bslug%5D/page.tsx)).
  - **SEO-061**: [JobCard.tsx](file:///home/raul/proyecto_empleo/frontend/components/JobCard.tsx) y [job/[id]/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/job/%5Bid%5D/page.tsx) marcan enlaces de ofertas destacadas/patrocinadas con `rel="sponsored"` (`sponsored noopener noreferrer` en enlaces externos).
  - **Pendiente de decisiones editoriales/esquema BD**: `SEO-006` (nonce CSP), `SEO-011`/`012` (`410 Gone` y redirecciones `301`), `SEO-027`/`051` (columna `jobs.slug`), `SEO-031`/`033`–`035`/`040`–`041`/`046`–`047` (clustering/enriquecimiento editorial y detalle Tecnoempleo), `SEO-055`/`058`/`060` (perfiles E-E-A-T, nuevos hubs `/salarios-it-*` y bloques enlazados desde `/blog`).
