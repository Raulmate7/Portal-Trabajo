# 01. Auditoría de Bugs, Errores de Código y Calidad Técnica (`BUG-001` – `BUG-065`)

> **Alcance**: Backend (`backend/`, `scripts/`), Frontend (`frontend/app/`, `frontend/components/`, `frontend/lib/`), Capa de Datos y Pasarelas (`db_proxy.php`, `backend/psycopg2.py`, `frontend/lib/db.ts`).  
> **Total de hallazgos documentados**: 65 ítems individuales verificados sobre el código fuente actual.

---

### [BUG-001] `main.py` calcula `dedup_hash` pero omite la PK obligatoria `id`, `dedup_hash` y `work_mode` en `INSERT INTO jobs`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/main.py` (líneas 78, 149-167, función `save_jobs`) y `backend/database_optimization.sql` (línea 16)
- **Diagnóstico del Problema**:
  En `backend/database_optimization.sql:16`, la columna `jobs.id` está definida como `VARCHAR(255) PRIMARY KEY` sin cláusula `DEFAULT` ni `AUTO_INCREMENT`. Sin embargo, `backend/main.py:149-167` ejecuta `INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, sector_id, category, title_es, description_snippet_es, salary_min, salary_max, salary_currency, is_active)` omitiendo completamente `id`, `dedup_hash` (pese a haberlo calculado en la línea 78 mediante `compute_dedup_hash(company, title)`) y `work_mode`.
- **Riesgo o Impacto**:
  En MySQL 8 en modo estricto (`STRICT_TRANS_TABLES`), todas las inserciones de scrapers internacionales fallan con el error `1364 (HY000): Field 'id' doesn't have a default value`. Además, aunque el schema tuviera un UUID autogenerado en otro entorno, `dedup_hash` jamás se persiste en la base de datos.
- **Solución Óptima Propuesta**:
  Generar explícitamente un UUIDv4 (`str(uuid.uuid4())`) en Python para `id`, inferir `work_mode`, pasar `work_mode` a `compute_dedup_hash(company, title, work_mode)`, e incluir `id`, `dedup_hash` y `work_mode` en la sentencia `INSERT INTO jobs`.

### [BUG-002] Colapso de transacciones con `SELECT` o `FOR UPDATE` cuando `frontend/lib/db.ts` opera vía `db_proxy.php`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 337-340, método `pool.connect().query`) y `frontend/app/api/webhooks/stripe/route.ts` (líneas 113-116, 159-163, 302-306, 350, 386, 420)
- **Diagnóstico del Problema**:
  El wrapper `pool.connect()` en `frontend/lib/db.ts:337-340` lanza explícitamente el error `'Las lecturas SELECT intermedias dentro de transacciones no están soportadas vía db_proxy.php; use conexión MySQL directa.'` si detecta `SELECT` o `SHOW` mientras `inTransaction` es verdadero. Al mismo tiempo, `frontend/app/api/webhooks/stripe/route.ts` envuelve el procesamiento de webhooks de Stripe en `START TRANSACTION` seguido de consultas `SELECT ... FOR UPDATE`.
- **Riesgo o Impacto**:
  En despliegues que enrutan MySQL a través de `db_proxy.php` (`DB_PROXY_URL` configurado), el webhook de Stripe aborta con excepción en cada evento `checkout.session.completed`, impidiendo activar ofertas patrocinadas, suscripciones Candidato Premium y descargas de informes tras cobro real.
- **Solución Óptima Propuesta**:
  Exigir conexión TCP/Unix directa a MySQL para los endpoints críticos financieros mediante un cliente dedicado con pool persistente, o implementar bloqueo optimista basado en `UPDATE ... WHERE status = 'pendiente'` y `affectedRows === 1` cuando el proxy HTTP sea la única vía disponible.

### [BUG-003] Incompatibilidad de tipos UUID vs entero en aprobación y rechazo administrativo de ofertas

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts` (línea 86), `frontend/app/actions.ts` (línea 637), `frontend/app/admin/page.tsx` (línea 73) y `frontend/app/api/admin/jobs/route.ts` (líneas 17, 22)
- **Diagnóstico del Problema**:
  Tanto `frontend/app/api/checkout/route.ts:86` como `submitSponsoredJob` en `frontend/app/actions.ts:637` generan `jobs.id` mediante `crypto.randomUUID()` (cadena alfanumérica de 36 caracteres). Sin embargo, `frontend/app/admin/page.tsx:73` convierte el identificador con `Number(row.id)` (produciendo `NaN`), y `frontend/app/api/admin/jobs/route.ts:17-22` valida `const jobId = Number(body?.jobId); if (!Number.isInteger(jobId) || jobId <= 0 ...)`, rechazando cualquier UUID con HTTP 400.
- **Riesgo o Impacto**:
  El panel `/admin` queda completamente inoperativo para aprobar o rechazar ofertas enviadas desde `/publicar-oferta` o Checkout, mostrando identificadores `NaN` y provocando fallo sistemático al pulsar las acciones de moderación.
- **Solución Óptima Propuesta**:
  Tratar `jobs.id` de forma uniforme como cadena (`string` no vacío, validado mediante UUID/alfanumérico regex `/^[a-zA-Z0-9_-]{1,255}$/`) en `admin/page.tsx`, en los componentes cliente del panel admin y en `api/admin/jobs/route.ts`.

### [BUG-004] Sentencias SQL `RETURNING id` exclusivas de PostgreSQL en `/api/admin/jobs` sin traducción en el adaptador MySQL

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/admin/jobs/route.ts` (líneas 32, 50)
- **Diagnóstico del Problema**:
  Las consultas de aprobación y rechazo ejecutan `UPDATE jobs SET is_active = TRUE WHERE id = $1 RETURNING id` y `DELETE FROM jobs WHERE id = $1 AND is_active = FALSE RETURNING id`. Ni MySQL 8 ni `translatePostgresToMysql()` en `frontend/lib/db.ts` soportan la cláusula `RETURNING` en `UPDATE`/`DELETE`.
- **Riesgo o Impacto**:
  Incluso tras corregir la validación numérica de `jobId`, ambas sentencias lanzan un error de sintaxis SQL (`ER_PARSE_ERROR`) en MySQL y devuelven HTTP 500 en cada intento de moderación.
