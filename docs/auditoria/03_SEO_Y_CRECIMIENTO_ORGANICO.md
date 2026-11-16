# 03. Auditoría de SEO Técnico, Programático e Indexación Orgánica (`SEO-001` – `SEO-065`)

> **Alcance**: Schema.org (`JobPosting`, `Occupation`, `WebSite`, `BreadcrumbList`, `FAQPage`), Google for Jobs, ciclo de vida de ofertas expiradas (`410` vs `404` vs `301`), arquitectura de SEO programático (`/trabajos`, `/salarios`, `/trabajo-*`, `/noticias`), Sitemaps XML dinámicos, IndexNow, Google Indexing API, `robots.txt` y Core Web Vitals.  
> **Total de hallazgos documentados**: 65 ítems individuales verificados sobre el código fuente actual.

---

### [SEO-001] Schema `JobPosting` en `/job/[id]` omite `baseSalary` en ofertas `"40k"` y falla el parseo de periodicidad (`< 5000`)

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 381-426, `parseSalarySchema`)
- **Diagnóstico del Problema**:
  Cuando `salary_min`/`salary_max` en BD son `NULL`, `parseSalarySchema` utiliza una regex simple `\d+` que ignora el multiplicador `k`/`K` y descarta números `< 100`. Una cadena real como `"40k - 55k €"` devuelve `null`, omitiendo por completo el campo recomendado `baseSalary` de Google for Jobs. Si el número cae entre `100` y `5000` (tarifas diarias freelance `"450€/día"`), lo etiqueta erróneamente como `"unitText": "MONTH"`.
- **Riesgo o Impacto**:
  Pérdida de elegibilidad destacada y filtros salariales en Google for Jobs para gran parte del inventario internacional y freelance, junto con emisión de datos salariales falsos.
- **Solución Óptima Propuesta**:
  Reemplazar `parseSalarySchema` por un parser unificado compartido que interprete sufijos `k`, separadores europeos/anglosajones y unidad real (`HOUR`, `DAY`, `MONTH`, `YEAR`), leyendo prioritariamente `job.salary_min` y `job.salary_max`.

### [SEO-002] Inyección de `JobPosting` dentro de `ItemList` en páginas de categoría `/trabajos/[sector]` incumpliendo directrices de Google

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 1119-1158, `itemListJsonLd`)
- **Diagnóstico del Problema**:
  Las líneas 1134-1155 incrustan objetos completos `@type: "JobPosting"` dentro de los primeros 5 `ListItem` de una página de listado/taxonomía (`/trabajos/[sector]`), además con datos incompletos (sin `baseSalary`, sin `addressRegion`, `validThrough` fijo a `+90d`, y `hiringOrganization.sameAs` apuntando a `/empresas/[slug]` de nuestro propio dominio en vez del dominio de la empresa). Las guías oficiales de Google Search Central sobre *Job Posting* prohíben expresamente marcar listados/resultados de búsqueda con `JobPosting`, reservándolo exclusivamente para la URL individual definitiva de la oferta (`/job/[id]`).
- **Riesgo o Impacto**:
  Riesgo de acción manual por datos estructurados engañosos (*Structured Data Manual Action*) o invalidación masiva de los fragmentos enriquecidos de empleo de todo el dominio en Google for Jobs.
- **Solución Óptima Propuesta**:
  Retirar los sub-objetos `@type: "JobPosting"` del `ItemList` en `/trabajos/[sector]`, dejando exclusivamente `ListItem` con `position`, `url` (`/job/[slug]`) y `name`, para concentrar toda la autoridad `JobPosting` verificada en la ficha canónica `/job/[id]`.

### [SEO-003] `sitemap/0.xml` publica 981 URLs programáticas de `/salarios/...` por producto cartesiano sin verificar masa crítica real (Thin Content)

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 548-589)
- **Diagnóstico del Problema**:
  Mientras las rutas `/trabajos/[sector]` aplican un filtro mínimo `count >= 5` en `sitemap.ts:440`, el bloque de salarios en las líneas 548-589 genera ciegamente $20 \text{ tecnologías} \times 12 \text{ ciudades} \times 3 \text{ niveles} + 20 \times 12 + 20 + 1 = 981$ URLs combinatorias (`/salarios/elixir/coruna/junior`, `/salarios/cobol/alicante/mid`, etc.) sin consultar en base de datos si existen ofertas o datos salariales suficientes para esas combinaciones, además de asignarles `lastModified: new Date()`.
- **Riesgo o Impacto**:
  Indexación masiva de cientos de URLs con 0 o <3 muestras reales (*thin/doorway content*), dilapidación de crawl budget y dilución de calidad global del dominio bajo las evaluaciones *Helpful Content / Site Reputation* de Google.
- **Solución Óptima Propuesta**:
  Consultar en MySQL el recuento real de muestras salariales válidas por `(tecnología, ciudad, nivel)` e incluir en el sitemap (y etiquetar `index, follow`) únicamente las combinaciones que superen un umbral mínimo real (por ejemplo `>= 5` ofertas con salario válido); aplicar `<meta name="robots" content="noindex, follow">` al resto.

### [SEO-004] Desfase crítico de fechas en sitemaps: `sitemap/1` y `sitemap/2` excluyen ofertas activas de entre 31 y 100 días

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 669, 701) y `backend/deactivate_expired_jobs.py` (línea 48)
- **Diagnóstico del Problema**:
  Tanto `sitemap/1` (`OFFSET 0`) como `sitemap/2` (`OFFSET 8000`) filtran `WHERE is_active = TRUE AND created_at >= NOW() - INTERVAL 30 DAY`. Sin embargo, el ciclo de vida de una vacante activa en la BD dura 100 días (`deactivate_expired_jobs.py:48`). Por otro lado, cuando la BD se conecta vía `db_proxy.php` (`$max_rows = 1000`), `LIMIT 8000` se trunca a 1.000 y `OFFSET 8000` devuelve 0 URLs (`[BUG-021]`).
- **Riesgo o Impacto**:
  Todas las vacantes vigentes entre el día 31 y el día 100 desaparecen de los sitemaps XML aunque permanecen indexables y activas, provocando pérdida de rastreo, desindexaciones prematuras o inconsistencia respecto a `/sitemap-images.xml` (que consulta `WHERE is_active = TRUE` sin límite de 30 días).
- **Solución Óptima Propuesta**:
  Filtrar `WHERE is_active = TRUE` sin recorte arbitrario de 30 días, dimensionar shards por tramos compatibles con paginación de 1.000 si hay proxy HTTP (o usar BD directa paginando de 10.000 en 10.000 hasta el máximo estándar de 50.000 URLs por sitemap).

### [SEO-005] `sitemap-news.xml` apunta a `/blog/...` mientras el sitemap principal y el router editorial publican las noticias en `/noticias/...`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/sitemap-news.xml/route.ts` (línea 37), `frontend/app/sitemap.ts` (línea 479-485) y `backend/generate_news_post.py` (línea 54)
- **Diagnóstico del Problema**:
  `generate_news_post.py:54` guarda noticias con `slug = f"tendencias-news-{...}"`. En `sitemap.ts:479`, todo post con `slug LIKE 'tendencias-%'` se publica bajo `${BASE_URL}/noticias/${row.slug}`. Sin embargo, `sitemap-news.xml/route.ts:37` genera incondicionalmente `${BASE_URL}/blog/${encodeURIComponent(post.slug)}` para cualquier post de las últimas 48h, creando URLs duplicadas o no canónicas en Google News.
- **Riesgo o Impacto**:
  Desperdicio de señales en Google News y fragmentación de enlazado interno/canónica entre `/blog/tendencias-news-*` y `/noticias/tendencias-news-*`.
- **Solución Óptima Propuesta**:
  Enrutar en `sitemap-news.xml` los artículos `tendencias-%` hacia `/noticias/${slug}` (consistente con la URL canónica definida en `noticias/[slug]/page.tsx:33`) y añadir redirección `301` canónica si alguien solicita un `tendencias-*` desde `/blog/[slug]`.

### [SEO-006] `RootLayout` llama a `await headers()`, impidiendo caché ISR/estática y elevando TTFB de páginas programáticas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/layout.tsx` (línea 117) y `frontend/app/page.tsx` (línea 232)
- **Diagnóstico del Problema**:
  Leer `await headers()` dentro del `RootLayout` convierte automáticamente toda la jerarquía de rutas App Router en renderizado dinámico bajo demanda (omitiendo Full Route Cache e ISR `revalidate = 900` / `3600` definido en `/trabajos/[sector]`, `/noticias/[slug]`, `/salarios`, `/job/[id]`).
- **Riesgo o Impacto**:
  Degradación significativa de TTFB (Time To First Byte) para Googlebot y usuarios reales al recalcular consultas MySQL en cada request, reduciendo la velocidad de rastreo (*crawl rate*) asignada por Google.
- **Solución Óptima Propuesta**:
  Desacoplar los scripts inline del `RootLayout` eliminando la necesidad de leer `x-nonce` por `headers()` en rutas públicas estáticas/ISR (moviéndolos a ficheros `.js` externos en `'self'` o configurando cabeceras cacheables desde CDN/Nginx con ISR real activo).

### [SEO-007] Duplicidad de Schema `WebSite` en la portada (`/`) apuntando a dos `SearchAction` distintos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/layout.tsx` (líneas 135-154) y `frontend/app/page.tsx` (líneas 262-275)
- **Diagnóstico del Problema**:
  Al visitar `/`, el HTML emitido contiene simultáneamente dos nodos JSON-LD `@type: "WebSite"` independientes: el de `layout.tsx` apunta `target` hacia `/trabajos/informatica-tecnologia?q={search_term_string}`, mientras el de `page.tsx` apunta `target` hacia `/?q={search_term_string}`. Adicionalmente, `robots.ts:25` bloquea el rastreo de `/*?q=` (`Disallow: /*?q=`).
- **Riesgo o Impacto**:
  Señales contradictorias de `SearchAction` para Google y referencia explícita en JSON-LD a URLs bloqueadas por `robots.txt`.
- **Solución Óptima Propuesta**:
  Emitir un único bloque `WebSite` global (solo en portada `/` o sin duplicación en `layout.tsx`) alineando la URL de destino y verificando coherencia frente a directrices de indexabilidad.

### [SEO-008] `/job/[id]/page.tsx` asigna nuestro propio logo (`/logo.png`) a empresas terceras y anida `aggregateRating` dentro de `hiringOrganization`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 690-700)
- **Diagnóstico del Problema**:
  El objeto JSON-LD `hiringOrganization` establece `logo: "${BASE_URL}/logo.png"` incluso para ofertas scrapeadas o de empresas terceras (donde el logo no pertenece al empleador sino al portal agregador) e incrusta `aggregateRating` directamente dentro de `hiringOrganization` utilizando `fetchCompanyRating()` (la cual además falla por consultar columna inexistente `company_name`, `[BUG-008]`).
