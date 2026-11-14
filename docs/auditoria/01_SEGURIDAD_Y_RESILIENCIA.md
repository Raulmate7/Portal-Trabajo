# 01. Auditoría de Seguridad, Resiliencia e Infraestructura

> **Alcance**: Seguridad aplicacional (AppSec), pasarela de base de datos (`db_proxy.php`), autenticación y sesiones, prevención de abuso/DoS, pasarelas de pago (Stripe/PayPal), seguridad perimetral (`nginx.conf.template`, `middleware.ts`), pipelines CI/CD y resiliencia en scrapers/automatizaciones.  
> **Volumen**: 65 hallazgos (`SEC-001` a `SEC-065`).

---

## Bloque I: Secretos, Credenciales y Exposición de Datos Sensibles

### [SEC-001] Contraseña de base de datos hardcodeada y expuesta en lista de procesos en script de backup

- **Estado de Remediación**: `[x] Resuelto en código y producción (Lote 1.1)` — Script endurecido (`--defaults-extra-file` `0600` + `trap`), contraseña de `portal_user@localhost` rotada en `ecosierraserver` y `.env` actualizados.
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `scripts/backup_mysql.sh` (líneas 23 y 37)
- **Diagnóstico del Problema**:
  El script define un valor por defecto explícito en texto plano para la contraseña de MySQL (`DB_PASS="${DB_PASS:-Tolili07@}"` en la línea 23) y posteriormente invoca `mysqldump -u "$DB_USER" -p"$DB_PASS" ...` en la línea 37. Pasar credenciales mediante el argumento `-p` en línea de comandos expone el secreto en la tabla de procesos del sistema operativo (`ps aux`, `/proc/<pid>/cmdline`) ante cualquier usuario o proceso local del servidor, además de filtrar la credencial real en el código fuente del repositorio.
- **Riesgo o Impacto**:
  Compromiso total de la base de datos de producción (`ecosier2_PortalEmpleo`), acceso irrestricto a correos de suscriptores, leads B2B, registros de pagos y manipulación o destrucción íntegra de tablas si el repositorio es leído por terceros o si un atacante obtiene acceso de lectura local no privilegiado.
- **Solución Óptima Propuesta**:
  1. Revocar y rotar inmediatamente la contraseña de MySQL expuesta en el servidor de producción y reescribir el historial de Git (`git filter-repo`) para purgar el secreto de commits anteriores.
  2. Eliminar cualquier fallback hardcodeado en `scripts/backup_mysql.sh` y exigir la variable o un archivo `~/.my.cnf` con permisos `0600` referenciado mediante `--defaults-extra-file=/ruta/segura/.my.cnf`.
  3. Validar en el arranque del script que las variables obligatorias estén definidas (`: "${DB_USER:?}"`) antes de ejecutar `mysqldump`.

### [SEC-002] Presencia de dump SQL de producción, ficheros de migración con PII y archivo `.env` en el directorio de trabajo

- **Estado de Remediación**: `[x] Resuelto (Lote 1.1)` — Reforzados `.gitignore`, `.vercelignore`, `frontend/.vercelignore`, guardarraíl en `.github/workflows/deploy_cpanel.yml`, eliminados de disco `ecosier2_PortalEmpleo.sql` (local y servidor) y `backend/migration_data/`, y movidos los backups fuera del árbol web a `/var/backups/proyecto_empleo/mysql`.
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` (líneas 41, 9554 y resto del dump, 3.99 MB), `backend/.env` (996 B) y `backend/migration_data/` (`jobs.json`, `subscribers.json`, `alerts.json`, 7.7 MB)
- **Diagnóstico del Problema**:
  El árbol de trabajo del repositorio contiene artefactos sensibles pesados con datos reales de producción: el dump completo `ecosier2_PortalEmpleo.sql` (que incluye direcciones de correo reales como `raulmate7@gmail.com` en la línea 41 y `portaldetrabajo1@gmail.com` en la línea 9554), el directorio `backend/migration_data/` con volcados JSON de suscriptores y alertas, y el archivo de configuración `backend/.env`. Su mera presencia en el workspace multiplica la probabilidad de inclusión accidental en builds, empaquetados de despliegue (`deploy_cpanel.yml`), snapshots de backups no cifrados o commits accidentales.
- **Riesgo o Impacto**:
  Exposición masiva de Información Personal Identificable (PII) de usuarios y clientes, fuga de claves de API/SMTP/BD almacenadas en `.env`, incumplimiento grave de seguridad y posible exposición pública si el directorio raíz llega a ser servido o sincronizado hacia cPanel/hosting compartido.
- **Solución Óptima Propuesta**:
  1. Retirar `ecosier2_PortalEmpleo.sql`, `backend/migration_data/` y cualquier copia de `.env` fuera del árbol del repositorio hacia almacenamiento cifrado externo (vault/S3 privado).
  2. Verificar `.gitignore` y añadir reglas explícitas para `*.sql`, `backend/migration_data/`, `.env*` (salvo `.env.example`), y comprobar mediante `git log` si alguno fue rastreado en el historial para purgarlo y rotar todas las claves presentes en `backend/.env`.
  3. Incorporar un hook pre-commit (`gitleaks` o `detect-secrets`) y verificación en CI que bloquee la presencia de volcados SQL, JSON con emails o secretos antes de desplegar.

### [SEC-003] Secreto de respaldo hardcodeado para firma criptográfica HMAC de enlaces de baja

- **Estado de Remediación**: `[x] Resuelto (Lote 1.1)` — Eliminado `'portal_unsub_secret_fallback'` en `frontend/app/api/unsubscribe/route.ts` mediante `getUnsubscribeSecret()` (modo *Fail-Closed* HTTP `503`), y configurada `UNSUBSCRIBE_SECRET` independiente en `ecosierraserver`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (generación y verificación de tokens HMAC)
- **Diagnóstico del Problema**:
  El endpoint de baja de suscripción utiliza una cadena fija de respaldo (`'portal_unsub_secret_fallback'`) cuando la variable de entorno secreta no se encuentra configurada. Si un entorno de staging, preview o producción arranca sin la variable correspondiente, cualquier atacante que conozca esa cadena pública del código fuente puede forjar firmas HMAC válidas para cualquier dirección de correo electrónico.
- **Riesgo o Impacto**:
  Baja forzosa o manipulación de preferencias de cualquier suscriptor de la plataforma (denegación de servicio hacia usuarios de pago o clientes B2B) sin acceso a su buzón de correo.
- **Solución Óptima Propuesta**:
  1. Eliminar por completo `'portal_unsub_secret_fallback'` y fallar de manera explícita (`fail-closed` con error `500` en runtime o fallo de validación de entorno al arrancar) si `UNSUBSCRIBE_SECRET` / `ADMIN_SECRET` no está definido con al menos 32 bytes de entropía.
  2. Separar las claves criptográficas por propósito (clave exclusiva para tokens de baja, distinta de sesiones administrativas y magic links) usando derivación HKDF o variables dedicadas.

### [SEC-004] Transmisión de la clave de API de Google Gemini en parámetros de URL

- **Estado de Remediación**: `[x] Resuelto (Lote 1.1)` — Migrada la clave en `backend/generate_news_post.py` desde `?key=...` hacia cabecera HTTP `x-goog-api-key`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/generate_news_post.py` (llamada HTTP al endpoint de `gemini-2.5-flash`)
- **Diagnóstico del Problema**:
  El script de generación automática de noticias envía la clave secreta de Gemini en la query string de la petición (`?key=${api_key}`) en lugar de enviarla mediante cabecera HTTP estándar (`x-goog-api-key`). Las URL completas con query strings suelen quedar registradas en logs de proxies HTTP, registros de salida de red, trazas de excepciones y telemetría de librerías cliente ante errores `4xx/5xx`.
- **Riesgo o Impacto**:
  Fuga de la clave de API de Google Gemini en logs de ejecución o dumps de error, con el consiguiente riesgo de uso abusivo de cuota, facturación fraudulenta en Google Cloud o inyección de contenido si se comprometen otras capacidades de la cuenta.
- **Solución Óptima Propuesta**:
  1. Migrar la autenticación de la petición HTTP para transmitir el secreto en la cabecera `x-goog-api-key` (o usar el SDK oficial `google-genai`) eliminando `?key=...` de la URL.
  2. Implementar un filtro de redacción de secretos en el logger del backend para que nunca imprima URLs completas con credenciales ante excepciones de red.

### [SEC-005] Registro de direcciones de correo electrónico en texto claro dentro de logs de CI/CD

