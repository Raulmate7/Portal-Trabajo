# Auditoría de Funcionalidades, UX y Arquitectura de Negocio (`FUNC-001` – `FUNC-065`)

> **Proyecto**: Portal Empleo IT (España / UE)  
> **Alcance**: Capa de acceso a datos y proxy SQL, consistencia de esquemas, deduplicación inteligente, normalización salarial/taxonómica, resiliencia de scrapers, experiencia de búsqueda/navegación en Next.js, flujos de monetización B2B/B2C, automatización de mailing, bots sociales y observabilidad.  
> **Modo**: Auditoría estricta de solo lectura (`AUDIT ONLY`).

---

## Bloque A: Capa de Datos, Proxy SQL y Consistencia de Esquemas (`FUNC-001` – `FUNC-016`)

### [FUNC-001] Truncamiento silencioso a 1.000 filas en el proxy de base de datos sin metadatos de paginación

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `db_proxy.php` (líneas 421 y 450)
- **Diagnóstico del Problema**:
  El puente PHP que atiende las consultas SQL desde entornos remotos impone un límite duro `$max_rows = 1000` al serializar el conjunto de resultados, descartando el resto de registros sin devolver bandera de truncamiento (`truncated: true`), total estimado ni cursor de continuación. Cualquier consumidor (sitemaps, exportaciones estadísticas de `/salarios`, scripts de análisis o listados internos) recibe una respuesta con estado HTTP `200 OK` creyendo haber obtenido el conjunto completo.
- **Riesgo o Impacto**:
  Pérdida silenciosa de cobertura en agregaciones salariales, informes comerciales, generación de sitemaps y tareas administrativas cuando las tablas superan el millar de registros, generando métricas sesgadas y decisiones operativas sobre datos parciales.
- **Solución Óptima Propuesta**:
  1. Eliminar el acceso vía proxy HTTP para cargas de negocio migrando a conexión MySQL directa sobre red privada/VPN o túnel TLS mTLS desde `frontend/lib/db.ts`.
  2. Mientras persista `db_proxy.php` en entornos restringidos, devolver en la respuesta JSON el bloque `meta: { truncated, returned_rows, max_rows }` y exigir paginación explícita por cursor (`WHERE id > ? ORDER BY id ASC LIMIT ?`), rechazando consultas no paginadas con error explícito en lugar de truncarlas en silencio.

### [FUNC-002] Prohibición de `SELECT` y `SHOW` dentro de transacciones proxy que rompe los webhooks de Stripe

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 337-340) y `frontend/app/api/webhooks/stripe/route.ts` (líneas 113-116, 159-163, 302-306, 350, 386 y 420)
- **Diagnóstico del Problema**:
  La implementación del modo transaccional sobre `db_proxy.php` en `frontend/lib/db.ts` lanza explícitamente una excepción cuando se ejecuta una instrucción que comienza por `SELECT` o `SHOW` dentro de una transacción activa, dado que el proxy agrupa comandos de escritura en lote al hacer `commit`. Sin embargo, `frontend/app/api/webhooks/stripe/route.ts` ejecuta lecturas previas de verificación e idempotencia dentro de las transacciones de activación de ofertas patrocinadas, suscripciones newsletter, planes Premium e informes.
- **Riesgo o Impacto**:
  Fallo sistemático en el procesamiento de pagos confirmados en cualquier entorno que opere a través de `db_proxy.php`: el cliente paga en Stripe pero el producto contratado (oferta destacada, informe o membresía Premium) nunca se activa en base de datos, generando incidencias de soporte y devoluciones forzadas.
- **Solución Óptima Propuesta**:
  1. Suprimir el emulador de transacciones por lotes HTTP en favor de conexiones persistentes reales con sesión de estado (`BEGIN`, `SELECT ... FOR UPDATE`, `UPDATE`, `COMMIT`).
  2. Como solución intermedia inmediata para el proxy, implementar sesiones transaccionales efímeras con identificador de bloque o separar las lecturas previas optimistas con control de concurrencia mediante `UPDATE ... WHERE status = 'pending'` evaluando `affectedRows === 1`.

### [FUNC-003] Ausencia de singleton en `globalThis` para el pool de conexiones MySQL en Next.js

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 190-370)
- **Diagnóstico del Problema**:
  El módulo `frontend/lib/db.ts` instancia el pool de conexiones a base de datos a nivel de módulo sin cachearlo en `globalThis`. Durante recargas en desarrollo, compilaciones de rutas independientes en Next.js App Router o múltiples contextos de renderizado del servidor, cada carga vuelve a inicializar un pool independiente que mantiene sockets abiertos hacia MySQL.
- **Riesgo o Impacto**:
  Agotamiento prematuro del parámetro `max_connections` del servidor MySQL, errores `Too many connections` en picos de tráfico o despliegue de contenedores y degradación general del portal.
- **Solución Óptima Propuesta**:
  Declarar un registro único sobre `globalThis` (`const globalForDb = globalThis as typeof globalThis & { __mysqlPool?: Pool }`) reutilizando siempre la misma instancia por proceso Node.js, configurando límites explícitos (`connectionLimit`, `waitForConnections: true`, `queueLimit` e `idleTimeout`).

### [FUNC-004] Ausencia de `ROLLBACK` automático en `release()` del adaptador de base de datos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 190-370)
- **Diagnóstico del Problema**:
  Al liberar una conexión obtenida del pool mediante `release()`, el wrapper de base de datos no verifica si existe una transacción abierta ni ejecuta automáticamente `ROLLBACK` antes de devolver el socket al conjunto disponible. Si una excepción intermedia evita alcanzar el `catch` con rollback manual o un llamador omite el bloque `finally`, la conexión regresa sucia al pool.
- **Riesgo o Impacto**:
  Bloqueos de fila persistentes (`Lock wait timeout exceeded`), lecturas inconsistentes en peticiones HTTP posteriores asignadas a esa misma conexión y corrupción silenciosa de transacciones ajenas.
- **Solución Óptima Propuesta**:
  Encapsular todas las transacciones en un único helper `withTransaction(async (tx) => { ... })` con manejo obligatorio `try / catch / finally` que ejecute `ROLLBACK` garantizado ante cualquier fallo, y reforzar el método `release()` del adaptador para emitir `ROLLBACK` preventivo si el estado interno indica transacción activa.

### [FUNC-005] Traducción de dialecto mediante expresiones regulares que omite cláusulas `RETURNING`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 190-370) y `frontend/app/api/admin/jobs/route.ts` (líneas 32 y 50)
- **Diagnóstico del Problema**:
  `frontend/lib/db.ts` intenta traducir sintaxis PostgreSQL a MySQL utilizando reemplazos simples por expresiones regulares (placeholders `$1`, booleanos o casting básico), pero deja sin transformar cláusulas propias de PostgreSQL como `RETURNING id` utilizadas directamente en `frontend/app/api/admin/jobs/route.ts`.
- **Riesgo o Impacto**:
  Error de sintaxis SQL (`ER_PARSE_ERROR`) en tiempo de ejecución cuando el backend opera sobre MySQL y se ejecutan mutaciones administrativas de ofertas, impidiendo confirmar actualizaciones o retornos de registro.
- **Solución Óptima Propuesta**:
  1. Estandarizar todas las consultas del proyecto sobre un único dialecto MySQL 8+ o introducir un query builder tipado (como Drizzle ORM o Kysely con dialecto MySQL2).
  2. Sustituir todas las sentencias con `RETURNING` por `UPDATE`/`INSERT` seguido de consulta de verificación usando `insertId` o el identificador de la fila modificada dentro de la misma conexión.

### [FUNC-006] Divergencia estructural entre tres definiciones de esquema de base de datos

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/consolidate_production_schema.py` (25 tablas), `backend/database_optimization.sql` (21 tablas) y `frontend/lib/userAuth.ts`
- **Diagnóstico del Problema**:
  El modelo de datos carece de una fuente única de verdad: `backend/consolidate_production_schema.py` define 25 tablas para MySQL, `backend/database_optimization.sql` mantiene una variante desactualizada con 21 tablas en sintaxis PostgreSQL, y `frontend/lib/userAuth.ts` ejecuta sentencias DDL adicionales bajo demanda en tiempo de ejecución. Tablas críticas como `email_suppression_list`, `consent_audit_log`, `review_reports`, `email_deliveries` y `subscriber_job_notifications` están completamente ausentes en `database_optimization.sql`.
- **Riesgo o Impacto**:
  Cualquier despliegue limpio siguiendo el archivo `.sql` del repositorio falla en producción por ausencia de 4+ tablas productivas, mientras cambios futuros introducidos en un archivo quedan invisibles para el resto del equipo y de los entornos CI/staging.
- **Solución Óptima Propuesta**:
  Unificar el esquema completo en migraciones versionadas secuenciales e idempotentes en SQL MySQL 8 (utilizando herramientas como `Atlas`, `Alembic` o `Flyway`), eliminar la creación perezosa de tablas en código de aplicación y retirar `database_optimization.sql` obsoleto.

### [FUNC-007] Desajuste de motor en `docker-compose.yml` montando script PostgreSQL sobre despliegue orientado a MySQL

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `docker-compose.yml` (líneas 1-34) y `backend/database_optimization.sql` (líneas 1-432)
- **Diagnóstico del Problema**:
  La configuración de contenedores en `docker-compose.yml` aprovisiona e inicializa la base de datos montando `backend/database_optimization.sql`, archivo redactado con tipos y sintaxis PostgreSQL (`SERIAL`, `BOOLEAN`, `RETURNING`, índices específicos), mientras la aplicación en producción (`db_proxy.php`, `backend/db_helper.py` y `backend/consolidate_production_schema.py`) corre sobre MySQL y espera 25 tablas que dicho script ni siquiera crea en su totalidad.
- **Riesgo o Impacto**:
  Imposibilidad de reproducir el entorno de producción en local mediante `docker compose up`, generando bugs ocultos que solo afloran al subir código al servidor real y anulando cualquier prueba de integración confiable.
- **Solución Óptima Propuesta**:
  Alinear `docker-compose.yml` con la versión exacta de MySQL 8 empleada en producción, montar únicamente las migraciones canónicas MySQL exportadas de la fuente única de verdad y añadir un script seed controlado de datos de prueba en entorno local.

### [FUNC-008] Ejecución de DDL (`CREATE` / `ALTER TABLE`) en el flujo crítico de inicio de sesión

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/userAuth.ts` y ruta `/api/auth/login`
- **Diagnóstico del Problema**:
  La librería de autenticación ejecuta comprobaciones y creación/alteración perezosa de tablas de usuarios y sesiones durante la atención de peticiones reales de login en `/api/auth/login`. En MySQL, las instrucciones DDL generan bloqueos implícitos de metadatos (`metadata locks`) y fuerzan commits implícitos.