- **Riesgo o Impacto**:
  Incumplimiento de la guía de Google *JobPosting* ("el logo de `hiringOrganization` debe corresponder a la empresa contratante, no al agregador"), con riesgo de mostrar el mismo logo del portal en todas las tarjetas o ser ignorado, y posible penalización por `aggregateRating` spam si el rating no corresponde al estándar esperado.
- **Solución Óptima Propuesta**:
  Omitir `hiringOrganization.logo` en vacantes externas cuando no se disponga de un logotipo oficial verificado de la empresa contratante (reservando `/logo.png` solo para `Organization` del propio portal), corregir `fetchCompanyRating()` usando `company_slug`, y validar la elegibilidad del `aggregateRating` según tipo de entidad.

### [SEO-009] `/job/[id]` asigna erróneamente `addressRegion: 'Madrid'` a decenas de ciudades españolas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 647-673)
- **Diagnóstico del Problema**:
  En la construcción de `PostalAddress` dentro de `JobPosting`, la cascada de condicionales únicamente comprueba cinco ciudades/provincias (Barcelona, Valencia, Sevilla, Bizkaia, Málaga) y asigna incondicionalmente `addressRegion: 'Madrid'` como rama `else` para cualquier otra ubicación presencial o híbrida en España (Zaragoza, Alicante, A Coruña, Murcia, Asturias, Tenerife, Granada, Valladolid).
- **Riesgo o Impacto**:
  Corrupción masiva de localización geográfica en Google for Jobs para ofertas ubicadas fuera de Madrid/Barcelona/Valencia/Sevilla/Bilbao/Málaga, afectando el posicionamiento local (*near me* / ciudad específica).
- **Solución Óptima Propuesta**:
  Sustituir el `else` hardcoded por un diccionario completo de municipios y las 50 provincias/comunidades autónomas de España, omitiendo `addressRegion` si la cadena `location` es ambigua (`"España"`).

### [SEO-010] `/noticias/[slug]` emite `hreflang="en"` ficticio (`?lang=en`) sin contenido traducido ni parámetro soportado

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 34-39) y `frontend/app/sitemap.ts` (líneas 507-514)
- **Diagnóstico del Problema**:
  `noticias/[slug]/page.tsx:36` publica `<link rel="alternate" hreflang="en" href=".../noticias/[slug]?lang=en" />` aunque la página no lee `searchParams.lang` ni traduce el artículo al inglés (sirve exactamente el mismo contenido en español). Asimismo, `sitemap.ts:507-514` genera `hreflang="en"` con `?lang=en` sobre todas las rutas `/trabajos/.../empresas`, `/talento-premium` y `/trabajo-*`.
- **Riesgo o Impacto**:
  Google Search Console reporta errores de `hreflang` sin etiquetas de retorno válidas o detecta contenido idéntico en español marcado como `en`, ignorando toda la estructura `hreflang` internacional del sitio.
- **Solución Óptima Propuesta**:
  Emitir `alternates.languages` (`hreflang`) única y exclusivamente para pares de URLs cuya versión inglesa esté realmente traducida en servidor y devuelva etiqueta `hreflang` recíproca verificada (como `/en/trabajos/[sector]`), retirando todos los enlaces `?lang=en` no traducidos.

### [SEO-011] `/job/[id]` devuelve `404 Not Found` genérico tras purga/desactivación en lugar de `410 Gone` semántico y desindexa solo 40 de 200 ofertas expiradas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 483-502) y `backend/deactivate_expired_jobs.py` (líneas 51-126)
- **Diagnóstico del Problema**:
  Cuando una vacante pasa a `is_active = FALSE` o es eliminada tras 100-110 días, `/job/[id]` ejecuta `notFound()` (HTTP `404`), haciendo que Googlebot siga reintentando rastrear URLs de ofertas antiguas durante semanas para comprobar si regresan. Simultáneamente, `deactivate_expired_jobs.py` marca 200 vacantes inactivas (`is_active = 0`) pero corta la notificación a Google Indexing API (`URL_DELETED`) en `[:40]`, dejando hasta 160 ofertas expiradas sin señal de retirada por ejecución (`[BUG-015]`).
- **Riesgo o Impacto**:
  Pérdida masiva de crawl budget sobre miles de ofertas antiguas muertas, advertencias de *soft 404* o *Expired job posting* en Google Search Console y retardo en el refresco de vacantes nuevas.
- **Solución Óptima Propuesta**:
  Conservar una tabla ligera de slugs/IDs purgados (o campo `expired_at` en lugar de borrado duro inmediato) para servir una respuesta HTTP `410 Gone` limpia desde un Route Handler / middleware cuando una oferta esté cerrada, manteniendo una página amigable con enlace a ofertas activas similares del mismo sector/ciudad y `noindex`; corregir la cola de `URL_DELETED` hasta cubrir el 100% de bajas.

### [SEO-012] Canibalización severa entre cinco estructuras URL redundantes para tecnología y ciudad

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/trabajo-madrid/page.tsx` (y `trabajo-barcelona`, `trabajo-valencia`, etc.), `frontend/app/empleo-tech/[ciudad]/page.tsx`, `frontend/app/trabajo/[ciudad]/[tech]/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`, `frontend/app/ca/trabajo-barcelona/page.tsx`, `frontend/app/eu/trabajo-bilbao/page.tsx`
- **Diagnóstico del Problema**:
  El proyecto compite consigo mismo indexando múltiples jerarquías equivalentes para idéntica intención de búsqueda: por ejemplo para React en Madrid existen simultáneamente `/trabajos/react-en-madrid` y `/trabajo/madrid/react`; y para empleo IT en Madrid coexisten `/trabajo-madrid`, `/empleo-tech/madrid` y `/trabajos/informatica-tecnologia-en-madrid` (repitiéndose en Barcelona, Valencia, Sevilla, Bilbao, Málaga y Zaragoza).
- **Riesgo o Impacto**:
  Canibalización directa de palabras clave transaccionales principales (`"empleo it madrid"`, `"trabajo react madrid"`), dilución de autoridad interna entre 2-3 URLs por consulta y desperdicio de presupuesto de rastreo.
- **Solución Óptima Propuesta**:
  Definir una única taxonomía canónica consolidada (por ejemplo `/trabajos/[sector]` y landings editoriales únicas por ciudad `/trabajo-[ciudad]` o `/empleo-tech/[ciudad]`), redirigir permanentemente `301` las rutas duplicadas hacia la canónica y eliminar enlaces internos hacia variantes redundantes.

### [SEO-013] Inconsistencia entre `validThrough` (+45d vs +90d) y la vida real en BD (100 días) en Schema `JobPosting`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (línea 558), `frontend/app/trabajos/[sector]/page.tsx` (línea 1140) y `backend/deactivate_expired_jobs.py` (línea 48)
- **Diagnóstico del Problema**:
  Una misma vacante declara `validThrough = created_at + 45 días` en `/job/[id]`, `created_at + 90 días` en `/trabajos/[sector]` (dentro del `ItemList`) y permanece `is_active = TRUE` y disponible en la web durante `100 días` (hasta `110` si fue guardada por un usuario).
- **Riesgo o Impacto**:
  Google for Jobs retira la oferta del carrusel a los 45 días mientras el portal continúa sirviéndola como activa otros 55 días, o detecta incoherencia entre páginas del mismo dominio.
- **Solución Óptima Propuesta**:
  Persistir `expires_at` real en la tabla `jobs` (por ejemplo 30 o 60 días alineados con el scraper y `deactivate_expired_jobs.py`) y utilizar exactamente ese mismo timestamp en todos los JSON-LD `validThrough` y en las tareas de desactivación.

### [SEO-014] `Occupation` schema en `/trabajos/[sector]` coloca el salario promedio (`averageSalary`) dentro del campo `median`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 1160-1179, `occupationSchema`)
- **Diagnóstico del Problema**:
  El bloque `occupationSchema` asigna `'median': stats.averageSalary` dentro de `MonetaryAmountDistribution`, confundiendo media aritmética con mediana estadística, además de omitir `percentile25`/`percentile75` reales y emitir `occupationLocation: { '@type': 'City', name: 'España' }` cuando no hay filtro de ciudad (`España` no es un `@type: 'City'`, debería ser `Country`).
- **Riesgo o Impacto**:
  Datos estructurados semánticamente imprecisos y errores/advertencias de validación Schema.org en `Occupation`.
- **Solución Óptima Propuesta**:
  Calcular y pasar la mediana salarial real (`stats.medianSalary`), incluir `percentile25` y `percentile75`, y utilizar `'@type': 'Country'` cuando `ciudad` esté vacío.

### [SEO-015] Emisión de `FAQPage` en `/noticias/[slug]` y `/trabajos/[sector]` con impacto de rich snippets obsoleto o restringido

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 74-111), `frontend/app/trabajos/[sector]/page.tsx` (líneas 1186-1230) y `frontend/app/page.tsx`
- **Diagnóstico del Problema**:
  El código genera extensos bloques `@type: "FAQPage"` tanto en listados programáticos como automáticamente desde encabezados `##` terminados en `?` en noticias editoriales. Desde agosto de 2023, Google restringió los resultados enriquecidos de `FAQPage` exclusivamente a sitios gubernamentales y de salud autorizados, manteniendo peso adicional en DOM/JSON-LD sin beneficio de snippet y con riesgo de texto truncado (`substring(0, 300) + '...'` rompiendo identificadores técnicos, `[BUG-062]`).
- **Riesgo o Impacto**:
  Aumento innecesario de tamaño HTML y emisión de markup complejo cuyo parseo regex altera identificadores técnicos (`snake_case`).
- **Solución Óptima Propuesta**:
  Priorizar `NewsArticle` / `Article` limpio en `/noticias/[slug]` con `author`, `datePublished`, `dateModified` y `image` reales, reservando preguntas frecuentes HTML visibles bien estructuradas sin depender de `FAQPage` para tráfico no gubernamental.

### [SEO-016] `/trabajos/[sector]` inserta emojis (`🔥`) en `<title>` y mantiene plantilla idéntica susceptible a degradación de CTR

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 553, 565)
- **Diagnóstico del Problema**:
  Todos los `<title>` programáticos terminan o intercalan el carácter emoji `🔥`, el cual Google suele reescribir o filtrar automáticamente en SERP (reescritura algorítmica de títulos), unido al error `[BUG-042]` que inserta meses en español (`[Noviembre 2026]`) dentro de títulos en inglés bajo `/en/trabajos/[sector]`.
- **Riesgo o Impacto**:
  Pérdida de control sobre el título mostrado en Google (Google sustituye los `<title>` con emojis excesivos o idiomas mezclados por fragmentos H1/anchor aleatorios) y menor percepción editorial.
- **Solución Óptima Propuesta**:
  Retirar emojis de `<title>`, optimizar la longitud por debajo de 58-60 caracteres manteniendo primero la palabra clave principal + provincia/remoto + año actual, y localizar fechas estrictamente por idioma.

### [SEO-017] `sitemap.ts` excluye todas las rutas de `/certificaciones` aunque las construye en memoria

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 471-496)
- **Diagnóstico del Problema**:
  En las líneas 471-474 se inicializa el array `activeCertificationsPages` con `/certificaciones` y todos los slugs de `CERTIFICATIONS`. Sin embargo, al ensamblar `sectorPages` en las líneas 490-496, `activeCertificationsPages` se omite completamente.