- **Estado de Remediación**: `[x] Resuelto (Lote 1.1)` — Creado helper central `mask_email` en `backend/logic/privacy.py` y aplicado en `send_welcome_onboarding.py`, `send_reactivation.py`, `send_streak_reminder.py`, `send_saved_jobs_reminder.py`, `send_referral_notifications.py` y `send_instant_featured_alerts.py` (eliminando duplicación en `mailer.py` y `send_custom_alerts.py`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/send_welcome_onboarding.py` (línea 279), `backend/send_reactivation.py` (línea 216), `backend/send_streak_reminder.py` (línea 239), `backend/send_saved_jobs_reminder.py` (línea 235) y `backend/send_referral_notifications.py` (líneas 209 y 231)
- **Diagnóstico del Problema**:
  Cinco scripts automatizados de envío de correo imprimen por salida estándar (`print`) las direcciones de correo electrónico completas de los usuarios destinatarios durante su ejecución periódica. Cuando estos scripts corren bajo GitHub Actions (`.github/workflows/weekly_email.yml` u otros workflows programados), toda la salida `stdout` queda almacenada en los logs persistentes de ejecuciones del repositorio.
- **Riesgo o Impacto**:
  Exposición sistemática de PII de usuarios finales en registros retenidos de GitHub Actions (visibles públicamente si el repo es público o ante cualquier colaborador con permisos de lectura en CI), facilitando recolección de listas de correo y ataques de phishing dirigido contra los candidatos.
- **Solución Óptima Propuesta**:
  1. Reemplazar los correos en claro por identificadores ofuscados/enmascarados (ej. `r***@gmail.com` o un hash SHA-256 truncado con salt) mediante una función utilitaria centralizada `mask_email(email)` en los 5 scripts.
  2. Configurar la retención mínima de logs en GitHub Actions y auditar cualquier otro `print()` o `logging` en `backend/` para evitar volcados de PII.

### [SEC-006] Copias de seguridad en SQL sin cifrado en reposo, verificación de integridad ni aislamiento externo

- **Estado de Remediación**: `[x] Resuelto en script (Lote 1.1)` — Añadidos `umask 077`, `gzip -t`, cifrado `age`/`gpg`, manifiesto `.sha256` y hook `rclone` en `scripts/backup_mysql.sh`. *Operación: configurar `BACKUP_AGE_RECIPIENT`/`BACKUP_REMOTE_DEST` en servidor.*
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `scripts/backup_mysql.sh` (líneas 1–54)
- **Diagnóstico del Problema**:
  Además de exponer la contraseña, el flujo de backup almacena archivos `.sql` o comprimidos sin cifrado asimétrico/simétrico fuerte en reposo, sin calcular sumas de verificación criptográficas (`sha256sum`) ni probar restauraciones automáticas en entorno aislado, y sin replicar el artefacto cifrado a un almacenamiento inmutable externo (`Object Lock` / S3 privado).
- **Riesgo o Impacto**:
  Si el servidor es comprometido o sufre corrupción de disco o ransomware, las copias de seguridad son ilegibles, manipulables o quedan igualmente secuestradas/expuestas con toda la base de datos en claro.
- **Solución Óptima Propuesta**:
  1. Cifrar el flujo de `mysqldump` al vuelo mediante `gzip | age` o `gpg --encrypt` con clave pública (sin mantener la clave privada de descifrado en el propio servidor de base de datos).
  2. Subir los artefactos cifrados a un bucket privado con versionado e inmutabilidad y generar manifiestos SHA-256 verificables tras cada backup.

### [SEC-007] Ausencia de estrategia de rotación y expiración de secretos compartidos multi-plataforma

- **Estado de Remediación**: `[x] Resuelto (Lote 1.1)` — Habilitado soporte de rotación dual (`PROXY_SECRET_PREVIOUS` / `DB_PROXY_TOKEN_PREVIOUS`) con `hash_equals` en `db_proxy.php` y documentado en `backend/.env.example`.
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/.env.example`, `db_proxy.php`, `.github/workflows/scrape_cron.yml`, `.github/workflows/weekly_email.yml`, `.github/workflows/deploy_cpanel.yml`
- **Diagnóstico del Problema**:
  El ecosistema depende de múltiples secretos estáticos compartidos entre Vercel (Next.js), servidor PHP (`db_proxy.php`) y GitHub Actions (`PROXY_SECRET`, Stripe webhook secret, `ADMIN_SECRET`, `INDEXNOW_KEY`, credenciales SMTP) sin soporte de doble clave activa (*dual-key rotation*) ni fecha de expiración. Cualquier rotación puntual de `PROXY_SECRET` provoca corte inmediato entre frontend y backend si no se despliegan todos los consumidores en el mismo instante.
- **Riesgo o Impacto**:
  Ventana prolongada de exposición ante sospecha de fuga por miedo a provocar caídas del servicio durante el cambio de credenciales.
- **Solución Óptima Propuesta**:
  1. Implementar soporte de rotación sin tiempo de inactividad en `db_proxy.php` aceptando temporalmente `PROXY_SECRET_PRIMARY` y `PROXY_SECRET_SECONDARY` validados mediante `hash_equals()`.
  2. Establecer un calendario trimestral de rotación documentado en CI/CD y secretos de Vercel/cPanel.

---

## Bloque II: Seguridad de `db_proxy.php`, Conectores y Acceso a Base de Datos

### [SEC-008] Suplantación trivial de IP origen en `db_proxy.php` mediante `HTTP_CF_CONNECTING_IP`

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Implementada validación CIDR IPv4/IPv6 (`ip_in_cidr` / `is_trusted_proxy_ip`) de rangos oficiales de Cloudflare en `db_proxy.php` antes de leer `HTTP_CF_CONNECTING_IP`.
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `db_proxy.php` (líneas 68–71)
- **Diagnóstico del Problema**:
  `db_proxy.php` determina la dirección IP del cliente priorizando ciegamente `$_SERVER['HTTP_CF_CONNECTING_IP']` cuando está presente, sin validar previamente que `$_SERVER['REMOTE_ADDR']` pertenezca al rango oficial de IPs de Cloudflare o a una red de confianza del reverse proxy. Si alguien alcanza el servidor de origen PHP directamente (por IP directa del hosting cPanel o Nginx), puede inyectar cualquier IP falsa en dicha cabecera.
- **Riesgo o Impacto**:
  Evasión completa de listas blancas de IP (IP allowlisting), bypass del rate limiting del proxy y falseamiento de registros de auditoría en peticiones potencialmente hostiles hacia la base de datos.
- **Solución Óptima Propuesta**:
  1. Configurar Nginx/Apache (`mod_remoteip` / `ngx_http_realip_module`) para aceptar `CF-Connecting-IP` únicamente cuando `REMOTE_ADDR` pertenezca a los bloques CIDR oficiales de Cloudflare (y de Vercel si aplica mediante mTLS/túnel).
  2. En `db_proxy.php`, confiar exclusivamente en `$_SERVER['REMOTE_ADDR']` tras esa capa verificada o validar estrictamente `REMOTE_ADDR` contra los rangos permitidos antes de leer cabeceras `HTTP_CF_*`.
  3. Bloquear en firewall/Nginx el acceso directo por IP pública al puerto origen sin pasar por Cloudflare o red privada.

### [SEC-009] Simulación "no-op" de transacciones SQL en `db_proxy.php` rompiendo atomicidad crítica

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Implementado modo `batch` transaccional real (`$pdo->beginTransaction()` / `commit()` / `rollBack()`) en `db_proxy.php` y cola atómica en `frontend/lib/db.ts`; rechazadas transacciones stateless sueltas.
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `db_proxy.php` (líneas 157–165), invocado desde `frontend/app/actions.ts` (`submitSponsoredJob`, líneas 504–543) y endpoints críticos de pago/descarga
- **Diagnóstico del Problema**:
  Aunque el código cliente en Next.js envía comandos `START TRANSACTION`, `BEGIN`, `COMMIT` y `ROLLBACK` asumiendo garantías ACID, `db_proxy.php` intercepta esas sentencias en las líneas 157–165 y devuelve inmediatamente un éxito sintético ("no-op") sin mantener sesión ni ejecutar transacción real alguna en MySQL (además de que cada petición HTTP al proxy abre un ciclo independiente).
- **Riesgo o Impacto**:
  Inconsistencia de datos financieros y de seguridad: un fallo a mitad de `submitSponsoredJob` o en procesos concurrentes no ejecuta `ROLLBACK` real dejando registros huérfanos en base de datos, y los controles basados en bloqueo transaccional (`SELECT ... FOR UPDATE` para limitar descargas o webhooks) quedan completamente inoperantes frente a condiciones de carrera.
- **Solución Óptima Propuesta**:
  1. Eliminar el modelo stateless por sentencia individual para operaciones transaccionales: exponer en `db_proxy.php` un modo de lote transaccional (`POST /batch` o array de sentencias `{ queries: [...] }`) que envuelva toda la lista dentro de un bloque real `$pdo->beginTransaction() ... $pdo->commit()` / `$pdo->rollBack()` en una única conexión PHP.
  2. Mejor aún, sustituir `db_proxy.php` en operaciones financieras por conexión TLS directa o RPC específico por acción de negocio en lugar de SQL arbitrario sobre HTTP.

### [SEC-010] Eliminación rudimentaria de comentarios `#` en `db_proxy.php` antes de analizar consultas

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Escáner léxico `strip_sql_string_literals` y rechazo HTTP `403` ante `--`, `#`, `/*` o `*/` fuera de literales/parámetros `?` en `db_proxy.php`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `db_proxy.php` (línea 153)
- **Diagnóstico del Problema**:
  `db_proxy.php` recorta comentarios SQL estilo `#` mediante sustitución/limpieza de texto sobre la consulta recibida antes de ejecutar sus reglas heurísticas de lista blanca. Manipular cadenas SQL con expresiones regulares fuera de un lexer real de MySQL crea una asimetría clásica entre lo que el filtro cree validar y lo que el motor MySQL interpreta cuando existen cadenas literales, secuencias de escape o comentarios en línea (`/*!...*/`).
- **Riesgo o Impacto**:
  Corrupción silenciosa de datos legítimos (por ejemplo, URLs con fragmentos `#`, descripciones de ofertas con `C#` o hashtags técnicos si no están parametrizados adecuadamente) o posible desincronización entre el analizador de políticas de `db_proxy.php` y el parser real de MySQL.
- **Solución Óptima Propuesta**:
  1. Prohibir comentarios SQL dentro del proxy rechazando cualquier sentencia que los contenga fuera de parámetros enlazados (*prepared statements*), en lugar de intentar modificarla (*strip*) antes de enviarla a PDO.
  2. Asegurar que todos los literales pasen estrictamente como placeholders `?` vía `PDO::prepare` con `PDO::ATTR_EMULATE_PREPARES => false` y migrar las consultas dinámicas de servidor hacia endpoints RPC tipados.

### [SEC-011] Reglas permisivas para `DELETE FROM stripe_processed_events` y tautologías de un parámetro en `db_proxy.php`

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Retirada `stripe_processed_events` de la lista blanca de `DELETE`, bloqueadas tautologías en `WHERE` y exigida coincidencia exacta de placeholders `?` en `db_proxy.php`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `db_proxy.php` (líneas 190–209)
- **Diagnóstico del Problema**:
  Aunque `db_proxy.php` aplica controles de tamaño (512 KB, máximo 200 parámetros y tope de 64 KB por cadena) y limita borrados masivos, sus reglas en las líneas 190–209 permiten explícitamente sentencias `DELETE FROM stripe_processed_events` y aceptan patrones de tautología con un único parámetro (`WHERE col = ?` o condiciones simples mal acotadas). Si una credencial de aplicación o SSRF interno alcanza el proxy, la tabla de idempotencia de Stripe queda expuesta a borrado para forzar reprocesamiento.
- **Riesgo o Impacto**:
  Posibilidad de eliminar eventos Stripe ya procesados para reinyectar webhooks capturados o provocar inconsistencias de facturación/suscripción, así como eliminación selectiva indebida sobre tablas donde la condición de filtrado admita un solo parámetro amplio.
- **Solución Óptima Propuesta**:
  1. Retirar el permiso de `DELETE` sobre `stripe_processed_events` (tabla de registro inmutable / append-only; la limpieza histórica, si hace falta, debe ejecutarse únicamente por evento cron local privilegiado, nunca desde el proxy web).
  2. Sustituir las comprobaciones regex de `WHERE` en `db_proxy.php` por una lista blanca estricta de operaciones permitidas por tabla (principio de mínimo privilegio por rol de aplicación).

### [SEC-012] Ausencia de límites de tiempo de ejecución, timeout SQL y pooling seguro en el gateway `db_proxy.php`

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Configurados `PDO::ATTR_TIMEOUT => 5` y `max_execution_time = 5000` (`max_statement_time = 5` fallback) en `db_proxy.php`, más `AbortSignal.timeout(8000)` en `frontend/lib/db.ts`.
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `db_proxy.php` (configuración PDO y manejo de peticiones), `frontend/lib/db.ts`
- **Diagnóstico del Problema**:
  `db_proxy.php` carece de límites estrictos a nivel de tiempo máximo por sentencia (`MAX_EXECUTION_TIME` / `PDO::ATTR_TIMEOUT`) y el cliente en `frontend/lib/db.ts` interactúa con un gateway PHP de vida corta sin pooling persistente controlado ni disyuntor (*circuit breaker*) ante saturación. Consultas costosas con `ILIKE '%...%'` y `OFFSET 10000` ocupan trabajadores PHP-FPM/Apache indefinidamente hasta el timeout del servidor web.
- **Riesgo o Impacto**:
  Agotamiento rápido de trabajadores PHP y conexiones MySQL (ataque Slow-Query DoS / saturación de pool), provocando caída generalizada de toda la web y del panel administrativo ante ráfagas de tráfico o bots.
- **Solución Óptima Propuesta**:
  1. Configurar `SET SESSION max_statement_time = 5` (MariaDB) o `MAX_EXECUTION_TIME(5000)` (MySQL) y `PDO::ATTR_TIMEOUT` bajo en `db_proxy.php`.
  2. Aplicar `AbortSignal.timeout(8000)` en las llamadas HTTP de `frontend/lib/db.ts` junto con límites de concurrencia y cacheado agresivo en capas superiores.

### [SEC-013] Rechazo `403` de sentencias `ALTER TABLE` en `db_proxy.php` frente a scripts que las ejecutan vía proxy

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Fallo rápido en `backend/consolidate_production_schema.py` ante `DB_PROXY_URL` y cierre garantizado `conn.close()` en `try...finally`.
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `db_proxy.php` y `backend/consolidate_production_schema.py` (líneas 1–400)
- **Diagnóstico del Problema**:
  `db_proxy.php` bloquea adecuadamente comandos DDL destructivos o de esquema como `ALTER TABLE` devolviendo HTTP `403`. Sin embargo, `backend/consolidate_production_schema.py` intenta aplicar múltiples `ALTER TABLE` empleando el adaptador de base de datos genérico sin discriminar si la conexión atraviesa `db_proxy.php`, además de no cerrar explícitamente el handle devuelto por `get_db_connection()`.
- **Riesgo o Impacto**:
  Fallo silencioso o parcial en despliegues de esquema de base de datos cuando el entorno Python opera vía proxy HTTP, dejando tablas de seguridad y cumplimiento (`stripe_processed_events`, `review_reports`, columnas de consentimiento y `source`) sin crearse en producción.
- **Solución Óptima Propuesta**:
  1. Separar estrictamente el usuario/canal de migraciones DDL (ejecutadas únicamente por conexión MySQL directa con privilegios de migración desde CI/SSH o consola segura) respecto al usuario DML de runtime tras `db_proxy.php`.
  2. Hacer que `backend/consolidate_production_schema.py` verifique el modo de conexión al inicio, falle rápido si detecta modo proxy y garantice el cierre con bloque `try...finally` o context manager.

### [SEC-014] Desactivación configurable de validación TLS hacia MySQL y ausencia de cifrado en `psycopg2.py`

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Eliminado `ssl.CERT_NONE` y bloqueado `DB_SSL_REJECT_UNAUTHORIZED=false` en `backend/db_helper.py` y `backend/psycopg2.py`, exigiendo `CERT_REQUIRED` + `check_hostname=True`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/db_helper.py` (líneas 1–52) y `backend/psycopg2.py` (llamada a `pymysql.connect`)
- **Diagnóstico del Problema**:
  `backend/db_helper.py` respeta la bandera `DB_SSL_REJECT_UNAUTHORIZED=false` configurando el contexto TLS en `ssl.CERT_NONE` (aceptando cualquier certificado expirado, autofirmado o de atacante), mientras que el adaptador personalizado `backend/psycopg2.py` invoca `pymysql.connect(...)` sin parámetro `ssl=` alguno, enviando credenciales y datos en claro cuando la conexión apunta a un host MySQL remoto.
- **Riesgo o Impacto**:
  Vulnerabilidad a ataques Intermediario (Man-in-the-Middle / MiTM) entre los runners de GitHub Actions / scripts externos y el servidor de base de datos, permitiendo intercepción de credenciales MySQL y lectura/alteración de registros de ofertas y suscriptores.
- **Solución Óptima Propuesta**:
  1. Eliminar el modo `ssl.CERT_NONE` en producción y exigir verificación estricta con la CA del proveedor (`ssl={'ca': '/ruta/ca-cert.pem', 'check_hostname': True}`).
  2. Configurar soporte obligatorio de TLS en `backend/psycopg2.py` (`ssl_verify_cert=True`, `ssl_verify_identity=True`) siempre que el host no sea `localhost`/`127.0.0.1`.

### [SEC-015] Degradación uniforme de excepciones SQL a `ProgrammingError` y captura silenciosa de errores de escritura

- **Estado de Remediación**: `[x] Resuelto (Lote 1.2)` — Mapeo PEP 249 completo en `CursorWrapper` (`backend/psycopg2.py`) y propagación HTTP `500` ante fallos reales de BD en `frontend/app/api/subscribe/route.ts` y `frontend/app/api/webhooks/stripe/route.ts`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/psycopg2.py` (`CursorWrapper`), `frontend/app/api/webhooks/stripe/route.ts` y `frontend/app/api/subscribe/route.ts`
- **Diagnóstico del Problema**:
  En `backend/psycopg2.py`, `CursorWrapper` captura cualquier excepción procedente de `pymysql` (incluidos `IntegrityError`, `OperationalError`, deadlocks o errores de red) y la reenvuelve genéricamente como `ProgrammingError`. Paralelamente, tanto `webhooks/stripe/route.ts` como `api/subscribe/route.ts` silencian errores SQL (p. ej. columnas inexistentes por deriva de esquema) capturando la excepción sin propagar el fallo al llamante ni disparar alertas.
- **Riesgo o Impacto**:
  Los mecanismos de reintento ante deadlocks o fallos transitorios no distinguen errores recuperables de fallos de sintaxis; en el webhook de Stripe, los fallos de actualización por deriva de esquema devuelven éxito aparente o evitan que Stripe reintente el evento; y en `api/subscribe`, las altas fallidas devuelven `{ success: true }` perdiendo registros de consentimiento RGPD y leads sin dejar rastro de error.
- **Solución Óptima Propuesta**:
  1. Preservar o mapear fielmente la jerarquía PEP 249 en `backend/psycopg2.py` (`IntegrityError`, `OperationalError`, `DatabaseError`).
  2. En webhooks Stripe y endpoints de escritura, distinguir errores esperados de negocio (clave duplicada = idempotencia) de fallos reales de esquema o BD, devolviendo HTTP `500` cuando deba activarse el reintento automático de Stripe o alertando inmediatamente.

---

## Bloque III: Autenticación, Sesiones, CSRF y Control de Acceso

### [SEC-016] Bypass total de validación CSRF cuando el cliente omite cabeceras `Origin` y `Referer`

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Cerrado fall-open en `frontend/middleware.ts` y `verifyCsrfOrigin()` (`frontend/app/actions.ts`), exigiendo `Origin`/`Referer` autorizado o `Sec-Fetch-Site: same-origin` (o `Authorization` en APIs).
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/middleware.ts` (líneas 31–75) y `frontend/app/actions.ts` (`verifyCsrfOrigin`, líneas 64–82)
- **Diagnóstico del Problema**:
  Tanto el middleware de Next.js como la función auxiliar `verifyCsrfOrigin` en Server Actions permiten continuar la ejecución (`return true`) siempre que el navegador o cliente no envíe cabecera `Origin` ni `Referer` (`!origin && !referer`). Esta decisión abre una brecha clásica de CSRF ante clientes o contextos que suprimen dichas cabeceras (por ejemplo, etiquetas `<meta name="referrer" content="no-referrer">` desde páginas maliciosas o formularios POST desde entornos con políticas restrictivas de Referrer), además de omitir validación en llamadas directas sin `Origin`.
- **Riesgo o Impacto**:
  Un atacante puede inducir acciones estatales en nombre de administradores o candidatos autenticados (cambios de preferencias, altas/bajas, reportes o invocación de acciones protegidas por cookie de sesión) mediante formularios HTML construidos con supresión explícita de `Referer`.
- **Solución Óptima Propuesta**:
  1. Implementar un patrón robusto anti-CSRF independiente de `Origin`/`Referer`: combinar cookies con `SameSite=Strict` / `Lax` junto con tokens CSRF sincronizados (*Double Submit Cookie* firmado con HMAC o token ligado a la sesión) y verificar `Sec-Fetch-Site: same-origin` en navegadores modernos.
  2. En peticiones mutables (`POST`, `PUT`, `DELETE`, `PATCH`) desde navegador hacia rutas autenticadas, exigir `Origin` coincidente o token CSRF válido sin hacer fall-open cuando `Origin` y `Referer` falten simultáneamente.

### [SEC-017] Confianza en la cabecera manipulable `x-forwarded-host` para validaciones de origen y construcción de URLs

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Eliminada lectura de `x-forwarded-host`/`host` en `frontend/middleware.ts`, `frontend/app/actions.ts` y `frontend/app/api/unsubscribe/route.ts`, usando lista blanca de hosts y `getSafeSiteBaseUrl()`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/middleware.ts` (líneas 31–75) y `frontend/app/api/unsubscribe/route.ts` (líneas 27–35)
- **Diagnóstico del Problema**:
  El código construye URLs base de la aplicación y evalúa coincidencias de host tomando directamente las cabeceras `x-forwarded-host`, `host` y `x-forwarded-proto` procedentes de la petición entrante sin contrastarlas contra una lista blanca estricta del dominio canónico de producción. En `api/unsubscribe/route.ts` (líneas 27–35), esa URL base generada desde cabeceras de la petición se inserta en el enlace enviado por correo electrónico al solicitar enlace de baja.
- **Riesgo o Impacto**:
  Ataque de *Host Header Injection / Password-or-Token Reset Poisoning*: un atacante puede enviar una petición `request_link` especificando `X-Forwarded-Host: atacante.tld` para que la víctima reciba un correo legítimo de PortalEmpleoIT con un enlace apuntando al dominio del atacante, robando el token HMAC de un solo uso y el email de la víctima cuando ésta haga clic.
- **Solución Óptima Propuesta**:
  1. Eliminar por completo la lectura de `x-forwarded-host`, `x-forwarded-proto` y `host` para generar URLs salientes o validar orígenes en `middleware.ts` y `api/unsubscribe/route.ts`.
  2. Utilizar exclusivamente una constante configurada mediante variable de entorno validada (`NEXT_PUBLIC_SITE_URL`) con comprobación de esquema `https://` y hostname permitido.

### [SEC-018] Comprobación meramente sintáctica (`includes('.')`) de cookie administrativa en el Edge Middleware

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Verificación criptográfica HMAC-SHA256 y expiración de `admin_session` directamente en `frontend/middleware.ts` mediante `crypto.subtle` (`verifyAdminSessionEdge`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/middleware.ts` (líneas 31–75)
- **Diagnóstico del Problema**:
  El middleware de protección de rutas administrativas evalúa el acceso preliminar comprobando únicamente si la cookie `admin_session` contiene un punto (`sessionCookie.includes('.')`), delegando la verificación criptográfica real a capas posteriores. Cualquier atacante que fije manualmente una cookie trivial como `admin_session=a.b` supera el filtro del Edge Middleware y alcanza los Server Components o API handlers internos.
- **Riesgo o Impacto**:
  Reducción drástica de la defensa en profundidad: un descuido en cualquier ruta nueva bajo `/admin` o `/api/admin` que olvide llamar al helper de verificación completo quedaría expuesta públicamente, además de permitir reconocimiento y consumo de recursos en el renderizado previo al chequeo en servidor.
- **Solución Óptima Propuesta**:
  1. Realizar verificación criptográfica HMAC-SHA256 y expiración completa de `admin_session` directamente dentro de `frontend/middleware.ts` utilizando `crypto.subtle` (compatible con Edge Runtime), comparando en tiempo constante (`timingSafeEqual` o comparación XOR de longitud fija).
  2. Mantener la doble verificación dentro de cada Server Action y Route Handler administrativo.

### [SEC-019] Lista de revocación de tokens mágicos (`revokedMagicTokens`) volátil y aislada en memoria RAM

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Persistencia de `jti` revocados en tabla MySQL `revoked_magic_tokens` (más Redis opcional y caché local) en `frontend/app/actions.ts`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`revokedMagicTokens` y verificación de magic links)
- **Diagnóstico del Problema**:
  La revocación de enlaces mágicos de acceso para candidatos o reclutadores se almacena en una estructura `Set`/`Map` en memoria RAM del proceso Node.js (`revokedMagicTokens`). En entornos serverless como Vercel, cada invocación puede ejecutarse en una instancia Lambda diferente o tras un reinicio frío (*cold start*), vaciando inmediatamente el conjunto de tokens revocados.
- **Riesgo o Impacto**:
  Un magic link ya utilizado o revocado puede reutilizarse repetidamente durante toda su ventana de validez (2 horas o hasta 24 horas en el formato de 2 partes) si la segunda petición aterriza en otra instancia serverless o tras un redeploy.
- **Solución Óptima Propuesta**:
  1. Persistir la revocación de tokens (preferiblemente su identificador único `jti` con TTL igual al tiempo restante del token) en Upstash Redis o en una tabla dedicada de base de datos con consumo atómico (`SET jti 1 EX ttl NX`).
  2. Unificar ambos formatos de tokens (`generateSecureToken` / `verifySecureToken`) hacia un único formato firmado de un solo uso con `jti` obligatorio.

### [SEC-020] Limpieza de bloqueos de fuerza bruta `adminAuthLimiter.reset` únicamente en memoria local sin purgar Redis

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Añadido `resetAsync()` en `frontend/lib/rate-limit.ts` e invocado con `await adminAuthLimiter.resetAsync(clientIp)` en `frontend/app/api/admin/auth/route.ts`.
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/admin/auth/route.ts` (llamada a `adminAuthLimiter.reset(clientIp)`) y `frontend/lib/rate-limit.ts`
- **Diagnóstico del Problema**:
  Al iniciar sesión correctamente en `/api/admin/auth`, el handler llama a `adminAuthLimiter.limitAsync(...)` para evaluar el límite distribuido (Redis + memoria), pero tras éxito invoca `adminAuthLimiter.reset(clientIp)` de forma síncrona, método que únicamente limpia `ipMap` en memoria local del worker actual y no elimina la clave acumulada en Upstash Redis.
- **Riesgo o Impacto**:
  Inconsistencia de estado entre nodos: un administrador legítimo o bloqueado temporalmente tras algún fallo previo sigue figurando bloqueado en Redis para el resto de instancias serverless a pesar de haber autenticado correctamente, o bien las métricas quedan desincronizadas frente a la lógica de protección.
- **Solución Óptima Propuesta**:
  1. Añadir y utilizar `await adminAuthLimiter.resetAsync(clientIp)` eliminando la clave tanto en Upstash Redis (`DEL`) como en el mapa local.
  2. Complementar el bloqueo por IP con un contador de intentos fallidos sobre la cuenta/global de administración con alerta inmediata y enfriamiento exponencial.

### [SEC-021] Ausencia de registro de auditoría de accesos administrativos y mecanismo de invalidación global de sesiones

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Añadidos `session_version` revocable (`admin_security_state` / `revoked_admin_sessions`), `verifyAdminSessionTokenAsync` y tabla `admin_audit_logs` en `frontend/lib/adminAuth.ts`, `api/admin/auth/route.ts` y `admin/page.tsx`.
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/lib/adminAuth.ts`, `frontend/app/admin/page.tsx`, `frontend/app/api/admin/auth/route.ts`
- **Diagnóstico del Problema**:
  El acceso al panel administrativo depende de un secreto compartido sin usuarios nominales, sin tabla persistente de auditoría (*audit log*) que registre IP, User-Agent y timestamp de cada login o consulta administrativa, y sin un `session_version` en Redis/BD que permita revocar inmediatamente todas las sesiones `admin_session` activas si se detecta una intrusión.
- **Riesgo o Impacto**:
  Incapacidad forense para reconstruir accesos no autorizados e imposibilidad de invalidar una cookie `admin_session` robada hasta que expire naturalmente, salvo cambiando el secreto maestro del servidor y redesplegando.
- **Solución Óptima Propuesta**:
  1. Incorporar un parámetro `version` o `sid` en los tokens de `adminAuth.ts` validado contra una clave en Redis/BD para permitir botón de "Cerrar todas las sesiones" con efecto inmediato.
  2. Registrar en tabla `admin_audit_logs` todos los intentos de login (exitosos y fallidos) y las acciones administrativas críticas.

### [SEC-022] Magic links carentes de identificador `jti` de un solo uso y divergencia de caducidad en el correo

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Unificados exclusivamente a 3 partes `{timestamp}.{jti}.{hash}` con caducidad de 30 minutos y texto actualizado en `sendMagicLinkEmail()` (`frontend/app/actions.ts`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (`generateSecureToken`, `verifySecureToken`, `sendMagicLinkEmail` línea 210)
- **Diagnóstico del Problema**:
  Los enlaces de acceso sin contraseña carecen de consumo único en almacenamiento compartido (`nonce`/`jti` consumido atómicamente al entrar). Adicionalmente, `sendMagicLinkEmail` (línea 210) comunica al usuario en el texto del correo que el enlace `"expira en 24 horas"`, mientras el código impone `MAX_AGE = 2 * 60 * 60 * 1000` (2 horas) en tokens de 3 partes frente a 24 horas en tokens de 2 partes heredados.
- **Riesgo o Impacto**:
  Ventana de exposición innecesariamente larga en tokens de 2 partes (24h sin vinculación de sesión) y confusión del usuario que provoca reenvíos repetidos o reintentos sobre tokens ya expirados o reenviados en correos reenviados a terceros.
- **Solución Óptima Propuesta**:
  1. Reducir el TTL máximo a 15–30 minutos para accesos de inicio de sesión mediante magic link, unificar el formato de 3 partes con `jti` aleatorio de 128 bits y marcarlo como usado en Redis al validar.
  2. Alinear el texto del correo en `sendMagicLinkEmail` con la caducidad real configurada.

### [SEC-023] Ausencia de verificación de propiedad del correo electrónico al registrar empresas afiliadas/patrocinadas

- **Estado de Remediación**: `[x] Resuelto (Lote 1.3)` — Aplicado rate limiting estricto por IP y email destino más consumo de un solo uso del enlace de verificación en `registerRecruiterAffiliate()` (`frontend/app/actions.ts`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (`registerRecruiterAffiliate`, `generateRecruiterLoginLink`)
- **Diagnóstico del Problema**:
  El flujo de reclutadores/afiliados permite operaciones asociadas al email corporativo y generación de enlaces sin aplicar controles sólidos de verificación de dominio corporativo ni MFA opcional, apoyándose en la validación de magic link y cabeceras CSRF débiles analizadas en `SEC-016`.
- **Riesgo o Impacto**:
  Suplantación de reclutadores o abuso del sistema de envío de correos de acceso hacia direcciones corporativas de terceros.
- **Solución Óptima Propuesta**:
  1. Exigir verificación previa del correo mediante código/token de un solo uso enviado al dominio antes de activar cualquier perfil de afiliado/reclutador en base de datos.
  2. Aplicar rate limiting estricto por IP y por correo destino en `generateRecruiterLoginLink`.

---

## Bloque IV: Rate Limiting, Control de Abuso y Denegación de Servicio (DoS)

### [SEC-024] Uso del método síncrono `.limit()` en lugar de `.limitAsync()` desactivando Upstash Redis en producción

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — `frontend/lib/rate-limit.ts` + 12 rutas API migradas a `await ...limitAsync()` sobre Redis local / Upstash).
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/jobs/route.ts` (líneas 1–60), `frontend/app/api/salarios/route.ts` (líneas 1–30), `frontend/app/api/fresh-alerts/route.ts` (líneas 1–46), `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/widget/vacantes-count/route.ts`, `frontend/app/api/index-job/route.ts` y `frontend/lib/rate-limit.ts`
- **Diagnóstico del Problema**:
  Aunque `frontend/lib/rate-limit.ts` implementa soporte distribuido mediante Upstash Redis a través de `.limitAsync()`, prácticamente todos los endpoints API públicos invocan el método síncrono `.limit(clientIp)`. Ese método síncrono consulta exclusivamente un `Map` local en memoria del proceso Node.js actual, ignorando por completo Redis.
- **Riesgo o Impacto**:
  En arquitectura serverless (Vercel), cada invocación escalada ejecuta en un contenedor efímero independiente: el rate limiting distribuido es prácticamente inexistente, permitiendo ataques de scraping masivo, fuerza bruta, abuso del endpoint `/api/index-job` o agotamiento de base de datos sin activar bloqueo global.
- **Solución Óptima Propuesta**:
  1. Sustituir todas las invocaciones `.limit(...)` por `await ...limitAsync(...)` en todas las rutas de `frontend/app/api/`.
  2. Marcar el método síncrono `.limit()` como `@deprecated` en `frontend/lib/rate-limit.ts` o eliminarlo tras migrar todas las llamadas para impedir regresiones futuras.

### [SEC-025] Endpoint de solicitud de baja (`request_link`) sin rate limiting utilizable para Email Bombing

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — `unsubscribeLinkLimiter` por IP y hash SHA-256 de email + soporte `TURNSTILE_SECRET_KEY` en `frontend/app/api/unsubscribe/route.ts`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (acción `request_link`)
- **Diagnóstico del Problema**:
  La rama `request_link` de `/api/unsubscribe` recibe una dirección de correo electrónico cualquiera y dispara el envío inmediato de un email SMTP con el enlace de baja, sin pasar por ningún `RateLimiter` distribuido por IP ni por dirección de correo destino, y sin requerir desafío anti-bot (Turnstile/reCAPTCHA).
- **Riesgo o Impacto**:
  Un atacante puede automatizar miles de peticiones contra este endpoint usando emails de víctimas terceras (*Email Bombing / Mail Relay Abuse*), saturando los buzones de las víctimas, agotando la cuota SMTP diaria de la plataforma y degradando la reputación del dominio remitente (inclusión en listas negras SPF/DKIM/DMARC/Spamhaus).
- **Solución Óptima Propuesta**:
  1. Integrar `await limiter.limitAsync(...)` en `request_link` tanto por IP como por hash del email normalizado (ej. máximo 2 solicitudes cada 15 minutos por email).
  2. Añadir verificación anti-bot invisible (Cloudflare Turnstile) en el formulario web de `/darse-de-baja` y validar que el envío solo ocurra tras superar el challenge cuando la petición provenga de formulario interactivo.

### [SEC-026] Claves de rate limiting globales sin IP/usuario permitiendo Denegación de Servicio funcional en reacciones y reseñas

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — `clientIp` incluido en claves de `reactToJob` y `submitCompanyReview` en `frontend/app/actions.ts`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`reactToJob` línea ~621 y `submitCompanyReview` línea ~739)
- **Diagnóstico del Problema**:
  En `reactToJob`, la clave pasada al limitador se construye como `` `reaction_${jobId}_${reactionType}` `` sin incluir `clientIp`, y en `submitCompanyReview` se construye como `` `review_${companySlug}` `` sin incluir `clientIp` ni identificador de sesión. Esto provoca que la cuota compartida se consuma globalmente por oferta o empresa para todos los visitantes del sitio.
- **Riesgo o Impacto**:
  Un único script malicioso puede enviar un puñado de peticiones sobre todas las ofertas activas y perfiles de empresa, agotando instantáneamente la cuota global e impidiendo que cualquier usuario legítimo de Internet pueda reaccionar o dejar reseñas (DoS lógico trivial).
- **Solución Óptima Propuesta**:
  1. Incluir obligatoriamente la IP del cliente (y huella de sesión/usuario cuando exista) en la clave del limitador: `` `reaction_${clientIp}_${jobId}_${reactionType}` `` y `` `review_${clientIp}_${companySlug}` ``.
  2. Migrar `checkRateLimit` en `actions.ts` a Upstash Redis (`limitAsync`) para que el límite sea efectivo a nivel de toda la flota serverless.

### [SEC-027] Rate limiter local en memoria separado en Server Actions y `/api/subscribe`

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — `actions.ts` y `api/subscribe/route.ts` unificados sobre `RateLimiter.limitKeyAsync` / `subscribeLimiter.limitAsync`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`checkRateLimit` / `rateLimitMap`) y `frontend/app/api/subscribe/route.ts`
- **Diagnóstico del Problema**:
  Tanto `actions.ts` como `api/subscribe/route.ts` mantienen implementaciones locales independientes basadas en `Map` en memoria de Node.js en lugar de consumir el cliente centralizado con Upstash Redis en `frontend/lib/rate-limit.ts`. Adicionalmente, el `Map` en memoria sin política estricta de evicción por tamaño máximo puede crecer sin control ante ataques distribuidos con IPs aleatorias.
