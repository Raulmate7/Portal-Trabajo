# 02. Auditoría de Seguridad, AppSec y Resiliencia (`SEC-001` – `SEC-065`)

> **Alcance**: Seguridad de Aplicación (OWASP Top 10), `db_proxy.php`, `nginx.conf.template`, `docker-compose.yml`, `middleware.ts`, `next.config.ts`, autenticación/sesiones, Stripe Webhooks, SSRF, Rate Limiting, gestión de secretos y resiliencia operativa.  
> **Total de hallazgos documentados**: 65 ítems individuales verificados sobre el código fuente actual.

---

### [SEC-001] `db_proxy.php` permite `UPDATE` sin lista blanca de tablas ni bloqueo estricto de bypass en cláusula `WHERE`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `db_proxy.php` (líneas 335-344, bloque `UPDATE`)
- **Diagnóstico del Problema**:
  Mientras `DELETE` implementa `$allowedDeleteTables` (`db_proxy.php:324`), las sentencias `UPDATE` en las líneas 335-344 carecen por completo de lista blanca de tablas permitidas y únicamente exigen un patrón regex simple `WHERE ... columna (=|IN)` junto con `count($params) === 0`. Si el cliente (o un servidor comprometido con el token del proxy) envía un `UPDATE users SET role = 'admin', password_hash = ? WHERE id IN (1, 2)` con solo 1 parámetro en el `SET`, supera `count($params) === 0` sin proteger ni la tabla ni los predicados `OR` ni el número de filas afectadas (`LIMIT 1`).
- **Riesgo o Impacto**:
  Compromiso completo del plano de identidad (`users`, `admin_security_state`, `stripe_processed_events`) o modificación masiva de toda la tabla `jobs` / `subscribers` en caso de fuga del token estático `X-Proxy-Token`.
- **Solución Óptima Propuesta**:
  Definir una lista blanca estricta `$allowedUpdateColumnsByTable` para `UPDATE` que prohíba escribir en tablas administrativas/de auditoría (`users`, `admin_security_state`, `audit_logs`, `stripe_processed_events`), obligar a parámetros preparados también en el `WHERE` y exigir cláusula `LIMIT` acotada cuando proceda.

### [SEC-002] Colisión de doble cabecera `Content-Security-Policy` entre `middleware.ts` y `next.config.ts` y omisión de Turnstile

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/middleware.ts` (líneas 16-20) y `frontend/next.config.ts` (línea 55)
- **Diagnóstico del Problema**:
  `next.config.ts:55` inyecta una cabecera estática `Content-Security-Policy` permisiva con `'unsafe-inline' 'unsafe-eval'` mientras `frontend/middleware.ts` genera dinámicamente otra cabecera `Content-Security-Policy` basada en `'nonce-...' 'strict-dynamic'`. Al enviarse o mezclarse ambas políticas en respuesta HTTP (y en cualquier caso en ambas), ninguna incluye el origen `https://challenges.cloudflare.com` en `script-src` ni `frame-src`.
- **Riesgo o Impacto**:
  Degradación o comportamiento inconsistente de las defensas XSS entre rutas estáticas y dinámicas por el uso simultáneo de `'unsafe-eval'` en `next.config.ts`, y riesgo de bloqueo en cliente del widget anti-bot Cloudflare Turnstile cuando las respuestas aplican la política más restrictiva.
- **Solución Óptima Propuesta**:
  Eliminar por completo la cabecera `Content-Security-Policy` duplicada de `next.config.ts`, emitir una sola política canónica desde `middleware.ts` (o desde Edge/Nginx sin solapamiento) y añadir explícitamente `https://challenges.cloudflare.com` a `script-src` y `frame-src`.

### [SEC-003] `db_proxy.php` se autentica con token estático sin firma HMAC de petición, timestamp ni prevención de replay

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `db_proxy.php` (líneas 152-157) y `frontend/lib/db.ts` (línea 8, `sendProxyRequest`)
- **Diagnóstico del Problema**:
  La autenticación del proxy HTTP hacia MySQL descansa en comparar un secreto estático recibido en la cabecera `X-Proxy-Token` más una comprobación de IP. No existe firma HMAC sobre el cuerpo (`query + params`), timestamp de expiración ni nonce anti-replay. Adicionalmente, `frontend/lib/db.ts:8` incluye una URL hardcoded de respaldo `'https://mail.portalempleoit.com/db_proxy.php'`.
- **Riesgo o Impacto**:
  Si el secreto estático se filtra en logs HTTP intermedios, configuraciones o tráfico capturado, permite reproducir consultas SQL arbitrarias indefinidamente dentro de los verbos habilitados. La URL hardcoded de fallback expone arquitectura interna en código cliente/servidor y dirige tráfico por defecto a un host fijo si falta `DB_PROXY_URL`.
- **Solución Óptima Propuesta**:
  Firmar cada petición al proxy mediante HMAC-SHA256 sobre `timestamp + nonce + sha256(body)` con ventana máxima de 30 segundos y caché anti-replay (o reemplazar `db_proxy.php` por túnel WireGuard / TLS mutuo mTLS directo hacia MySQL), eliminando cualquier URL hardcoded en `lib/db.ts`.

### [SEC-004] `db_proxy.php` carga variables `.env` antes de verificar `ENABLE_DB_PROXY`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `db_proxy.php` (líneas 36-40)
- **Diagnóstico del Problema**:
  El script ejecuta `putenv("$k=$v")` recorriendo el fichero `.env` antes de comprobar el flag kill-switch `ENABLE_DB_PROXY`. Si el entorno compartido (cPanel/Apache) comparte proceso o variables de entorno entre scripts PHP o se añaden claves que colisionen con variables del sistema (`PATH`, `LD_*`), se sobrescriben valores antes de validar si el endpoint está habilitado.
- **Riesgo o Impacto**:
  Innecesaria exposición de lectura del archivo `.env` en disco cuando el proxy está deshabilitado y riesgo potencial de contaminación de variables de proceso PHP (`putenv`) mediante entradas no filtradas por lista blanca.
- **Solución Óptima Propuesta**:
  Almacenar las variables cargadas en un mapa asociativo privado `$config` sin invocar `putenv()`, verificar una lista blanca de claves permitidas y comprobar `ENABLE_DB_PROXY === 'true'` antes de abrir o parsear credenciales MySQL.

### [SEC-005] El filtro `$allowedDeleteTables` en `db_proxy.php` deja fuera 10+ tablas operativas obligando a usar BD directa o bloqueando flujos

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `db_proxy.php` (línea 324)
- **Diagnóstico del Problema**:
  La expresión regular de borrado en `db_proxy.php:324` no contempla tablas legítimas introducidas posteriormente en el esquema como `user_sessions`, `user_password_resets`, `audit_logs`, `email_deliveries`, `subscriber_job_notifications`, `premium_leads`, `sponsored_jobs` o `recruiter_affiliates`. Al mismo tiempo, tampoco restringe el borrado masivo sin límite cuando una query válida incluye un `WHERE` amplio (por ejemplo `WHERE created_at < ...`).
- **Riesgo o Impacto**:
  Endpoints de cuenta o RGPD como `DELETE /api/auth/me` (que borra `user_sessions` y `user_password_resets` en líneas 258-259) fallan con HTTP 403 en modo proxy HTTP, provocando cuentas huérfanas o imposibilidad de ejercer supresión RGPD.
- **Solución Óptima Propuesta**:
  Sincronizar explícitamente por tabla el contrato de operaciones permitidas en el proxy (incluyendo `user_sessions`, `user_password_resets`, `user_saved_jobs` con `WHERE user_id = ?`) o retirar `db_proxy.php` en favor de conexión directa cifrada mTLS.

### [SEC-006] `nginx.conf.template` solo aplica `auth_limit` a `= /api/admin/auth`, dejando sin rate limit Nginx a login, registro, reset y checkout

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `nginx.conf.template` (líneas 1-214)
- **Diagnóstico del Problema**:
  El template de Nginx define la zona `auth_limit` pero la asigna únicamente al location exacto `= /api/admin/auth`. Todos los demás endpoints sensibles (`/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password`, `/api/subscribe`, `/api/unsubscribe`, `/api/checkout/*`, `/api/webhooks/stripe`) pasan a través del bloque genérico `/api/` sin límite de tasa a nivel de proxy inverso ni topes estrictos de `client_max_body_size` diferenciados por ruta.
- **Riesgo o Impacto**:
  Ráfagas distribuidas o ataques de fuerza bruta/credential stuffing llegan directamente al proceso Node.js/Next.js consumiendo CPU (verificación `scrypt` en `login`) y conexiones MySQL antes de ser frenados en capa de aplicación.
- **Solución Óptima Propuesta**:
  Añadir bloques `location` específicos en `nginx.conf.template` aplicando `limit_req zone=auth_limit` sobre `^~ /api/auth/`, `/api/subscribe` y `^~ /api/checkout/`, manteniendo una zona más amplia para tráfico de lectura `/api/jobs` y ajustando `client_max_body_size` al mínimo necesario por endpoint.

### [SEC-007] `nginx.conf.template` contiene rangos IP de Cloudflare estáticos propensos a quedar obsoletos y riesgo de fallback si se expone sin firewall

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `nginx.conf.template` (bloque `set_real_ip_from` y `real_ip_header CF-Connecting-IP`)
- **Diagnóstico del Problema**:
  `nginx.conf.template` fija manualmente una lista estática de subredes `set_real_ip_from` de Cloudflare en la plantilla, sin mecanismo automático de actualización cron (`cloudflare-ips-sync`) y sin bloqueo obligatorio `allow Cloudflare / deny all` en la capa de transporte/vhost cuando el servidor origen sea accesible directamente por IP pública.
- **Riesgo o Impacto**:
  Si el origen no está aislado en firewall (solo puertos 80/443 a IPs Cloudflare), o si Cloudflare incorpora un nuevo rango CIDR que no figura en `set_real_ip_from`, fallará la resolución real de IP o un atacante directo podría forjar `CF-Connecting-IP` si la lista incluye un rango excesivamente amplio o proxy intermedio no fiable.
- **Solución Óptima Propuesta**:
  Automatizar la inclusión dinámica de `/etc/nginx/cloudflare_ips.conf` desde la API oficial de Cloudflare, proteger el puerto origen con Authenticated Origin Pulls (mTLS Cloudflare -> Nginx) y regla de firewall estricta solo para rangos Cloudflare.

### [SEC-008] Ausencia de rate limiting dedicado en `/api/auth/reset-password`, `/api/admin/jobs` y `/api/admin/gdpr`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/rate-limit.ts` (líneas 250-317), `frontend/app/api/auth/reset-password/route.ts` y `frontend/app/api/admin/gdpr/route.ts`
- **Diagnóstico del Problema**:
  Al revisar `frontend/lib/rate-limit.ts:250-317` y `frontend/app/api/auth/reset-password/route.ts`, no existe ningún limitador asignado al endpoint de restablecimiento de contraseña (`/api/auth/reset-password` solo valida el token en BD tras recibir la petición), ni tampoco límite por IP/cuenta en `/api/admin/jobs` y `/api/admin/gdpr` (que además ejecutan búsquedas PII multi-tabla).
- **Riesgo o Impacto**:
  Posibilidad de fuerza bruta automatizada contra tokens de reset o abuso de consultas costosas contra la base de datos en caso de robo de sesión administrativa.
