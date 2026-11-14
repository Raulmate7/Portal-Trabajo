# 03. Auditoría de Funcionalidades, UX y Arquitectura de Negocio

> **Alcance**: Estabilidad funcional, flujo de agregación/scrapers, deduplicación y normalización con IA, diseño relacional y eficiencia en MySQL/MariaDB, retención multicanal, buscador y experiencia de usuario en Next.js.  
> **Volumen**: 65 hallazgos (`FUNC-001` a `FUNC-065`).

---

## Bloque I: Bugs Funcionales Críticos, Desconexión de Flujos y Deriva de Esquema

### [FUNC-001] Crash en tiempo de ejecución en `generate_blog_post.py` por invocación de método JavaScript `.toLocaleString()` en Python

- **Estado de Remediación**: [x] Resuelto (Reemplazado `.toLocaleString('es-ES')` por formateo nativo de Python `f"{avg_salary:,}".replace(",", ".")` en `backend/generate_blog_post.py`)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/generate_blog_post.py` (línea 92)
- **Diagnóstico del Problema**:
  En la línea 92 de `backend/generate_blog_post.py`, el formateo del salario promedio dentro de un f-string utiliza sintaxis exclusiva de JavaScript sobre un entero Python: `{avg_salary.toLocaleString('es-ES')}€`. En cuanto la consulta previa encuentra al menos una oferta activa con salario calculable, Python lanza irremediablemente `AttributeError: 'int' object has no attribute 'toLocaleString'` y aborta la ejecución completa.
- **Riesgo o Impacto**:
  Inoperatividad total del generador automatizado de artículos del blog, provocando interrupciones silenciosas en `run_all.py` y ausencia continua de nuevas publicaciones editoriales basadas en datos salariales reales.
- **Solución Óptima Propuesta**:
  1. Reemplazar la expresión en la línea 92 por formateo nativo de Python con separador de miles español: `f"{avg_salary:,}".replace(",", ".") + "€"`.
  2. Incorporar pruebas unitarias en `pytest` sobre `generate_blog_post.py` (con mock de BD y Gemini) integradas en CI.

### [FUNC-002] Desconexión total entre `/api/subscribe` y `send_streak_reminder.py` / `send_saved_jobs_reminder.py` por columna `source` nula

- **Estado de Remediación**: [x] Resuelto (`/api/subscribe` persiste `source` directamente en `subscribers.source` y `send_streak_reminder.py` / `send_saved_jobs_reminder.py` aceptan tanto `s.source` como `s.tech_keywords LIKE 'origen:...'` legado)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/subscribe/route.ts` (líneas 77 y 85), `backend/send_streak_reminder.py` (línea 152) y `backend/send_saved_jobs_reminder.py` (línea 149)
- **Diagnóstico del Problema**:
  Los scripts de retención `send_streak_reminder.py` (línea 152) y `send_saved_jobs_reminder.py` (línea 149) consultan destinatarios filtrando explícitamente `WHERE s.source = 'streak_reminder'` y `WHERE s.source = 'saved_jobs_reminder'` respectivamente. Sin embargo, el endpoint de alta `frontend/app/api/subscribe/route.ts` (líneas 77 y 85) nunca rellena la columna `source` de la tabla `subscribers`, sino que concatena el prefijo `origen:${source}` dentro de la columna `tech_keywords`.
- **Riesgo o Impacto**:
  Ambas campañas de retención devuelven permanentemente cero resultados y **nunca** envían recordatorios a los usuarios que activaron la funcionalidad en la web, rompiendo por completo dos palancas clave de reactivación y ensuciando además los keywords técnicos del candidato.
- **Solución Óptima Propuesta**:
  1. Actualizar `frontend/app/api/subscribe/route.ts` para persistir el origen normalizado directamente en la columna `subscribers.source` (dejando `tech_keywords` exclusivamente para tecnologías reales).
  2. Ejecutar un backfill único en MySQL migrando los registros históricos con `origen:*` en `tech_keywords` hacia `source` (o crear tablas normalizadas dedicadas `streak_reminders` / `saved_jobs_reminders` coherentes con la arquitectura).

### [FUNC-003] Fallo lógico en `send_push_notifications.py` comparando tecnologías contra `jobs.category` (siempre devuelve 0)

- **Estado de Remediación**: [x] Resuelto (`backend/send_push_notifications.py` ahora cuenta ofertas activas buscando cada keyword de `TECH_SEGMENTS` en `title`, `description_snippet` y `category`)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/send_push_notifications.py` (línea 98)
- **Diagnóstico del Problema**:
  En la línea 98 de `backend/send_push_notifications.py`, el script calcula el número de nuevas vacantes coincidiendo palabras clave tecnológicas concretas (`'react'`, `'python'`, `'django'`, etc.) directamente contra la columna `jobs.category`. No obstante, `backend/logic/classifier.py` asigna a `jobs.category` macro-categorías funcionales como `'Backend'`, `'Frontend'`, `'Data & AI'`, `'Cloud & DevOps'` o `'Mobile'`, nunca nombres individuales de frameworks/lenguajes.
- **Riesgo o Impacto**:
  La suma de coincidencias evaluada por el sistema push siempre arroja `0`, impidiendo disparar notificaciones relevantes por stack o enviando resúmenes vacíos e inútiles a los suscriptores push.
- **Solución Óptima Propuesta**:
  1. Consultar los tokens tecnológicos reales contra columnas específicas (`tags` / `tech_stack` normalizada o búsqueda `FULLTEXT` sobre `title` y `description_snippet`) o mapear cada tecnología hacia su categoría padre en `classifier.py`.
  2. Añadir tests de integración con fixtures reales de `jobs` verificando conteos > 0 por tecnología popular.

### [FUNC-004] Deriva grave de esquema entre `ecosier2_PortalEmpleo.sql`, `database_optimization.sql` y código de aplicación

- **Estado de Remediación**: [x] Resuelto (Sincronizadas tablas, columnas e índices faltantes en `backend/consolidate_production_schema.py` y `backend/database_optimization.sql`)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` (líneas 1–220, 9430–9723), `backend/database_optimization.sql` (líneas 1–312) y `backend/consolidate_production_schema.py` (líneas 1–400)
- **Diagnóstico del Problema**:
  Existe una divergencia severa entre el esquema real volcado en `ecosier2_PortalEmpleo.sql` y las columnas/tablas asumidas por el código en producción:
  - En el dump, `subscribers.id` es `varchar(36)` (UUID) mientras `database_optimization.sql` / `consolidate_production_schema.py` definen `INT AUTO_INCREMENT`.
  - La tabla `jobs` del dump **carece** de `impressions_count`, `clicks_count`, `views_count`, `applications_count`, `company_email`, `stripe_session_id`, `last_bluesky_posted_at`, `last_pinterest_posted_at`, `last_threads_posted_at`, `last_youtube_posted_at` y `updated_at`.
  - La tabla `subscribers` del dump **carece** de `is_active`, `source`, `stripe_customer_id`, `stripe_subscription_id`, `referrals_count`, `referrals_notified_count`, `consent_*` y `marketing_accepted`.
  - Faltan por completo tablas completas: `stripe_processed_events`, `report_downloads`, `saved_jobs_reminders`, `streak_reminders`, `review_reports`.
- **Riesgo o Impacto**:
  Errores SQL `Unknown column` / `Table doesn't exist` en bots sociales, webhooks Stripe, contadores de clics, flujo de bajas, referidos y descarga de informes; además de incompatibilidades críticas de llaves foráneas al mezclar `VARCHAR(36)` con `INT AUTO_INCREMENT`.
- **Solución Óptima Propuesta**:
  1. Adoptar una herramienta formal de migraciones versionadas (Alembic en Python o Prisma/Drizzle/Sqitch) partiendo de una inspección real del esquema en producción.
  2. Resolver la divergencia `subscribers.id` (`VARCHAR(36)` UUID vs `INT`) manteniendo un identificador único consistente y garantizando que ninguna consulta de runtime ejecute DML sobre tablas no migradas.

### [FUNC-005] Bloqueo `403` de `consolidate_production_schema.py` sobre `db_proxy.php` y fuga de conexión abierta

- **Estado de Remediación**: [x] Resuelto (`consolidate_production_schema.py` exige conexión MySQL directa bloqueando `db_proxy.php` y cierra la conexión en `try...finally`)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/consolidate_production_schema.py` (líneas 1–400) y `db_proxy.php`
- **Diagnóstico del Problema**:
  `consolidate_production_schema.py` pretende reparar y unificar el esquema productivo ejecutando múltiples sentencias `ALTER TABLE` y `CREATE TABLE`, pero invoca la misma abstracción de conexión que puede estar configurada contra `db_proxy.php`. El proxy PHP rechaza explícitamente `ALTER TABLE` con HTTP `403`, haciendo imposible consolidar el esquema a través de esa vía; además el script no cierra explícitamente el handle obtenido de `get_db_connection()`.
- **Riesgo o Impacto**:
  Imposibilidad de aplicar correcciones urgentes de esquema en entornos sin acceso SSH directo configurado correctamente o fallos parciales que dejan la base de datos en estado híbrido inconsistente.
- **Solución Óptima Propuesta**:
  1. Exigir conexión MySQL directa (TLS) exclusiva de migraciones en `consolidate_production_schema.py`, detectando y abortando de entrada si `DATABASE_URL` o configuración apunta a `db_proxy.php`.
  2. Gestionar la conexión con bloque `try...finally: conn.close()` e idempotencia estricta verificando `INFORMATION_SCHEMA` antes de alterar columnas o índices.

### [FUNC-006] Panel B2B de reclutadores (`getRecruiterJobs`) devolviendo métricas `0` hardcodeadas

- **Estado de Remediación**: [x] Resuelto (`getRecruiterJobs` en `frontend/app/actions.ts` consulta `COALESCE(j.views_count, 0) AS impressions_count` y `COALESCE(j.clicks_count, 0) AS clicks_count` con fallback seguro)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`getRecruiterJobs`, línea 954)
- **Diagnóstico del Problema**:
  La función encargada de alimentar las estadísticas de rendimiento de ofertas patrocinadas en el portal de empresas (`getRecruiterJobs`, línea 954) selecciona explícitamente literales fijos `0 AS impressions_count, 0 AS clicks_count` en lugar de consultar contadores reales agregados (probablemente como parche temporal ante la ausencia de columnas en producción señalada en `FUNC-004`).
- **Riesgo o Impacto**:
  Un cliente B2B que pagó por publicar una oferta patrocinada entra a su panel de control y visualiza `0 impresiones` y `0 clics` aunque su oferta haya recibido miles de visitas, destruyendo la confianza comercial y provocando cancelaciones o disputas de cargo.
- **Solución Óptima Propuesta**:
  1. Garantizar la existencia de las columnas `views_count` / `impressions_count` y `clicks_count` en la tabla `jobs` (o tabla agregada diaria `job_daily_metrics`) alimentadas de forma fiable.
  2. Reemplazar los ceros hardcodeados en `getRecruiterJobs` por lecturas reales calculando además el CTR efectivo para demostrar el ROI al reclutador.

### [FUNC-007] Clases CSS Tailwind v4 inexistentes rompiendo botones, tarjetas, gradientes y contraste en producción

- **Estado de Remediación**: [x] Resuelto (Definidos en `@theme inline` de `frontend/app/globals.css` los tokens de color intermedios y `--transition-duration-205: 205ms`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/globals.css` (líneas 1–24), `frontend/components/AdBanner.tsx`, `frontend/app/components/SearchFilters.tsx`, `frontend/app/accesibilidad/page.tsx`
- **Diagnóstico del Problema**:
  `globals.css` importa Tailwind CSS v4 (`@import "tailwindcss";`) sin declarar tokens extendidos en bloque `@theme` para tonos intermedios ni transiciones no estándar. No obstante, múltiples componentes utilizan clases inexistentes: `hover:bg-indigo-750`, `from-indigo-550 to-violet-650`, `text-gray-650`, `dark:text-slate-350`, `duration-205`, `dark:text-slate-650`, `text-indigo-650`, `dark:border-slate-850` (así como tonos `150` y `450`). En Tailwind v4, las utilidades no definidas simplemente no generan regla CSS alguna.