- **Riesgo o Impacto**:
  Las páginas evergreen de certificaciones IT (`AWS`, `Kubernetes`, `Azure`, etc.) quedan huérfanas del sitemap principal XML, ralentizando su descubrimiento e indexación por buscadores.
- **Solución Óptima Propuesta**:
  Incluir `...activeCertificationsPages` en `sectorPages` y enlazarlas desde el menú/hub de `/recursos` y `/salarios`.

### [SEO-018] `sitemap.ts` no incluye `hreflang` coherente ni última modificación real (`new Date()`) en rutas estáticas/salarios/tendencias

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 533, 561, 593, 637, 657, 740)
- **Diagnóstico del Problema**:
  Cientos de entradas generadas dinámicamente en `sitemap/0` y `sitemap/3` reciben `lastModified: new Date()`, cambiando en cada descarga HTTP del XML aunque ninguna oferta o texto de esa URL se haya actualizado. Asimismo, no todas las URLs en inglés (`/en/entrevistas/[tech]`, `/en/glosario/[term]`, `/ca/trabajo-barcelona`, `/eu/trabajo-bilbao`) verifican enlace recíproco `hreflang` limpio frente a `x-default`.
- **Riesgo o Impacto**:
  Desperdicio de rastreo por re-descargas inútiles motivadas por `<lastmod>` siempre al instante actual y pérdida de confianza del algoritmo de Googlebot en la señal `<lastmod>` del dominio.
- **Solución Óptima Propuesta**:
  Calcular `<lastmod>` real desde BD (`MAX(created_at)` por sector/ciudad o fecha real de publicación del artículo) o utilizar fechas constantes de compilación/estructura para páginas estáticas.