- **Solución Óptima Propuesta**:
  Instanciar un `passwordResetLimiter` estricto por IP y email/token en `rate-limit.ts` y conectarlo al inicio de `/api/auth/reset-password`, además de aplicar `adminActionLimiter` en todas las rutas `/api/admin/*`.

### [SEC-009] Fallback LRU en memoria en `lib/rate-limit.ts` falla en despliegues multi-worker sin Redis configurado

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/rate-limit.ts` (líneas 97-180) y `frontend/app/actions.ts` (líneas 14, 34-42)
- **Diagnóstico del Problema**:
  Cuando `REDIS_URL` y `UPSTASH_REDIS_REST_URL` no están configurados (o ante un corte transitorio de Redis), `RateLimiter.limitKeyAsync()` cae a un `Map<string, RateLimitInfo>` local en memoria por proceso (tope 5.000 entradas). En `actions.ts:14`, además se crean dinámicamente múltiples `RateLimiter` dentro de `actionLimitersByWindow` por ventana temporal.
- **Riesgo o Impacto**:
  En PM2 en modo clúster (`instances: max`) o múltiples contenedores Next.js, cada worker mantiene un contador independiente multiplicando el límite efectivo por el número de procesos; ante reinicios frecuentes se reinicia el contador y un ataque DDoS con >5.000 IPs provoca evicción prematura.
- **Solución Óptima Propuesta**:
  Hacer obligatorio `REDIS_URL` en producción (`NODE_ENV === 'production'`) emitiendo telemetría crítica si cae al fallback RAM, y configurar políticas fail-closed en rutas de autenticación/checkout cuando Redis no responda.

### [SEC-010] `deactivate_expired_jobs.py` realiza `requests.head()` directo sobre URLs externas sin protección SSRF (`logic/ssrf.py`)

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/deactivate_expired_jobs.py` (líneas 148-165) y `backend/logic/ssrf.py`
- **Diagnóstico del Problema**:
  El detector de enlaces muertos consulta `url_source` directamente con `requests.head(src_url, allow_redirects=True, ...)` siguiendo redirecciones HTTP arbitrarias sin invocar `logic.ssrf.safe_http_get()` ni validar IPs privadas/reservadas tras resolución DNS.
- **Riesgo o Impacto**:
  Si una oferta patrocinada, importada o manipulada contiene una `url_source` que redirige (HTTP 302) a `http://169.254.169.254/...` (cloud metadata) o servicios internos (`127.0.0.1`, `10.x`), el cron de mantenimiento ejecuta una petición SSRF interna desde la red privilegiada del servidor backend.
- **Solución Óptima Propuesta**:
  Reemplazar `requests.head(..., allow_redirects=True)` por un método `safe_http_head` / `safe_http_get` dentro de `backend/logic/ssrf.py` que valide esquema HTTPS/HTTP, bloquee rangos RFC1918/loopback/link-local tras cada salto DNS y deshabilite redirecciones automáticas no verificadas.

### [SEC-011] Exposición de `GEMINI_API_KEY` en query string URL en `generate_weekly_article.py` y `generate_podcast_script.py`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/generate_weekly_article.py` (línea 243) y `backend/generate_podcast_script.py` (línea 39)
- **Diagnóstico del Problema**:
  Ambos scripts pasan la clave de API secreta en la URL: `https://generativelanguage.googleapis.com/...:generateContent?key={api_key}`, mientras `generate_news_post.py:58` ya la envía de forma segura por cabecera HTTP.
- **Riesgo o Impacto**:
  Si `requests.post` lanza una excepción (`HTTPError`, `RequestException`, timeout) con traza completa en logs de cron, CI o sistemas APM/proxies salientes, la URL completa incluyendo `GEMINI_API_KEY` queda registrada en texto plano.
- **Solución Óptima Propuesta**:
  Migrar ambas integraciones a autenticación exclusiva vía cabecera `"x-goog-api-key": api_key` eliminando `?key=` de la URL.

### [SEC-012] `backend/logic/tracking.py` firma tokens pero NO los cifra, exponiendo PII (email) en claro en Base64URL y URLs

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/tracking.py` (líneas 21-59), `backend/send_custom_alerts.py` (75-98), `backend/send_reactivation.py` (146, 158, 201) y `backend/send_welcome_onboarding.py` (77-154, 215)
- **Diagnóstico del Problema**:
  Aunque `sign_opaque_tracking_token` reemplaza el parámetro `?email=` por `?t=<b64url>.<hmac>`, la parte `<b64url>` es simplemente JSON en Base64URL sin cifrar (`{"e":"usuario@dominio.com","c":...}`), trivialmente decodificable por cualquiera que capture la URL en historial de navegador, proxy corporativo, logs de servidor HTTP o cabecera `Referer`. Adicionalmente, los scripts `send_custom_alerts.py`, `send_reactivation.py` y `send_welcome_onboarding.py` aún emiten `?email=<correo>` sin codificación ni token opaco, y `tracking.py` vuelve a ese fallback en claro si falta el secreto.
- **Riesgo o Impacto**:
  Fuga sistemática de correos electrónicos (PII) de candidatos en registros de acceso de Nginx/CDN, software antivirus corporativo que pre-escanea enlaces y posibles referencias salientes.
- **Solución Óptima Propuesta**:
  Reemplazar el payload en claro Base64 por un token cifrado autenticado (AES-256-GCM o HMAC + identificador opaco UUID/hash almacenado o cifrado simétrico con clave derivada) y obligar a todos los scripts de envío a utilizarlo fail-closed.

### [SEC-013] Sal estática débil (`'consent_salt_v1'`) y SHA-256 sin clave para hashear IPs de consentimiento

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (línea 359), `frontend/app/api/subscribe/route.ts` (línea 79) y `frontend/app/api/auth/me/route.ts` (línea 255)
- **Diagnóstico del Problema**:
  El registro de `consent_ip_hash` calcula `crypto.createHash('sha256').update(clientIp + (process.env.APP_SECRET || 'consent_salt_v1')).digest('hex')`. Si no está definido `APP_SECRET` (variable que ni siquiera figura en `.env.example` raíz ni está garantizada en todos los entornos), cae en la cadena fija `'consent_salt_v1'`. Dado que el espacio IPv4 completo es de ~$4.29 \times 10^9$ direcciones, un SHA-256 simple con sal conocida públicamente en el código es reversible por fuerza bruta en minutos con GPU.
- **Riesgo o Impacto**:
  Ante una filtración de `subscribers` o `consent_audit_log`, los hashes de direcciones IP de los usuarios dejarían de proporcionar seudonimización efectiva conforme al Art. 32 RGPD.
- **Solución Óptima Propuesta**:
  Usar `crypto.createHmac('sha256', secret)` utilizando un secreto dedicado de servidor (`IP_HASH_SECRET` / `USER_SESSION_SECRET`) rotado y fail-closed si no existe en producción, eliminando toda sal hardcoded en código fuente.

### [SEC-014] `docker-compose.yml` expone puertos `3306` y `6379` en `0.0.0.0`, usa contraseñas débiles fijas y omite hardening de contenedores

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `docker-compose.yml` (líneas 1-34)
- **Diagnóstico del Problema**:
  El archivo `docker-compose.yml` mapea `"3306:3306"` para `mysql:8.0` y `"6379:6379"` para `redis:7-alpine` sin vincular a `127.0.0.1` (`"127.0.0.1:3306:3306"`), utiliza credenciales débiles hardcoded para entorno local, ejecuta servicios sin `user:` no privilegiado ni `cap_drop: [ALL]`, carece de `security_opt: [no-new-privileges:true]` y no configura `healthcheck` con `condition: service_healthy`. Además, Redis arranca sin `--requirepass` ni ACLs.
- **Riesgo o Impacto**:
  Si alguien ejecuta este `docker-compose.yml` en un VPS con firewall abierto, MySQL y Redis quedan expuestos directamente a Internet (Redis sin contraseña permite RCE/escritura o vaciado completo de claves de rate-limit).
- **Solución Óptima Propuesta**:
  Vincular puertos únicamente a `127.0.0.1`, exigir contraseña Redis `--requirepass`, añadir `healthcheck`, `cap_drop: ["ALL"]`, `no-new-privileges:true`, usuario no-root y leer todas las credenciales obligatoriamente vía variables `${VAR:?}` sin valores por defecto inseguros.

### [SEC-015] `scripts/backup_mysql.sh` permite generar copias de seguridad MySQL sin cifrar si faltan claves AGE/GPG

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `scripts/backup_mysql.sh` (líneas 77-90)
- **Diagnóstico del Problema**:
  Si `BACKUP_AGE_RECIPIENT` o `BACKUP_GPG_RECIPIENT` no están definidos en el entorno del cron, el bloque `else` de las líneas 88-90 simplemente imprime una advertencia (`⚠️ Aviso de seguridad...`) y deja el dump completo `.sql.gz` sin cifrar en `/var/backups/proyecto_empleo/mysql` (y potencialmente lo replica vía `rclone` al paso siguiente si `BACKUP_REMOTE_DEST` está configurado).
- **Riesgo o Impacto**:
  Toda la base de datos de usuarios (`users.password_hash`, `subscribers.email`, `sponsored_jobs`, `audit_logs`) se almacena y replica en disco/nube sin cifrado asimétrico ante fallo de variable de entorno.
- **Solución Óptima Propuesta**:
  Aplicar política fail-closed en producción: abortar la replicación remota (`exit 1`) o exigir cifrado simétrico/asimétrico obligatorio cuando `BACKUP_REQUIRE_ENCRYPTION=true` (por defecto activado), y verificar periódicamente la restauración en entorno aislado.

### [SEC-016] `frontend/app/api/checkout/route.ts` crea filas reales en `jobs` antes del pago permitiendo relleno de BD y abuso por DoS lógico

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts` (líneas 86-140) y `backend/deactivate_expired_jobs.py` (líneas 131-144)
- **Diagnóstico del Problema**:
  Cada llamada válida a `POST /api/checkout` inserta primero una fila en la tabla principal `jobs` (con `is_active = FALSE`) antes de generar la sesión de Stripe Checkout. Aunque `checkoutLimiter` limita ráfagas por IP, IPs rotatorias o bots pueden generar miles de borradores abandonados en `jobs` hasta que pasen 48 horas y `deactivate_expired_jobs.py` los purgue. Además, el diseño mezcla borradores no pagados dentro de la tabla pública de catálogo `jobs`.
- **Riesgo o Impacto**:
  Degradación del tamaño e índices de la tabla caliente `jobs` (y crecimiento innecesario de tablas de catálogo/logs) ante bots de checkout abandonado, y riesgo de fuga visual si alguna consulta omite `WHERE is_active = TRUE`.
- **Solución Óptima Propuesta**:
  Almacenar el borrador exclusivamente en `sponsored_jobs` (o tabla temporal `checkout_drafts` con TTL corto) hasta recibir y verificar criptográficamente `checkout.session.completed` en el webhook de Stripe, insertando en `jobs` únicamente tras pago confirmado.

