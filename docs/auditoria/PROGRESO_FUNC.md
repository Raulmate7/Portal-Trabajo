# Progreso de resolución — 04_FUNCIONALIDADES_UX_Y_ARQUITECTURA

| Lote | Ítems | Estado |
|---|---|---|
| 1 | FUNC-001–016 | Resuelto (verificado) |
| 2 | FUNC-017–032 | Resuelto (ver notas) |
| 3 | FUNC-033–048 | Resuelto (ver notas) |
| 4 | FUNC-049–065 | Resuelto (ver notas) |

## Notas Lote 1 (`FUNC-001`–`FUNC-016`)
- **FUNC-001 – FUNC-005 / FUNC-014 – FUNC-016**: Ya resueltos y verificados en lotes previos (`BUG-002`, `BUG-003`, `BUG-004`, `BUG-008`, `BUG-009`, `BUG-021`, `BUG-022`, `BUG-035`).
- **FUNC-011 / FUNC-012 / FUNC-013**: Ya resueltos en `BUG-001`, `BUG-005` y `BUG-007` (`pipelines.py` desactiva `autocommit(False)`, inserta `id`/`dedup_hash`/`work_mode` y no reactiva `is_active` de ofertas moderadas o expiradas; `main.py` y `scraper_infoempleo.py` calculan `work_mode` antes de `compute_dedup_hash`).
- **FUNC-006 – FUNC-010**: La consolidación de migraciones declarativas y retirada progresiva de `database_optimization.sql` / `psycopg2.py` quedan documentadas como refactorizaciones arquitectónicas mayores fuera de hotfix (`BUG-046` / `BUG-051`).