- **Solución Óptima Propuesta**:
  Eliminar `RETURNING id`, ejecutar primero `SELECT id FROM jobs WHERE id = $1` (o comprobar `result.rowCount > 0` devuelto por `mysql2`'s `affectedRows` tras `UPDATE`/`DELETE`) para determinar si la fila existía antes de responder HTTP 200 o 404.

### [BUG-005] `PostgresPipeline` en Scrapy omite `id`, contradice `autocommit=True` y reactiva ofertas cerradas

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/job_aggregator/pipelines.py` (líneas 48-87, `PostgresPipeline.process_item`) y `backend/db_helper.py` (línea 51)
- **Diagnóstico del Problema**:
  `PostgresPipeline.process_item()` inserta en `jobs` sin especificar la PK obligatoria `id`, lo que provoca fallo de inserción en MySQL estricto. Adicionalmente, llama a `self.connection.commit()` y `self.connection.rollback()` sobre una conexión devuelta por `db_helper.py:51` que fuerza `autocommit=True` (anulando la atomicidad de `rollback()`), y su cláusula `ON DUPLICATE KEY UPDATE` (línea 69) fuerza `is_active = TRUE` incondicionalmente.
- **Riesgo o Impacto**:
  Fallo total de persistencia del spider de Tecnoempleo en MySQL estricto o, en tablas con trigger/fallback, reactivación involuntaria de ofertas antiguas previamente moderadas o expiradas y silenciamiento de la excepción sin lanzar `DropItem`.
- **Solución Óptima Propuesta**:
  Inyectar `id`, `work_mode` y `dedup_hash` en el `INSERT`, abrir la conexión del pipeline con `autocommit=False` para transacciones reales, usar una subconsulta segura o valor por defecto si `sector_slug` no existe en `sectors`, y evitar reactivar filas con `is_active = FALSE` si fueron expiradas/moderadas.

### [BUG-006] `frontend/lib/jobs.ts` devuelve datos ficticios (`MOCK_JOBS` y `9197`) cuando una búsqueda devuelve 0 resultados

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/jobs.ts` (líneas 174-177, 201-204, 214-217, 235)
- **Diagnóstico del Problema**:
  En `getJobs()` (`174-177`), si `rows.length === 0`, la función retorna `MOCK_JOBS.filter(j => !j.is_featured)` en vez de `[]`. Lo mismo ocurre en `getFeaturedJobs()` (`201-204`), `getJobsCount()` (línea 214: `return count > 0 ? count : 9197`) y `getFilteredJobsCount()` (línea 235: `rows[0]?.count ? parseInt(...) : MOCK_JOBS.length`, donde `0` es falsy en JavaScript aunque se parsee, o devuelve `MOCK_JOBS.length` si `count` es `0` numérico).
- **Riesgo o Impacto**:
  Cualquier filtro sin coincidencias (por ejemplo, tecnología + ciudad + salario alto) o un error transitorio de BD oculta la realidad al usuario mostrando ofertas de ejemplo inventadas y contadores falsos (`9197`), corrompiendo métricas, enlaces rotos y estados vacíos de UI.
- **Solución Óptima Propuesta**:
  Devolver arrays vacíos `[]` y `0` real cuando la consulta SQL sea exitosa con cero resultados; usar `Number(rows[0]?.count ?? 0)` en lugar de evaluación booleana sobre `0`, y reservar los mocks exclusivamente para pruebas unitarias o entorno explícito sin BD configurada.

### [BUG-007] `scraper_infoempleo.py` omite la PK `id`, filtra conexiones abiertas en errores y usa N+1 queries

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/scraper_infoempleo.py` (líneas 94-112)
- **Diagnóstico del Problema**:
  La sentencia `INSERT INTO jobs` de la línea 94 omite `id`, `dedup_hash` y `work_mode`. Además, dentro del bucle de ofertas realiza consultas individuales de deduplicación (patrón N+1), mezcla gestión de `cur.close()`/`conn.close()` fuera de un bloque `try/finally` y captura excepciones generales dejando recursos abiertos si falla antes del final de `scrape_stratos`.
- **Riesgo o Impacto**:
  El scraper de Stratos falla al insertar cada oferta si `jobs.id` carece de valor por defecto, agota conexiones MySQL ante errores repetidos de red o parsing, y degrada el tiempo de ejecución dentro de `run_all.py`.
- **Solución Óptima Propuesta**:
  Generar `id` (UUIDv4), `work_mode` y `dedup_hash`, precargar los `url_source` y `dedup_hash` recientes en un conjunto en memoria para eliminar el N+1 y envolver el ciclo de vida de `conn` y `cur` en `try/finally` o un context manager.

### [BUG-008] `fetchCompanyRating()` en `/job/[id]` y `/api/admin/gdpr` consultan columnas inexistentes en `company_reviews`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (línea 512) y `frontend/app/api/admin/gdpr/route.ts` (líneas 45-48)
- **Diagnóstico del Problema**:
  El esquema de `company_reviews` (creado en `backend/consolidate_production_schema.py` y usado en `frontend/app/actions.ts:869`) contiene `company_slug`, `rating`, `review_text` y `role`, pero carece de las columnas `company_name` y `reviewer_email`. Sin embargo, `job/[id]/page.tsx:512` consulta `WHERE company_name = $1` y `api/admin/gdpr/route.ts:48` consulta `SELECT id, company_name, rating, review_text, created_at FROM company_reviews WHERE reviewer_email = $1`. Asimismo, `gdpr/route.ts:45` consulta la tabla `alerts`, inexistente en el esquema.
- **Riesgo o Impacto**:
  La valoración de empresas en la ficha de oferta falla silenciosamente en BD en cada carga de `/job/[id]` devolviendo siempre ausencia de reseñas, y los endpoints administrativos ARSOLP (`/api/admin/gdpr`) fallan con error `ER_BAD_FIELD_ERROR` / `ER_NO_SUCH_TABLE` al exportar o borrar datos.
- **Solución Óptima Propuesta**:
  Sustituir `company_name = $1` por `company_slug = $1` utilizando `slugify(job.company)` en `job/[id]/page.tsx`, eliminar consultas a la tabla inexistente `alerts` y alinear `company_reviews` y `review_reports` con sus columnas reales en `/api/admin/gdpr`.

### [BUG-009] `backend/cleanup_retention.py` intenta actualizar una columna inexistente (`double_opt_in_token`) y omite estados de moderación

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/cleanup_retention.py` (líneas 44-49 y limpieza de `review_reports`)
- **Diagnóstico del Problema**:
  El script de purga periódica ejecuta `UPDATE subscribers SET double_opt_in_token = NULL ... AND double_opt_in_token IS NOT NULL` (línea 46), columna que no existe en `subscribers` (la confirmación DOI en `/api/subscribe` usa tokens HMAC stateless sin columna dedicada). Además, purga `review_reports` filtrando solo `status IN ('resolved', 'dismissed')`, olvidando `'resolved_hidden'` utilizado por `/api/admin/gdpr`, y omite purgar `user_sessions` expiradas, `user_password_resets` usados, `email_deliveries` y `subscriber_job_notifications`.
- **Riesgo o Impacto**:
  La tarea de retención lanza excepción SQL (`Unknown column 'double_opt_in_token'`) en su bloque principal y deja acumular indefinidamente reportes resueltos con ocultación y sesiones/tokens caducados en MySQL.
- **Solución Óptima Propuesta**:
  Corregir la consulta de purga de suscriptores no confirmados eliminando o anonimizando por `status = 'pending_confirmation' AND confirmed_at IS NULL AND created_at < NOW() - INTERVAL 30 DAY`, añadir `'resolved_hidden'` al filtro de `review_reports` e incorporar limpieza para `user_sessions` y `user_password_resets`.

### [BUG-010] Regex duplicada con cuantificador opcional `k?` rompe `parseSector` para salarios sin sufijo `k`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 301-313, función `parseSector`)
- **Diagnóstico del Problema**:
  En `parseSector`, `salaryMatch1` usa `/salario-mas-de-(\d+)k?/i` donde la `k` es opcional (`k?`). Como resultado, una URL como `/trabajos/react-salario-mas-de-35000` coincide primero con `salaryMatch1`, captura `35000` y ejecuta `salaryMin = parseInt(salaryMatch1[1]) * 1000` (`35.000.000 €`), dejando la rama `else if (salaryMatch2)` de las líneas 309-313 como código completamente inalcanzable.
- **Riesgo o Impacto**:
  Todas las URLs programáticas de filtro salarial escritas con cifra completa (`/trabajos/java-salario-mas-de-40000`) filtran ofertas superiores a 40 millones de euros y devuelven cero vacantes con metadatos rotos.
- **Solución Óptima Propuesta**:
  Eliminar la opcionalidad `k?` en `salaryMatch1` (`/salario-mas-de-(\d+)k\b/i`) para que solo multiplique por `1000` cuando exista el sufijo literal `k`, dejando `salaryMatch2` para cantidades exactas con normalización `val < 1000 ? val * 1000 : val`.

### [BUG-011] `calculateSalaryStats()` en `frontend/lib/salarios.ts` destruye salarios `"40k - 55k €"`, formato inglés `"100,000"` e ignora `experience === 'mid'`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/salarios.ts` (líneas 120-200, función `calculateSalaryStats`)
- **Diagnóstico del Problema**:
  La lógica de extracción numérica sustituye todas las comas por puntos (`.replace(/,/g, '.')`) y aplica solo conversión mensual (`< 5000` multiplicado por `12`) sin resolver la letra `k`. De este modo, `"40k - 55k €"` se parsea como `40` y `55` -> promedio `47.5` -> `* 12 = 570 €`, descartado por `< 15000`; `"$100,000"` se convierte en `100.000` -> `100 * 12 = 1200 €`, también descartado. Por otro lado, la función solo filtra títulos por `experience === 'junior'` o `'senior'`, ignorando completamente el parámetro `experience === 'mid'`.
- **Riesgo o Impacto**:
  Las páginas `/salarios/[tecnologia]/[ciudad]/mid` devuelven exactamente las mismas métricas que sin filtro de nivel, y la mayoría de ofertas internacionales con formato `k` o coma de miles en USD/GBP quedan excluidas del cálculo estadístico.
- **Solución Óptima Propuesta**:
  Leer directamente las columnas normalizadas `salary_min` y `salary_max` de BD cuando existan, replicar el parser robusto europeo/anglosajón (`salary_parser.py`) para el fallback textual reconociendo `k` y tasas FX, e implementar las reglas de filtrado SQL/regex para `mid`.

### [BUG-012] `parseSalarySchema` en `/job/[id]` falla con strings `"40k"` y trata todos los valores `< 5000` como sueldo mensual

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 381-426, función `parseSalarySchema`)
- **Diagnóstico del Problema**:
  Cuando `salary_min` y `salary_max` en BD son `NULL`, `parseSalarySchema` extrae números con `\d+` ignorando si van seguidos de `k`/`K`, y descarta cualquier número inferior a `100`. Una cadena como `"40k - 55k"` produce `[40, 55]`, ambas rechazadas por `< 100`, devolviendo `null`. Además, si el número cae entre `100` y `5000` (por ejemplo, `"400 €/día"` freelance o `"90k"` mal limpiado), asigna incondicionalmente `unitText: "MONTH"`.
- **Riesgo o Impacto**:
  Omisión sistemática del bloque `baseSalary` en Schema.org `JobPosting` para miles de ofertas válidas o emisión de datos estructurados falsos (`900 €/mes`) frente a Google for Jobs.
- **Solución Óptima Propuesta**:
  Unificar el parsing de salarios en un helper compartido que interprete sufijos `k`, separadores de miles europeos/ingleses, indicadores de periodicidad (`/h`, `/día`, `/mes`, `/año`) y priorice `job.salary_min`/`salary_max` antes del texto libre.

### [BUG-013] `categorize_existing_jobs.py` invoca `cur.executemany`, método inexistente en `backend/psycopg2.py`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/categorize_existing_jobs.py` (líneas 2, 44, 51) y `backend/psycopg2.py` (clase `CursorWrapper`)
- **Diagnóstico del Problema**:
  `backend/categorize_existing_jobs.py` importa el módulo sombra local `backend/psycopg2.py` y llama en lotes de 500 filas a `cur.executemany("UPDATE jobs SET category = %s WHERE id = %s", updates)`. Sin embargo, la clase `CursorWrapper` definida en `backend/psycopg2.py` únicamente delega `execute`, `fetchone`, `fetchall`, `close` y carece de implementación o delegación para `executemany`.
- **Riesgo o Impacto**:
  Cualquier ejecución de `categorize_existing_jobs.py` con ofertas en `'Otros'` lanza `AttributeError: 'CursorWrapper' object has no attribute 'executemany'` y aborta la reclasificación sin cerrar la conexión en el bloque `except`.
- **Solución Óptima Propuesta**:
  Implementar el método `executemany(self, query, seq_of_params)` (y `__getattr__` o delegación explícita al cursor subyacente de `pymysql` tras adaptar marcadores/sintaxis) en `CursorWrapper` dentro de `backend/psycopg2.py`, y añadir `finally: conn.close()` en `categorize_existing_jobs.py`.

### [BUG-014] El adaptador `backend/psycopg2.py` sobrescribe credenciales DSN cuando `MYSQL_HOST` es localhost y descarta resultados `RETURNING`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/psycopg2.py` (líneas 1-259, `connect()` y `CursorWrapper`)
- **Diagnóstico del Problema**:
  Cuando la aplicación pasa un `DATABASE_URL` tipo PostgreSQL o MySQL, el shim `backend/psycopg2.py` puede sobrescribir parámetros con variables `MYSQL_*` locales por defecto, traduce exclusivamente expresiones `INTERVAL 'X hours/days'` dejando sin convertir otros dialectos (`ILIKE`, `RETURNING`, `::text`), y al eliminar `RETURNING` devuelve un cursor sin filas simuladas ante scripts que esperan `.fetchone()`.
- **Riesgo o Impacto**:
  Comportamientos erráticos en scripts heredados que usan `import psycopg2`, fallos SQL silenciosos por `ILIKE` no traducido (como ocurre en `generate_market_report.py:55`), y fallos de conexión en entornos donde coexisten `DATABASE_URL` y `MYSQL_HOST` por defecto.
- **Solución Óptima Propuesta**:
  Migrar todos los scripts backend a `db_helper.get_db_connection()` con SQL nativo de MySQL 8 (eliminando `psycopg2.py` y reemplazando `ILIKE` por `LOWER(col) LIKE ...` / `FULLTEXT`), o corregir el orden de precedencia DSN vs env y añadir traducción explícita de `ILIKE`.

### [BUG-015] `deactivate_expired_jobs.py` desactiva 200 ofertas y solo desindexa en Google las primeras 40, dejando 160 huérfanas

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (líneas 51-95)
- **Diagnóstico del Problema**:
  En la línea 56 consulta hasta 200 ofertas con `is_active = 1 AND created_at < expiration_limit`. Acto seguido, en las líneas 73-77 marca las 200 ofertas como `is_active = 0` en MySQL. Sin embargo, el bucle de envío a Google Indexing API en la línea 94 itera solo sobre `expired_jobs[:40]`. En la siguiente ejecución diaria, la consulta del paso 3 ya no seleccionará las 160 ofertas restantes porque su `is_active` ya pasó a `0`.
- **Riesgo o Impacto**:
  Si en un día caducan más de 40 ofertas (algo frecuente tras lotes diarios de scrapers), el excedente jamás notifica `URL_DELETED` a Google Search Console, acumulando advertencias de vacantes expiradas en índice.
- **Solución Óptima Propuesta**:
  Separar la cola de desindexación mediante una columna específica `google_deindexed_at DATETIME NULL` o limitar el `UPDATE jobs SET is_active = 0` exclusivamente a los lotes efectivamente procesados y confirmados, manteniendo `LIMIT` coherente con la cuota diaria de Indexing API.