### [SEC-017] `backend/mailer.py` y `send_*.py` sin protección ante cabeceras SMTP ni verificación TLS de certificado (`ssl.create_default_context()`)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/mailer.py` (líneas 315-318), `backend/send_custom_alerts.py` (212-216), `backend/send_reactivation.py` (102-106), `backend/send_welcome_onboarding.py` (259-263), `backend/send_saved_jobs_reminder.py` (225-230) y `backend/send_streak_reminder.py` (229-234)
- **Diagnóstico del Problema**:
  Las llamadas `smtplib.SMTP(host, port)` + `server.starttls()` y `smtplib.SMTP_SSL(host, port)` omiten pasar `context=ssl.create_default_context()`. En Python, cuando no se pasa `context`, `SMTP.starttls()` y `SMTP_SSL()` no validan correctamente el hostname del certificado en todas las versiones/configuraciones o utilizan defaults menos estrictos en ausencia de `ssl_context` explícito, permitiendo potenciales ataques MitM si el relay SMTP no es localhost.
- **Riesgo o Impacto**:
  Exposición de credenciales `EMAIL_USER` / `EMAIL_PASSWORD` y del contenido de correos a ataques Man-in-the-Middle frente a relays SMTP remotos con certificados autofirmados o caducados.
- **Solución Óptima Propuesta**:
  Crear y pasar explícitamente `ssl_ctx = ssl.create_default_context()` (con `verify_mode = ssl.CERT_REQUIRED`, `check_hostname = True`) tanto a `SMTP_SSL(..., context=ssl_ctx)` como a `starttls(context=ssl_ctx)`.

### [SEC-018] Ausencia de variable `TRACKING_HMAC_SECRET` obliga a reutilizar `CRON_SECRET` / `ADMIN_SESSION_SECRET` violando separación de claves

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/tracking.py` (líneas 11-18), `backend/mailer.py` (líneas 23, 31) y `.env.example` (líneas 1-30)
- **Diagnóstico del Problema**:
  `backend/logic/tracking.py:12-18` implementa una cascada de fallback de secretos: `TRACKING_HMAC_SECRET or UNSUBSCRIBE_SECRET or CRON_SECRET or ADMIN_SESSION_SECRET`. De igual forma, `mailer.py:23,31` reutiliza `CRON_SECRET` si faltan `UNSUBSCRIBE_SECRET` o `MAGIC_LINK_SECRET`, y el archivo `.env.example` raíz omite por completo documentar la mayoría de estas claves criptográficas independientes.
- **Riesgo o Impacto**:
  La reutilización de una sola clave (`CRON_SECRET`) para firmar URLs públicas de baja/tracking y para autorizar acciones críticas (`/api/index-job`, expiración administrativa) amplía el radio de impacto ante cualquier debilidad criptográfica o compromiso parcial.
- **Solución Óptima Propuesta**:
  Separar dominios criptográficos por secreto obligatorio específico (`ADMIN_SESSION_SECRET`, `USER_SESSION_SECRET`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `TRACKING_HMAC_SECRET`), fallar en arranque si alguno falta o coincide con otro, y documentar todos en `.env.example`.

### [SEC-019] Presencia de archivo `backend/.env` real en disco junto al proyecto y falta de política de permisos/gitignore verificada

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/.env` (1019 bytes en disco, verificado fuera de `git ls-files`) y `.env.example` (líneas 1-30)
- **Diagnóstico del Problema**:
  Aunque `git ls-files` confirma que `backend/.env` no está rastreado en Git actualmente, el archivo reside físicamente en texto plano dentro del árbol desplegado junto con scripts de migración, logs (`migration_log.txt` en `run_migration.sh`), Node/Next.js y herramientas CLI. En entornos cPanel o servidores web mal aislados, ficheros `.env` dentro de subdirectorios de código pueden quedar expuestos si un servidor HTTP sirve accidentalmente el directorio raíz del proyecto en lugar de solo `frontend/`.
- **Riesgo o Impacto**:
  Lectura accidental de credenciales (`DATABASE_URL`, tokens SMTP, claves de APIs sociales) por error de configuración de DocumentRoot o lectura por procesos no privilegiados si carece de permisos `0600`.
- **Solución Óptima Propuesta**:
  Mover los secretos fuera del árbol web (`/etc/proyecto_empleo/env` con permisos `0600` o gestor de secretos del sistema) y reforzar `nginx.conf.template` y `.htaccess` para denegar explícitamente cualquier punto/dotenv incluso en subrutas.

### [SEC-020] `backend/migrate_to_mysql.py`, `import_json_to_mysql.py` y scripts heredados conviven en `backend/` con riesgo de ejecución accidental

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/dump_supabase_to_json.py`, `backend/import_json_to_mysql.py`, `backend/migrate_to_mysql.py`, `backend/run_migration.sh` (líneas 44-66)
- **Diagnóstico del Problema**:
  El directorio de producción `backend/` mantiene scripts de migración puntual histórica junto a `run_migration.sh` que instalan paquetes ejecutando `pip install --upgrade pip` y escriben `migration_log.txt` local dentro del propio repositorio en ejecución.
- **Riesgo o Impacto**:
  Riesgo operacional de ejecutar una importación JSON destructiva/obsoleta o modificar versiones en el venv productivo por ejecución errónea de scripts puntuales almacenados en la ruta activa.
- **Solución Óptima Propuesta**:
  Archivar los scripts de migración one-shot en una carpeta no desplegada (`archive/migrations/`) y congelar todas las dependencias en `requirements.txt` con hashes/versiones exactas mediante archivo lock verificable.

### [SEC-021] Falta validación DNS/SSRF robusta en enlaces `job_url` dentro de `actions.ts:submitSponsoredJob` (solo usa validación sintáctica `isSafePublicUrl`)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (líneas 8, 590-648) vs `frontend/lib/urlSafetyServer.ts`
- **Diagnóstico del Problema**:
  `actions.ts` importa `isSafePublicUrl` de `urlSafety.ts` (validación puramente sintáctica de hostname sin resolución DNS) en lugar de `isSafePublicUrlWithDns` de `lib/urlSafetyServer.ts`, que sí resuelve IP real para prevenir DNS rebinding o dominios que apunten a `127.0.0.1` / redes privadas (`nip.io`, registros A internos). Aunque la oferta pasa a `pendiente`, posteriormente puede ser rastreada por scrapers/dead-link checker (`deactivate_expired_jobs.py`) o visitada por revisores.
- **Riesgo o Impacto**:
  Evasión del filtro de URLs privadas mediante subdominios DNS que resuelvan a IPs internas (`localhost.midominio.com` -> `127.0.0.1`), provocando peticiones SSRF posteriores desde el backend o phishing dirigido al panel admin.
- **Solución Óptima Propuesta**:
  Invocar `isSafePublicUrlWithDns()` tanto al registrar `job_url` en `submitSponsoredJob` y `/api/checkout` como al validar URLs externas antes de cualquier fetch saliente en backend.

### [SEC-022] `next.config.ts` permite `images.remotePatterns` hacia `logo.clearbit.com` y ruta proxy `/api/company-logo` sin caché acotado ni lista de dominios de empresas verificados

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/next.config.ts` (líneas 20-26) y `frontend/app/api/company-logo/route.ts` (líneas 5-54)
- **Diagnóstico del Problema**:
  `api/company-logo/route.ts` expone un endpoint `GET` público sin rate limiting propio (`rate-limit.ts` no limita `/api/company-logo`) que realiza peticiones salientes `fetch('https://logo.clearbit.com/...')` ante cualquier parámetro `domain` arbitrario con sintaxis válida. Si `next/image` o clientes externos invocan este endpoint con miles de dominios aleatorios, el servidor Next.js actúa como proxy abierto contra Clearbit/upstream y consume ancho de banda y descriptores sin control de cuotas.
- **Riesgo o Impacto**:
  Agotamiento de conexiones salientes, posible bloqueo de IP del servidor por parte de Clearbit debido a abuso automatizado a través de `/api/company-logo` y consumo de recursos del proceso Next.js.
- **Solución Óptima Propuesta**:
  Añadir un `RateLimiter` específico en `/api/company-logo`, restringir las consultas únicamente a dominios/empresas presentes en la BD (o exigir firma HMAC de la URL generada por el servidor) y cachear los iconos localmente o en almacenamiento de objetos con TTL largo.

### [SEC-023] `api/admin/gdpr/route.ts` y `api/admin/jobs/route.ts` omiten registro completo en `audit_logs` tras acciones destructivas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/admin/jobs/route.ts` (líneas 30-60) y `frontend/app/api/admin/gdpr/route.ts` (líneas 1-131)
- **Diagnóstico del Problema**:
  Mientras `/api/auth/me` e `/api/unsubscribe` registran trazas de consentimiento y acciones, `api/admin/jobs/route.ts` elimina/aprueba vacantes directamente (`DELETE FROM jobs` / `UPDATE jobs`) sin verificar ni garantizar registro inmutable de auditoría con actor administrador, IP e ID afectado en `audit_logs`, y `/api/admin/gdpr` falla parcialmente sobre tablas inexistentes (`alerts`).
- **Riesgo o Impacto**:
  Falta de trazabilidad forense ante borrados accidentales, abusos de credenciales administrativas o requerimientos de auditoría AEPD para acreditar el cumplimiento efectivo de solicitudes ARSOLP.
- **Solución Óptima Propuesta**:
  Registrar de forma transaccional y obligatoria cada acción administrativa (moderación de ofertas, exportaciones ARSOLP, supresiones y resolución de reportes) en `audit_logs` incluyendo identificador de sesión admin, hash IP, timestamp y resumen no-PII.

### [SEC-024] `deploy.sh` actualiza código, instala dependencias sin lock estricto en Python/Node y recarga PM2 sin healthcheck de BD ni rollback

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `deploy.sh` (líneas 1-59)
- **Diagnóstico del Problema**:
  `deploy.sh` ejecuta `git pull origin main`, corre `consolidate_production_schema.py`, ejecuta `npm install` (en lugar de `npm ci` reproducible contra `package-lock.json`), lanza `npm run build`, recarga PM2 y únicamente comprueba `curl -sf http://127.0.0.1:3000/`. No valida conectividad previa con MySQL/Redis, no hace backup previo de BD antes del DDL, usa `npm install` que puede resolver versiones distintas, y si falla `npm run build` o `curl` tras recargar PM2 no revierte al commit/build anterior.
- **Riesgo o Impacto**:
  Tiempo de inactividad en producción si un despliegue falla a mitad de `npm run build`, deriva silenciosa de dependencias Node por usar `npm install` en lugar de `npm ci`, y riesgo de corrupción de esquema si falla una migración sin copia de seguridad previa.
- **Solución Óptima Propuesta**:
  Usar `npm ci --omit=dev`, respaldar MySQL antes de ejecutar migraciones, construir en directorio staging (`atomic symlink switch`), verificar endpoints `/api/health` (con chequeo real MySQL + Redis) y ejecutar rollback automático ante código distinto de `200`.