- **Riesgo o Impacto**:
  Contención severa de hilos en MySQL bajo picos concurrentes de acceso, latencia impredecible en el endpoint de login y fallos de permisos si el usuario MySQL de runtime tiene privilegiados restringidos de DDL por principio de mínimo privilegio.
- **Solución Óptima Propuesta**:
  Extraer todas las definiciones de tablas de autenticación y sesiones hacia el pipeline de migraciones previo al arranque del servicio (`run_migration.sh` o entrypoint de despliegue) y dejar `frontend/lib/userAuth.ts` operando exclusivamente con sentencias DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

### [FUNC-009] Ausencia de esquema canónico `ecosier2_PortalEmpleo.sql` y pipeline declarativo de migraciones

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/run_migration.sh` (líneas 1-68), `backend/apply_indexes.py` (líneas 1-78) y `backend/consolidate_production_schema.py` (líneas 1-589)
- **Diagnóstico del Problema**:
  El archivo maestro `ecosier2_PortalEmpleo.sql` esperado como referencia relacional del sistema no existe en el repositorio; en su lugar conviven scripts imperativos de Python y bash que aplican cambios ad hoc mediante bloques `try/except` sin tabla de historial de migraciones (`schema_migrations`), checksums de integridad ni mecanismo de rollback controlado.
- **Riesgo o Impacto**:
  Derivación progresiva del esquema entre base de datos real, código frontend y scripts backend, imposibilitando auditar qué índices o columnas existen en producción antes de desplegar una funcionalidad.
- **Solución Óptima Propuesta**:
  Generar un volcado estructural limpio de producción como migración inicial `0001_initial_schema.sql`, adoptar un gestor declarativo de migraciones con registro de versiones ejecutadas en tabla `schema_migrations` e integrar la comprobación de migraciones pendientes en el despliegue (`deploy.sh`).

### [FUNC-010] Capa adaptadora `backend/psycopg2.py` emulando driver PostgreSQL sobre MySQL

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/psycopg2.py` (líneas 1-259)
- **Diagnóstico del Problema**:
  En lugar de escribir las consultas de backend directamente para un driver estándar MySQL (`mysql-connector-python` o `pymysql`), el proyecto mantiene un módulo local denominado `psycopg2.py` que intercepta llamadas pensadas para PostgreSQL y traduce cursores, placeholders y errores sobre MySQL. Esta capa oculta comportamientos específicos de cada motor (como cursores dict, `lastrowid` vs `RETURNING`, manejo de errores de clave duplicada o timeouts).
- **Riesgo o Impacto**:
  Alta fragilidad ante actualizaciones de dependencias, ocultamiento de errores nativos del driver real, imposibilidad de usar características optimizadas de MySQL (`INSERT IGNORE`, `ON DUPLICATE KEY UPDATE` nativo, pooling oficial) y confusión grave para cualquier desarrollador que inspeccione `import psycopg2`.
- **Solución Óptima Propuesta**:
  Renombrar y refactorizar progresivamente los accesos a base de datos hacia un repositorio nativo MySQL (`PyMySQL` o `SQLAlchemy Core` con `mysql+pymysql`) y eliminar el shim engañoso `backend/psycopg2.py`.

### [FUNC-011] Llamadas `commit()` y `rollback()` inconsistentes sobre conexión con `autocommit=True` en Scrapy

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/pipelines.py` (líneas 48-87) y `backend/db_helper.py` (línea 51)
- **Diagnóstico del Problema**:
  `backend/db_helper.py` configura las conexiones con `autocommit=True` por defecto, pero el pipeline `backend/job_aggregator/pipelines.py` invoca explícitamente `conn.commit()` y `conn.rollback()` esperando comportamiento transaccional tradicional por elemento o lote. Al operar en autocommit, cada sentencia ejecutada ya ha quedado confirmada inmediatamente y un `rollback()` posterior es inoperante.
- **Riesgo o Impacto**:
  Falsa sensación de atomicidad en operaciones compuestas durante la ingesta de Tecnoempleo y escritura de registros parciales en base de datos cuando falla un paso intermedio del pipeline.
- **Solución Óptima Propuesta**:
  Abrir explícitamente una conexión o contexto transaccional con `autocommit=False` para el procesamiento del lote en `pipelines.py`, agrupar los `INSERT/UPDATE` de cada página o bloque y ejecutar `commit()` al confirmar integridad completa, con `rollback()` efectivo en `except`.

### [FUNC-012] Inserciones de scrapers que omiten clave primaria `id`, `dedup_hash` y `work_mode` en `jobs`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/main.py` (líneas 149-167), `backend/job_aggregator/pipelines.py` (líneas 48-87) y `backend/scraper_infoempleo.py` (líneas 94-96)
- **Diagnóstico del Problema**:
  Las sentencias `INSERT INTO jobs` distribuidas en el orquestador `backend/main.py`, el pipeline de Scrapy y `scraper_infoempleo.py` omiten sistemáticamente las columnas `id` (clave primaria UUID en el esquema unificado), `dedup_hash` y `work_mode`. Dependiendo de si la tabla tiene valor por defecto para el UUID o restricciones `NOT NULL`, las inserciones fallan o persisten ofertas sin clave de deduplicación ni modalidad clasificada.
- **Riesgo o Impacto**:
  Rechazos masivos de inserción en entornos estrictos de MySQL (`Field 'id' doesn't have a default value`), proliferación de ofertas duplicadas al no existir `dedup_hash` indexado y pérdida de resultados en los filtros por modalidad remota/híbrida.
- **Solución Óptima Propuesta**:
  Centralizar toda escritura en `jobs` a través de una única función repositorio (`upsert_job(job_dto)`) que valide mediante esquema Pydantic la presencia obligatoria de UUID v4/UUID v7, `dedup_hash` calculado con modalidad normalizada y `work_mode` clasificado antes de ejecutar SQL.

### [FUNC-013] Reactivación involuntaria de ofertas moderadas o caducadas en Scrapy mediante `ON DUPLICATE KEY UPDATE`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/pipelines.py` (líneas 48-87)
- **Diagnóstico del Problema**:
  Cuando el spider de Tecnoempleo re-rastrea una oferta ya existente, la cláusula `ON DUPLICATE KEY UPDATE` del pipeline establece incondicionalmente `is_active = TRUE`. Si un administrador ocultó o rechazó manualmente dicha oferta desde `/admin`, o si el job de limpieza o moderación la dio de baja por reporte de fraude o expiración temprana, la siguiente ejecución del scraper la vuelve a publicar.
- **Riesgo o Impacto**:
  Pérdida total de efectividad de la moderación manual, reaparición recurrente de ofertas fraudulentas o retiradas en el catálogo público y erosión de la confianza de candidatos y empresas.
- **Solución Óptima Propuesta**:
  Incorporar una columna booleana o estado explícito `moderation_status` (`approved`, `rejected_manual`, `expired_verified`) y restringir `ON DUPLICATE KEY UPDATE` para que únicamente actualice campos descriptivos y `last_seen_at = NOW()`, preservando `is_active` intacto cuando la oferta haya sido desactivada manualmente.

### [FUNC-014] Moderación administrativa completamente bloqueada por desajuste de tipo UUID vs `Number()`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/admin/jobs/route.ts` (líneas 17, 22, 32 y 50) y `frontend/app/admin/page.tsx` (línea 73)
- **Diagnóstico del Problema**:
  El modelo de ofertas `jobs` utiliza identificadores UUID alfanuméricos, mientras que tanto la interfaz administrativa (`admin/page.tsx`) como su controlador (`api/admin/jobs/route.ts`) fuerzan el parámetro `id` a número mediante `Number(id)` o validaciones enteras antes de consultar/actualizar MySQL. Para cualquier UUID estándar, `Number(...)` evalúa a `NaN`, impidiendo localizar o modificar la oferta.
- **Riesgo o Impacto**:
  Inoperatividad total del flujo de moderación en el panel `/admin`: los administradores no pueden aprobar, rechazar, destacar ni eliminar ofertas desde la interfaz web.
- **Solución Óptima Propuesta**:
  Eliminar por completo la conversión a `Number()` en ambos extremos, validar explícitamente el identificador `id` mediante expresión regular estricta de UUID v4 (`z.string().uuid()`) y unificar las respuestas tipadas del endpoint.

### [FUNC-015] Desincronización de nombres de tabla y columnas en endpoints de baja y derechos RGPD

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` y `frontend/app/api/admin/gdpr/route.ts` (líneas 45-95)
- **Diagnóstico del Problema**:
  La ruta `POST /api/unsubscribe` intenta actualizar una tabla inexistente `alerts` y columnas inexistentes `saved_jobs_reminders.is_active` y `streak_reminders.is_active`. De forma paralela, el endpoint `/api/admin/gdpr` consulta la tabla `alerts` y las columnas `company_reviews.company_name` / `reviewer_email` que no coinciden con el esquema consolidado en `backend/consolidate_production_schema.py`.
- **Riesgo o Impacto**:
  Errores SQL (`Table doesn't exist` / `Unknown column`) al intentar ejecutar bajas completas de alertas de usuarios o exportar/borrar datos personales en cumplimiento de solicitudes ARSOLP desde el panel administrativo.
- **Solución Óptima Propuesta**:
  Auditar cada sentencia SQL de `/api/unsubscribe` y `/api/admin/gdpr` contra las 25 tablas reales del esquema consolidado, corregir los nombres exactos de columnas/tablas, envolver todas las bajas en una transacción atómica e incorporar tests de integración contra el esquema real en CI.