### [BUG-016] `deactivate_expired_jobs.py` aborta toda expiración y purga si no existe `CRON_SECRET`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (líneas 16-21)
- **Diagnóstico del Problema**:
  Al inicio de `deactivate_expired_jobs()`, si `CRON_SECRET` no está definido en el entorno, el script imprime un mensaje y ejecuta `return` temprano en la línea 21. De este modo detiene también las tareas internas de BD que no dependen de HTTP (`/api/index-job`), como expirar ofertas `is_featured` vencidas, desactivar vacantes >100 días, chequear enlaces muertos y purgar checkouts abandonados.
- **Riesgo o Impacto**:
  Un fallo o rotación incompleta de `CRON_SECRET` en el entorno cron de Python congela toda la limpieza de base de datos, permitiendo que ofertas destacadas caducadas sigan mostrando insignia `is_featured = 1` indefinidamente.
- **Solución Óptima Propuesta**:
  Ejecutar todas las fases de mantenimiento interno de MySQL de forma independiente a la disponibilidad de `CRON_SECRET`, omitiendo únicamente el paso HTTP hacia `/api/index-job` con un aviso de advertencia si falta el secreto.

### [BUG-017] `backend/run_all.py` carece de `load_dotenv()` y aplica un `timeout=180` único a todo el pipeline

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/run_all.py` (líneas 1-35, 40, 140-220)
- **Diagnóstico del Problema**:
  `backend/run_all.py` importa `os`, `sys`, `time` y `subprocess`, pero no llama a `dotenv.load_dotenv()` para cargar `backend/.env` antes de leer variables o comprobar rutas. Asimismo, `run_cmd(args, timeout_sec=180)` fija un máximo de 180 segundos para procesos largos como `main.py` (7 scrapers secuenciales + llamadas síncronas a `GoogleTranslator` de hasta 8s por texto) o `mailer.py` (envíos SMTP por lotes).
- **Riesgo o Impacto**:
  Cuando las APIs externas responden lento o crece la lista de suscriptores, `subprocess.run(..., timeout=180)` mata a mitad de ejecución al scraper o al mailer, cortando envíos sin registrar checkpoints por suscriptor o dejando traducciones incompletas.
- **Solución Óptima Propuesta**:
  Invocar `load_dotenv()` al inicio, asignar timeouts diferenciados por tarea (por ejemplo 600s para `main.py` y `mailer.py`, 60s para bots), y desacoplar los envíos de email en colas reanudables idempotentes en cron independientes.

### [BUG-018] `backend/logic/translator.py` mantiene circuit breaker global no thread-safe y crea un `ThreadPoolExecutor` por llamada

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/translator.py` (líneas 6-9, 31, 65-67)
- **Diagnóstico del Problema**:
  `translate_text()` muta variables globales de módulo `_CONSECUTIVE_FAILURES` y `_CIRCUIT_OPEN_UNTIL` sin `threading.Lock`, e instancia `with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:` dentro de cada invocación individual (creando y destruyendo un hilo de sistema por cada título o descripción). Adicionalmente, si `future.result(timeout=8.0)` agota el tiempo, la salida del bloque `with` llama implícitamente a `executor.shutdown(wait=True)`, bloqueando al hilo principal hasta que la petición colgada en `deep_translator` termine por sí sola sin timeout en `requests`.
- **Riesgo o Impacto**:
  Un cuelgue de DNS o TCP contra Google Translate dentro de `deep_translator` bloquea `ThreadPoolExecutor.__exit__` indefinidamente por mucho más de 8 segundos, provocando que `run_all.py` termine matando `main.py` por `TimeoutExpired`.
- **Solución Óptima Propuesta**:
  Configurar un timeout de socket/sesión real o usar un servicio de traducción con API oficial y timeout HTTP explícito; no usar `with ThreadPoolExecutor` alrededor de tareas no cancelables (`shutdown(wait=False)` tras `TimeoutError`) y proteger el estado del circuit breaker con `threading.Lock`.

### [BUG-019] 7 scripts de envío de correo llaman a `smtplib.SMTP`/`SMTP_SSL` sin parámetro `timeout`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_custom_alerts.py` (212-214), `backend/send_instant_featured_alerts.py` (165-167), `backend/send_reactivation.py` (102-104), `backend/send_referral_notifications.py` (172-174), `backend/send_welcome_onboarding.py` (259-261), `backend/send_saved_jobs_reminder.py` (225) y `backend/send_streak_reminder.py` (229)
- **Diagnóstico del Problema**:
  A diferencia de `backend/mailer.py:315-317` (que pasa `timeout=30`), todos los demás scripts de correo abren la conexión SMTP mediante `smtplib.SMTP(host, port)` o `smtplib.SMTP_SSL(host, port)` sin especificar `timeout`. En Python, el timeout por defecto es `None` (socket bloqueante infinito salvo keepalive del kernel).
- **Riesgo o Impacto**:
  Una caída silenciosa o microcorte del relay SMTP deja el proceso congelado indefinidamente consumiendo el slot de cron o agotando el timeout global de 180s de `run_all.py`.
- **Solución Óptima Propuesta**:
  Extraer una factoría SMTP común en `backend/logic/mailer_client.py` (con `timeout=30`, `starttls()`, reintentos por micro-lotes y cierre garantizado) reutilizada por los 8 scripts.

### [BUG-020] `send_referral_notifications.py` actualiza `referrals_notified_count` aunque falle el envío SMTP y pierde filtros en su `except`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_referral_notifications.py` (líneas 188-246)
- **Diagnóstico del Problema**:
  En primer lugar, si falla la consulta de `referrals_notified_count` (línea 200), el bloque `except Exception:` ejecuta `SELECT id FROM subscribers WHERE email = %s` eliminando las restricciones `is_active = TRUE` y `NOT LIKE '%@deleted.local'`. En segundo lugar, el bloque de `UPDATE subscribers SET referrals_notified_count = %s` (líneas 237-243) se ejecuta fuera del `if smtp_active:` e incluso cuando `server.send_message(msg)` lanzó una excepción en la línea 230. Por último, aunque el asunto promete `"Acceso Premium Activado"` (línea 223), el script jamás ejecuta `UPDATE subscribers SET is_premium = TRUE`.
- **Riesgo o Impacto**:
  Los usuarios que alcanzaron 3 referidos nunca reciben el acceso Premium prometido en base de datos, y cualquier fallo temporal SMTP los marca como notificados permanentemente sin volver a reintentar el envío.
- **Solución Óptima Propuesta**:
  Ejecutar el `UPDATE referrals_notified_count` (y `is_premium = TRUE` cuando `actual_count >= 3`) únicamente dentro del flujo exitoso tras confirmación SMTP y dentro de la misma condición; restringir el conteo de `referred_by` solo a referidos confirmados (`confirmed_at IS NOT NULL AND is_active = TRUE`).

### [BUG-021] `db_proxy.php` trunca silenciosamente resultados a 1.000 filas afectando a Sitemaps, Imágenes y Tendencias

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `db_proxy.php` (líneas 421, 450), `frontend/app/sitemap.ts` (líneas 322, 669, 701), `frontend/app/sitemap-images.xml/route.ts` (línea 34) y `frontend/app/tendencias/page.tsx` (línea 136)
- **Diagnóstico del Problema**:
  `db_proxy.php` impone un tope duro `$max_rows = 1000` al recoger resultados con `$stmt->fetchAll()`, truncando cualquier respuesta mayor sin devolver ni cabecera ni flag de error indicando el corte. Varias consultas críticas del frontend solicitan `LIMIT 1500`, `LIMIT 5000` o `LIMIT 8000`.
- **Riesgo o Impacto**:
  Cuando el sitio supera las 1.000 ofertas activas detrás del proxy HTTP, `/sitemap/1.xml` y `/sitemap-images.xml` pierden hasta el 87,5% de sus URLs sin registrar ningún error en logs, mientras `/sitemap/2.xml` (`OFFSET 8000`) devuelve vacío y `/tendencias` calcula estadísticas sesgadas sobre 1.000 filas.
- **Solución Óptima Propuesta**:
  Alinear las páginas con paginación por lotes (`LIMIT 1000 OFFSET ...`) cuando se use el proxy o devolver un metadato `truncated: true` / código de error si la consulta exige más registros de los soportados, y preferir acceso MySQL directo con cursor o paginación SQL agregada para `/tendencias`.

### [BUG-022] `frontend/lib/db.ts` no almacena el pool en `globalThis` y no hace `ROLLBACK` automático en `release()`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 190-370)
- **Diagnóstico del Problema**:
  `mysqlPool` se crea a nivel de módulo sin adherirse a `globalThis` en modo desarrollo/HMR, creando nuevos pools con cada recarga en caliente de Next.js. Adicionalmente, `client.release()` en modo MySQL directo libera la conexión al pool sin comprobar si quedó una transacción abierta o fallida pendiente de `ROLLBACK` cuando el llamador olvida capturarlo.
- **Riesgo o Impacto**:
  Agotamiento prematuro de `max_connections` en MySQL durante desarrollo o tráfico concurrente con transacciones interrumpidas, y posible contaminación de estado transaccional si una conexión prestada conserva locks o cambios sin cerrar al volver al pool.
- **Solución Óptima Propuesta**:
  Persistir el singleton del pool en `globalThis` cuando `!useProxy`, y en `pool.connect()` rastrear el estado `inTransaction` también para conexión directa para ejecutar un `await connection.rollback()` automático en `release()` si no hubo `COMMIT`.

### [BUG-023] `backend/generate_market_report.py` utiliza operador SQL `ILIKE` incompatible con MySQL 8

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/generate_market_report.py` (línea 55) y `backend/psycopg2.py`
- **Diagnóstico del Problema**:
  La consulta de análisis tecnológico ejecuta `WHERE is_active = TRUE AND (title ILIKE %s OR description_snippet ILIKE %s)`. `ILIKE` es un operador exclusivo de PostgreSQL no soportado por la sintaxis estándar de MySQL 8 ni reescrito por `backend/psycopg2.py`.
- **Riesgo o Impacto**:
  Lanza `pymysql.err.ProgrammingError (1064): You have an error in your SQL syntax near 'ILIKE ...'` al generar el informe de mercado en producción MySQL, haciendo que el paso `[7.5.4/9]` de `run_all.py` falle sistemáticamente.
- **Solución Óptima Propuesta**:
  Reemplazar `ILIKE` por `LOWER(title) LIKE LOWER(%s)` (o `LIKE %s` aprovechando colaciones `utf8mb4_unicode_ci` case-insensitive en MySQL) y migrar el script directamente a `db_helper.get_db_connection()`.

### [BUG-024] `generate_weekly_article.py` anuncia en logs un modelo Gemini distinto al que realmente invoca y expone la clave en la URL

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/generate_weekly_article.py` (líneas 243, 302) y `backend/generate_podcast_script.py` (línea 39)
- **Diagnóstico del Problema**:
  `generate_weekly_article.py` construye en la línea 243 el endpoint `.../models/gemini-2.5-flash:generateContent?key=${api_key}`, mientras en la línea 302 registra en consola `"Llamando a la API de Gemini (gemini-1.5-pro)..."`. Asimismo, tanto este script como `generate_podcast_script.py:39` envían `api_key` como query parameter `?key=...` en lugar de usar la cabecera HTTP `x-goog-api-key` (a diferencia de `generate_news_post.py:58`).