### [SEC-025] Ausencia de verificación de integridad criptográfica en `package.json` / `requirements.txt` y dependencias desactualizadas potenciales

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/requirements.txt` (846 bytes), `backend/run_migration.sh` (línea 45) y `frontend/package.json`
- **Diagnóstico del Problema**:
  `backend/run_migration.sh:45` instala versiones fijas hardcoded manualmente (`pymysql==1.1.1 cryptography==42.0.8 python-dotenv==1.0.1`) desvinculadas de `backend/requirements.txt` y sin verificación `--require-hashes`. Asimismo, no existen workflows automáticos de auditoría (`npm audit`, `pip-audit`, Dependabot/Renovate) documentados en el proyecto para vigilar CVE en `next`, `stripe`, `requests`, `beautifulsoup4`, `cryptography` o `bleach`.
- **Riesgo o Impacto**:
  Exposición prolongada a vulnerabilidades conocidas en librerías de terceros (por ejemplo XSS en sanitizadores, Smuggling HTTP o bypass en frameworks JS) sin alertas ni pipeline de parchado.
- **Solución Óptima Propuesta**:
  Centralizar dependencias Python en `requirements.in`/`requirements.txt` con hashes (`pip-compile --generate-hashes`), usar `npm ci` en despliegue y automatizar escaneos periódicos `npm audit --audit-level=high` y `pip-audit` en CI.

### [SEC-026] `api/auth/login/route.ts` permite evasión de bloqueo temporal por cuenta mediante variaciones no canónicas de correo en proveedores tipo Gmail o Unicode

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/auth/login/route.ts` (líneas 45-53, 85-86) y `frontend/app/api/auth/register/route.ts`
- **Diagnóstico del Problema**:
  Aunque el endpoint aplica hash SHA-256 sobre `cleanEmail` (`parsed.data.email.toLowerCase()`), ante un login exitoso (`85-86`) llama a `await userLoginLimiter.resetAsync(clientIp)` y `resetAsync(emailKey)` borrando inmediatamente también el límite por IP para otros usuarios si el atacante posee o crea una cuenta legítima propia en el portal.
- **Riesgo o Impacto**:
  Un atacante que posea una cuenta válida propia puede intercalar un inicio de sesión correcto desde su IP para resetear `userLoginLimiter` por IP (`resetAsync(clientIp)`), permitiéndole continuar intentos de fuerza bruta distribuidos sobre cuentas ajenas desde la misma IP.
- **Solución Óptima Propuesta**:
  Nunca resetear el contador por IP (`clientIp`) tras un login exitoso —resetear únicamente el contador compuesto `ip+email` o `emailKey`—, conservando la limitación de tasa global de la dirección IP ante ráfagas de credential stuffing.

### [SEC-027] `api/unsubscribe/route.ts` expone un ataque potencial de enumeración temporal o flooding de correo si falla Turnstile en entorno sin clave

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (líneas 112-133) y `frontend/lib/turnstile.ts`
- **Diagnóstico del Problema**:
  En `/api/unsubscribe/route.ts:112`, la comprobación anti-bot de Cloudflare Turnstile solo se ejecuta `if (turnstileSecret)`. Si por error de despliegue `TURNSTILE_SECRET_KEY` queda vacío o sin configurar en producción, el endpoint `action: 'request_link'` acepta peticiones automáticas que envían correos con enlace de baja a cualquier email (restringido únicamente por el rate limit en RAM/Redis). Igual ocurre cuando `verifyTurnstileToken` permite fallback sin secreto fuera de validación estricta de entorno.
- **Riesgo o Impacto**:
  Si falta `TURNSTILE_SECRET_KEY` en producción, atacantes automatizados pueden usar el formulario de baja o suscripción como vector de Email Bombing de baja intensidad y consumo de cuota SMTP/reputación del dominio.
- **Solución Óptima Propuesta**:
  Exigir `TURNSTILE_SECRET_KEY` en `NODE_ENV === 'production'` (fail-closed en endpoints públicos de envío de email si no está configurado, salvo llamadas autenticadas) y añadir alertas de arranque si faltan claves críticas de seguridad.

### [SEC-028] `webhooks/stripe/route.ts` carece de atomicidad de idempotencia cuando opera en entornos con `db_proxy.php` y tolera fallos de columnas con `catch {}`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/webhooks/stripe/route.ts` (líneas 113-163, 302-420, 567-570, 637-640)
- **Diagnóstico del Problema**:
  Además de usar `START TRANSACTION` + `FOR UPDATE` incompatibles con `db_proxy.php` (`[BUG-002]`), el manejador de `invoice.payment_failed` (`568`) y `charge.refunded`/`charge.dispute.created` (`638`) captura con `try { ... } catch {}` vacío cualquier error al ejecutar `UPDATE subscribers SET is_premium = FALSE WHERE stripe_customer_id = $1`. Si la consulta falla o el email difiere del usado en checkout, no deja log alguno ni alerta.
- **Riesgo o Impacto**:
  Posibilidad de que usuarios con contracargo (`charge.dispute.created`) o pago fallido definitivo mantengan privilegios `is_premium = TRUE` silenciosamente cuando el identificador de cliente difiera o la tabla no tenga índice/columna esperada.
- **Solución Óptima Propuesta**:
  Registrar todo fallo SQL en logs críticos y propagar HTTP 500 para reintento controlado de Stripe en lugar de usar bloques `catch {}` vacíos, y utilizar `INSERT INTO stripe_processed_events (event_id) ... ON DUPLICATE KEY UPDATE` o tabla única de idempotencia fuera de `FOR UPDATE` si se usa proxy HTTP.

### [SEC-029] `frontend/app/api/webhooks/stripe` confía en `customer_email` o `metadata.email` sin verificar coincidencia ante cuentas registradas y tolera `affiliate_code` no saneado en `checkout`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts` (líneas 80-165), `frontend/app/api/checkout/report/route.ts` y `frontend/app/api/webhooks/stripe/route.ts` (líneas 618-624)
- **Diagnóstico del Problema**:
  Al crear sesiones Stripe Checkout para ofertas, newsletter, informes o Candidato Premium, el comprador introduce cualquier correo en el formulario público sin estar autenticado en `users` (pudiendo pagar/reembolsar o generar facturas/intentos en nombre de un correo de tercero). Además, en `charge.refunded` (`618-624`), si `session?.metadata?.email` fue modificado o falta, cae en múltiples correos alternativos (`billing_details?.email || receipt_email`) afectando a un tercero no dueño de la cuenta.
- **Riesgo o Impacto**:
  Un usuario malicioso que realice un pago de 4,99 € especificando el correo de otra víctima como `customer_email` y luego solicite reembolso/disputa podría provocar la desactivación `is_premium = FALSE` del suscriptor legítimo víctima al cruzarse por `targetEmail`.
- **Solución Óptima Propuesta**:
  Asociar siempre los pagos de Candidato Premium a `user_id` autenticado o vínculo criptográfico `stripe_customer_id`/`stripe_subscription_id` único y jamás revocar `is_premium` por `billing_details?.email` cuando ya exista un `stripe_customer_id` distinto.