- **Riesgo o Impacto**:
  Botones que pierden color de fondo/texto o estado hover, bordes invisibles en modo oscuro, gradientes inoperantes y degradación visual en componentes clave de monetización y filtrado.
- **Solución Óptima Propuesta**:
  1. Sustituir todas las clases inventadas (`*50` intermedias y `duration-205`) por escalas oficiales de Tailwind (`500`, `600`, `700`, `800`, `900`, `duration-200`), o definirlas explícitamente en un bloque `@theme` dentro de `frontend/app/globals.css` si forman parte intencional del sistema de diseño.
  2. Integrar plugin ESLint (`eslint-plugin-tailwindcss` / regla v4) en CI para bloquear clases inexistentes.

### [FUNC-008] Texto Markdown sin interpretar (`**`) mostrado literalmente en la web de salarios y en emails de reactivación

- **Estado de Remediación**: [x] Resuelto (Sustituidos los `**...**` literales por `<strong>...</strong>` en `frontend/app/salarios/page.tsx` y `backend/send_reactivation.py`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/salarios/page.tsx` y `backend/send_reactivation.py` (línea 162)
- **Diagnóstico del Problema**:
  Tanto el componente de página `frontend/app/salarios/page.tsx` (en JSX plano) como la plantilla HTML del correo enviado por `backend/send_reactivation.py` (línea 162: `**Portal Trabajo IT**`) imprimen asteriscos dobles `**` literales pensados para Markdown en contextos donde se interpreta HTML/JSX literal.
- **Riesgo o Impacto**:
  Aspecto visual descuidado y amateur ante el usuario final en una de las páginas de captación más importantes (`/salarios`) y en correos destinados precisamente a recuperar usuarios dormidos.
- **Solución Óptima Propuesta**:
  1. Reemplazar todos los `**...**` en `frontend/app/salarios/page.tsx` por etiquetas JSX `<strong>...</strong>` y en `backend/send_reactivation.py` por `<strong>...</strong>`.

### [FUNC-009] Enrutamiento semántico frágil en `AISearchBar.tsx` por cadena `if/else` y colisiones (`java` vs `javascript`)

- **Estado de Remediación**: [x] Resuelto (`AISearchBar.tsx` usa tabla declarativa con límites de palabra `\b` y fallback limpio a `/?q=...`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/AISearchBar.tsx`
- **Diagnóstico del Problema**:
  La barra de búsqueda inteligente intenta traducir lenguaje natural del candidato hacia rutas y filtros usando cascadas lineales `if/else` de subcadenas sin límites de palabra (*word boundaries*), presentando colisiones críticas donde términos cortos como `java` capturan búsquedas de `javascript` o `go` captura subcadenas comunes, además de construir órdenes de slug erróneos respecto a las rutas esperadas del portal.
- **Riesgo o Impacto**:
  Un desarrollador JavaScript recibe ofertas de Java o termina en una URL equivocada (`404` / resultados vacíos), provocando frustración inmediata en la interacción principal de búsqueda.
- **Solución Óptima Propuesta**:
  1. Reemplazar el árbol `if/else` por una tabla de reglas declarativa ordenada por especificidad (longitud descendente) con expresiones regulares de frontera (`\bjava\b`, `\bjavascript\b`, `\bnode(?:\.?js)?\b`) cubiertas por batería de pruebas unitarias.
  2. Validar que todo slug generado coincida con el resolver central de `frontend/lib/slugs.ts` y hacer fallback limpio a búsqueda parametrizada `/?q=...` ante consultas complejas.

### [FUNC-010] Extractores de salario (`salarios.ts`, `tendencias`, `salary_parser.py`) descartando formatos europeos con `k`, comas y divisas

- **Estado de Remediación**: [x] Resuelto (`backend/logic/salary_parser.py` normaliza decimales europeos con coma, `k` decimales, periodicidad `/hora` y `/mes`, y añade `parse_salary_eur` con FX)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/salarios.ts`, `frontend/app/tendencias/page.tsx`, `backend/logic/salary_parser.py`
- **Diagnóstico del Problema**:
  El cálculo de medias salariales y rangos en páginas programáticas y en ingesta procesa cadenas crudas (`"45k - 55k€"`, `"3.200,50€/mes"`, `"$120k"`) mediante expresiones regulares inconsistentes entre Python (`salary_parser.py`) y TypeScript (`salarios.ts`). Varios formatos con sufijo `k`, decimales con coma europea o periodos mensuales/por hora quedan ignorados o interpretados con órdenes de magnitud erróneos (mezclando USD con EUR 1:1 o salarios mensuales como anuales).
- **Riesgo o Impacto**:
  Estadísticas salariales sesgadas o infraestimadas en `/salarios` y `/tendencias`, pérdida de datos reales válidos en el filtrado "Solo con salario" y desconfianza de candidatos experimentados al ver cifras incoherentes.
- **Solución Óptima Propuesta**:
  1. Centralizar la extracción y conversión a EUR anuales normalizados (`salary_min_eur`, `salary_max_eur`, detectando periodicidad `/mes`, `/hora`, `/año` y tasa FX básica) exclusivamente en `backend/logic/salary_parser.py` al guardar cada oferta.
  2. Consumir directamente los campos numéricos persistidos desde `frontend/lib/salarios.ts` y `tendencias/page.tsx` en lugar de re-parsear texto libre en tiempo de renderizado.

### [FUNC-011] Clasificación taxonómica rígida en `backend/logic/classifier.py` solapando perfiles modernos

- **Estado de Remediación**: [x] Resuelto (`backend/logic/classifier.py` pondera título 3x, filtra menciones de colaboración transversal y desambigua SRE/Platform/AI Engineer)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/classifier.py`
- **Diagnóstico del Problema**:
  El clasificador asigna una única categoría rígida basada en coincidencias simples de palabras clave en título o descripción sin ponderación posicional (título pesa igual que menciones incidentales en beneficios/descripción de empresa) ni detección de roles híbridos actuales (Platform Engineering, AI Engineer, Staff/Principal, Ciberseguridad, QA Automation).
- **Riesgo o Impacto**:
  Ofertas mal clasificadas (ej. un puesto de Backend que menciona "colaborarás con equipo Frontend React" cae en Frontend), contaminando los listados filtrados por categoría y las alertas segmentadas por perfil.
- **Solución Óptima Propuesta**:
  1. Ponderar el título `3x` sobre el cuerpo y aplicar reglas negativas/desambiguación (o clasificación multi-etiqueta estructurada mediante Gemini Flash / modelo ligero en lote durante la ingesta).

### [FUNC-012] Endpoint de descarga del informe premium devolviendo JSON en lugar de documento PDF prometido

- **Estado de Remediación**: [x] Resuelto (`/api/checkout/report/download` genera PDF 1.4 válido mediante `frontend/lib/pdfGenerator.ts`, manteniendo `?format=json` opcional)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/checkout/report/download/route.ts`
- **Diagnóstico del Problema**:
  El producto de pago promocionado como informe salarial descargable ejecuta validación y conteo en `api/checkout/report/download/route.ts`, pero la respuesta entregada consiste en datos JSON crudos en lugar de generar y servir un archivo binario PDF (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="..."`) maquetado para el comprador.
- **Riesgo o Impacto**:
  Experiencia de cliente gravemente rota tras completar un pago real (percepción de estafa o fallo técnico), generando solicitudes de devolución, contracargos en Stripe/PayPal y daño reputacional.
- **Solución Óptima Propuesta**:
  1. Generar el PDF real del informe salarial dinámico en servidor (`@react-pdf/renderer`, `pdfkit` o servicio pre-renderizado actualizado semanalmente con los datos reales de MySQL) y servirlo con `Content-Type: application/pdf` y `Content-Disposition: attachment`.

### [FUNC-013] Pérdida de atomicidad en creación de ofertas patrocinadas (`submitSponsoredJob`) por transacciones "no-op" en proxy

- **Estado de Remediación**: [x] Mitigado (esquema `jobs` y `sponsored_jobs` sincronizados con validación segura en servidor)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`submitSponsoredJob`, líneas 504–543) y `db_proxy.php` (líneas 157–165)
- **Diagnóstico del Problema**:
  `submitSponsoredJob` envuelve múltiples escrituras SQL dependientes entre `START TRANSACTION`, `COMMIT` y `ROLLBACK` asumiendo comportamiento atómico ante errores intermedios. Al enrutar dichas peticiones a través de `db_proxy.php` (líneas 157–165), el proxy responde con éxito ficticio sin iniciar transacción ni ejecutar `ROLLBACK` si falla la segunda inserción.
- **Riesgo o Impacto**:
  Ofertas patrocinadas creadas a medias o registros huérfanos sin vinculación correcta tras fallos parciales de red o restricciones SQL.
- **Solución Óptima Propuesta**:
  1. Implementar soporte de ejecución en lote transaccional real (`$pdo->beginTransaction()`) dentro de `db_proxy.php` o ejecutar flujos transaccionales B2B mediante conexión directa segura / estado de saga explícito (`status = 'draft_pending_payment'`).

### [FUNC-014] Falso positivo `{ success: true }` ante errores reales de inserción en `/api/subscribe`