### [SEO-019] `sitemap-images.xml` referencia capturas OpenGraph dinámicas como imágenes indexables de ofertas sin textos `caption`/`geo_location` enriquecidos y sujeto al tope 1.000 de proxy

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap-images.xml/route.ts` (líneas 29-90) y `db_proxy.php` (línea 421)
- **Diagnóstico del Problema**:
  `sitemap-images.xml` solicita `LIMIT 5000` ofertas y `LIMIT 1000` empresas para generar nodos `<image:image>` apuntando a rutas OpenGraph Satori (`/job/.../opengraph-image`). Además del recorte a 1.000 filas detrás de `db_proxy.php`, la URL `/noticias/[slug]/page.tsx` apunta su OpenGraph hacia `/blog/[slug]/opengraph-image` mientras no existe `app/noticias/[slug]/opengraph-image.tsx`.
- **Riesgo o Impacto**:
  Cobertura incompleta de imágenes tras proxy HTTP, consumo de CPU renderizando tarjetas PNG en Satori para Googlebot Image sin aportar fotografías reales únicas, y errores 404/inconsistencia en OG de noticias nuevas.
- **Solución Óptima Propuesta**:
  Limitar el sitemap de imágenes a URLs realmente válidas y cacheadas por CDN (`Cache-Control: immutable / s-maxage`), añadir `app/noticias/[slug]/opengraph-image.tsx` (o servir ruta compartida real) y añadir paginación compatible con proxy si persiste.

### [SEO-020] `robots.ts` bloquea parámetros `/*?page=` impidiendo descubrir paginaciones mientras `LoadMoreJobs` carga página 2+ solo por JS cliente

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/robots.ts` (líneas 20-21), `frontend/components/LoadMoreJobs.tsx` (líneas 72-94) y `frontend/app/trabajos/[sector]/page.tsx` (línea 597)
- **Diagnóstico del Problema**:
  `robots.ts` declara `Disallow: /*?page=` y `Disallow: /*?*page=`, bloqueando el rastreo de URLs con `?page=2`. Simultáneamente, `trabajos/[sector]/page.tsx:597` emite `<meta name="robots" content="noindex, follow">` para páginas paginadas (`?page > 1`) —la regla `noindex, follow` nunca llega a ser leída por Googlebot si `robots.txt` ya impide el rastreo de `?page=`!— y `LoadMoreJobs.tsx` oculta las ofertas siguientes tras scroll infinito basado en `fetch('/api/jobs')` + `IntersectionObserver`.
- **Riesgo o Impacto**:
  Googlebot no puede seguir los enlaces `<a href="?page=2">` para descubrir vacantes más allá del top inicial si no están en el sitemap (agravado porque ofertas de 31–100 días tampoco están en `sitemap/1`!). Además, combinar `Disallow` en `robots.txt` con `noindex` en HTML impide que Google elimine del índice URLs paginadas ya rastreadas vía enlaces externos.
- **Solución Óptima Propuesta**:
  Permitir el rastreo de `?page=` eliminando `Disallow: /*?page=` de `robots.ts` y apoyarse en `<meta name="robots" content="noindex, follow">` + enlaces `<a href="?page=2">` reales paginados en SSR para descubrir ofertas profundas limpiamente.

### [SEO-021] Subpáginas `/noticias/[slug]` apuntan sus imágenes `og:image` y `twitter:image` hacia `/blog/[slug]/opengraph-image`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 48, 59)
- **Diagnóstico del Problema**:
  `NewsDetailPage` genera metadatos OpenGraph y Twitter Card referenciando `${BASE_URL}/blog/${resolvedParams.slug}/opengraph-image`, pese a que la ruta canónica declarada dos líneas más arriba (`line 33`) es `${BASE_URL}/noticias/${resolvedParams.slug}`. Además, `NewsDetailPage` en `app/noticias/[slug]/` carece de archivo `opengraph-image.tsx` propio.
- **Riesgo o Impacto**:
  Inconsistencia estructural entre ruta canónica y recurso gráfico OG/Discover (Google Discover exige imágenes grandes `>= 1200px` consistentes en la estructura del artículo), además de posible fallo si `/blog/[slug]` no resuelve o aplica filtros distintos de `tendencias-*`.
- **Solución Óptima Propuesta**:
  Crear `frontend/app/noticias/[slug]/opengraph-image.tsx` (o compartir un helper común manteniendo ruta consistente `/noticias/[slug]/opengraph-image`) y declarar `max-image-preview:large` en `robots` metadata para elegibilidad en Google Discover.

### [SEO-022] Ausencia de marca explícita `robots: { googleBot: { 'max-image-preview': 'large' } }` y esquema `NewsArticle` completo en `/noticias/[slug]`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 19-62, 113-295) y `frontend/app/layout.tsx`
- **Diagnóstico del Problema**:
  Para aparecer en Google News y Google Discover, Google exige directivas explícitas `'max-image-preview': 'large'` y datos estructurados `NewsArticle` con `headline`, `image` (al menos 1200 px de ancho), `datePublished` ISO 8601 con zona horaria (`+01:00` / `Z`), `dateModified` y `author` enlazado a URL verificable (`/sobre-nosotros` o perfil de autor). Actualmente `generateMetadata` no verifica que `post.date` tenga formato ISO completo con hora/zona en las noticias generadas (`YYYY-MM-DD`).
- **Riesgo o Impacto**:
  Exclusión o bajo rendimiento del feed editorial `/noticias` en Google Discover y Google Top Stories.
- **Solución Óptima Propuesta**:
  Añadir `robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }` en metadata y validar/emitir `NewsArticle` JSON-LD conforme al validador de resultados enriquecidos de Google.

### [SEO-023] `backend/index_new_jobs.py` solo consulta `created_at` de últimas 9h / 48h sin backoff ante cuota Google (200/día) y omite `title_es` en el slug

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/index_new_jobs.py` (líneas 34-43, 66-68) y `backend/deactivate_expired_jobs.py` (línea 100)
- **Diagnóstico del Problema**:
  `backend/index_new_jobs.py:34-36` selecciona `SELECT id, title, location, company FROM jobs` (sin `title_es`) y llama a `get_job_slug(job_id, title, location, company)` en la línea 68, mientras `deactivate_expired_jobs.py:100` y el frontend (`lib/slug.ts`) utilizan `title_es || title` para construir el slug canónico! Al traducir títulos del inglés al español en `main.py` (`title_es` distinto de `title`), `index_new_jobs.py` envía a Google Indexing API e IndexNow **URLs no canónicas** con el título inglés en lugar del `title_es` español!
- **Riesgo o Impacto**:
  Toda la cuota diaria de Google Indexing API e IndexNow para ofertas internacionales traducidas (`title_es != NULL`) se desperdicia enviando URLs no canónicas que redirigen (`308`/`301`) hacia la URL real con `title_es`, reduciendo drásticamente la velocidad de indexación.
- **Solución Óptima Propuesta**:
  Incluir `title_es` en el `SELECT` de `backend/index_new_jobs.py` y pasarlo a `get_job_slug(job_id, title, location=location, company=company, title_es=title_es)` exactamente igual que el frontend y `deactivate_expired_jobs.py`.

### [SEO-024] `backend/index_now.py` y `deactivate_expired_jobs.py` sufren idéntica discrepancia potencial de slug si `title_es` falta y carecen de límite por lote IndexNow (10.000 URLs)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/index_now.py` (líneas 1-50) y `backend/logic/indexnow.py` (líneas 12-45)
- **Diagnóstico del Problema**:
  `backend/logic/indexnow.py:24-29` envía `urlList: urls` en una única petición JSON sin fragmentar en bloques (IndexNow limita cada POST a un máximo de 10.000 URLs). Asimismo, es imprescindible revisar todas las invocaciones en scripts backend (`index_now.py`, `mailer.py`, bots sociales) para garantizar que absolutamente todas pasen `title_es` a `get_job_slug` en lugar de usar `title` en bruto.
- **Riesgo o Impacto**:
  Rechazos HTTP 400/413 en envíos masivos IndexNow superiores a 10.000 URLs y generación de URLs de oferta no canónicas con cadenas inglesas en campañas o feeds cuando existe `title_es`.
- **Solución Óptima Propuesta**:
  Chunkear `urls` en lotes de 5.000 en `submit_urls_to_indexnow()` y centralizar la generación de URL de oferta en una función única `get_job_url(row_dict)` que siempre consulte `title_es`.

### [SEO-025] `/trabajo-madrid`, `/trabajo-barcelona`, `/empleo-tech/[ciudad]` y landings estáticas carecen de enlazado dinámico o control de ofertas vacías (`0` vacantes -> `200 OK` indexable)

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/trabajo-madrid/page.tsx`, `frontend/app/trabajo-valencia/page.tsx`, `frontend/app/trabajo-sevilla/page.tsx`, `frontend/app/trabajo-zaragoza/page.tsx`, `frontend/app/empleo-tech/[ciudad]/page.tsx` y `frontend/app/trabajos/[sector]/page.tsx`
- **Diagnóstico del Problema**:
  Mientras `/trabajos/[sector]` al menos aplica `metaRobots = { index: !isThinPage }` cuando `totalCount < 5`, las múltiples landings fijas por ciudad o modalidad (`/trabajo-zaragoza`, `/trabajo-malaga`, `/trabajo-sevilla`, `/ca/trabajo-barcelona`, `/eu/trabajo-bilbao`, `/trabajos/ingles-requerido`, etc.) siguen declarando indexación por defecto incluso si en una ciudad secundaria hay 0, 1 o 2 vacantes activas (agravado si se activa `MOCK_JOBS` en `lib/jobs.ts`).
- **Riesgo o Impacto**:
  Riesgo de indexación de landings de ciudades pequeñas con catálogo casi vacío (*soft 404* en Search Console) o textos repetitivos idénticos intercambiando únicamente el nombre de ciudad (*doorway pages*).
- **Solución Óptima Propuesta**:
  Evaluar dinámicamente `totalCount` en las landings de ciudad/nicho para aplicar `noindex, follow` si tienen `< 3` vacantes activas, enriquecer cada ciudad con datos reales locales únicos (empresas top locales, mediana salarial real de esa provincia, sectores más demandados) y consolidar rutas duplicadas.

### [SEO-026] `AISearchBar.tsx` construye URLs programáticas que pueden generar 0 resultados y caer en páginas `noindex` no canónicas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/AISearchBar.tsx` (líneas 80-95)
- **Diagnóstico del Problema**:
  `AISearchBar` transforma una consulta de usuario como `"react 50k madrid"` en `/trabajos/react-salario-mas-de-50k-en-madrid`. A diferencia de los filtros en portada (`/?q=react&min_salary=50000`), esta redirección genera combinaciones infinitas arbitrarias bajo `/trabajos/...` que no forman parte de la arquitectura enlazada principal.
- **Riesgo o Impacto**:
  Creación de rutas combinatorias arbitrarias bajo `/trabajos/` con 0 resultados reales y potencial descubrimiento en logs/analítica o compartición en enlaces externos como URLs vacías.
- **Solución Óptima Propuesta**:
  Redirigir consultas combinadas libres de usuario a `/?q=...&location=...&min_salary=...` (bloqueado en `robots.txt` para no indexar búsquedas internas conforme a mejores prácticas SEO) salvo coincidencia exacta con landings programáticas consolidadas `>= 5` ofertas.

### [SEO-027] `frontend/next.config.ts` configura redirección `/oferta/:id` -> `/job/:id` pero no gestiona errores de slug antiguos sin `permanentRedirect` controlado desde caché

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/next.config.ts` (líneas 75-95) y `frontend/app/job/[id]/page.tsx` (líneas 485-505)
- **Diagnóstico del Problema**:
  `job/[id]/page.tsx` realiza una redirección `permanentRedirect` (HTTP 308) en servidor cada vez que el slug no coincide exactamente con `getJobSlug(job)`. Cuando `title_es` cambia por una actualización posterior del scraper/traductor o cuando un bot consulta la URL inglesa generada erróneamente por `index_new_jobs.py` (`[SEO-023]`), se produce un salto 308 dinámico en cada hit sin caché CDN si `RootLayout` fuerza SSR (`[SEO-006]`).
- **Riesgo o Impacto**:
  Latencia adicional en Googlebot (salto de redirección por consulta) y fluctuación de URLs canónicas si `title_es` se modifica con el tiempo.
- **Solución Óptima Propuesta**:
  Persistir `slug` inmutable en la tabla `jobs` al crear la vacante para que las traducciones o correcciones posteriores de título no muten la URL pública ni obliguen a redirecciones en cascada.

### [SEO-028] Falta archivo `robots` / meta `nofollow, noindex` explícito en `/login`, `/registro`, `/recuperar-password`, `/mi-perfil`, `/ofertas-guardadas`, `/admin` y `/gracias`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/login/page.tsx`, `frontend/app/registro/page.tsx`, `frontend/app/recuperar-password/page.tsx`, `frontend/app/admin/page.tsx`, `frontend/app/gracias/page.tsx`, `frontend/app/robots.ts`
- **Diagnóstico del Problema**:
  `robots.ts` bloquea `/ofertas-guardadas`, `/mi-perfil`, `/empresa-dashboard`, `/redirect/` y `/ref/`, pero omite completamente `/admin`, `/login`, `/registro`, `/recuperar-password`, `/gracias`, `/perfil` y `/darse-de-baja`. Además, bloquear por `robots.txt` sin enviar `X-Robots-Tag: noindex` no impide que Google indexe la URL como "no hay descripción disponible" si existe algún enlace entrante.
- **Riesgo o Impacto**:
  Aparición de páginas administrativas, de gracias tras pago, formularios de login o bajas en los resultados públicos de Google.
- **Solución Óptima Propuesta**:
  Emitir cabecera HTTP `X-Robots-Tag: noindex, nofollow` desde `middleware.ts` (y `metadata.robots: { index: false, follow: false }`) para todas las rutas transaccionales, privadas, de autenticación y `/admin`.

### [SEO-029] Core Web Vitals (CLS/LCP): banners de AdSense y scripts en `layout.tsx` + carga inicial en portada sin reserva fija de altura en slots publicitarios

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/AdBanner.tsx`, `frontend/components/StickyDesktopAd.tsx`, `frontend/app/page.tsx` y `frontend/app/noticias/[slug]/page.tsx` (líneas 121-139)
- **Diagnóstico del Problema**:
  Tanto en el cuerpo de noticias (`/noticias/[slug]` divide entre el H1/H2 e inserta publicidad contextual) como en listados (`/trabajos/[sector]`), los bloques publicitarios cargan de forma diferida tras el consentimiento de cookies y renderizado AdSense. Si el contenedor padre de `AdBanner` / `StickyDesktopAd` no reserva `min-height` acorde al formato responsive exacto cuando llega el anuncio tras LCP, el contenido del artículo o listado de empleo salta verticalmente.
- **Riesgo o Impacto**:
  Degradación de la métrica CLS (*Cumulative Layout Shift* > 0.1) en Core Web Vitals, afectando las señales de experiencia de página en Search Console especialmente en móvil.
- **Solución Óptima Propuesta**:
  Asignar dimensiones mínimas reservadas (`min-h-[250px]` o `aspect-ratio` en slots rectangulares/leaderboard según breakpoint) en `AdBanner` y colapsar únicamente antes del primer pintado si el usuario ya rechazó cookies publicitarias (`advertising: false`).

### [SEO-030] `Footer.tsx` inyecta enlaces programáticos calculados dinámicamente solo sobre los últimos 150 empleos (`LIMIT 150`) con posible rotación inestable de interlinking

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/Footer.tsx` (líneas 37-87, `getCachedProgrammaticLinks`)
- **Diagnóstico del Problema**:
  Cada hora (`revalidate: 3600`), el footer consulta únicamente `SELECT title, category, location FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 150` y recalcula dinámicamente qué 15 enlaces ciudad+tecnología se muestran en el footer global de **todo** el portal. Un lote de 50 ofertas de un scraper concreto en Python o Java cambia de golpe los 15 enlaces globales de todo el sitio cada pocas horas.
- **Riesgo o Impacto**:
  Inestabilidad severa en la distribución de PageRank interno (*internal link graph*): páginas clave pueden perder de golpe miles de enlaces entrantes internos de todo el dominio durante horas si un scraper importa temporalmente otro stack.
- **Solución Óptima Propuesta**:
  Basar el muestreo de `getCachedProgrammaticLinks` en agregados históricos reales (últimos 30 días `COUNT(*) >= 5` con `GROUP BY` o vista materializada diaria estable) y mantener fijos los top hubs principales evitando volatilidad horaria del grafo interno.

### [SEO-031] Contenido generado por IA en `/blog`, `/tendencias` y `/noticias` carece de clustering temático estricto, arriesgando solapamiento de slugs y keywords

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/generate_news_post.py` (líneas 15-30, 54), `backend/generate_trends_post.py` (líneas 119-121), `backend/generate_weekly_article.py` y `backend/generate_blog_post.py` (línea 67)
- **Diagnóstico del Problema**:
  Coexisten 5 generadores distintos (`generate_blog_post.py`, `generate_weekly_article.py`, `generate_trends_post.py`, `generate_news_post.py`, `generate_podcast_script.py`) escribiendo en la misma tabla `blog_posts`. Por ejemplo, `generate_news_post.py` rota solo 3 temas estáticos (`subida-salarios-devops-cloud-espana`, `demanda-desarrolladores-fullstack-ai-remoto`, `hubs-tecnologicos-malaga-valencia-contratacion`) añadiendo la fecha `-{date_str}` al slug; ejecutado periódicamente crea decenas de artículos con el mismo enfoque temático diferenciados únicamente por la fecha.
- **Riesgo o Impacto**:
  Auto-canibalización progresiva del contenido editorial en el índice (`tendencias-news-subida-salarios-devops-...-2026-11-01`, `...-2026-11-08`, etc.) y riesgo de clasificación como contenido automatizado repetitivo (*scaled content abuse*).
- **Solución Óptima Propuesta**:
  Rotar temas verdaderamente únicos basados en eventos/datos reales semanales de BD, actualizar el artículo pilar existente en lugar de clonar 50 URLs por tema cambiando solo la fecha, y añadir enlazado contextual directo hacia ofertas y páginas `/salarios/` vivas.

### [SEO-032] `feed.xml` (RSS) no filtra duplicados ni proporciona cabeceras `ETag`/`Cache-Control` optimizadas para agregadores

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/feed.xml/route.ts`
- **Diagnóstico del Problema**:
  Las páginas `/trabajos/[sector]/page.tsx:583-595` enlazan feeds RSS filtrados por categoría/tecnología/ubicación (`feed.xml?category=...&location=...`). Si las consultas detrás de `/feed.xml` se ejecutan en dinámico sin caché HTTP robusto o devuelven descripciones mínimas (`"Oferta de TecnoEmpleo"`) en lugar de resúmenes enriquecidos con `pubDate`, salario y enlace canónico limpio con UTM no invasivo, los lectores RSS y agregadores ven contenido pobre o sufren latencia.
- **Riesgo o Impacto**:
  Oportunidad desaprovechada de indexación rápida vía feeds PubSubHubbub/RSS y consumo repetitivo de consultas MySQL por bots lectores RSS.
- **Solución Óptima Propuesta**:
  Configurar `Cache-Control: public, max-age=900, s-maxage=900, stale-while-revalidate=3600`, añadir `<atom:link rel="self">` y `<guid isPermaLink="true">` con la URL canónica `/job/[slug]`, e incluir salarios estructurados cuando estén disponibles.

### [SEO-033] `trabajos/[sector]/page.tsx` mezcla `title` en inglés original de vacantes remotas dentro de URLs españolas sin estrategia de idioma coherente

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 1135-1155), `frontend/app/job/[id]/page.tsx` y `backend/main.py`
- **Diagnóstico del Problema**:
  Muchas vacantes de Himalayas, Remotive, WWR o RemoteOK traen `title` y `description_snippet` completamente en inglés. Si `GoogleTranslator` falla, abre el circuit breaker o está lento (`[BUG-018]`), `title_es` queda `NULL` o con texto inglés mezclado dentro de páginas declaradas con `<html lang="es">` y `hreflang="es-ES"`. Inversamente, la versión `/en/trabajos/[sector]` muestra ofertas españolas de Tecnoempleo/Stratos con título y descripción en español.
- **Riesgo o Impacto**:
  Páginas bilingües inconsistentes donde la interfaz y etiquetas Schema indican un idioma distinto al del listado real de vacantes, debilitando la relevancia semántica por idioma en Google ES vs Google EN.
- **Solución Óptima Propuesta**:
  Etiquetar cada oferta con columna `language` (`es`/`en`), priorizar el filtro o badge de idioma en `/en/` vs `/`, y reintentar en cola asíncrona los `title_es` pendientes cuando el servicio de traducción vuelva a estar disponible.

### [SEO-034] Vacantes de Tecnoempleo insertadas con descripción genérica de 21 caracteres (`"Oferta de TecnoEmpleo"`) degradan `JobPosting`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/spiders/job_spider.py` (línea 98) y `frontend/app/job/[id]/page.tsx`
- **Diagnóstico del Problema**:
  El spider Scrapy de Tecnoempleo (`job_spider.py:98`) solo raspa el listado resumido e inserta literalmente `'description_snippet': "Oferta de TecnoEmpleo"` y `'salary': "Consultar"` para todas las ofertas de España sin extraer resumen técnico real ni requisitos/salario visibles en la ficha. En el frontend, esa misma cadena de 3 palabras acaba rellenando la propiedad `description` del Schema.org `JobPosting` y el `<meta name="description">`.
- **Riesgo o Impacto**:
  Incumplimiento de calidad mínima de `JobPosting.description` en Google for Jobs (Google requiere una descripción real completa del puesto y rechaza placeholders genéricos), junto con páginas casi vacías (*thin content*) en todas las ofertas nacionales de Tecnoempleo.
- **Solución Óptima Propuesta**:
  Extraer un extracto descriptivo informativo respetuoso con `tdm.py` (o enriquecer la ficha mostrando stack detectado, categoría, rango salarial estimado de la BD, competencias clave del rol y preguntas frecuentes del perfil) y aplicar `noindex` automático en `/job/[id]` cuando la descripción tenga menos de un umbral mínimo editorial mientras el spider no extraiga detalles suficientes.

### [SEO-035] `sitemap/1` y `sitemap/2` en `sitemap.ts` dependen de offsets fijos `0` y `8000` sin usar sharding dinámico real hasta 50.000 URLs

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 302, 660-720) y `frontend/app/sitemap.xml/route.ts` (líneas 8-27)
- **Diagnóstico del Problema**:
  `sitemap.xml/route.ts` hardcodea exactamente 4 sub-sitemaps (`/sitemap/0.xml` a `/sitemap/3.xml`) y `sitemap.ts` fija cortes estáticos `OFFSET 0 LIMIT 8000` y `OFFSET 8000 LIMIT 8000`. Si las ofertas activas superan 16.000 registros (sin límite 30d una vez corregido `[SEO-004]`), las ofertas `> 16.000` nunca aparecerían en ningún sitemap; por el contrario, cuando hay menos de 8.000, `/sitemap/2.xml` se genera prácticamente vacío mientras `sitemap/0.xml` corre el riesgo de sobrepasar o acercarse a tamaños grandes por combinatoria cartesiana (`[SEO-003]`).
- **Riesgo o Impacto**:
  Pérdida silenciosa de indexación al rebasar 16.000 vacantes activas y emisión de sitemaps XML vacíos (`<urlset></urlset>`) que generan advertencias en Search Console.
- **Solución Óptima Propuesta**:
  Generar `sitemap.xml` dinámicamente calculando `CEIL(total_active_jobs / 25000)` para emitir exactamente los shards necesarios (respetando el límite de 50.000 URLs y 50 MB por archivo) y ocultar shards vacíos.

### [SEO-036] `sitemap/0.xml` omite verificar reciprocidad real con `/ca/trabajo-barcelona`, `/eu/trabajo-bilbao` y rutas `/en/` secundarias

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 490-515), `frontend/app/ca/trabajo-barcelona/page.tsx`, `frontend/app/eu/trabajo-bilbao/page.tsx`, `frontend/app/en/entrevistas/[tech]/page.tsx` y `frontend/app/en/glosario/[term]/page.tsx`
- **Diagnóstico del Problema**:
  El portal dispone de rutas específicas en catalán (`/ca/trabajo-barcelona`), euskera (`/eu/trabajo-bilbao`) e inglés (`/en/entrevistas/[tech]`, `/en/glosario/[term]`, `/en/trabajos/[sector]`), pero la declaración `alternates` en `sitemap.ts:498-515` únicamente contempla `es-ES`, `en` y `x-default` sobre rutas `/trabajos/`, ignorando las correspondencias `ca-ES` para Barcelona y `eu-ES` para Bilbao entre `/trabajo-barcelona` <-> `/ca/trabajo-barcelona` y `/trabajo-bilbao` <-> `/eu/trabajo-bilbao`, y generando en cambio enlaces `?lang=en` inválidos en `/trabajo-*`.
- **Riesgo o Impacto**:
  Oportunidad regional cooficial (catalán y euskera) infrautilizada y falta de señalización `hreflang="ca"` / `hreflang="eu"` bidireccional frente a buscadores locales.
- **Solución Óptima Propuesta**:
  Declarar pares bidireccionales exactos `es-ES` / `ca-ES` para Barcelona y `es-ES` / `eu-ES` para Bilbao tanto en metadata HTML como en el sitemap XML, y mapear `/en/entrevistas/*` y `/en/glosario/*` con sus homólogos españoles.

### [SEO-037] Ausencia de archivo `<link rel="canonical">` estricto o normalización ante trailing slash y parámetros UTM en rutas dinámicas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/next.config.ts` y metadatos de páginas (`frontend/app/job/[id]/page.tsx`, `frontend/app/page.tsx`)
- **Diagnóstico del Problema**:
  Cuando usuarios o bots llegan a URLs con parámetros de marketing o compartición social (`?utm_source=twitter`, `?fbclid=...`, `?ref=...`, `?source=telegram`), si una ruta secundaria omite un `alternates.canonical` absoluto limpio o hereda parámetros, los buscadores pueden indexar duplicados parametrizados. Asimismo, `robots.ts` bloquea `?q=`, `?modality=`, `?min_salary=`, `?experience=`, `?date_range=`, pero NO bloquea parámetros comunes de ordenación (`?sort=`, `?with_salary=`, `?location=`).
- **Riesgo o Impacto**:
  Rastreo e indexación potencial de variantes parametrizadas con `?location=`, `?sort=` o `?with_salary=` que duplican exactamente los listados programáticos de `/trabajos/`.
- **Solución Óptima Propuesta**:
  Añadir `Disallow: /*?sort=`, `Disallow: /*?*sort=`, `Disallow: /*?with_salary=`, `Disallow: /*?location=` (o preferiblemente controlar todo facetado combinado con `<meta name="robots" content="noindex, follow">` + `canonical` limpio sin parámetros de orden/tracking) y verificar `alternates.canonical` en el 100% de páginas.

### [SEO-038] `backend/index_new_jobs.py` envía una petición HTTP individual por oferta sin límite de tasa ni persistencia prioritaria para ofertas destacadas/locales

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/index_new_jobs.py` (líneas 66-97)
- **Diagnóstico del Problema**:
  Google Indexing API establece una cuota estándar de ~200 peticiones/día (`publish`). `backend/index_new_jobs.py:34-43` selecciona sin `LIMIT` ni `ORDER BY is_featured DESC` todas las ofertas de las últimas 9h o sin indexar de 48h e intenta indexarlas secuencialmente una por una vía `POST /api/index-job` (timeout 10s). Si en una oleada entran 350 vacantes scraped internacionales primero, agotan los 200 tokens diarios de Google API dejando fuera las vacantes españolas locales o incluso ofertas patrocinadas/destacadas recién publicadas.
- **Riesgo o Impacto**:
  Agotamiento prematuro de cuota `429 Quota Exceeded` de Google Search Console sin priorizar vacantes estratégicas ni españolas, además de latencia acumulada (`350 * ~1s`) que puede disparar el `timeout=180` de `run_all.py`.
- **Solución Óptima Propuesta**:
  Ordenar por prioridad comercial y orgánica (`ORDER BY is_featured DESC, (salary_min IS NOT NULL) DESC, created_at DESC LIMIT 180`), abortar el bucle Google Indexing API al recibir primer HTTP `429` reservando IndexNow para el resto ilimitado, e invocar Google Indexing API inmediatamente tras el pago en `webhooks/stripe/route.ts` para vacantes patrocinadas.

### [SEO-039] `robots.ts` omite referencia explícita al Sitemap Index de Blog/Estáticas de Next.js si se accede vía `/sitemap/0.xml` vs `/sitemap.xml` y carece de directivas para crawlers de IA

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/robots.ts` (líneas 4-44)
- **Diagnóstico del Problema**:
  `robots.ts` define únicamente `userAgent: '*'`, por lo que rastreadores de motores conversacionales/IA (`OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`) o scrapers comerciales quedan regidos por idéntica regla genérica sin granularidad entre entrenamiento vs indexación de búsqueda y citas. Además, tampoco declara `Host` o referencia explícita coherente si `SITE_URL` se despliega en staging.
- **Riesgo o Impacto**:
  Falta de estrategia explícita de visibilidad GEO/AI Search (permitiendo bots de citación en tiempo real como `OAI-SearchBot`/`PerplexityBot` sobre `/salarios` y `/tendencias`, mientras se protege contenido o endpoints dinámicos de scraping abusivo).
- **Solución Óptima Propuesta**:
  Definir política intencional por `User-agent` diferenciando crawlers de citación/búsqueda vs bots de scraping masivo, y emitir `Disallow: /` en `robots.ts` automáticamente cuando `BASE_URL` no corresponda al dominio de producción evitando indexación de entornos de staging.

### [SEO-040] `sitemap.ts` filtra tecnologías limitadas dentro de `detectTechForSitemap()` pudiendo desincronizarse con `displayNameMap` de `/trabajos/[sector]`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 220-295, 322-435) y `frontend/app/trabajos/[sector]/page.tsx` (líneas 41-100, `displayNameMap`)
- **Diagnóstico del Problema**:
  El sitemap mantiene su propia lógica separada para detectar tecnologías, ciudades, experiencia y contratos sobre las ofertas de BD (`detectTechForSitemap`, `detectCityForSitemap`, `detectExperienceForSitemap`, `detectContractForSitemap`), replicando parcialmente las listas de `/trabajos/[sector]/page.tsx` y `AISearchBar.tsx` pero sin compartir módulo fuente único.
- **Riesgo o Impacto**:
  Nuevas tecnologías agregadas en `displayNameMap` (`trabajos/[sector]`) o nuevas ciudades en `job/[id]` quedan excluidas del sitemap o generan slugs ligeramente distintos al parser de destino.
- **Solución Óptima Propuesta**:
  Extraer una única fuente de verdad (`frontend/lib/taxonomies.ts`) importada por `sitemap.ts`, `trabajos/[sector]/page.tsx`, `Footer.tsx` y `AISearchBar.tsx`.

### [SEO-041] Página de oferta `/job/[id]` permite indexación de vacantes sin `description_snippet` enriquecido o con textos 100% duplicados de terceros

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 480-760)
- **Diagnóstico del Problema**:
  Todas las ofertas importadas contienen únicamente un extracto breve (`<= 200` caracteres en `tdm.py` / `himalayas.py` o `"Oferta de TecnoEmpleo"`). Si la página de oferta `/job/[id]` no aporta suficiente valor diferencial único (análisis salarial comparado frente a la mediana del stack, empresas del mismo sector en la ciudad, tecnologías detectadas, vacantes similares), centenares de URLs compiten en SERP con apenas unas líneas de texto clonado de la oferta original.
- **Riesgo o Impacto**:
  Degradación de ranking por baja proporción de contenido único y pérdida de retención del usuario que rebota rápido al enlace externo (*pogo-sticking*).
- **Solución Óptima Propuesta**:
  Enriquecer `/job/[id]` con bloques de valor contextual calculados desde BD propia (comparativa salarial de esa categoría/ciudad vs la oferta, habilidades técnicas extraídas con enlaces internos a `/trabajos/[tech]`, historial de la empresa en `/empresas/[slug]` y vacantes equivalentes) sin inflar artificialmente el JSON-LD.

### [SEO-042] `/api/jobs` devuelve descripciones completas/datos estructurados sin proteger contra scraping y el HTML de `/` solo renderiza 20 vacantes SSR sin enlaces paginados `<a href>`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/page.tsx` (líneas 215-350) y `frontend/components/LoadMoreJobs.tsx` (líneas 72-186)
- **Diagnóstico del Problema**:
  En portada `/` y listados, la carga posterior a los primeros 20 empleos depende exclusivamente de botones/scroll infinito en React (`LoadMoreJobs` llamando a `/api/jobs?page=2`). Los rastreadores web que no ejecutan eventos de scroll profundo o tienen bloqueado `?page=` en `robots.txt` (`[SEO-020]`) nunca descubren los enlaces hacia ofertas desde la página 2 a la N mediante rastreo HTML estándar.
- **Riesgo o Impacto**:
  Profundidad de clic excesiva (*crawl depth*) para ofertas nuevas que bajan de las primeras 20 posiciones tras oleadas de scrapers internacionales, dejándolas dependientes exclusivamente del sitemap XML.
- **Solución Óptima Propuesta**:
  Añadir paginación HTML progresiva `<nav aria-label="Paginación"><Link href="?page=2">Siguiente</Link></nav>` visible para rastreadores y degradación elegante (mientras el usuario con JS disfruta de `LoadMoreJobs`), desbloqueando `?page=` en `robots.txt`.

### [SEO-043] Imágenes externas de empresas vía Clearbit (`https://logo.clearbit.com/...`) carecen de atributo `alt` semántico consistente o fallback estable sin fallo visual/CLS

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/api/company-logo/route.ts` y `frontend/next.config.ts` (líneas 20-26)
- **Diagnóstico del Problema**:
  Los logotipos corporativos dependen de llamadas externas a Clearbit Logo API (`logo.clearbit.com`), un servicio freemium cuyo acceso directo o estabilidad no está garantizado a largo plazo (además HubSpot restringió/anunció cambios sobre Clearbit free API). Cuando `api/company-logo` responde `404` porque la empresa no tiene logo en Clearbit o el nombre difiere del dominio web, el frontend debe resolver gracefully sin disparar errores 404 en consola ni desplazamientos de layout (`CLS`).
- **Riesgo o Impacto**:
  Oleadas de respuestas `404` de recursos en auditorías Lighthouse / Search Console y posible ruptura masiva de tarjetas si Clearbit cambia términos o cuota.
- **Solución Óptima Propuesta**:
  Generar un avatar SVG determinista ligero en servidor/cliente con las iniciales corporativas como fallback instantáneo (`width`/`height` fijos) y cachear los logotipos verificados válidos en almacenamiento propio/CDN.

### [SEO-044] Desalineación de metadatos sociales (`og:image` y `twitter:image`) en `/noticias/[slug]` y páginas estáticas secundarias

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 46-60) y listado de `opengraph-image.tsx` existentes
- **Diagnóstico del Problema**:
  Mientras existen 8 generadores `opengraph-image.tsx` dedicados (`blog/[slug]`, `empresas/[slug]`, `entrevistas/[tech]`, `glosario/[term]`, `job/[id]`, `salarios`, `trabajos/[sector]`, raíz), otras secciones con potencial de tráfico viral y compartición en redes (`/noticias/[slug]`, `/tendencias`, `/ranking-empresas-it`, `/informe-mercado-it`, `/comparar/[slug]`, `/certificaciones/[slug]`) reutilizan imágenes genéricas o apuntan cross-route a `/blog/[slug]/opengraph-image`.
- **Riesgo o Impacto**:
  Previsualizaciones sociales poco optimizadas en LinkedIn/Twitter/Bluesky/Google Discover y dependencia de rutas cruzadas entre `/noticias` y `/blog`.
- **Solución Óptima Propuesta**:
  Implementar `opengraph-image.tsx` propio para `/noticias/[slug]` y una imagen dinámica paramétrica cacheada por Edge para hubs de alto potencial como `/tendencias` y `/ranking-empresas-it`.

### [SEO-045] Ausencia de atributo `jobLocationType: "TELECOMMUTE"` y `applicantLocationRequirements` estandarizados cuando `location` indica trabajo remoto internacional/España

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 630-690)
- **Diagnóstico del Problema**:
  Al examinar la generación de `JobPosting` en `/job/[id]` y la lista de `location` producida por scrapers internacionales (`"Remoto (Mundial)"`, `"Remoto (Europe)"`, `"Remoto (US only)"` en `himalayas.py:26-28`), las ofertas remotas necesitan declarar `"jobLocationType": "TELECOMMUTE"` y obligatoriamente `"applicantLocationRequirements": { "@type": "Country", "name": ... }` según los requisitos de Google for Jobs para ofertas teletrabajo. Si se omite `applicantLocationRequirements` junto a `TELECOMMUTE` o si se conserva un `jobLocation` inválido, Search Console emite error crítico de dato estructurado para empleo remoto.
- **Riesgo o Impacto**:
  Exclusión del filtro `"Solo remoto"` en Google for Jobs o errores en la pestaña de mejoras *Empleos* de Search Console en ofertas de Himalayas, Remotive, WWR y RemoteOK.
- **Solución Óptima Propuesta**:
  Mapear explícitamente desde BD (`work_mode = 'remote'` + restricciones geográficas parseadas en scrapers) `"jobLocationType": "TELECOMMUTE"` junto a `"applicantLocationRequirements"` válido (`Country: ES` / `EEA` / omitir si `worldwide` no acotable con `ES`) y verificar cada plantilla contra la API de validación Schema/Rich Results en `monitor_search_console.py`.

### [SEO-046] Enlaces externos hacia ofertas fuente (`url_source`) en `/job/[id]` o tarjetas necesitan políticas consistentes `rel="noopener noreferrer"` y gestión de enlaces muertos

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`, `frontend/components/JobCard.tsx`, `frontend/app/redirect/[id]/page.tsx` y `backend/deactivate_expired_jobs.py` (líneas 147-172)
- **Diagnóstico del Problema**:
  El usuario navega hacia la oferta externa a través de `/redirect/[id]` o enlaces directos al origen. Dado que el checker de enlaces muertos en `deactivate_expired_jobs.py:156` solo inspecciona `LIMIT 25` ofertas por ejecución mediante `HEAD`, cientos de ofertas externas que cierran a los pocos días de su publicación siguen listadas como activas enlazando a URLs `404` de ATS externos (`Lever`, `Greenhouse`, `Workable`, `Tecnoempleo`).
- **Riesgo o Impacto**:
  Mala experiencia de usuario al hacer clic para postular y encontrar una oferta cerrada en destino, aumentando la tasa de rebote rápida y enviando señales negativas de frescura de inventario a buscadores.
- **Solución Óptima Propuesta**:
  Aumentar la capacidad de verificación asíncrona en lotes (usando `aiohttp`/`concurrent.futures` con SSRF check y `GET` en caso de `405` sobre ATS conocidos, priorizando `last_checked_at ASC`) y marcar todos los redireccionamientos salientes con `rel="nofollow noopener noreferrer"` + `X-Robots-Tag: noindex`.

### [SEO-047] `backend/generate_trends_post.py` y `backend/generate_blog_post.py` generan títulos y slugs rígidos sin optimización semántica de búsqueda real

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/generate_trends_post.py` (líneas 119-121) y `backend/generate_blog_post.py` (línea 67)
- **Diagnóstico del Problema**:
  `generate_trends_post.py:121` fija literalmente títulos tipo `"Tendencias de Empleo Tech en España: Análisis de Mercado [2026-11-15]"` con slugs dependientes de fecha exacta (`tendencias-empleo-tech-espana-2026-11-15`), mientras `generate_blog_post.py` genera `informe-mercado-laboral-it-noviembre-2026`. Esto dispersa la autoridad histórica de enlaces entrantes entre decenas de URLs periódicas con fechas incrustadas en lugar de consolidar guías anuales o estudios perennes actualizados (*evergreen updating*).
- **Riesgo o Impacto**:
  Fragmentación temporal de autoridad SEO en estudios mensuales/semanales donde cada nueva edición parte con 0 backlinks e historial frente a competidores con una única URL consolidada actualizada (`.../informe-mercado-it-espana`).
- **Solución Óptima Propuesta**:
  Mantener URLs pilar perennes sin fecha en el slug para informes principales (actualizando contenido, `dateModified` y enlazando al histórico de archivo si se desea) y orientar los artículos nuevos hacia temáticas *long-tail* sin solapamiento por fecha.

### [SEO-048] `backend/refresh_old_articles.py` no coordina la revalidación ISR de Next.js ni envía actualización a IndexNow tras refrescar contenido evergreen

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/refresh_old_articles.py` (líneas 1-60) y `backend/run_all.py` (líneas 168-172)
- **Diagnóstico del Problema**:
  El paso `[7.4.1/9]` refresca fechas o metadatos en artículos evergreen de la tabla `blog_posts`, pero su alcance sin coordinación directa con invalidación de caché ISR ni envío automático de los slugs modificados a `submit_urls_to_indexnow()` retarda el descubrimiento de las actualizaciones en Bing/Yandex y Googlebot.
- **Riesgo o Impacto**:
  Retraso de días o semanas entre la actualización editorial en BD y el reflejo de frescura (`dateModified` / snippet) en los resultados de búsqueda.
- **Solución Óptima Propuesta**:
  Después de refrescar artículos en BD, disparar revalidación selectiva on-demand en Next.js (`revalidatePath('/blog/' + slug)`) y enviar exclusivamente los slugs realmente actualizados a IndexNow.

### [SEO-049] Pobre estructuración de `employmentType` y `experienceRequirements` en Schema `JobPosting`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 530-720)
- **Diagnóstico del Problema**:
  Aunque el portal detecta contratos (`contrato-indefinido`, `freelance`, `practicas`) y niveles de experiencia (`junior`, `mid`, `senior`) para `/trabajos/[sector]`, el marcado `JobPosting` en `/job/[id]` carece de mapeo normalizado estricto hacia los enumerados oficiales de Google (`FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `INTERN`, `TEMPORARY`) y `directApply` cuando aplica, además de carecer de validación cuando faltan campos recomendados por Google for Jobs.
- **Riesgo o Impacto**:
  Menor aparición de las vacantes cuando los candidatos filtran por tipo de jornada o prácticas directamente dentro de Google Jobs.
- **Solución Óptima Propuesta**:
  Extraer y persistir `employment_type` normalizado en el pipeline de scrapers y en el formulario `/publicar-oferta` para emitir siempre un valor válido del enumerado Google `employmentType` en `/job/[id]`.

### [SEO-050] Falta página de archivo o taxonomía paginada indexable de `/empresas` conectada a reseñas válidas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/empresas/page.tsx`, `frontend/app/empresas/[slug]/page.tsx`, `frontend/app/empresas/[slug]/[categoria]/page.tsx` y `frontend/app/job/[id]/page.tsx` (línea 512)
- **Diagnóstico del Problema**:
  El portal genera rutas programáticas por empresa (`/empresas/[slug]` y `/empresas/[slug]/[categoria]`) e intenta cruzar valoraciones de `company_reviews` en `/job/[id]`, pero `fetchCompanyRating()` falla por buscar `company_name` en lugar de `company_slug` (`[BUG-008]`), perdiendo riqueza de reseñas y estrellas reales en fichas enlazadas, mientras nombres de empresas sin normalizar (`"Acme SL"` vs `"Acme S.L."` vs `"ACME"`) fragmentan una misma compañía en múltiples slugs distintos.
- **Riesgo o Impacto**:
  Fragmentación de entidades de empresa en múltiples URLs `/empresas/[slug]` casi vacías (por ejemplo `accenture`, `accenture-spain`, `accenture-tecnologia`) dividiendo backlinks y reseñas entre alias de la misma empresa.
- **Solución Óptima Propuesta**:
  Reutilizar `normalize_company()` (`backend/logic/dedup.py:18`) para mapear alias corporativos hacia una entidad/tabla canónica `companies` con `canonical_slug` único, fusionando ofertas y reseñas bajo una sola ficha fuerte.

### [SEO-051] Uso incoherente de `slug` entre ofertas patrocinadas, scrapers y reescrituras en `next.config.ts`

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/next.config.ts` (líneas 75-105) y `backend/logic/slug.py` (líneas 14-23)
- **Diagnóstico del Problema**:
  `next.config.ts` mantiene reglas `redirects` (`/oferta/:id` -> `/job/:id`) y `rewrites` (`/trabajo-:ciudad/:tech`), mientras varios botones, bots sociales o plantillas construyen slugs dinámicos concatenando `title_es || title`, `location`, `company` e `id` en tiempo real sin que el formato esté almacenado de forma única en BD (`[SEO-027]`). Cuando `job_id` es un UUID con guiones (`crypto.randomUUID()`), extraer la parte final del ID en la ruta `/job/[id]` requiere distinguir un UUID de 5 segmentos separados por `-` de un entero simple antiguo.
- **Riesgo o Impacto**:
  Riesgo de errores 404/redirección si algún parser de `/job/[id]` asume que el ID es solo el último token tras `-` cuando el ID real es un UUID con 4 guiones internos.
- **Solución Óptima Propuesta**:
  Almacenar el `slug` completo en columna indexada `jobs.slug UNIQUE` al crear cada oferta y resolver `/job/[id]` por coincidencia exacta con fallback robusto tanto para UUID regex completo al final de la URL como para IDs enteros heredados.

### [SEO-052] Exceso de páginas satélite en `/trabajo-remoto-*` (`/trabajo-remoto-argentina`, `/trabajo-remoto-colombia`, `/trabajo-remoto-mexico`, `/trabajo-remoto-usa`) con inventario real insuficiente para España

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/trabajo-remoto-argentina/page.tsx`, `trabajo-remoto-colombia/page.tsx`, `trabajo-remoto-mexico/page.tsx`, `trabajo-remoto-usa/page.tsx`, `trabajo-remoto-alemania/page.tsx`, `trabajo-remoto-uk/page.tsx`, `trabajo-remoto-latinoamerica/page.tsx`, `trabajo-remoto-europa/page.tsx`
- **Diagnóstico del Problema**:
  El árbol `frontend/app/` contiene al menos 8 páginas fijas dedicadas a trabajo remoto en países específicos (Argentina, Colombia, México, EE. UU., Alemania, UK, Latinoamérica, Europa) enfocadas desde un portal cuyo inventario principal está orientado a España y feeds remotos globales genéricos. Si los filtros por país no devuelven un volumen sólido y sostenido de vacantes exclusivas verificadas para ese país, muestran listados prácticamente vacíos o genéricos.
- **Riesgo o Impacto**:
  Contenido duplicado o *doorway* geográfico con escasa relevancia real para búsquedas locales en esos países, reduciendo métricas de interacción orgánica global del dominio.
- **Solución Óptima Propuesta**:
  Aplicar `noindex, follow` dinámico cuando cualquier landing geo-remota cuente con `< 5` ofertas verificadas compatibles con esa región, o consolidarlas dentro de hubs regionales reales (`/trabajos/remoto-europa`, `/trabajos/remoto-espana`) respaldados por inventario verificado.

### [SEO-053] Falta `BreadcrumbList` homogéneo y jerarquía clara de categorías en todas las rutas secundarias (`/salarios`, `/glosario`, `/entrevistas`, `/certificaciones`)

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/components/Breadcrumbs.tsx`, `frontend/app/trabajos/[sector]/page.tsx` (líneas 1108-1117) y rutas de contenido editorial
- **Diagnóstico del Problema**:
  Mientras `/trabajos/[sector]` y `/noticias/[slug]` incorporan `Breadcrumbs` y `BreadcrumbList`, el portal presenta una arquitectura muy amplia (`certificaciones`, `comparar`, `convertirse-en`, `entrevistas`, `glosario`, `recursos`, `test-nivel`, `herramientas`) sin un árbol jerárquico estricto unificado en todas sus cabeceras y esquemas JSON-LD (`ListItem` con `item` explícito en el último paso es opcional/recomendado según versión de validador Google).
- **Riesgo o Impacto**:
  Distribución desigual de enlaces internos hacia verticales de contenido evergreen (`convertirse-en`, `glosario`, `certificaciones`) frente al peso excesivo que reciben enlaces del footer hacia `/trabajos/*`.
- **Solución Óptima Propuesta**:
  Auditar e inyectar el componente `Breadcrumbs` + `BreadcrumbList` consistente en cada familia de rutas evergreen e interconectar bidireccionalmente fichas de oferta/salario con guías (`convertirse-en`, `certificaciones`, `entrevistas`).

### [SEO-054] Páginas de `/salarios/...` calculan métricas con `LIMIT 500` y descartes erróneos de parser, generando datos salariales poco fiables para Google y usuarios

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/salarios.ts` (líneas 120-210) y `frontend/app/salarios/[tecnologia]/[ciudad]/[nivel]/page.tsx`
- **Diagnóstico del Problema**:
  Al fallar `calculateSalaryStats()` en strings `"40k - 55k"` e ignorar el nivel `mid` (`[BUG-011]`), además de limitar la consulta a `LIMIT 500`, los importes mostrados en tablas, títulos, metadatos (`descBase` en `/trabajos/[sector]`) y esquemas `Occupation` se calculan sobre un subconjunto sesgado y frecuentemente vacío.
- **Riesgo o Impacto**:
  Pérdida de credibilidad E-E-A-T ante usuarios e investigadores (cifras salariales ausentes o artificialmente sesgadas hacia puestos con formatos numéricos simples) y desajuste en fragmentos destacados de salarios IT.
- **Solución Óptima Propuesta**:
  Calcular agregaciones estadísticas (`AVG`, `MIN`, `MAX`, percentiles en SQL/servicio cacheado) sobre las columnas numéricas normalizadas en EUR de todo el histórico reciente (últimos 6-12 meses, sin `LIMIT 500` arbitrario), incluyendo soporte real para `mid`.

### [SEO-055] Ausencia de señales `E-E-A-T` verificables por autor en artículos editoriales (`blog_posts`) y reportes de mercado

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (línea 9, `AuthorBox`), `backend/generate_news_post.py` (línea 126) y `backend/generate_trends_post.py` (línea 192)
- **Diagnóstico del Problema**:
  Los generadores automáticos firman los artículos con nombres genéricos de sistema (`'Redacción Portal IT'`, `'Sistema de Tendencias IT'`, `'Podcast El Mercado IT'`) sin perfiles individuales verificables de editores/analistas ni metodología transparente de datos en cada pieza (`AuthorBox` muestra entidad genérica sin esquema `Person`/`ProfilePage` completo).
- **Riesgo o Impacto**:
  Menor puntuación de confianza editorial y transparencia metodológica (E-E-A-T) en verticales competitivos de empleo, carrera y salarios IT frente a medios especializados.
- **Solución Óptima Propuesta**:
  Enlazar `author` en JSON-LD a páginas de perfil/metodología (`/sobre-nosotros`, `/metodologia-datos`) detallando claramente la fuente estadística real de ofertas analizadas en el portal y revisión editorial humana.

### [SEO-056] `frontend/next.config.ts` no define redirección o manejo de URLs en mayúsculas o espacios codificados generando duplicados por case-sensitivity en Next.js

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/next.config.ts` y `frontend/middleware.ts`
- **Diagnóstico del Problema**:
  Next.js App Router distingue mayúsculas y minúsculas en rutas dinámicas (`/trabajos/React` vs `/trabajos/react`, `/empresas/Accenture` vs `/empresas/accenture`). Si un enlace externo o bot consulta segmentos con mayúsculas o barra final redundante sin normalización temprana, Next.js puede servir `200 OK` bajo la variante con mayúsculas creando duplicidad URL si el canonical apunta a minúsculas o si falla el lookup en BD case-sensitive.
- **Riesgo o Impacto**:
  Duplicación de URLs rastreadas por variación de capitalización o errores 404 inesperados en enlaces compartidos manualmente desde redes sociales.
- **Solución Óptima Propuesta**:
  Normalizar a minúsculas con redirección `301` desde `middleware.ts` (o `nginx.conf.template` excluyendo `/_next`, `/api` y parámetros firmados sensibles) para todas las rutas taxonómicas públicas.

### [SEO-057] Inyección de banners e interacción `PushSubscribe` / `CookieBanner` sin optimización de prioridad LCP / renderizado progresivo

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/layout.tsx` (líneas 217-290) y `frontend/components/CookieBanner.tsx`
- **Diagnóstico del Problema**:
  `CookieBanner` permanece oculto inicialmente (`show = false` en SSR, activado en `useEffect` al leer `localStorage`), por lo que en la primera visita del usuario o herramientas Lighthouse mobile aparece de repente anclado abajo (`fixed bottom-0`), pudiendo afectar la evaluación de elementos fijos intrusivos (*intrusive interstitials* / superposición sobre botones en pantallas móviles pequeñas `360x640`) si ocupa demasiada altura vertical sin margen seguro sobre el CTA principal.
- **Riesgo o Impacto**:
  Afectación potencial a métricas de experiencia de página móvil y puntuación INP si se rehidratan listeners globales pesados en el arranque inicial.
- **Solución Óptima Propuesta**:
  Diseñar el `CookieBanner` en móvil con altura compacta (`max-h-[45vh]` con padding inferior en el layout cuando sea visible) para no tapar nunca el H1/buscador principal (*above-the-fold*) y evitar que Lighthouse lo marque como intersticial bloqueante.

### [SEO-058] Ausencia de páginas pilar fuertes para búsquedas de salario agregado por ciudad (`/salarios-it-madrid`, `/salarios-it-barcelona`) indexables desde menú

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/salarios/page.tsx`, `frontend/app/salarios/[tecnologia]/page.tsx` y `frontend/app/salarios/[tecnologia]/[ciudad]/page.tsx`
- **Diagnóstico del Problema**:
  La jerarquía `/salarios/[tecnologia]/[ciudad]` organiza los salarios empezando siempre por tecnología (`/salarios/react/madrid`) y no ofrece hubs agregados comparativos por ciudad (`/salarios/madrid` con comparativa inter-tecnologías) ni índices claros navegables enlazados desde la portada o landing de ciudades. Además, las vistas `por-empresa` y `por-nivel` comparten estructura similar sin datos suficientes si falta normalización en `salarios.ts`.
- **Riesgo o Impacto**:
  Pérdida de tráfico informacional de alto volumen (`"cuánto cobra un programador en Madrid"`, `"salarios IT Barcelona 2026"`).
- **Solución Óptima Propuesta**:
  Crear hubs agregados comparativos por ciudad principal (`/salarios/ciudad/[ciudad]`) respaldados por consultas SQL reales sobre toda la base IT local, e interconectarlos desde `/trabajo-madrid`, `/trabajo-barcelona` y los informes de mercado.

### [SEO-059] `backend/monitor_search_console.py` valida esquemas sobre páginas sin autenticar alertas críticas hacia Telegram/Slack ni revisar cobertura XML real

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/monitor_search_console.py` (líneas 100-261)
- **Diagnóstico del Problema**:
  El script de monitorización solo imprime resultados en salida estándar de consola sin enviar alertas activas al canal privado de administración (`TELEGRAM_ADMIN_ID`) cuando detecta pérdida de JSON-LD, páginas caídas 5xx/4xx o caída brusca del número de ofertas indexables en sitemaps, y no consulta la API oficial de Google Search Console (URL Inspection API / Search Analytics) para detectar caídas de impresiones o exclusiones de indexación en tiempo real.
- **Riesgo o Impacto**:
  Los incidentes de desindexación masiva (como pérdida de resultados enriquecidos de `JobPosting` o corte de `db_proxy.php` a 1.000 URLs) tardan semanas en detectarse manualmente.
- **Solución Óptima Propuesta**:
  Conectar `monitor_search_console.py` con alerta inmediata por Telegram cuando un porcentaje >5% de URLs muestreadas pierda schema válido o descienda el conteo total del sitemap >15%, e integrar métricas semanales de Search Console API.

### [SEO-060] Desaprovechamiento de `internal link juice` hacia fichas individuales recientes y ofertas mejor pagadas desde `/blog` y `/noticias`

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx`, `frontend/app/blog/[slug]/page.tsx` y `backend/generate_weekly_article.py`
- **Diagnóstico del Problema**:
  Los artículos generados por Gemini (`generate_weekly_article.py`, `generate_news_post.py`) generan texto Markdown genérico desconectado del inventario en vivo de ofertas, sin insertar bloques automatizados de `"Ofertas relacionadas de esta tecnología activas hoy"` ni tablas dinámicas de salarios reales dentro de la plantilla del artículo.
- **Riesgo o Impacto**:
  Tráfico editorial informacional de blog/noticias convierte peor hacia postulaciones o búsquedas de empleo y no transfiere autoridad orgánica hacia las rutas transaccionales `/trabajos/[sector]` ni `/job/[id]`.
- **Solución Óptima Propuesta**:
  Inyectar automáticamente en el componente de detalle de `/blog/[slug]` y `/noticias/[slug]` un módulo SSR con 4-6 ofertas activas relacionadas y enlace directo a la calculadora `/salarios/[tech]`.

### [SEO-061] Página principal `/` y listados no diferencian en marcado visual ni accesibilidad ofertas patrocinadas vs orgánicas (`rel="sponsored"`)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/JobCard.tsx` y `frontend/app/page.tsx`
- **Diagnóstico del Problema**:
  Las ofertas de pago (`is_featured = TRUE` o patrocinadas en `/api/checkout`) enlazan a URLs de empresas externas (`url_source`) igual que los anuncios o afiliados presentes en el portal (`BOOTCAMP_LINK`, `CV_LINK` en correos o banners). Para cumplir las políticas contra spam de enlaces de Google (*Google Link Spam Policy*), todo enlace saliente por el cual exista contraprestación comercial, patrocinio o afiliación debe llevar `rel="sponsored noopener noreferrer"`.
- **Riesgo o Impacto**:
  Exposición a filtros algorítmicos o acciones manuales por enlaces pagados `dofollow` transmitiendo PageRank sin cualificación `rel="sponsored"`.
- **Solución Óptima Propuesta**:
  Aplicar `rel="sponsored noopener noreferrer"` de forma sistemática en todo enlace externo de ofertas patrocinadas (`is_featured` / `plan !== 'basico'`), patrocinadores de newsletter y enlaces de afiliación, manteniendo `rel="nofollow noopener noreferrer"` en ofertas agregadas externas.

### [SEO-062] Generación de URLs duplicadas entre `/trabajo/[ciudad]/[tech]` y `/trabajos/[tech]-en-[ciudad]` sin mapa claro de redirección o canonical cruzado

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/trabajo/[ciudad]/[tech]/page.tsx` y `frontend/app/trabajos/[sector]/page.tsx`
- **Diagnóstico del Problema**:
  Existen dos rutas dinámicas completas capaces de resolver exactamente el mismo cruce tecnología-ciudad (`/trabajo/madrid/react` vs `/trabajos/react-en-madrid`). Al no existir una estrategia única donde una redirija `301` o declare `canonical` apuntando hacia la otra, ambas rutas sirven listados equivalentes con distinto HTML/título compitiendo entre sí.
- **Riesgo o Impacto**:
  Duplicación interna de las páginas combinatorias de mayor intención transaccional del portal (`tech + ciudad`), partiendo señales de enlace y reduciendo probabilidades de rankear en Top 3.
- **Solución Óptima Propuesta**:
  Elegir `/trabajos/[sector]` (p. ej. `/trabajos/react-en-madrid`) como única jerarquía canónica definitiva y convertir `/trabajo/[ciudad]/[tech]` en redirecciones permanentes `301` limpias hacia `/trabajos/${tech}-en-${ciudad}`.

### [SEO-063] `sitemap.ts` realiza llamadas pesadas síncronas sin caching ni fragmentación para generar `sitemap/0.xml` en caliente

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 312-660)
- **Diagnóstico del Problema**:
  En cada solicitud de `/sitemap/0.xml` (con `force-dynamic` implícito o al revalidarse), Next.js descarga hasta 8.000 filas con `LEFT(description_snippet, 300)`, ejecuta docenas de bucles anidados regex por fila (`detectTechForSitemap`, `detectExperienceForSitemap`, `detectContractForSitemap`), combina producto cartesiano de 981 rutas `/salarios/...`, consulta `blog_posts`, consulta `empresas` (`sitemap/3.xml`) y arma el XML en memoria en una única petición HTTP.
- **Riesgo o Impacto**:
  Tiempos de respuesta elevados (`timeout` potenciales para Googlebot bajo alta carga o latencia de BD/`db_proxy.php`), picos de memoria Node.js y entrega incompleta si la petición excede el timeout del proxy Nginx (`proxy_read_timeout`).
- **Solución Óptima Propuesta**:
  Precalcular periódicamente (cada 1-2 horas mediante job o caché Redis/estático) las tablas de conteo programático (`programmatic_taxonomy_counts`) y almacenar XMLs pre-renderizados con compresión gzip y `ETag` en caché CDN/Nginx.

### [SEO-064] Metadatos `alternates.languages` en `/trabajos/[sector]` omiten parámetros de paginación o filtros válidos al generar `es-ES` / `en`

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 597-616)
- **Diagnóstico del Problema**:
  En `generateMetadata`, las páginas paginadas (`?page=2`) correctamente marcan `robots: { index: false, follow: true }`, pero simultáneamente conservan en líneas `601-616` `canonical` y `hreflang` (`es-ES`, `en`, `x-default`) apuntando a la URL base sin `?page=2` mientras la página tiene `noindex`. Emitir `canonical` hacia la página 1 junto con `noindex` en página 2 envía señales mixtas a Googlebot (y emitir `hreflang` en páginas `noindex` es innecesario).
- **Riesgo o Impacto**:
  Señales mixtas en Search Console sobre páginas paginadas ("Excluida por etiqueta canonical alternativa" vs "Excluida por etiqueta noindex").
- **Solución Óptima Propuesta**:
  Para páginas `validPage > 1`, utilizar canonical autorreferente (`?page=${validPage}`) manteniendo `robots: { index: false, follow: true }` y omitir `alternates.languages` en páginas `noindex`.

### [SEO-065] Ausencia de página pública informativa y metadatos del crawler en `/bot` sincronizados con `USER_AGENT` real de Scrapy y scripts

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/bot/page.tsx`, `backend/job_aggregator/settings.py` (línea 22) y `backend/scrapers/*.py`
- **Diagnóstico del Problema**:
  Los scrapers Python anuncian `PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot; bot@portalempleoit.com)` y existe la ruta `/bot`, pero `job_aggregator/settings.py:22` sigue anunciando `job_aggregator (+http://www.yourwebsite.com)`. Si un webmaster externo revisa su tráfico siguiendo la URL del `User-Agent`, un bot llega a un dominio inexistente mientras el otro lleva a `/bot` (donde conviene además asegurar `noindex` o información clara técnica de contacto e IPs/opt-out).
- **Riesgo o Impacto**:
  Bloqueo innecesario por firewalls de fuentes españolas legítimas al identificar un crawler mal configurado con dominio genérico de plantilla (`yourwebsite.com`).
- **Solución Óptima Propuesta**:
  Alinear el `User-Agent` en `settings.py` hacia `https://portalempleoit.com/bot` y documentar en `/bot` política de rastreo responsable, frecuencia, cumplimiento `robots.txt`/`TDM-Reservation` y canal directo de exclusión instantánea para empleadores.
