# 00. Índice Maestro y Resumen Ejecutivo — Auditoría Integral del Portal de Empleo IT (España / UE)

> **Modo de Auditoría**: Solo lectura estricta (*Audit Only*). No se modificó, movió ni eliminó ningún archivo de código, configuración, script ni base de datos existente.  
> **Cobertura**: Arquitectura Next.js App Router (`frontend/`), Backend & Scrapers Python (`backend/`), Pasarela PHP (`db_proxy.php`), Proxy Perimetral (`nginx.conf.template`), Base de Datos (`ecosier2_PortalEmpleo.sql`, `backend/database_optimization.sql`), Scripts y CI/CD (`.github/workflows/`, `scripts/`, `deploy.sh`).

---

## 1. Dashboard Cuantitativo de Hallazgos

La auditoría ha documentado un total de **230 hallazgos técnicos, arquitectónicos, SEO y normativos** verificados directamente sobre el código fuente, esquemas SQL y plantillas de infraestructura del repositorio.

| Módulo / Categoría | Archivo de Detalle | P0 - Crítico | P1 - Alto | P2 - Medio | P3 - Mejora/Bajo | Total |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Seguridad y Resiliencia** | [01_SEGURIDAD_Y_RESILIENCIA.md](./01_SEGURIDAD_Y_RESILIENCIA.md) | 9 | 29 | 25 | 2 | **65** |
| **2. SEO Técnico y Crecimiento Orgánico** | [02_SEO_Y_CRECIMIENTO_ORGANICO.md](./02_SEO_Y_CRECIMIENTO_ORGANICO.md) | 15 | 26 | 22 | 2 | **65** |
| **3. Funcionalidades, UX y Arquitectura** | [03_FUNCIONALIDADES_UX_Y_ARQUITECTURA.md](./03_FUNCIONALIDADES_UX_Y_ARQUITECTURA.md) | 7 | 26 | 27 | 5 | **65** |
| **4. Legalidad, RGPD y Cumplimiento UE** | [04_LEGALIDAD_RGPD_Y_CUMPLIMIENTO_UE.md](./04_LEGALIDAD_RGPD_Y_CUMPLIMIENTO_UE.md) | 9 | 17 | 8 | 1 | **35** |
| **TOTAL GLOBAL AUDITADO** | **4 módulos técnicos** | **40** | **98** | **82** | **10** | **230** |

### Distribución por Criticidad
- **P0 — Crítico (40 hallazgos | 17,4 %)**: Riesgo inmediato de compromiso de base de datos/secretos, bypass de pago, XSS/CSRF, sanción RGPD/LSSI-CE/AEPD, acción manual de Google o rotura total de scripts en ejecución. Requieren intervención en **24–72 horas**.
- **P1 — Alto (98 hallazgos | 42,6 %)**: Brechas importantes de seguridad, degradación grave de crawl budget/Core Web Vitals/indexación, bugs funcionales con pérdida de conversión y vacíos legales exigibles. Objetivo: **Semanas 1–2**.
- **P2 — Medio (82 hallazgos | 35,7 %)**: Deuda técnica, duplicación lógica, fricción UX, resiliencia de scrapers/bots y adecuación normativa complementaria. Objetivo: **Semanas 3–6**.
- **P3 — Mejora/Bajo (10 hallazgos | 4,3 %)**: Hardening adicional, observabilidad, entorno local reproducible y optimizaciones de madurez. Objetivo: **Mes 2+**.

---

## 2. Top 10 Vulnerabilidades y Riesgos Críticos Prioritarios

A continuación se destacan los 10 hallazgos de mayor riesgo combinado (impacto técnico, financiero, reputacional y sancionador) detectados en la auditoría:

1. **Credenciales reales, dump SQL con PII y artefactos `.env` expuestos en el repositorio** (`SEC-001`, `SEC-002`, `LEG-012`)  
   `scripts/backup_mysql.sh` (líneas 23 y 37) contiene la contraseña fallback hardcodeada `Tolili07@` y la expone en la tabla de procesos (`-p"$DB_PASS"`). Adicionalmente conviven en el árbol de trabajo el volcado `ecosier2_PortalEmpleo.sql` (3.99 MB con emails reales en líneas 41 y 9554), `backend/migration_data/` (7.7 MB) y `backend/.env` (996 B).
