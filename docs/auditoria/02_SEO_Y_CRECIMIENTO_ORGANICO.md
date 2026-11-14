# 02. Auditoría de SEO Técnico, Indexación y Crecimiento Orgánico

> **Alcance**: Schema.org `JobPosting` (Google for Jobs), ciclo de vida de ofertas caducadas y *crawl budget*, sitemaps XML y `robots.ts`, Google Indexing API / IndexNow, SEO programático, `hreflang`/multi-idioma, Core Web Vitals (LCP, CLS, INP) y arquitectura de enlazado interno.  
> **Volumen**: 65 hallazgos (`SEO-001` a `SEO-065`).

---

## Bloque I: Datos Estructurados `JobPosting` y Google for Jobs

### [SEO-001] Declaración inexacta de `directApply` en Schema `JobPosting` para ofertas externas agregadas ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/job/[id]/page.tsx` calcula `directApply` dinámicamente como `false` en ofertas agregadas externas y `true` solo en nativas/patrocinadas)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (generación del objeto JSON-LD `JobPosting`)
- **Diagnóstico del Problema**:
  Las directrices oficiales de Google for Jobs prohíben marcar `directApply: true` cuando la candidatura no se completa íntegramente dentro del propio dominio sino que redirige al usuario a un portal de terceros (vía `/redirect/[id]`). El marcado estructurado en `frontend/app/job/[id]/page.tsx` trata de forma deficiente o inconsistente esta propiedad frente a la naturaleza de agregador del portal, cuyas ofertas proceden mayoritariamente de fuentes externas (`remotive`, `remoteok`, `wwr`, `tecnoempleo`, `stratos`, `himalayas`, etc.).
- **Riesgo o Impacto**:
  Incumplimiento directo de las directrices de calidad de Google for Jobs, con riesgo de invalidación del fragmento enriquecido de empleo o acción manual por datos estructurados engañosos (*misleading job application experience*).
- **Solución Óptima Propuesta**:
  1. Establecer `directApply: true` **únicamente** en ofertas nativas/patrocinadas donde la solicitud o contacto se gestione directamente en `portalempleoit.com`, y `directApply: false` (u omitirlo) en todas las ofertas agregadas externas que redirigen a través de `/redirect/[id]`.
  2. Incorporar pruebas automatizadas de validación de esquema JSON-LD diferenciando ofertas agregadas y directas.

### [SEO-002] Campos geográficos incompletos (`addressRegion`, `postalCode`, `addressCountry`) en `jobLocation.address` ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`PostalAddress` en `job/[id]/page.tsx` incluye `addressLocality`, `addressRegion` y `addressCountry`)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (`PostalAddress` dentro de `jobLocation`)
- **Diagnóstico del Problema**:
  Google for Jobs requiere jerarquía geográfica completa en `PostalAddress` para posicionar ofertas en búsquedas locales ("empleo programador Madrid"). La generación de JSON-LD en `frontend/app/job/[id]/page.tsx` parte de un campo `location` en texto libre heterogéneo procedente de scrapers, dejando incompletos o sin normalizar subcampos clave como `addressRegion` (comunidad autónoma / provincia), `postalCode` y código ISO `addressCountry`.
- **Riesgo o Impacto**:
  Pérdida de visibilidad en el paquete local de Google for Jobs y advertencias recurrentes de "campos faltantes" en Google Search Console, cediendo tráfico de alta intención local frente a agregadores con geoposicionamiento normalizado.
- **Solución Óptima Propuesta**:
  1. Mantener en backend un diccionario normalizador de ciudades españolas/europeas (`Madrid -> { addressLocality: "Madrid", addressRegion: "Comunidad de Madrid", addressCountry: "ES" }`) ejecutado en la ingesta antes de guardar.
  2. Serializar siempre `addressLocality`, `addressRegion` y código ISO 3166-1 alpha-2 en `addressCountry` dentro de `PostalAddress`.

### [SEO-003] Uso inconsistente de `applicantLocationRequirements` y `jobLocationType: "TELECOMMUTE"` en ofertas remotas ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`jobLocationType: "TELECOMMUTE"` emite siempre `applicantLocationRequirements` con `Country` válido en `job/[id]/page.tsx`)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`
- **Diagnóstico del Problema**:
  Cuando una oferta marca `jobLocationType: "TELECOMMUTE"` (trabajo en remoto), Google for Jobs exige obligatoriamente especificar `applicantLocationRequirements` con al menos un objeto `@type: "Country"` (o `"AdministrativeArea"`) indicando desde qué país/región puede trabajar el candidato, además de evitar marcar como `TELECOMMUTE` ofertas meramente híbridas. La detección de modalidad y serialización en `job/[id]/page.tsx` no garantiza esta correspondencia de forma consistente para ofertas remotas internacionales vs España/UE.
- **Riesgo o Impacto**:
  Rechazo explícito de la ficha remota por el validador de resultados enriquecidos de Google (error crítico: `Missing field "applicantLocationRequirements"`), dejando sin indexar en Google for Jobs uno de los verticales de mayor demanda ("empleo remoto IT").
- **Solución Óptima Propuesta**:
  1. Separar en base de datos la columna estructurada `work_mode` (`remote`, `hybrid`, `onsite`) y emitir `jobLocationType: "TELECOMMUTE"` **exclusivamente** cuando `work_mode === 'remote'`.
  2. Incluir `applicantLocationRequirements: [{ "@type": "Country", "name": "ES" }]` (o lista de países permitidos extraída en ingesta, nunca vacía) en todas las fichas con `TELECOMMUTE`.

### [SEO-004] Omisión y corrupción del bloque `baseSalary` en `JobPosting` por fallos de `parseSalary` ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`baseSalary` en `JobPosting` respaldado por `salary_parser.py` normalizado y `currency` ISO-4217 explícita)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`, `frontend/lib/salarios.ts`, `backend/logic/salary_parser.py`
- **Diagnóstico del Problema**:
  Los analizadores de salarios en frontend y backend (`salarios.ts` y `salary_parser.py`) fallan con formatos frecuentes en España/UE (notación `45k`, comas decimales europeas, rangos tipo `35.000 - 45.000€`, mensual vs anual o divisa USD/GBP sin distinguir). Esto provoca que en `frontend/app/job/[id]/page.tsx` el bloque `baseSalary` (`MonetaryAmount` / `QuantitativeValue`) falte por completo o serialice valores y unidades (`unitText`) imprecisos.
- **Riesgo o Impacto**:
  Google for Jobs penaliza fuertemente el CTR y la relevancia de ofertas sin `baseSalary` estructurado cuando las búsquedas incluyen filtros salariales, y descarta el atributo completo si `currency` o `unitText` (`YEAR`, `MONTH`, `HOUR`) son inválidos.
- **Solución Óptima Propuesta**:
  1. Almacenar en ingesta campos tipados y verificados (`salary_min_eur`, `salary_max_eur`, `salary_currency`, `salary_period`) cubiertos por batería de tests unitarios para formatos `45k`, `45.500€`, `$120k/yr` y `3.000€/mes`.
  2. Emitir `baseSalary` en JSON-LD solo cuando existan valores positivos validados con `currency` ISO-4217 y `unitText` exacto (`YEAR`/`MONTH`/`HOUR`).

### [SEO-005] Descripciones mínimas de relleno (`[Fuente: Stratos]` / `"Oferta de TecnoEmpleo"`) en `JobPosting.description` ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Mitigado (`JobPosting.description` enriquecido y `Course` spam retirado)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`, `backend/scraper_infoempleo.py` y `backend/job_aggregator/spiders/job_spider.py`
- **Diagnóstico del Problema**:
  Mientras `scraper_infoempleo.py` genera snippets estáticos del tipo `[Fuente: Stratos] {title}` y `job_spider.py` de Scrapy hardcodea `"Oferta de TecnoEmpleo"` (21 caracteres) sin entrar en la página de detalle, `frontend/app/job/[id]/page.tsx` acaba emitiendo fichas y marcados `JobPosting.description` extremadamente pobres en contenido textual útil.
- **Riesgo o Impacto**:
  Incumplimiento de los estándares de calidad de Google (contenido pobre / *Thin Content*) e imposibilidad de rankear por palabras clave secundarias (*stack*, requisitos, responsabilidades, beneficios).
- **Solución Óptima Propuesta**:
  1. Ampliar los scrapers y spiders para extraer la descripción estructurada real desde la ficha detalle (respetando la política de extracción autorizada y resúmenes legítimos) o excluir de indexación (`noindex`) aquellas fichas cuya descripción real no supere un umbral mínimo informativo (p. ej. 200 caracteres útiles).
  2. Prohibir la emisión de JSON-LD `JobPosting` en fichas con stubs sintéticos genéricos.

### [SEO-006] Dependencia de Clearbit para `hiringOrganization.logo` / `CompanyLogo` y falta de respaldo estructural ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`hiringOrganization.logo` usa `${BASE_URL}/logo.png` como respaldo estable en `job/[id]/page.tsx`)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` y `frontend/components/CompanyLogo.tsx`
- **Diagnóstico del Problema**:
  La resolución de logotipos de empresas descansa en integraciones externas hacia Clearbit (`CompanyLogo.tsx`) o URLs no verificadas, sin validar disponibilidad HTTP `200`, dimensiones ni formato compatible exigido por Google para `hiringOrganization.logo`, ni disponer de almacenamiento propio cacheado.
- **Riesgo o Impacto**:
  Imágenes rotas (`404` / timeout) en resultados enriquecidos de Google for Jobs y advertencias visuales que reducen la tasa de clics (CTR) frente a ofertas con logotipo corporativo válido.
- **Solución Óptima Propuesta**:
  1. Descargar, validar (formato PNG/JPEG/WebP, tamaño mínimo recomendado por Google) y cachear los logotipos legítimos en almacenamiento propio/CDN bajo ruta estable antes de referenciarlos en `hiringOrganization.logo`.
  2. Proporcionar un logotipo fallback limpio del propio portal cuando la empresa no tenga imagen verificada.

### [SEO-007] Conflicto entre `<meta name="robots" content="noindex">` y `validThrough` en ofertas recién caducadas ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Mitigado (`validThrough` emitido en formato ISO-8601 estricto y ofertas inactivas devuelven `notFound()` evitando conflictos)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 1–1160)
- **Diagnóstico del Problema**:
  Google indica explícitamente que para retirar una oferta expirada de Google for Jobs se debe permitir el rastreo de la propiedad `validThrough` pasada en el JSON-LD o devolver HTTP `404`/`410`. Cuando se aplica `noindex` prematuramente mientras la ficha aún figura en índice, o se bloquea la lectura del estado expirado, Googlebot no procesa correctamente la actualización de `validThrough` ni retira la ficha con limpieza en Google for Jobs.
- **Riesgo o Impacto**:
  Persistencia de ofertas caducadas visibles en el carrusel de Google for Jobs (provocando mala experiencia de usuario, rebotes y eventual penalización por datos desactualizados) o pérdida prematura de señales cuando aún corresponde un estado transitorio limpio.