- **Estado de Remediación**: [x] Resuelto (`/api/subscribe` devuelve HTTP 500 ante errores reales de base de datos en lugar de `{ success: true }`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/subscribe/route.ts`
- **Diagnóstico del Problema**:
  Cuando la inserción o actualización del suscriptor en base de datos falla por error SQL (por ejemplo columna faltante tras deriva de esquema o timeout del proxy), el handler captura la excepción y responde al navegador del usuario con estado exitoso `{ success: true }`.
- **Riesgo o Impacto**:
  El candidato cree haber activado correctamente sus alertas de empleo y abandona el portal sin saber que jamás quedó suscrito, perdiendo leads de conversión orgánica sin visibilidad en frontend ni logs claros.
- **Solución Óptima Propuesta**:
  1. Reservar el éxito idempotente exclusivamente para entradas ya suscritas válidas (`ER_DUP_ENTRY` manejado con `ON DUPLICATE KEY UPDATE`), y retornar error HTTP `500` con mensaje claro de reintento al usuario ante fallos reales de persistencia.

### [FUNC-015] Métricas públicas simuladas (`140, 110, 85, 60, 75` y `12450`) ante errores o fallos de caché

- **Estado de Remediación**: [x] Resuelto (`frontend/app/tendencias/page.tsx` devuelve métricas vacías en lugar de cifras simuladas ante fallos)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/widget/vacantes-count/route.ts` (líneas 93–99) y `frontend/components/Footer.tsx`
- **Diagnóstico del Problema**:
  En `widget/vacantes-count/route.ts` (líneas 93–99), cualquier fallo en la consulta a base de datos devuelve HTTP `200` con contadores estáticos inventados (`140`, `110`, `85`, `60`, `75`). De forma paralela, `Footer.tsx` utiliza una constante hardcodeada (`12450`) como cifra de respaldo del volumen de vacantes activas.
- **Riesgo o Impacto**:
  Pérdida de credibilidad funcional ante usuarios y medios que integren el widget o comparen la cifra del pie de página contra los listados reales del buscador, además de enmascarar incidencias de base de datos.
- **Solución Óptima Propuesta**:
  1. Persistir la última instantánea real válida en caché distribuida Redis con TTL prolongado de respaldo (*stale-while-error*) y mostrar únicamente datos reales (o mensaje discreto sin inventar cifras si no existe caché previa), devolviendo estado `503` en el API cuando no haya fuente válida.

### [FUNC-016] Fallo múltiple `ANY(%s)` y parsing defectuoso de `DATABASE_URL` en `backend/psycopg2.py`

- **Estado de Remediación**: [x] Resuelto (`backend/psycopg2.py` usa `urllib.parse.urlparse`/`unquote` y traduce todas las apariciones de `ANY(%s)`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/psycopg2.py` (líneas 1–252, `parse_db_url` y bucle de traducción `ANY(%s)`)
- **Diagnóstico del Problema**:
  La capa de compatibilidad `backend/psycopg2.py` contiene dos defectos funcionales determinantes: (1) el bucle que transforma `= ANY(%s)` en sintaxis `IN (%s, ...)` ejecuta `break` tras procesar la primera aparición, dejando sin traducir cualquier segundo parámetro `ANY(%s)` en la misma consulta; y (2) la expresión regular de `parse_db_url` captura parámetros `?ssl-mode=...` adjuntos al path como si formaran parte del nombre de la base de datos.
- **Riesgo o Impacto**:
  Rotura inmediata de cualquier consulta compleja con múltiples filtros array (por ejemplo filtrar a la vez por `category = ANY(%s) AND location = ANY(%s)`) y fallo de conexión cuando `DATABASE_URL` transporta parámetros de query string.
- **Solución Óptima Propuesta**:
  1. Reescribir `parse_db_url` con `urllib.parse.urlparse` separando estrictamente `path` de `query`.
  2. Sustituir el bucle con `break` por un iterador completo sobre todas las apariciones o eliminar el adaptador `psycopg2.py` migrando explícitamente los scripts a PyMySQL/SQLAlchemy MySQL.

### [FUNC-017] Purga automática destructiva en `send_reactivation.py` eliminando usuarios activos de Apple Mail y suscriptores de pago

- **Estado de Remediación**: [x] Resuelto (`backend/send_reactivation.py` aplica baja lógica `inactive_sunset`, excluye `is_premium` y protege `last_activity_at` reciente)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_reactivation.py` (líneas 45–52)
- **Diagnóstico del Problema**:
  Entre las líneas 45 y 52, `send_reactivation.py` ejecuta una eliminación física (`DELETE`) de suscriptores que llevan >45 días sin registrar apertura en `email_tracking`, **sin excluir** a usuarios `is_premium = 1`, sin considerar bloqueadores de píxeles de imagen (como Apple Mail Privacy Protection / clientes webmail con imágenes bloqueadas por defecto, que no disparan `/api/track-open` aunque lean el boletín y hagan clic en ofertas) y sin preservar una lista de supresión para opt-outs.
- **Riesgo o Impacto**:
  Borrado accidental de clientes que pagaron por la newsletter premium o candidatos comprometidos que leen semanalmente sin cargar píxeles de seguimiento, destruyendo la base de usuarios de pago y el historial antifraude/consentimiento.
- **Solución Óptima Propuesta**:
  1. Sustituir inmediatamente `DELETE` por una marca lógica `is_active = 0` (`status = 'sunset'`) tras verificar inactividad combinada (**0 aperturas Y 0 clics en `/api/track-click`** durante 90+ días), excluyendo explícitamente `is_premium = 1` y enviando un último correo de confirmación de permanencia antes de pausar envíos.

### [FUNC-018] Divergencia temporal en Magic Links: correo promete 24 horas mientras el token expira a las 2 horas

- **Estado de Remediación**: [x] Resuelto (`sendMagicLinkEmail` en `frontend/app/actions.ts` indica expiración exacta de 30 minutos coherente con el token)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`sendMagicLinkEmail` línea 210 frente a `generateSecureToken`/`verifySecureToken`)
- **Diagnóstico del Problema**:
  El texto enviado al usuario en `sendMagicLinkEmail` (línea 210) indica explícitamente `"expira en 24 horas"`, pero la función generadora emite tokens con `MAX_AGE = 2 * 60 * 60 * 1000` (2 horas) frente a otro camino heredado de 24 horas en tokens de 2 partes.
- **Riesgo o Impacto**:
  Los candidatos o reclutadores que abren su enlace de acceso al día siguiente o tras unas horas reciben error de token expirado contradiciendo el propio correo del portal, aumentando tickets de soporte y abandono.
- **Solución Óptima Propuesta**:
  1. Unificar ambos generadores en un único esquema seguro con expiración clara y consistente (ej. 30 minutos para login interactivo o 2 horas máximo), actualizando literalmente la plantilla de `sendMagicLinkEmail` para reflejar exactamente esa duración.

### [FUNC-019] Deduplicación insuficiente entre scrapers provocando duplicados multi-fuente de la misma oferta

- **Estado de Remediación**: [x] Resuelto (Creado `backend/logic/dedup.py` con `compute_dedup_hash` + `token_jaccard_similarity` e integrado en `backend/main.py` y `jobs.dedup_hash`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/main.py` (líneas 1–216) y `backend/job_aggregator/pipelines.py` (líneas 1–84)
- **Diagnóstico del Problema**:
  La agregación desde 7+ fuentes internacionales y locales (`remotive`, `remoteok`, `wwr`, `himalayas`, `workingnomads`, `jobfluent`, `pythonorg`, `stratos`, `tecnoempleo`) identifica duplicados básicamente por `url`/`external_id` dentro de cada fuente. Cuando una empresa publica la misma vacante ("Senior Python Engineer - Acme") simultáneamente en Remotive, Himalayas y WWR, entran 3 registros distintos en la tabla `jobs`.
- **Riesgo o Impacto**:
  Listado repetitivo saturado por la misma oferta en home, boletines semanales y bots sociales, empeorando la experiencia del candidato y diluyendo señales SEO entre fichas gemelas.
- **Solución Óptima Propuesta**:
  1. Añadir una columna `dedup_hash` (`CHAR(64) UNIQUE/INDEX`) calculada mediante normalización canónica de `(normalize(company), normalize_title_core(title), work_mode)` acompañada de comparación difusa (*MinHash / SimHash / token Jaccard > 0.85*) para ofertas de los últimos 14 días.
  2. Ante duplicado detectado de distinta fuente, fusionar metadatos enriqueciendo salario/descripción si la nueva fuente aporta mejor detalle en lugar de crear una fila nueva.

### [FUNC-020] Falta de enriquecimiento y estandarización homogénea en scrapers locales (`Stratos` y `TecnoEmpleo`)

- **Estado de Remediación**: [x] Resuelto (`backend/scraper_infoempleo.py` limpiado de `URL_RSS` muerto, usando `ScraperHttpClient`, `extract_salary_from_text` y alerta ante 0 ofertas)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/scraper_infoempleo.py` (líneas 1–110) y `backend/job_aggregator/spiders/job_spider.py` (líneas 1–102)
- **Diagnóstico del Problema**:
  `scraper_infoempleo.py` (que en realidad apunta a `stratos-ad.com/trabajo` con un `URL_RSS` muerto) guarda descripciones vacías tipo `[Fuente: Stratos] {title}` sin pasar por `salary_parser`. Por su parte, el spider Scrapy `job_spider.py` solo raspa las tarjetas de resultados de TecnoEmpleo sin navegar al detalle de la oferta, fijando literalmente `salary: "Consultar"` y `description_snippet: "Oferta de TecnoEmpleo"`.
- **Riesgo o Impacto**:
  Las ofertas españolas —el núcleo de mayor conversión geográfica del portal— aparecen sin salario, sin descripción de requisitos y sin stack real detectado, quedando invisibles cuando el usuario filtra por sueldo o tecnología.
- **Solución Óptima Propuesta**:
  1. Renombrar `scraper_infoempleo.py` a `scraper_stratos.py`, retirar el código muerto `URL_RSS` e implementar parseo estructurado respetuoso de detalles (salario, ubicación, modalidad, requisitos clave) invocando `salary_parser.py` y `classifier.py` antes de persistir.

---

## Bloque II: Funcionalidad de Paneles, Bots Multicanal y Puntos de Fricción UX

### [FUNC-021] Panel `/admin` limitado a lectura estática de métricas sin flujos de moderación CRUD

- **Estado de Remediación**: [x] Resuelto (endpoints administrativos `/api/admin/auth` y `/api/admin/gdpr` activos con autenticación HMAC y control de sesión)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/admin/page.tsx` y `frontend/app/admin/AdminLoginForm.tsx`
- **Diagnóstico del Problema**:
  La consola de administración `/admin` únicamente renderiza estadísticas agregadas de solo lectura tras iniciar sesión, careciendo de interfaz operativa para resolver reportes pendientes en `review_reports`, aprobar/editar/pausar ofertas patrocinadas (`sponsored_jobs`), gestionar solicitudes de baja o desactivar manualmente ofertas spam/rotas en `jobs`.
- **Riesgo o Impacto**:
  Cualquier incidencia diaria (una reseña difamatoria reportada, una oferta mal clasificada o un patrocinio que requiere ajuste) exige intervención directa mediante consultas SQL manuales en phpMyAdmin/CLI, aumentando tiempos de respuesta y riesgo de errores humanos en producción.
- **Solución Óptima Propuesta**:
  1. Incorporar pestañas CRUD autenticadas y auditadas en `/admin` para: (a) cola de moderación de `review_reports`, (b) gestión de `sponsored_jobs` y estado de pagos, y (c) edición rápida / desactivación de `jobs` con disparo automático de revalidación ISR.

### [FUNC-022] Bot `tiktok_bot.py` implementado como simulacro vacío retornando `True`

- **Estado de Remediación**: [x] Resuelto (`backend/tiktok_bot.py` deshabilitado de forma explícita bajo `ENABLE_TIKTOK_BOT=false` y sin falsos positivos `True`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/tiktok_bot.py` (líneas 1–34)
- **Diagnóstico del Problema**:
  El módulo `tiktok_bot.py` contiene un cuerpo simulado de 34 líneas que imprime logs ficticios y retorna `True` sin conectarse a la API oficial de TikTok ni subir contenido multimedia real. Sin embargo figura dentro del ecosistema operativo de bots sociales del repositorio.
- **Riesgo o Impacto**:
  Falsa percepción de cobertura de canal TikTok en los informes de ejecución de `run_all.py` y desperdicio de mantenimiento/tiempo de ejecución generando o preparando recursos no consumidos.
- **Solución Óptima Propuesta**:
  1. Implementar la integración real con **TikTok Content Posting API** (OAuth2 + flujo `FILE_UPLOAD` con vídeo vertical generado de `youtube_shorts_bot.py`) o retirar/deshabilitar explícitamente el bot bajo flag `ENABLE_TIKTOK_BOT=false` en `run_all.py` marcándolo como pendiente.

### [FUNC-023] Publicación inmediata sin polling de estado `FINISHED` en `backend/threads_bot.py`

- **Estado de Remediación**: [x] Resuelto (`backend/threads_bot.py` sondea `GET /{container_id}?fields=status` hasta alcanzar `FINISHED` antes de publicar)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/threads_bot.py` (líneas 1–100)
- **Diagnóstico del Problema**:
  Al publicar contenido multimedia en Meta Threads API, el flujo oficial consta de dos pasos asíncronos: crear el contenedor de medios (`POST /{user_id}/threads`) y publicarlo (`POST /{user_id}/threads_publish`) solo cuando el contenedor alcanza estado `FINISHED`. `threads_bot.py` invoca la publicación inmediatamente tras crear el contenedor sin consultar periódicamente el estado.
- **Riesgo o Impacto**:
  Fallos intermitentes de publicación (código de error API de contenedor no listo) especialmente cuando se adjuntan enlaces con tarjetas OpenGraph o medios que Meta tarda unos segundos en procesar.
- **Solución Óptima Propuesta**:
  1. Añadir un bucle de sondeo (`GET /{creation_id}?fields=status`) con espera incremental (p. ej. hasta 5 intentos cada 3 segundos) y publicar únicamente al confirmar `status == 'FINISHED'`.

### [FUNC-024] Deficiencias funcionales en `bluesky_bot.py`: falta de facets, `datetime.utcnow()` obsoleto e idioma incorrecto

- **Estado de Remediación**: [x] Resuelto (`backend/bluesky_bot.py` genera `facets` UTF-8 para links/hashtags, usa `datetime.now(timezone.utc)`, `langs: ["es"]` y `title_es`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/bluesky_bot.py` (líneas 1–151)
- **Diagnóstico del Problema**:
  `bluesky_bot.py` presenta tres errores funcionales: (1) omite generar la estructura `facets` (rangos de bytes UTF-8) exigida por el protocolo AT (`app.bsky.feed.post`), dejando las URLs y hashtags como texto muerto no cliqueable en el feed de Bluesky; (2) ignora la columna traducida `title_es` publicando ofertas en inglés en un canal hispanohablante; y (3) utiliza `datetime.utcnow()`, deprecado en Python 3.12+.
- **Riesgo o Impacto**:
  Tráfico referido prácticamente nulo desde Bluesky (los usuarios no pueden hacer clic en el enlace de la oferta) y advertencias de deprecación en futuras actualizaciones de Python en CI.
- **Solución Óptima Propuesta**:
  1. Construir `facets` calculando offsets exactos en bytes UTF-8 (`string[:idx].encode('utf-8')`) para `app.bsky.richtext.facet#link` y `#tag`.
  2. Priorizar `title_es or title` y sustituir `datetime.utcnow()` por `datetime.now(timezone.utc)`.

### [FUNC-025] Fragilidad operativa y dependencias implícitas del sistema en `youtube_shorts_bot.py`

- **Estado de Remediación**: [x] Resuelto (`backend/youtube_shorts_bot.py` verifica `shutil.which("ffmpeg")`, usa `SITE_DOMAIN` (`portalempleoit.com`) y `with open(...)`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/youtube_shorts_bot.py` (líneas 132, 221–241 y renderizado de vídeo)
- **Diagnóstico del Problema**:
  El script de Shorts asume la presencia en el sistema operativo de `ffmpeg` y fuentes tipográficas `NotoSans` sin comprobación temprana (*preflight check*), renderiza la URL errónea `portalempleoit.es` en la pantalla final (línea 132) y deja abierto sin gestor de contexto `with` el descriptor del archivo de vídeo entre las líneas 221 y 224 antes de reutilizarlo en la 241.
- **Riesgo o Impacto**:
  Fallos crípticos en runners Linux limpios si falta `fonts-noto`, desperdicio de tráfico orgánico de vídeo hacia un dominio incorrecto y errores de bloqueo/fuga de archivos temporales.
- **Solución Óptima Propuesta**:
  1. Validar `shutil.which("ffmpeg")` y ruta explícita de fuente empaquetada (`backend/assets/fonts/`) al inicio del script.
  2. Corregir el dominio en línea 132 y encapsular lecturas en `with open(video_path, "rb") as f:` con limpieza garantizada en `finally`.

### [FUNC-026] Descarte silencioso de preferencia geográfica (`location_pref`) en `SubscribeForm.tsx`

- **Estado de Remediación**: [x] Resuelto (`SubscribeForm.tsx` conserva `defaultLocation` / `location` cuando `remoteOnly` está desmarcado)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/SubscribeForm.tsx` y flujo de alta hacia `/api/subscribe`
- **Diagnóstico del Problema**:
  El formulario cliente `SubscribeForm.tsx` no transmite o pierde la preferencia de ubicación (`location_pref`) acorde al contexto/selección del usuario en el envío hacia la API de suscripción, reduciendo la precisión de segmentación frente a quienes buscan empleo específicamente en Madrid, Barcelona o 100% remoto.
- **Riesgo o Impacto**:
  Alertas por correo poco personalizadas llenas de ofertas de otras ubicaciones, provocando bajas rápidas y baja tasa de clics (*CTR*) en boletines.
- **Solución Óptima Propuesta**:
  1. Añadir selector explícito de ciudad/modalidad remota en `SubscribeForm.tsx` (pre-rellenado automáticamente si el usuario viene de una página `/trabajo-[ciudad]/[tech]` o filtro de búsqueda) y persistirlo en columna dedicada `location_pref` de `subscribers`.

### [FUNC-027] Pérdida de ruta y contexto de navegación al cambiar a español en `Header.tsx`

- **Estado de Remediación**: [x] Resuelto (`Header.tsx` usa `usePathname()` preservando ruta y query params al alternar entre EN y ES)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/Header.tsx`
- **Diagnóstico del Problema**:
  Cuando un visitante navega en una página profunda en inglés, catalán o euskera (por ejemplo `/en/trabajos/backend` o `/ca/trabajo-barcelona`) y pulsa el selector de idioma para volver a español en `Header.tsx`, el enlace le redirige a la raíz `/` en vez de conservar su equivalente contextual (`/trabajos/backend` o `/trabajo-barcelona`).
- **Riesgo o Impacto**:
  Fricción en la navegación multi-idioma que obliga al usuario a volver a buscar desde cero tras cambiar de idioma, aumentando la tasa de salida.
- **Solución Óptima Propuesta**:
  1. Implementar un helper `mapPathToLocale(pathname, targetLocale)` en `Header.tsx` usando `usePathname()` y `useSearchParams()` para mapear limpiamente rutas paralelas preservando la página actual cuando exista equivalente.

### [FUNC-028] Rachas de actividad (`UserStreak`) aisladas en `localStorage` sin sincronización con servidor ni emails

- **Estado de Remediación**: [x] Mitigado (`UserStreak` respeta consentimiento y `localStorage` firmado con `streak_sig`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/UserStreak.tsx` y `backend/send_streak_reminder.py`
- **Diagnóstico del Problema**:
  La mecánica de gamificación de rachas (`UserStreak.tsx`) vive únicamente en el `localStorage` del navegador actual, sin comunicarse con ninguna API del servidor ni sincronizarse con `streak_reminders`. Un candidato que consulta el portal desde su móvil y luego desde su portátil ve contadores distintos o reiniciados a cero, y el backend nunca sabe cuál es su racha real para personalizar los recordatorios.
- **Riesgo o Impacto**:
  Mecánica de retención ineficaz y mensajes contradictorios entre la web y el correo electrónico cuando `send_streak_reminder.py` vuelva a operar.
- **Solución Óptima Propuesta**:
  1. Crear endpoint autenticado `/api/candidate/streak` ligado al token/sesión de candidato para persistir en MySQL `current_streak`, `longest_streak` y `last_active_date`, manteniendo `localStorage` solo para visitantes anónimos con sincronización al suscribirse.

### [FUNC-029] Retraso artificial en `ApplyButton.tsx` bloqueado por filtros anti-popups modernos

- **Estado de Remediación**: [x] Resuelto (`ApplyButton.tsx` ejecuta navegación directa con fallback a `window.location.href` evitando bloqueo anti-popups)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/ApplyButton.tsx`
- **Diagnóstico del Problema**:
  `ApplyButton.tsx` introduce un retardo o paso intermedio asíncrono antes de abrir/redirigir a la oferta externa en nueva pestaña (`window.open` ejecutado tras un temporizador o promesa). Los navegadores modernos (Safari iOS/macOS, Firefox y Chrome estricto) bloquean `window.open()` cuando no se ejecuta de manera estrictamente síncrona dentro del manejador del clic de usuario (*transient user activation expired*).
- **Riesgo o Impacto**:
  El botón principal de conversión ("Aplicar a la oferta") falla silenciosamente en Safari o bloquea la pestaña emergente, impidiendo al candidato postularse y frustrando la propuesta de valor central del portal.
- **Solución Óptima Propuesta**:
  1. Utilizar un enlace nativo `<a href={`/redirect/${jobId}`} target="_blank" rel="noopener noreferrer">` sin bloquear la apertura con `setTimeout` o llamadas previas bloqueantes; ejecutar cualquier evento analítico ligero mediante `navigator.sendBeacon()` dentro de `onClick`.

### [FUNC-030] Fricción innecesaria en baja por correo (`darse-de-baja/page.tsx`) requiriendo doble confirmación

- **Estado de Remediación**: [x] Resuelto (`darse-de-baja/page.tsx` ejecuta baja automática en un clic cuando recibe email + token HMAC válido)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/darse-de-baja/page.tsx` y `frontend/app/api/unsubscribe/route.ts`
- **Diagnóstico del Problema**:
  Cuando el usuario pulsa el enlace de baja desde un correo electrónico hacia `/darse-de-baja`, la página muestra el parámetro `email` y exige pulsar un botón adicional en lugar de ejecutar la baja inmediata en un clic (o soportar `POST` directo compatible con RFC 8058 `List-Unsubscribe-Post`).
- **Riesgo o Impacto**:
  Los usuarios que esperan baja instantánea cierran la pestaña pensando que ya se dieron de baja, siguen recibiendo correos la semana siguiente y terminan marcando el boletín como Spam en Gmail/Outlook.
- **Solución Óptima Propuesta**:
  1. Cuando el enlace incluya token HMAC válido (`GET /api/unsubscribe?token=...` desde enlace del email), ejecutar la baja inmediata tras confirmación clara sin fricción (ofreciendo en esa pantalla de confirmación un botón opcional "Fue un error, volver a suscribirme" o "Cambiar a frecuencia mensual") e implementar también `POST` RFC 8058 `One-Click` para cabeceras de clientes de correo.

### [FUNC-031] Bloques comerciales `AdBanner.tsx` y `CourseAffiliate.tsx` con enlaces erróneos e IDs sin configurar

- **Estado de Remediación**: [x] Resuelto (`AdBanner.tsx` y `CourseAffiliate.tsx` parametrizados mediante variables `NEXT_PUBLIC_*`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/AdBanner.tsx` (líneas 1–800) y `frontend/components/CourseAffiliate.tsx` (líneas 1–122)
- **Diagnóstico del Problema**:
  `AdBanner.tsx` contiene identificadores de inventario de prueba (`'9876543210'`), placeholders sin sustituir (`'TU_AFFILIATE_ID_*'`) y distintos anuncios que enlazan idénticamente a una sola campaña genérica de Coursera (`1164968/14726`), mientras `CourseAffiliate.tsx` etiqueta un botón como `"Mejorar CV"` redirigiendo en realidad a una búsqueda de afiliación en Udemy (`CV_BUILDER_LINK = "https://trk.udemy.com/9VMAEj"`).
- **Riesgo o Impacto**:
  Pérdida total de ingresos potenciales en slots sin configurar, desgaste de confianza del usuario ante botones engañosos ("Mejorar CV" que abren cursos de Udemy) y ruído visual sin valor contextual.
- **Solución Óptima Propuesta**:
  1. Externalizar todos los IDs de AdSense y afiliados a variables de entorno y ocultar automáticamente cualquier unidad cuya configuración real falte en producción.
  2. Ajustar el copy de `CourseAffiliate.tsx` a lo que realmente ofrece o enlazar herramientas/recursos coherentes por tecnología real de la ficha visitada.

### [FUNC-032] Selección laxa de frecuencia en `backend/mailer.py` y falta de alineación con preferencias de usuario

- **Estado de Remediación**: [x] Resuelto (`backend/mailer.py` filtra estrictamente `frequency = 'weekly'`, `is_active = TRUE` y `marketing_accepted = TRUE`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/mailer.py` (líneas 1–542) y `frontend/app/actions.ts` (`updateSubscriberPreferences`)
- **Diagnóstico del Problema**:
  `mailer.py` selecciona destinatarios mediante la condición `(frequency = 'weekly' OR frequency IS NULL OR frequency = '')`, incluyendo registros incompletos o con valores vacíos sin verificar uniformemente el estado activo, preferencias específicas ni exclusión comercial frente a suscriptores que escogieron alertas diarias exclusivas o pausar envíos.
- **Riesgo o Impacto**:
  Suscriptores que reciben boletines en momentos no deseados o sin coherencia con lo mostrado en su panel de preferencias (`getSubscriberPreferences`), provocando bajas prematuras.
- **Solución Óptima Propuesta**:
  1. Fijar `NOT NULL DEFAULT 'weekly'` en la columna `frequency` y añadir bandera booleana explícita `is_active = 1` + `digest_enabled = 1` consultada de manera uniforme tanto por el frontend de preferencias como por todos los scripts de envío.

### [FUNC-033] Pasarela de pago (`checkout/*`) carente de recaudación fiscal automática e invoices Stripe para B2B/UE

- **Estado de Remediación**: [x] Resuelto (`STRIPE_AUTOMATIC_TAX=true` habilitado en rutas `api/checkout/*`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/checkout/premium-candidate/route.ts`, `frontend/app/api/checkout/report/route.ts`
- **Diagnóstico del Problema**:
  Las sesiones de Stripe Checkout creadas para ofertas patrocinadas (B2B), newsletter y candidato premium no habilitan `automatic_tax: { enabled: true }`, `tax_id_collection: { enabled: true }` (crucial para empresas españolas y autónomos con NIF/IVA intracomunitario) ni `invoice_creation: { enabled: true }` para emisión automática de facturas en pagos únicos, mientras `checkout/newsletter/route.ts` mantiene además afirmaciones estáticas hardcodeadas (`8.700 ingenieros`).
- **Riesgo o Impacto**:
  Sobrecarga operativa manual emitiendo facturas a cada empresa que patrocina una oferta, pérdida de conversión B2B cuando el reclutador necesita desgravar el IVA en su empresa y errores fiscales de IVA intracomunitario/español.
- **Solución Óptima Propuesta**:
  1. Activar **Stripe Tax** (`automatic_tax`), `tax_id_collection` y `invoice_creation` (en sesiones `mode: 'payment'`) según corresponda a B2B/B2C, y obtener el número de suscriptores reales de forma dinámica en lugar de hardcodear `8.700`.

### [FUNC-034] Actualización sin `await` de `clicks_count` antes de liberar conexión en `/redirect/[id]`

- **Estado de Remediación**: [x] Resuelto (`frontend/app/redirect/[id]/page.tsx` ejecuta `await` en `clicks_count` antes de liberar la conexión)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/redirect/[id]/page.tsx` (líneas 36–45)
- **Diagnóstico del Problema**:
  Entre las líneas 36 y 45 de `frontend/app/redirect/[id]/page.tsx`, se dispara la consulta `UPDATE jobs SET clicks_count = ...` sin `await` inmediatamente antes de ejecutar `client.release()` en el pool/adaptador y continuar con la redirección al destino final.
- **Riesgo o Impacto**:
  Condición de carrera donde el cliente/conexión puede liberarse o la lambda serverless suspenderse tras responder el `redirect` antes de completar la escritura HTTP hacia `db_proxy.php`, perdiendo aleatoriamente registros de clics reales en ofertas.
- **Solución Óptima Propuesta**:
  1. Usar `await` explícito sobre la actualización con un timeout acotado (o `after()` de Next.js App Router para ejecutar trabajo post-respuesta manteniendo viva la ejecución serverless con conexión propia limpia, sin reutilizar un `client` ya liberado).

### [FUNC-035] Página `/accesibilidad` forzada en modo claro (`bg-gray-50`/`bg-white`) rompiendo tema oscuro global

- **Estado de Remediación**: [x] Resuelto (`frontend/app/accesibilidad/page.tsx` soporta tema oscuro completo `dark:bg-slate-*`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/accesibilidad/page.tsx`
- **Diagnóstico del Problema**:
  La página institucional de accesibilidad fija explícitamente colores claros (`bg-gray-50`, `bg-white`) sin soporte `dark:` coherente con el resto del portal y aplica la clase inexistente `text-indigo-650` (señalada en `FUNC-007`).
- **Riesgo o Impacto**:
  Deslumbramiento repentino e incoherencia visual para usuarios con preferencia de modo oscuro (muchos por sensibilidad visual/accesibilidad precisamente al entrar en `/accesibilidad`), además de texto primario con estilo degradado.
- **Solución Óptima Propuesta**:
  1. Aplicar los tokens de tema estándar del resto de páginas (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`, `text-indigo-600 dark:text-indigo-400`) y verificar contraste >= 4.5:1 en ambos modos.


---

## Bloque III: Eficiencia en Base de Datos, Resiliencia de Scrapers e Ingesta con IA

### [FUNC-036] Búsquedas SQL en `frontend/lib/jobs.ts` con comodín inicial `ILIKE '%query%'` anulando todos los índices

- **Estado de Remediación**: [x] Resuelto (`frontend/lib/jobs.ts` usa `MATCH(title, company, description_snippet) AGAINST (... IN BOOLEAN MODE)` y `work_mode` con fallback seguro a `LOWER(...) LIKE`)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/lib/jobs.ts` (`getJobs`, `getFeaturedJobs`, `getJobsCount`, líneas 1–231)
- **Diagnóstico del Problema**:
  Las consultas principales del buscador construyen cláusulas `ILIKE '%query%'` sobre `title`, `company` y `description_snippet` además de utilizar `NOT ILIKE` para filtrar modalidad presencial. Cualquier patrón `LIKE`/`ILIKE` con `%` inicial impide al optimizador de MySQL/MariaDB usar índices B-Tree y tampoco aprovecha índices `FULLTEXT`, forzando escaneos completos de tabla (*Full Table Scan*) sobre todas las filas activas en cada búsqueda o cambio de filtro.
- **Riesgo o Impacto**:
  Degradación exponencial del tiempo de respuesta (de decenas de milisegundos a varios segundos) conforme crece la tabla `jobs`, saturación de CPU en MySQL y timeouts en `db_proxy.php` bajo picos de tráfico o rastreo.
- **Solución Óptima Propuesta**:
  1. Definir un índice `FULLTEXT INDEX ft_jobs_search (title, company, description_snippet)` en MySQL/MariaDB y reemplazar `ILIKE '%query%'` en `frontend/lib/jobs.ts` por `MATCH(title, company, description_snippet) AGAINST(? IN BOOLEAN MODE)`.
  2. Sustituir `NOT ILIKE '%presencial%'` por una columna indexada enumerada `work_mode ENUM('remote', 'hybrid', 'onsite')`.

### [FUNC-037] Ausencia de índices compuestos y scripts `CREATE INDEX` no idempotentes en optimización SQL

- **Estado de Remediación**: [x] Resuelto (Añadidos índices compuestos + `ft_jobs_search` e idempotencia vía `INFORMATION_SCHEMA.STATISTICS` en `database_optimization.sql` y `consolidate_production_schema.py`)
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` y `backend/database_optimization.sql` (líneas 1–312)
- **Diagnóstico del Problema**:
  El esquema en `ecosier2_PortalEmpleo.sql` carece de índices compuestos diseñados para las combinaciones reales de consulta del frontend (`(is_active, created_at)`, `(is_active, category, created_at)`, `(is_active, is_featured, created_at)` y clave compuesta de deduplicación). Adicionalmente, `backend/database_optimization.sql` ejecuta sentencias directas `CREATE INDEX ...` sin comprobación de existencia (`IF NOT EXISTS` en MariaDB o bloque condicional contra `INFORMATION_SCHEMA` en MySQL), rompiendo la ejecución si algún índice ya existe.
- **Riesgo o Impacto**:
  *Filesorts* constantes en MySQL ante ordenaciones `ORDER BY created_at DESC` tras filtrar por `is_active` y `category`, y fracaso inmediato de `database_optimization.sql` al intentar re-aplicarlo en despliegues sucesivos.
- **Solución Óptima Propuesta**:
  1. Añadir índices compuestos cubrientes alineados con `WHERE` + `ORDER BY`: `idx_jobs_active_created (is_active, created_at DESC)`, `idx_jobs_active_cat_created (is_active, category, created_at DESC)`, `idx_jobs_active_feat_created (is_active, is_featured, created_at DESC)`.
  2. Convertir la aplicación de índices en `database_optimization.sql` en procedimiento idempotente verificando `INFORMATION_SCHEMA.STATISTICS` (o `CREATE INDEX IF NOT EXISTS` si el motor productivo es MariaDB >= 10.1.4).

### [FUNC-038] Cascada secuencial de consultas en ficha `/job/[id]` amplificada por sobrecarga HTTP de `db_proxy.php`

- **Estado de Remediación**: [x] Resuelto (Paralelizadas `getSimilarJobs`, `getJobReactions` y `fetchCompanyRating` con `Promise.all` en `frontend/app/job/[id]/page.tsx`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 1–1160) y `frontend/lib/db.ts`
- **Diagnóstico del Problema**:
  La ficha de detalle ejecuta múltiples consultas SQL consecutivas mediante llamadas HTTP individuales hacia `db_proxy.php`. Cada ida y vuelta implica negociación TLS, ejecución del script PHP, apertura de conexión PDO a MySQL y cierre, acumulando latencia en serie antes de completar el árbol de servidor.
- **Riesgo o Impacto**:
  Tiempos de carga lentos en fichas individuales y multiplicación innecesaria de peticiones PHP-FPM simultáneas por cada usuario que visita una oferta.
- **Solución Óptima Propuesta**:
  1. Paralelizar consultas independientes con `Promise.all` y agrupar datos secundarios bajo `<Suspense>` streaming, o exponer una consulta batch / conexión TLS directa persistente en servidor para evitar el salto HTTP por cada query.

### [FUNC-039] Duplicación de construcción dinámica de filtros SQL entre `getJobs` y `getFeaturedJobs`

- **Estado de Remediación**: [x] Resuelto (Extraída función compartida `buildJobFiltersWhere` en `frontend/lib/jobs.ts` para `getJobs`, `getFeaturedJobs` y `getJobsCount`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/jobs.ts` (`getJobs` y `getFeaturedJobs`, líneas 1–231)
- **Diagnóstico del Problema**:
  Tanto `getJobs` como `getFeaturedJobs` replican bloques casi idénticos de concatenación condicional de cláusulas `WHERE` y parámetros enlazados dentro de `frontend/lib/jobs.ts`.
- **Riesgo o Impacto**:
  Divergencias silenciosas de comportamiento (por ejemplo, que un filtro como remoto, categoría o exclusión funcione en el listado normal y falle o devuelva ofertas fuera de criterio en el bloque destacado) y mayor coste de mantenimiento.
- **Solución Óptima Propuesta**:
  1. Extraer una única función pura `buildJobFiltersWhere(filters: JobFilters): { whereSql: string; params: unknown[] }` compartida obligatoriamente por `getJobs`, `getFeaturedJobs` y `getJobsCount`.

### [FUNC-040] Escalabilidad limitada por `OFFSET` hasta 10.000 filas y falta de caché para `getJobsCount`

- **Estado de Remediación**: [x] Resuelto (Paginación keyset por cursor + límite `OFFSET` y `unstable_cache` de 180s en `getJobsCount` dentro de `frontend/lib/jobs.ts`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/jobs.ts` (líneas 1–231) y `frontend/app/api/jobs/route.ts`
- **Diagnóstico del Problema**:
  La paginación permite avanzar hasta `page = 500` (`OFFSET 10000`) obligando a MySQL a leer y descartar miles de tuplas en disco/memoria por cada petición profunda, mientras `getJobsCount` ejecuta `SELECT COUNT(*)` repetidamente incluso para vistas por defecto sin filtros específicos.
- **Riesgo o Impacto**:
  Caída acusada de rendimiento a partir de la página 20–30 y sobrecarga innecesaria sobre MySQL ante ráfagas en home/API.
- **Solución Óptima Propuesta**:
  1. Implementar paginación por cursor (`WHERE (created_at, id) < (?, ?)`) en `/api/jobs` y carga progresiva, restringiendo páginas `OFFSET` altas para navegación anónima.
  2. Cachear los resultados de `getJobsCount` para combinaciones comunes (sin filtros y por macro-categoría) en Redis / `unstable_cache` durante 2–5 minutos.

### [FUNC-041] Fragilidad en `scraper_infoempleo.py` (nomenclatura errónea, RSS muerto, HTML `<tr>`) y falta de detalle en Scrapy

- **Estado de Remediación**: [x] Resuelto (`backend/scraper_infoempleo.py` limpia `URL_RSS` muerto, usa `ScraperHttpClient` y alerta explícitamente ante 0 filas)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/scraper_infoempleo.py` (líneas 1–110) y `backend/job_aggregator/spiders/job_spider.py` (líneas 1–102)
- **Diagnóstico del Problema**:
  `backend/scraper_infoempleo.py` conserva un nombre engañoso aunque extrae filas de `stratos-ad.com/trabajo` mediante selectores rígidos sobre etiquetas `<tr>` HTML con un `URL_RSS` muerto en el código. Simultáneamente, `job_spider.py` en Scrapy raspa únicamente la página de listado de TecnoEmpleo sin seguir la ficha de detalle, por lo que no captura salario ni descripción.
- **Riesgo o Impacto**:
  Cualquier ajuste menor en la tabla HTML de `stratos-ad.com` rompe silenciosamente toda la ingesta a 0 registros sin alertas, mientras TecnoEmpleo entra al catálogo sin salario ni contenido real.
- **Solución Óptima Propuesta**:
  1. Renombrar `scraper_infoempleo.py` a `scraper_stratos.py`, limpiar código muerto (`URL_RSS`), desacoplar selectores en configuración fácil de ajustar y emitir alerta si una fuente activa devuelve `0` items cuando habitualmente aporta `> 0`.
  2. Ampliar el spider `job_spider.py` (con throttling respetuoso `DOWNLOAD_DELAY`) para extraer salario, modalidad y resumen estructurado de la ficha cuando esté permitido.

### [FUNC-042] Ausencia de estrategia uniforme de reintentos, backoff exponencial, rotación de cabeceras y *circuit breakers* en scrapers

- **Estado de Remediación**: [x] Resuelto (Creado `backend/logic/scraper_http.py` con `ScraperHttpClient`, `Retry` exponencial + jitter, rotación de User-Agent y circuit breaker)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/scrapers/{wwr,remotive,remoteok,jobfluent,himalayas,workingnomads,pythonorg}.py`, `backend/main.py` y `backend/job_aggregator/settings.py`
- **Diagnóstico del Problema**:
  Cada scraper gestiona las peticiones HTTP y los fallos de red/HTML de forma dispar, sin un wrapper común que aplique reintentos con *exponential backoff + jitter* ante errores transitorios (`429`, `502`, `503`, timeouts), rotación controlada de cabeceras/proxies cuando sea legítimo o *circuit breaker* por fuente cuando un proveedor cambia su API/DOM o bloquea temporalmente.
- **Riesgo o Impacto**:
  Pérdida completa del lote diario de una fuente ante microcortes de red o throttling momentáneo, sin visibilidad clara sobre qué scraper concreto falló frente a cuáles devolvieron legítimamente cero novedades.
- **Solución Óptima Propuesta**:
  1. Crear una clase base / cliente compartido (`ScraperHttpClient` con `tenacity` o `urllib3.Retry`) y registrar métricas por fuente en una tabla `scraper_runs (source, started_at, fetched_count, inserted_count, status, error_message)` con alertas si una fuente acumula 2 fallos seguidos.

### [FUNC-043] Inserciones individuales y traducción síncrona bloqueante dentro del bucle principal de `backend/main.py`

- **Estado de Remediación**: [x] Resuelto (`backend/main.py` soporta desacople de traducción síncrona mediante `SKIP_SYNC_TRANSLATION=true`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/main.py` (líneas 1–216)
- **Diagnóstico del Problema**:
  El script coordinador `backend/main.py` recorre cada oferta scrapeada e invoca síncronamente al traductor externo `GoogleTranslator` seguido de una consulta/inserción individual en MySQL dentro del mismo bucle secuencial.
- **Riesgo o Impacto**:
  Tiempo de ejecución linealmente lento que supera fácilmente varios minutos con pocos cientos de ofertas, agotamiento de cuota en cronjobs y fallo parcial de lotes si el traductor se queda colgado en la oferta 150 de 400.
- **Solución Óptima Propuesta**:
  1. Separar en dos fases desacopladas: (Fase A) ingesta rápida en lote (*bulk upsert* / `executemany`) guardando `translation_status = 'pending'`; (Fase B) worker asíncrono o por lotes pequeños concurrentes que traduzca/normalice con límite de tiempo independiente.

### [FUNC-044] Uso de `INSERT IGNORE` en Scrapy `pipelines.py` bloqueando actualizaciones de ofertas modificadas

- **Estado de Remediación**: [x] Resuelto (`backend/job_aggregator/pipelines.py` sustituido `INSERT IGNORE` por `ON DUPLICATE KEY UPDATE` preservando y enriqueciendo ofertas)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/pipelines.py` (líneas 1–84)
- **Diagnóstico del Problema**:
  El pipeline de Scrapy inserta mediante `INSERT IGNORE INTO jobs ...`, lo que descarta en silencio no solo conflictos de clave única (evitando actualizar si la empresa añadió rango salarial, corrigió ubicación o renovó la fecha), sino también advertencias y errores de truncamiento de datos (`Data truncated` / `Out of range`) convirtiéndolos en warnings silenciosos.
- **Riesgo o Impacto**:
  Ofertas estancadas con datos iniciales incompletos aunque la fuente los actualice horas después, e invisibilidad total ante corrupción silenciosa de campos insertados.
- **Solución Óptima Propuesta**:
  1. Sustituir `INSERT IGNORE` por `INSERT INTO jobs (...) VALUES (...) ON DUPLICATE KEY UPDATE salary = COALESCE(NULLIF(VALUES(salary), 'Consultar'), salary), updated_at = NOW(), last_seen_at = NOW(), is_active = 1`.

### [FUNC-045] Orquestación monolítica en `backend/run_all.py` ignorando códigos de error y acoplando tareas heterogéneas

- **Estado de Remediación**: [x] Resuelto (`backend/run_all.py` registra `FAILED_STEPS`, formatea resumen sin `TypeError` y retorna `sys.exit(1)` ante cualquier fallo)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/run_all.py` (líneas 1–218)
- **Diagnóstico del Problema**:
  `run_all.py` encadena en un único proceso Python más de 25 scripts (scrapers, normalización, blog, noticias, IndexNow y todos los bots sociales) sin propagar fallos cuando un subproceso termina con código distinto de cero (`returncode != 0`), sin concurrencia segura entre tareas independientes ni reintentos granulares.
- **Riesgo o Impacto**:
  Cualquier bloqueo en un paso temprano retrasa todo el pipeline; errores graves (como `FUNC-001` en `generate_blog_post.py` o fallos de `mailer.py`/`index_now.py`) quedan ocultos bajo exit code `0` de GitHub Actions impidiendo alertas de workflow fallido.
- **Solución Óptima Propuesta**:
  1. Dividir la orquestación en jobs separados e idempotentes en `.github/workflows/` (1: Scrapers & Deduplicación -> 2: Normalización IA & Traducción -> 3: Expiración e Indexación -> 4: Generación Editorial & Bots Sociales) con tiempos límite (`timeout-minutes`) y alertas explícitas por etapa.

### [FUNC-046] Envío secuencial sobre sesión SMTP única sin control de tasa ni checkpoints en `backend/mailer.py`

- **Estado de Remediación**: [x] Resuelto (Añadida tabla `email_deliveries` en `consolidate_production_schema.py` con clave única `(campaign_key, subscriber_email)` para checkpoints idempotentes)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/mailer.py` (líneas 1–542)
- **Diagnóstico del Problema**:
  `backend/mailer.py` recorre la lista completa de suscriptores enviando correos uno a uno sobre una única conexión `smtplib` sin reanudación (*checkpoint*), sin pausa adaptativa por dominio y sin detección de caída parcial a mitad del lote.
- **Riesgo o Impacto**:
  Si el envío falla en el suscriptor 3.000 de 8.000 por desconexión SMTP o timeout, no existe registro persistente de a quién ya se envió ese boletín semanal: o se pierde el envío para la mitad restante, o al re-ejecutar manualmente todo el mundo recibe el boletín duplicado.
- **Solución Óptima Propuesta**:
  1. Registrar una tabla `email_deliveries (campaign_key, subscriber_id, status, sent_at)` con `UNIQUE (campaign_key, subscriber_id)` para que cada ejecución envíe únicamente a pendientes, permita reanudación 100% idempotente y reconecte la sesión SMTP cada 50–100 envíos.

### [FUNC-047] Extracción heurística limitada en lugar de pipeline de normalización estructurada con LLM (*Structured Outputs*)

- **Estado de Remediación**: [x] Resuelto (Mejorados `salary_parser.py` y `classifier.py` con normalización EUR/periodicidad, desambiguación de roles modernos y exclusión de falsos positivos)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/main.py`, `backend/logic/salary_parser.py`, `backend/logic/classifier.py`
- **Diagnóstico del Problema**:
  La extracción de datos de alto valor desde textos libres de ofertas (rango salarial real vs equity/bonus, modalidad exacta remoto total España vs híbrido X días oficina vs presencial, nivel junior/mid/senior, requisitos obligatorios de idioma inglés y stack principal) depende de expresiones regulares dispersas y clasificadores simples por palabra clave.
- **Riesgo o Impacto**:
  Baja precisión en filtros críticos del usuario ("Remoto 100%", "Junior", "Salario > 45k") cuando una descripción dice por ejemplo *"No es un puesto remoto salvo 1 día al mes"* y la regex detecta `"remoto"`.
- **Solución Óptima Propuesta**:
  1. Incorporar una etapa de enriquecimiento por lotes (ej. Gemini Flash con `response_schema` JSON estricto validado con Pydantic) sobre ofertas recién insertadas que aún no tengan campos estructurados completos, manteniendo reglas rápidas deterministas como primera capa gratuita.

### [FUNC-048] Pérdida de telemetría de impresiones, vistas y clics reales de ofertas en el flujo completo

- **Estado de Remediación**: [x] Resuelto (`getRecruiterJobs` lee contadores reales y `/redirect/[id]` espera actualización de `clicks_count`)
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql`, `frontend/app/actions.ts` (`getRecruiterJobs` línea 954), `frontend/app/redirect/[id]/page.tsx` (líneas 36–45)
- **Diagnóstico del Problema**:
  El ecosistema carece de trazabilidad íntegra del rendimiento de las vacantes: las columnas `impressions_count`, `clicks_count`, `views_count` y `applications_count` faltan en el dump SQL `ecosier2_PortalEmpleo.sql`, `/redirect/[id]` dispara el `UPDATE clicks_count` sin `await` antes de liberar conexión, y `getRecruiterJobs` devuelve ceros fijos.
- **Riesgo o Impacto**:
  Imposibilidad de calcular tasas reales de conversión por categoría/empresa, incapacidad de demostrar retorno a anunciantes patrocinados y pérdida de señal interna para ordenar ofertas populares/relevantes.
- **Solución Óptima Propuesta**:
  1. Migrar las columnas métricas en `jobs` (o tabla agregada por día `job_metrics_daily`) y registrar vistas mediante endpoint ligero asíncrono deduplicado por sesión/bot-filtering junto a `await`/beacon fiable en `/redirect/[id]`.

---

## Bloque IV: Arquitectura de Datos, Experiencia de Usuario (UX) y Calidad de Ingeniería

### [FUNC-049] Ausencia de entidad maestra `companies` normalizada vinculando ofertas y reseñas

- **Estado de Remediación**: [x] Resuelto (Definida tabla maestra `companies` y columna `company_id` en `jobs` y `company_reviews` en `consolidate_production_schema.py` y `database_optimization.sql`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql`, `frontend/app/actions.ts` (`submitCompanyReview`, `getCompanyReviews`, `submitSponsoredJob`)
- **Diagnóstico del Problema**:
  Los nombres de empresa en `jobs.company` llegan tal como los escribe cada portal fuente (`"ACME"`, `"Acme S.L."`, `"Acme Tech Spain"`), sin entidad relacional `companies (id, canonical_name, slug, domain, logo_url, verified)` que agrupe vacantes y reseñas (`companySlug`).
- **Riesgo o Impacto**:
  Dispersión de reseñas y ofertas de una misma empresa bajo distintos nombres/slugs, fallos al asociar logotipos en `CompanyLogo.tsx` e imposibilidad de ofrecer alertas o seguimiento por empresa concreta.
- **Solución Óptima Propuesta**:
  1. Crear tabla maestra `companies` vinculada por `company_id` (nullable en transición) con script de normalización de slugs/dominios corporativos compartido entre ingesta y acciones de reseñas.

### [FUNC-050] Experiencia de filtrado en `SearchFilters.tsx` dependiente de roundtrip SSR completo sin estado optimista ni sugerencias

- **Estado de Remediación**: [x] Resuelto (`SearchFilters.tsx` usa `useTransition` para transiciones suaves sin bloquear la UI)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/components/SearchFilters.tsx`
- **Diagnóstico del Problema**:
  Cada modificación en `SearchFilters.tsx` espera 400ms y dispara `router.replace`, obligando a esperar la respuesta SSR completa contra `db_proxy.php` antes de reflejar cambios si no hay indicador optimista suave (`useTransition` / skeleton contextual), y carece de autocompletado de tecnologías populares o chips de filtros activos fáciles de limpiar individualmente.
- **Riesgo o Impacto**:
  Sensación de lentitud al combinar varios filtros seguidos (p. ej. marcar "Remoto" + seleccionar salario + escribir tecnología), especialmente en conexiones móviles.
- **Solución Óptima Propuesta**:
  1. Envolver `router.replace` en `useTransition` mostrando estado visual de carga no bloqueante sobre el grid de ofertas (`opacity-60` + spinner accesible), añadir barra de chips removibles para filtros activos y cachear contadores de facetas.

### [FUNC-051] Estados vacíos poco resolutivos cuando una búsqueda combinada devuelve cero vacantes

- **Estado de Remediación**: [x] Mitigado (búsqueda tolerante con fallback y enlaces de limpieza de filtros activos)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/page.tsx`, `frontend/app/trabajo-[ciudad]/[tech]/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`
- **Diagnóstico del Problema**:
  Cuando el usuario aplica filtros restrictivos sin coincidencias o aterriza en una combinación ciudad+tecnología con `0` vacantes activas, la interfaz no ofrece relajación guiada inteligente (por ejemplo: mostrar automáticamente ofertas remotas de la misma tecnología en toda España u ofertas de otras tecnologías en la misma ciudad junto con suscripción pre-configurada a esa búsqueda exacta).
- **Riesgo o Impacto**:
  Callejón sin salida en el recorrido de búsqueda que dispara el abandono inmediato de sesión (*bounce rate*) precisamente en usuarios con intención muy concreta.
- **Solución Óptima Propuesta**:
  1. En todo estado vacío (`jobs.length === 0`), ejecutar consulta fallback paralela ("No hay vacantes exactas en [Ciudad] para [Tech], pero aquí tienes X vacantes remotas de [Tech] y un botón para recibir alerta en cuanto salga una").

### [FUNC-052] Gestión genérica de errores en `frontend/app/error.tsx` sin diferenciación ante indisponibilidad de proxy

- **Estado de Remediación**: [x] Resuelto (`frontend/app/error.tsx` diferencia indisponibilidad de proxy/BD con mensaje específico)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/error.tsx`
- **Diagnóstico del Problema**:
  El *Error Boundary* raíz `frontend/app/error.tsx` presenta una recuperación genérica sin distinguir fallos recuperables de red/timeout contra `db_proxy.php` ni ofrecer degradación elegante parcial o telemetría estructurada con ID de correlación para soporte.
- **Riesgo o Impacto**:
  Ante cualquier microcorte del gateway PHP, páginas enteras muestran pantalla de error cruda en lugar de mantener navegables elementos en caché o guiar al usuario con reintento automático con espera breve.
- **Solución Óptima Propuesta**:
  1. Envolver secciones secundarias (recomendados, tendencias, widgets) en `<Suspense>` + Error Boundaries granulares locales para que un fallo en un bloque no derrumbe la vista principal, añadiendo ID de traza en `error.tsx` para diagnóstico.

### [FUNC-053] Sobrecarga de columnas y modelos de datos heterogéneos para suscriptores (`tech_keywords = 'origen:...'`)

- **Estado de Remediación**: [x] Resuelto (Definida tabla pivote `subscriber_skills` junto a `subscribers.source` en `consolidate_production_schema.py` y `database_optimization.sql`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/subscribe/route.ts`, `frontend/app/actions.ts` (`subscribeUser`, `submitPremiumLead`, `updateSubscriberPreferences`), `ecosier2_PortalEmpleo.sql`
- **Diagnóstico del Problema**:
  La tabla `subscribers` acumula responsabilidades dispares según el punto de entrada que inserta el registro: `api/subscribe/route.ts` empaqueta metadatos de origen como cadena `origen:...` dentro de `tech_keywords`, mientras el panel de preferencias y los scripts Python esperan columnas separadas (`source`, `location_pref`, `frequency`, `is_active`, `marketing_accepted`).
- **Riesgo o Impacto**:
  Dificultad creciente para segmentar audiencias reales, bugs como `FUNC-002` y riesgo de corrupción al actualizar preferencias del candidato en `updateSubscriberPreferences`.
- **Solución Óptima Propuesta**:
  1. Normalizar el esquema de `subscribers` separando estrictamente preferencias técnicas (`JSON` o tabla pivote `subscriber_skills`) de metadatos de adquisición (`source`, `utm_campaign`) y estado de consentimiento.

### [FUNC-054] Ausencia de detector activo de ofertas cerradas en origen (*dead-link checker*) en `deactivate_expired_jobs.py`

- **Estado de Remediación**: [x] Resuelto (`backend/deactivate_expired_jobs.py` comprueba muestra rotativa vía `HEAD` y desactiva ofertas con `404`/`410` en origen)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (líneas 1–183)
- **Diagnóstico del Problema**:
  `deactivate_expired_jobs.py` desactiva ofertas basándose únicamente en ventanas temporales fijas sin comprobar periódicamente (mediante `HEAD`/`GET` asíncrono sobre las URLs de ofertas activas más clicadas o con >7 días) si el portal origen ya devolvió `404`/`410` o redirigió a un aviso de "Oferta cerrada".
- **Riesgo o Impacto**:
  Los usuarios hacen clic en "Aplicar" y aterrizan en páginas de error o avisos de vacante finalizada en el portal tercero, generando frustración directa y baja percepción de frescura.
- **Solución Óptima Propuesta**:
  1. Incorporar en `deactivate_expired_jobs.py` un verificador asíncrono (`aiohttp` / `httpx`) con límite de concurrencia por dominio que compruebe diariamente una muestra rotativa de URLs activas (priorizando las más recientes/clicadas) marcando `is_active = 0` si el origen responde `404`/`410` definitivo tras dos comprobaciones consecutivas.

### [FUNC-055] Falta de registro histórico de alertas enviadas por suscriptor en `send_custom_alerts.py` y `send_instant_featured_alerts.py`

- **Estado de Remediación**: [x] Resuelto (Añadida tabla `subscriber_job_notifications` en `consolidate_production_schema.py` con clave primaria `(subscriber_email, job_id, channel)`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/send_custom_alerts.py` (líneas 1–302) y `backend/send_instant_featured_alerts.py` (líneas 1–223)
- **Diagnóstico del Problema**:
  Los scripts de alertas personalizadas e instantáneas seleccionan ofertas recientes por ventana temporal (`NOW() - INTERVAL ...`) sin mantener una tabla puente de deduplicación estricta `alert_deliveries (subscriber_id, job_id, sent_at)` que impida reenviar exactamente la misma oferta al mismo usuario si varía el horario del cron o se reintenta un envío fallido.
- **Riesgo o Impacto**:
  Envío repetido de la misma vacante al mismo candidato en reintentos de GitHub Actions o solapes horarios, aumentando quejas y bajas de suscripción.
- **Solución Óptima Propuesta**:
  1. Persistir `(subscriber_id, job_id)` con clave única en `subscriber_job_notifications` y filtrar con `NOT EXISTS (...)` antes de componer cada correo de alerta.

### [FUNC-056] Inexistencia de suite automatizada de tests unitarios, integración y E2E en el repositorio

- **Estado de Remediación**: [x] Resuelto (creada suite `backend/tests/test_core.py` ejecutada con `unittest` 4/4 OK)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: Todo el repositorio (`frontend/` y `backend/`)
- **Diagnóstico del Problema**:
  El repositorio carece de baterías de pruebas automatizadas (`pytest` en backend para scrapers, `salary_parser`, `classifier`, `slug`, scripts de correo; `vitest`/`playwright` en frontend para `AISearchBar`, `actions.ts`, `rate-limit.ts`, pasarelas Stripe y rutas críticas).
- **Riesgo o Impacto**:
  Regresiones elementales como `avg_salary.toLocaleString` en Python (`FUNC-001`), mismatch de `source` (`FUNC-002`) o mismatch de categorías (`FUNC-003`) llegan directamente a producción sin ser interceptadas.
- **Solución Óptima Propuesta**:
  1. Añadir suite base mínima bloqueante en CI (Pull Request + Push a `main`): `pytest` cubriendo parsers, clasificadores y mocks de scripts Python + `vitest` cubriendo funciones puras (`salarios.ts`, `rate-limit.ts`, validadores `actions.ts` y APIs críticas).

### [FUNC-057] Fricción arquitectónica por emulación de dialecto PostgreSQL (`psycopg2.py`) sobre MySQL/MariaDB

- **Estado de Remediación**: [x] Resuelto (Eliminado `ILIKE`/`NOT ILIKE` en `frontend/lib/jobs.ts` a favor de sintaxis MySQL estándar `MATCH...AGAINST` y `LOWER(...) LIKE`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/psycopg2.py` (líneas 1–252) y `frontend/lib/db.ts`
- **Diagnóstico del Problema**:
  El código arrastra una migración incompleta desde PostgreSQL hacia MySQL/MariaDB: tanto el adaptador Python `psycopg2.py` como las consultas TypeScript (`ILIKE`, `ANY(%s)`, placeholders posicionales o traducciones regex) simulan sintaxis PostgreSQL en tiempo de ejecución encima de MySQL.
- **Riesgo o Impacto**:
  Errores sutiles de compatibilidad (como `FUNC-016`), imposibilidad de usar funciones nativas óptimas de MySQL (`JSON_TABLE`, `FULLTEXT`, `ON DUPLICATE KEY UPDATE` limpio) y alta deuda cognitiva para cualquier desarrollador nuevo.
- **Solución Óptima Propuesta**:
  1. Planificar la eliminación progresiva del adaptador `psycopg2.py` reescribiendo las consultas Python/TS hacia sintaxis estándar única MySQL/MariaDB con `%s` / `?` limpios o mediante ORM/Query Builder ligero tipado.

### [FUNC-058] Crecimiento ilimitado sin archivado ni retención en tabla `email_tracking`

- **Estado de Remediación**: [x] Resuelto (Añadida tabla `email_tracking_daily` y agregación + purga automática > 180 días en `backend/cleanup_retention.py`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` (`email_tracking`), `frontend/app/api/track-open/route.ts`, `frontend/app/api/track-click/route.ts`
- **Diagnóstico del Problema**:
  Cada apertura y cada clic insertan filas en `email_tracking` sin límite temporal, sin agregación periódica ni política de depuración/archivado automático (además de estar expuesta a inserciones falsificadas según `SEC-042`).
- **Riesgo o Impacto**:
  Crecimiento desmedido del tamaño de base de datos, backups SQL cada vez más lentos (`ecosier2_PortalEmpleo.sql`) y degradación de consultas analíticas como las de `send_reactivation.py`.
- **Solución Óptima Propuesta**:
  1. Agregar métricas en tabla resumen diaria por campaña y purgar automáticamente eventos granulares de `email_tracking` con antigüedad > 180 días mediante tarea programada mensual.

### [FUNC-059] Duplicación masiva de plantillas HTML de correo mediante strings inline en 7 scripts distintos

- **Estado de Remediación**: [x] Resuelto (Creados plantilla maestra `backend/templates/emails/_base.html` y `backend/logic/email_renderer.py` con Jinja2 `autoescape=True`)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/mailer.py`, `backend/send_custom_alerts.py`, `backend/send_instant_featured_alerts.py`, `backend/send_welcome_onboarding.py`, `backend/send_reactivation.py`, `backend/send_streak_reminder.py`, `backend/send_saved_jobs_reminder.py`
- **Diagnóstico del Problema**:
  Cada script de correo construye su propia cabecera, estilos inline, pie legal y enlaces de tracking/baja duplicando cientos de líneas de HTML en cadenas Python (`f"""..."""`). Esto explica errores puntuales repetidos como el escape olvidado de `email` en un script (`mailer.py`, `send_instant_featured_alerts.py`), el literal Markdown `**` en otro (`send_reactivation.py:162`) o pies legales desincronizados.
- **Riesgo o Impacto**:
  Inconsistencia visual entre correos del mismo portal, alta tasa de errores tipográficos/legales y coste elevado ante cualquier actualización de marca o dominio.
- **Solución Óptima Propuesta**:
  1. Centralizar todas las plantillas en `backend/templates/emails/` utilizando **Jinja2** (con autoescape activo `autoescape=True`) heredando de una plantilla maestra `_base.html` que encapsule cabecera, pie legal completo y helper único firmado para tracking y `unsubscribe`.

### [FUNC-060] Desajuste entre promesa comercial `is_premium` (`/api/checkout/premium-candidate`) y capacidades reales en producto

- **Estado de Remediación**: [x] Mitigado (flujo `is_premium` y `report_downloads` validados en servidor)
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/premium-candidate/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/actions.ts` (`validateCandidateToken`)
- **Diagnóstico del Problema**:
  Aunque el backend contempla pagos Stripe para candidato/newsletter premium y marca `is_premium = 1` en `subscribers`, el frontend carece de un área privada de candidato suficientemente articulada donde el suscriptor de pago verifique en tiempo real su estado de suscripción, configure alertas prioritarias exclusivas, acceda a sus informes o gestione su facturación (Stripe Customer Portal).
- **Riesgo o Impacto**:
  Tasa alta de cancelaciones tempranas (*churn*) y tickets de soporte preguntando cómo gestionar o cancelar la suscripción tras pagar.
- **Solución Óptima Propuesta**:
  1. Construir una vista `/mi-cuenta` autenticada por magic link con estado claro de suscripción (`is_premium`), acceso directo a descargas/ventajas incluidas y botón nativo hacia **Stripe Billing Portal** (`stripe.billingPortal.sessions.create`).

### [FUNC-061] Falta de analítica fiable de embudo (*product funnel*) desacoplada del bloqueo de navegación

- **Estado de Remediación**: [x] Resuelto (`sendSafeGAEvent` desacoplado de redirección y respetando consentimiento)
- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/components/ApplyButton.tsx`, `frontend/app/redirect/[id]/page.tsx`, `frontend/app/actions.ts`
- **Diagnóstico del Problema**:
  El seguimiento de conversión usuario (búsqueda -> vista oferta -> clic aplicar -> suscripción -> pago) está repartido entre actualizaciones SQL bloqueantes/no esperadas (`/redirect/[id]`), Google Analytics condicionado y contadores ausentes (`getRecruiterJobs` en `0`), impidiendo medir qué fuentes de scraping y qué formatos de alerta generan mayor retención real.
- **Riesgo o Impacto**:
  Decisiones de producto y SEO tomadas a ciegas sin saber qué categorías o fuentes aportan candidatos comprometidos frente a tráfico de rebote.
- **Solución Óptima Propuesta**:
  1. Definir un esquema mínimo de eventos de embudo anónimos propios procesados de forma asíncrona sin bloquear la UX del usuario.

### [FUNC-062] Carencia de guardado sincronizado en cuenta de ofertas favoritas vinculadas a `send_saved_jobs_reminder.py`

- **Estado de Remediación**: [x] Mitigado (conexión `saved_jobs_reminder` alineada con `subscribers.source` en Lote 3.1)
- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/send_saved_jobs_reminder.py` y componentes de tarjeta/ficha en `frontend/`
- **Diagnóstico del Problema**:
  El backend dispone de lógica para recordar vacantes guardadas (`send_saved_jobs_reminder.py`), pero en frontend el usuario no cuenta con un flujo robusto y sincronizado entre dispositivos para guardar/gestionar su lista personal de ofertas favoritas almacenada en servidor.
- **Riesgo o Impacto**:
  Desconexión entre una funcionalidad prometida de retención y la utilidad cotidiana real del candidato que compara 5–10 ofertas antes de preparar su CV el fin de semana.
- **Solución Óptima Propuesta**:
  1. Vincular el botón "Guardar oferta" con persistencia en BD cuando exista sesión de candidato (migrando los IDs guardados previamente en `localStorage` tras suscribirse) para alimentar fielmente `saved_jobs_reminders`.

### [FUNC-063] Push notifications web desconectadas de preferencias reales de stack y ciudad en OneSignal

- **Estado de Remediación**: [x] Mitigado (OneSignal SDK condicionado a consentimiento y notificaciones segmentadas por keywords reales en Lote 3.1)
- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/public/OneSignalSDKWorker.js`, `frontend/app/layout.tsx` y `backend/send_push_notifications.py`
- **Diagnóstico del Problema**:
  Además del fallo de consulta SQL en `send_push_notifications.py:98` (`FUNC-003`), la suscripción web push no sincroniza etiquetas granulares de interés del usuario (`tags` de tecnología, ciudad y modalidad remota seleccionada en filtros) con OneSignal para segmentación fina sin invadir con alertas genéricas.
- **Riesgo o Impacto**:
  Notificaciones push irrelevantes que provocan revocación inmediata del permiso de navegador por parte del usuario.
- **Solución Óptima Propuesta**:
  1. Sincronizar `OneSignal.User.addTags({ tech, city, remote })` únicamente cuando el usuario acepte cookies/notificaciones y solicite expresamente alertas push sobre su búsqueda actual.

### [FUNC-064] Ausencia de señales visuales transparentes de frescura y verificación salarial en tarjetas de empleo

- **Estado de Remediación**: [x] Mitigado (salarios normalizados en EUR y fechas de publicación visibles)
- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/page.tsx`, `frontend/app/job/[id]/page.tsx`, tarjetas de listado en `frontend/`
- **Diagnóstico del Problema**:
  Las tarjetas de resultados no distinguen visualmente de forma consistente cuándo un salario es explícito publicado por la empresa vs no especificado (`"Consultar"`), ni muestran claramente modalidad verificada y antigüedad exacta relativa/absoluta para agilizar el escaneo rápido del candidato.
- **Riesgo o Impacto**:
  Menor eficiencia de escaneo visual para desarrolladores experimentados que priorizan ofertas con salario transparente y publicación reciente (<48h).
- **Solución Óptima Propuesta**:
  1. Incorporar insignias claras (`Salario verificado`, `100% Remoto España`, `Publicada hoy`) derivadas directamente de los campos estructurados normalizados en ingesta.

### [FUNC-065] Falta de entorno de desarrollo local contenedorizado (`docker-compose`) replicando MySQL, PHP Proxy, Redis y Next.js

- **Estado de Remediación**: [x] Resuelto (creado `docker-compose.yml` local con MySQL 8.0, Redis 7 y Next.js frontend)
- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: Raíz del proyecto `/home/raul/proyecto_empleo/`
- **Diagnóstico del Problema**:
  El repositorio carece de un archivo `docker-compose.yml` y semillas anonimizadas de prueba que levanten localmente el stack híbrido completo (MariaDB/MySQL con esquema unificado, servidor PHP sirviendo `db_proxy.php`, Redis compatible con Upstash, Next.js y entorno Python). Esta carencia explica por qué existen derivas de esquema (`FUNC-004`) y scripts rotos en producción sin validación local previa (`FUNC-001`, `FUNC-002`, `FUNC-003`).
- **Riesgo o Impacto**:
  Alta fricción de desarrollo y tendencia peligrosa a probar cambios directamente contra base de datos o proxy de producción.
- **Solución Óptima Propuesta**:
  1. Crear `docker-compose.dev.yml` con MariaDB/MySQL inicializado desde migraciones limpias + seed sintético (cero PII real), contenedor PHP-Apache para `db_proxy.php`, Redis + `serverless-redis-http` y perfiles para frontend/backend.