### [FUNC-016] Script de limpieza y retención roto por referencias inexistentes y tablas olvidadas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/cleanup_retention.py` (líneas 1-69, especialmente línea 46)
- **Diagnóstico del Problema**:
  En la línea 46, `backend/cleanup_retention.py` filtra suscriptores no confirmados utilizando una columna inexistente `double_opt_in_token`, lo que provoca un fallo SQL antes de purgar registros obsoletos. Adicionalmente, el script omite por completo la limpieza de tokens y sesiones caducadas en `user_sessions`, `user_password_resets` y reportes resueltos con estado `resolved_hidden` en `review_reports`.
- **Riesgo o Impacto**:
  Fallo silencioso o interrupción del mantenimiento programado, crecimiento sin cota de las tablas de sesión y autenticación (degradando índices de login) y acumulación permanente de datos sin base legal vigente.
- **Solución Óptima Propuesta**:
  Corregir la condición de suscriptores pendientes usando las columnas reales de confirmación (`confirmation_token` / `confirmed_at IS NULL`), añadir reglas parametrizadas de purga por lotes pequeños (`DELETE ... LIMIT 1000`) para `user_sessions`, `user_password_resets` y `review_reports`, y registrar métricas de filas purgadas en logs estructurados.

---

## Bloque B: Resiliencia de Scrapers y Pipeline de Ingesta (`FUNC-017` – `FUNC-024`)

### [FUNC-017] Ejecución estrictamente secuencial de 7 scrapers bajo un timeout global de 180 segundos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/main.py` (líneas 1-205) y `backend/run_all.py` (líneas 1-227)
- **Diagnóstico del Problema**:
  El orquestador `backend/run_all.py` impone un timeout global de 180 segundos para la ejecución completa de `backend/main.py`, el cual invoca de forma síncrona y secuencial a los 7 módulos de scraping (`himalayas.py`, `jobfluent.py`, `pythonorg.py`, `remoteok.py`, `remotive.py`, `workingnomads.py`, `wwr.py`). Cualquier latencia en red o retardo de los primeros portales consume la ventana completa de 3 minutos.
- **Riesgo o Impacto**:
  Terminación abrupta del proceso (`TimeoutExpired`) dejando sin ejecutar de manera sistemática a los scrapers situados al final de la secuencia y provocando vacíos en la actualización diaria de ofertas.
- **Solución Óptima Propuesta**:
  Ejecutar cada scraper como tarea o subproceso independiente en paralelo acotado (por ejemplo, `concurrent.futures.ThreadPoolExecutor` / `asyncio.gather` o jobs individuales en cron) asignando un presupuesto de tiempo aislado por fuente y aislamiento total de fallos.

### [FUNC-018] Rastreo truncado a únicamente las primeras 5 páginas de Tecnoempleo

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/spiders/job_spider.py` (líneas 19-102)
- **Diagnóstico del Problema**:
  El spider principal de Scrapy limita el recorrido de listado mediante iteración fija sobre `?pagina=1..5`. En días de alta publicación o durante reconstrucciones iniciales del índice tras caídas, todas las vacantes publicadas a partir de la sexta página son sistemáticamente ignoradas aunque sean recientes y relevantes.
- **Riesgo o Impacto**:
  Pérdida significativa de inventario IT nacional en español (el segmento de mayor conversión orgánica y tráfico del portal), restringiendo la frescura y profundidad del catálogo frente a competidores.
- **Solución Óptima Propuesta**:
  Implementar paginación dinámica siguiendo el enlace "Siguiente" de la interfaz HTML con tope de seguridad configurable (`MAX_PAGES`) y condición de parada temprana ("early-stop watermark") cuando una página completa contenga únicamente ofertas ya vistas y actualizadas en base de datos.

### [FUNC-019] Omisión del rastreo de página de detalle en Tecnoempleo con datos sintéticos fijos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/spiders/job_spider.py` (líneas 19-102)
- **Diagnóstico del Problema**:
  `job_spider.py` extrae únicamente la tarjeta resumen del listado y evita seguir el enlace de cada oferta para obtener su ficha completa. Como resultado, asigna de forma estática `salary: "Consultar"` y `description_snippet: "Oferta de TecnoEmpleo"`, descartando el cuerpo técnico real de la vacante, requisitos de experiencia, beneficios y banda salarial original si constaba en el detalle.
- **Riesgo o Impacto**:
  Fichas de oferta pobres en el portal, inutilización de la clasificación tecnológica IA (por ausencia de descripción real), pérdida masiva de filtros por salario y modalidad, y páginas de detalle casi vacías con bajo valor para usuarios y buscadores.
- **Solución Óptima Propuesta**:
  Generar `scrapy.Request` condicional hacia la página de detalle únicamente para ofertas nuevas (o modificadas cuyo hash de resumen haya cambiado) para extraer la descripción limpia, banda salarial, modalidad exacta y tipo de contrato respetando `AutoThrottle`.

### [FUNC-020] Selectores CSS frágiles sin esquema de validación ni detección de cambios en el DOM

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/spiders/job_spider.py` (líneas 19-102)
- **Diagnóstico del Problema**:
  El parsing HTML se apoya en selectores CSS estructurales rígidos (`h3 a`, `h4 a`, `span.float-end`) acoplados al diseño actual de Bootstrap en destino. No existen selectores de respaldo, validación contractual de campos extraídos ni verificación de tasa de captura nula cuando una página devuelve código `200 OK`.
- **Riesgo o Impacto**:
  Ante cualquier rediseño menor de clases CSS en el portal fuente, el scraper falla silenciosamente o ingesta campos desplazados (títulos vacíos o empresas cruzadas) sin disparar alertas al equipo técnico.
- **Solución Óptima Propuesta**:
  Encapsular la extracción en parsers desacoplados usando `ItemLoader` + validación estricta con Pydantic, incorporar fallback sobre datos estructurados JSON-LD (`script[type="application/ld+json"]`) si la página de detalle los publica, y disparar una alerta de anomalía si una ejecución devuelve `0` items válidos o tasa de nulos superior al 30%.

### [FUNC-021] Concurrencia y AutoThrottle sin calibrar en la configuración de Scrapy

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/job_aggregator/settings.py` (línea 76)
- **Diagnóstico del Problema**:
  La configuración de Scrapy en `backend/job_aggregator/settings.py` no define ni ajusta `CONCURRENT_REQUESTS`, `CONCURRENT_REQUESTS_PER_DOMAIN`, `DOWNLOAD_DELAY` ni activa `AUTOTHROTTLE_ENABLED` con latencias objetivo adecuadas para un crawler respetuoso y sostenible en producción.
- **Riesgo o Impacto**:
  Ráfagas agresivas de peticiones ante cambios de latencia del servidor origen que desencadenan bloqueos por WAF / HTTP 429, o por el contrario un rendimiento infrautilizado si se añaden páginas de detalle en el futuro.
- **Solución Óptima Propuesta**:
  Activar `AUTOTHROTTLE_ENABLED = True`, fijar `CONCURRENT_REQUESTS_PER_DOMAIN = 2`, `AUTOTHROTTLE_START_DELAY = 1.5`, `AUTOTHROTTLE_TARGET_CONCURRENCY = 1.5`, configurar `RETRY_HTTP_CODES = [500, 502, 503, 504, 429]` con backoff exponencial y habilitar `HTTPCACHE` en entorno local para desarrollo.

### [FUNC-022] Circuit breaker volátil en memoria sin persistencia ni observabilidad entre ejecuciones cron

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/scraper_http.py` (líneas 1-61)
- **Diagnóstico del Problema**:
  El cliente HTTP auxiliar implementa un circuit breaker cuyo estado de fallos por dominio reside únicamente en variables locales en memoria del proceso Python. Debido a que cada ejecución programada (`cron`) arranca un intérprete nuevo que finaliza al terminar el batch, los contadores de fallo se reinician a cero en cada ciclo.
- **Riesgo o Impacto**:
  Si una fuente cae de forma permanente o bloquea nuestra IP durante días, el sistema seguirá intentando rastrearla en cada ciclo sin degradar la fuente ni acumular historial suficiente para alertar de la avería.
- **Solución Óptima Propuesta**:
  Persistir el estado del circuit breaker por dominio (`closed`, `open`, `half_open`, `consecutive_failures`, `cooldown_until`) en tabla de base de datos o Redis, saltando las fuentes en estado abierto hasta que venza el cooldown y emitiendo alertas tras tres ciclos consecutivos fallidos.

### [FUNC-023] Throttling síncrono bloqueante en `scraper_http.py` para todas las fuentes JSON y RSS

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/scraper_http.py` (líneas 1-61) y `backend/scrapers/` (`himalayas.py`, `jobfluent.py`, `pythonorg.py`, `remoteok.py`, `remotive.py`, `workingnomads.py`, `wwr.py`)
- **Diagnóstico del Problema**:
  Cada llamada saliente ejecutada a través de `scraper_http.py` introduce una espera bloqueante síncrona `time.sleep` de entre `0.15` y `0.45` segundos antes/después de resolver la petición. Sumado al modelo secuencial del orquestador, la latencia acumulada de red más pausas bloquea el hilo principal durante decenas de segundos incluso para APIs paginadas simples.
- **Riesgo o Impacto**:
  Desperdicio de ventana de ejecución dentro del presupuesto de `180s`, vulnerabilidad a timeouts en cadena y dificultad para ampliar el número de feeds externos sin desbordar la programación cron.
- **Solución Óptima Propuesta**:
  Migrar la capa `scraper_http.py` a `httpx.AsyncClient` con limitadores asíncronos independientes por dominio (`asyncio.Semaphore` / token bucket), manteniendo cortesía entre peticiones al mismo host mientras múltiples proveedores distintos se consultan concurrentemente.

### [FUNC-024] Inexistencia de tabla de telemetría de ejecuciones de ingesta (`scraper_runs`)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/main.py` (líneas 1-205), `backend/run_all.py` (líneas 1-227) y `backend/consolidate_production_schema.py`
- **Diagnóstico del Problema**:
  El flujo completo de agregación e indexación no persiste un registro estructurado por ejecución indicando qué scraper se ejecutó, cuántas ofertas crudas encontró, cuántas fueron descartadas por deduplicación, cuántas fallaron por validación o cuántos códigos HTTP de error recibió cada origen.
- **Riesgo o Impacto**:
  Ceguera operativa total para el administrador: resulta imposible saber desde `/admin` si el catálogo decrece por menor oferta del mercado o porque tres scrapers llevan una semana fallando en silencio.