- **Riesgo o Impacto**:
  Desconcierto en observabilidad al depurar costes o calidad del contenido editorial y riesgo de exposición accidental de `GEMINI_API_KEY` en excepciones de `requests` o logs de proxies HTTP salientes.
- **Solución Óptima Propuesta**:
  Centralizar la llamada a Gemini en un módulo único `backend/logic/gemini_client.py` que autentique exclusivamente mediante cabecera `x-goog-api-key`, configure modelo por variable de entorno `GEMINI_MODEL` y registre exactamente el modelo invocado.

### [BUG-025] `generate_trends_post.py` define un esquema parcial de `blog_posts` y oculta errores con `except:` desnudo

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/generate_trends_post.py` (líneas 36-47, 112)
- **Diagnóstico del Problema**:
  En la línea 36 ejecuta `CREATE TABLE IF NOT EXISTS blog_posts` con un subconjunto mínimo de columnas, desalineado si otros procesos esperan índices/columnas añadidas por `consolidate_production_schema.py`. Adicionalmente, la línea 112 captura excepciones mediante un `except:` desnudo (que intercepta incluso `KeyboardInterrupt` o errores graves de sintaxis/conexión).
- **Riesgo o Impacto**:
  Degradación silenciosa al publicar artículos de tendencias con conteos erróneos `0` cuando falla la consulta de los últimos 7 días, y posible ocultamiento de fallos de esquema en despliegues limpios.
- **Solución Óptima Propuesta**:
  Eliminar la creación DDL ad-hoc dentro de scripts generadores dejando todo el DDL exclusivamente en `consolidate_production_schema.py`, y reemplazar el `except:` desnudo por `except Exception as e:` con registro explícito de errores.

### [BUG-026] `generate_blog_post.py` sufre condición de carrera TOCTOU en `SELECT` + `INSERT`/`UPDATE`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/generate_blog_post.py` (líneas 108-130)
- **Diagnóstico del Problema**:
  El script ejecuta primero `SELECT id FROM blog_posts WHERE slug = %s` y luego decide en Python si hacer `UPDATE` o `INSERT`. Esta comprobación no atómica difiere de `generate_news_post.py` y `generate_trends_post.py`, que ya usan `ON DUPLICATE KEY UPDATE`. Por otra parte, el cálculo de porcentaje de modalidades en `generate_blog_post.py` puede dividir entre cero o quedar inconsistente si entre ambas consultas `SELECT COUNT(*)` cambian las filas activas.
- **Riesgo o Impacto**:
  Si dos ejecuciones se solapan manualmente o vía cron, la segunda falla por violación de clave primaria `PRIMARY` sobre `slug` (`IntegrityError`), y las métricas de mercado del post mensual pueden sumar porcentajes incoherentes.
- **Solución Óptima Propuesta**:
  Consolidar lectura de métricas en una única consulta agregada `SUM(CASE WHEN ... END)` y sustituir el patrón `SELECT + IF INSERT ELSE UPDATE` por una sentencia atómica `INSERT INTO blog_posts ... ON DUPLICATE KEY UPDATE`.

### [BUG-027] `bluesky_bot.py` y `twitter_bot.py` capturan excepciones globales con `except:` desnudo

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/bluesky_bot.py` (línea 178) y `backend/twitter_bot.py` (línea 232)
- **Diagnóstico del Problema**:
  Ambos bots sociales utilizan bloques `except:` sin especificar clase de excepción para silenciar errores de cierre de conexión o fallos inesperados al final de su ejecución, además de no garantizar la limpieza de imágenes temporales (`temp_card_*.jpg`) dentro de `finally` ante excepciones previas al envío.
- **Riesgo o Impacto**:
  Capturan señales de sistema como `SystemExit` o `KeyboardInterrupt`, ocultan fugas de ficheros JPG temporales en el disco de trabajo y dificultan diagnosticar caídas en `run_all.py`.
- **Solución Óptima Propuesta**:
  Utilizar gestores `try/finally` tanto para la conexión/cursor MySQL como para `os.remove(image_path)` (o `tempfile.NamedTemporaryFile`), y capturar solo `Exception as e` con logging estructurado.

### [BUG-028] `youtube_shorts_bot.py` utiliza atributo interno `requests.models.json` y cierra conexión en múltiples puntos manuales

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/youtube_shorts_bot.py` (líneas 228, 304-355, 385-386)
- **Diagnóstico del Problema**:
  En la línea 228, el bot serializa los metadatos del vídeo usando `requests.models.json.dumps(metadata)` apoyándose en una re-exportación interna privada de `requests` en vez de `import json`. Además, repite manualmente llamadas a `cur.close(); conn.close()` en cuatro salidas anticipadas (`return`) distintas (`304, 331, 344, 354`), pudiendo filtrar conexiones abiertas si se lanza una excepción no prevista entre la línea 308 y la 385.
- **Riesgo o Impacto**:
  Incompatibilidad futura ante actualizaciones menores de `requests` y fuga de conexiones MySQL cuando `build_shorts_video()` o `generate_shorts_card()` arrojen excepciones fuera de sus bloques internos.
- **Solución Óptima Propuesta**:
  Importar `json` de la biblioteca estándar y encapsular el ciclo completo de BD con un context manager o un único `finally` que cierre cursor y conexión de manera garantizada.

### [BUG-029] Scripts duplicados y stubs inactivos en `scripts/` y `backend/` engañan al orquestador y logs

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/tiktok_bot.py` (líneas 1-38), `scripts/tiktok_bot.py` (líneas 1-34), `scripts/youtube_longform_bot.py` (líneas 1-23), `scripts/reddit_bot.py` (líneas 1-40) y `scripts/bluesky_bot.py` (líneas 1-29)
- **Diagnóstico del Problema**:
  Coexisten implementaciones duplicadas o de maqueta: `scripts/tiktok_bot.py` y `scripts/youtube_longform_bot.py` simulan éxito devolviendo `True` y registrando en log `"Uploaded video ... successfully"` sin realizar ninguna petición HTTP real ni integrar APIs OAuth. En `backend/tiktok_bot.py`, la función retorna `False` con un warning si alguien activa `ENABLE_TIKTOK_BOT=true`, y `scripts/bluesky_bot.py` duplica la funcionalidad real de `backend/bluesky_bot.py`.
- **Riesgo o Impacto**:
  Equipos o automatizaciones futuras pueden asumir que TikTok o YouTube Longform publican vídeos reales al ver código existente y logs falsos de éxito, generando errores operacionales.
- **Solución Óptima Propuesta**:
  Eliminar los stubs simulados en `scripts/` o unificarlos en `backend/` detrás de contratos explícitos `NotImplementedError` cuando no haya integración productiva, actualizando la documentación de cron/orquestación.

### [BUG-030] `LoadMoreJobs.tsx` sufre cierre obsoleto (*stale closure*) al omitir `withSalary` y `sort` en `useCallback`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/LoadMoreJobs.tsx` (líneas 55-91, hook `loadMore`)
- **Diagnóstico del Problema**:
  El `useCallback` de `loadMore` construye `URLSearchParams` utilizando `withSalary` (línea 67) y `sort` (línea 68), pero su array de dependencias en la línea 91 solo lista `[loading, q, location, minSalary, modality, dateRange, experience, page, lang]`, omitiendo `withSalary` y `sort`. Además, el `IntersectionObserver` de las líneas 94-100 depende de `document.getElementById('infinite-scroll-sentinel')` en vez de un `useRef` nativo.
- **Riesgo o Impacto**:
  Cuando el usuario cambia la ordenación (`sort`) o activa `"Solo con salario"` (`withSalary`), la paginación infinita puede invocar una referencia memorizada con valores antiguos y mezclar ofertas sin filtrar ni ordenar dentro de la lista actual.
- **Solución Óptima Propuesta**:
  Incluir `withSalary` y `sort` en el array de dependencias de `loadMore`, incorporar `AbortController` para cancelar peticiones en vuelo al cambiar filtros, y usar `useRef<HTMLDivElement>` para observar el elemento centinela.

### [BUG-031] `RootLayout` borra a la fuerza `localStorage.getItem('theme')` en cada carga de página

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/layout.tsx` (líneas 199-213, script `#theme-initializer`) y `frontend/app/cookies/page.tsx` (líneas 84-89)
- **Diagnóstico del Problema**:
  El script en línea `#theme-initializer` dentro de `<head>` ejecuta `try { localStorage.removeItem('theme'); } catch(e) {}` en cada renderizado de página e impone únicamente `prefers-color-scheme: dark`. Esto invalida cualquier selección manual previa de tema que el usuario o componentes pudieran guardar y contradice la Política de Cookies (`cookies/page.tsx:84`), que declara explícitamente la clave `theme` con caducidad de `"1 año"`.
- **Riesgo o Impacto**:
  Imposibilidad real de mantener preferencias manuales de contraste/tema por parte del usuario y discrepancia técnica frente al inventario legal declarado.
- **Solución Óptima Propuesta**:
  Respetar `localStorage.getItem('theme')` cuando tenga `'dark'` o `'light'`, recurriendo a `matchMedia('(prefers-color-scheme: dark)')` solo si el usuario no ha fijado preferencia explícita (o retirar `theme` del inventario legal si no se soporta selector manual).

### [BUG-032] Fallback `cookies_accepted === 'true'` en `layout.tsx` y `CookieBanner.tsx` anula selecciones granulares ante fallo de parsing

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 170-188, 238) y `frontend/app/layout.tsx` (líneas 181-186, 250-255)
- **Diagnóstico del Problema**:
  Al guardar preferencias personalizadas en `handleSaveCustom` (`CookieBanner.tsx:238`), si el usuario solo acepta `analytics: true` y rechaza `advertising: false`, el banner escribe `localStorage.setItem('cookies_accepted', 'true')`. Si `cookies_consent` estuviera corrupto o ausente, tanto `layout.tsx:181,250` como `CookieBanner.tsx:182` leen `cookies_accepted === 'true'` y habilitan a la vez `analytics`, `advertising` (`ad_storage`, `ad_user_data`, `ad_personalization`) y `notifications`.
- **Riesgo o Impacto**:
  Elevación indebida de permisos de publicidad personalizada y notificaciones push cuando un usuario había rechazado expresamente la categoría publicitaria o ante estados heredados antiguos.
- **Solución Óptima Propuesta**:
  Deprecar definitivamente la clave booleana ambigua `cookies_accepted`; si `cookies_consent` falla al parsearse, aplicar fail-closed (`analytics: false, advertising: false`) y volver a mostrar el banner.

### [BUG-033] `actions.ts` descartando columnas RGPD en el fallback de inserción de suscriptores

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (líneas 382-403, `subscribeUser`)
- **Diagnóstico del Problema**:
  `subscribeUser` envuelve el `INSERT INTO subscribers` con columnas de consentimiento en un `try/catch` que, ante cualquier error SQL (no solo columna faltante), reintenta una inserción reducida (`391-401`) omitiendo `consent_timestamp`, `consent_ip_hash`, `consent_policy_version` y `marketing_accepted`.