- **Riesgo o Impacto**:
  Evasión total de los límites en despliegue distribuido para suscripciones masivas de spam (contaminación de base de datos `subscribers`) y envío repetido de magic links / formularios patrocinados, además de riesgo de fuga de memoria en instancias longevas.
- **Solución Óptima Propuesta**:
  1. Unificar toda la lógica de limitación de tasa en `frontend/lib/rate-limit.ts` utilizando `limitAsync` con Redis como backend primario.
  2. Establecer un tope de entradas (`MAX_MAP_SIZE` LRU) en el fallback en memoria local para evitar agotamiento de RAM si Redis no está disponible temporalmente.

### [SEC-028] Ejecución de DDL (`CREATE TABLE IF NOT EXISTS`) en tiempo de petición HTTP dentro de `reportCompanyReview`

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — DDL retirado de `reportCompanyReview` y trasladado a `backend/consolidate_production_schema.py`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`reportCompanyReview`, línea 797)
- **Diagnóstico del Problema**:
  Cada invocación del Server Action `reportCompanyReview` ejecuta la sentencia DDL `CREATE TABLE IF NOT EXISTS review_reports (...)` contra MySQL antes de insertar el reporte. Ejecutar DDL en endpoints públicos interactivos obliga a MySQL a adquirir bloqueos de metadatos (*Metadata Locks*) sobre el catálogo de tablas en cada llamada concurrente y requiere que el usuario de aplicación web posea privilegio `CREATE` en producción.