## Notas Lote 2 (`FUNC-017`–`FUNC-032`)
- **FUNC-017 / FUNC-025**: [main.py](file:///home/raul/proyecto_empleo/backend/main.py) paraleliza la descarga de los 7 scrapers mediante `ThreadPoolExecutor(max_workers=4)` y añade segunda etapa difusa con `token_jaccard_similarity >= 0.85` contra vacantes recientes de la misma empresa.
- **FUNC-018 / FUNC-020**: [job_spider.py](file:///home/raul/proyecto_empleo/backend/job_aggregator/spiders/job_spider.py) amplía la paginación a `TECNOEMPLEO_MAX_PAGES` (8 por defecto) y emite alerta de anomalía DOM si obtiene 0 enlaces en una página `200 OK`.
- **FUNC-021 / FUNC-026 / FUNC-029 / FUNC-030 / FUNC-031 / FUNC-032**: Ya resueltos en lotes previos (`settings.py` AutoThrottle en `BUG-052`, `work_mode` en `compute_dedup_hash` en `BUG-001`, tarifas diarias `* 220` en `BUG-064`, `salarios.ts` en `BUG-011`/`012`, `categorize_existing_jobs.py` en `BUG-014` y `deactivate_expired_jobs.py` en `BUG-037`/`SEC-010`).
- **FUNC-027**: [dedup.py](file:///home/raul/proyecto_empleo/backend/logic/dedup.py) amplía `COMPANY_SUFFIXES_RE` con `S.R.L.`, `BV`, `SAS`, `Consultores`, `Grupo` y `España`.
- **Notas (`FUNC-019`, `FUNC-022`, `FUNC-023`, `FUNC-024`, `FUNC-028`)**: la extracción de detalle completo en Tecnoempleo, persistencia en BD de `scraper_runs` / circuit breaker y columnas `salary_min_eur`/`salary_max_eur` con ECB FX quedan documentados como evoluciones de esquema/pipeline.

## Notas Lote 3 (`FUNC-033`–`FUNC-048`)
- **FUNC-033 – FUNC-037 / FUNC-039 – FUNC-041 / FUNC-043 / FUNC-046**: Ya resueltos y verificados en lotes previos (`BUG-006`, `BUG-058`, `BUG-039`, `BUG-030`, `BUG-040`, `BUG-031`, `SEO-030`, `BUG-034`, `BUG-033`).
- **FUNC-038**: [LoadMoreJobs.tsx](file:///home/raul/proyecto_empleo/frontend/components/LoadMoreJobs.tsx) actualiza `?page=N` mediante `window.history.replaceState` al cargar más ofertas para preservar la posición al volver atrás.
- **FUNC-047**: [pdfGenerator.ts](file:///home/raul/proyecto_empleo/frontend/lib/pdfGenerator.ts) genera PDF 1.4 multipágina (`44` líneas/página, ajuste de línea a `88` caracteres) con `/Encoding /WinAnsiEncoding` y `latin1` para soportar tildes y caracteres españoles (`áéíóúñÁÉÍÓÚÑ¡¿`).
- **FUNC-048**: [route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/checkout/report/download/route.ts) incluye el listado completo de `TECH_DETAILS` y `DISPLAY_CITIES` y, para planes `pro` y `enterprise`, añade el `DESGLOSE AMPLIADO` con estadísticas salariales (`median`, `average`, `count`) para el top 10 o top 20 tecnologías.
- **Notas (`FUNC-042`, `FUNC-044`, `FUNC-045`)**: La paginación/búsqueda avanzada en `/admin` (`FUNC-042`) y las tablas dedicadas `job_submissions` / `sponsored_job_orders` (`FUNC-044`, `FUNC-045`) quedan documentadas como evoluciones opcionales de producto/esquema BD.

## Notas Lote 4 (`FUNC-049`–`FUNC-065`)
- **FUNC-050 / FUNC-051 / FUNC-052 / FUNC-055 / FUNC-062**: Ya resueltos en lotes previos (`BUG-020` en [send_referral_notifications.py](file:///home/raul/proyecto_empleo/backend/send_referral_notifications.py) con `confirmed_at IS NOT NULL` e `is_premium = TRUE`; filtro `last_sent_at` en [send_reactivation.py](file:///home/raul/proyecto_empleo/backend/send_reactivation.py); actualización condicional tras envío SMTP en [send_instant_featured_alerts.py](file:///home/raul/proyecto_empleo/backend/send_instant_featured_alerts.py) `BUG-049`; filtrado contra `email_suppression_list`; eliminación de `cookies_accepted` y llamada a `OneSignal.User.PushSubscription.optOut()` en [CookieBanner.tsx](file:///home/raul/proyecto_empleo/frontend/components/CookieBanner.tsx)).
- **FUNC-061**: [route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/company-logo/route.ts) genera un monograma SVG determinista (`200 OK`, `image/svg+xml`) con iniciales y color de marca derivado del dominio cuando Clearbit falla o responde sin imagen válida.
- **FUNC-065**: Implementados [route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/health/route.ts) (`GET /api/health` liveness) y [route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/health/deep/route.ts) (`GET /api/health/deep` protegido por `HEALTH_CHECK_SECRET`/`CRON_SECRET` mediante `timingSafeEqual`, verificando latencia SQL y frescura `< 48h` de ofertas activas).
- **Notas adicionales implementadas (`FUNC-042`, `FUNC-064`)**:
  - **FUNC-042**: [admin/jobs/route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/admin/jobs/route.ts) añade endpoint `GET` paginado con filtro `q`, conectado en [admin/page.tsx](file:///home/raul/proyecto_empleo/frontend/app/admin/page.tsx) y [PendingJobsModeration.tsx](file:///home/raul/proyecto_empleo/frontend/app/admin/PendingJobsModeration.tsx).
  - **FUNC-064**: [admin/jobs/route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/admin/jobs/route.ts) y [webhooks/stripe/route.ts](file:///home/raul/proyecto_empleo/frontend/app/api/webhooks/stripe/route.ts) invocan `revalidateTag('jobs:list')`, `revalidateTag('salaries:stats')` y `revalidatePath('/')` al aprobar/rechazar ofertas o activar patrocinios.
- **Evoluciones de esquema BD / infraestructura externa / producto nuevo (`FUNC-006`–`010`, `FUNC-019`, `FUNC-022`–`024`, `FUNC-028`, `FUNC-044`–`045`, `FUNC-049`, `FUNC-053`–`054`, `FUNC-056`–`060`, `FUNC-063`)**: quedan documentadas por requerir nuevas tablas/columnas MySQL, almacenamiento S3/R2, Redis externo o desarrollo de módulos completos (portal B2B, TTS/vídeo, consolidación `backend/social/`).