- **Riesgo o Impacto**:
  Un fallo transitorio, truncado o de restricción en el primer intento provoca la inserción de suscriptores activos sin registro de consentimiento ni preferencia de marketing, destruyendo la trazabilidad sin alertar en logs de qué falló en el primer `INSERT`.
- **Solución Óptima Propuesta**:
  Eliminar el fallback silencioso que degrada la integridad de datos; validar el esquema en arranque/migración y capturar únicamente errores específicos para registrar alerta crítica sin insertar filas huérfanas de consentimiento.

### [BUG-034] `/api/checkout` inserta borrador en `jobs` sin `type: 'sponsored_job'` en los metadatos de Stripe

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts` (líneas 86-160) y `frontend/app/api/webhooks/stripe/route.ts` (línea 628)
- **Diagnóstico del Problema**:
  `frontend/app/api/checkout/route.ts` crea una fila inactiva en `jobs` antes del pago y configura en la sesión de Stripe `metadata: { jobId, plan, affiliate_code, company_email }`, omitiendo `type: 'sponsored_job'`. En cambio, otros flujos (`/api/checkout/premium-candidate`, `/api/checkout/report`) sí fijan explícitamente `type`, y `webhooks/stripe/route.ts:628` filtra explícitamente `if (session?.metadata?.type === 'sponsored_job' && session.metadata?.jobId)` para revertir reembolsos y disputas.
- **Riesgo o Impacto**:
  Ante un reembolso (`charge.refunded`) o disputa (`charge.dispute.created`) sobre una oferta patrocinada pagada por `/api/checkout`, la condición `session?.metadata?.type === 'sponsored_job'` se evalúa falsa y la oferta fraudulenta o reembolsada sigue publicada y destacada (`is_active = TRUE, is_featured = TRUE`).
- **Solución Óptima Propuesta**:
  Añadir `type: 'sponsored_job'` al `metadata` de la sesión Stripe en `/api/checkout/route.ts` y mantener en el webhook un fallback compatible con `Boolean(session?.metadata?.jobId && !session?.metadata?.type)`.

### [BUG-035] `/api/unsubscribe` intenta actualizar una tabla inexistente `alerts` y columnas inexistentes `is_active` en recordatorios

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (líneas 230-234) y `backend/consolidate_production_schema.py`
- **Diagnóstico del Problema**:
  El endpoint `POST /api/unsubscribe` lanza consultas `UPDATE alerts SET is_active = FALSE WHERE email = $1`, `UPDATE saved_jobs_reminders SET is_active = FALSE WHERE email = $1` y `UPDATE streak_reminders SET is_active = FALSE WHERE email = $1`. La tabla `alerts` no existe en `consolidate_production_schema.py`, y las tablas `saved_jobs_reminders` y `streak_reminders` tampoco tienen columna `is_active` (registran solo envíos históricos como `email`, `sent_at`, `date_sent`).
- **Riesgo o Impacto**:
  Errores SQL repetidos en cada solicitud de baja (silenciados o dependientes de bloques tolerantes) y acoplamiento roto entre la API de bajas del frontend y las tablas reales de recordatorios del backend.
- **Solución Óptima Propuesta**:
  Depurar el endpoint `/api/unsubscribe` eliminando referencias a la tabla inexistente `alerts`, consultar y respetar siempre `email_suppression_list` desde `send_saved_jobs_reminder.py` y `send_streak_reminder.py`, y unificar el estado en `subscribers` + `users`.

### [BUG-036] `send_referral_notifications.py` evalúa referidos sin confirmar (`confirmed_at IS NULL`) e ignora `email_suppression_list`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_referral_notifications.py` (líneas 148-153, 188-194)
- **Diagnóstico del Problema**:
  La agregación de referidos (`SELECT referred_by, COUNT(*) FROM subscribers WHERE referred_by IS NOT NULL AND referred_by != '' GROUP BY referred_by`) cuenta cualquier registro en `subscribers` independientemente de que el referido haya confirmado su correo (`confirmed_at IS NOT NULL`) o se haya dado de baja (`is_active = FALSE`). Asimismo, ni consulta `email_suppression_list` ni respeta `users.email_notifications_enabled = FALSE`.
- **Riesgo o Impacto**:
  Contadores inflados con emails falsos o bots no confirmados y envío indebido de correos a usuarios que revocaron su consentimiento en `/mi-perfil`.
- **Solución Óptima Propuesta**:
  Añadir `AND is_active = TRUE AND confirmed_at IS NOT NULL` en el cálculo de referidos y filtrar el remitente referente por `email_suppression_list` y `users.email_notifications_enabled`.

### [BUG-037] `deactivate_expired_jobs.py` aplica `rollback()` ineficaz sobre `autocommit=True` y solo verifica `HEAD` en 25 enlaces

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (líneas 45, 82, 148-171, 223) y `backend/db_helper.py` (línea 51)
- **Diagnóstico del Problema**:
  `deactivate_expired_jobs.py` llama a `conn.rollback()` en múltiples bloques `except` (`45, 82, 223`), pero obtiene la conexión de `db_helper.get_db_connection()` que establece `autocommit=True` por defecto. En paralelo, el comprobador de enlaces muertos (`148-166`) únicamente lanza `requests.head()` sobre `LIMIT 25` ofertas, mientras muchos ATS corporativos (Greenhouse, Lever, Workday, InfoJobs tras Cloudflare) responden `405 Method Not Allowed` o `403` a `HEAD` y los `404` por soft-redirect a página genérica de empleo no devuelven HTTP `404`/`410`.
- **Riesgo o Impacto**:
  Las reversiones transaccionales (`rollback()`) tras fallos parciales no surten efecto real en MySQL, y la tasa de detección de enlaces muertos (`25` por corrida) no escala para limpiar un catálogo de miles de ofertas activas.
- **Solución Óptima Propuesta**:
  Deshabilitar `autocommit` cuando se requiera atomicidad o eliminar bloques multi-paso que simulen rollback sin transacción; mejorar el dead-link checker con fallback `GET` ligero (`stream=True`) para códigos `405`, detección de patrones `"oferta cerrada"` y columna `last_checked_at` para rotar todo el catálogo.

### [BUG-038] `mailer.py` y 7 scripts `send_*.py` asumen estado activo ante `is_active IS NULL` y carecen de control de reintento por campaña

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_instant_featured_alerts.py` (línea 142), `backend/send_welcome_onboarding.py` (línea 243), `backend/send_reactivation.py` (línea 79), `backend/send_custom_alerts.py` (línea 181) y `backend/mailer.py` (línea 289)
- **Diagnóstico del Problema**:
  Varias consultas SQL filtran suscriptores con `(is_active IS NULL OR is_active = TRUE)` o `COALESCE(is_active, TRUE) = TRUE`, y ninguna exige `confirmed_at IS NOT NULL`. Además, `send_reactivation.py:75,84` aplica condiciones contradictorias sobre `last_sent_at` (`WHERE last_sent_at < limit_date_30 ... AND (last_sent_at < limit_reactivation_spam OR last_sent_at IS NULL)`, donde `last_sent_at IS NULL` nunca se cumple tras la primera condición).
- **Riesgo o Impacto**:
  Envíos a registros incompletos o legados no verificados y exclusión errónea de suscriptores en `send_reactivation.py` que nunca recibieron un primer envío (`last_sent_at IS NULL`).
- **Solución Óptima Propuesta**:
  Exigir estrictamente `is_active = TRUE AND status = 'active' AND confirmed_at IS NOT NULL` (o migración previa de legacy verificado), separar `reactivation_last_sent_at` de `last_sent_at`, y verificar en todos los casos contra `email_suppression_list`.

### [BUG-039] `AISearchBar.tsx` solo reconoce 13 patrones regex y descarta términos o ciudades no contempladas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/AISearchBar.tsx` (líneas 1-164)
- **Diagnóstico del Problema**:
  La barra de búsqueda inteligente del frontend implementa un analizador léxico limitado en cliente a 13 expresiones regulares tecnológicas fijas, omitiendo múltiples tecnologías presentes en el propio portal (`Next.js`, `Rust`, `Go`, `Kubernetes`, `GCP`, `Terraform`, `Docker`, `PHP`, `Ruby`, `Kotlin`, `Swift`, `GraphQL`, `QA`). Además, concatena el slug suponiendo que la combinación existe como ruta programática `/trabajos/[sector]`.
- **Riesgo o Impacto**:
  Búsquedas naturales válidas como `"desarrollador rust remoto"` o `"arquitecto kubernetes barcelona"` degradan a rutas erróneas o ignoran los filtros detectados, produciendo resultados inesperados o páginas con menos de 5 vacantes (`noindex`).
- **Solución Óptima Propuesta**:
  Unificar el mapa de taxonomías tecnológicas y ciudades en un diccionario compartido con `trabajos/[sector]` e ir a búsqueda parametrizada `/?q=...&location=...` como fallback automático cuando la consulta libre contenga términos fuera de la taxonomía programática.

### [BUG-040] `SaveJobButton.tsx` bloquea el guardado anónimo redirigiendo a `/login` aunque `/cookies` declara soporte `saved_jobs` local

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/SaveJobButton.tsx` (líneas 1-150) y `frontend/app/cookies/page.tsx` (línea 98)
- **Diagnóstico del Problema**:
  `SaveJobButton.tsx` fuerza `router.push('/login')` cuando `!isAuthenticated` en vez de persistir las ofertas favoritas en `localStorage` bajo la clave `saved_jobs` para visitantes no registrados (comportamiento que además está descrito literalmente en `frontend/app/cookies/page.tsx:98-101`).
- **Riesgo o Impacto**:
  Fricción innecesaria para candidatos que desean comparar 2 o 3 vacantes sin crear cuenta, además de incoherencia funcional entre la documentación del portal y el botón de guardado.
- **Solución Óptima Propuesta**:
  Permitir guardado local inmediato en `localStorage` (`saved_jobs`) para usuarios anónimos sincronizando automáticamente con `user_saved_jobs` al iniciar sesión o registrarse.

### [BUG-041] Desincronización de parámetros `lang` / ruta inglesa en `/noticias/[slug]` y `sitemap-news.xml`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 34-60) y `frontend/app/sitemap-news.xml/route.ts` (línea 37)
- **Diagnóstico del Problema**:
  `/noticias/[slug]/page.tsx:36` declara en `alternates.languages` la versión inglesa `${BASE_URL}/noticias/${resolvedParams.slug}?lang=en` cuando la página `NewsDetailPage` no procesa ni traduce el parámetro `searchParams.lang`, y sus propiedades `openGraph.images` / `twitter.images` apuntan a `${BASE_URL}/blog/${slug}/opengraph-image`. Al mismo tiempo, `sitemap-news.xml/route.ts:37` construye todas las URLs bajo `/blog/${post.slug}`, aunque `generate_news_post.py:54` publica noticias con prefijo `tendencias-news-*` que `sitemap.ts:479` indexa bajo `/noticias/${row.slug}`.
- **Riesgo o Impacto**:
  Google News recibe URLs `/blog/tendencias-news-*` mientras el sitemap principal indexa `/noticias/tendencias-news-*`, dividiendo señales canónicas; los atributos `hreflang="en"` apuntan a páginas completamente en español.
- **Solución Óptima Propuesta**:
  Enrutar las noticias (`tendencias-news-*`) de forma consistente hacia `/noticias/${slug}` en `sitemap-news.xml`, implementar o retirar el `hreflang="en"` según exista traducción real, y crear un `opengraph-image.tsx` propio bajo `app/noticias/[slug]/` (o unificar ruta única editorial).

### [BUG-042] `/trabajos/[sector]/page.tsx` mezcla español (`mes`) en metadatos ingleses (`/en/trabajos/...`) y emojis en `<title>`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/trabajos/[sector]/page.tsx` (líneas 545-562)
- **Diagnóstico del Problema**:
  Al construir el título SEO en `generateMetadata`, la línea 545 obtiene `const mes = now.toLocaleDateString('es-ES', { month: 'long' })` y lo interpola en la línea 553 dentro del título en inglés `... Jobs in Spain [${mesCapitalizado} ${anio}] 🔥` cuando `isEnglish === true`.