2. **Evasión gratuita de informes de pago (PayPal PDT Fail-Open + TOCTOU en descargas)** (`SEC-031`, `SEC-032`)  
   `frontend/app/api/checkout/report/verify/route.ts` (líneas 43–71) concede el token de acceso si falta `PAYPAL_IDENTITY_TOKEN` o falla la red (*Fail-Open*), mientras `api/checkout/report/download/route.ts` sufre condición de carrera sobre el límite de 5 descargas agravada porque `db_proxy.php` ignora transacciones.
3. **Transacciones SQL "no-op" y suplantación de IP en `db_proxy.php`** (`SEC-008`, `SEC-009`, `FUNC-013`)  
   `db_proxy.php` confía incondicionalmente en `HTTP_CF_CONNECTING_IP` (líneas 68–71) permitiendo falsificar IP origen, y devuelve éxito sintético ante `START TRANSACTION`/`COMMIT`/`ROLLBACK` (líneas 157–165), dejando sin atomicidad a `submitSponsoredJob`, descargas e idempotencia Stripe.
4. **Bypass global de Rate Limiting distribuido en APIs y DoS funcional en acciones** (`SEC-024`, `SEC-025`, `SEC-026`, `SEC-027`)  
   Las rutas `/api/jobs`, `/api/salarios`, `/api/fresh-alerts`, `/api/checkout/newsletter`, `/api/widget/vacantes-count` y `/api/index-job` llaman al método síncrono `.limit()` en lugar de `.limitAsync()`, anulando Upstash Redis en serverless. Además, `request_link` en `/api/unsubscribe` carece de límite (vector de Email Bombing) y `reactToJob` / `submitCompanyReview` usan claves globales sin IP provocando DoS funcional.
5. **XSS reflejado en `/api/unsubscribe` y bypass CSRF cuando faltan `Origin`/`Referer`** (`SEC-036`, `SEC-016`, `SEC-017`)  
   `frontend/app/api/unsubscribe/route.ts` (líneas 140–150) interpola `${email}` sin escapar en HTML fallback e inyecta cabeceras `host`/`x-forwarded-proto` sin validar en enlaces enviados por correo (líneas 27–35). Paralelamente, `frontend/middleware.ts` (líneas 31–75) y `verifyCsrfOrigin` en `actions.ts` (líneas 64–82) aceptan peticiones cuando faltan `Origin` y `Referer`.
6. **Incumplimientos frontales RGPD/LSSI-CE/ePrivacy sancionables por la AEPD** (`LEG-001`, `LEG-010`, `LEG-011`, `LEG-013`, `LEG-014`, `LEG-023`, `LEG-024`, `LEG-029`)  
   Ocultación de NIF/domicilio real (`aviso-legal` y `backend/mailer.py:491`), carga de OneSignal y llamadas directas del navegador a Clearbit (`CompanyLogo.tsx`) sin consentimiento previo, logs CI con emails en texto plano en 5 scripts `send_*.py`, envíos ignorando `marketing_accepted`, baja `/api/unsubscribe` que no detiene `alerts`/Stripe, borrado físico en `send_reactivation.py` destruyendo lista de exclusión/usuarios premium y afirmaciones falsas en `bot/page.tsx` frente a scrapers reales.
7. **Deriva crítica de esquema SQL y bloqueo `403` de migraciones vía proxy** (`FUNC-004`, `FUNC-005`, `FUNC-036`, `FUNC-037`)  
   El esquema volcado `ecosier2_PortalEmpleo.sql` carece de 5 tablas críticas (`stripe_processed_events`, `report_downloads`, `saved_jobs_reminders`, `streak_reminders`, `review_reports`) y decenas de columnas asumidas por el código (`source`, `is_active`, `marketing_accepted`, `clicks_count`, `impressions_count`), choca entre `varchar(36)` y `INT AUTO_INCREMENT` en `subscribers.id`, ejecuta `ILIKE '%query%'` sin índices `FULLTEXT`/compuestos y `consolidate_production_schema.py` intenta `ALTER TABLE` contra `db_proxy.php` (bloqueado con `403`).
8. **Sistemas enteros rotos silenciosamente en producción** (`FUNC-001`, `FUNC-002`, `FUNC-003`, `FUNC-006`)  
   `generate_blog_post.py:92` lanza `AttributeError` por `.toLocaleString()` JS en Python; `send_streak_reminder.py:152` y `send_saved_jobs_reminder.py:149` consultan `s.source` que `/api/subscribe` deja `NULL`; `send_push_notifications.py:98` compara tecnologías contra `jobs.category` dando siempre `0`; y `getRecruiterJobs` (`actions.ts:954`) hardcodea `0` impresiones/clics.