- **Solución Óptima Propuesta**:
  Crear una tabla `scraper_runs` (`source`, `started_at`, `finished_at`, `status`, `fetched_count`, `inserted_count`, `dedup_count`, `error_message`) actualizada al principio y final de cada fuente y visualizar su estado histórico en un widget de salud dentro de `/admin`.

---

## Bloque C: Deduplicación Inteligente y Normalización IA/Salarial (`FUNC-025` – `FUNC-032`)

### [FUNC-025] Deduplicación limitada a coincidencia exacta SHA-256 sin similitud difusa entre fuentes

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/dedup.py` (líneas 32-35)
- **Diagnóstico del Problema**:
  La lógica de deduplicación genera exclusivamente un hash SHA-256 determinista sobre tokens ordenados o normalizados de empresa y título. Si una misma empresa publica una vacante en dos portales con mínimas diferencias ("Senior Backend Python" frente a "Backend Python Engineer (Remoto)" o con siglas como "Sr." / "React.js"), sus hashes divergen completamente y no existe segunda etapa de comparación por similitud léxica o distancia de Jaccard/Trigramas sobre ofertas activas recientes de la misma empresa.
- **Riesgo o Impacto**:
  Aparición de ofertas duplicadas procedentes de distintos agregadores en el feed principal, en los boletines por correo y en las búsquedas del candidato, reduciendo la calidad percibida del portal y canibalizando URLs SEO.
- **Solución Óptima Propuesta**:
  Implementar un pipeline de deduplicación en dos niveles: primero coincidencia rápida por `dedup_hash` indexado; segundo, ante nueva inserción, recuperar las ofertas activas de los últimos 30 días de la misma empresa normalizada y calcular similitud de tokens (`RapidFuzz token_set_ratio >= 88` combinado con coincidencia de ubicación/modalidad) para fusionar fuentes bajo un único anuncio canónico conservando enlaces alternativos.

### [FUNC-026] Omisión de `work_mode` al invocar `compute_dedup_hash` desde el orquestador

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/main.py` (línea 78) y `backend/logic/dedup.py` (líneas 32-35)
- **Diagnóstico del Problema**:
  En la línea 78 de `backend/main.py`, el orquestador calcula el identificador único de deduplicación invocando `compute_dedup_hash(company, title)` con cadena vacía `work_mode=''` en lugar de emplear la modalidad real extraída de la oferta (`Remoto`, `Híbrido`, `Presencial`).
- **Riesgo o Impacto**:
  Colisión falsa de hashes: si una consultora o empresa tecnológica publica legítimamente dos vacantes con idéntico título —una en modalidad remota y otra presencial en oficina concreta— el sistema descarta la segunda como duplicado perdiendo oportunidades reales del inventario.
- **Solución Óptima Propuesta**:
  Ejecutar la clasificación de modalidad y normalización de ubicación antes del cálculo de `dedup_hash`, pasando obligatoriamente tanto el `work_mode` normalizado como la provincia/ciudad canónica al generador de huella.

### [FUNC-027] Reglas de sufijos societarios incompletas en la normalización de empresas para deduplicación

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/dedup.py` (líneas 32-35)
- **Diagnóstico del Problema**:
  La expresión regular `COMPANY_SUFFIXES_RE` encargada de limpiar razones sociales antes de calcular el hash omite sufijos frecuentes en el ecosistema tecnológico español y europeo, incluyendo `S.R.L.`, `BV`, `SAS`, `Consultores` y `Grupo`. Así, `"Acme Consultores"` y `"Acme S.R.L."` producen identidades distintas para el deduplicador.
- **Riesgo o Impacto**:
  Fallo de deduplicación cruzada entre agregadores internacionales (que registran razón social anglosajona o europea completa) y portales locales españoles (que omiten o traducen el sufijo), fragmentando también la agrupación futura por empresa.
- **Solución Óptima Propuesta**:
  Ampliar `COMPANY_SUFFIXES_RE` incorporando todas las formas societarias europeas y latinas (`S.L.`, `S.A.`, `S.L.U.`, `S.R.L.`, `GmbH`, `BV`, `SAS`, `Ltd`, `Inc`, `Corp`, `Consultores`, `Grupo`, `España`, `Tech`), normalizar diacríticos NFKD y validar los casos límite con una batería de pruebas unitarias.

### [FUNC-028] Ausencia de columnas salariales normalizadas en EUR y tasas de cambio fijas obsoletas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/salary_parser.py` (líneas 46-70)
- **Diagnóstico del Problema**:
  El módulo `salary_parser.py` convierte importes mediante un diccionario estático `FX_TO_EUR = {'EUR': 1.0, 'USD': 0.92, 'GBP': 1.17}` sin actualización externa periódica, y la base de datos carece de columnas numéricas indexadas (`salary_min_eur`, `salary_max_eur`) que almacenen el rango salarial anual normalizado al momento de la ingesta.
- **Riesgo o Impacto**:
  Imposibilidad de filtrar ofertas mediante rango salarial numérico indexado en SQL (obligando a filtrados booleanos simples "con salario" o parsing dinámico lento), además de mostrar estimaciones económicas desactualizadas para ofertas remotas pagadas en dólares o libras.
- **Solución Óptima Propuesta**:
  Añadir columnas `salary_min_eur INT UNSIGNED` y `salary_max_eur INT UNSIGNED` con índice compuesto en `jobs`, rellenarlas durante la ingesta/normalización y actualizar diariamente las tasas de cambio desde la API oficial del Banco Central Europeo (ECB) cacheadas en BD o archivo de configuración.

### [FUNC-029] Error matemático grave al anualizar tarifas diarias en el parser de salarios

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/salary_parser.py` (líneas 78-85)
- **Diagnóstico del Problema**:
  Al detectar expresiones retributivas expresadas por jornada ("día", "daily", "/day"), el código de `salary_parser.py` aplica el mismo factor multiplicador que para nóminas mensuales (`* 12`), asumiendo erróneamente 12 unidades al año en lugar de jornadas laborables anuales (`220`–`250` días).
- **Riesgo o Impacto**:
  Una tarifa freelance de `350 €/día` se calcula internamente como `4.200 €/año` en vez de `~77.000 €/año`, distorsionando los promedios salariales y expulsando ofertas freelance de alto nivel de las búsquedas por rango salarial mínimo.
- **Solución Óptima Propuesta**:
  Separar explícitamente la lógica de escalado por periodicidad (`hourly * 1800`, `daily * 220`, `weekly * 48`, `monthly * 12`, `annual * 1`), añadiendo rangos plausibles de validación (`10.000 <= annual_eur <= 450.000`) para descartar falsos positivos antes de guardar en BD.

### [FUNC-030] Divergencia crítica entre el parser de salarios del backend y el del frontend más sesgo por `LIMIT 500`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/salarios.ts` (líneas 120-210) y `backend/logic/salary_parser.py` (líneas 46-85)
- **Diagnóstico del Problema**:
  El cálculo de estadísticas salariales en frontend reimplementa su propio parser textual independiente del existente en Python. Esta implementación TypeScript no reconoce notaciones abreviadas comunes (`'40k'`), omite separadores anglosajones (`'100,000'`) y descarta el nivel de experiencia `'mid'`. Además, las consultas agregadas sobre las que calcula las cifras están limitadas a `LIMIT 500`.
- **Riesgo o Impacto**:
  Las páginas programáticas de `/salarios` y el endpoint `/api/salarios` muestran promedios sesgados sobre una muestra truncada de 500 ofertas mal parseadas, contradiciendo las cifras reales del catálogo y las de los informes generados.
- **Solución Óptima Propuesta**:
  Eliminar el parsing de texto salarial en tiempo de lectura en `frontend/lib/salarios.ts`; delegar la normalización íntegramente a la fase de ingesta y re-procesamiento backend persistiendo `salary_min_eur`, `salary_max_eur` y `seniority_level` (`junior`, `mid`, `senior`, `lead`), y calcular los percentiles en SQL sobre el conjunto completo de los últimos 90 días.

### [FUNC-031] Pipeline fragmentado de clasificación y traducción IA sin reintentos ni taxonomía unificada

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/classifier.py`, `backend/logic/translator.py` y `backend/categorize_existing_jobs.py` (líneas 1-68)
- **Diagnóstico del Problema**:
  La categorización de sector, tecnologías y traducción al español depende de scripts y helpers ejecutados de forma secuencial o manual (`categorize_existing_jobs.py`) sin cola de reintentos ante fallos de API de IA ni garantía de un diccionario cerrado de etiquetas normalizadas (`tags`). Ofertas importadas de fuentes en inglés conviven con vacantes en español sin uniformidad sistemática.
- **Riesgo o Impacto**:
  Ofertas recién scrapeadas permanecen temporalmente sin categoría, stack normalizado ni traducción al español, impidiendo que aparezcan en los filtros sectoriales (`/trabajos/[sector]`) o en las alertas personalizadas de los suscriptores.
- **Solución Óptima Propuesta**:
  Diseñar un paso de enriquecimiento asíncrono idempotente con cola por estados (`enrichment_status`: `pending`, `done`, `failed`), prompt estructurado con JSON Schema estricto sobre una taxonomía canónica compartida con el frontend y límite de reintentos con fallback heurístico por diccionario de palabras clave.

### [FUNC-032] Verificación de vigencia de ofertas desvinculada del comportamiento real del catálogo

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (líneas 1-230)
- **Diagnóstico del Problema**:
  La desactivación de vacantes caducadas recae en ejecuciones por lotes de `deactivate_expired_jobs.py` sin un esquema de priorización inteligente basado en antigüedad, ausencia en la última corrida del scraper de origen ni en señales de clics salientes recientes desde `/api/track-click`.
- **Riesgo o Impacto**:
  Los candidatos hacen clic en ofertas que llevan semanas cerradas en la web de destino, generando frustración inmediata, rebote rápido desde el portal hacia el buscador y degradación del posicionamiento por mala experiencia de usuario.
- **Solución Óptima Propuesta**:
  Combinar tres señales para dar de baja ofertas automáticamente: (1) marca temporal `last_seen_at` ausente tras dos ejecuciones consecutivas del scraper de origen, (2) verificación HTTP `HEAD/GET` priorizada sobre ofertas con mayor número de clics salientes recientes detectando códigos `404`/`410` o patrones de cierre conocidos, y (3) expiración máxima por defecto (`30`–`45` días) editable en ofertas patrocinadas.

---

## Bloque D: Búsqueda, Experiencia de Usuario y Frontend (`FUNC-033` – `FUNC-049`)

### [FUNC-033] Uso de datos simulados `MOCK_JOBS` y contador irreal `9197` que ocultan búsquedas sin resultados

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/jobs.ts` (líneas 174-235)
- **Diagnóstico del Problema**:
  Cuando la consulta de ofertas arroja cero resultados reales o experimenta ciertas condiciones de fallback, `frontend/lib/jobs.ts` recurre al array estático `MOCK_JOBS` o expone la cifra ficticia `9197` como total disponible. El usuario visualiza ofertas irrelevantes o inventadas creyendo que son vacantes reales compatibles con su búsqueda.