- **Solución Óptima Propuesta**:
  1. Definir una máquina de estados clara de expiración: en las primeras 48–72 horas tras `is_active = 0`, servir la ficha con `validThrough` explícitamente pasado en el pasado y aviso claro al usuario + enlace a vacantes activas similares; pasado ese breve periodo (o si `validThrough` superó el umbral), devolver HTTP `410 Gone` definitivo sin `JobPosting`.

### [SEO-008] Ausencia de propiedad `identifier` (`PropertyValue`) estable en `JobPosting` ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`identifier` `PropertyValue` estable `job-${job.id}` presente en `JobPosting`)
 P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`
- **Diagnóstico del Problema**:
  El marcado `JobPosting` no garantiza un bloque `identifier` consistente vinculando `name` (organización/fuente) y `value` (ID canónico estable de base de datos o `external_id`), dejando la deduplicación de Google for Jobs únicamente a heurísticas por título y empresa.
- **Riesgo o Impacto**:
  Riesgo de duplicidad frente a otros portales o frente a re-ingestiones tras cambios menores de título/slug, perdiendo historial de señales de la oferta.
- **Solución Óptima Propuesta**:
  1. Añadir `identifier: { "@type": "PropertyValue", "name": job.company, "value": String(job.id) }` en todos los esquemas `JobPosting` de `frontend/app/job/[id]/page.tsx`.

### [SEO-009] Normalización imprecisa de `employmentType` y formato horario completo ISO-8601 en `datePosted`/`validThrough` ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`employmentType` normalizado y `datePosted`/`validThrough` formateados con `.toISOString()`)
 P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`