9. **Riesgo de acción manual y pérdida severa de tráfico en Google / Google for Jobs** (`SEO-001`..`SEO-004`, `SEO-011`, `SEO-016`..`SEO-019`, `SEO-029`, `SEO-036`, `SEO-037`, `SEO-041`)  
   Schema `Course` abusivo en `CourseAffiliate.tsx` sobre búsqueda afiliada de Udemy; `JobPosting` con errores en `directApply`, `addressRegion`, `applicantLocationRequirements` y `baseSalary`; `deactivate_expired_jobs.py:164` borrando ofertas sin retornar `410 Gone`; `index_new_jobs.py:67` enviando URLs sin slug mientras conviven dos claves IndexNow incompatibles; `sitemap.ts` emitiendo `lastModified: new Date()` y desajuste con `robots.ts`; landings `/trabajo-[ciudad]/[tech]` vacías indexables y páginas `/ca/` y `/eu/` renderizando cuerpo en español bajo metadatos locales con `hreflang` roto.
10. **Activos LCP sin optimizar (`logo.png` 566 KB, `og-image.png` 455 KB) y clases Tailwind v4 inexistentes** (`SEO-046`, `FUNC-007`)  
    Más de 1 MB en dos imágenes PNG sin WebP/AVIF y uso masivo de utilidades CSS inexistentes en `globals.css` (`indigo-650/750/550`, `slate-350/650/850`, `duration-205`) que rompen estilos visuales, hover y contraste de accesibilidad.

---

## 3. Patrones Transversales Detectados

- **Frontera HTTP `db_proxy.php` como cuello de botella y fuente de inconsistencia**: Al concentrar el tráfico SQL de Next.js sobre llamadas PHP independientes sin transacciones reales, sin pooling optimizado y bloqueando DDL, genera a la vez problemas de seguridad (`SEC-008`–`SEC-011`), rendimiento (`SEO-052`, `FUNC-038`) y fallo de atomicidad en pagos (`SEC-032`, `FUNC-013`).
- **Desalineación entre código de aplicación y base de datos real**: Múltiples parches defensivos en runtime (`catch` silenciosos en `webhooks/stripe`, `0 AS impressions_count` en `actions.ts`, `CREATE TABLE IF NOT EXISTS` en `reportCompanyReview`) encubren una base de datos no migrada formalmente.
- **Lógica distribuida en memoria de contenedor serverless**: Tanto `revokedMagicTokens`, `checkRateLimit` en `actions.ts`, `/api/subscribe` y las llamadas `.limit()` síncronas en endpoints API operan asumiendo proceso único persistente cuando Vercel escala horizontalmente en lambdas efímeras.
- **Duplicación sin capa compartida en backend y frontend**: 7 scripts de correo duplicando plantillas HTML y lógica de pies legales/tracking; dos analizadores salariales (`salary_parser.py` y `salarios.ts`); dos constructores de filtros SQL (`getJobs` / `getFeaturedJobs`); y múltiples generadores de URLs de oferta (con y sin slug).

---

## 4. Roadmap Recomendado de Implementación por Fases