- **Riesgo o Impacto**:
  Las páginas bajo `/en/trabajos/[sector]` muestran títulos híbridos como `"React Jobs in Spain [Noviembre 2026] 🔥"`, reduciendo CTR en búsquedas en inglés y causando inconsistencias lingüísticas.
- **Solución Óptima Propuesta**:
  Formatear el mes con locale `'en-US'` cuando `isEnglish` sea verdadero (`isEnglish ? 'en-US' : 'es-ES'`), y retirar los emojis decorativos (`🔥`) de etiquetas `<title>` técnicas para mejorar la estabilidad visual en SERP.

### [BUG-043] `/job/[id]/page.tsx` asigna `addressRegion: 'Madrid'` por defecto a casi todas las provincias de España

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 647-673)
- **Diagnóstico del Problema**:
  La lógica condicional de construcción geográfica de `jobLocation.address` para `JobPosting` únicamente reconoce cinco regiones explícitas (Barcelona, Valencia, Sevilla, Bizkaia, Málaga) y cae en un `else` por defecto que asigna `addressRegion = 'Madrid'` para cualquier otra localidad española no remota (Zaragoza, Alicante, Valladolid, A Coruña, Murcia, Asturias, Baleares).
- **Riesgo o Impacto**:
  Emisión de datos estructurados contradictorios donde `addressLocality` dice `"Zaragoza"` o `"A Coruña"` mientras `addressRegion` indica `"Madrid"`, degradando el matching geográfico en Google for Jobs.
- **Solución Óptima Propuesta**:
  Completar una tabla de mapeo ciudad/provincia -> comunidad autónoma para las 50 provincias españolas y omitir `addressRegion` (o derivar de `addressLocality`) cuando no exista coincidencia segura en lugar de asumir `'Madrid'`.

### [BUG-044] Desincronización de `validThrough` (+45 días en `/job/[id]` vs +90 días en `/trabajos/[sector]`) y código `404` tras expiración

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/job/[id]/page.tsx` (líneas 483-502, 558) y `frontend/app/trabajos/[sector]/page.tsx` (línea 1140)
- **Diagnóstico del Problema**:
  El detalle `/job/[id]` calcula `validThrough` sumando 45 días a `created_at` (`558`), mientras el JSON-LD incrustado en `/trabajos/[sector]` suma 90 días (`1140`), y `deactivate_expired_jobs.py:48` desactiva las ofertas en BD a los 100 días. Adicionalmente, en `job/[id]/page.tsx:501`, si `job` supera los 100 días (`isOld`) pero la URL no usa el slug canónico, ejecuta `permanentRedirect` antes de renderizar el estado expirado, y si `!job.is_active` devuelve directamente `notFound()` (HTTP 404) sin distinguir ofertas expiradas (`410 Gone`).
- **Riesgo o Impacto**:
  Inconsistencia de caducidad entre páginas del mismo sitio y desperdicio de rastreo por retornos `404` genéricos o bucles de redirección previa antes de señalar caducidad.
- **Solución Óptima Propuesta**:
  Unificar `validThrough` con la política real de expiración (o campo `expires_at` en BD), validar primero el slug o resolver el estado expirado directamente sin redirección previa inútil cuando ya caducó, y devolver cabecera/estado HTTP `410 Gone` para vacantes purgadas o cerradas definitivamente.

### [BUG-045] `sitemap.ts` excluye ofertas con antigüedad entre 31 y 100 días debido a doble filtro de 30 días

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 669, 701) y `backend/deactivate_expired_jobs.py` (línea 48)
- **Diagnóstico del Problema**:
  Tanto `sitemap/1` (`OFFSET 0`, línea 669) como `sitemap/2` (`OFFSET 8000`, línea 701) filtran `WHERE is_active = TRUE AND created_at >= NOW() - INTERVAL 30 DAY`. Sin embargo, las vacantes permanecen activas en la base de datos y visibles en el portal hasta los 100 días (`deactivate_expired_jobs.py:48`). Por otro lado, `activeCertificationsPages` construido en `sitemap.ts:471-474` jamás llega a concatenarse en el array `sectorPages` (`490-496`), quedando fuera del sitemap.
- **Riesgo o Impacto**:
  Todas las ofertas activas entre el día 31 y el día 100 de vida desaparecen del sitemap XML aunque sigan publicadas, y `/certificaciones` junto a todas sus subpáginas no se declaran en `sitemap/0.xml`.
- **Solución Óptima Propuesta**:
  Alinear la ventana del sitemap de ofertas activas con `is_active = TRUE` (paginando bloques de hasta 10.000/50.000 URLs por shard sin recortar a 30 días si las ofertas siguen vivas 100 días) e incorporar `...activeCertificationsPages` dentro de `sectorPages`.

### [BUG-046] `postgres.ts` / `db.ts` no adapta sintaxis de fechas y `INTERVAL` en consultas complejas o placeholders repetidos

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/lib/db.ts` (líneas 40-150, `translatePostgresToMysql`)
- **Diagnóstico del Problema**:
  El traductor ad-hoc basado en expresiones regulares `translatePostgresToMysql()` realiza sustituciones secuenciales de marcadores `$1, $2...` a `?` y de funciones concretas de PostgreSQL. Cuando una consulta reutiliza el mismo placeholder `$1` múltiples veces en distintos predicados o combina alias complejos con expresiones de tiempo, las transformaciones por regex pueden desalinear el orden o número de parámetros vinculados respecto a los `?` resultantes o fallar en dialectos no previstos (como ocurrió con `RETURNING id` en `/api/admin/jobs`).
- **Riesgo o Impacto**:
  Fallos de ejecución en tiempo de runtime (`Incorrect arguments to mysqld_stmt_execute` o `You have an error in your SQL syntax`) cada vez que una nueva consulta usa características SQL estándar no cubiertas por el traductor de cadenas.
- **Solución Óptima Propuesta**:
  Migrar progresivamente los repositorios de consultas (`frontend/lib/` y APIs) a SQL nativo de MySQL 8 con parámetros `?` o mediante un query builder tipado (Kysely/Drizzle) eliminando traducciones regex en caliente.

### [BUG-047] `backend/scrapers/*.py` mezclan formatos heterogéneos de `salary`, `location` y snippets sin normalización unificada

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/scrapers/himalayas.py` (líneas 33-44), `backend/scrapers/remoteok.py`, `backend/scrapers/remotive.py`, `backend/scrapers/wwr.py`, `backend/main.py` (líneas 100-145)
- **Diagnóstico del Problema**:
  Cada scraper formatea cadenas distintas para ausencia de salario (`"Ver en oferta"`, `"Consultar"`, `"Sin especificar"`) y distintos prefijos en `description_snippet` (`"[Fuente: Himalayas] ..."`, `"Oferta de TecnoEmpleo"`), mientras `backend/main.py` y `PostgresPipeline` dependen de reglas parciales de texto y traducción de `deep_translator` por cada campo individual. Cuando `himalayas.py:37` formatea `f"{min_sal:,} - {max_sal:,} {currency}"`, usa comas inglesas para miles que luego `frontend/lib/salarios.ts:141` confunde con decimales europeos al reemplazar `,` por `.`.
- **Riesgo o Impacto**:
  Degradación acumulativa en el cálculo de estadísticas salariales del frontend y fallos de parsing cuando un salario tiene `null` en `salary_min`/`salary_max`.
- **Solución Óptima Propuesta**:
  Obligar a todos los scrapers a devolver un dataclass/TypedDict uniforme con campos estructurados (`salary_min`, `salary_max`, `salary_currency`, `work_mode`, `source_name`) normalizados antes de entrar a `save_jobs()`.

### [BUG-048] `backend/logic/tdm.py` mezcla permisos `*` vs agente propio y mantiene caché global sin expiración

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/tdm.py` (líneas 11, 39-41, 52-54)
- **Diagnóstico del Problema**:
  En la línea 53, `is_scraping_allowed` evalúa `if not rp.can_fetch(user_agent, url) or not rp.can_fetch("*", url): return False`. Conforme a RFC 9309, un bloque específico `User-agent: PortalTrabajoITBot` en `robots.txt` anula al bloque `User-agent: *`, pero la condición `or not rp.can_fetch("*", url)` prohíbe el acceso si `*` está bloqueado aunque nuestro bot esté permitido. Además, ante excepciones de red/timeout (`39-41`), cachea permanentemente `None` en `_ROBOTS_CACHE` (fail-open sin TTL), permitiendo el scraping aunque no se haya podido leer `robots.txt`.
- **Riesgo o Impacto**:
  Comportamiento fail-open ante caídas temporales al consultar `robots.txt` y falsa denegación en sitios que autorizan explícitamente el bot mediante `User-agent` propio.
- **Solución Óptima Propuesta**:
  Usar `rp.can_fetch(user_agent, url)` respetando la precedencia RFC 9309, fallar cerrado (`False`) ante errores HTTP distintos de 404/410 o timeouts críticos de `robots.txt`, y añadir TTL a `_ROBOTS_CACHE`.