- **Diagnóstico del Problema**:
  Los valores libres de jornada procedentes de scrapers internacionales no siempre se mapean estrictamente a los literales enumerados que Google espera (`FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `TEMPORARY`, `INTERN`, `VOLUNTEER`, `PER_DIEM`, `OTHER`), y las fechas MySQL `DATETIME` sin sufijo de zona horaria (`Z` o `+01:00`/`+02:00`) producen advertencias en validadores estrictos.
- **Riesgo o Impacto**:
  Degradación silenciosa de filtros por tipo de jornada en Google for Jobs y advertencias en la Prueba de Resultados Enriquecidos.
- **Solución Óptima Propuesta**:
  1. Implementar una tabla de mapeo estricto hacia las constantes `employmentType` oficiales de Schema.org/Google.
  2. Formatear `datePosted` y `validThrough` siempre mediante `.toISOString()` con zona horaria explícita y nunca establecer `validThrough` indefinido en ofertas sin fecha límite explícita (usar TTL máximo controlado p. ej. +30 días desde publicación/renovación).

### [SEO-010] Omisión de propiedades recomendadas de alto valor en `JobPosting` (`skills`, `experienceRequirements`, `industry`) ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`skills`, `industry: "Information Technology"`, `experienceRequirements` y `educationRequirements` incluidos en `JobPosting`)
 P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`
- **Diagnóstico del Problema**:
  Aunque el portal clasifica categorías y extrae tecnologías en `classifier.py` / `tech_keywords`, el JSON-LD `JobPosting` desaprovecha propiedades enriquecidas como `skills`, `occupationalCategory`, `industry` y `experienceRequirements` derivables de la propia ficha.
- **Riesgo o Impacto**:
  Menor capacidad de emparejamiento semántico en Google for Jobs frente a portales que sí estructuran seniority y habilidades técnicas clave.
- **Solución Óptima Propuesta**:
  1. Serializar `skills` (array de tecnologías normalizadas detectadas), `industry: "Information Technology"` y `experienceRequirements` cuando la descripción o título permita clasificar nivel (`Junior`/`Mid`/`Senior`) con alta confianza.

---

## Bloque II: Ciclo de Vida de Ofertas Caducadas y Optimización del Crawl Budget

### [SEO-011] Borrado físico de ofertas (>90 días) en `deactivate_expired_jobs.py` provocando `404` masivos en lugar de `410 Gone` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`backend/deactivate_expired_jobs.py` amplía retención lógica a 180 días antes de purga física)
 P0 - Crítico
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (línea 164) y `frontend/app/job/[id]/page.tsx`
- **Diagnóstico del Problema**:
  El script de mantenimiento `backend/deactivate_expired_jobs.py` ejecuta en la línea 164 un `DELETE` físico de ofertas antiguas (>90 días) directamente de la tabla `jobs` sin conservar ninguna tabla histórica de IDs/slugs retirados. Cuando Googlebot u otros bots vuelven a rastrear cualquiera de esas miles de URLs antiguas, Next.js consulta `jobs`, no encuentra el registro y devuelve `404 Not Found` genérico (o falla el matching) en lugar de un código semántico definitivo `410 Gone`.
- **Riesgo o Impacto**:
  Desperdicio masivo de *crawl budget*: Googlebot reintenta periódicamente URLs `404` durante semanas o meses pensando que pueden volver, mientras el `410 Gone` acelera significativamente la desindexación y libera presupuesto de rastreo hacia las ofertas activas y páginas programáticas nuevas.
- **Solución Óptima Propuesta**:
  1. Antes de ejecutar `DELETE` en `deactivate_expired_jobs.py`, mover `(job_id, slug, category, city, deleted_at)` a una tabla ligera `expired_jobs_graveyard` (o conservar un estado `archived = 1` sin cuerpo completo).
  2. En `frontend/app/job/[id]/page.tsx`, si el ID pertenece al histórico retirado, responder inmediatamente con código HTTP **410 Gone** limpio a nivel de Route Handler / Middleware o cabecera HTTP estándar.

### [SEO-012] Gestión subóptima de ofertas inactivas (`is_active = 0`) con riesgo de *Soft 404* en Next.js ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/job/[id]/page.tsx` devuelve `notFound()` real cuando `!job || !job.is_active`, evitando Soft 404)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 1–1160)
- **Diagnóstico del Problema**:
  En App Router de Next.js (`page.tsx`), `notFound()` dispara HTTP `404`, mientras que renderizar una pantalla alternativa de "Oferta expirada + otras ofertas similares" dentro de `page.tsx` emite **HTTP 200 OK**. Si una oferta expirada devuelve HTTP 200 con poco contenido o mensaje de oferta no disponible sin `410`/`404` adecuado, Google Search Console la clasifica como **Soft 404**.
- **Riesgo o Impacto**:
  Penalización progresiva de la eficiencia de rastreo del dominio (*crawl health*) y acumulación de cientos o miles de alertas de "Soft 404" en Search Console que lastran la autoridad del sitio completo.
- **Solución Óptima Propuesta**:
  1. Separar el comportamiento en Middleware / Route Handler para devolver HTTP `410 Gone` real en ofertas expiradas fuera de la ventana de gracia (sin servir HTTP `200`).
  2. Si se opta por UX con alternativas para usuarios humanos, servir el cuerpo amigable acompañado estrictamente del status HTTP `410` (Next.js Route Handler o página de error específica) para que bots reciban la señal HTTP exacta sin perder la UI de retención para personas.

### [SEO-013] Ausencia de estrategia de redirección semántica `301` o páginas puente para slugs con enlaces entrantes externos ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (redirección permanente `301` hacia slug canónico cuando cambia el segmento descriptivo)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` y `backend/deactivate_expired_jobs.py`
- **Diagnóstico del Problema**:
  El borrado uniforme en `deactivate_expired_jobs.py` trata igual una oferta sin tráfico que una URL de empleo que acumuló backlinks de alto valor desde redes sociales, agregadores o prensa tecnológica, perdiendo todo el *link equity* acumulado al desaparecer la ficha.
- **Riesgo o Impacto**:
  Pérdida neta de autoridad de dominio (PageRank) en cada ciclo trimestral de purga de ofertas.
- **Solución Óptima Propuesta**:
  1. Para ofertas sin backlinks ni tráfico relevante tras expiración -> responder HTTP `410 Gone`.
  2. Para ofertas con clics/impresiones significativas registradas o backlinks conocidos (o mediante enlace contextual prioritario), considerar consolidación o redirección semántica controlada hacia la página programática equivalente (`/trabajo-[ciudad]/[tech]`), cuidando que el destino sea temáticamente equivalente para evitar que Google lo marque como Soft-404.

### [SEO-014] Desfase de caché ISR y páginas cacheadas sirviendo ofertas desactivadas tras ejecuciones de cron ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (sitemaps e IndexNow sincronizados tras desactivación)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`, `frontend/app/page.tsx` y `backend/deactivate_expired_jobs.py`
- **Diagnóstico del Problema**:
  Cuando `backend/deactivate_expired_jobs.py` marca ofertas como inactivas o las elimina en MySQL desde GitHub Actions, no invoca ningún endpoint de *On-Demand Revalidation* (`revalidatePath` / `revalidateTag`) en Next.js para invalidar las páginas cacheadas afectadas ni sus listados padre.
- **Riesgo o Impacto**:
  Googlebot y usuarios finales continúan viendo durante horas ofertas ya cerradas como si siguieran activas (discrepancia entre mapa del sitio, listado principal y ficha individual).
- **Solución Óptima Propuesta**:
  1. Exponer un endpoint autenticado `/api/revalidate` protegido por secreto compartido con soporte `revalidateTag('jobs')` y `revalidatePath('/job/...')`.
  2. Invocarlo automáticamente al finalizar los jobs `main.py` y `deactivate_expired_jobs.py`.

### [SEO-015] Lectura masiva en `Footer.tsx` (150 ofertas sin filtro de descripción) y fallback engañoso `12450` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (`Footer.tsx` y `tendencias/page.tsx` sin cifras simuladas ante fallos)
 P2 - Medio
- **Ubicación exacta**: `frontend/components/Footer.tsx`
- **Diagnóstico del Problema**:
  `Footer.tsx` ejecuta dentro de `unstable_cache` una lectura de hasta 150 ofertas activas sin filtrar calidad mínima de descripción y utiliza un número fijo fallback (`12450`) si falla el cálculo. Cualquier fallo puntual o deriva de caché propaga cifras irreales o enlaces hacia ofertas pobres en todas las páginas del sitio (al residir en el footer global).
- **Riesgo o Impacto**:
  Distorsión de señales globales del dominio (enlaces en footer replicados cientos/miles de veces hacia páginas potencialmente débiles) y desperdicio de caché/BD.
- **Solución Óptima Propuesta**:
  1. Eliminar lecturas de ofertas individuales en el `Footer`: limitar el footer a enlaces evergreen consolidados (`/salarios`, `/tendencias`, principales ciudades y tecnologías con volumen real > umbral) obtenidos mediante consulta agregada `GROUP BY` ligera.

---

## Bloque III: Sitemaps XML, Robots.txt, Feeds e Indexación (IndexNow & Google Indexing API)

### [SEO-016] Desajuste entre `/sitemap.xml` en `robots.ts` y la estructura segmentada generada por `sitemap.ts` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/robots.ts` declara `sitemap.xml`, `sitemap-images.xml` y `sitemap-news.xml` alineados)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/robots.ts` (líneas 1–44) y `frontend/app/sitemap.ts` (líneas 1–788)
- **Diagnóstico del Problema**:
  `robots.ts` anuncia únicamente los sitemaps esperados sin alinear de forma verificada el índice maestro cuando `sitemap.ts` particiona múltiples sitemaps (`generateSitemaps` / `/sitemap/0.xml`, etc.), o bien compite con sitemaps auxiliares (`sitemap-news.xml`, `sitemap-images.xml`). Si la generación segmentada de Next.js App Router produce `/sitemap/0.xml` pero no genera automáticamente un `/sitemap.xml` índice en versiones concretas de Next.js, los rastreadores que leen `/sitemap.xml` reciben un 404 o una lista incompleta.
- **Riesgo o Impacto**:
  Descubrimiento parcial o nulo de sub-sitemaps de ofertas y páginas programáticas por Googlebot y Bingbot.
- **Solución Óptima Propuesta**:
  1. Verificar explícitamente qué ruta exacta sirve `/sitemap.xml` en build de producción (`next build` / Route Handler explícito para `/sitemap.xml` como `<sitemapindex>`) referenciando todos los sub-sitemaps (`/sitemap-jobs-[n].xml`, `/sitemap-programmatic.xml`, `/sitemap-news.xml`, `/sitemap-images.xml`).
  2. Declarar en `robots.ts` exactamente los sitemaps servidos con código `200 OK`.

### [SEO-017] Uso indiscriminado de `lastModified: new Date()` invalidando la señal `<lastmod>` en `sitemap.ts` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`SITE_LAST_STRUCTURAL_UPDATE` fijado a fecha estable en `frontend/app/sitemap.ts`)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 1–788)
- **Diagnóstico del Problema**:
  `sitemap.ts` asigna `new Date()` (el timestamp actual del renderizado de cada petición HTTP al sitemap) a URLs estáticas y combinatorias programáticas que no han sufrido cambio alguno desde hace días o semanas. Google ha documentado reiteradamente que cuando `<lastmod>` cambia artificialmente en cada crawl sin cambio real de contenido, pasa a ignorar `<lastmod>` en todo el dominio.
- **Riesgo o Impacto**:
  Pérdida de confianza de Googlebot en la señal `<lastmod>` de todo el sitio web, ralentizando el descubrimiento de ofertas realmente nuevas o recién actualizadas.
- **Solución Óptima Propuesta**:
  1. Utilizar exclusivamente la fecha real de actualización en BD (`COALESCE(updated_at, created_at)`) para ofertas, noticias y páginas programáticas (p. ej. `MAX(created_at)` de las ofertas de esa ciudad/tecnología), y una fecha de despliegue fija para páginas legales/estáticas.

### [SEO-018] Envíos inconsistentes sin slug (`/job/${job_id}`) en `index_new_jobs.py` frente a URLs con slug en `index_now.py` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`backend/index_new_jobs.py` construye URLs con `get_job_slug(job_id, title, location, company)`)
 P0 - Crítico
- **Ubicación exacta**: `backend/index_new_jobs.py` (línea 67) frente a `backend/index_now.py` (línea 42) y `backend/deactivate_expired_jobs.py` (línea 84)
- **Diagnóstico del Problema**:
  En la línea 67 de `backend/index_new_jobs.py`, el script construye y notifica hacia la API de Google Indexing / buscadores la URL corta **sin slug** (`/job/${job_id}`), mientras que `index_now.py` (línea 42) y `deactivate_expired_jobs.py` (línea 84) usan correctamente `get_job_slug(...)` construyendo la URL canónica completa.
- **Riesgo o Impacto**:
  Desperdicio crítico de la cuota diaria estricta de Google Indexing API (generalmente 200 peticiones/día por defecto) enviando URLs no canónicas que redirigen o compiten con el canonical real de `/job/[slug-id]`, retrasando la aparición instantánea en Google for Jobs.
- **Solución Óptima Propuesta**:
  1. Centralizar una única función `build_canonical_job_url(job_id, title, company)` importada obligatoriamente por `index_new_jobs.py`, `index_now.py`, `deactivate_expired_jobs.py` y todos los bots/feeds.
  2. Corregir inmediatamente la línea 67 de `backend/index_new_jobs.py` para emitir siempre la URL canónica completa con slug.

### [SEO-019] Conflicto entre dos claves IndexNow distintas (`85ae2b8a...` vs `8f4b9c1d...`) impidiendo verificación en Bing/Yandex ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (IndexNow centralizado en `backend/logic/indexnow.py` usando `INDEXNOW_KEY` de entorno)
 P0 - Crítico
- **Ubicación exacta**: `backend/index_new_jobs.py`, `backend/index_now.py`, `backend/deactivate_expired_jobs.py`
- **Diagnóstico del Problema**:
  Coexisten al menos dos claves IndexNow distintas en los scripts del backend (`85ae2b8a...` frente a `8f4b9c1d...`). Dado que el protocolo IndexNow verifica la propiedad comprobando `https://dominio/<clave>.txt` contra la clave enviada en la petición JSON, al menos uno de los flujos envía sistemáticamente una clave cuya URL de verificación no coincide o falla.
- **Riesgo o Impacto**:
  Descartes silenciosos (HTTP 403/422) de notificaciones IndexNow de nuevas ofertas o bajas hacia Bing, Yandex, DuckDuckGo y Seznam, perdiendo tráfico orgánico fuera de Google.
- **Solución Óptima Propuesta**:
  1. Unificar una única `INDEXNOW_KEY` desde entorno en todos los scripts y asegurar que el archivo estático/ruta dinámica `/{INDEXNOW_KEY}.txt` devuelva exactamente esa cadena con `Content-Type: text/plain`.

### [SEO-020] Sobrepoblación del sitemap con taxonomías redundantes y falta de particionado estricto al límite de 50.000 URLs ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (`frontend/app/sitemap.ts` particionado con límites controlados y revalidate 2h)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 1–788)
- **Diagnóstico del Problema**:
  `sitemap.ts` genera múltiples familias de URLs programáticas (`/trabajos/[sector]`, `/trabajo-[ciudad]/[tech]`, rutas regionales, salarios, tendencias y ofertas) en una estructura extensa (788 líneas) sin garantizar estrictamente la exclusión de combinaciones vacías o de bajo valor y arriesgando superar el límite protocolario de 50.000 URLs o 50 MB por archivo XML conforme crezca la base de ofertas.
- **Riesgo o Impacto**:
  Rechazo íntegro del archivo XML por superación de límites en Google Search Console y dilución de presupuesto de rastreo enviando a Googlebot miles de combinaciones de ciudad/tecnología redundantes o vacías.
- **Solución Óptima Propuesta**:
  1. Dividir estrictamente por bloques de máximo **25.000–40.000 URLs** mediante `<sitemapindex>` por tipo de entidad (ofertas activas, combinaciones ciudad+tech verificadas `count >= 3`, salarios con datos reales, noticias/blog).
  2. Excluir del sitemap cualquier página marcada como `noindex` o con menos de 3 ofertas activas reales.

### [SEO-021] Riesgo de slugs duplicados o colisionables entre tablas y rutas en `sitemap.ts` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (slugs generados mediante `getJobSlug` con sufijo de ID único)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/sitemap.ts` y `backend/logic/slug.py`
- **Diagnóstico del Problema**:
  Las reglas de generación de slug difieren ligeramente o pueden producir colisiones entre tecnologías/sectores normalizados (`c++`/`c#`, `node.js`/`nodejs`, acentos y guiones) en `sitemap.ts` frente a `backend/logic/slug.py` o `frontend/lib/salarios.ts`, emitiendo URLs distintas en sitemap que apuntan al mismo contenido o 404.
- **Riesgo o Impacto**:
  Errores "Duplicada sin versión canónica elegida por el usuario" y "No encontrada (404)" dentro del informe de Indexación de Páginas de Search Console.
- **Solución Óptima Propuesta**:
  1. Estandarizar una tabla canónica de slugs permitidos compartida (JSON generado en build/backend o tabla DB `taxonomies` con columna `slug UNIQUE`) como única fuente de verdad tanto para Python como para Next.js.

### [SEO-022] `sitemap-news.xml` incumpliendo ventana estricta de 48h y desalineación de ruta `/noticias/` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/sitemap-news.xml/route.ts` aplica estrictamente la ventana de 48h sin relleno antiguo)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/sitemap-news.xml/route.ts`
- **Diagnóstico del Problema**:
  Las especificaciones oficiales de Google News Sitemap exigen incluir **exclusivamente** artículos publicados en las últimas 48 horas. Sin embargo, `sitemap-news.xml/route.ts` aplica un fallback que rellena con artículos más antiguos (>48h) cuando no existen noticias recientes, además de potenciales incongruencias con rutas del blog frente a `/noticias/`.
- **Riesgo o Impacto**:
  Advertencias y posible revocación de confianza/elegibilidad para Google News y Google Discover por incluir contenido histórico antiguo dentro del sitemap dedicado de noticias frescas.
- **Solución Óptima Propuesta**:
  1. Filtrar estrictamente `WHERE created_at >= NOW() - INTERVAL 48 HOUR` en `sitemap-news.xml/route.ts` y devolver un `<urlset>` XML válido vacío (con `<urlset xmlns=...>`) cuando no haya artículos en las últimas 48h, nunca noticias antiguas.

### [SEO-023] Exposición de rutas dinámicas `/opengraph-image` dentro de `sitemap-images.xml` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/sitemap-images.xml/route.ts` referencia `/og-image.png` estático en lugar de `/opengraph-image` dinámico)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/sitemap-images.xml/route.ts`
- **Diagnóstico del Problema**:
  `sitemap-images.xml` declara como URLs de imágenes rastreables las rutas generadas dinámicamente al vuelo por Next.js (`/job/{id}/opengraph-image`). Cuando Googlebot-Image procesa dicho sitemap, dispara miles de renderizados Satori/Edge pesados bajo demanda que producen imágenes genéricas de texto superpuesto con bajo valor para Google Images.
- **Riesgo o Impacto**:
  Consumo masivo de recursos de cómputo en Edge/Serverless y desperdicio de cuota de rastreo de Googlebot-Image sin retorno significativo en tráfico de imágenes.
- **Solución Óptima Propuesta**:
  1. Limitar `sitemap-images.xml` a imágenes editoriales reales únicas (artículos de noticias/blog con alt text descriptivo y logotipos estáticos optimizados), retirando las imágenes OpenGraph autogeneradas de cada oferta efímera.

### [SEO-024] Conflicto entre reglas `Disallow` de parámetros en `robots.ts` y URLs rastreables con `hreflang` o filtros ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (`robots.ts` permite el rastreo de páginas programáticas y rutas limpias)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/robots.ts` (líneas 1–44) y `frontend/app/layout.tsx` / `frontend/app/page.tsx`
- **Diagnóstico del Problema**:
  El archivo `robots.ts` restringe rutas o patrones de consulta de búsqueda mientras el enlazado interno, `hreflang` (`?lang=en`) o componentes de UI generan enlaces hacia URLs parametrizadas que quedan bloqueadas al rastreo. Cuando una URL tiene `Disallow` en `robots.txt`, Googlebot **no puede leer** su etiqueta `<link rel="canonical">` ni su `<meta name="robots" content="noindex">`, pudiendo indexar la URL "sin descripción" si recibe algún enlace.
- **Riesgo o Impacto**:
  Indexación de URLs huérfanas con mensaje *"Se ha indexado aunque está bloqueada por robots.txt"* en Search Console y rotura de la validación de etiquetas `hreflang`.
- **Solución Óptima Propuesta**:
  1. No bloquear por `robots.txt` URLs cuyo objetivo es transmitir señales (`canonical`, `noindex` o `hreflang`): mover idiomas a rutas limpias `/en/...` y usar `meta robots noindex, follow` en combinaciones de filtros no canónicas antes que bloquearlas en `robots.ts` (salvo filtros explosivos de ordenación sin enlaces HTML `<a>` o parámetros de tracking puro).

### [SEO-025] Invocación del endpoint retirado `google.com/ping?sitemap=...` en `backend/ping_sitemap.py` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`backend/ping_sitemap.py` retirado; notificaciones delegadas en Google Indexing API e IndexNow)
 P2 - Medio
- **Ubicación exacta**: `backend/ping_sitemap.py` (líneas 1–23)
- **Diagnóstico del Problema**:
  El script intenta notificar actualizaciones de sitemap enviando peticiones HTTP GET al endpoint `https://www.google.com/ping?sitemap=...`, el cual fue oficialmente descontinuado y apagado por Google en 2023 (devolviendo 404/obsoleto), además de realizarse sin timeout.
- **Riesgo o Impacto**:
  Falsa sensación de notificación rápida de sitemaps tras el scraping diario mientras el script falla o consume tiempo inútilmente dentro de `run_all.py`.
- **Solución Óptima Propuesta**:
  1. Eliminar `backend/ping_sitemap.py` y su invocación en `run_all.py`, sustituyéndolo exclusivamente por Google Indexing API (para `JobPosting`), `<lastmod>` fiable en sitemaps XML e IndexNow para Bing/Yandex.

### [SEO-026] Envíos HTTP secuenciales no agrupados en `backend/index_new_jobs.py` ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`backend/index_new_jobs.py` envía lote único a IndexNow vía `submit_urls_to_indexnow`)
 P2 - Medio
- **Ubicación exacta**: `backend/index_new_jobs.py` (líneas 1–124)
- **Diagnóstico del Problema**:
  El script envía las notificaciones URL a URL de forma secuencial en bucle (`for` sobre resultados), sin utilizar el endpoint por lotes (`POST https://api.indexnow.org/indexnow` con array `urlList` de hasta 10.000 URLs) ni gestionar reintentos con `Retry-After` ante límites `429`.
- **Riesgo o Impacto**:
  Latencia elevada en runners cron y probabilidad alta de sufrir throttling HTTP 429 en ráfagas tras importar cientos de ofertas nuevas.
- **Solución Óptima Propuesta**:
  1. Utilizar envío batch JSON en IndexNow (1 petición por lote) y registrar en BD el timestamp `indexed_at` de cada oferta para procesar de manera incremental y reintentable en Google Indexing API dentro de la cuota diaria prioritaria (ofertas recientes de mayor salario/calidad primero).

### [SEO-027] Feeds RSS y partners (`feed.xml`, `jooble`, `talent`) emitiendo enlaces `/job/[id]` sin slug canónico ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Resuelto (`feed.xml`, `jooble` y `talent` usan `getJobSlug(job)` canónico)
 P2 - Medio
- **Ubicación exacta**: `frontend/app/feed.xml/route.ts`, `frontend/app/api/feeds/jooble/route.ts` y `frontend/app/api/feeds/talent/route.ts`
- **Diagnóstico del Problema**:
  Los feeds XML públicos consumidos por lectores RSS, Jooble y Talent.com construyen enlaces hacia `/job/${id}` omitiendo el slug descriptivo canónico (`get_job_slug` / slug de título y empresa).
- **Riesgo o Impacto**:
  Fragmentación de URLs rastreadas por bots asociados, pérdida de palabras clave descriptivas en la URL de referencia y saltos de redirección innecesarios al aterrizar usuarios desde agregadores.
- **Solución Óptima Propuesta**:
  1. Unificar la función generadora de URLs canónicas `getJobUrl(job)` en `frontend/lib/` y aplicarla en `feed.xml`, `jooble/route.ts` y `talent/route.ts`.

### [SEO-028] Cobertura incompleta en `backend/monitor_search_console.py` sobre rutas `JobPosting` críticas ✅ [RESUELTO - Lote 4.2]

- **Estado de Remediación**: [x] Mitigado (validación de `JobPosting` y sitemaps cubierta en auditoría y checks de build)
 P2 - Medio
- **Ubicación exacta**: `backend/monitor_search_console.py` (líneas 1–100)
- **Diagnóstico del Problema**:
  El script de monitorización comprueba la existencia de tipos JSON-LD en páginas genéricas del sitio live, omitiendo auditar específicamente muestras reales de `/job/[slug-id]` frente a todos los requisitos obligatorios de `JobPosting` (y detección temprana de `baseSalary`, `validThrough`, `directApply`, códigos `410` vs `404`).
- **Riesgo o Impacto**:
  Regresiones en el esquema principal de negocio (`JobPosting`) pueden pasar semanas inadvertidas en producción hasta que Search Console reporte la caída de impresiones.
- **Solución Óptima Propuesta**:
  1. Ampliar `monitor_search_console.py` para validar automáticamente en cada despliegue 5 fichas recientes de `/job/...`, 1 ficha expirada y páginas programáticas clave comprobando propiedades obligatorias, códigos HTTP exactos y tags `canonical`/`hreflang`.

---

## Bloque IV: SEO Programático, Thin Content y Arquitectura de Contenidos

### [SEO-029] Páginas programáticas `/trabajo-[ciudad]/[tech]` indexables con 0 vacantes (*Thin Content / Soft 404*) ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/trabajo-[ciudad]/[tech]/page.tsx` emite `robots: { index: false, follow: true }` cuando no hay ofertas activas)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/trabajo-[ciudad]/[tech]/page.tsx`
- **Diagnóstico del Problema**:
  Las páginas combinatorias `/trabajo-[ciudad]/[tech]` (ej. tecnología de nicho en una ciudad pequeña) se renderizan con etiqueta de indexación abierta (`index: true`) aunque la consulta en MySQL devuelva **0 ofertas activas**. Presentar decenas o cientos de landings programáticas sin ofertas reales bajo títulos prometiendo vacantes activas constituye un patrón clásico de *Doorway / Thin Content / Soft 404*.
- **Riesgo o Impacto**:
  Penalización algorítmica de calidad a nivel de sitio (*Helpful Content / Sitewide Quality Signal*) y desgaste severo del presupuesto de rastreo sobre combinaciones vacías.
- **Solución Óptima Propuesta**:
  1. Aplicar dinámicamente `<meta name="robots" content="noindex, follow">` (vía `generateMetadata`) siempre que el número de ofertas activas locales sea `< 2` o `0`, permitiendo seguir los enlaces hacia alternativas activas pero sacando las combinaciones vacías del índice.
  2. Excluir del `sitemap.ts` toda combinación ciudad+tecnología por debajo de un umbral mínimo de ofertas activas reales (p. ej. `>= 3`).

### [SEO-030] Contenido pobre (`TECH_DESCRIPTIONS`) y riesgo de canibalización en `/trabajos/[sector]` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (rutas `/trabajos/[sector]` diferenciadas con breadcrumbs y descripción contextual)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx`
- **Diagnóstico del Problema**:
  El mapa `TECH_DESCRIPTIONS` contiene párrafos breves genéricos para cada vertical/tecnología sin datos cuantitativos dinámicos propios de valor único (mediana salarial local de esa tecnología, distribución remoto vs híbrido, top empresas contratando, tendencia interanual), compitiendo directamente en keywords amplias con la home parametrizada y con las landings `/trabajo-[ciudad]/[tech]` o `/salarios`.
- **Riesgo o Impacto**:
  Estancamiento fuera del Top 10 en búsquedas competitivas ("trabajo Python España", "ofertas DevOps") por falta de profundidad informativa frente a competidores y fluctuaciones por canibalización interna.
- **Solución Óptima Propuesta**:
  1. Enriquecer `/trabajos/[sector]` con bloques dinámicos únicos generados desde agregaciones reales en MySQL: rango salarial P25/P50/P75 del sector, % de teletrabajo, top 5 ciudades con más demanda y preguntas frecuentes específicas (`FAQPage` / texto útil), enlazando claramente con intención comercial hacia `/salarios/[tecnologia]` sin duplicar encabezados `<h1>` / `<title>`.

### [SEO-031] Ruptura de enlazado interno y slugs incoherentes hacia `/salarios/[tecnologia]/[ciudad]` y `/tendencias/[sector]` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (enlazado interno unificado con `getJobSlug` y rutas reales en `llms.txt` y sitemaps)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/salarios/page.tsx`, `frontend/app/tendencias/page.tsx`, `frontend/lib/salarios.ts` y `backend/logic/slug.py`
- **Diagnóstico del Problema**:
  Las reglas de construcción de slugs entre `salarios.ts` y el resto de componentes (ej. caracteres especiales `C#`, `C++`, `.NET`, `Node.js`, espacios y acentos en nombres de ciudades) no son uniformes respecto a las rutas dinámicas esperadas `/salarios/[tecnologia]/[ciudad]` y `/tendencias/[sector]`. Asimismo `frontend/public/llms.txt` cita patrones de ruta no alineados con la convención real.
- **Riesgo o Impacto**:
  Enlaces internos rotos (`404`) desde tarjetas, breadcrumbs o artículos editoriales hacia landings de alto valor monetizable/SEO, desperdiciando autoridad interna y rompiendo recorridos de Googlebot.
- **Solución Óptima Propuesta**:
  1. Unificar en `frontend/lib/slugs.ts` un catálogo determinista de normalización bidireccional (`c-sharp`, `cpp`, `dotnet`, `nodejs`, `pais-vasco`, etc.) cubierto por tests de integración verificando HTTP `200` para cada enlace emitido.

### [SEO-032] Snippets pobres en origen (`scraper_infoempleo.py` y `job_spider.py`) lastrando la densidad semántica de fichas ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`backend/scraper_infoempleo.py` limpiado de `URL_RSS` muerto y enriquecido en Lote 3.3)
 P1 - Alto
- **Ubicación exacta**: `backend/scraper_infoempleo.py` (líneas 1–110) y `backend/job_aggregator/spiders/job_spider.py` (líneas 1–102)
- **Diagnóstico del Problema**:
  Dos de los scrapers que alimentan el inventario español (`stratos-ad.com/trabajo` en `scraper_infoempleo.py` y `TecnoEmpleo` en `job_spider.py`) no extraen el cuerpo descriptivo de la oferta: almacenan literales vacíos o sintéticos de 20–40 caracteres (`[Fuente: Stratos] {title}` y `"Oferta de TecnoEmpleo"`). Como resultado, miles de fichas `/job/[id]` indexadas para búsquedas en España contienen apenas el título y metadatos repetitivos del layout.
- **Riesgo o Impacto**:
  Ratio texto útil/código extremadamente bajo (*Low text-to-HTML ratio*), incapacidad de posicionar búsquedas *long-tail* ("trabajo unity barcelona shaders", "administrador sistemas linux ansible") y degradación general de la calidad percibida del inventario español.
- **Solución Óptima Propuesta**:
  1. Implementar extracción respetuosa del resumen de requisitos, stack tecnológico y condiciones en la vista de detalle (dentro de límites legales TDM/citas y `robots.txt`) o exigir un mínimo de riqueza textual para permitir la indexación (`noindex` automático por debajo de 180 caracteres útiles de descripción).

### [SEO-033] Bloqueo de publicación en el blog orgánico por fallo `AttributeError` en `backend/generate_blog_post.py` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`backend/generate_blog_post.py` corregido de `.toLocaleString()` en Lote 3.1)
 P2 - Medio
- **Ubicación exacta**: `backend/generate_blog_post.py` (línea 92)
- **Diagnóstico del Problema**:
  La línea 92 del generador periódico de artículos de blog invoca un método inexistente de JavaScript sobre un entero Python: `{avg_salary.toLocaleString('es-ES')}€`. Cada vez que existen ofertas activas en la base de datos, el script colapsa con `AttributeError: 'int' object has no attribute 'toLocaleString'` antes de generar o insertar el artículo.
- **Riesgo o Impacto**:
  Paralización total del canal editorial del blog orgánico, perdiendo la generación recurrente de contenido informacional basado en datos propios del mercado IT español.
- **Solución Óptima Propuesta**:
  1. Corregir la línea 92 utilizando formateo nativo Python (`f"{avg_salary:,}".replace(",", ".") + "€"`) y añadir tests automáticos de ejecución en CI para `generate_blog_post.py` (usando `--dry-run`).

### [SEO-034] Generación automatizada de noticias sin plantilla de interlinking ni enriquecimiento E-E-A-T en `generate_news_post.py` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (generador de noticias conectado con enlaces internos y metadatos estructurados)
 P2 - Medio
- **Ubicación exacta**: `backend/generate_news_post.py` (líneas 1–119)
- **Diagnóstico del Problema**:
  Las noticias autogeneradas mediante `gemini-2.5-flash` (y su plantilla de fallback genérica cuando falla la API) se publican directamente sin validación de calidad editorial, sin enlaces contextuales inyectados hacia categorías/salarios internos relevantes del portal y sin datos originales verificados que aporten diferenciación frente a la nota de prensa o noticia fuente.
- **Riesgo o Impacto**:
  Contenido clasificado como de bajo valor añadido (*Scaled Content Abuse* según políticas recientes de spam de Google) con riesgo de filtración de las secciones `/noticias` o Google Discover.
- **Solución Óptima Propuesta**:
  1. Enriquecer cada artículo con un bloque automático de datos reales propios de MySQL relacionados con la temática (ej. número actual de vacantes del lenguaje/empresa y mediana salarial del portal) junto con enlaces internos hacia `/trabajos/[sector]` y `/salarios`.
  2. Cambiar el estado inicial ante fallback de plantilla a `draft` en lugar de autopublicar relleno genérico.

### [SEO-035] Archivo `frontend/public/llms.txt` con dominio ajeno y rutas desactualizadas (GEO / AI Search) ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`frontend/public/llms.txt` actualizado al dominio `https://portalempleoit.com` y rutas reales)
 P2 - Medio
- **Ubicación exacta**: `frontend/public/llms.txt`
- **Diagnóstico del Problema**:
  El archivo `llms.txt` destinado a facilitar la comprensión del portal por motores de búsqueda basados en LLM (Perplexity, SearchGPT, Gemini) referencia un dominio equivocado (`https://www.portal-trabajo-it.com` en lugar del dominio oficial) y cita patrones de URL desalineados con la estructura de rutas efectiva del proyecto.
- **Riesgo o Impacto**:
  Pérdida de tráfico de referencia desde buscadores conversacionales e incluso desvío de atribución/enlaces hacia un dominio distinto.
- **Solución Óptima Propuesta**:
  1. Actualizar `frontend/public/llms.txt` usando la variable/dominio canónico exacto de producción, listando fielmente las rutas reales (`/`, `/salarios`, `/tendencias`, `/trabajos/[sector]`, `/trabajo-[ciudad]/[tech]`, `/feed.xml`) y resumiendo la metodología verificable de agregación salarial.


---

## Bloque V: SEO Internacional (`hreflang`), Multi-idioma y Canónicas

### [SEO-036] Etiquetas `hreflang` asimétricas mezclando parámetros (`?lang=en`) y rutas (`/en/...`) ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (etiquetas `hreflang` y `canonical` coherentes en páginas programáticas y fichas)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/en/trabajos/[sector]/page.tsx`, `frontend/app/ca/trabajo-barcelona/page.tsx`, `frontend/app/eu/trabajo-bilbao/page.tsx`
- **Diagnóstico del Problema**:
  El etiquetado multi-idioma presenta inconsistencia estructural entre versiones: en secciones globales se referencian variantes con parámetro `?lang=en` mientras existen rutas específicas con prefijo de directorio (`/en/trabajos/[sector]`, `/ca/trabajo-barcelona`, `/eu/trabajo-bilbao`). Al no apuntarse recíprocamente todas las variantes entre sí con las mismas URLs exactas, se rompe el requisito de bidireccionalidad de `hreflang`.
- **Riesgo o Impacto**:
  Googlebot ignora por completo el clúster `hreflang` por falta de etiquetas de retorno (*missing return links*), generando canibalización entre versiones lingüísticas o sirviendo la versión española ante búsquedas en inglés/catalán/euskera.
- **Solución Óptima Propuesta**:
  1. Estandarizar una arquitectura única basada en prefijo de ruta limpio (`/es/...` o raíz sin prefijo, `/en/...`, `/ca/...`, `/eu/...`) eliminando `?lang=en`.
  2. Generar `alternates.languages` mediante un helper central que emita exactamente las mismas URLs canónicas recíprocas solo cuando la ruta homóloga exista realmente traducida.

### [SEO-037] Páginas `/ca/trabajo-barcelona` y `/eu/trabajo-bilbao` con metadatos localizados y cuerpo íntegramente en español ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`CityLandingPage.tsx`, `ca/trabajo-barcelona` y `eu/trabajo-bilbao` renderizan títulos, subtítulos y métricas en catalán y euskera)
 P0 - Crítico
- **Ubicación exacta**: `frontend/app/ca/trabajo-barcelona/page.tsx` y `frontend/app/eu/trabajo-bilbao/page.tsx`
- **Diagnóstico del Problema**:
  Ambas rutas definen títulos y meta descripciones localizadas al catalán y al euskera respectivamente, pero delegan el renderizado principal en `CityLandingPage`, componente que ignora la propiedad `locale` recibida e imprime encabezados, textos descriptivos, filtros y llamadas a la acción en español.
- **Riesgo o Impacto**:
  Google detecta incoherencia lingüística entre `<html lang>` / `<title>` y el idioma real del contenido visible (*language mismatch*), consolidando la página como duplicado de `/trabajo-barcelona` o `/trabajo-bilbao` y descartando su posicionamiento en búsquedas en catalán y euskera.
- **Solución Óptima Propuesta**:
  1. Pasar `locale` (`'ca' | 'eu' | 'es' | 'en'`) a `CityLandingPage` y extraer todas las cadenas de UI, H1, FAQs y descripciones editoriales a diccionarios completos por idioma.
  2. Ajustar dinámicamente el atributo `<html lang={locale}>` en las rutas localizadas (actualmente fijado globalmente desde `layout.tsx`).

### [SEO-038] Ausencia o inconsistencia de `x-default` y conflicto entre `hreflang` y bloqueos de `robots.ts` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`x-default` presente junto a `es-ES` y variantes regionales en `alternates.languages`)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/layout.tsx`, `frontend/app/robots.ts`
- **Diagnóstico del Problema**:
  Las referencias `hreflang` que emplean `?lang=en` entran en conflicto con las reglas de bloqueo de parámetros de consulta en `robots.ts`, impidiendo que el rastreador verifique los enlaces alternativos. Además, `x-default` no apunta uniformemente a la versión neutra/canónica correcta en subrutas dinámicas.
- **Riesgo o Impacto**:
  Errores en la sección de segmentación internacional y pérdida de tráfico internacional en remoto (candidatos EU/LATAM buscando empleos remotos en inglés en empresas españolas).
- **Solución Óptima Propuesta**:
  1. Completar la migración fuera de parámetros `?lang=` y definir explícitamente `'x-default'` apuntando a la ruta española principal o selector canónico en cada `generateMetadata`.

### [SEO-039] Gestión deficiente de `rel="canonical"` y `robots` en búsquedas combinadas, paginación y resultados vacíos ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`robots` `noindex, follow` aplicado en rutas combinadas vacías de `/trabajo-[ciudad]/[tech]`)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/page.tsx` y `frontend/app/components/SearchFilters.tsx`
- **Diagnóstico del Problema**:
  Al compartir o rastrear URLs parametrizadas de búsqueda (`?q=...&category=...&remote=...&page=...`), falta una regla estricta que distinga qué combinaciones facetadas merecen URL limpia canónica e indexable frente a búsquedas libres de usuario, filtros múltiples arbitrarios o búsquedas sin resultados, evitando que todas apunten indiscriminadamente a `/` o se auto-canonicen con parámetros infinitos.
- **Riesgo o Impacto**:
  Explosión combinatoria de URLs indexables (*crawl trap*) o consolidación errónea de páginas útiles hacia la home perdiendo señales específicas.
- **Solución Óptima Propuesta**:
  1. Aplicar `robots: { index: false, follow: true }` automáticamente siempre que existan parámetros de búsqueda libre (`q`), más de dos facetas combinadas o `totalCount === 0`.
  2. Mantener URLs canónicas limpias autoreferenciadas en las páginas paginadas con tráfico legítimo (`/trabajos/[sector]?page=N` con `index, follow` si tiene resultados y `page <= 10`).

### [SEO-040] Traducción automática literal de títulos técnicos por `GoogleTranslator` deteriorando palabras clave SEO ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`backend/logic/translator.py` protege marcas y términos IT clave como TypeScript, JavaScript, DevOps, Full Stack y Cloud)
 P2 - Medio
- **Ubicación exacta**: `backend/logic/translator.py` y `backend/main.py`
- **Diagnóstico del Problema**:
  Las ofertas procedentes de feeds en inglés se traducen automáticamente mediante `GoogleTranslator` sin glosario de términos técnicos protegidos (*Technical Term Preservation*). Como resultado, títulos buscados universalmente en inglés en el mercado español ("Backend Engineer", "Cloud Architect", "Rust Developer") se convierten en traducciones literales poco buscadas o pierden el nombre exacto de herramientas/stacks.
- **Riesgo o Impacto**:
  Menor relevancia exacta frente a las *queries* reales de desarrolladores en España/UE y caída del CTR orgánico por títulos antinaturales en SERPs.
- **Solución Óptima Propuesta**:
  1. Conservar términos técnicos y roles estándar mediante diccionario de excepciones antes/después de traducir, o realizar la normalización SEO de título con prompt LLM estructurado usando ejemplos del mercado IT español.

---

## Bloque VI: Datos Estructurados Complementarios (`Course`, `ItemList`, `Salary`, `Breadcrumb`)

### [SEO-041] Uso indebido de Schema `Course` en `CourseAffiliate.tsx` sobre enlace de búsqueda afiliado en Udemy ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (eliminado por completo el JSON-LD `@type: Course` de `frontend/components/CourseAffiliate.tsx`)
 P0 - Crítico
- **Ubicación exacta**: `frontend/components/CourseAffiliate.tsx` (constante `CV_BUILDER_LINK = "https://trk.udemy.com/9VMAEj"` y emisión de JSON-LD `Course`)
- **Diagnóstico del Problema**:
  El componente `CourseAffiliate.tsx` inyecta datos estructurados JSON-LD de tipo `Course` declarando como destino un enlace afiliado genérico de búsqueda en Udemy (`CV_BUILDER_LINK`), pese a que Google exige que `@type: Course` represente exclusivamente páginas de cursos específicos con programa lectivo real impartido u ofrecido válidamente en la página, prohibiendo su uso sobre listados genéricos o banners afiliados.
- **Riesgo o Impacto**:
  Violación directa de la política de spam de datos estructurados de Google (*Structured Data Spam Policy*), arriesgando una **acción manual** en Google Search Console que deshabilite todos los fragmentos enriquecidos del dominio (incluidos potencialmente `JobPosting`).
- **Solución Óptima Propuesta**:
  1. Eliminar inmediatamente la emisión del JSON-LD `@type: Course` de `CourseAffiliate.tsx` (y alinear también el texto CTA "Mejorar CV" con el destino real para no engañar al usuario).

### [SEO-042] Marcado `ItemList` y feeds referenciando URLs `/job/[id]` sin slug canónico ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`feed.xml/route.ts`, `api/feeds/jooble/route.ts` y `api/feeds/talent/route.ts` usan `getJobSlug(job)` canónico)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`, `frontend/app/feed.xml/route.ts`, `frontend/app/api/feeds/jooble/route.ts`, `frontend/app/api/feeds/talent/route.ts`
- **Diagnóstico del Problema**:
  Tanto listados estructurados como los feeds externos emiten URLs cortas `/job/${id}` en lugar de la URL canónica completa con slug (`title` + `company` + `id`). Esto obliga a los rastreadores a resolver redirecciones o indexar múltiples variantes de ruta para la misma vacante.
- **Riesgo o Impacto**:
  Pérdida de señales de posicionamiento en listas, duplicación transitoria de URLs y desaprovechamiento de palabras clave en el segmento de URL.
- **Solución Óptima Propuesta**:
  1. Exponer y utilizar únicamente `buildJobCanonicalUrl(job)` en todo JSON-LD (`ItemList`), componentes `<Link>` y endpoints XML/RSS.

### [SEO-043] Ausencia de Schema `Occupation` / `EstimatedSalary` / `Dataset` en `/salarios` ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`frontend/app/salarios/page.tsx` emite JSON-LD `Dataset` + `WebApplication` salarial)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/salarios/page.tsx` y rutas derivadas `/salarios/[tecnologia]/[ciudad]`
- **Diagnóstico del Problema**:
  Las páginas programáticas de salarios presentan rangos retributivos calculados en HTML sin acompañarlos de marcado estructurado semántico (`Occupation` con `estimatedSalary`, `MonetaryAmountDistribution`, o `Dataset` documentando la muestra de vacantes analizadas).
- **Riesgo o Impacto**:
  Pérdida de elegibilidad para resultados enriquecidos salariales y paneles de conocimiento (*Knowledge Graph / Featured Snippets*) frente a portales como Glassdoor, Levels.fyi o Manfred.
- **Solución Óptima Propuesta**:
  1. Generar JSON-LD `@type: Occupation` con `estimatedSalary` (`MonetaryAmountDistribution`: `percentile25`, `median`, `percentile75`, `currency: "EUR"`, `duration: "P1Y"`) y `occupationLocation` cuando el tamaño muestral supere un umbral estadístico mínimo (ej. `n >= 5` ofertas con salario real).

### [SEO-044] Jerarquía `BreadcrumbList` incompleta o desalineada en páginas programáticas y fichas ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Resuelto (`frontend/components/Breadcrumbs.tsx` unifica `<nav aria-label="Breadcrumb">` y `BreadcrumbList` JSON-LD)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`, `frontend/app/trabajo-[ciudad]/[tech]/page.tsx`, `frontend/app/salarios/page.tsx`
- **Diagnóstico del Problema**:
  Falta una implementación transversal homogénea de rutas de migas de pan (`BreadcrumbList` en JSON-LD + navegación visible coherente) que refleje jerarquías limpias (`Inicio > Empleos [Sector] > Empleos [Tech] en [Ciudad] > Oferta`).
- **Riesgo o Impacto**:
  Visualización plana y menos atractiva de las URLs en los resultados móviles de Google, reduciendo CTR frente a competidores con jerarquía visible en SERP, y peor distribución de PageRank hacia categorías intermedias.
- **Solución Óptima Propuesta**:
  1. Crear un componente único `<Breadcrumbs items={...} />` que renderice simultáneamente el marcado accesible `<nav aria-label="Breadcrumb">` y el `<script type="application/ld+json">` `BreadcrumbList` con URLs absolutas canónicas.

### [SEO-045] Validación insuficiente de marcado `NewsArticle` / `BlogPosting` en artículos automatizados ✅ [RESUELTO - Lote 4.1]

- **Estado de Remediación**: [x] Mitigado (artículos editoriales incluyen metadatos `datePublished` y autoría estructurada)
 P2 - Medio
- **Ubicación exacta**: `backend/generate_news_post.py`, `backend/generate_blog_post.py` y rutas de noticias/blog en `frontend/app/`
- **Diagnóstico del Problema**:
  Los artículos generados automáticamente carecen de verificación estructural estricta para `NewsArticle` / `BlogPosting` (imagen destacada propia >= 1200px de ancho en `image`, `author` correctamente tipado como `Organization` o `Person` real con `url`, `datePublished` y `dateModified` ISO-8601 reales).
- **Riesgo o Impacto**:
  Exclusión de carrúseles de noticias destacadas (*Top Stories*) y Google Discover por incumplir requisitos técnicos de imágenes y autoría transparente.
- **Solución Óptima Propuesta**:
  1. Asociar cada noticia/post a una imagen verificada >= 1200×675 px, declarar autoría transparente y validar el JSON-LD resultante antes de publicar.

---

## Bloque VII: Core Web Vitals (LCP, CLS, INP) y Rendimiento Frontend

### [SEO-046] Activos gráficos críticos sin comprimir (`logo.png` de 566 KB y `og-image.png` de 455 KB) dañando LCP y transferencia inicial ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/public/logo.png` (566 KB) y `frontend/public/og-image.png` (455 KB)
- **Diagnóstico del Problema**:
  La imagen de logotipo principal servida en cada página (`logo.png`, **566 KB**) y la imagen OpenGraph global (`og-image.png`, **455 KB**) suman más de **1 MB** en formato PNG sin conversión a WebP/AVIF ni ajuste dimensional acorde a su tamaño real de renderizado en pantalla.
- **Riesgo o Impacto**:
  Empeoramiento directo de **LCP (Largest Contentful Paint)** en redes móviles 3G/4G, desperdicio de ancho de banda inicial en todas las vistas y penalización en puntuaciones de Core Web Vitals de Search Console.
- **Solución Óptima Propuesta**:
  1. Convertir `logo.png` a **SVG vectorial** optimizado (o PNG/WebP <= 15 KB adaptado al tamaño exacto 2× de cabecera) y comprimir `og-image.png` a formato JPEG/WebP de 1200×630 px por debajo de 80 KB.

### [SEO-047] Desactivación del optimizador de imágenes (`unoptimized` / `<img>` nativo) en `Header` y `CompanyLogo` ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/Header.tsx`, `frontend/components/CompanyLogo.tsx`, `frontend/next.config.ts`
- **Diagnóstico del Problema**:
  El renderizado de logotipos y avatares corporativos prescinde de la optimización responsive nativa (`<Image>` optimizado con `sizes`, formatos AVIF/WebP y dimensionamiento explícito `width`/`height`), descargando imágenes externas a resolución completa o PNGs pesados sin `srcset`.
- **Riesgo o Impacto**:
  Degradación conjunta de LCP, consumo innecesario de datos móviles en listados con 20 tarjetas y avisos en Lighthouse ("Properly size images", "Serve images in next-gen formats").
- **Solución Óptima Propuesta**:
  1. Usar `next/image` optimizado (habilitando `images.formats: ['image/avif', 'image/webp']` en `next.config.ts`) con atributos explícitos `width`, `height`, `sizes` y proxy local cacheado para logotipos externos.

### [SEO-048] Degradación severa de INP y carga SSR por debounce de 400ms disparando `router.replace()` en `SearchFilters.tsx` ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/components/SearchFilters.tsx` y `frontend/lib/jobs.ts`
- **Diagnóstico del Problema**:
  Al interactuar con los filtros de búsqueda en `SearchFilters.tsx`, tras un debounce de 400ms cada cambio ejecuta `router.replace(...)`, forzando una re-ejecución completa del árbol RSC (React Server Components) en servidor contra `db_proxy.php` y consultas SQL lentas con `ILIKE '%...%'`.
- **Riesgo o Impacto**:
  Picos altos en **INP (Interaction to Next Paint)** y sensación de interfaz lenta/bloqueada en el filtrado interactivo cuando el backend tarda >300–800 ms, además de generar múltiples peticiones SSR abortadas en cascada al escribir o marcar varias casillas seguidas.
- **Solución Óptima Propuesta**:
  1. Utilizar `useTransition` de React para mantener el input 100% responsivo mientras transita el servidor, pre-cargar facetas rápidas en caché Edge/Redis y optimizar las queries en `jobs.ts` mediante `FULLTEXT` e índices compuestos para bajar el tiempo de respuesta SSR por debajo de 80 ms.
  2. Agrupar selecciones múltiples de filtros (aplicación inmediata en móvil mediante botón o debounce inteligente con `AbortController` en prefetch).

### [SEO-049] Paginación basada en eventos cliente (`LoadMoreJobs`) dificultando rastreo profundo de páginas 2..N ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/page.tsx` y componente `LoadMoreJobs`
- **Diagnóstico del Problema**:
  El avance hacia páginas posteriores de resultados en el listado principal se apoya en interacción JavaScript cliente ("Cargar más" vía `fetch` a `/api/jobs`) sin ofrecer enlaces HTML tradicionales `<a href="/?page=2">` / `rel="next"` visibles en el DOM renderizado en servidor para los motores de búsqueda.
- **Riesgo o Impacto**:
  Googlebot normalmente no ejecuta clics continuados sobre botones de carga infinita, dejando gran parte del inventario más allá de la primera página dependiente únicamente del sitemap XML y debilitando la transmisión de PageRank interno hacia ofertas recientes fuera del Top 20.
- **Solución Óptima Propuesta**:
  1. Renderizar paginación híbrida progresiva con enlaces reales `<a href="?page=2">` (y `Link` de Next.js) accesibles en SSR aunque se mantenga UX fluida de scroll o "Cargar más" sobre ellos para usuarios con JS activo.

### [SEO-050] Saltos de diseño (**CLS**) por carga condicionada en cliente de `AdBanner.tsx` sin reserva espacial SSR ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/AdBanner.tsx` (líneas 1–800)
- **Diagnóstico del Problema**:
  `AdBanner.tsx` evalúa en cliente el estado de `cookies_consent` tras hidratarse antes de decidir mostrar anuncios AdSense o banners alternativos afiliados, sin garantizar en SSR un contenedor con altura mínima reservada estable acorde al slot publicitario. Además utiliza variantes de clase Tailwind v4 inexistentes (`indigo-750`, `indigo-550`, `violet-650`, `gray-650`, `slate-350`, `duration-205`).
- **Riesgo o Impacto**:
  Desplazamiento abrupto del contenido principal hacia abajo segundos después del pintado inicial (**CLS > 0.1**), empeorando las métricas de campo CrUX en Search Console y molestando al usuario al intentar pulsar un empleo.
- **Solución Óptima Propuesta**:
  1. Envolver cada espacio de `AdBanner.tsx` en contenedores con `min-h-[...]` fijo y `aspect-ratio` estable en SSR desde el primer renderizado.
  2. Corregir todas las clases Tailwind inválidas hacia tokens estándar existentes en `globals.css`.

### [SEO-051] Contención en el hilo principal y prioridades de carga en `layout.tsx` (OneSignal, GA4, fuentes) ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/layout.tsx`
- **Diagnóstico del Problema**:
  El layout global carga scripts externos (Google Analytics, SDK de OneSignal y configuraciones inline) junto con inicializaciones cliente sin diferir sistemáticamente scripts no esenciales con estrategia `afterInteractive` / `lazyOnload` ni priorizar estrictamente el recurso LCP real.
- **Riesgo o Impacto**:
  Competencia por ancho de banda y tiempo de CPU del hilo principal durante la hidratación de React, perjudicando **INP** y **LCP** en dispositivos móviles de gama media.
- **Solución Óptima Propuesta**:
  1. Cargar analítica y SDK push exclusivamente tras consentimiento válido usando `strategy="lazyOnload"` (o Partytown / Google Tag Gateway) para no bloquear el hilo principal en el arranque.

### [SEO-052] Cascada secuencial de consultas SQL en el SSR de `frontend/app/job/[id]/page.tsx` elevando el TTFB ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 1–1160)
- **Diagnóstico del Problema**:
  La página de detalle ejecuta varias consultas contra `db_proxy.php` en cadena secuencial (consulta principal de la oferta, actualización de impresiones, ofertas relacionadas, datos salariales/reacciones/reseñas) antes de completar el renderizado SSR. Cada salto HTTP adicional hacia `db_proxy.php` suma decenas o cientos de milisegundos al **TTFB**.
- **Riesgo o Impacto**:
  TTFB superior a 800 ms bajo tráfico o latencia PHP-MySQL, retrasando directamente **FCP/LCP** y limitando la velocidad de rastreo de Googlebot (que adapta su *crawl rate* a la latencia media del servidor).
- **Solución Óptima Propuesta**:
  1. Paralelizar consultas independientes con `Promise.all(...)` tras obtener la oferta base, delegar las vistas/impresiones a actualización asíncrona sin bloquear SSR (`after()` de Next.js 15 o endpoint beacon ligero) y envolver ofertas relacionadas/reseñas en límites `<Suspense>` con streaming HTML.

### [SEO-053] Cacheo permanente de `/` en `sw.js` sirviendo HTML y metadatos desfasados ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/public/sw.js`
- **Diagnóstico del Problema**:
  El Service Worker `sw.js` almacena en caché de forma persistente la ruta `/` sin invalidación versionada, provocando que usuarios recurrentes visualicen HTML obsoleto (ofertas caducadas, enlaces antiguos y conteos congelados).
- **Riesgo o Impacto**:
  Incremento de clics fallidos sobre ofertas ya cerradas en visitantes fieles, empeorando señales comportamentales de usuario y conversión en alertas/patrocinios.
- **Solución Óptima Propuesta**:
  1. Cambiar la estrategia para documentos HTML a **Network-Only** o **Network-First** con timeout corto y versión de caché automática ligada al ID de despliegue.

### [SEO-054] Ventanas ISR y caché desincronizadas entre la home y las taxonomías programáticas ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`, `frontend/app/salarios/page.tsx`, `frontend/app/tendencias/page.tsx`, `frontend/components/Footer.tsx`
- **Diagnóstico del Problema**:
  Los distintos bloques y páginas utilizan periodos `revalidate` o `unstable_cache` heterogéneos y sin etiquetado común (`tags: ['jobs']`), haciendo que una misma vacante figure activa en el listado principal pero no en `/trabajos/[sector]`, o que el contador global del footer muestre cifras incoherentes frente a la home.
- **Riesgo o Impacto**:
  Inconsistencia percibida por usuarios y rastreadores al navegar entre listado padre e hijos.
- **Solución Óptima Propuesta**:
  1. Adoptar etiquetas unificadas de revalidación (`unstable_cache(..., { tags: ['jobs-catalog', 'salaries'] })`) e invalidarlas en bloque al finalizar cada ciclo exitoso de scraping/expiración.

### [SEO-055] Clases CSS inexistentes en Tailwind v4 (`globals.css`) rompiendo contraste y diseño en componentes clave ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/globals.css` (líneas 1–24), `frontend/components/AdBanner.tsx`, `frontend/app/accesibilidad/page.tsx`, `frontend/app/components/SearchFilters.tsx`
- **Diagnóstico del Problema**:
  El proyecto usa Tailwind CSS v4 (`@import "tailwindcss";` en `globals.css`) sin declarar tokens personalizados para tonos intermedios (`650`, `550`, `450`, `150`, `750`, `850`, `350`) ni `duration-205`. Sin embargo, múltiples componentes aplican `text-indigo-650`, `hover:bg-indigo-750`, `from-indigo-550 to-violet-650`, `dark:border-slate-850`, `text-gray-650`, etc., clases que Tailwind v4 descarta sin generar CSS.
- **Riesgo o Impacto**:
  Botones, bordes, gradientes y textos quedan sin color o con contraste defectuoso (cayendo a color heredado negro/blanco sin hover o sin borde), dañando legibilidad, accesibilidad visual y métricas de interacción (rebote móvil).
- **Solución Óptima Propuesta**:
  1. Auditar mediante búsqueda regex todo `frontend/` y reemplazar las clases inexistentes por escalas estándar de Tailwind (`500`/`600`/`700`/`800`/`900` y `duration-200`) o definir esos tokens explícitamente bajo `@theme` en `frontend/app/globals.css`.

---

## Bloque VIII: Enlazado Interno, Metadatos, CTR y Señales de Calidad

### [SEO-056] Enlazado interno fragmentado entre fichas `/job/[id]`, `/salarios`, `/tendencias` y `/trabajo-[ciudad]/[tech]` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (navegación cruzada con `Breadcrumbs` y enlaces programáticos consistentes)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx`, `frontend/app/salarios/page.tsx`, `frontend/app/tendencias/page.tsx`, `frontend/app/trabajo-[ciudad]/[tech]/page.tsx`
- **Diagnóstico del Problema**:
  El ecosistema carece de un grafo de enlazado interno sistemático entre páginas transaccionales (fichas de empleo) y páginas informacionales/programáticas de alto valor (`salarios`, `tendencias`, `trabajo-[ciudad]/[tech]`): las fichas no siempre enlazan bidireccionalmente con la landing salarial exacta de su stack+ciudad ni las landings salariales destacan de manera consistente ofertas activas reales filtradas por esa combinación.
- **Riesgo o Impacto**:
  Páginas programáticas con profundidad de clic alta (*click depth > 4*) reciben escaso *PageRank* interno y tardan semanas en consolidar posiciones en el Top 10 frente a agregadores con arquitectura en silos interconectados.
- **Solución Óptima Propuesta**:
  1. Implementar módulos contextuales enlazados en `job/[id]/page.tsx` ("Salario medio de [Tech] en [Ciudad]", "Ver más empleos de [Tech] en [Ciudad]") y viceversa en `/salarios` y `/tendencias`, verificando previamente mediante caché que cada destino enlazado tenga datos reales (`count > 0`).

### [SEO-057] Títulos `<title>` y `<meta name="description">` sin optimización dinámica de CTR en listados y fichas largas ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (títulos y descripciones dinámicas por ciudad, tecnología y año)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/page.tsx`, `frontend/app/job/[id]/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`
- **Diagnóstico del Problema**:
  En fichas con títulos extensos de empresa/puesto y en listados paginados o filtrados, las etiquetas `<title>` y `<meta name="description">` superan con frecuencia los 60/155 caracteres sufriendo truncamiento en SERP y omiten dinámicamente datos clave de atracción de clic (rango salarial formateado, modalidad remota/híbrida, número real de vacantes activas del mes/año actual).
- **Riesgo o Impacto**:
  Menor tasa de clics (CTR) orgánico en resultados competitivos de Google frente a portales que muestran salario, año actualizado y ubicación limpia antes del corte de píxeles.
- **Solución Óptima Propuesta**:
  1. Construir plantillas de metadatos con presupuesto estricto de longitud (`<= 58` caracteres en `<title>`, `<= 150` en `description`), priorizando `[Puesto] en [Empresa] ([Salario] | [Remoto/Ciudad])` y diferenciando páginas `?page=N` con `" - Página N"`.

### [SEO-058] Sintaxis Markdown sin renderizar (`**`) en páginas editoriales y correos públicos dañando señales E-E-A-T ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (eliminados los `**` literales en `salarios/page.tsx` y `send_reactivation.py` en Lote 3.1)
 P1 - Alto
- **Ubicación exacta**: `frontend/app/salarios/page.tsx` y `backend/send_reactivation.py` (línea 162)
- **Diagnóstico del Problema**:
  En `frontend/app/salarios/page.tsx` permanecen literales Markdown `**texto**` sin transformar en etiquetas `<strong>` dentro del JSX renderizado al público (patrón que también ocurre en `backend/send_reactivation.py:162`).
- **Riesgo o Impacto**:
  Impresión visual de página automatizada sin revisión humana, erosionando la confianza del lector y perjudicando las señales de calidad editorial (E-E-A-T) y retención de usuario.
- **Solución Óptima Propuesta**:
  1. Reemplazar los literales `**...**` directamente por JSX `<strong>...</strong>` en `frontend/app/salarios/page.tsx` (y por `<strong>` HTML en `send_reactivation.py`), añadiendo una regla lint en CI que alerte ante `**` literales en componentes TSX.

### [SEO-059] Bloques de monetización con placeholders rotos y enlaces afiliados genéricos reduciendo la confianza del sitio ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`AdBanner.tsx` y `CourseAffiliate.tsx` parametrizados por entorno en Lotes 2.1 y 3.4)
 P2 - Medio
- **Ubicación exacta**: `frontend/components/AdBanner.tsx` (slots dummy `'9876543210'`, placeholders `'TU_AFFILIATE_ID_*'`, URLs idénticas de Coursera `1164968/14726`) y `frontend/components/CourseAffiliate.tsx` (`CV_BUILDER_LINK = "https://trk.udemy.com/9VMAEj"`)
- **Diagnóstico del Problema**:
  El código desplegable contiene identificadores publicitarios de ejemplo sin configurar (`'9876543210'`, `'TU_AFFILIATE_ID_*'`), múltiples banners apuntando al mismo enlace genérico de Coursera (`1164968/14726`) sin diferenciación por tecnología, y un botón "Mejorar CV" que en realidad envía a una búsqueda genérica de afiliación en Udemy.
- **Riesgo o Impacto**:
  Degradación severa de la experiencia de usuario y señales de baja calidad (*Above-the-fold ad/affiliate clutter* con enlaces irrelevantes o rotos) que incrementan el rebote rápido hacia Google.
- **Solución Óptima Propuesta**:
  1. Desactivar todo bloque publicitario o afiliado cuyo ID real no esté validado en entorno (nunca renderizar placeholders `'TU_AFFILIATE_ID_*'` o slots dummy en producción).
  2. Mapear enlaces contextuales reales por categoría tecnológica y etiquetarlos adecuadamente con `rel="sponsored noopener noreferrer"`.

### [SEO-060] Latencia de escritura antes de redirección en `/redirect/[id]` y ausencia de aislamiento de bots en rutas puente ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (`/redirect/` bloqueado en `robots.ts` y marcado `noindex, nofollow` en `RedirectPage`)
 P2 - Medio
- **Ubicación exacta**: `frontend/app/redirect/[id]/page.tsx` (líneas 1–68)
- **Diagnóstico del Problema**:
  La ruta puente `/redirect/[id]` realiza verificación SSR + actualización sin `await` de `clicks_count` antes de liberar la conexión (`client.release()` en líneas 36–45) para enviar al candidato hacia el portal origen de la oferta. Si rastreadores o bots atraviesan estas rutas puente no excluidas de indexación o sin respuesta limpia de estado, consumen cuota DB y pueden indexar páginas intermedias vacías o fallar silenciosamente el conteo de clics salientes.
- **Riesgo o Impacto**:
  Pérdida no determinista de métricas de clics de salida (*conversion tracking*) por liberación prematura de conexión y riesgo de rastreo innecesario de URLs `/redirect/*` por buscadores secundarios.
- **Solución Óptima Propuesta**:
  1. Esperar (`await`) correctamente el registro del clic o despacharlo con patrón seguro antes de `client.release()` / usar `after()`, restringiendo además `/redirect/` en `robots.ts` o con cabecera `X-Robots-Tag: noindex, nofollow`.

### [SEO-061] Ausencia de páginas de perfil de empresa indexables para captar búsquedas de marca ("trabajar en [Empresa]") ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (tabla maestra `companies` creada en Lote 3.2 para consolidar perfiles de empresa)
 P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (`getCompanyReviews` / `submitCompanyReview` operando con `companySlug`), `frontend/app/sitemap.ts`
- **Diagnóstico del Problema**:
  Aunque el portal ya recopila reseñas de empresas (`company_reviews` identificadas por `companySlug`), empleos por compañía y rangos salariales, carece de hubs públicos consolidados e indexables `/empresa/[slug]` con `Organization` + `AggregateRating` / vacantes activas y reseñas moderadas.
- **Riesgo o Impacto**:
  Oportunidad orgánica desaprovechada de posicionarse en búsquedas informacionales-transaccionales de alto valor y altísimo CTR ("trabajar en [Empresa] opiniones", "sueldos [Empresa] IT").
- **Solución Óptima Propuesta**:
  1. Crear la ruta `/empresa/[slug]` con índice condicional (`index` solo si tiene >= 2 ofertas históricas/activas o reseñas verificadas reales), integrando vacantes activas de la compañía, estadísticas salariales agregadas y reseñas moderadas.

### [SEO-062] Distribución social fragmentada e incompleta reduciendo señales de marca, descubrimiento y tráfico de referencia ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Resuelto (bots de Bluesky, Threads y YouTube Shorts reparados en Lote 3.3)
 P2 - Medio
- **Ubicación exacta**: `backend/bluesky_bot.py` (líneas 1–151), `backend/pinterest_bot.py` (líneas 1–100), `backend/youtube_shorts_bot.py` (línea 132), `backend/tiktok_bot.py` (líneas 1–34)
- **Diagnóstico del Problema**:
  La distribución multicanal presenta defectos que merman el tráfico referido y el branding consistente: `bluesky_bot.py` publica sin facets AT Protocol (URLs y hashtags no cliqueables) e ignora `title_es`; `pinterest_bot.py` enlaza a `/job/{job_id}/opengraph-image` sin slug; `youtube_shorts_bot.py` muestra el dominio equivocado `portalempleoit.es`; y `tiktok_bot.py` es un stub simulado que no publica contenido real.
- **Riesgo o Impacto**:
  Enlaces rotos o no cliqueables en redes que reducen drásticamente el CTR referido, desperdicio de impresiones orgánicas en YouTube Shorts dirigiendo usuarios hacia un dominio erróneo y nulidad total de canal TikTok pese a figurar en `run_all.py`.
- **Solución Óptima Propuesta**:
  1. Implementar parser de facets AT Protocol en `bluesky_bot.py` priorizando `title_es`, corregir la URL canónica con slug en `pinterest_bot.py`, unificar `SITE_DOMAIN` en `youtube_shorts_bot.py` y deshabilitar `tiktok_bot.py` en `run_all.py` hasta integrar la Content Posting API oficial.

### [SEO-063] Carencia de bucle de retroalimentación con datos de Google Search Console para poda de páginas programáticas zombis ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (poda automática vía `noindex` en páginas programáticas vacías)
 P2 - Medio
- **Ubicación exacta**: `backend/monitor_search_console.py` (líneas 1–100) y `frontend/app/sitemap.ts`
- **Diagnóstico del Problema**:
  Actualmente `monitor_search_console.py` realiza únicamente comprobaciones locales sobre tipos JSON-LD en la web pública sin consumir la Search Analytics API de Google Search Console para identificar qué URLs `/trabajo-[ciudad]/[tech]` o `/trabajos/[sector]` acumulan 0 impresiones y 0 clics durante 90 días consecutivos.
- **Riesgo o Impacto**:
  Acumulación indefinida de páginas programáticas sin demanda ni rendimiento que diluyen la autoridad media del dominio.
- **Solución Óptima Propuesta**:
  1. Conectar `monitor_search_console.py` mediante cuenta de servicio a Google Search Console API para generar un informe mensual de URLs con 0 impresiones en >90 días y reforzar su contenido o aplicar `noindex`/consolidación automática.

### [SEO-064] Falta de *Entity Linking* y clusters semánticos entre tecnologías afines en `/tendencias` y `/salarios` ✅ [RESUELTO - Lote 4.3]

- **Estado de Remediación**: [x] Mitigado (clusters de tecnologías y ciudades enlazados en `llms.txt`, `/salarios` y `/tendencias`)
 P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/tendencias/page.tsx`, `frontend/app/salarios/page.tsx`
- **Diagnóstico del Problema**:
  Las vistas de tendencias y salarios presentan métricas aisladas sin enlazar mediante grafo de afinidad tecnológica (p. ej. conectar "Next.js" con "React", "TypeScript" y "Frontend", o "Kubernetes" con "Docker", "AWS" y "Cloud & DevOps") ni explicar brevemente definiciones de roles que ayuden a capturar intención informacional complementaria.
- **Riesgo o Impacto**:
  Menor autoridad temática (*Topical Authority*) frente a buscadores modernos basados en entidades y peor retención de página por falta de rutas lógicas de exploración.
- **Solución Óptima Propuesta**:
  1. Definir un mapa de tecnologías relacionadas en `frontend/lib/` y renderizar secciones "Perfiles y stacks relacionados" con enlaces internos anclados de forma natural entre `/salarios/[tech]` y `/tendencias/[sector]`.

### [SEO-065] Ausencia de suite automatizada de regresión SEO técnica en CI/CD ✅ [RESUELTO - Lote 4.4]

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `.github/workflows/` y `backend/monitor_search_console.py`
- **Diagnóstico del Problema**:
  No existe ningún paso automatizado antes o inmediatamente después de desplegar que verifique integridad de `robots.txt`, validez XML y conteos de `sitemap*.xml`, presencia obligatoria de `JobPosting` válido en fichas, coherencia `hreflang`, ausencia de clases `noindex` accidentales en la home ni detección de enlaces rotos (`404`/`500`) en rutas principales.
- **Riesgo o Impacto**:
  Un cambio accidental de metadatos, un fallo de conexión o un error en `sitemap.ts` puede pasar días o semanas en producción causando desindexación masiva antes de ser detectado manualmente.
- **Solución Óptima Propuesta**:
  1. Añadir un job ligero de verificación post-build / smoke test en GitHub Actions que valide HTTP `200` en `/`, `/salarios`, `/tendencias`, `/sitemap.xml`, `robots.txt`, parseo válido JSON-LD de muestra `/job/...` y HTTP `410`/`404` en oferta inexistente.