- **Riesgo o Impacto**:
  Destrucción inmediata de la credibilidad del portal frente a candidatos técnicos al encontrar ofertas ficticias o conteos manipulados, además de impedir ofrecer estados vacíos útiles (como crear una alerta para ese criterio exacto).
- **Solución Óptima Propuesta**:
  Eliminar `MOCK_JOBS` y la constante `9197` del código de producción; separar claramente los errores de infraestructura (mostrando banner de error recuperable) de las búsquedas legítimas con `0` resultados reales (mostrando sugerencias de ampliación de filtros y un CTA directo de alerta por email para esa consulta).

### [FUNC-034] Degradación de búsquedas Full-Text para lenguajes cortos y símbolos técnicos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/jobs.ts` (líneas 174-235)
- **Diagnóstico del Problema**:
  La lógica de búsqueda combina cláusulas `MATCH ... AGAINST` en MySQL con expresiones `LIKE` sin normalización tokenizada previa. Los motores MySQL Full-Text descartan de forma predeterminada palabras de menos de 3 o 4 caracteres (`ft_min_word_len` / `innodb_ft_min_token_size`) y separan por signos de puntuación, invalidando búsquedas literales de alta demanda como `C#`, `C++`, `Go`, `.NET`, `AI` o `QA`.
- **Riesgo o Impacto**:
  Los candidatos que buscan vacantes específicas para esos ecosistemas reciben conjuntos vacíos o coincidencias falsas parciales (por ejemplo con la preposición inglesa `go` dentro de frases genéricas), perdiendo oportunidades reales publicadas.
- **Solución Óptima Propuesta**:
  1. Mantener un índice normalizado de habilidades (`job_tags` o columna JSON/tabla relacional indexada `tags`) extraído en ingesta donde `c++`, `csharp`, `dotnet`, `golang` y `ai` queden canonizados explícitamente.
  2. Detectar consultas cortas o con símbolos especiales en el backend de búsqueda y dirigirlas por coincidencia exacta sobre etiquetas normalizadas o expresiones `REGEXP` acotadas con límites de palabra.

### [FUNC-035] Buscador `AISearchBar` limitado a 13 reglas estáticas en cliente sin autocompletado real

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/AISearchBar.tsx` (líneas 1-164)
- **Diagnóstico del Problema**:
  A pesar de su denominación comercial, `AISearchBar` opera en cliente interpretando únicamente 13 expresiones regulares predefinidas para detectar tecnologías concretas y no consulta ningún endpoint de autocompletado, sinónimos semánticos ni inventario real de tecnologías, empresas o provincias disponibles en base de datos.
- **Riesgo o Impacto**:
  Consultas en lenguaje natural ligeramente distintas al patrón esperado ("desarrollador back con spring", "teletrabajo devops valencia" o "ciberseguridad") no obtienen desambiguación ni sugerencias, generando búsquedas subóptimas o vacías.
- **Solución Óptima Propuesta**:
  Añadir un endpoint ligero de sugerencias `/api/jobs/suggest` cacheado que devuelva en <40 ms roles, tecnologías, empresas y ciudades reales con conteo activo, e integrar un analizador de intención server-side con mapeo amplio de sinónimos antes de redirigir al listado.

### [FUNC-036] Ausencia de debounce reactivo y sincronización bidireccional de filtros en URL desde `AISearchBar`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/AISearchBar.tsx` (líneas 1-164)
- **Diagnóstico del Problema**:
  La interacción en `AISearchBar` y sus controles asociados no sincroniza de forma debounced (`300 ms`) ni bidireccional el estado de búsqueda, chips de filtros activos (`work_mode`, `salary`, `sort`) y parámetros `URLSearchParams` de la barra de direcciones tras cambios iterativos.
- **Riesgo o Impacto**:
  Dificultad para compartir URLs exactas de búsquedas filtradas entre candidatos, pérdida del estado de filtros al recargar la página o retroceder desde el detalle de una oferta y envíos redundantes si el usuario teclea rápido.
- **Solución Óptima Propuesta**:
  Gestionar todos los filtros activos como fuente única de verdad en `useSearchParams` mediante un hook `useJobFilters` con `debounce` configurable, chips removibles visibles sobre el listado y limpieza individual o global con un clic.

### [FUNC-037] Lista de dependencias incompleta en `useCallback` de `LoadMoreJobs` que congela filtros aplicados

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/LoadMoreJobs.tsx` (líneas 55-100)
- **Diagnóstico del Problema**:
  El hook `useCallback` encargado de invocar las páginas siguientes del listado en `LoadMoreJobs.tsx` omite `withSalary` y `sort` dentro de su array de dependencias React. Como resultado, el closure conserva los valores iniciales capturados durante el primer renderizado aunque el usuario cambie después la ordenación o el filtro salarial en la misma sesión de navegación.
- **Riesgo o Impacto**:
  Al hacer scroll para cargar la segunda o tercera página tras cambiar el orden o activar el filtro de salario, se mezclan resultados del criterio anterior con los del criterio nuevo, produciendo duplicados visuales o pérdida de orden lógico.
- **Solución Óptima Propuesta**:
  Incluir explícitamente todas las variables reactivas (`withSalary`, `sort`, `query`, `sector`, `workMode`, `offset`) en el array de dependencias de `useCallback` o derivar la petición directamente de un objeto de clave de consulta inmutable pasado por props desde el Server Component.

### [FUNC-038] Uso imperativo del DOM, falta de `AbortController` y pérdida de posición en paginación infinita

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/LoadMoreJobs.tsx` (líneas 55-100)
- **Diagnóstico del Problema**:
  `LoadMoreJobs.tsx` localiza el elemento centinela mediante `document.getElementById('infinite-scroll-sentinel')` en lugar de usar un `useRef`, ejecuta `fetch` sin asociar un `AbortController` para cancelar solicitudes en vuelo ante cambios de filtro o desmontaje, y no refleja la página/offset cargado en el historial URL.
- **Riesgo o Impacto**:
  Condiciones de carrera ("race conditions") en las que respuestas lentas de un filtro anterior sobrescriben las del nuevo filtro, colisiones si se montan múltiples instancias del componente, y frustración de UX porque al entrar a una oferta en la página 4 y pulsar "Atrás" el navegador vuelve a la página 1.
- **Solución Óptima Propuesta**:
  Reemplazar `document.getElementById` por `useRef<HTMLDivElement>(null)`, cancelar toda petición obsoleta vía `AbortController` en el cleanup de `useEffect`, y combinar carga progresiva con botones accesibles ("Cargar más / Página N") que actualicen `?page=N` vía `history.replaceState` para preservar el scroll al volver.

### [FUNC-039] Redirección abrupta a `/login` en `SaveJobButton` con pérdida de ofertas guardadas y contradicción funcional

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/SaveJobButton.tsx` (líneas 1-150) y `frontend/app/cookies/page.tsx`
- **Diagnóstico del Problema**:
  Cuando un candidato no autenticado pulsa el botón de guardar oferta (`SaveJobButton.tsx`), el componente lo redirige inmediatamente a `/login` en vez de persistir temporalmente la selección en el almacenamiento local del navegador (`localStorage.saved_jobs`) tal como además describe la página `/cookies` (`cookies/page.tsx`). Al regresar tras iniciar sesión o registrarse, la oferta tampoco queda guardada automáticamente.
- **Riesgo o Impacto**:
  Alta tasa de abandono en el principal micro-compromiso del candidato durante su primera visita y frustración al perder la vacante que intentaba marcar antes de crear cuenta.
- **Solución Óptima Propuesta**:
  Guardar inmediatamente el identificador de oferta en `localStorage.saved_jobs` cuando el usuario es anónimo mostrando feedback optimista y un aviso discreto ("Guardado en este dispositivo; inicia sesión para sincronizar"), ejecutando una sincronización automática hacia `POST /api/saved-jobs/sync` tras completar login o registro.

### [FUNC-040] Bloqueo forzado de preferencia de tema claro/oscuro en el layout raíz

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/layout.tsx` (líneas 199-201)
- **Diagnóstico del Problema**:
  El script inline ejecutado en `frontend/app/layout.tsx` ejecuta explícitamente `localStorage.removeItem('theme')` durante la carga, borrando cualquier selección manual previa de tema claro u oscuro del usuario y anulando la persistencia esperada por la interfaz y declarada en `/cookies`.
- **Riesgo o Impacto**:
  Incapacidad real del usuario para conservar su preferencia visual de contraste o lectura nocturna entre recargas de página, afectando negativamente a accesibilidad visual y coherencia con la política declarada de preferencias locales.
- **Solución Óptima Propuesta**:
  Eliminar `localStorage.removeItem('theme')`, leer `localStorage.getItem('theme')` con respaldo en `window.matchMedia('(prefers-color-scheme: dark)')` antes de la primera pintura para evitar destellos (FOUC), y exponer un selector accesible de tres estados (`Sistema`, `Claro`, `Oscuro`).

### [FUNC-041] Consulta pesada `LIMIT 150` ejecutada periódicamente dentro del componente `Footer`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/Footer.tsx` (líneas 37-87)
- **Diagnóstico del Problema**:
  El pie de página global (`Footer.tsx`) lanza cada hora una consulta SQL recuperando hasta `150` registros directamente desde la base de datos para derivar enlaces internos dinámicos de sectores o ubicaciones. Al ser un componente transversal a toda la aplicación, cualquier revalidación o render dinámico dispara consultas evitables e inestabilidad en los enlaces renderizados.