### [SEC-030] `frontend/app/api/index-job/route.ts` delega `body.message || error` en respuestas HTTP 500 de backend a cliente

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/api/index-job/route.ts` (líneas 89-93)
- **Diagnóstico del Problema**:
  Aunque el endpoint exige `Authorization: Bearer <CRON_SECRET>` validado con `crypto.timingSafeEqual`, en el bloque `catch (error: any)` de las líneas 89-91 serializa directamente `error.message` dentro del JSON de respuesta HTTP 500 (`JSON.stringify({ success: false, message: error.message || ... })`). Similar patrón ocurre en mensajes detallados en scripts cron que consumen este endpoint.
- **Riesgo o Impacto**:
  Fuga menor de detalles internos de excepción (rutas de credenciales Google Service Account, códigos OpenSSL o parámetros de red) en respuestas HTTP si la respuesta es almacenada en logs compartidos.
- **Solución Óptima Propuesta**:
  Devolver un mensaje genérico estandarizado hacia el cliente HTTP y registrar la pila y detalles completos de `error` únicamente en logs de servidor internos redactados.

### [SEC-031] Ausencia de protección contra Cross-Site Request Forgery (CSRF) estricta en Server Actions cuando falta `Origin` y `Referer`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (líneas 63-80, `verifyCsrfOrigin`) y `frontend/middleware.ts`
- **Diagnóstico del Problema**:
  `verifyCsrfOrigin()` en `actions.ts:63-80` evalúa `Origin`, luego `Referer`, y en ausencia de ambos recurre a `h.get('sec-fetch-site') === 'same-origin'`, mientras `middleware.ts` también valida CSRF sobre `/api/*`. Si en algún navegador antiguo, proxy intermedio o cliente automatizado se altera o elimina `Sec-Fetch-Site` o si `actions.ts` no llama a `verifyCsrfOrigin()` de forma consistente en **todas** las Server Actions mutadoras (por ejemplo `reactToJob`, `submitCompanyReview`, `reportCompanyReview`, `subscribeUser`, `submitPremiumLead`, `submitSponsoredJob`), algunas acciones dependen exclusivamente de la validación implícita de host de Next.js.
- **Riesgo o Impacto**:
  Superficie inconsistente entre Server Actions frente a peticiones cross-origin automatizadas si una configuración de proxy reescribe cabeceras `Host` o `X-Forwarded-Host` (`serverActions.allowedOrigins` en `next.config.ts`).
- **Solución Óptima Propuesta**:
  Configurar explícitamente `experimental.serverActions.allowedOrigins` (o `serverActions.allowedOrigins`) en `next.config.ts`, aplicar `verifyCsrfOrigin()` como middleware/wrapper obligatorio en todas las Server Actions de escritura y validar `X-Forwarded-Host` en Nginx.

### [SEC-032] `backend/monitor_search_console.py` y bots sociales no sanean salidas ni validan límites frente a inyección de respuestas externas

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/monitor_search_console.py` (línea 101), `backend/bluesky_bot.py`, `backend/twitter_bot.py`, `backend/linkedin_bot.py`, `backend/mastodon_bot.py`
- **Diagnóstico del Problema**:
  Los bots sociales (`bluesky_bot.py`, `twitter_bot.py`, `linkedin_bot.py`, `mastodon_bot.py`, `pinterest_bot.py`, `threads_bot.py`, `telegram_bot.py`) toman `title`, `company`, `location` y `salary` directamente de ofertas scrapeadas externas y las publican en redes sociales oficiales de la marca o generan tarjetas gráficas PIL (`image_generator.py`, `youtube_shorts_bot.py`), sin filtrar URLs sospechosas incrustadas en títulos/empresas, texto excesivo ni patrones de spam/phishing.
- **Riesgo o Impacto**:
  Un atacante que publique o inyecte una oferta de spam en una fuente scrapeada (por ejemplo título con URL maliciosa o texto phishing promocional) consigue que los bots oficiales del portal repliquen el enlace malicioso en Bluesky, Twitter/X, LinkedIn, Mastodon y Telegram con la reputación de marca de `portalempleoit.com`.
- **Solución Óptima Propuesta**:
  Implementar un filtro de moderación automática y sanitización antes de difundir en bots sociales que elimine URLs embebidas en `title`/`company`, descarte ofertas con palabras clave de estafa/cripto-spam, valide whitelist de fuentes para auto-difusión y acote longitud de cadenas pasadas a Pillow.

### [SEC-033] Escapes HTML/Telegram en `actions.ts` inconsistentes con validaciones de longitud en campos libres de reseñas y reportes

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/actions.ts` (líneas 812-940, `submitCompanyReview` y `reportCompanyReview`)
- **Diagnóstico del Problema**:
  `submitCompanyReview` y `reportCompanyReview` reciben textos largos de usuarios no autenticados (`review_text`, `explanation`, `reason`) y los almacenan en BD. Si `api/admin/gdpr` o vistas de panel de administración muestran posteriormente el contenido o se renderizan en correos administrativos sin escape consistente, o si atacantes envían decenas de miles de bytes antes de `.slice(0, 2000)`, consumen ancho de banda y almacenamiento con reportes falsos sin CAPTCHA verificado en `reportCompanyReview` (solo `submitCompanyReview` llama a `verifyTurnstileToken` en línea 833; `reportCompanyReview` de las líneas 883-940 no lo verifica!).
- **Riesgo o Impacto**:
  Spam masivo de reportes falsos (`review_reports`) que permiten ocultar abusivamente reseñas legítimas o saturar el panel de moderación rotando emails desechables en `reporter_email`, además de riesgo Stored XSS si alguna plantilla futura de email/admin olvida escapar `explanation`.
- **Solución Óptima Propuesta**:
  Añadir verificación obligatoria de `verifyTurnstileToken` y esquema Zod estricto también en `reportCompanyReview`, limitar el número de reportes pendientes por IP y escapar sistemáticamente toda salida HTML/email mediante librerías probadas.

### [SEC-034] `db_proxy.php` permite transacciones batch de hasta 25 sentencias incluyendo `INSERT` y `UPDATE` arbitrarios tras autenticación estática

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `db_proxy.php` (líneas 290-375, modo `transaction`)
- **Diagnóstico del Problema**:
  El endpoint HTTP PHP acepta un lote transaccional (`queries[]`, hasta 25 consultas en una sola petición HTTP) y, mientras prohíbe múltiples sentencias separadas por punto y coma, permite combinar libremente `INSERT` y `UPDATE` sin validación por tabla en el bloque `UPDATE` (`335-344`). Al evaluarse en un proxy PHP compartido, la pérdida del token estático permite modificar cualquier registro del esquema en una única llamada batch.
- **Riesgo o Impacto**:
  Escalado de privilegios directo o alteración atómica de registros financieros (`stripe_processed_events`, `sponsored_jobs`) y cuentas (`users`) sin necesidad de acceso SSH ni red privada MySQL.
- **Solución Óptima Propuesta**:
  Restringir el proxy PHP únicamente a operaciones de lectura/escritura específicamente declaradas en una tabla de capacidades por tabla+operación, o retirar el proxy HTTP migrando el frontend al mismo host privado o túnel cifrado directo.

### [SEC-035] `nginx.conf.template` cachea o delega rutas `/api/` y cabeceras `X-Frame-Options` / `CSP` sin desactivar `proxy_hide_header` frente a conflictos de Next.js

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `nginx.conf.template` (líneas 100-214) y `frontend/next.config.ts` (líneas 45-70)
- **Diagnóstico del Problema**:
  Nginx establece cabeceras de seguridad globales (`add_header ...`) en nivel de servidor y en bloques `location`. En Nginx, el uso de `add_header` dentro de un bloque `location` hijo (como los bloques estáticos o `/_next/static/`) anula por completo todos los `add_header` heredados del bloque `server` padre salvo que se repitan explícitamente o se use `ngx_headers_more`. Simultáneamente, `next.config.ts` añade sus propias cabeceras creando duplicados o choques como la doble CSP (`[SEC-002]`).
- **Riesgo o Impacto**:
  Pérdida silenciosa de cabeceras como `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` o `Referrer-Policy` en bloques específicos de activos estáticos y respuestas cacheadas.
- **Solución Óptima Propuesta**:
  Mover las cabeceras de seguridad universales a un archivo `/etc/nginx/snippets/security-headers.conf` incluido en cada `location` que defina `add_header` (especialmente en `/static/` y `/_next/static/`), eliminando definiciones redundantes en `next.config.ts`.

### [SEC-036] `backend/logic/ssrf.py` resuelve DNS antes de llamar a `requests` permitiendo ventana teórica de DNS Rebinding entre comprobación y conexión

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/ssrf.py` (líneas 1-182, `safe_http_get`) y `frontend/lib/urlSafetyServer.ts` (líneas 1-54)
- **Diagnóstico del Problema**:
  Tanto `safe_http_get` en Python como `isSafePublicUrlWithDns` en TypeScript resuelven el dominio con DNS primero (`socket.getaddrinfo` / `dns.lookup`) para validar que la IP resultante no sea privada/loopback, y posteriormente realizan la petición HTTP por hostname (`requests.get(current_url)` / `fetch(...)`), produciéndose una segunda resolución DNS independiente dentro de la librería HTTP/OS.
- **Riesgo o Impacto**:
  Un servidor DNS malicioso con TTL=0 controlado por un atacante o una fuente externa comprometida puede devolver primero una IP pública inocua durante el check y una IP interna (`127.0.0.1` o `169.254.169.254`) durante el `connect()` real (ataque TOCTOU / DNS Rebinding).
- **Solución Óptima Propuesta**:
  Fijar la IP pública validada (*DNS pinning*) inyectando un socket/adaptador HTTP que conecte directamente contra la IP resuelta preservando la cabecera `Host` y el SNI TLS original (`server_hostname`), tanto en `backend/logic/ssrf.py` como en endpoints salientes de Next.js.

### [SEC-037] Riesgo de inyección de prompt (Indirect Prompt Injection) en generadores Gemini al interpolar títulos y textos de ofertas scrapeadas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/generate_news_post.py` (líneas 54-85), `backend/generate_trends_post.py`, `backend/generate_weekly_article.py` y `backend/generate_podcast_script.py`
- **Diagnóstico del Problema**:
  Los generadores automáticos de contenido editorial (`generate_trends_post.py`, `generate_podcast_script.py`, `generate_market_report.py`) consultan títulos, descripciones o métricas agregadas de ofertas externas desde la tabla `jobs` e interpolan directamente texto/títulos en los prompts enviados a Gemini o en artículos Markdown publicados en `blog_posts`. En `generate_news_post.py:4`, se importa `bleach`, pero el flujo en varios generadores confía en la estructura JSON de salida del LLM antes de guardar en BD.
- **Riesgo o Impacto**:
  Una oferta externa maliciosa con instrucciones incrustadas en su título o snippet puede manipular la redacción generada para incluir enlaces externos no deseados, spam SEO, desinformación o Markdown peligroso.
- **Solución Óptima Propuesta**:
  Envolver los datos agregados y ejemplos externos en delimitadores estructurados con instrucciones explícitas de datos no confiables, validar estrictamente la salida LLM mediante esquema y listas blancas de URLs antes de guardar, y sanitizar todo Markdown/HTML en renderizado (`Markdown` component / `bleach`).

### [SEC-038] `api/track-click/route.ts` procesa `t=` y `email=` heredados con posibilidad de exposición de enlaces firmados expirados o manipulación de parámetros

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/track-click/route.ts` (líneas 21-145) y `frontend/app/api/track-open/route.ts` (líneas 36-65)
- **Diagnóstico del Problema**:
  En `track-click/route.ts:127-135`, `getSanitizedRedirect()` sanea `redirect` incluso cuando `isAuthorized` es `false` y ejecuta `NextResponse.redirect` sin rechazar explícitamente las peticiones sin autorización cuando el destino es interno, a la vez que la firma HMAC `verifyTrackingSignature` convive con dos esquemas (`payload` Base64 en `t=` o parámetros sueltos `?email=&campaign=&url=`). Además, si `rawEmail` llega en query string desde scripts legacy sin actualizar (`send_custom_alerts.py`, `send_reactivation.py`, `send_welcome_onboarding.py`), la redirección ocurre sin registrar métrica o filtrando el email en access logs.
- **Riesgo o Impacto**:
  Fragmentación de verificación de enlaces de seguimiento, riesgo de comportamiento inconsistente como open-redirect parcial ante URLs relativas mal formadas y exposición persistente del correo del candidato en las URLs de correos salientes.
- **Solución Óptima Propuesta**:
  Unificar en tokens opacos cifrados con expiración obligatoria, restringir cualquier redirección no firmada estrictamente a `'/'` o rutas internas de allowlist cerrada (rechazando dominios externos salvo firma HMAC válida sobre el `redirect_url` exacto) y migrar todos los mailers al formato único cifrado.

### [SEC-039] `backend/logic/mailer.py` y `send_*.py` carecen de saneamiento CRLF/Header Injection al construir asuntos dinámicos con títulos de ofertas

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/send_instant_featured_alerts.py` (líneas 190-220), `backend/send_custom_alerts.py` y `backend/mailer.py` (líneas 530-540)
- **Diagnóstico del Problema**:
  Los correos de alerta instantánea, alertas personalizadas y resúmenes insertan `title`, `company` o `location` obtenidos de ofertas externas o formularios B2B en `msg['Subject']` y cuerpo HTML. Aunque `email.mime` moderno en Python 3 mitiga algunas inyecciones newline dependiendo de la política (`policy`), la ausencia de una limpieza explícita de `\r`, `\n` y caracteres de control Unicode en `Subject` y `To`/`From` deja la validación delegada al comportamiento por defecto del módulo. En cuerpos HTML, scripts como `send_custom_alerts.py` o `send_referral_notifications.py` deben asegurar escape sistemático con `safe_text()` (`email_renderer.py:24`) en todo dato de oferta/empresa.
- **Riesgo o Impacto**:
  Posible HTML Injection en correos electrónicos corporativos o de candidatos si una oferta B2B pendiente o externa contiene etiquetas `<a href=...>` o estilos phishing en `title` o `company` al enviarse alertas.
- **Solución Óptima Propuesta**:
  Stripear `[\r\n\x00-\x1f]` de todas las cabeceras (`Subject`, `Reply-To`, `To`) y forzar el renderizado completo mediante Jinja2 con `autoescape=select_autoescape(['html', 'xml'])` (`backend/logic/email_renderer.py`) en todos los scripts `send_*.py` y `mailer.py`.

### [SEC-040] `send_custom_alerts.py`, `send_welcome_onboarding.py` y `send_instant_featured_alerts.py` aceptan peticiones HTTP/cron sin validación de supresión previa (`email_suppression_list`)

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/mailer.py` (287-302), `backend/send_custom_alerts.py` (178-192), `backend/send_instant_featured_alerts.py` (138-150), `backend/send_welcome_onboarding.py` (237-245), `backend/send_reactivation.py` (74-85), `backend/send_referral_notifications.py` (148-153), `backend/send_saved_jobs_reminder.py` (149) y `backend/send_streak_reminder.py` (152)
- **Diagnóstico del Problema**:
  Ninguno de los 8 scripts backend de correo consulta `email_suppression_list` antes de enviar un mensaje SMTP. Si un usuario eliminó su cuenta (`DELETE /api/auth/me:263` inserta su hash en `email_suppression_list` y borra de `subscribers`), un re-registro posterior mediante el mismo email o una desincronización de estado de suscripción/rebote en `subscribers` permitiría volver a enviarle correos prohibidos tras haber ejercido oposición o sufrido hard bounce (`SMTPRecipientsRefused`). Asimismo, tampoco verifican que exista `confirmed_at IS NOT NULL`.
- **Riesgo o Impacto**:
  Envíos no autorizados a cuentas suprimidas o rebotadas (hard bounce), deterioro grave de reputación IP/SPF/DKIM/DMARC con riesgo de bloqueo en Gmail/Outlook e incumplimiento directo del bloqueo preventivo RGPD.
- **Solución Óptima Propuesta**:
  Añadir `AND SHA2(LOWER(TRIM(email)), 256) NOT IN (SELECT email_hash FROM email_suppression_list)` (y `AND confirmed_at IS NOT NULL`) en una función común de repositorio de suscriptores activos compartida por todos los mailers, e insertar automáticamente en `email_suppression_list` ante `SMTPRecipientsRefused` en `mailer.py:554`.

### [SEC-041] `scripts/backup_mysql.sh` lee `.env.local` con `grep/cut` vulnerable a valores multilínea/caracteres especiales y escribe contraseña temporal con `cat <<EOF`

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `scripts/backup_mysql.sh` (líneas 18-50)
- **Diagnóstico del Problema**:
  `read_env_var()` extrae credenciales de `frontend/.env.local` usando `grep -E "^${var_name}=" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'"`, lo cual falla o trunca contraseñas que contengan comillas válidas, comentarios `#` en línea o saltos, además de depender de la ubicación de `frontend/.env.local` en vez de `/etc/proyecto_empleo/backup.env`.
- **Riesgo o Impacto**:
  Fallo silencioso o parcial del respaldo nocturno MySQL tras rotación de contraseña si esta contiene caracteres especiales, o lectura de credenciales equivocadas entre entornos backend/frontend.
- **Solución Óptima Propuesta**:
  Aprovisionar un archivo de credenciales dedicado `/etc/proyecto_empleo/backup.my.cnf` con `chmod 600` nativo de MySQL (`client` group) sin parseo frágil de `.env.local` vía `tr`/`cut`.

### [SEC-042] `CookieBanner.tsx` purga cookies vía `document.cookie` sin poder borrar cookies `HttpOnly`, de terceros o cancelar suscripción Push activa de OneSignal

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 103-143, `purgeNonEssentialStorage`)
- **Diagnóstico del Problema**:
  Cuando el usuario revoca o rechaza cookies después de haberlas aceptado, `purgeNonEssentialStorage()` intenta borrar `_ga`, `__gads`, `IDE`, `__os_*` escribiendo sobre `document.cookie`, limpiando `localStorage` y llamando a `indexedDB.deleteDatabase('ONE_SIGNAL_SDK_DB')`. Sin embargo, desde JavaScript de primer origen es imposible eliminar cookies marcadas en subdominios/dominios de terceros (`doubleclick.net`, `google.com`, `onesignal.com`) o con flag `HttpOnly`, y eliminar `ONE_SIGNAL_SDK_DB` no llama a `OneSignal.User.PushSubscription.optOut()` ni desregistra el Service Worker push existente si ya se cargó el SDK en la sesión actual.
- **Riesgo o Impacto**:
  Los identificadores push en servidor OneSignal o etiquetas `<script>` ya cargadas en memoria dentro de la pestaña actual continúan disparando eventos o manteniendo al navegador suscrito tras la revocación hasta recarga completa y revocación SDK explícita.
- **Solución Óptima Propuesta**:
  Ejecutar `window.OneSignalDeferred` (`User.PushSubscription.optOut()` y desregistro del service worker si se revoca), informar al usuario recargar o limpiar sesión al revocar scripts ya inyectados en el DOM actual y garantizar que ningún SDK no esencial se inyecte en el DOM antes del consentimiento.

### [SEC-043] `.env.example` raíz omite documentar 15+ secretos críticos de seguridad y sesiones

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `.env.example` (líneas 1-30) y variables leídas en `middleware.ts`, `userAuth.ts`, `logic/tracking.py`, `api/index-job`
- **Diagnóstico del Problema**:
  El fichero `.env.example` de la raíz no lista ni documenta variables críticas requeridas para seguridad en producción como `ADMIN_SESSION_SECRET`, `USER_SESSION_SECRET`, `UNSUBSCRIBE_SECRET`, `TRACKING_HMAC_SECRET`, `MAGIC_LINK_SECRET`, `CRON_SECRET`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `DB_PROXY_TOKEN`, `REDIS_URL`, `LEGAL_NIF`, `LEGAL_ADDRESS` ni `BACKUP_AGE_RECIPIENT`.
- **Riesgo o Impacto**:
  Despliegues en nuevos servidores omiten variables esenciales provocando que el sistema entre en modo degradado (sin Turnstile, sin firma opaca de tracking, reutilizando `CRON_SECRET` como clave múltiple, usando fallbacks hardcoded o mostrando textos legales pendientes).
- **Solución Óptima Propuesta**:
  Unificar un inventario completo validado en arranque (con script `check_env.py` / `env.ts` usando Zod que valide entropía >= 32 bytes y unicidad entre secretos distintos antes de iniciar la aplicación).

### [SEC-044] Falta de verificación de estado de sesión/token revocado en Edge `middleware.ts` para `user_session` tras `reset-password` o `DELETE /api/auth/me`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/middleware.ts` (líneas 1-278), `frontend/app/api/auth/reset-password/route.ts` (línea 65) y `frontend/app/api/auth/me/route.ts` (línea 258)
- **Diagnóstico del Problema**:
  `/api/auth/reset-password:65` actualiza `session_version = session_version + 1` y `user_sessions SET revoked = TRUE`, mientras `middleware.ts` en Edge Runtime realiza validación HMAC criptográfica del token `user_session` sin consultar a MySQL ni a Redis si el `jti` fue revocado o si `session_version` incrementó (debido a limitaciones de Edge Runtime sin driver TCP MySQL).
- **Riesgo o Impacto**:
  Ventana temporal en la que páginas SSR o rutas que dependan únicamente de la comprobación superficial del middleware (antes de llegar a verificaciones `requireAuthenticatedUser()` en backend API) podrían seguir considerando la cookie HMAC válida hasta su expiración natural si no revalidan `session_version`/`revoked` en BD/Redis en todas las rutas protegidas.
- **Solución Óptima Propuesta**:
  Asegurar que **toda** página SSR protegida (`/mi-perfil`, `/ofertas-guardadas`, `/perfil`, `/empresa-dashboard`) y API endpoint privado valide `session_version` y `revoked = FALSE` en BD/Redis, y opcionalmente sincronizar las revocaciones en Redis Edge REST (`UPSTASH_REDIS_REST_URL`) para invalidación inmediata en `middleware.ts`.

### [SEC-045] Ausencia de protección contra enumeración temporal de cuentas en `POST /api/auth/register` y comprobación de contraseña comprometida

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/auth/register/route.ts`
- **Diagnóstico del Problema**:
  Mientras `/api/auth/login` implementa explícitamente un `DUMMY_HASH` precalculado para igualar tiempos ante cuentas inexistentes (`login/route.ts:22,69`), conviene reforzar el registro y recuperación para asegurar respuestas constantes sin revelar existencia previa de emails (`409 Conflict` vs envío transparente de aviso) ni aceptar contraseñas débiles filtradas en diccionarios comunes sin validación HIBP/zxcvbn o requisito robusto + Turnstile obligatorio.
- **Riesgo o Impacto**:
  Posibilidad de confirmar si un correo de candidato o reclutador está registrado en el portal durante el flujo de registro o recuperación si los tiempos o mensajes difieren, así como creación de cuentas con contraseñas triviales vulneradas en brechas públicas.
- **Solución Óptima Propuesta**:
  Uniformizar respuestas y latencias en registro/recuperación enviando notificación segura al correo existente en vez de divulgar `409` en respuestas sin Turnstile verificada, exigir longitud mínima >= 10 caracteres con rechazo de top contraseñas débiles y proteger el registro con Turnstile obligatorio.

### [SEC-046] Exposición de endpoints sin aislamiento explícito de métodos y `CORS` implícito en APIs públicas

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/api/jobs/route.ts`, `frontend/app/api/salarios/route.ts` y `nginx.conf.template`
- **Diagnóstico del Problema**:
  Los endpoints públicos de lectura (`GET /api/jobs`, `GET /api/salarios`, `GET /api/track-open`, `GET /api/track-click`) y los endpoints de escritura no establecen una política centralizada de cabeceras `Access-Control-Allow-Origin` ni bloqueo explícito de métodos HTTP inesperados (`OPTIONS`, `PUT`, `DELETE`, `TRACE`) en Nginx. Además, `/api/jobs` acepta parámetros arbitrarios sin caché CDN `Cache-Control: public, s-maxage=...` cuando la consulta es genérica, permitiendo scraping masivo directo contra BD mediante paginación secuencial.
- **Riesgo o Impacto**:
  Extracción automatizada del catálogo completo de vacantes limpias y normalizadas desde `/api/jobs` con menor fricción que el scraping HTML y carga directa de cada página solicitada sobre MySQL/`db_proxy.php`.
- **Solución Óptima Propuesta**:
  Aplicar rate limiting más estricto + paginación máxima acotada (`page <= 25`) en `/api/jobs`, habilitar caché Edge (`s-maxage=60, stale-while-revalidate=300`) para consultas canónicas sin parámetros raros y bloquear métodos HTTP no permitidos en `nginx.conf.template`.

### [SEC-047] `frontend/app/api/unsubscribe/route.ts` ejecuta múltiples mutaciones y borrados PII sin transacción atómica (`START TRANSACTION`)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (líneas 215-260)
- **Diagnóstico del Problema**:
  El manejador `POST /api/unsubscribe` ejecuta una secuencia de al menos 7 sentencias independientes (`UPDATE subscribers` x2, `UPDATE users`, `UPDATE alerts`, `UPDATE saved_jobs_reminders`, `UPDATE streak_reminders`, `UPDATE premium_leads`, `INSERT email_suppression_list`, `INSERT consent_audit_log`, `DELETE FROM email_tracking`) sin transacción SQL atómica ni verificación de consistencia global.
- **Riesgo o Impacto**:
  Si falla la conexión tras actualizar `subscribers` pero antes de insertar en `email_suppression_list` o borrar `email_tracking`, la baja queda en estado inconsistente a medias (sin quedar bloqueado contra futuros envíos o conservando historial de aperturas).
- **Solución Óptima Propuesta**:
  Agrupar las mutaciones reales existentes en una transacción SQL única (o asegurar reintentos idempotentes sin tablas inexistentes), garantizando primero el registro en `email_suppression_list` y `subscribers.is_active = FALSE` de forma atómica.

### [SEC-048] Riesgo de bloqueo del proceso Node.js en generación síncrona de PDF/estadísticas (`/api/checkout/report/download`) ante abuso concurrente

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/report/download/route.ts` (líneas 100-158)
- **Diagnóstico del Problema**:
  Cada descarga autorizada del informe de mercado (`GET /api/checkout/report/download`) invoca `getOrComputeSalaryStats()` (que consulta y procesa cientos de vacantes en Node.js) y construye un documento PDF en memoria de forma síncrona por petición (hasta 5 descargas por compra), sin rate limit dedicado por IP o por `session_id` en el propio handler (`rate-limit.ts` no limita `/download`).
- **Riesgo o Impacto**:
  Un comprador con enlace válido o peticiones repetidas con tokens inválidos contra Stripe API (`stripe.checkout.sessions.retrieve`) puede saturar cuotas de API de Stripe o memoria/CPU del event loop de Next.js.
- **Solución Óptima Propuesta**:
  Aplicar `RateLimiter` por IP y por `session_id` antes de consultar Stripe o generar el PDF, y cachear `getOrComputeSalaryStats()` con `unstable_cache` / Redis TTL de 1 hora.

### [SEC-049] Falta de rotación y revocación persistente documentada para `ADMIN_SESSION_SECRET` / `db_proxy.php` tokens

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/middleware.ts`, `db_proxy.php` (líneas 152-157) y `backend/.env.example`
- **Diagnóstico del Problema**:
  El código valida un único token secreto actual (`DB_PROXY_TOKEN` en PHP, `CRON_SECRET` en `api/index-job`, `UNSUBSCRIBE_SECRET` en bajas y DOI). No existe soporte de doble secreto activo (`CURRENT_SECRET` + `PREVIOUS_SECRET`) para rotación sin tiempo de inactividad ni invalidación de enlaces firmados previos ante rotación.
- **Riesgo o Impacto**:
  Rotar `UNSUBSCRIBE_SECRET` rompe instantáneamente todos los enlaces de baja `"Darme de baja en 1 clic"` incluidos en correos enviados días o semanas antes; rotar `DB_PROXY_TOKEN` causa ventana de caída HTTP 401/403 entre backend/frontend.
- **Solución Óptima Propuesta**:
  Soportar listas de claves separadas por coma o `SECRET` + `SECRET_PREVIOUS` para verificación de firmas HMAC (firmando siempre con la clave primaria nueva y aceptando la anterior durante ventana de gracia de 90 días para unsubscribes y 24h para tokens operativos).

### [SEC-050] `backend/logic/tdm.py` permite scraping si `robots.txt` falla por timeout, error SSL o error de red (fail-open en excepción)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/logic/tdm.py` (líneas 35-41, `_get_robot_parser`)
- **Diagnóstico del Problema**:
  Mientras el código aplica correctamente fail-closed para códigos HTTP `403`, `429` o `5xx` simulando `Disallow: /` (`lines 35-38`), el bloque `except Exception:` de las líneas `39-41` devuelve `None` y lo cachea como sin restricciones. Si un portal bloquea conexiones a `robots.txt` mediante RST TCP, timeout de firewall o verificación SSRF, el crawler continúa scrapeando la ruta principal como si estuviera permitida.
- **Riesgo o Impacto**:
  Riesgo de violar restricciones de acceso o exclusión TDM/robots.txt de sitios con protección perimetral activa ante caídas de red o resets de socket.
- **Solución Óptima Propuesta**:
  Devolver e cachear temporalmente (TTL corto de 15 minutos) una política `Disallow: /` en caso de timeout/error de red crítico distinto de `404`/`410`, registrando alerta en consola.

### [SEC-051] Uso de `http` / puertos sin TLS interno entre Nginx, Next.js, MySQL y Redis cuando se despliegan en hosts separados

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `docker-compose.yml` (líneas 1-34), `nginx.conf.template`, `backend/db_helper.py` (líneas 34-42) y `frontend/lib/db.ts`
- **Diagnóstico del Problema**:
  Aunque `backend/db_helper.py:34-42` exige TLS estricto para hosts remotos a `localhost`/`127.0.0.1`, la conectividad de Redis en `frontend/lib/rate-limit.ts` usa TCP plano `redis://` sin exigir `rediss://` TLS para instancias remotas ni autenticación obligatoria documentada, y `nginx.conf.template` solo expone instrucciones template dependientes de certificados externos no validados automáticamente en arranque.
- **Riesgo o Impacto**:
  Tráfico sin cifrar con tokens de sesión o contadores de rate-limit si Redis o MySQL se mueven a una VPC compartida o VPS separado sin VPN/TLS.
- **Solución Óptima Propuesta**:
  Soporte obligatorio de `rediss://` con TLS en el cliente Redis de `rate-limit.ts` cuando el host no sea loopback, y vinculación exclusiva a red privada docker / `127.0.0.1` cuando corran en el mismo nodo.

### [SEC-052] `backend/run_all.py` encadena ejecución de 20+ scripts con permisos iguales, compartiendo credenciales totales de BD, SMTP, Stripe/Gemini y redes sociales

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/run_all.py` (líneas 35-225) y `backend/.env`
- **Diagnóstico del Problema**:
  Todos los procesos —desde los scrapers que consumen HTML/JSON no confiable de Internet (`main.py`, `job_spider.py`, `scraper_infoempleo.py`) hasta los mailers masivos, generadores Gemini y bots OAuth de LinkedIn/Twitter/YouTube/Bluesky— se lanzan secuencialmente bajo el mismo usuario OS y el mismo archivo `.env` completo con acceso total a la BD (`root` o usuario `DDL/DROP`), clave SMTP y tokens sociales.
- **Riesgo o Impacto**:
  Una vulnerabilidad RCE o de parseo XML/HTML en un scraper público (`lxml`, `BeautifulSoup`, `Scrapy`, `PIL`/`Pillow`) otorga al atacante acceso inmediato a todos los correos electrónicos de candidatos (`subscribers`), hashes de `users`, tokens OAuth sociales y claves de API Gemini/Google Indexing.
- **Solución Óptima Propuesta**:
  Aplicar principio de mínimo privilegio: separar usuarios de BD MySQL (usuario de lectura/inserción `jobs` limitado para scrapers, usuario SMTP/lectura para mailers, usuario aislado para migraciones DDL) y ejecutar scrapers en contenedores/procesos sandboxed sin acceso a tokens SMTP ni redes sociales.

### [SEC-053] Falta verificación criptográfica de integridad/origen en descargas de tarjetas o imágenes procesadas por bots y `Pillow` (`PIL`)

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/logic/image_generator.py`, `backend/youtube_shorts_bot.py` (líneas 44-142), `backend/twitter_bot.py` (líneas 165-177) y `backend/linkedin_bot.py`
- **Diagnóstico del Problema**:
  Los generadores gráficos construyen imágenes JPG/MP4 locales con nombres predecibles en el directorio de trabajo (`temp_card_{job_id}.jpg`, `shorts_card_{job_id}.jpg`) sin usar directorios temporales seguros (`tempfile.mkdtemp(prefix=...)`) ni limpiar en `finally`, ejecutando además `ffmpeg` mediante `subprocess.run` en `youtube_shorts_bot.py:164` sobre rutas generadas desde `job_id`.
- **Riesgo o Impacto**:
  Si `job_id` contuviera secuencias inusuales de ruta (`../`) al venir de fuentes no validadas o si dos procesos se ejecutan simultáneamente, pueden producirse colisiones de archivos temporales o fuga en el directorio raíz `backend/`.
- **Solución Óptima Propuesta**:
  Validar estrictamente `job_id` alfanumérico/UUID antes de construir rutas, usar `tempfile.TemporaryDirectory()` con limpieza automática y aplicar parámetros `resource` / timeout y opciones seguras de `ffmpeg` (`-nostdin -loglevel error`).

### [SEC-054] Riesgo de denegación de servicio por ejecución de `FULLTEXT` y consultas sin paginación acotada en `/api/jobs`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/jobs/route.ts` (líneas 1-74) y `frontend/lib/jobs.ts`
- **Diagnóstico del Problema**:
  `GET /api/jobs` permite solicitar páginas altas (`?page=500`) generando `OFFSET 9980` en MySQL sobre filtros complejos con `LIKE '%...%'` o `MATCH ... AGAINST` y `ORDER BY is_featured DESC, created_at DESC`. Consultas con `OFFSET` grande obligan a MySQL a escanear y descartar decenas de miles de filas por cada petición concurrente.
- **Riesgo o Impacto**:
  Un atacante que envíe ráfagas dentro del límite de tasa solicitando páginas profundas (`page=200..1000`) junto con múltiples términos de búsqueda puede elevar la CPU de MySQL al 100%.
- **Solución Óptima Propuesta**:
  Restringir `page` a un máximo razonable (por ejemplo `1..50`) o migrar `LoadMoreJobs` a paginación por cursor (`keyset pagination` usando `(created_at, id)`), además de limitar longitud máxima de `q` y `location` en `api/jobs/route.ts`.

### [SEC-055] Ausencia de caducidad o revocación automática de tokens de acceso de bots sociales y rotación manual (`youtube_shorts_bot.py`, `linkedin_bot.py`, `threads_bot.py`)

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/linkedin_bot.py` (líneas 102-104), `backend/youtube_shorts_bot.py` (líneas 258-262) y `backend/threads_bot.py`
- **Diagnóstico del Problema**:
  Los bots leen tokens estáticos de larga duración (`LINKEDIN_ACCESS_TOKEN`, `THREADS_ACCESS_TOKEN`, `PINTEREST_ACCESS_TOKEN`) directamente desde variables de entorno sin flujo automático de refresco ni alerta previa antes de su expiración (LinkedIn y Meta Threads expiran tokens cada 60 días), y en `bluesky_bot.py:39` autentica por sesión enviando handle + password en cada ejecución.
- **Riesgo o Impacto**:
  Fallos recurrentes y silenciosos de publicación en redes cuando expira un token OAuth tras 60 días, acumulando pasos fallidos diarios en `run_all.py`.
- **Solución Óptima Propuesta**:
  Implementar refresco automático OAuth con almacenamiento cifrado de tokens renovados o alerta temprana (`< 7 días` de vigencia) hacia un webhook administrativo Telegram cuando un endpoint devuelva `401 Unauthorized`.

### [SEC-056] `frontend/app/api/auth/me/route.ts` elimina datos sin verificar explícitamente impacto en registros de facturación Stripe o disputas legales

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/auth/me/route.ts` (líneas 225-290, método `DELETE`)
- **Diagnóstico del Problema**:
  Al eliminar una cuenta de usuario (`DELETE /api/auth/me`), las líneas 258-272 borran en cascada manual sin transacción explícita (`START TRANSACTION`) registros en `user_sessions`, `user_password_resets`, `user_saved_jobs`, `subscribers` y `users`. Si existen suscripciones activas en Stripe asociadas a ese usuario, el endpoint tampoco cancela la suscripción recurrente en la API de Stripe antes de destruir la fila `users`/`subscribers`, ni engloba los `DELETE` en una transacción atómica con rollback.
- **Riesgo o Impacto**:
  Un usuario con Candidato Premium activo que elimine su cuenta puede seguir recibiendo cargos mensuales de Stripe al no cancelarse automáticamente su suscripción en Stripe; además, un fallo a mitad del borrado deja filas inconsistentes entre `users` y `subscribers`.
- **Solución Óptima Propuesta**:
  Ejecutar la cancelación de suscripciones activas en Stripe (`stripe.subscriptions.cancel`), encapsular todas las operaciones `DELETE` + `INSERT email_suppression_list` + `consent_audit_log` dentro de una transacción SQL atómica (conservando únicamente los registros contables exigidos por ley fiscal disociados de perfil activo), y devolver confirmación al usuario.

### [SEC-057] `frontend/app/api/jobs/route.ts` y `actions.ts` no exponen `RateLimit-*` / `Retry-After` estándar en respuestas `429`

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/api/jobs/route.ts` (líneas 12-14), `frontend/app/api/salarios/route.ts` (líneas 12-14), `frontend/app/api/subscribe/route.ts` (líneas 15-16) y `frontend/app/api/checkout/route.ts`
- **Diagnóstico del Problema**:
  Las respuestas `429 Too Many Requests` en los endpoints API devuelven cuerpo plano o JSON sin incluir las cabeceras estándar IETF `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` y `X-RateLimit-Reset` pese a que `RateLimiter` ya calcula `limit`, `remaining` y `reset`.
- **Riesgo o Impacto**:
  Clientes legítimos, integraciones y componentes frontend (`LoadMoreJobs`) no conocen cuándo pueden reintentar de forma segura, provocando reintentos inmediatos en bucle que agravan congestión y degradan la experiencia de usuario.
- **Solución Óptima Propuesta**:
  Crear una utilidad común `rateLimitResponse(result, message)` que adjunte sistemáticamente `Retry-After` en segundos y cabeceras `X-RateLimit-*` en respuestas `429`.

### [SEC-058] Falta restricción estricta de `Referer` / `X-Frame-Options` y protección anti-hotlinking en imágenes OpenGraph dinámicas

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/job/[id]/opengraph-image.tsx`, `frontend/app/empresas/[slug]/opengraph-image.tsx` y demás rutas `opengraph-image.tsx`
- **Diagnóstico del Problema**:
  El portal genera dinámicamente imágenes PNG vía Satori/`ImageResponse` para 8 tipos distintos de rutas (`job/[id]`, `empresas/[slug]`, `blog/[slug]`, `entrevistas/[tech]`, `glosario/[term]`, `trabajos/[sector]`, `salarios`, raíz). Varias de estas rutas realizan consultas SQL dinámicas para poblar la imagen sin caché estricto o rate limit específico ni validación temprana de slugs inexistentes antes de renderizar canvas Satori.
- **Riesgo o Impacto**:
  Rastreo agresivo o enumeración masiva de URLs `/opengraph-image` inexistentes consume CPU de renderizado de fuentes/PNG en el servidor Node.js.
- **Solución Óptima Propuesta**:
  Asegurar cabeceras `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000` en respuestas válidas de OpenGraph, retornar `404` inmediato cuando el ID/slug no exista en BD antes de invocar `ImageResponse`, y aplicar rate limiting en Nginx a peticiones masivas sobre `*/opengraph-image*`.

### [SEC-059] `backend/main.py` expone trazas detalladas de excepciones SQL/red por `stdout` pudiendo filtrar credenciales DSN si falla `psycopg2.connect`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/main.py`, `backend/db_helper.py` (líneas 11-54) y `backend/generate_*.py`
- **Diagnóstico del Problema**:
  Múltiples scripts (`main.py`, `categorize_existing_jobs.py`, `generate_blog_post.py`, `mailer.py`) capturan excepciones globales con `print(f"❌ Error: {e}")`. Si un error de red o librería imprime argumentos internos o si un fallo de `requests` (como `?key=` en `[SEC-011]`) o URI incluye credenciales en mensajes de error no redactados, terminan almacenados en `/var/log/*.log` sin filtro. Asimismo, `backend/mailer.py` y otros scripts en ocasiones registran diagnósticos sin garantizar al 100% la invocación de `logic.privacy.mask_email()` en rutas de error antiguas.