### [BUG-049] `backend/send_custom_alerts.py` procesa alertas sin filtrar palabras clave ni modalidad con seguridad de índice

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/send_custom_alerts.py` (líneas 14-146, 178-290) y `backend/send_instant_featured_alerts.py` (líneas 196, 222)
- **Diagnóstico del Problema**:
  `send_instant_featured_alerts.py` actualiza `jobs SET last_instant_alert_sent_at = %s` tanto dentro del bucle en la línea 196 como nuevamente en la línea 222 después del bucle con cursor único y sin comprobar si al menos una entrega SMTP tuvo éxito cuando el servidor SMTP falla intermitentemente. En `send_custom_alerts.py`, si un suscriptor tiene `tech_keywords` nulos o mal formateados en `tech_keywords_json`, la lógica puede omitir suscripciones válidas o generar enlaces con placeholders rotos sin validación por suscriptor en una única transacción SMTP persistente sin reconexión (a diferencia de `mailer.py`).
- **Riesgo o Impacto**:
  Pérdida de notificaciones de ofertas destacadas cuando ocurre un corte SMTP transitorio (la oferta queda marcada como notificada sin haberse enviado los correos) y caídas completas de lotes de alertas personalizadas si el relay cierra el socket tras N mensajes.
- **Solución Óptima Propuesta**:
  Marcar `last_instant_alert_sent_at` solo tras completar los envíos sin error crítico (o registrar entregas por pareja `(subscriber_id, job_id)` en `subscriber_job_notifications`) y dotar a `send_custom_alerts.py` de micro-lotes con reconexión SMTP.

### [BUG-050] `backend/send_welcome_onboarding.py` puede fallar en `conn.close()` o dejar `onboarding_stage` desactualizado si `SMTP` rechaza un email

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/send_welcome_onboarding.py` (líneas 237-342)
- **Diagnóstico del Problema**:
  El script carga todos los suscriptores pendientes en memoria de una vez (`fetchall()`), abre una única sesión SMTP sin `timeout` ni reconexión ante `SMTPServerDisconnected`, y realiza dos rutas distintas de construcción de cabeceras (`289` vs `318`, omitiendo la segunda el enlace `mailto:` en `List-Unsubscribe`). Adicionalmente, el bloque `try/except` de la línea 336 captura excepciones en bucle dejando cursor/conexión dependientes de llegar al final sin un `finally` protector.
- **Riesgo o Impacto**:
  Desconexiones SMTP en medio de campañas masivas abortan los envíos restantes de la jornada sin reintento y mantienen inconsistencias de formato entre la etapa 1 y la etapa 2 del onboarding.
- **Solución Óptima Propuesta**:
  Aplicar batching paginado, `timeout=30` con reconexión automática, `try/finally` de cierre en BD y envío unificado mediante `backend/logic/legal.py:build_unsubscribe_headers()`.

### [BUG-051] `backend/consolidate_production_schema.py` y `database_optimization.sql` presentan divergencia de esquema frente al runtime

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/database_optimization.sql` (21 tablas), `backend/consolidate_production_schema.py` (25 tablas) y `frontend/lib/userAuth.ts`
- **Diagnóstico del Problema**:
  Coexisten tres fuentes de definición de esquema no sincronizadas: `backend/database_optimization.sql` (definido para PostgreSQL y montado en `docker-compose.yml`, que carece de tablas posteriores como `email_suppression_list`, `consent_audit_log`, `review_reports`, `email_deliveries` y `subscriber_job_notifications`), `backend/consolidate_production_schema.py` (script Python imperativo) y `ensureUserAuthTables()` en `frontend/lib/userAuth.ts` (que ejecuta DDL `CREATE TABLE IF NOT EXISTS` en mitad de peticiones HTTP como `/api/auth/login`).
- **Riesgo o Impacto**:
  Un entorno levantado con `docker-compose.yml` falla al arrancar por sintaxis PostgreSQL en `database_optimization.sql` o por ausencia de tablas críticas en runtime; ejecutar DDL en el hot-path de `/api/auth/login` añade latencia y requiere privilegios `CREATE/ALTER` para el usuario web de BD.
- **Solución Óptima Propuesta**:
  Consolidar una única herramienta de migraciones versionadas en MySQL 8 (Alembic, Flyway o Prisma/Drizzle), eliminar DDL en peticiones web de usuarios finales y alinear `docker-compose.yml` con el esquema MySQL vigente.

### [BUG-052] `backend/job_aggregator/settings.py` conserva `USER_AGENT` genérico de ejemplo de Scrapy

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/job_aggregator/settings.py` (línea 22)
- **Diagnóstico del Problema**:
  La configuración de Scrapy mantiene literal el comentario de plantilla `USER_AGENT = 'job_aggregator (+http://www.yourwebsite.com)' # Reemplazar con tu dominio`, a diferencia del resto de scrapers en `backend/scrapers/*.py` que utilizan `'PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot; bot@portalempleoit.com)'`. Además, `AUTOTHROTTLE_ENABLED` permanece comentado.
- **Riesgo o Impacto**:
  Los sitios rastreados por Scrapy reciben un User-Agent inválido con un dominio de marcador (`yourwebsite.com`), exponiendo el rastreo a bloqueos automáticos WAF por suplantación genérica e impidiendo que operadores remotos contacten al responsable.
- **Solución Óptima Propuesta**:
  Configurar `USER_AGENT = 'PortalTrabajoITBot/1.0 (+https://portalempleoit.com/bot; bot@portalempleoit.com)'` y activar `AUTOTHROTTLE_ENABLED = True` respetando tiempos dinámicos del servidor origen.

### [BUG-053] `RootLayout` y `Home` fuerzan renderizado dinámico SSR (`await headers()`) desactivando caché estático/ISR

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/layout.tsx` (línea 117) y `frontend/app/page.tsx` (línea 232)
- **Diagnóstico del Problema**:
  `RootLayout` lee `await headers()` en la línea 117 (para extraer `x-nonce` del middleware) y `frontend/app/page.tsx` vuelve a invocar `await headers()` en la línea 232. En Next.js App Router, llamar a `headers()` dentro del `RootLayout` fuerza automáticamente el renderizado dinámico (`dynamic rendering`) en cada request para **toda** la aplicación, anulando `export const revalidate = 900` / `3600` definido en páginas hijas programáticas (`/trabajos/[sector]`, `/noticias/[slug]`) cuando se sirven a través de `RootLayout`.
- **Riesgo o Impacto**:
  Cada visita de usuario o bot recompila páginas SSR completas ejecutando consultas MySQL repetidas en vez de aprovechar ISR o caché CDN, aumentando TTFB y presión sobre MySQL/`db_proxy.php`.
- **Solución Óptima Propuesta**:
  Evitar leer `headers()` en el layout raíz (reemplazar inline scripts con archivos estáticos servidos bajo `'self'` o hashes CSP deterministas en cabecera para permitir páginas estáticas/ISR reales en rutas públicas), manteniendo `headers()` aislado únicamente en rutas autenticadas o administrativas.

### [BUG-054] Scripts `<script type="application/ld+json">` en `page.tsx` omiten el atributo `nonce` exigido por la CSP del middleware

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/page.tsx` (líneas 334-345) y `frontend/middleware.ts` (líneas 16-20)
- **Diagnóstico del Problema**:
  El middleware genera una política `Content-Security-Policy` estricta basada en `'nonce-${nonce}' 'strict-dynamic'` en `script-src`, mientras que varias etiquetas `<script type="application/ld+json">` en `page.tsx:334-345` y componentes/páginas hijas se renderizan sin pasar `nonce={nonce}`. Aunque JSON-LD no es JS ejecutable, el comportamiento combinado con doble cabecera CSP en `next.config.ts` y parsers estrictos requiere consistencia (y afecta también a cualquier script de widget o tercer script inyectado sin nonce).
- **Riesgo o Impacto**:
  Riesgo de bloqueo o alertas en consola de navegador/extensiones estrictas y evidencia de desalineación estructural entre la estrategia CSP de `middleware.ts` y las páginas de App Router.
- **Solución Óptima Propuesta**:
  Centralizar la generación de scripts JSON-LD en un componente `<JsonLd data={...} nonce={nonce} />` o emplear únicamente una única política CSP coherente y validada end-to-end.

### [BUG-055] Falta validación de campos `type="number"` / `salary` negativos o inconsistentes en `PublishForm.tsx` y `actions.ts`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/publicar-oferta/PublishForm.tsx` (líneas 300-430) y `frontend/app/actions.ts` (líneas 549-654)
- **Diagnóstico del Problema**:
  En el formulario de publicación de ofertas, el campo salario se acepta como texto libre sin normalización ni validación de formato estructurado mínimo ni verificación en frontend de que `job_url` corresponda a un dominio válido HTTPS antes de enviar el formulario al servidor. Asimismo, si `plan === 'basico'` falla tras el `COMMIT` en la notificación de Telegram (`actions.ts:658`), el comportamiento depende del manejo posterior sin confirmar al usuario id de referencia trazable.
- **Riesgo o Impacto**:
  Inserción de salarios inconsistentes (`"a convenir"`, `"0"`, formatos rotos) que deterioran filtros numéricos y Schema.org `JobPosting`, y falta de trazabilidad del envío gratuito para el reclutador.
- **Solución Óptima Propuesta**:
  Introducir campos opcionales numéricos `salary_min`, `salary_max` y `currency` validados por esquema Zod tanto en cliente como en servidor, mostrando al usuario un identificador de seguimiento tras el envío.

### [BUG-056] `backend/logic/tracking.py` degrada silenciosamente a PII en claro (`?email=...`) si falta el secreto

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/tracking.py` (líneas 11-26, 41-59) y `backend/send_custom_alerts.py` / `send_reactivation.py` / `send_welcome_onboarding.py`
- **Diagnóstico del Problema**:
  Cuando `_get_tracking_secret()` retorna cadena vacía (`24-25`), `build_track_click_url()` (`45-49`) y `build_track_open_url()` (`56-59`) construyen URLs con `?email=<correo>&campaign=...` sin token HMAC. Paralelamente, `send_custom_alerts.py:75`, `send_reactivation.py:146,201` y `send_welcome_onboarding.py:77,137` siguen construyendo manualmente enlaces `?email=...` omitiendo por completo `logic.tracking`, los cuales luego son rechazados o ignorados por `api/track-click/route.ts:143` y `api/track-open/route.ts:59` que exigen `isAuthorized === true` (firma HMAC válida).
- **Riesgo o Impacto**:
  Todas las métricas de aperturas y clics de las campañas de alertas personalizadas, onboarding y reactivación quedan en `0` porque `/api/track-open` y `/api/track-click` descartan peticiones sin firma HMAC, a la vez que filtran el email del usuario en los query params de los correos enviados.
- **Solución Óptima Propuesta**:
  Exigir `TRACKING_HMAC_SECRET` obligatorio fail-closed (sin fallback a PII en query string) y migrar `send_custom_alerts.py`, `send_reactivation.py` y `send_welcome_onboarding.py` al uso exclusivo de `build_track_click_url` y `build_track_open_url`.

### [BUG-057] `backend/mailer.py` construye el resumen de vacantes y enlaces usando múltiples consultas separadas sin aislamiento temporal

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/mailer.py` (líneas 81-198, 287-305)
- **Diagnóstico del Problema**:
  En `backend/mailer.py`, las consultas de nuevas vacantes (`81`), rango salarial semanal (`127`) y ofertas destacadas (`191`) se ejecutan independientemente antes de iterar por todos los suscriptores (`fetchall()` de una sola vez en la línea 302). Si hay miles de suscriptores o falla el envío a mitad de la lista tras abrir la sesión SMTP, el script intenta reconectar solo cada micro-lote y puede enviar duplicados si se re-ejecuta manualmente el cron al no registrar `last_sent_at` por usuario en BD durante el bucle (comprueba su actualización solo después o de forma disociada).
- **Riesgo o Impacto**:
  Riesgo de doble envío a parte de la lista tras un crash parcial y consumo elevado de memoria si la tabla `subscribers` crece a decenas de miles de registros.