- **Riesgo o Impacto**:
  Consumo superfluo de conexiones y CPU en MySQL por un componente estático estructural, unido a volatilidad innecesaria de enlaces internos en el footer global cada vez que fluctúa el muestreo de `150` ofertas.
- **Solución Óptima Propuesta**:
  Alimentar los enlaces taxonómicos del `Footer` desde una lista curada estable combinada con conteos precalculados en caché de larga duración (`revalidate: 86400` con `unstable_cache` y tag `taxonomy-summary`), eliminando consultas fila a fila en cada ciclo horario.

### [FUNC-042] Panel de administración sin paginación (`LIMIT 50`), buscador ni acciones por lote

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/admin/page.tsx` (líneas 1-150) y `frontend/app/api/admin/jobs/route.ts`
- **Diagnóstico del Problema**:
  La vista operativa de `/admin` carga un bloque fijo limitado a `50` ofertas sin paginación por páginas/cursor, sin caja de búsqueda por empresa, título o fuente, sin filtros por estado (`pending`, `active`, `rejected`, `sponsored`) y sin selección múltiple para aprobar o rechazar ofertas en lote.
- **Riesgo o Impacto**:
  Cuando entran más de 50 ofertas en un ciclo de scraping o publicación gratuita, las vacantes más antiguas quedan inaccesibles en cola detrás de la fila 50, impidiendo la moderación ágil y bloqueando la operativa diaria.
- **Solución Óptima Propuesta**:
  Implementar paginación server-side real por página/cursor con contadores por pestaña de estado, filtros combinados por fuente/empresa/búsqueda de texto y soporte transaccional de acciones masivas (`bulk approve` / `bulk deactivate`).

### [FUNC-043] Duplicación e inconsistencia de lógica de consulta de ofertas entre API Route, Actions y Librería

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/jobs/route.ts`, `frontend/app/actions.ts` y `frontend/lib/jobs.ts`
- **Diagnóstico del Problema**:
  Las reglas de filtrado, ordenación, exclusión de ofertas inactivas y mapeo de columnas de `jobs` están replicadas entre el endpoint HTTP `/api/jobs`, las Server Actions de `frontend/app/actions.ts` y las funciones auxiliares de `frontend/lib/jobs.ts`. Al modificar un criterio (por ejemplo orden de patrocinadas o filtro salarial), otras rutas mantienen el comportamiento anterior.
- **Riesgo o Impacto**:
  Incongruencia visual entre la carga inicial SSR, la carga infinita vía `/api/jobs` y las búsquedas lanzadas mediante acciones de formulario, multiplicando el coste de mantenimiento y el riesgo de bugs asimétricos.
- **Solución Óptima Propuesta**:
  Consolidar un único servicio de dominio `searchJobs(filters, pagination)` en `frontend/lib/jobs.ts` con contrato Zod compartido, convirtiendo tanto `GET /api/jobs` como las páginas SSR y acciones en meros adaptadores delgados de entrada/salida.

### [FUNC-044] Mezcla de formularios gratuitos de empresas en `jobs` sin cola aislada ni verificación de dominio

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/publicar-oferta/PublishForm.tsx` (líneas 270-493) y `frontend/app/actions.ts` (línea 637)
- **Diagnóstico del Problema**:
  El envío gratuito desde `PublishForm.tsx` inserta directamente registros en la tabla productiva `jobs` a través de `actions.ts:637` esperando moderación mediante bandera booleana, sin aislar envíos sin verificar en una tabla `job_submissions` ni validar mediante token al correo corporativo de la empresa el dominio del anunciante.
- **Riesgo o Impacto**:
  Contaminación de la tabla principal de producción con spam, anuncios falsos o suplantación de grandes marcas tecnológicas mediante correos gratuitos, complicando además los índices y copias operativas de `jobs`.
- **Solución Óptima Propuesta**:
  Separar los borradores enviados desde `PublishForm.tsx` a una tabla `job_submissions` con verificación opcional por email corporativo (comparando dominio de email frente a dominio web de la empresa) y promover a `jobs` únicamente tras aprobación explícita.

### [FUNC-045] Inserción prematura en `jobs` previa al pago y omisión de `type: 'sponsored_job'` en Stripe Checkout

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts` (línea 86) y `frontend/app/api/webhooks/stripe/route.ts`
- **Diagnóstico del Problema**:
  Antes de completar o confirmar la sesión de pago en Stripe, `frontend/app/api/checkout/route.ts` crea ya una fila en la tabla `jobs` con estado pendiente y además omite incluir `type: 'sponsored_job'` de forma uniforme en los metadatos para su procesamiento inequívoco en el webhook de confirmación.
- **Riesgo o Impacto**:
  Cada carrito de pago iniciado y abandonado deja filas huérfanas acumuladas en `jobs`; además, la falta de tipificación explícita de producto dificulta el enrutamiento seguro en `webhooks/stripe/route.ts` junto a suscripciones de newsletter, planes Premium e informes.
- **Solución Óptima Propuesta**:
  Persistir la intención de publicación únicamente en `sponsored_job_orders` (o `pending_checkouts`) vinculada al `checkout_session_id` con `metadata: { type: 'sponsored_job', order_id }`, e insertar/promover la oferta en `jobs` de forma atómica solo dentro del webhook `checkout.session.completed` tras validar firma e importe.

### [FUNC-046] Flujo dual asimétrico de suscripción sin Double Opt-In en la Server Action `subscribeUser`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/actions.ts` (`subscribeUser`, líneas 384-403) y `frontend/app/api/subscribe/route.ts`
- **Diagnóstico del Problema**:
  El proyecto dispone de dos puntos de entrada funcionales para suscripción a alertas: mientras `/api/subscribe` implementa flujo de confirmación Double Opt-In, la Server Action `subscribeUser` inserta al usuario directamente como suscriptor activo sin generar token ni enviar correo de verificación, y ante errores de columnas en la inserción ejecuta un fallback que descarta los campos de auditoría del consentimiento (`consent_timestamp`, `consent_ip_hash`, `consent_policy_version`, `marketing_accepted`).
- **Riesgo o Impacto**:
  Fragmentación funcional severa donde los envíos hechos vía Server Action omiten verificación de propiedad del buzón, permiten dar de alta a terceros sin autorización y degradan silenciosamente la integridad de los datos de consentimiento.
- **Solución Óptima Propuesta**:
  Eliminar el alta directa y la lógica duplicada en `subscribeUser`; enrutar todos los formularios de suscripción hacia un servicio compartido que aplique obligatoriamente verificación Double Opt-In, compruebe `email_suppression_list` y falle explícitamente si falta soporte de columnas de consentimiento.

---

## Bloque E: Monetización B2B/B2C, Mailing, Bots Sociales y Observabilidad (`FUNC-047` – `FUNC-065`)

### [FUNC-047] Generador PDF comercial rudimentario limitado a una página ASCII con truncamiento de datos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/checkout/report/download/route.ts` (líneas 140-156)
- **Diagnóstico del Problema**:
  La función `buildSimplePdfBuffer` construye a mano un archivo PDF mínimo de una sola página en codificación ASCII pura (mutilando caracteres españoles como `España` a `ESPANA`), sin gráficos, sin tablas paginadas y leyendo de forma estática únicamente las primeras 10 claves de `TECH_DETAILS` y `DISPLAY_CITIES`.
- **Riesgo o Impacto**:
  Los clientes B2B o candidatos que pagan por un "Informe Salarial y de Mercado" reciben un documento de aspecto amateur con faltas tipográficas por eliminación de tildes y con el inventario tecnológico y geográfico amputado.
- **Solución Óptima Propuesta**:
  Sustituir `buildSimplePdfBuffer` por un motor real de composición PDF con soporte UTF-8 completo, fuentes embebidas, tablas multipágina y gráficos vectoriales (por ejemplo `@react-pdf/renderer` o plantilla HTML/CSS renderizada con Chromium headless en cola asíncrona).

### [FUNC-048] Incumplimiento funcional del producto `enterprise` en descarga de informes frente a lo ofertado en checkout

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/checkout/report/route.ts` (línea 46) y `frontend/app/api/checkout/report/download/route.ts` (líneas 140-156)
- **Diagnóstico del Problema**:
  El endpoint de contratación `/api/checkout/report` ofrece explícitamente el nivel `enterprise` incluyendo análisis personalizado de competencia y stack tecnológico específico. Sin embargo, el generador de descarga en `/api/checkout/report/download` ignora los parámetros del plan `enterprise` y entrega exactamente el mismo PDF genérico estático limitado a 10 elementos.
- **Riesgo o Impacto**:
  Entrega de un producto comercial sustancialmente inferior a lo contratado y cobrado, generando reclamaciones inmediatas de reembolso, disputas (chargebacks) en Stripe y daño reputacional irreversible ante clientes B2B.
- **Solución Óptima Propuesta**:
  Capturar los parámetros del stack/región objetivo al contratar el plan `enterprise`, generar dinámicamente las comparativas de percentiles, demanda por seniority y empresas activas filtradas para ese stack sobre datos reales de BD, y verificar en test E2E la diferenciación efectiva de cada tier (`standard`, `pro`, `enterprise`).

### [FUNC-049] Control frágil de descarga de informes sin expiración temporal ni almacenamiento pre-generado

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/report/download/route.ts` (líneas 140-156)
- **Diagnóstico del Problema**:
  El acceso al documento comprado controla exclusivamente un contador incremental (`download_count < 5`), regenerando el buffer del informe bajo demanda en cada petición HTTP sin almacenar un snapshot inmutable vinculado a la fecha de compra ni establecer ventana temporal de expiración (`expires_at`).
- **Riesgo o Impacto**:
  Un cliente que descarge el archivo meses después recibe cifras distintas o inconsistentes respecto a la edición adquirida, y el enlace permanece válido indefinidamente mientras queden intentos disponibles en el contador.
- **Solución Óptima Propuesta**:
  Generar y persistir el PDF definitivo como artefacto inmutable en almacenamiento de objetos (S3/R2 privado) al confirmarse el pago en Stripe, y servirlo mediante URLs firmadas efímeras combinando ventana de validez temporal (`30` días) y límite razonable de descargas.