- **Riesgo o Impacto**:
  Fuga de emails PII o secretos en archivos de log del sistema (`/var/log/weekly_email.log` o logs de cron), accesibles por usuarios locales o sistemas de monitorización compartidos.
- **Solución Óptima Propuesta**:
  Implementar un `logging.Filter` centralizado que redacte automáticamente patrones `mysql://user:pass@`, `key=...`, `Bearer ...` y direcciones de email no enmascaradas en todos los logs Python, garantizando permisos `0640`/`0600` sobre los archivos `/var/log/*`.

### [SEC-060] `frontend/app/api/checkout/newsletter/route.ts` y `checkout/premium-candidate` verifican `isValidApiOrigin` sin validar tokens CSRF vinculados a sesión ni anti-bot Turnstile

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/checkout/premium-candidate/route.ts` y `frontend/app/api/checkout/report/route.ts`
- **Diagnóstico del Problema**:
  Los cuatro endpoints públicos `POST /api/checkout*` delegan la protección exclusivamente en `isValidApiOrigin(request, BASE_URL)` + `checkoutLimiter` por IP sin verificar ningún token Cloudflare Turnstile (a diferencia de `/api/subscribe` o `actions.ts`) antes de llamar a la API externa de Stripe `stripe.checkout.sessions.create()`.
- **Riesgo o Impacto**:
  Bots distribuidos por múltiples IPs residenciales (enviando cabecera `Origin: https://portalempleoit.com`) pueden crear miles de sesiones de Stripe Checkout y borradores en `sponsored_jobs` / `newsletter_sponsors` / `jobs`, disparando límites de API en la cuenta Stripe y ensuciando las tablas comerciales con filas `pendiente`.