- **Solución Óptima Propuesta**:
  Actualizar `last_sent_at = NOW()` e insertar en `email_deliveries` inmediatamente tras cada envío SMTP exitoso para garantizar idempotencia ante reanudaciones, e iterar los suscriptores mediante paginación por cursor (`WHERE id > %s LIMIT 500`).

### [BUG-058] `frontend/lib/jobs.ts` combina filtros `MATCH ... AGAINST` con fallbacks `LIKE` no indexados en el mismo constructor

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/lib/jobs.ts` (líneas 1-165, `buildJobFiltersWhere`)
- **Diagnóstico del Problema**:
  Cuando una búsqueda combina búsqueda textual con filtros de modalidad, ubicación, salario o fecha, la lógica alterna entre `MATCH(title, company, location) AGAINST(...)` y patrones `LIKE '%...%'` con comodín inicial. Adicionalmente, en consultas donde `q` tiene menos de 3 caracteres o caracteres especiales de operador booleano MySQL (`+`, `-`, `@`, `*`, `(`, `)`), `IN BOOLEAN MODE` puede devolver cero filas o lanzar errores de sintaxis FTS si no se sanean todos los operadores reservados.
- **Riesgo o Impacto**:
  Búsquedas comunes como `"C++"`, `"C#"`, `".NET"` o `"Node.js"` fallan en `FULLTEXT` por longitud mínima (`ft_min_word_len`/`innodb_ft_min_token_size=3`) o por símbolos `+`/`*` interpretados como operadores booleanos, devolviendo resultados vacíos o erróneos (y disparando el fallback de `MOCK_JOBS` descrito en `[BUG-006]`).
- **Solución Óptima Propuesta**:
  Sanear estrictamente los operadores especiales de InnoDB FULLTEXT en `q`, aplicar ruta `LIKE`/tokens normalizados explícita para tecnologías cortas o simbólicas (`C#`, `C++`, `Go`, `.NET`, `AI`, `QA`, `R`) y añadir tests unitarios de búsqueda sobre caracteres especiales.

### [BUG-059] `backend/logic/slug.py` y `frontend/lib/slug.ts` corren el riesgo de divergir ante caracteres no latinos o símbolos como `C#` / `C++`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/slug.py` (líneas 4-23)
- **Diagnóstico del Problema**:
  `backend/logic/slug.py` usa `re.sub(r'[^\w\-]', '', text)` después de normalizar NFD (donde `\w` en Python 3 incluye letras Unicode no ASCII si quedaran caracteres no combinables como `ß`, `ø`, emojis o guiones bajos `_`), produciendo resultados potencialmente distintos a implementaciones JS con `[a-z0-9-]`. Asimismo, un título como `"Senior C++ / C# Developer"` pierde `++` y `#`, colapsando a `"senior-c-c-developer"` de forma idéntica para C, C++ y C#.
- **Riesgo o Impacto**:
  Colisiones semánticas entre slugs de tecnologías distintas y disparidad de URL generadas entre notificaciones Python (`index_new_jobs.py`, `deactivate_expired_jobs.py`, `mailer.py`) y rutas Next.js.
- **Solución Óptima Propuesta**:
  Normalizar explícitamente tokens críticos (`c++` -> `cpp`, `c#` -> `csharp`, `.net` -> `dotnet`, `node.js` -> `nodejs`), usar `[^a-z0-9-]` en ambos lenguajes y mantener una batería compartida de vectores de prueba golden Python <-> TypeScript.

### [BUG-060] `backend/monitor_search_console.py` valida esquemas sobre muestra estática sin detectar `soft 404` ni discrepancias proxy

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/monitor_search_console.py` (líneas 57-191)
- **Diagnóstico del Problema**:
  El monitor usa `urllib.request.urlopen` sin verificar estado de renderizado final ni comparar el número de ofertas reales en DB contra las listadas en `/sitemap/1.xml` (lo que habría detectado el recorte silencioso a 1.000 filas de `db_proxy.php` y el desfase de 31–100 días). Además, mezcla estadísticas de `SELECT COUNT(*)` sin filtro de caducidad coherente con el ciclo de vida.
- **Riesgo o Impacto**:
  Regresiones graves de indexación (como la ausencia de ofertas entre 31 y 100 días en sitemaps o errores de `addressRegion` / `baseSalary`) pasan desapercibidas con salida verde del monitor.
- **Solución Óptima Propuesta**:
  Ampliar `monitor_search_console.py` para auditar la paridad cuantitativa entre BD y sitemaps XML, validar presencia de `baseSalary` en ofertas con salario conocido y alertar si la tasa de advertencias supera umbrales críticos.

### [BUG-061] `backend/send_saved_jobs_reminder.py` y `send_streak_reminder.py` consultan suscripciones sin cierre seguro ni validación de opt-in confirmado

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/send_saved_jobs_reminder.py` (líneas 149-249) y `backend/send_streak_reminder.py` (líneas 152-253)
- **Diagnóstico del Problema**:
  Ambos scripts abren conexión DB y ejecutan consultas sobre `subscribers` con `LEFT JOIN`/filtros por `source`/`tech_keywords`, pero carecen de verificación sobre `email_suppression_list` y `confirmed_at IS NOT NULL`, usan `smtplib.SMTP` sin `timeout`, e implementan `conn.close()` solo al final de la función principal (sin bloque `finally`), filtrando conexiones ante fallos de envío o excepciones SQL inesperadas.
- **Riesgo o Impacto**:
  Fugas de conexiones MySQL, bloqueo indefinido en cron si el servidor SMTP no responde y envío potencial de recordatorios a direcciones pendientes de confirmación o suprimidas.
- **Solución Óptima Propuesta**:
  Consolidar ambos recordatorios sobre un helper común de campaña transaccional/retención con `try/finally`, comprobación de `email_suppression_list`, `confirmed_at IS NOT NULL` y timeout explícito en SMTP.

### [BUG-062] `frontend/app/noticias/[slug]/page.tsx` puede producir extractos truncados con entidades Markdown rotas en el FAQ JSON-LD

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/noticias/[slug]/page.tsx` (líneas 74-102, función `extractFaqsFromContent`)
- **Diagnóstico del Problema**:
  `extractFaqsFromContent` recorta el texto limpio con `.substring(0, 300) + '...'` aunque el párrafo original tenga menos de 300 caracteres, dejando puntos suspensivos artificiales al final de respuestas cortas, y la limpieza por regex `replace(/[\*\_`#]/g, '')` elimina guiones bajos dentro de identificadores técnicos reales (por ejemplo `snake_case`, `DATABASE_URL` o nombres de variables en artículos técnicos IT).
- **Riesgo o Impacto**:
  Corrupción visual de términos técnicos en datos estructurados `FAQPage` y pérdida de precisión en respuestas indexables.
- **Solución Óptima Propuesta**:
  Añadir `'...'` solo cuando `cleanAnswer.length > 300` cortando en límite de palabra, y eliminar el formato Markdown mediante un parser/renderer AST en lugar de borrar literalmente todo carácter `_` o `*`.

### [BUG-063] `frontend/app/actions.ts` mezcla respuestas genéricas de éxito con errores silenciosos en registro de `consent_audit_log` y `email_tracking`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` y `frontend/app/api/subscribe/confirm/route.ts` (líneas 32-35)
- **Diagnóstico del Problema**:
  Tanto `/api/subscribe/confirm/route.ts:35` como múltiples rutas de consentimiento y baja (`/api/unsubscribe/route.ts`) encadenan `.catch(() => {})` al insertar en `consent_audit_log` o `email_suppression_list`. Si la tabla no existe o falla el `INSERT` por longitud o bloqueo, el flujo retorna HTTP 200 / redirección exitosa sin registrar ninguna traza en logs de servidor.
- **Riesgo o Impacto**:
  Pérdida silenciosa de registros probatorios de consentimiento o de supresión de envíos ante errores de BD sin que ningún administrador o alerta sea notificado.
- **Solución Óptima Propuesta**:
  Reemplazar todo `.catch(() => {})` sobre auditoría legal y listas de supresión por registro explícito `console.error(...)` con alerta métrica y bloquear el alta si falla el registro en `consent_audit_log` o `email_suppression_list`.

### [BUG-064] `backend/logic/salary_parser.py` multiplica salarios diarios/anuales mal etiquetados (`< 6000`) por 12 y selecciona mínimos erróneos en bonos

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/salary_parser.py` (líneas 46-70, `parse_salary`)
- **Diagnóstico del Problema**:
  `parse_salary()` asume automáticamente `is_monthly = True` (`multiplier = 12`) para cualquier cifra `< 6000` que no contenga tokens de tarifa horaria (`/h`, `hora`), convirtiendo tarifas diarias freelance como `"450 € / día"` en `450 * 12 = 5.400 €` anuales en lugar de `~99.000 €` (`* 220`). Asimismo, si una oferta dice `"2.400 €/mes + 300 € ticket restaurante"`, `min(2400, 300) * 12` resulta `3.600 €`, descartando el mínimo válido (`val_min = None`) por caer debajo de `5.000 €`.
- **Riesgo o Impacto**:
  Distorsión de rangos salariales almacenados en `salary_min`/`salary_max`, excluyendo tarifas freelance válidas o truncando el rango inferior de ofertas con complementos en especie.
- **Solución Óptima Propuesta**:
  Añadir detección explícita de tarifa diaria (`/día`, `/day`, `daily`, `pd`, `por día` -> `* 220`), extraer únicamente parejas coherentes de rango salarial (patrón `X - Y` o prefijo salarial principal) antes de capturar bonus secundarios, y persistir el equivalente en EUR (`salary_min_eur` / `salary_max_eur`).

### [BUG-065] `frontend/app/sitemap.ts` clasifica como `isBaseSector` páginas híbridas/remotas compuestas y genera `lastModified: new Date()` dinámico

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/sitemap.ts` (líneas 445-456, 533, 561, 593, 637, 657, 740)
- **Diagnóstico del Problema**:
  En la línea 450, `isBaseSector` descarta variantes comprobando `!sector.includes('-en-') && !sector.endsWith('-remoto') && !sector.includes('-junior')...`, pero deja pasar variantes compuestas como `contrato-indefinido` o `mid` o `sin-experiencia`, generando rutas `/trabajos/[sector]/empresas` no canónicas. Además, asigna `lastModified: new Date()` (la hora exacta de la petición HTTP) a cientos de URLs en `sitemap/0.xml` y `sitemap/3.xml` aunque sus contenidos o contadores no hayan cambiado.
- **Riesgo o Impacto**:
  Generación de subpáginas redundantes `/empresas` para sufijos modificadores y envío continuo de fechas `lastmod` falsas a Googlebot en cada descarga del sitemap, reduciendo la confianza del rastreador en la señal `lastmod`.
- **Solución Óptima Propuesta**:
  Validar `isBaseSector` mediante pertenencia positiva a la lista blanca cerrada de tecnologías/categorías base, y derivar `lastModified` real a partir de `MAX(jobs.created_at)` o `MAX(blog_posts.date)` por grupo en lugar de `new Date()`.