- **Riesgo o Impacto**:
  Violación grave del principio de mínimo privilegio en base de datos (el proxy/usuario web no debería poder crear/alterar tablas) y alto riesgo de bloqueo en cascada de consultas en MySQL (*Waiting for table metadata lock*) si un bot bombardea `reportCompanyReview`.
- **Solución Óptima Propuesta**:
  1. Extraer `CREATE TABLE IF NOT EXISTS review_reports` de `actions.ts` e incorporarlo a las migraciones SQL versionadas previas al despliegue.
  2. Revocar permisos DDL (`CREATE`, `ALTER`, `DROP`) al usuario MySQL empleado por `db_proxy.php` y el runtime web.

### [SEC-029] Amplificación de consultas costosas mediante `OFFSET` profundo y comodines iniciales sin cachear

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — tope de página `50`, `safeLimit` y cursor keyset `beforeCreatedAt`/`beforeId` en `frontend/lib/jobs.ts` y `frontend/app/api/jobs/route.ts`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/lib/jobs.ts` (`getJobs`, `getFeaturedJobs`, `getJobsCount`), `frontend/app/api/jobs/route.ts`
- **Diagnóstico del Problema**:
  El motor de listado en `frontend/lib/jobs.ts` permite paginación mediante `OFFSET` hasta `500 * 20` (10.000 filas descartadas y ordenadas antes de devolver 20) combinada con filtros `ILIKE '%query%'` sobre múltiples columnas (`title`, `company`, `description_snippet`) y `NOT ILIKE` para excluir presencial. Debido al comodín inicial `%`, MySQL no puede utilizar índices B-Tree ni índices `FULLTEXT`, forzando escaneos completos o de rango amplio en cada página solicitada.
- **Riesgo o Impacto**:
  Un scraper agresivo o atacante puede saturar la CPU de MySQL y el pool de `db_proxy.php` solicitando repetidamente páginas profundas (`page=450&q=a`) sin coste alguno para el atacante.
- **Solución Óptima Propuesta**:
  1. Sustituir la paginación por `OFFSET` en APIs y feeds profundos por *keyset pagination* (cursor basado en `(created_at, id)`), y limitar la paginación web anónima a un máximo razonable (ej. 50 páginas) o cachear las primeras páginas.
  2. Reemplazar `ILIKE '%query%'` por `MATCH(...) AGAINST(... IN BOOLEAN MODE)` sobre índice `FULLTEXT` real.

### [SEC-030] Endpoint `/api/fresh-alerts` expuesto a escaneos `LIKE '%kw%'` intensivos y frecuencia libre

- **Estado de Remediación**: [x] Resuelto (Lote 1.4 — máximo 5 keywords sanitizadas de 2..30 caracteres y caché TTL de 60s en `frontend/app/api/fresh-alerts/route.ts`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/fresh-alerts/route.ts` (líneas 1–46)
- **Diagnóstico del Problema**:
  La ruta consulta ofertas de las últimas 2 horas (`NOW() - INTERVAL 2 HOUR`) aplicando filtros `LIKE '%kw%'` por palabra clave de entrada, mientras usa el limitador síncrono ya señalado en `SEC-024`. Al carecer de caché compartida por clave normalizada o límite efectivo en Redis, peticiones automatizadas con distintos valores de `kw` golpean directamente MySQL.
- **Riesgo o Impacto**:
  Saturación de lecturas en base de datos y degradación de latencia para usuarios reales en el feed de alertas tempranas.
- **Solución Óptima Propuesta**:
  1. Migrar a `await freshAlertsLimiter.limitAsync(...)`, validar longitud/cantidad de keywords aceptadas (máximo 5 keywords, 2–30 caracteres) y utilizar búsqueda `FULLTEXT` o filtro precalculado sobre caché Redis de 60 segundos.

---

## Bloque V: Pasarelas de Pago (Stripe / PayPal) y Lógica Transaccional

### [SEC-031] Verificación de pago PayPal PDT en modo "Fail-Open" concediendo acceso gratuito a informes de pago

- **Estado de Remediación**: [x] Resuelto (Lote 1.5 — verificación Fail-Closed estricta en `frontend/app/api/checkout/report/verify/route.ts` validando `PAYPAL_IDENTITY_TOKEN`, `payment_status`, `mc_currency === 'EUR'`, `mc_gross` y `receiver_email`).
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/checkout/report/verify/route.ts` (líneas 43–71)
- **Diagnóstico del Problema**:
  Al verificar una transacción de PayPal mediante PDT en `/api/checkout/report/verify`, si la variable `PAYPAL_IDENTITY_TOKEN` no está configurada o si la llamada `fetch` contra los servidores de PayPal lanza una excepción de red/timeout, el flujo captura la condición o continúa concediendo un token firmado de descarga del informe como si el pago hubiera sido validado exitosamente (*Fail-Open*).
- **Riesgo o Impacto**:
  Evasión directa de pasarela de pago: cualquier usuario puede obtener gratis el informe salarial de pago manipulando o invocando el endpoint de verificación con un parámetro `tx` arbitrario cuando PayPal no esté configurado o inducir/esperar errores en la comunicación saliente.
- **Solución Óptima Propuesta**:
  1. Invertir inmediatamente la lógica hacia **Fail-Closed**: si falta `PAYPAL_IDENTITY_TOKEN`, si `fetch` falla, si `response.ok` es falso o si la respuesta no comienza exactamente con `SUCCESS` coincidiendo el importe (`mc_gross >= expected`), moneda (`EUR`) y receptor (`receiver_email`), abortar obligatoriamente con HTTP `402` / `403` / `503`.
  2. Migrar desde el protocolo heredado PDT hacia la API moderna **PayPal Orders v2** verificada exclusivamente en servidor con captura explícita y webhooks firmados criptográficamente.

### [SEC-032] Evasión del límite de 5 descargas del informe mediante condición de carrera (TOCTOU) y falta de atomicidad

- **Estado de Remediación**: [x] Resuelto (Lote 1.5 — incremento atómico `UPDATE report_downloads SET download_count = download_count + 1 ... WHERE session_id = ? AND download_count < COALESCE(max_downloads, 5)` verificando `rowCount === 1` en `frontend/app/api/checkout/report/download/route.ts` y `frontend/lib/db.ts`).
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/checkout/report/download/route.ts` y `frontend/lib/reportToken.ts` (en combinación con `db_proxy.php` líneas 157–165)
- **Diagnóstico del Problema**:
  El endpoint `/api/checkout/report/download` implementa un tope de 5 descargas sobre `report_downloads` validando el contador antes de incrementarlo. Debido a que `db_proxy.php` ignora transacciones (`START TRANSACTION` / `COMMIT` no-op), múltiples peticiones paralelas enviadas simultáneamente (*race condition* TOCTOU) leen el mismo contador `downloads < 5` antes de que se persista el incremento, permitiendo descargar el recurso ilimitadas veces (especialmente grave junto con la brecha `SEC-031` y TTL de 24h–48h en `reportToken.ts`).