### [FUNC-050] Programa de referidos defectuoso que promete Premium sin activar `is_premium = TRUE` en BD

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/send_referral_notifications.py` (líneas 1-257)
- **Diagnóstico del Problema**:
  El script `send_referral_notifications.py` evalúa invitaciones y envía correos electrónicos al usuario notificándole que ha desbloqueado acceso Premium por sus referidos, pero omite ejecutar la sentencia `UPDATE users SET is_premium = TRUE` correspondiente en base de datos y contabiliza además referidos que todavía no han completado la confirmación de su cuenta.
- **Riesgo o Impacto**:
  El usuario recibe un correo oficial confirmando su recompensa Premium pero al entrar al portal sigue viendo restricciones gratuitas, creando fraude percibido, tickets de soporte y vulnerabilidad a abusos creando referidos falsos sin confirmar email.
- **Solución Óptima Propuesta**:
  Contabilizar exclusivamente referidos con correo confirmado (`confirmed_at IS NOT NULL`) y estado anti-abuso válido; ejecutar la concesión transaccional (`UPDATE users SET is_premium = TRUE, premium_until = ...` + `referral_rewards_log`) antes de encolar el email de notificación.

### [FUNC-051] Contradicción lógica de `last_sent_at` en el filtro de audiencia de reactivación

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_reactivation.py` (líneas 75 y 84)
- **Diagnóstico del Problema**:
  La consulta SQL que selecciona la cohorte objetivo de usuarios inactivos en `backend/send_reactivation.py` introduce condiciones contradictorias sobre el campo `last_sent_at` entre las líneas 75 y 84, generando una intersección vacía o incoherente respecto al periodo real de inactividad deseado.
- **Riesgo o Impacto**:
  Campañas de reactivación inoperantes que envían cero correos aunque existan miles de usuarios dormidos, o envíos duplicados a cohortes equivocadas rompiendo la cadencia de retención.
- **Solución Óptima Propuesta**:
  Separar claramente la fecha de último contacto comercial (`last_reactivation_sent_at` o tabla `email_deliveries`) de la última interacción del usuario (`last_active_at` / `last_login_at`), unificar la condición temporal en una única cláusula verificada mediante tests con datos sintéticos.

### [FUNC-052] Ausencia de idempotencia de entrega por destinatario y actualización prematura en alertas instantáneas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_custom_alerts.py` (líneas 1-299), `backend/send_instant_featured_alerts.py` (líneas 1-233) y `backend/send_welcome_onboarding.py` (líneas 1-346)
- **Diagnóstico del Problema**:
  Estos tres scripts de envío masivo no registran ni consultan de forma atómica una clave idempotente `(subscriber_id, campaign_type, job_id/window)` en `email_deliveries` antes y después de despachar cada mensaje; en particular, `send_instant_featured_alerts.py` actualiza marcadores con `COALESCE`/`UPDATE` de manera prematura respecto al resultado efectivo de la entrega SMTP.
- **Riesgo o Impacto**:
  Si el proceso se reinicia a mitad de ejecución por fallo de red o timeout, algunos suscriptores reciben el mismo correo por duplicado o triplicado mientras otros quedan permanentemente marcados como notificados sin haber recibido nunca la alerta destacada pagada por una empresa.
- **Solución Óptima Propuesta**:
  Adoptar un patrón de cola idempotente en `email_deliveries` (`UNIQUE KEY (recipient_id, campaign_key, entity_id)`): insertar primero en estado `queued` con `INSERT IGNORE`, enviar mediante SMTP capturando Message-ID y actualizar a `sent` o `failed` con contador de reintentos.

### [FUNC-053] Carga masiva en memoria sin paginación por cursor ni control de tasa SMTP en todos los mailers

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/mailer.py` (líneas 1-589) y los 7 scripts `backend/send_*.py` (`send_custom_alerts.py`, `send_instant_featured_alerts.py`, `send_reactivation.py`, `send_referral_notifications.py`, `send_saved_jobs_reminder.py`, `send_streak_reminder.py`, `send_welcome_onboarding.py`)
- **Diagnóstico del Problema**:
  Los scripts de correo ejecutan consultas sin paginación por cursor (`WHERE id > last_id LIMIT batch_size`), cargando listas enteras de destinatarios en memoria y disparando envíos síncronos secuenciales sin regulador de tasa ("rate limiter") ni reutilización controlada de sesiones SMTP o API transaccional en lote.
- **Riesgo o Impacto**:
  Agotamiento de memoria RAM en cron jobs conforme crezca la base de suscriptores, desconexiones por timeout del servidor SMTP (`421 Too many messages in one connection`) y saturación del ancho de banda saliente.
- **Solución Óptima Propuesta**:
  Procesar destinatarios mediante cursores por lotes de `100` registros, implementar un regulador de cuota (`N emails/segundo`) y migrar el despacho masivo hacia API HTTPS transaccional con soporte de envío por lotes (`Resend`, `Postmark`, `SES` o `Brevo`) y backoff exponencial ante `429`/`5xx`.

### [FUNC-054] Falta de coordinación multicanal y control de frecuencia entre Web Push y correo electrónico

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/send_push_notifications.py` (líneas 1-155), `backend/mailer.py` (líneas 1-589), `backend/send_custom_alerts.py` y `backend/send_instant_featured_alerts.py`
- **Diagnóstico del Problema**:
  El script de notificaciones Web Push (`send_push_notifications.py`) selecciona ofertas e invoca la API de notificaciones de forma completamente independiente de los scripts de mailing (`mailer.py`, `send_custom_alerts.py`, `send_instant_featured_alerts.py`, `send_saved_jobs_reminder.py`, `send_streak_reminder.py`), sin un registro común de impactos por usuario ni regla de "frequency capping".
- **Riesgo o Impacto**:
  Un mismo candidato suscrito simultáneamente a digest semanal, alertas personalizadas, ofertas destacadas y notificaciones push recibe múltiples alertas redundantes sobre las mismas vacantes en cuestión de horas, disparando cancelaciones y bloqueos de notificaciones en navegador.
- **Solución Óptima Propuesta**:
  Introducir una tabla central `notification_dispatch_log` compartida entre email, push y Telegram digest, estableciendo políticas declarativas de ventana mínima entre avisos por usuario (`min_interval_hours`) y deduplicación por `job_id`.

### [FUNC-055] Ausencia de automatización de rebotes SMTP que alimente `email_suppression_list`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/mailer.py` y los 7 scripts `backend/send_*.py`
- **Diagnóstico del Problema**:
  Ninguno de los 8 scripts de correo consulta `email_suppression_list` antes de enviar, ni existe un endpoint o webhook receptor de eventos de rebote duro ("hard bounce") o quejas de spam ("FBL complaints") desde el proveedor SMTP para insertar direcciones inválidas automáticamente en dicha lista de supresión.
- **Riesgo o Impacto**:
  Envíos repetidos semana tras semana a buzones inexistentes o usuarios que marcaron spam, deteriorando rápidamente la reputación IP/dominio de envío (`SPF`/`DKIM`/`DMARC`) hasta terminar en la carpeta de spam de Gmail y Outlook para todos los suscriptores legítimos.
- **Solución Óptima Propuesta**:
  1. Incorporar `LEFT JOIN email_suppression_list` (o `NOT EXISTS`) en la consulta base de todo script de envío.
  2. Crear un webhook autenticado `/api/webhooks/email-events` para procesar eventos `bounce`, `dropped` y `spamreport` del proveedor SMTP e insertar inmediatamente en `email_suppression_list` desactivando la suscripción afectada.

### [FUNC-056] Bots sociales sin registro centralizado de publicaciones ni reglas de rotación entre plataformas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/bluesky_bot.py`, `backend/twitter_bot.py`, `backend/linkedin_bot.py`, `backend/mastodon_bot.py`, `backend/pinterest_bot.py`, `backend/threads_bot.py`, `backend/telegram_bot.py` y `backend/telegram_digest.py`
- **Diagnóstico del Problema**:
  Cada bot selecciona de manera aislada un subconjunto arbitrario (`LIMIT 3` a `LIMIT 10`) de ofertas recientes según su propia consulta SQL sin consultar ni actualizar una tabla unificada `social_posts_log (job_id, platform, posted_at, external_post_id)` ni respetar límites de diversidad para evitar publicar varias vacantes seguidas de la misma empresa.
- **Riesgo o Impacto**:
  Publicación repetida de la misma oferta varias veces en el mismo canal tras reejecuciones del cron, saturación de feeds sociales con anuncios consecutivos del mismo agregador o empresa y pérdida de trazabilidad de qué canales impulsan clics reales.
- **Solución Óptima Propuesta**:
  Crear una tabla `social_posts_log` con restricción única `(job_id, platform)` y parámetro `utm_source=<platform>&utm_medium=social`; construir un selector curado común que priorice diversidad de empresas, salario visible y modalidad antes de distribuir a cada adaptador de red social.

### [FUNC-057] Bots de vídeo corto y largo basados en diapositivas estáticas mudas generadas con `ffmpeg`

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/youtube_shorts_bot.py` (líneas 1-390), `backend/tiktok_bot.py` (líneas 1-38), `backend/logic/image_generator.py`, `scripts/tiktok_bot.py` y `scripts/youtube_longform_bot.py`
- **Diagnóstico del Problema**:
  Las automatizaciones audiovisuales generan archivos MP4 estáticos y silenciosos concatenando tarjetas PNG simples producidas por `backend/logic/image_generator.py` mediante `ffmpeg`, sin pista de audio o locución sintetizada, sin música libre de derechos, sin subtítulos dinámicos ni métricas de finalización de subida válidas en varias plataformas.
- **Riesgo o Impacto**:
  Los algoritmos de YouTube Shorts y TikTok penalizan de inmediato el alcance orgánico de vídeos estáticos sin audio ni retención visual en los primeros 3 segundos, consumiendo CPU y cuota sin retorno significativo de tráfico.
- **Solución Óptima Propuesta**:
  Evolucionar la generación multimedia integrando síntesis de voz natural en español (TTS), subtítulos quemados estilo karaoke (`ASS`/`SRT`), transiciones ligeras con `ffmpeg` (`zoompan`), o pausar los scripts incompletos (`tiktok_bot.py` / `youtube_longform_bot.py`) hasta completar integración oficial OAuth con revisión de alcance real.

### [FUNC-058] Duplicación y divergencia de bots sociales entre `backend/` y `scripts/`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/bluesky_bot.py`, `backend/tiktok_bot.py`, `scripts/bluesky_bot.py`, `scripts/tiktok_bot.py` y `scripts/reddit_bot.py`
- **Diagnóstico del Problema**:
  Coexisten versiones duplicadas de los mismos bots sociales ubicadas simultáneamente en `backend/` y en `scripts/` con lógica e implementaciones divergentes, generando ambigüedad sobre cuál es la versión mantenida e invocada por los distintos crons del servidor.