- **Solución Óptima Propuesta**:
  Integrar verificación obligatoria de `verifyTurnstileToken` en todos los endpoints de creación de Checkout antes de escribir borradores en BD o invocar `stripe.checkout.sessions.create()`, y añadir limpieza automática periódica para `sponsored_jobs` y `newsletter_sponsors` abandonados tras 48 horas.

### [SEC-061] `backend/send_push_notifications.py` depende de `ONESIGNAL_REST_API_KEY` sin validación de longitud/estado de respuesta detallada ni circuit breaker

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `backend/send_push_notifications.py` (líneas 35-155)
- **Diagnóstico del Problema**:
  El script realiza envíos push masivos a segmentos de OneSignal vía `requests.post` (`timeout=15`) pero no implementa mecanismo de deduplicación/lock en BD (a diferencia de un registro `push_campaign_log` con fecha/hash) para impedir enviar dos notificaciones push seguidas si `run_all.py` se re-ejecuta manualmente el mismo día tras fallar un paso posterior.
- **Riesgo o Impacto**:
  Spameo duplicado de notificaciones push en navegador a todos los suscriptores si un operador vuelve a lanzar `run_all.py` después de un error en pasos finales, disparando tasas de bloqueo y revocación de permisos en navegadores.
- **Solución Óptima Propuesta**:
  Registrar un lock idempotente por fecha/lote en MySQL antes de invocar la API de OneSignal y validar códigos de error de OneSignal para alertar por canal de administración si la clave fue revocada.