- **Riesgo o Impacto**:
  Bypass del control de licencias y redistribución no controlada de informes de pago, así como alteración de métricas de uso antifraude.
- **Solución Óptima Propuesta**:
  1. Realizar el incremento de forma atómica en una sola sentencia condicional en base de datos:
     `UPDATE report_downloads SET download_count = download_count + 1 WHERE token_hash = ? AND download_count < 5`
     y comprobar `affectedRows === 1` antes de servir el archivo (o utilizar `INCR` atómico en Upstash Redis como bloqueo previo).
  2. Cerrar primero la brecha `SEC-031` para impedir la emisión de tokens no pagados.

### [SEC-033] Ausencia de manejo de disputas, contracargos (`charge.dispute.created`) y reembolsos (`charge.refunded`) en webhook Stripe

- **Estado de Remediación**: [x] Resuelto (Lote 1.5 — manejadores para `charge.refunded`, `charge.dispute.created`, `invoice.payment_succeeded` y periodo de gracia `past_due` en `invoice.payment_failed` dentro de `frontend/app/api/webhooks/stripe/route.ts`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/webhooks/stripe/route.ts` (líneas 1–544)
- **Diagnóstico del Problema**:
  Aunque el endpoint valida la firma de Stripe, exige `payment_status === 'paid'` y gestiona `invoice.payment_failed`, omite procesar eventos críticos del ciclo de vida económico: `charge.refunded`, `charge.dispute.created` / `charge.dispute.closed` y `invoice.payment_succeeded`. Un usuario que compre acceso premium o publique una oferta patrocinada y posteriormente ejecute un reembolso o contracargo (*chargeback*) en su banco conserva intactos los privilegios en base de datos.
- **Riesgo o Impacto**:
  Fraude financiero directo (*friendly fraud*), pérdida de ingresos con costes de penalización por disputa en Stripe mientras el cliente sigue disfrutando servicios activos, y desincronización permanente en renovaciones (`invoice.payment_succeeded`).
- **Solución Óptima Propuesta**:
  1. Suscribir y manejar explícitamente `charge.refunded` (cuando `refunded === true` o importe reembolsado total), `charge.dispute.created` y `customer.subscription.deleted` para desactivar inmediatamente `is_premium`, marcar ofertas patrocinadas como suspendidas y registrar incidente antifraude.
  2. Manejar `invoice.payment_succeeded` para restablecer y extender vigencias tras recuperaciones automáticas (*Smart Retries*), acompañando `invoice.payment_failed` de un estado `past_due` con periodo de gracia en lugar de revocar bruscamente en el primer fallo transitorio.

### [SEC-034] Riesgo de ejecución duplicada en `stripe_processed_events` por no-atomicidad sobre proxy y catch silencioso

- **Estado de Remediación**: [x] Resuelto (Lote 1.5 — inserción atómica con verificación `insertRes.rowCount === 1`, retirada de DDL en runtime y propagación de HTTP `500` ante fallos no duplicados en `frontend/app/api/webhooks/stripe/route.ts`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/webhooks/stripe/route.ts` (líneas 1–544) y `db_proxy.php` (líneas 190–209)
- **Diagnóstico del Problema**:
  La protección de idempotencia mediante `stripe_processed_events` opera sobre conexiones sin transacción real en `db_proxy.php` y envuelve ciertas consultas en bloques `try/catch` permisivos para esquivar posibles desajustes de esquema. Si Stripe reenvía dos webhooks simultáneamente o la tabla falta en producción (como ocurre en el dump `ecosier2_PortalEmpleo.sql`), la verificación previa no frena la segunda ejecución concurrente.
- **Riesgo o Impacto**:
  Doble concesión de créditos/días premium, envío duplicado de correos de confirmación o ejecución repetida de efectos secundarios no idempotentes, e incapacidad para detectar que la tabla de idempotencia no existe en producción.
- **Solución Óptima Propuesta**:
  1. Utilizar `INSERT INTO stripe_processed_events (event_id, created_at) VALUES (?, NOW())` apalancado en una `PRIMARY KEY` / `UNIQUE KEY` real en MySQL: solo continuar el procesamiento si `affectedRows === 1`, abortando con `200 OK` únicamente ante error específico de clave duplicada (`ER_DUP_ENTRY` / código `1062`), y propagando HTTP `500` ante cualquier otro error de esquema/conexión.
  2. Garantizar la creación de `stripe_processed_events` en el esquema productivo antes de procesar tráfico real.

### [SEC-035] Correlación de identidades por subcadena (`isSameLocalIdentity`) y ausencia de validación estricta en `submitSponsoredJob`

- **Estado de Remediación**: [x] Resuelto (Lote 1.5 — igualdad exacta en `isSameLocalIdentity` en `frontend/app/api/webhooks/stripe/route.ts` y validación `zod` estricta con `sponsoredJobSchema` en `submitSponsoredJob` de `frontend/app/actions.ts`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/webhooks/stripe/route.ts` (`isSameLocalIdentity`) y `frontend/app/actions.ts` (`submitSponsoredJob`)
- **Diagnóstico del Problema**:
  En `webhooks/stripe/route.ts`, la función auxiliar `isSameLocalIdentity` compara partes locales de correos electrónicos mediante comprobación de subcadena en lugar de igualdad exacta tras normalización segura, pudiendo asociar cuentas distintas con nombres similares (ej. `ana` vs `ana.garcia`). En paralelo, `submitSponsoredJob` en `actions.ts` no valida longitudes máximas de campos ni formato estricto de `company_email` antes de registrar el lead/oferta previa al checkout.
- **Riesgo o Impacto**:
  Asociación cruzada errónea de suscripciones o pagos entre dos usuarios con prefijos de correo parecidos (impacto en confidencialidad e integridad de cuentas) y entrada de datos malformados o gigabytes de payload truncados en flujos patrocinados.
- **Solución Óptima Propuesta**:
  1. Eliminar la comparación por subcadena en `isSameLocalIdentity`: utilizar exclusivamente igualdad estricta tras normalización canónica (`trim().toLowerCase()`) o mejor aún, asociar siempre por `stripe_customer_id` / `client_reference_id` inmutable.
  2. Validar `submitSponsoredJob` con esquema `zod` estricto (regex RFC para `company_email`, límites de longitud por campo y whitelist de categorías/monedas).


---

## Bloque VI: XSS, Sanitización, Inyección de Cabeceras y Seguridad en Cliente

### [SEC-036] Vulnerabilidad XSS reflejado en respuesta HTML de respaldo de `/api/unsubscribe`

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — escape HTML estricto en `frontend/app/api/unsubscribe/route.ts` sobre `${email}`, `${unsubLink}` y `${baseUrl}`).
- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (líneas 140–150)
- **Diagnóstico del Problema**:
  Cuando el endpoint `/api/unsubscribe` devuelve su respuesta HTML de respaldo tras procesar parámetros de query string, interpola directamente la variable `${email}` controlada por el usuario dentro de la plantilla HTML generada en servidor sin aplicar escape de entidades HTML (`<`, `>`, `"`, `'`, `&`).
- **Riesgo o Impacto**:
  Un atacante puede construir un enlace malicioso contra el dominio oficial del portal incluyendo un payload JavaScript dentro del parámetro `email` (o mediante peticiones manipuladas en contextos donde falle la firma/fallback), ejecutando scripts arbitrarios en el navegador de la víctima bajo el origen del portal (robo de cookies no-HttpOnly, manipulación DOM, phishing dentro del sitio oficial).
- **Solución Óptima Propuesta**:
  1. Sustituir inmediatamente la generación manual de cadenas HTML en `route.ts` por redirecciones tipadas (`NextResponse.redirect`) con códigos de estado controlados hacia la ruta React `/darse-de-baja` (que escape automáticamente en JSX) o aplicar una función estricta `escapeHtml()` sobre cualquier valor interpolado.
  2. Configurar `Content-Type: text/html; charset=utf-8` junto con CSP restrictiva específica en respuestas HTML generadas en API routes.

### [SEC-037] Política de Seguridad de Contenidos (CSP) debilitada por `'unsafe-inline'` y `'unsafe-eval'`

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — `frontend/middleware.ts` genera `nonce` criptográfico por petición, inyecta `x-nonce` y elimina `'unsafe-inline'` y `'unsafe-eval'` de `script-src`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/middleware.ts` (líneas 31–75)
- **Diagnóstico del Problema**:
  La cabecera `Content-Security-Policy` emitida en el middleware autoriza explícitamente `'unsafe-inline'` y `'unsafe-eval'` en `script-src`, lo que desactiva la defensa principal de CSP contra ejecución de scripts inline inyectados y evaluaciones dinámicas de código JavaScript.
- **Riesgo o Impacto**:
  Cualquier brecha XSS puntual en markdown de ofertas, descripciones scrapeadas de terceros, noticias generadas por IA o parámetros reflejados permite ejecución completa de JavaScript malicioso sin bloqueo alguno por parte del navegador.
- **Solución Óptima Propuesta**:
  1. Implementar generación de **nonces criptográficos por petición** (`crypto.randomUUID()` / `btoa`) dentro de `frontend/middleware.ts`, pasándolos mediante cabecera `x-nonce` a `layout.tsx` y usando `'strict-dynamic'` junto a `'nonce-<valor>'`.
  2. Eliminar por completo `'unsafe-inline'` y `'unsafe-eval'` de `script-src` en producción.

### [SEC-038] Anulación silenciosa de todas las cabeceras de seguridad en rutas de activos estáticos de Nginx

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — cabeceras HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy y COOP repetidas con `always` en `/_next/static/` y `/static/` de `nginx.conf.template`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `nginx.conf.template` (líneas 161–174)
- **Diagnóstico del Problema**:
  En Nginx, las directivas `add_header` definidas a nivel `server` o `http` se **heredan únicamente si el bloque `location` hijo no declara ninguna directiva `add_header` propia**. En las líneas 161–174 de `nginx.conf.template`, los bloques `location` dedicados a archivos estáticos definen `add_header Cache-Control ...`, provocando que Nginx descarte automáticamente HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y cualquier CSP definida en el bloque superior para todas esas respuestas.
- **Riesgo o Impacto**:
  Pérdida de protección `X-Content-Type-Options: nosniff` (riesgo de MIME sniffing XSS en activos), ausencia de HSTS (posible downgrade HTTP) y exposición a *clickjacking* o fuga de políticas de seguridad sobre recursos servidos directamente por Nginx.
- **Solución Óptima Propuesta**:
  1. Centralizar las cabeceras de seguridad comunes en un archivo snippet (`snippets/security-headers.conf`) e incluirlo mediante `include snippets/security-headers.conf;` dentro de **cada** bloque `location` que declare `add_header`, o bien utilizar el módulo `headers-more-nginx-module` (`more_set_headers`).
  2. Añadir `always` en las directivas `add_header` de seguridad críticas para asegurar su envío incluso en respuestas `4xx`/`5xx`.

### [SEC-039] Sanitizador HTML basado en regex propio y filtrado por lista negra en generación de noticias IA

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — `isomorphic-dompurify` en `frontend/lib/markdown.tsx` y `bleach.clean` por lista blanca en `backend/generate_news_post.py` + `backend/requirements.txt`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/markdown.ts` (`frontend/lib/markdown.tsx`) y `backend/generate_news_post.py`
- **Diagnóstico del Problema**:
  El renderizador de contenido (`markdown.ts`/`markdown.tsx`) utiliza reemplazos basados en expresiones regulares propias en lugar de un analizador HTML completo conforme a WHATWG, mientras que `backend/generate_news_post.py` filtra la salida generada por el modelo LLM Gemini mediante una lista negra ingenua de cadenas (`<script`, `javascript:`, etc.). Los sanitizadores regex y las listas negras son históricamente eludibles mediante etiquetas SVG (`<svg/onload=...>`), `<math>`, atributos de evento poco comunes (`onpointerenter`, `onanimationstart`), entidades codificadas (`&#x6a;avascript:`) o diferencias entre parser HTML5 del navegador y regex (*mXSS*).
- **Riesgo o Impacto**:
  XSS almacenado (*Stored XSS*) si un feed externo, un título/descripción manipulado o una inyección indirecta de prompt (*Indirect Prompt Injection*) hacia Gemini logra colar marcado malicioso en artículos de noticias o fichas de empleo.
- **Solución Óptima Propuesta**:
  1. Reemplazar el sanitizador regex en frontend por `isomorphic-dompurify` (o `sanitize-html` en servidor) con lista blanca estricta de etiquetas (`p`, `ul`, `li`, `strong`, `em`, `a` restringido a `https://` y `http://`) y cero atributos `on*` o `style` libre.
  2. Aplicar la misma sanitización por lista blanca (`bleach` o `nh3` en Python) en `backend/generate_news_post.py` y en los scrapers antes de almacenar texto enriquecido en MySQL.

### [SEC-040] Scripts inline sin nonce e identificador Google Analytics de fallback hardcodeado en `layout.tsx`

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — lectura de `x-nonce` vía `headers()`, `nonce={nonce}` en todos los `<script>` inline y retirada de fallback GA hardcodeado en `frontend/app/layout.tsx`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/layout.tsx`
- **Diagnóstico del Problema**:
  El layout raíz inyecta scripts inline mediante `dangerouslySetInnerHTML` sin asociar nonce dinámico (obligando de facto a mantener `'unsafe-inline'` en la CSP) y contempla un identificador de Google Analytics por defecto embebido en código fuente en caso de ausencia de variable de entorno.
- **Riesgo o Impacto**:
  Imposibilidad técnica de endurecer la política CSP hacia ejecución estricta por nonce y envío de analíticas de producción o entornos locales/staging hacia una propiedad fija no controlada por configuración de entorno.
- **Solución Óptima Propuesta**:
  1. Leer el `x-nonce` propagado por `middleware.ts` dentro de `RootLayout` (vía `headers()`) y asignarlo como atributo `nonce={nonce}` en todos los `<Script>` y `<script>` de `layout.tsx`, o mover scripts estáticos a módulos externos versionados.
  2. Exigir explícitamente `process.env.NEXT_PUBLIC_GA_ID` sin valor fallback hardcodeado.

### [SEC-041] Carga de scripts externos de terceros sin Subresource Integrity (SRI) ni aislamiento estricto

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — proxy cacheado de logotipos `/api/company-logo` en servidor para `frontend/components/CompanyLogo.tsx` evitando exposición de IP/Referer a Clearbit).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/layout.tsx`, `frontend/components/CompanyLogo.tsx`, `frontend/public/OneSignalSDKWorker.js`
- **Diagnóstico del Problema**:
  La aplicación carga recursos JavaScript y gráficos externos de terceros (como SDK de OneSignal y servicio externo de Clearbit para logotipos en `CompanyLogo.tsx`) sin atributos `integrity="..."` (cuando el proveedor ofrece versiones fijadas) ni políticas estrictas de `crossorigin` o aislamiento de dominio propio mediante proxy de imágenes cacheado.
- **Riesgo o Impacto**:
  Riesgo de ataque a la cadena de suministro web (Magecart / compromisorio de CDN tercero) en scripts cargados sin fijación de versión/hash, además de exposición automática de IPs de usuarios y cabeceras `Referer` hacia terceros al solicitar imágenes directas.
- **Solución Óptima Propuesta**:
  1. Fijar versiones exactas de SDKs externos y añadir SRI donde el proveedor lo soporte, restringiendo `script-src` y `connect-src` en CSP a orígenes mínimos indispensables.
  2. Servir logotipos de empresa a través de un endpoint propio proxy/cacheado en servidor (con protección SSRF) en lugar de exponer al navegador directamente contra terceros como Clearbit.

### [SEC-042] Parámetros de seguimiento (`email`, `campaign`, `redirect`) sin firma criptográfica y correos sin codificación URL en enlaces de tracking

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — verificación HMAC obligatoria en `frontend/lib/trackingAuth.ts`, `/api/track-open`, `/api/track-click` y generación centralizada en `backend/logic/tracking.py` usada por `mailer.py` y `send_instant_featured_alerts.py`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/track-open/route.ts`, `frontend/app/api/track-click/route.ts`, `backend/mailer.py` (línea 405) y `backend/send_instant_featured_alerts.py` (líneas 40 y 93)
- **Diagnóstico del Problema**:
  Aunque `/api/track-click` restringe destinos externos frente a `defaultAllowedHosts` y `ALLOWED_REDIRECT_HOSTS`, ni `/api/track-open` ni `/api/track-click` validan firma criptográfica HMAC sobre los parámetros `email`, `campaign` y `redirect`. Adicionalmente, `backend/mailer.py` (línea 405) y `backend/send_instant_featured_alerts.py` (líneas 40 y 93) concatenan directamente `email={email}` en las URLs de tracking sin aplicar `urllib.parse.quote(...)`, provocando enlaces rotos o inyección de parámetros con caracteres `+` o `&`.
- **Riesgo o Impacto**:
  Cualquier tercero puede generar peticiones masivas falsas contra `/api/track-open` y `/api/track-click` para envenenar estadísticas de campañas, provocar crecimiento descontrolado (*DB bloat*) en la tabla `email_tracking`, forzar redirecciones internas arbitrarias dentro de rutas del dominio permitido o romper el rastreo cuando el email contenga `+` (ej. `usuario+alias@gmail.com`).
- **Solución Óptima Propuesta**:
  1. Firmar los parámetros `(email, campaign, redirect, exp)` con HMAC-SHA256 en Python y verificar la firma en `/api/track-open` y `/api/track-click` antes de escribir en `email_tracking` o redirigir.
  2. Aplicar siempre `urllib.parse.quote(email, safe='')` (o enviar un `subscriber_id` opaco/firmado para no filtrar emails en logs HTTP ni referers) en todos los scripts `mailer.py` y `send_*.py`.

### [SEC-043] Exposición de correos electrónicos en claro dentro de parámetros de consulta HTTP (logs de servidor y `Referer`)

- **Estado de Remediación**: [x] Resuelto (Lote 1.6 — tokens opacos `?t=<base64url>.<hmac>` sin PII en URL ni en logs para `/api/track-open` y `/api/track-click`, con `Referrer-Policy: no-referrer`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/track-open/route.ts`, `frontend/app/api/track-click/route.ts`, `frontend/app/darse-de-baja/page.tsx`, `backend/mailer.py`
- **Diagnóstico del Problema**:
  Los píxeles de apertura, los clics de seguimiento y el parámetro de consulta en `/darse-de-baja` transportan la dirección de correo electrónico en texto claro dentro de la URL (`GET ?email=...`). Las URLs de peticiones `GET` quedan persistidas en logs de acceso Nginx/Vercel, historiales de navegador, proxies corporativos y cabeceras `Referer` si el usuario navega hacia enlaces externos tras hacer clic.
- **Riesgo o Impacto**:
  Fuga pasiva de PII hacia registros de infraestructura y herramientas de analítica de terceros (Google Analytics / scripts cliente) que capturan `window.location.href` incluyendo `query strings`.
- **Solución Óptima Propuesta**:
  1. Sustituir el parámetro `email` en claro en todas las URLs de tracking y baja por un identificador cifrado o un `subscriber_id` UUID opaco acompañado de firma HMAC.
  2. Añadir `Referrer-Policy: no-referrer` o `strict-origin` en respuestas sensibles y limpiar parámetros sensibles de la URL cliente mediante `history.replaceState`.

---

## Bloque VII: SSRF, Redirecciones, XML y Seguridad en Scrapers / Bots

### [SEC-044] Condición de carrera TOCTOU (DNS Rebinding) en validación SSRF de Node.js y Python

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — `backend/logic/ssrf.py` con pinning de IP por hilo y validación DNS pública en `backend/main.py`, más `isSafePublicUrlWithDns` en `frontend/lib/urlSafetyServer.ts` y `frontend/app/redirect/[id]/page.tsx`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/urlSafety.ts` (`isSafePublicUrl`), invocado desde `frontend/app/redirect/[id]/page.tsx`, y `backend/main.py` (`is_safe_scraper_url`)
- **Diagnóstico del Problema**:
  Tanto `isSafePublicUrl` en frontend como `is_safe_scraper_url` en `backend/main.py` evalúan la cadena de URL / resolución DNS previa para descartar redes privadas o localhost (`127.0.0.0/8`, `10.0.0.0/8`, `169.254.169.254`). Sin embargo, al no fijar la IP resuelta al socket HTTP de salida (en `backend/main.py` solo valida el formato URL de forma estática sin pinning de socket/DNS), la segunda resolución DNS efectuada por la librería HTTP (`requests` / `fetch`) puede resolver a una IP interna mediante *DNS Rebinding* o redirección `302`.
- **Riesgo o Impacto**:
  Explotación de Server-Side Request Forgery (SSRF) permitiendo sondear servicios internos de la red privada del servidor o endpoints de metadatos cloud si un feed o URL de redirección es manipulado externamente.
- **Solución Óptima Propuesta**:
  1. En Python, implementar un adaptador de transporte personalizado (o usar `ssrf-protect` / pinning de IP tras `socket.getaddrinfo` validando cada IP contra `ipaddress.ip_network` privado/reservado/link-local) y desactivar redirecciones automáticas (`allow_redirects=False`), revalidando cada salto `Location`.
  2. En `frontend/lib/urlSafety.ts`, complementar el filtro sintáctico con una lista estricta de dominios/esquemas permitidos o comprobación en tiempo real mediante conector de red seguro.

### [SEC-045] Peticiones HTTP en scrapers y scripts auxiliares sin validación SSRF, sin bloqueo de redirecciones y sin timeout uniforme

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — todos los scrapers en `backend/scrapers/*.py` y `backend/scraper_infoempleo.py` migrados a `safe_http_get` con timeout `(5, 15)`, `allow_redirects=False` revalidado y límite de 10 MB; eliminado `backend/ping_sitemap.py`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/scraper_infoempleo.py`, `backend/job_aggregator/`, `backend/scrapers/*.py`, `backend/ping_sitemap.py` (líneas 1–23)
- **Diagnóstico del Problema**:
  Múltiples módulos scraper fuera de `backend/main.py` (por ejemplo `scraper_infoempleo.py`) y scripts auxiliares como `backend/ping_sitemap.py` ejecutan peticiones HTTP salientes sin invocar `is_safe_scraper_url`, aceptando redirecciones HTTP ilimitadas (que podrían saltar de un dominio público hacia `http://127.0.0.1` o red local) y, en el caso de `ping_sitemap.py`, careciendo incluso de parámetro `timeout=` en la petición HTTP.
- **Riesgo o Impacto**:
  Posibilidad de bloqueo indefinido de procesos en cronjobs por sockets colgados sin timeout (*hang*), además de riesgo SSRF ante feeds comprometidos o redirecciones HTTP maliciosas de proveedores externos.
- **Solución Óptima Propuesta**:
  1. Centralizar todas las peticiones HTTP salientes del backend en una única sesión wrapper segura (`safe_http_get`) con timeout obligatorio (`timeout=(5, 15)`), verificación SSL estricta, validación SSRF por salto y límite máximo de tamaño de descarga en streaming.
  2. Retirar `backend/ping_sitemap.py` (apunta al endpoint descontinuado de Google Ping y carece de timeout).

### [SEC-046] Análisis de feeds XML/RSS externos con `xml.etree.ElementTree` vulnerable a ataques XML Bomb / DoS

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — `defusedxml.ElementTree` en `backend/scrapers/wwr.py` y `backend/scrapers/pythonorg.py` junto con límite de descarga en streaming de 10 MB en `safe_http_get`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/main.py` y `backend/scrapers/*.py` (parsing de feeds RSS/XML de portales externos)
- **Diagnóstico del Problema**:
  El procesamiento de feeds XML externos descansa sobre parsers XML estándar de Python (`xml.etree.ElementTree`) sin protección frente a expansión recursiva de entidades internas (*Billion Laughs / XML Bomb*) ni límites de profundidad/tamaño de nodo. Aunque algunos parsers modernos mitigan entidades externas (XXE), `xml.etree` estándar sigue siendo sensible a ataques de expansión cuadrática o consumo excesivo de memoria ante documentos XML maliciosos o corruptos.
- **Riesgo o Impacto**:
  Denegación de servicio por agotamiento de memoria RAM y caída de todo el runner del scraper/cron cuando una fuente RSS externa devuelva un documento XML manipulado o un payload malformado de gran tamaño.
- **Solución Óptima Propuesta**:
  1. Reemplazar todas las importaciones de `xml.etree.ElementTree` / `lxml` directo por la librería `defusedxml` (`defusedxml.ElementTree`), añadiendo `defusedxml` a `backend/requirements.txt`.
  2. Validar `Content-Length` y leer la respuesta con límite máximo estricto (ej. 10 MB por feed) antes de parsear.

### [SEC-047] Conflicto de dos claves IndexNow distintas entre scripts del mismo proyecto

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — unificado en `backend/logic/indexnow.py` leyendo `INDEXNOW_KEY` de entorno; eliminados `.txt` hardcodeados y añadida ruta dinámica `frontend/app/api/indexnow-key/route.ts` con rewrite en `frontend/next.config.ts`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/index_new_jobs.py` (líneas 1–124) frente a `backend/index_now.py` (líneas 1–71) / `backend/deactivate_expired_jobs.py`
- **Diagnóstico del Problema**:
  El proyecto mantiene al menos dos claves IndexNow diferentes hardcodeadas o configuradas de forma inconsistente entre `index_new_jobs.py` y `index_now.py` (`85ae2b8a...` vs `8f4b9c1d...`), además de exponer las claves directamente en código fuente en lugar de depender únicamente de una única variable de entorno sincronizada con el archivo estático público de verificación `/{key}.txt`.
- **Riesgo o Impacto**:
  Rechazo por error `403 Forbidden` / `422` de la API IndexNow (Bing/Yandex) cuando se envía con una clave que no corresponde al fichero de verificación desplegado en el servidor público, y exposición innecesaria de claves de autorización de indexación en el código fuente.
- **Solución Óptima Propuesta**:
  1. Consolidar toda la integración IndexNow en un único módulo parametrizado exclusivamente mediante `os.environ["INDEXNOW_KEY"]` y servir dinámicamente la ruta de verificación `/${INDEXNOW_KEY}.txt` desde Next.js.
  2. Rotar la clave si estuvo hardcodeada y eliminar módulos redundantes.

### [SEC-048] Dependencia no oficial y sin aislamiento de `GoogleTranslator` en el bucle principal de ingesta

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — `backend/logic/translator.py` aislado con timeout de 8 s, circuit breaker de 300 s tras 3 fallos y validación anti-HTML/ratio de longitud).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/main.py` (líneas 1–216) y `backend/logic/translator.py`
- **Diagnóstico del Problema**:
  El bucle de ingesta de ofertas invoca síncronamente un wrapper no oficial de Google Translate (`GoogleTranslator`) por cada oferta nueva encontrada sin autenticación oficial SLA, sin *circuit breaker*, sin timeout garantizado ni validación estricta del texto retornado.
- **Riesgo o Impacto**:
  Bloqueos por captcha/rate-limit IP (`429 Too Many Requests`) desde Google que paralizan toda la ingesta de ofertas en `main.py`, o inserción de respuestas HTML de error/bloqueo como títulos o descripciones de empleos si la respuesta del scraper de traducción no se valida.
- **Solución Óptima Propuesta**:
  1. Migrar la traducción a una API oficial con cuota/SLA (Cloud Translation API o batch mediante Gemini con salida JSON estructurada) protegida con *circuit breaker* y cola asíncrona separada de la ingesta primaria.
  2. Validar siempre que el texto devuelto no contenga HTML de captcha ni exceda ratios anómalos de longitud respecto al original antes de guardar en MySQL.

### [SEC-049] Fuga de descriptor de archivo y dominio erróneo (`portalempleoit.es`) en bot generador de vídeos YouTube Shorts

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — dominio parametrizado vía `SITE_DOMAIN` y eliminada apertura redundante sin `with` en `backend/youtube_shorts_bot.py`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/youtube_shorts_bot.py` (línea 132 y líneas 221–241)
- **Diagnóstico del Problema**:
  En la línea 132, el generador renderiza como llamada a la acción (CTA) el dominio equivocado `portalempleoit.es` en lugar del dominio real del proyecto. Adicionalmente, entre las líneas 221 y 224 abre el archivo de vídeo generado (`open(video_path, 'rb')`) sin gestor de contexto `with` ni cierre explícito antes de volver a leerlo en la línea 241, filtrando descriptores de archivo abiertos en el proceso.
- **Riesgo o Impacto**:
  Fuga de descriptores de archivo en ejecuciones múltiples o errores intermedios y desvío potencial de usuarios hacia un dominio `.es` ajeno (riesgo de *brand impersonation* / phishing si un tercero registra o controla `portalempleoit.es`).
- **Solución Óptima Propuesta**:
  1. Centralizar el dominio oficial en una variable `SITE_DOMAIN` obtenida de entorno y corregir `portalempleoit.es` en la línea 132.
  2. Envolver todas las aperturas de archivos temporales en bloques `with open(...) as f:` y garantizar limpieza del archivo temporal en bloque `finally`.

### [SEC-050] Validación incompleta de parámetros y limitador síncrono en `/api/index-job`

- **Estado de Remediación**: [x] Resuelto (Lote 1.7 — `await indexJobLimiter.limitAsync` + validación `zod` con `z.enum(['URL_UPDATED', 'URL_DELETED'])` en `frontend/app/api/index-job/route.ts`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/index-job/route.ts`
- **Diagnóstico del Problema**:
  Aunque el endpoint implementa correctamente `timingSafeEqual` para el secreto y valida `allowedHostnames` sobre la URL, emplea `indexJobLimiter.limit(...)` de manera síncrona (ignorando Upstash Redis como se detalla en `SEC-024`) y acepta el parámetro `type` de notificación hacia Google Indexing API sin validación estricta contra una lista blanca (`URL_UPDATED` | `URL_DELETED`).
- **Riesgo o Impacto**:
  Degradación del control de cuota ante ráfagas distribuidas y propagación de payloads inválidos hacia la API externa de Google Indexing consumiendo cuota ante errores evitables.
- **Solución Óptima Propuesta**:
  1. Cambiar a `await indexJobLimiter.limitAsync(...)`.
  2. Validar el cuerpo de la petición con `zod` restringiendo `type` estrictamente a `z.enum(['URL_UPDATED', 'URL_DELETED'])`.

---

## Bloque VIII: Validación de Entrada, Integridad de Datos y Lógica de Negocio

### [SEC-051] Falta de sanitización, límites de longitud y validación de formato en formulario patrocinado `submitSponsoredJob`

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — esquema `zod` estricto `sponsoredJobSchema` en `frontend/app/actions.ts`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`submitSponsoredJob`, líneas 504–543)
- **Diagnóstico del Problema**:
  La Server Action `submitSponsoredJob` acepta entradas de usuario (`title`, `company`, `company_email`, `description`, URLs) sin imponer longitudes máximas por campo ni validar estrictamente el formato de `company_email` mediante expresión regular/esquema robusto antes de intentar persistir en BD y continuar el flujo de pago.
- **Riesgo o Impacto**:
  Almacenamiento de payloads sobredimensionados hasta el límite del proxy (64 KB por cadena) que truncan columnas en MySQL (`Data too long`), errores 500 en Stripe Checkout con emails inválidos o abuso del campo de descripción para almacenar spam/enlaces maliciosos.
- **Solución Óptima Propuesta**:
  1. Validar todos los argumentos de `submitSponsoredJob` con `zod` fijando `max()` acorde a cada columna SQL (`title` <= 180, `company` <= 120, `description` <= 8000, email RFC válido y URL validada con `isSafePublicUrl`).
  2. Devolver errores de campo estructurados sin filtrar detalles internos SQL.

### [SEC-052] Ausencia de protección anti-bot (CAPTCHA/Turnstile) y verificación de correo (Double Opt-In) en altas públicas

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — `verifyTurnstileToken` en `frontend/lib/turnstile.ts` integrado en `/api/subscribe`, `subscribeUser`, `submitPremiumLead` y `submitCompanyReview`).
- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/subscribe/route.ts` y `frontend/app/actions.ts` (`subscribeUser`, `submitPremiumLead`, `submitCompanyReview`)
- **Diagnóstico del Problema**:
  Los formularios públicos de suscripción a alertas, leads premium y reseñas de empresa no exigen desafío anti-bot (Cloudflare Turnstile / hCaptcha) ni confirmación mediante enlace de verificación por email (*Double Opt-In*) antes de dar por activa la suscripción y comenzar a enviar correos automáticos desde `mailer.py` / `send_*.py`.
- **Riesgo o Impacto**:
  Bots automatizados pueden inyectar miles de direcciones de víctimas inocentes o buzones trampa (*spam traps*) en `subscribers` (*List Bombing*), dañando severamente la reputación IP/dominio del servidor SMTP y provocando bloqueos en Gmail/Outlook además de inflar métricas fraudulentas.
- **Solución Óptima Propuesta**:
  1. Integrar Cloudflare Turnstile en todos los formularios públicos de suscripción, leads, reseñas y solicitud de baja, verificando el token en servidor antes de tocar MySQL.
  2. Implementar *Double Opt-In* obligatorio: insertar nuevos registros en estado `pending_verification` y no enviar alertas ni boletines hasta que el titular pulse el enlace de confirmación firmado enviado por correo.

### [SEC-053] Ocultamiento de fallos reales mediante respuestas `200 OK` sintéticas (`success: true` y conteos ficticios)

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — eliminadas cifras ficticias en `frontend/app/api/widget/vacantes-count/route.ts`, retornando HTTP `503` o caché real marcada `stale: true`; `/api/subscribe` devuelve HTTP `500` ante fallos).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/subscribe/route.ts` y `frontend/app/api/widget/vacantes-count/route.ts` (líneas 93–99)
- **Diagnóstico del Problema**:
  En `api/subscribe/route.ts`, ante determinadas excepciones de base de datos durante el registro, el bloque `catch` devuelve `{ success: true }` ocultando el fallo real. Asimismo, en `api/widget/vacantes-count/route.ts` (líneas 93–99), si la consulta SQL falla, el endpoint captura el error y devuelve HTTP `200 OK` con cifras inventadas (`140`, `110`, `85`, `60`, `75`).
- **Riesgo o Impacto**:
  Los sistemas de monitoreo de disponibilidad (*uptime checks*) y el propio frontend creen que los servicios operan con normalidad mientras la base de datos o el proxy están caídos o rechazando escrituras, provocando pérdida silenciosa de usuarios y registros falsos.
- **Solución Óptima Propuesta**:
  1. En `api/subscribe/route.ts`, devolver HTTP `500`/`503` (o `400` en fallo de entrada) cuando falle la persistencia crítica en BD y emitir log estructurado de error hacia monitorización.
  2. En `api/widget/vacantes-count/route.ts`, responder con HTTP `503` y cabecera `Cache-Control: no-store` o servir el último valor real cacheado marcado explícitamente como `stale: true`, eliminando los números inventados.

### [SEC-054] Sombreamiento del módulo `psycopg2` y bug crítico en reemplazo múltiple `ANY(%s)` dentro de `backend/psycopg2.py`

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — `parse_db_url` con `urlparse` y reemplazo iterativo completo de múltiples `ANY(%s)` en `backend/psycopg2.py`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/psycopg2.py` (líneas 1–252, `parse_db_url` y bucle de traducción `ANY(%s)`)
- **Diagnóstico del Problema**:
  El archivo `backend/psycopg2.py` intercepta cualquier `import psycopg2` dentro de Python para traducir sintaxis PostgreSQL hacia PyMySQL. Su implementación contiene tres fallos graves: (a) el bucle que convierte `ANY(%s)` a `IN (...)` ejecuta `break` tras la primera coincidencia, dejando corrupta o con error de sintaxis cualquier consulta con dos o más cláusulas `ANY(%s)`; (b) la expresión regular de `parse_db_url` incorpora parámetros `?query` de la URL dentro del nombre de `database`; y (c) sombrea silenciosamente el driver real si alguna dependencia lo requiere.
- **Riesgo o Impacto**:
  Consultas SQL fallidas o alteración imprevista de parámetros al ejecutar consultas con múltiples filtros `ANY(%s)` y errores de conexión a base de datos cuando `DATABASE_URL` incluye opciones TLS (`?ssl-mode=REQUIRED`).
- **Solución Óptima Propuesta**:
  1. Renombrar `backend/psycopg2.py` a un módulo explícito (`backend/db_adapter.py`) para no sombrear paquetes estándar de `site-packages`.
  2. Parsear `DATABASE_URL` mediante `urllib.parse.urlparse` separando limpiamente `path.lstrip('/')` de `query` (utilizando los parámetros de query para configurar TLS), y corregir la traducción de `ANY(%s)` iterando sobre todas las apariciones o migrando directamente las queries a sintaxis MySQL nativa.

### [SEC-055] Lógica de retención y racha (`UserStreak`) alojada íntegramente en `localStorage` sin validación ni respaldo de servidor

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — sincronización con servidor vía `/api/streak` y cookie `httpOnly` firmada con HMAC-SHA256 en `frontend/components/UserStreak.tsx`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/UserStreak.tsx`
- **Diagnóstico del Problema**:
  El componente `UserStreak.tsx` calcula, incrementa y muestra la racha de días del candidato exclusivamente en `localStorage` del navegador cliente, sin firma, sin comprobación de integridad ni sincronización autenticada con la tabla `streak_reminders` en servidor.
- **Riesgo o Impacto**:
  Trivial manipulación desde DevTools por parte del usuario final si en el futuro la racha desbloquea beneficios/descuentos, pérdida total de progreso al cambiar de dispositivo/navegador y desconexión completa respecto a los correos enviados por `send_streak_reminder.py`.
- **Solución Óptima Propuesta**:
  1. Sincronizar el estado de actividad real mediante endpoint autenticado por sesión/token de candidato registrado en base de datos, utilizando `localStorage` únicamente como caché optimista de lectura no autoritativa.

### [SEC-056] Flujo de referidos `/ref/[code]` y baja `/darse-de-baja` con persistencia de cookies largas y exposición de estado

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — rate limiting y cookie de 7 días en `frontend/app/ref/[code]/route.ts`, prevención de auto-referido en `actions.ts`, y exigencia de `token` para pre-rellenar email en `frontend/app/darse-de-baja/page.tsx`).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/ref/[code]/route.ts` (líneas 1–33) y `frontend/app/darse-de-baja/page.tsx`
- **Diagnóstico del Problema**:
  `/ref/[code]` descifra un código de referido y establece la cookie `referrer_email` con `httpOnly` durante 30 días, pero sin límite de intentos contra fuerza bruta sobre códigos ni validación de integridad/firma robusta independiente si el cifrado no incluye autenticación AEAD (GCM/HMAC) o si falta caducidad corta en códigos antiguos; por su parte `/darse-de-baja` refleja el query param `email` en interfaz pública requiriendo acción manual posterior.
- **Riesgo o Impacto**:
  Manipulación o enumeración de códigos de afiliado para atribución fraudulenta de referidos (`referrals_count`) y confusión del usuario o riesgo de *phishing* visual en `/darse-de-baja` pre-rellenando emails arbitrarios mediante enlace de terceros.
- **Solución Óptima Propuesta**:
  1. Utilizar cifrado autenticado (AES-256-GCM o token opaco HMAC con ID numérico no secuencial / UUID) junto con rate limiting distribuido en `/ref/[code]` y prevenir auto-referidos (`referrer_email !== subscriber_email`).
  2. Validar firma criptográfica previa antes de pre-rellenar cualquier dirección en `/darse-de-baja`.

### [SEC-057] Presencia de documentación técnica interna y archivos operativos sueltos en el repositorio

- **Estado de Remediación**: [x] Resuelto (Lote 1.8 — `.vercelignore` actualizado excluyendo `ARQUITECTURA_SEGURIDAD_TRUST_BOUNDARIES.md`, `DEVELOPMENT_CONTEXT.md`, `*.docx`, `Imagen pegada.png`, `docs/` y dumps/secretos).
- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `ARQUITECTURA_SEGURIDAD_TRUST_BOUNDARIES.md`, `DEVELOPMENT_CONTEXT.md`, `Guia_servidor_Ubuntu_24_04_completa (1).docx`, `Imagen pegada.png` (raíz del proyecto)
- **Diagnóstico del Problema**:
  Existen documentos internos de arquitectura de seguridad (`ARQUITECTURA_SEGURIDAD_TRUST_BOUNDARIES.md`), contexto de desarrollo, manuales de configuración del servidor Ubuntu (`.docx`) e imágenes temporales en la raíz del proyecto junto al código desplegable.
- **Riesgo o Impacto**:
  Si el repositorio es público, filtrado, o sincronizado en bloque hacia el servidor cPanel (`deploy_cpanel.yml`), entrega a un atacante un mapa exacto de topología de red, límites de confianza, procedimientos de servidor y posibles datos internos en capturas de pantalla.
- **Solución Óptima Propuesta**:
  1. Excluir explícitamente de los artefactos de despliegue (`rsync --exclude` / `.vercelignore` / reglas de cPanel) toda documentación operativa, `.docx`, imágenes sueltas y dumps.
  2. Trasladar guías de servidor y arquitectura confidencial a un repositorio o wiki privada separada del código de producción.

---

## Bloque IX: CI/CD, Dependencias, Hardening de Infraestructura y Operaciones

### [SEC-058] Pipelines de CI/CD (`deploy_cpanel.yml`, `scrape_cron.yml`, `weekly_email.yml`) sin escaneo SAST/SCA ni permisos mínimos explícitos

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: añadido gate `npm audit --audit-level=high` en `.github/workflows/ci.yml` y healthcheck HTTP `curl -sf http://127.0.0.1:3000/` en `deploy.sh`).
- **Ubicación exacta**: `.github/workflows/deploy_cpanel.yml`, `.github/workflows/scrape_cron.yml`, `.github/workflows/weekly_email.yml`, `deploy.sh` (líneas 1–44)
- **Diagnóstico del Problema**:
  Los flujos automatizados de despliegue y ejecución periódica ejecutan dependencias Python/Node y despliegan código a cPanel sin pasos previos obligatorios de auditoría de vulnerabilidades en dependencias (`npm audit --audit-level=high`, `pip-audit`), análisis estático SAST/secret scanning, ni declaración estricta de `permissions: contents: read` en el nivel de workflow para aplicar principio de mínimo privilegio al `GITHUB_TOKEN`. Asimismo `deploy.sh` no implementa verificación post-despliegue con rollback automático.
- **Riesgo o Impacto**:
  Despliegue directo en producción de paquetes comprometidos o con CVEs críticos conocidos y mayor superficie de movimiento lateral ante compromiso de alguna acción de terceros en GitHub Actions.
- **Solución Óptima Propuesta**:
  1. Declarar `permissions: read-all` / `permissions: {}` por defecto en cada `.yml` y fijar las GitHub Actions de terceros por **commit SHA completo** en lugar de etiquetas mutables (`@v4`).
  2. Añadir gates de bloqueo en CI para `npm audit`, `pip-audit`, `gitleaks` y validación de integridad antes de ejecutar el despliegue en cPanel/Vercel.

### [SEC-059] Gestión laxa de versiones de dependencias en `backend/requirements.txt` y `frontend/package.json`

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: habilitado `.github/dependabot.yml` para `npm` en `/frontend` y `pip` en `/backend`).
- **Ubicación exacta**: `backend/requirements.txt` (líneas 1–46) y `frontend/package.json` (líneas 1–34)
- **Diagnóstico del Problema**:
  El proyecto carece de un archivo lock determinista verificado por hash en Python (`requirements.lock` / `pip-tools` con `--require-hashes` o `uv.lock`) y de configuración automatizada de alertas/actualizaciones de seguridad (Dependabot / Renovate) sobre dependencias expuestas a red como `scrapy`, `beautifulsoup4`, `requests`, `pymysql`, `next`, `stripe` y `upstash`.
- **Riesgo o Impacto**:
  Instalación silenciosa de versiones con vulnerabilidades recién publicadas en runners efímeros de `scrape_cron.yml` / `weekly_email.yml` o exposición prolongada a CVEs críticos en el runtime de Next.js / parsers HTTP.
- **Solución Óptima Propuesta**:
  1. Generar lockfiles reproducibles con hashes criptográficos en Python (`uv.lock` o `pip-compile --generate-hashes`) e instalar en CI con `--require-hashes` / `npm ci --ignore-scripts`.
  2. Activar `.github/dependabot.yml` con periodicidad semanal para ecosistemas `npm`, `pip` y `github-actions`.

### [SEC-060] Ausencia de limitación de tasa (`limit_req_zone`) y protección contra floods a nivel Nginx en `nginx.conf.template`

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: añadidos `auth_limit` 5r/m, `conn_limit`, `limit_req_status 429`, `client_max_body_size 1m`, timeouts anti-Slowloris y `location = /api/admin/auth` en `nginx.conf.template`).
- **Ubicación exacta**: `nginx.conf.template` (líneas 1–179)
- **Diagnóstico del Problema**:
  La plantilla de Nginx no define zonas `limit_req_zone` ni `limit_conn_zone` para amortiguar ráfagas antes de llegar a Node.js o PHP-FPM, especialmente en endpoints sensibles (`/api/admin/auth`, `/api/subscribe`, `/api/checkout/*`, `/db_proxy.php`, `/darse-de-baja`). Toda la defensa recae en Next.js (que además sufre el bug `.limit()` síncrono descrito en `SEC-024`).
- **Riesgo o Impacto**:
  Mayor vulnerabilidad ante ataques HTTP flood de capa 7, consumo innecesario de ejecuciones Serverless/Node.js y saturación rápida de conexiones hacia el proxy PHP en ataques distribuidos simples.
- **Solución Óptima Propuesta**:
  1. Definir en `nginx.conf.template` zonas `limit_req_zone $binary_remote_addr` diferenciadas (estricta de 5r/m para `/api/admin/auth`, moderada de 30r/m para endpoints mutables API/proxy, y general con `burst` para navegación) devolviendo `429`.
  2. Limitar `client_max_body_size` por defecto a `1m` y ajustar `client_body_timeout` / `client_header_timeout` cortos (10s) para mitigar ataques Slowloris.

### [SEC-061] Service Worker `sw.js` sin versionado de caché ni invalidación limpia permitiendo persistencia de respuestas obsoletas

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: actualizado `frontend/public/sw.js` con `portal-trabajo-cache-v2`, retirada de `/` del cacheo permanente y estrategia Network-First).
- **Ubicación exacta**: `frontend/public/sw.js`
- **Diagnóstico del Problema**:
  El Service Worker `sw.js` intercepta peticiones cacheando permanentemente la ruta raíz `/` junto a recursos de fuentes e imágenes sin estrategia estricta de versionado automático vinculado al hash de build ni limpieza determinista de cachés antiguas en el evento `activate`.
- **Riesgo o Impacto**:
  Los navegadores de usuarios recurrentes pueden quedar atrapados indefinidamente sirviendo HTML antiguo de `/`, referencias rotas a chunks JS antiguos tras un despliegue o versiones sin parches de seguridad frontend aplicados en el servidor.
- **Solución Óptima Propuesta**:
  1. Aplicar estrategia *Network-First* para documentos HTML (`/`) o retirar el cacheado manual de documentos HTML en `sw.js`, dejando el caché estático exclusivamente para assets inmutables con hash de Next.js (`/_next/static/`).
  2. Versionar el `CACHE_NAME` con el SHA del commit en build y purgar todas las cachés previas en `activate`.

### [SEC-062] Envío SMTP en `backend/mailer.py` sobre una sola conexión sin reconexión, backoff ni manejo de rebotes (*bounces*)

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: implementados `open_smtp_session()`, reconexión cada 50 correos, backoff exponencial y registro de rebotes `SMTPRecipientsRefused` en `backend/mailer.py`).
- **Ubicación exacta**: `backend/mailer.py` (líneas 1–542)
- **Diagnóstico del Problema**:
  `backend/mailer.py` abre una única sesión `smtplib` de larga duración e intenta despachar todo el lote de boletines semanales secuencialmente sobre esa conexión, sin detectar desconexiones por límite de mensajes por sesión (`421`/`450`), sin reintentos con *exponential backoff*, sin pausas controladas (*throttling*) y sin procesar rebotes duros (*hard bounces*).
- **Riesgo o Impacto**:
  Caída abrupta del envío masivo a mitad de lista dejando al resto de suscriptores sin boletín sin registro de checkpoint reanudable, y degradación progresiva de reputación IP por insistir semanalmente sobre direcciones inexistentes que rebotan.
- **Solución Óptima Propuesta**:
  1. Implementar un cliente de envío por micro-lotes (reconectar cada 50–100 envíos o tras `SMTPServerDisconnected`), registrar en BD el último `campaign_id`/`subscriber_id` enviado (*idempotent checkpoint*) para reanudación segura y preferir API transaccional con webhooks de bounce (SES / Resend / Postmark).
  2. Suspender automáticamente (`status = 'bounced'`) direcciones tras el primer *hard bounce* o 3 *soft bounces* consecutivos.

### [SEC-063] Orquestación monolítica secuencial en `backend/run_all.py` ocultando fallos parciales y agotando ventanas cron

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: añadidos `timeout_sec=180` en `run_cmd`, seguimiento en `FAILED_STEPS` y salida con `sys.exit(1)` ante pasos fallidos en `backend/run_all.py`).
- **Ubicación exacta**: `backend/run_all.py` (líneas 1–218)
- **Diagnóstico del Problema**:
  `run_all.py` lanza más de 25 scripts (scrapers, normalizadores, generadores de blog/noticias, IndexNow y bots sociales) de forma secuencial y monolítica en un único proceso, ignorando códigos de salida distintos de cero de subprocesos individuales y sin timeouts aislados por paso.
- **Riesgo o Impacto**:
  Un fallo o bloqueo de red en un único scraper temprano puede consumir toda la ventana de ejecución del workflow de GitHub Actions impidiendo que corran tareas críticas posteriores (como `deactivate_expired_jobs.py` o `index_now.py`), mientras que los fallos silenciados por código de salida impiden alertar al equipo.
- **Solución Óptima Propuesta**:
  1. Desacoplar el monolito `run_all.py` en jobs independientes dentro de GitHub Actions (`matrix` / `needs`) o un scheduler con timeouts por tarea (`subprocess.run(..., timeout=180)`).
  2. Registrar métricas estructuradas de éxito/fallo de cada etapa, disparar alerta ante error no cero en tareas críticas y propagar el fallo al finalizar el resumen del batch.

### [SEC-064] Ausencia de cabeceras modernas de aislamiento (`Permissions-Policy`, `COOP`, `CORP`) en Nginx y Next.js

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: añadidas `Cross-Origin-Resource-Policy: same-site` y `Permissions-Policy` con `browsing-topics=(), usb=()` en `nginx.conf.template` y `frontend/middleware.ts`).
- **Ubicación exacta**: `nginx.conf.template` y `frontend/middleware.ts`
- **Diagnóstico del Problema**:
  Las respuestas HTTP omiten una directiva estricta de `Permissions-Policy` que desactive explícitamente APIs sensibles del navegador no utilizadas (`camera=()`, `microphone=()`, `geolocation=()`, `usb=()`, `payment=()`), así como cabeceras de aislamiento de origen cruzado (`Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Resource-Policy: same-site`).
- **Riesgo o Impacto**:
  Superficie ampliada en caso de inclusión de scripts/iframes publicitarios de terceros (AdSense / afiliados) que intenten invocar capacidades sensibles del dispositivo o interactuar entre ventanas abiertas (*window.opener* leaks / ataques Spectre cross-origin).
- **Solución Óptima Propuesta**:
  1. Añadir en el snippet común de cabeceras de `nginx.conf.template` y en `frontend/middleware.ts`: `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), usb=()` y `Cross-Origin-Opener-Policy: same-origin-allow-popups` (compatible con pagos/OAuth externos sin exponer contexto).

### [SEC-065] Falta de telemetría y alertas ante anomalías de seguridad (fallos HMAC, ráfagas 401/403 y caídas de proxy)

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Estado de Remediación**: [x] Resuelto (Lote 1.9: creado `frontend/lib/securityLogger.ts` con `logSecurityEvent` e integrado en `frontend/app/api/webhooks/stripe/route.ts` y `frontend/app/api/admin/auth/route.ts`).
- **Ubicación exacta**: `db_proxy.php`, `frontend/app/api/admin/auth/route.ts`, `frontend/app/api/webhooks/stripe/route.ts`, `frontend/app/api/unsubscribe/route.ts`
- **Diagnóstico del Problema**:
  Los rechazos por autenticación fallida en `db_proxy.php`, las firmas inválidas de webhooks Stripe, los fallos HMAC en baja/descargas y los picos de intentos fallidos sobre `/api/admin/auth` no emiten eventos centralizados hacia un sistema de alerta temprana (Telegram privado de ops / Sentry / SIEM ligero), limitándose a logs efímeros locales o salida estándar dispersa.
- **Riesgo o Impacto**:
  Ataques activos de fuerza bruta, sondeos sobre `db_proxy.php`, intentos de falsificación de webhooks Stripe o degradaciones silenciosas del proxy pasan completamente inadvertidos durante días o semanas (*Mean Time to Detect* indefinido).
- **Solución Óptima Propuesta**:
  1. Integrar logging estructurado JSON con nivel `SECURITY_WARN` / `SECURITY_CRITICAL` enviado de forma asíncrona a Sentry / Logflare y alertas instantáneas resumidas al canal operativo privado ante umbrales anómalos (ej. >5 fallos 401 en `/api/admin/auth` o firma Stripe inválida).