- **Riesgo o Impacto**:
  Correcciones de bugs o mejoras de formato aplicadas únicamente en un directorio no llegan a producción si el cron ejecuta el homólogo de la otra carpeta, o peor aún, ambos crons publican contenido duplicado en las mismas cuentas sociales.
- **Solución Óptima Propuesta**:
  Consolidar todos los bots sociales bajo un único paquete `backend/social/` con clientes independientes por red social, eliminar los archivos huérfanos o duplicados en `scripts/` y centralizar su invocación desde un único punto de entrada CLI (`python -m backend.social.run --platform ...`).

### [FUNC-059] Generadores editoriales IA acoplados directamente a publicación sin validación factual contra SQL

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/generate_blog_post.py` (líneas 1-140), `backend/generate_market_report.py` (líneas 1-230), `backend/generate_news_post.py` (líneas 1-136), `backend/generate_podcast_script.py` (líneas 1-88), `backend/generate_trends_post.py` (líneas 1-202) y `backend/generate_weekly_article.py` (líneas 1-395)
- **Diagnóstico del Problema**:
  Los seis generadores de contenido editorial (artículos de blog, noticias, informes de mercado, guiones de podcast y tendencias) solicitan texto al modelo de IA y lo publican directamente sin pasar por un flujo de estados (`draft` -> `pending_review` -> `published`), ni contrastar las cifras salariales o de demanda citadas en el texto generado frente a agregados verificados de la base de datos.
- **Riesgo o Impacto**:
  Alucinaciones numéricas publicadas como informes propios de mercado del portal, noticias obsoletas o duplicadas temáticamente y artículos sin revisión humana con enlaces rotos o afirmaciones falsas.
- **Solución Óptima Propuesta**:
  Inyectar obligatoriamente estadísticas reales calculadas previamente desde SQL como contexto JSON restringido en el prompt, validar mediante esquema de salida y verificador automático que toda cifra porcentual o salarial citada coincida con el contexto proporcionado, y publicar en estado `draft` con previsualización en `/admin` antes de pasar a producción.

### [FUNC-060] Desconexión y falta de gestión de cuotas en scripts de indexación SEO

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/index_new_jobs.py` (líneas 1-108), `backend/index_now.py` y `backend/monitor_search_console.py` (líneas 1-261)
- **Diagnóstico del Problema**:
  Los procesos encargados de notificar altas/bajas a Google Indexing API, IndexNow y monitorizar Search Console corren como scripts cron desacoplados del momento real en que `main.py` inserta ofertas o `deactivate_expired_jobs.py` las da de baja, y carecen de un registro persistente de cuota diaria usada y cola priorizada para reintentar ante errores `429 Quota Exceeded`.
- **Riesgo o Impacto**:
  Retrasos innecesarios en notificar ofertas recién publicadas o caducadas a los buscadores y desperdicio de la cuota diaria de 200 URLs de Google Indexing API enviando ofertas que no tuvieron cambios o reintentando las mismas URLs fallidas cada ejecución.
- **Solución Óptima Propuesta**:
  Crear una tabla `indexing_queue (url, action_type, priority, status, attempts, next_retry_at)` alimentada automáticamente tras cada inserción/expiración/aprobación de vacante, procesando primero URLs patrocinadas y bajas `URL_DELETED` hasta respetar la cuota diaria persistida.

### [FUNC-061] Dependencia externa frágil de `logo.clearbit.com` sin caché persistente ni fallback determinista

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/company-logo`
- **Diagnóstico del Problema**:
  La resolución de logotipos corporativos delega en consultas hacia el servicio externo `logo.clearbit.com` sin almacenar una caché persistente en disco/almacenamiento propio de los logotipos ya resueltos ni gestionar el fallo silencioso o la discontinuación/limitación de la API gratuita de Clearbit mediante fallback local.
- **Riesgo o Impacto**:
  Degradación visual masiva con imágenes rotas en tarjetas de empleo, dependencia crítica de latencia externa en tiempos de carga y exposición continua de consultas salientes por cada dominio empresarial nuevo.
- **Solución Óptima Propuesta**:
  Cachear los logotipos descargados y validados en almacenamiento propio (con TTL de 30 días y verificación de tamaño/MIME real), reemplazar Clearbit progresivamente por múltiples proveedores con degradación elegante hacia monogramas SVG deterministas generados localmente con las iniciales y color de marca de la empresa.

### [FUNC-062] Asimetría en lógica de guardado y revocación de `CookieBanner` (`handleSaveCustom` y `purgeNonEssentialStorage`)

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 1-290)
- **Diagnóstico del Problema**:
  En `CookieBanner.tsx`, la función `handleSaveCustom` establece la bandera heredada `cookies_accepted = 'true'` siempre que cualquiera de las opciones (analítica O publicidad) quede marcada, manteniendo ambigüedad entre niveles granulares. Asimismo, `purgeNonEssentialStorage()` no elimina cookies de terceros o `HttpOnly`, ni invoca `OneSignal.User.PushSubscription.optOut()` cuando el usuario revoca el permiso previamente otorgado.
- **Riesgo o Impacto**:
  Elevación accidental de permisos si otro bloque lee la bandera global heredada `cookies_accepted === 'true'`, y persistencia activa de suscripciones push en OneSignal o cookies residuales después de que el usuario haya pulsado "Rechazar todo" o modificado sus preferencias.
- **Solución Óptima Propuesta**:
  Eliminar por completo la clave ambigua `cookies_accepted`, leer únicamente el objeto JSON granular tipado `{ essential: true, analytics: boolean, advertising: boolean, notifications: boolean }` con versión de política, invocar explícitamente `OneSignal.User.PushSubscription.optOut()` y expirar cookies no esenciales conocidas al revocar consentimiento.

### [FUNC-063] Ausencia de portal B2B de autogestión para empresas anunciantes tras completar pago

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts`, `frontend/app/api/checkout/newsletter/route.ts` y `frontend/app/api/webhooks/stripe/route.ts`
- **Diagnóstico del Problema**:
  Tras contratar una oferta destacada o patrocinio en la newsletter mediante Stripe Checkout, el portal carece de un área autenticada para anunciantes donde la empresa pueda consultar el estado de publicación, corregir erratas del texto, pausar una vacante ya cubierta antes de su vencimiento, renovar promoción o descargar su factura PDF.
- **Riesgo o Impacto**:
  Dependencia total de intervención manual por correo electrónico ante cualquier cambio mínimo solicitado por clientes de pago, reduciendo tasas de renovación recurrente B2B y sobrecargando la gestión operativa.
- **Solución Óptima Propuesta**:
  Generar un enlace de acceso autenticado ("magic link" por email corporativo o cuenta de empresa) vinculado a las órdenes Stripe que permita visualizar métricas de impresiones/clics (`track-click`), editar descripción/salario mientras esté activa, marcar como cubierta y enlazar con el Customer Portal de Stripe para facturas.

### [FUNC-064] Falta de capa de caché compartida con invalidación por etiquetas para rutas SSR de alto coste

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/page.tsx`, `frontend/app/trabajos/[sector]/page.tsx`, `frontend/app/tendencias/page.tsx` y `frontend/lib/salarios.ts`
- **Diagnóstico del Problema**:
  Las páginas programáticas y portada ejecutan agregaciones costosas (`COUNT`, agrupaciones sectoriales y cálculos de distribución) directamente contra MySQL cada vez que expira el intervalo temporal o se renderizan rutas paramétricas, sin utilizar caché compartida invalidable por eventos (`revalidateTag` / Redis) sincronizada con nuevas ingestas o aprobaciones de ofertas.
- **Riesgo o Impacto**:
  Picos innecesarios de carga en base de datos ante ráfagas de rastreadores SEO sobre miles de URLs de `/trabajos/[sector]` y retraso variable hasta que una oferta patrocinada recién aprobada se refleja en portada.
- **Solución Óptima Propuesta**:
  Envolver las consultas de portada, conteos sectoriales y agregados salariales en `unstable_cache` (o caché Redis) con tags granulares (`jobs:list`, `jobs:sector:<slug>`, `salaries:stats`) e invocar `revalidateTag` de forma selectiva desde el webhook de Stripe, moderación `/admin` y webhook final de `main.py`.

### [FUNC-065] Ausencia de endpoint de diagnóstico profundo (`/api/health`) y monitorización de frescura end-to-end

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/` (ausencia de ruta dedicada), `db_proxy.php`, `backend/run_all.py` y `deploy.sh`
- **Diagnóstico del Problema**:
  La arquitectura distribuida combina Next.js SSR, `db_proxy.php`, pool MySQL y pipelines Python programados (`backend/run_all.py`), pero carece de un endpoint `/api/health` autenticado o acotado capaz de comprobar conectividad real con MySQL/proxy, latencia de consulta, fecha de última oferta ingresada (`MAX(created_at)`) y estado reciente de ejecución de los scrapers.
- **Riesgo o Impacto**:
  Caídas silenciosas de `db_proxy.php`, expiración de certificados o detención silenciosa del cron `run_all.py` pueden pasar desapercibidas durante días mientras el frontend sirve respuestas vacías o cacheadas aparentemente normales (`200 OK`).
- **Solución Óptima Propuesta**:
  Implementar `GET /api/health` ligero (liveness para balanceador/Nginx) y `GET /api/health/deep` protegido por cabecera secreta interna que verifique ping SQL `< 100 ms`, frescura de ofertas `< 24 horas`, último run correcto en `scraper_runs` y estado de migraciones, conectándolo a monitorización externa con alertas automáticas.