### Fase 0: Contención de Emergencia (Primeras 24–72 Horas)
*Objetivo: Cerrar fugas activas de secretos, bypass de pago, XSS y vulnerabilidades críticas de infraestructura.*
1. **Rotación y limpieza de secretos (`SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `LEG-011`, `LEG-012`)**:
   - Rotar contraseña de MySQL expuesta en `scripts/backup_mysql.sh`, `PROXY_SECRET`, claves en `backend/.env` y API key de Gemini; purgar `ecosier2_PortalEmpleo.sql` y `backend/migration_data/` del árbol e historial Git.
   - Eliminar el fallback `'portal_unsub_secret_fallback'` en `/api/unsubscribe`, pasar la Gemini key a cabecera `x-goog-api-key` y enmascarar emails en los `print()` de los 5 scripts `send_*.py`.
2. **Cierre de brechas críticas de pago y XSS (`SEC-031`, `SEC-036`, `SEC-017`)**:
   - Pasar PayPal PDT en `/api/checkout/report/verify` a modo **Fail-Closed** estricto.
   - Escapar o reemplazar por redirección segura la plantilla HTML de `/api/unsubscribe` (XSS) y eliminar `x-forwarded-host`/`host` en favor de `NEXT_PUBLIC_SITE_URL`.
3. **Activar Rate Limiting distribuido real (`SEC-024`, `SEC-025`, `SEC-026`, `SEC-020`)**:
   - Reemplazar todas las llamadas `.limit()` por `await .limitAsync()` en `api/*`, añadir `resetAsync` en `admin/auth`, añadir límite distribuido + Turnstile en `request_link` de `/api/unsubscribe` e incluir `clientIp` en las claves de `reactToJob` / `submitCompanyReview`.
4. **Retirada de riesgo inmediato de acción manual SEO (`SEO-041`)**:
   - Retirar el JSON-LD `Course` de `CourseAffiliate.tsx` y corregir las rutas erróneas más críticas (`index_new_jobs.py` con slug + clave IndexNow única `SEO-018`/`SEO-019`).

### Fase 1: Estabilización Legal, Base de Datos y Corrección de Flujos Rotos (Semanas 1–2)
*Objetivo: Sincronizar esquema SQL real, cumplir mínimos irrenunciables RGPD/LSSI-CE y reactivar los sistemas rotos.*
1. **Consolidación formal del esquema MySQL/MariaDB (`FUNC-004`, `FUNC-005`, `FUNC-036`, `FUNC-037`)**:
   - Auditar el esquema en producción, resolver la llave `subscribers.id`, aplicar las tablas faltantes (`stripe_processed_events`, `report_downloads`, `saved_jobs_reminders`, `streak_reminders`, `review_reports`) y columnas faltantes (`source`, `is_active`, `marketing_accepted`, `clicks_count`, `impressions_count`, etc.) por conexión TLS directa segura.
   - Crear índices compuestos + índice `FULLTEXT` y sustituir `ILIKE '%query%'` en `frontend/lib/jobs.ts`.
   - Añadir soporte de lote transaccional real (`$pdo->beginTransaction()`) y cerrar fallos de seguridad en `db_proxy.php` (`SEC-008`–`SEC-011`).
2. **Cumplimiento RGPD, LSSI-CE y ePrivacy (`LEG-001`, `LEG-010`, `LEG-013`, `LEG-014`, `LEG-023`, `LEG-024`, `LEG-029`)**:
   - Completar NIF, razón social y domicilio en `aviso-legal` y pie de correos; retirar enlace EU ODR (`LEG-003`); exigir renuncia Art. 103.m TRLGDCU y alinear precios/IVA en checkout (`LEG-004`, `LEG-005`).
   - Condicionar carga de OneSignal al consentimiento `cookies_consent` (`LEG-023`) y eliminar peticiones directas de navegador a Clearbit cacheando logotipos en servidor (`LEG-024`).
   - Reemplazar `DELETE` en `send_reactivation.py` por baja lógica preservando lista de supresión y clientes `is_premium` (`LEG-014`), hacer la baja `/api/unsubscribe` integral sobre todas las tablas y RFC 8058 One-Click (`LEG-013`, `LEG-018`), filtrar `marketing_accepted = 1` antes de publicidad (`LEG-010`) y alinear `bot/page.tsx` + verificación `robots.txt`/TDM (`LEG-029`, `LEG-030`).
3. **Reparación de flujos rotos críticos (`FUNC-001`..`FUNC-003`, `FUNC-006`..`FUNC-008`, `SEC-016`, `SEC-019`, `SEC-032`..`SEC-035`)**:
   - Corregir `generate_blog_post.py:92`, persistencia de `source` en `/api/subscribe`, consulta push en `send_push_notifications.py:98`, métricas reales en `getRecruiterJobs`, clases CSS en `globals.css`/`AdBanner`/`SearchFilters` y literales `**` en `salarios/page.tsx` y `send_reactivation.py`.
   - Endurecer `middleware.ts` / `actions.ts` (verificación HMAC en Edge, tokens CSRF reales, revocación de magic links en Redis, webhooks Stripe de disputas/reembolsos e incremento atómico en descargas PDF).

### Fase 2: Motor SEO Técnico, Core Web Vitals y Resiliencia Operativa (Semanas 3–4)
*Objetivo: Maximizar visibilidad en Google for Jobs, optimizar rastreo y estabilizar scrapers/mailing.*
1. **Google for Jobs y ciclo de vida `410 Gone` (`SEO-001`..`SEO-005`, `SEO-011`..`SEO-014`, `SEO-016`..`SEO-024`)**:
   - Corregir `directApply`, `PostalAddress`, `applicantLocationRequirements`, `baseSalary` y tabla histórica `expired_jobs_graveyard` devolviendo HTTP `410 Gone`.
   - Alinear `robots.ts` con un `<sitemapindex>` particionado con `<lastmod>` real de BD, corregir ventana estricta 48h en `sitemap-news.xml` y unificar enlaces con slug canónico en feeds y notificaciones.
2. **Arquitectura `hreflang` y SEO Programático (`SEO-029`..`SEO-031`, `SEO-036`..`SEO-039`)**:
   - Aplicar `noindex, follow` dinámico a combinaciones `/trabajo-[ciudad]/[tech]` vacías; completar traducción real de `/ca/` y `/eu/` y corregir la matriz simétrica `hreflang`.
3. **Core Web Vitals y Rendimiento (`SEO-046`..`SEO-052`, `SEC-038`, `SEC-060`)**:
   - Comprimir/convertir `logo.png` (566 KB) y `og-image.png` (455 KB), habilitar optimización `next/image`, reservar alturas SSR en `AdBanner.tsx`, optimizar `sw.js`, añadir `limit_req` y corregir herencia `add_header` en `nginx.conf.template`.
4. **Resiliencia Backend (`FUNC-019`, `FUNC-041`..`FUNC-046`, `SEC-045`, `SEC-046`)**:
   - Migrar parseo RSS a `defusedxml`, añadir cliente HTTP con SSRF pinning + backoff exponencial + check `robots.txt`/TDM, deduplicación por hash+similitud, desacoplar monolito `run_all.py` y centralizar plantillas Jinja2 con checkpoints SMTP idempotentes y registro de envíos.

### Fase 3: Consolidación Arquitectónica, Producto IA y Madurez (Mes 2+)
*Objetivo: Escalar calidad editorial/producto, automatizar tests y elevar conversión B2C/B2B.*
1. **Normalización con IA y Producto (`FUNC-010`, `FUNC-011`, `FUNC-012`, `FUNC-047`, `FUNC-049`, `FUNC-060`, `LEG-031`..`LEG-033`)**:
   - Servir informe salarial en PDF real (`report/download`), construir `/empresa/[slug]` y `/mi-cuenta` + Stripe Billing Portal, implementar pipeline batch con Structured Outputs (Gemini Flash) para salario/remoto/stack y añadir etiquetado AI Act + transparencia retributiva en `submitSponsoredJob`.
2. **Calidad de Ingeniería y Observabilidad (`FUNC-056`, `FUNC-065`, `SEC-058`, `SEC-065`, `LEG-032`)**:
   - Levantar `docker-compose` local de desarrollo, implementar tests unitarios/integración en CI (`pytest` + `vitest` + chequeo SEO automatizado + `npm audit`/`pip-audit`), auditoría real WCAG 2.1 AA con `axe-core` y alertas operativas de seguridad centralizadas.

---

## 5. Índice de Entregables Detallados

1. **[01_SEGURIDAD_Y_RESILIENCIA.md](./01_SEGURIDAD_Y_RESILIENCIA.md)** — **65 hallazgos** (`SEC-001` a `SEC-065`): Secretos, `db_proxy.php`, autenticación/sesiones/CSRF, rate limiting/DoS, Stripe/PayPal, XSS/CSP/Nginx, SSRF/XML y CI/CD.
2. **[02_SEO_Y_CRECIMIENTO_ORGANICO.md](./02_SEO_Y_CRECIMIENTO_ORGANICO.md)** — **65 hallazgos** (`SEO-001` a `SEO-065`): `JobPosting`, `410 Gone` y crawl budget, sitemaps/IndexNow/Indexing API, SEO programático, `hreflang`, `Course`/esquemas ricos, Core Web Vitals y enlazado interno.
3. **[03_FUNCIONALIDADES_UX_Y_ARQUITECTURA.md](./03_FUNCIONALIDADES_UX_Y_ARQUITECTURA.md)** — **65 hallazgos** (`FUNC-001` a `FUNC-065`): Bugs críticos de runtime, deriva SQL y migraciones, paneles B2B/Admin, UI/Tailwind v4, buscador/filtros, eficiencia SQL, resiliencia de scrapers, bots sociales y mailing.
4. **[04_LEGALIDAD_RGPD_Y_CUMPLIMIENTO_UE.md](./04_LEGALIDAD_RGPD_Y_CUMPLIMIENTO_UE.md)** — **35 hallazgos** (`LEG-001` a `LEG-035`): LSSI-CE, consumo/TRLGDCU, DSA, RGPD/LOPDGDD, ePrivacy/AEPD cookies, TDM Directiva 2019/790, AI Act, Directiva 2023/970 y Ley 11/2023 de Accesibilidad.