### [SEC-062] `frontend/lib/stripe.ts` / endpoints de checkout pueden operar con errores no capturados de configuración si falta `STRIPE_WEBHOOK_SECRET` o `STRIPE_SECRET_KEY` en runtime

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/webhooks/stripe/route.ts` y `frontend/app/api/checkout/*`
- **Diagnóstico del Problema**:
  Si el servidor Next.js arranca sin `STRIPE_WEBHOOK_SECRET` o con una clave de test (`sk_test_...`) en un entorno marcado como producción, las peticiones a checkout pueden generar errores 500 tardíos durante la interacción del comprador o webhooks entrantes pueden rechazarse en masa durante un despliegue mal configurado, al carecer de comprobación temprana cruzada entre `NODE_ENV`, `BASE_URL` y el prefijo de claves `sk_live_` / `pk_live_`.
- **Riesgo o Impacto**:
  Caídas silenciosas de monetización tras un despliegue o mezcla accidental de sesiones de prueba con ofertas reales publicadas.
- **Solución Óptima Propuesta**:
  Implementar una validación startup/healthcheck que verifique presencia y coherencia de entorno entre `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `NEXT_PUBLIC_SITE_URL`, reportando estado `degraded` en un endpoint interno monitorizado.

### [SEC-063] `frontend/middleware.ts` asigna un `nonce` distinto por petición SSR en `headers`, pero los componentes cliente no protegen inyecciones basadas en `dangerouslySetInnerHTML` en renderizado Markdown

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/markdown.tsx` (referenciado en `frontend/app/noticias/[slug]/page.tsx:10`) y rutas editoriales/ofertas
- **Diagnóstico del Problema**:
  El portal renderiza artículos generados por IA o introducidos en `blog_posts` mediante `@/lib/markdown` y descripciones de ofertas de empleo mediante componentes React. Mientras que el `nonce` de CSP limita ejecución de scripts en línea externos si la cabecera única de `middleware.ts` prevaleciera, la presencia simultánea de la cabecera CSP de `next.config.ts:55` con `'unsafe-inline' 'unsafe-eval'` abre una ventana crítica si algún componente o artículo en `blog_posts` llegase a inyectar HTML crudo no saneado (por ejemplo enlace `javascript:` o SVG inline).
- **Riesgo o Impacto**:
  En navegadores que evalúan múltiples políticas CSP o en rutas donde aplique la cabecera de `next.config.ts`, un payload XSS almacenado en `blog_posts` o en datos de terceros podría ejecutarse o robar tokens accesibles / manipular UI de checkout.
- **Solución Óptima Propuesta**:
  Auditar y blindar el parser `Markdown` con `rehype-sanitize` / esquema estricto de URLs (`http:` / `https:` únicamente), eliminar `'unsafe-inline' 'unsafe-eval'` retirando la CSP de `next.config.ts` (`[SEC-002]`), y verificar todas las llamadas `dangerouslySetInnerHTML` en el código cliente.

### [SEC-064] Falta bloqueo de concurrencia distribuida (`flock` o mutex en MySQL) en cron jobs de `run_all.py` y `deactivate_expired_jobs.py`

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/run_all.py` (líneas 1-227), `backend/deactivate_expired_jobs.py` y `scripts/send_weekly_email.sh` (líneas 1-23)
- **Diagnóstico del Problema**:
  Ninguno de los scripts cron (`run_all.py`, `send_weekly_email.sh`, `deactivate_expired_jobs.py`, `backup_mysql.sh`) adquiere un bloqueo exclusivo del sistema (`flock` sobre `/var/lock/...` ni `GET_LOCK(...)` en MySQL). Si una ejecución previa supera el intervalo del cron (por lentitud de scrapers, SMTP o Gemini), una segunda instancia arranca en paralelo sobre las mismas filas.
- **Riesgo o Impacto**:
  Condiciones de carrera graves: doble envío masivo de la newsletter semanal (`mailer.py`) o alertas instantáneas, inserción de ofertas duplicadas antes de que la primera ejecución haga commit, y contienda de E/S en backups simultáneos.
- **Solución Óptima Propuesta**:
  Envolver todas las tareas programadas mediante `flock -n /var/lock/<job>.lock` en los wrappers cron e incorporar un lock cooperativo `GET_LOCK('portal_<tarea>', 0)` en Python al inicio de `mailer.py`, `run_all.py` y los `send_*.py`.

### [SEC-065] `frontend/app/robots.ts` publica rutas privadas en `Disallow` facilitando reconocimiento de paneles internos (`/empresa-dashboard`, `/redirect/`)

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Ubicación exacta**: `frontend/app/robots.ts` (líneas 11-18)
- **Diagnóstico del Problema**:
  Aunque es estándar excluir rutas privadas de buscadores, `robots.txt` no ofrece control de acceso ni seguridad real, pero confirma públicamente rutas sensibles como `/empresa-dashboard`, `/redirect/` y `/ref/`. Lo crítico es asegurar que dichas rutas —y especialmente `/admin` (que ni siquiera aparece en `robots.ts:11-35`!)— cuenten con autenticación estricta en servidor y cabecera `X-Robots-Tag: noindex, nofollow`.
- **Riesgo o Impacto**:
  Descubrimiento trivial de endpoints de gestión (`/admin` al faltar en `disallow` de `robots.ts` puede incluso ser rastreado e indexado como página de login administrativa en buscadores) y riesgo si algún endpoint carece de verificación independiente del `robots.txt`.
- **Solución Óptima Propuesta**:
  Añadir `/admin`, `/login`, `/registro` y `/recuperar-password` con `X-Robots-Tag: noindex, nofollow` en `middleware.ts` / metadata `robots: { index: false, follow: false }` en lugar de depender de listar rutas administrativas sensibles en `robots.txt`.
