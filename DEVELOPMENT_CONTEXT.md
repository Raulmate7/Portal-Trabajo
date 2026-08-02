# 📌 Contexto de Desarrollo y Arquitectura - Portal Empleo IT

Este documento sirve como la **fuente única de verdad** para desarrolladores y asistentes de Inteligencia Artificial. Describe exhaustivamente la arquitectura, base de datos, lógica de negocio, automatizaciones y el plan completo de tráfico, SEO y monetización implementado en el portal.

> [!IMPORTANT]
> **Para el Asistente de IA:** Lee este archivo al inicio de cada conversación para obtener el contexto completo del proyecto de forma rápida, precisa y con bajo consumo de tokens.

---

## 🛠️ 1. Stack Tecnológico y Arquitectura Distribuida

> [!IMPORTANT]
> **Arquitectura activa en producción:** El proyecto opera **exclusivamente** bajo una arquitectura **híbrida distribuida** entre Vercel y Raiola Networks. La alternativa de VPS unificado con PM2/Nginx está **obsoleta y no se utiliza**.

El proyecto opera bajo una **arquitectura híbrida distribuida**:
1. El **Frontend (Next.js)** está alojado en **Vercel** → desplegado automáticamente desde la rama `main` de GitHub.
2. La **Base de Datos MySQL** y las tareas de **Backend en Python (Scrapers y Bots)** se ejecutan de forma dedicada en servidores de **Raiola Networks** (administrados vía cPanel/cron).

### Ficha Técnica de Componentes

| Componente | Tecnología | Ubicación / Hosting | Detalles / Configuración |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) | ☁️ **Vercel** | TypeScript, Tailwind CSS v4, React 19, `@next/third-parties/google`. Deploy automático desde `main`. |
| **Backend** | Python 3.10 | 🖥️ **Raiola Networks** | Scrapy, FastAPI, PyMySQL, Cloudscraper, BeautifulSoup4, Pillow (PIL). Administrado vía cPanel. |
| **Base de Datos** | MySQL 5.7+ / 8.0 | 🖥️ **Raiola Networks** | MySQL local en Raiola. Vercel accede a ella mediante proxy HTTP (`db_proxy.php`) al no permitirse conexiones TCP directas al puerto 3306. |
| **Automatización** | GitHub Actions | ☁️ GitHub Nube | Tareas programadas (cron) para scrapers (`run_all.py`) y envíos semanales (`mailer.py`). |
| **Canales Externos** | Telegram, LinkedIn, Mastodon, Pinterest, Threads, YouTube Shorts, Email | Integraciones API | Difusión automatizada de vacantes mediante bots e email SMTP. Twitter/X desactivado por petición del usuario. |

---

## 🌐 2. Puente de Base de Datos: Vercel a Raiola (db_proxy.php)

Debido a que el cortafuegos de Raiola Networks bloquea las conexiones TCP entrantes al puerto de MySQL (`3306`) desde servidores externos (incluyendo las IPs dinámicas de Vercel), la comunicación se realiza a través de un **puente seguro HTTP** denominado `db_proxy.php`, ubicado en el servidor de Raiola.

### Flujo de Comunicación de Datos

```mermaid
graph TD
    subgraph Vercel [Hosting Vercel - Edge Nodes]
        NextJS[Next.js App] -->|Llamada SQL unificada| DBTS[frontend/lib/db.ts]
    end

    subgraph Raiola [Servidor Raiola Networks]
        DBTS -->|HTTPS POST con X-Proxy-Token| Proxy[db_proxy.php]
        Proxy -->|Ejecuta PDO local en localhost| MySQL[(Base de Datos MySQL)]
        MySQL -->|Retorna Filas| Proxy
        Proxy -->|Respuesta JSON segura| DBTS
    end
```

### Mecanismo de Seguridad y Procesamiento
*   **Firma del Token**: Cada consulta enviada desde Vercel debe incluir la cabecera `X-Proxy-Token` con un token seguro. Si el token es ausente o inválido, devuelve un error `403 Forbidden`.
*   **Consultas Preparadas (PDO)**: El script PHP lee un JSON con dos parámetros: `sql` (la cadena SQL de consulta) y `params` (los valores de los marcadores). Esto previene inyecciones SQL usando la preparación nativa de PDO.
*   **Gestión de Respuestas**:
    *   Si la consulta inicia con `SELECT` o `SHOW`, ejecuta `fetchAll()` y devuelve un array JSON con las filas en la clave `rows`.
    *   Para consultas de escritura, devuelve el número de filas afectadas (`affected_rows`).

> [!IMPORTANT]
> **Para scripts Python de migración**: Las llamadas al proxy HTTP desde Python deben incluir un `User-Agent` de navegador (Mozilla) en los headers para evitar que el firewall de cPanel (ModSecurity) devuelva `403 Forbidden`. El endpoint es `https://mail.portalempleoit.com/db_proxy.php`.

---

## 🗄️ 3. Esquema Completo de Base de Datos MySQL

La base de datos MySQL (`ecosier2_PortalEmpleo`) consta de 9 tablas principales con motores InnoDB y codificación de caracteres `utf8mb4_unicode_ci` para soporte total de emojis y caracteres especiales.

```mermaid
erDiagram
    sectors ||--o{ jobs : "sector_id"
    subscribers ||--o{ email_tracking : "email"
    jobs {
        varchar id PK
        int sector_id FK
        timestamp created_at
        boolean is_featured
        boolean is_active
        varchar plan
        timestamp featured_expires_at
        decimal salary_min
        decimal salary_max
        timestamp last_tweeted_at
        timestamp last_linkedin_posted_at
        timestamp last_tooted_at
        timestamp last_instant_alert_sent_at
        timestamp last_pinterest_posted_at
        timestamp last_threads_posted_at
        timestamp last_youtube_posted_at
        int impressions_count
        int clicks_count
        varchar company_email
        varchar title_es
        text description_snippet_es
        text title
        varchar company
        varchar location
        varchar salary
        text description_snippet
        varchar url_source
        varchar salary_currency
        varchar category
    }
    sectors {
        int id PK
        varchar name
        varchar slug
        json keywords
    }
    subscribers {
        varchar id PK
        varchar email
        timestamp created_at
        timestamp last_sent_at
        int onboarding_stage
        timestamp onboarding_last_sent_at
        text tech_keywords
        text location_pref
        varchar frequency
        int streak_days
        timestamp streak_last_visit
        varchar referred_by
        int referrals_notified_count
        boolean is_premium
    }
    alerts {
        varchar id PK
        varchar email
        timestamp created_at
    }
    sponsored_jobs {
        int id PK
        varchar company_name
        varchar company_email
        varchar company_phone
        varchar job_title
        varchar job_location
        varchar job_salary
        text job_description
        varchar job_url
        varchar plan
        varchar status
        timestamp created_at
    }
    email_tracking {
        int id PK
        varchar email
        varchar campaign
        timestamp opened_at
    }
    premium_leads {
        int id PK
        varchar name
        varchar email
        varchar stack
        varchar experience
        varchar linkedin
        timestamp created_at
    }
    newsletter_sponsors {
        int id PK
        varchar company_name
        varchar company_email
        varchar plan
        varchar status
        varchar stripe_session_id
        timestamp created_at
    }
    recruiter_affiliates {
        int id PK
        varchar recruiter_email
        varchar affiliate_code
        varchar referred_company_name
        boolean commission_paid
        timestamp created_at
    }
```

### Campos Relevantes Adicionales en `jobs`
- `plan`: Almacena el plan de la oferta destacada: `'basico'`, `'destacado_basico'`, `'destacado_pro'`, `'destacado_enterprise'`.
- `featured_expires_at`: `TIMESTAMP NULL` — Fecha de expiración del destaque. El webhook de Stripe lo calcula como `NOW() + 15 días` (Básico) o `NOW() + 30 días` (Pro/Enterprise).
- `last_pinterest_posted_at`, `last_threads_posted_at`, `last_youtube_posted_at`: Marcas de tiempo de distribución en nuevos canales sociales.
- `impressions_count`: Contador de vistas de la página de detalle de la oferta (incrementado async en `/job/[id]`).
- `clicks_count`: Contador de clics de aplicación (incrementado async en `/redirect/[id]`).
- `company_email`: Email de la empresa para el Dashboard B2B de reclutadores.

### Campos Relevantes Adicionales en `subscribers`
- `streak_days`: `INT DEFAULT 0` — Días consecutivos de visitas del usuario (sistema de racha gamificado).
- `streak_last_visit`: `TIMESTAMP NULL` — Última visita registrada para el cálculo de la racha.
- `referred_by`: `VARCHAR(255) NULL` — Email o código del usuario que refirió al suscriptor.
- `referrals_notified_count`: `INT DEFAULT 0` — Número de referidos por los que ya se notificó al usuario (evita duplicados).
- `is_premium`: `BOOLEAN DEFAULT FALSE` — Marca de acceso premium para candidatos suscritos a la Bolsa Privada.

### Tabla `newsletter_sponsors`
Registra patrocinios de newsletter directos sin necesidad de publicar oferta.
- `status`: `'pendiente'` (esperando pago) → `'aprobado'` (pago completado via Stripe Webhook).

### Tabla `recruiter_affiliates`
Programa de afiliados B2B para reclutadores. Cada fila representa una conversión referida.
- `affiliate_code`: Código único tipo `RECR-XXXXXX` generado en el registro.
- `referred_company_name`: Empresa que pagó tras llegar por el enlace del afiliado.
- `commission_paid`: `BOOLEAN` — Marca si la comisión del 20% fue abonada al reclutador.

### Índices Físicos en MySQL
Para acelerar los filtros complejos de SEO y la paginación del frontend, se aplican los siguientes índices:
*   `idx_jobs_created_at` en `jobs (created_at DESC)` (Ordenación global por novedades).
*   `idx_jobs_is_featured` en `jobs (is_featured)` (Priorización de ofertas patrocinadas).
*   `idx_jobs_is_active` en `jobs (is_active)` (Exclusión rápida de expiradas).
*   `idx_jobs_category` en `jobs (category)` (Filtros por categoría).
*   `idx_jobs_search` (`FULLTEXT INDEX`) en `jobs (title, company, location)` (Búsquedas dinámicas).

---

## 🐍 4. Shim de Base de Datos en Python (psycopg2.py)

El backend en Python fue desarrollado inicialmente usando PostgreSQL (Supabase). Al migrar a MySQL en Raiola Networks, para evitar tener que reescribir docenas de scripts, se diseñó un **shim local transparente**.

### Funcionamiento del Patch de Importación
Al colocar un archivo llamado `psycopg2.py` en la raíz de la carpeta `backend/`, cuando cualquier script ejecuta `import psycopg2`, el intérprete carga este archivo local en lugar de la librería compilada de Postgres.

El shim intercepta y redirige el flujo de datos:
1.  **Conexión**: `psycopg2.connect()` analiza la URL de conexión (DSN) y traduce los parámetros al dialecto de MySQL mediante `pymysql`.
2.  **Mapeo de Variables de cPanel**: Si la conexión se ejecuta localmente (`localhost`), prioriza las variables individuales del hosting de Raiola (`MYSQL_USER`, `MYSQL_DATABASE`, `MYSQL_PASSWORD`).
3.  **Traducción de Consultas al Vuelo**: El `CursorWrapper` intercepta la consulta SQL antes de enviarla a MySQL y realiza sustituciones:
    *   **Case-Insensitive (`ILIKE` → `LIKE`)**.
    *   **Inserciones Únicas (`ON CONFLICT` → `INSERT IGNORE`)**.
    *   **Filtros de Arrays (`= ANY(%s)` → `IN (%s, ...)`)**.
    *   **Intervalos de Tiempo** (Postgres `INTERVAL '48 hours'` → MySQL `INTERVAL 48 HOUR`).

---

## 🚀 5. Orquestador de Backend (run_all.py)

El script `backend/run_all.py` es el orquestador maestro que ejecuta periódicamente todas las fases de sincronización, ingesta y automatizaciones del portal.

### Pipeline de Ejecución Completo (18+ Fases)

```
run_all.py
 ├─► [0]      Migraciones de Base de Datos (add_referred_by_column.py, add_reactions_table.py,
 │             add_pinterest_threads_columns.py, add_metrics_columns.py,
 │             add_referrals_notified_count.py, add_b2b_monetization_tables.py)
 ├─► [1]      main.py → Scrapers Internacionales (WWR, Remotive, Himalayas, RemoteOK, etc.)
 ├─► [2]      Scrapy (job_spider) → Ingesta de Tecnoempleo (ES)
 ├─► [3]      scraper_infoempleo.py → Ingesta de Stratos (ES)
 ├─► [4]      telegram_bot.py → Publicación multicanal en Telegram
 ├─► [4.1]   telegram_digest.py → Digest diario en Telegram
 ├─► [4.5]   linkedin_bot.py → Tarjeta gráfica + Post en LinkedIn (con imagen JPEG)
 ├─► [4.6]   twitter_bot.py → OMITIDO (desactivado por petición del usuario)
 ├─► [4.7]   mastodon_bot.py → Post de texto en Mastodon (Fediverso)
 ├─► [4.8]   pinterest_bot.py → Pin en Pinterest (API v5 con imágenes Open Graph)
 ├─► [4.9]   threads_bot.py → Publicación en Threads (Meta Graph API)
 ├─► [4.10]  youtube_shorts_bot.py → Short vertical en YouTube (API v3 + ffmpeg + Pillow)
 ├─► [5]      index_new_jobs.py → Envío a Google Indexing API (Últimas 7h)
 ├─► [5.5]   ping_sitemap.py → Notificación de actualización de sitemap a Google
 ├─► [6]      deactivate_expired_jobs.py → Desactiva (>30 días), desindexa, purga (>90 días)
 ├─► [7]      send_custom_alerts.py → Emails diarios/semanales personalizados
 ├─► [7.1]   send_welcome_onboarding.py → Embudo de bienvenida (Email 1 y Email 2)
 ├─► [7.1.1] send_reactivation.py → Reactivación y limpieza de suscriptores inactivos
 ├─► [7.2]   send_instant_featured_alerts.py → Alertas instantáneas por ofertas destacadas
 ├─► [7.3]   send_push_notifications.py → Notificaciones Push web segmentadas (OneSignal)
 ├─► [7.4]   generate_weekly_article.py → Generación de artículo de blog SEO (IA semanal)
 ├─► [7.5]   generate_trends_post.py → Post de tendencias tecnológicas con datos reales de BD
 ├─► [7.6]   send_streak_reminder.py → Recordatorio de racha diaria de usuario (20:00h)
 ├─► [7.7]   send_saved_jobs_reminder.py → Recordatorio de ofertas guardadas (48h)
 └─► [7.8]   send_referral_notifications.py → Notificaciones de progreso de referidos (1/3, 2/3, 3/3)
```

---

## 🔍 6. Scrapers y Procesamiento de Datos del Backend

### Fuentes de Ofertas Activas
1.  **Scrapers de API (`main.py`)**: Remotive, Himalayas, WeWorkRemotely (RSS), RemoteOK, WorkingNomads, JobFluent, Python.org.
2.  **Scrapy Crawler (`job_spider.py`)**: Parsea recursivamente (hasta 5 páginas) el listado de `https://www.tecnoempleo.com`.
3.  **BeautifulSoup Parser (`scraper_infoempleo.py`)**: Parsea el listado HTML de Stratos (`https://www.stratos-ad.com/trabajo`).

### Procesamiento de Lógica Interna
*   **Clasificador de Categorías (`logic/classifier.py`)**: Asigna una de las 6 categorías (`Backend`, `Frontend`, `Data & AI`, `Cloud & DevOps`, `Mobile`, `Otros`) usando un sistema de puntuación con expresiones regulares sobre el título (ponderación x3) y descripción.
*   **Traducción Inteligente (`logic/translator.py`)**: Usa `deep-translator` (Google Translate) para traducir ofertas internacionales. Protege tecnologías clave (React, AWS, Docker, etc.) mediante tokens previos a la traducción.
*   **Parser de Salarios (`logic/salary_parser.py`)**: Extrae salarios mín/máx normalizados, detecta la moneda y convierte salarios mensuales a anuales (× 12). Descarta valores atípicos.
*   **Control de Duplicados**: Por `url_source` (duplicados físicos) y por título+empresa en las últimas 48h (duplicados semánticos).

---

## 📢 7. Bots de Difusión en Redes Sociales

### Canales de Difusión Activos
1.  **Telegram (`telegram_bot.py`)**: Publica a `@PortalDeTrabajo` y a canales segmentados por categoría (`TELEGRAM_CHANNEL_FRONTEND`, `TELEGRAM_CHANNEL_BACKEND`, `TELEGRAM_CHANNEL_DATA_AI`, `TELEGRAM_CHANNEL_CLOUD_DEVOPS`, `TELEGRAM_CHANNEL_MOBILE`, `TELEGRAM_CHANNEL_REMOTO`).
2.  **LinkedIn (`linkedin_bot.py`)**: Publica hasta 2 ofertas por ejecución. Genera una tarjeta gráfica JPEG (1200×630px) con **Pillow** y la sube mediante el flujo de `registerUpload` de la API de UGC Posts de LinkedIn. Si no hay ofertas nuevas, publica un artículo del blog de forma aleatoria.
3.  **Mastodon (`mastodon_bot.py`)**: Toot de texto directo a la instancia configurada.
4.  **Pinterest (`pinterest_bot.py`)**: Publica Pines usando la API v5 de Pinterest. Usa las URLs de Open Graph image (`/job/[id]/opengraph-image`) generadas por Next.js como media source. Actualiza `last_pinterest_posted_at` en la BD.
5.  **Threads (`threads_bot.py`)**: Publica en Threads (Meta) vía API Graph oficial. Flujo en dos fases: creación del contenedor + publicación. Fallback a solo texto si la imagen falla. Actualiza `last_threads_posted_at`.
6.  **YouTube Shorts (`youtube_shorts_bot.py`)**: Genera clips verticales (1080×1920px) con Pillow + ffmpeg y los sube mediante la API v3 de YouTube (OAuth 2.0). Actualiza `last_youtube_posted_at`. Se auto-cancela sin ffmpeg.
7.  **Twitter/X**: Código existente pero **desactivado** en `run_all.py` por petición del usuario.
8.  **Fallback de contenido**: Si no hay vacantes nuevas que difundir, los bots seleccionan un artículo del blog para publicar y mantener los algoritmos de las plataformas activos.

### Generador de Tarjetas Gráficas (`logic/image_generator.py`)
Genera imágenes de 1200×630px con Pillow:
- Fondo degradado oscuro (azul cobalto a morado) con resplandor índigo semitransparente.
- Título adaptado en hasta 3 líneas automáticas.
- Datos del puesto (empresa, ubicación, salario).
- Botón CTA redondeado con la URL del portal.

---

## 📧 8. Correo Electrónico: Alertas, Onboarding y Newsletter

### 1. Onboarding de Nuevos Suscriptores (`send_welcome_onboarding.py`)
Flujo automático de 2 etapas:
*   **Email 1 (inmediato)**: Bienvenida con hasta 3 ofertas personalizadas según keywords de interés.
*   **Email 2 (a los 4 días)**: Recursos recomendados, calculadora de salarios y plantillas de CV.

### 2. Alertas Diarias/Semanales Personalizadas (`send_custom_alerts.py`)
Cruza `tech_keywords` y `location_pref` del suscriptor contra las vacantes indexadas en las últimas 24h (daily) o 7 días (weekly) y envía hasta 8 ofertas coincidentes.

### 3. Alertas Destacadas Instantáneas (`send_instant_featured_alerts.py`)
Cuando se publica una oferta con `is_featured = TRUE` y `last_instant_alert_sent_at IS NULL`, busca suscriptores cuyas keywords coincidan y les envía una alerta urgente.

### 4. Newsletter Resumen Semanal (`mailer.py`)
*   Se ejecuta todos los lunes.
*   **Estructura del email**:
    1.  *Bloque Sponsor*: Si hay empresas activas con plan Pro o Enterprise, inyecta automáticamente un bloque "⭐ Patrocinador de la Semana" al inicio.
    2.  *Bloque Personalizado*: Hasta 3 ofertas específicas para el usuario según sus keywords.
    3.  *Bloques Generales*: Listado por tecnologías (Backend, Frontend, Data & AI, Cloud, Mobile). Máximo 6 por categoría.
    4.  *Afiliados en Newsletter*: Links de cursos de Udemy/Coursera adaptados a las tecnologías de interés del suscriptor, con UTM trackers dinámicos.
    5.  *Pixel de Tracking*: Imagen `1×1` invisible para registrar aperturas en la tabla `email_tracking`.

### 5. Recordatorio de Racha (`send_streak_reminder.py`)
Envía a las 20:00h una notificación push y/o email a usuarios con racha activa que no han visitado el portal ese día.

### 6. Recordatorio de Ofertas Guardadas (`send_saved_jobs_reminder.py`)
A las 48 horas de que un usuario guarda una oferta, envía un recordatorio si la oferta sigue activa.

### 7. Reactivación de Inactivos (`send_reactivation.py`)
Identifica suscriptores que no han abierto emails en 60+ días y les envía un correo de reactivación. Si no abren en 7 días más, se marcan como inactivos o se eliminan de la lista.

### 8. Notificaciones de Referidos (`send_referral_notifications.py`)
Calcula el número real de referidos de cada usuario y envía notificaciones de progreso (1/3, 2/3 referidos) o felicitación al alcanzar el hito (3/3). Usa `referrals_notified_count` en `subscribers` para evitar duplicados.

---

## 🌐 9. Frontend de Next.js: SEO Programático, UX y Estructura

El frontend está desarrollado bajo Next.js 15 y el App Router, altamente optimizado para posicionamiento orgánico, velocidad de carga y experiencia de usuario.

### 9.1 Lógica de Enrutamiento y SEO Programático (`/trabajos/[sector]`)
La ruta `/trabajos/[sector]/page.tsx` es el motor de indexación masivo del portal.
*   **Parser de Parámetros (`parseSector`)**: Descompone dinámicamente un slug compuesto en variables de búsqueda:
    *   *Modalidad*: `-hibrido` → teletrabajo parcial.
    *   *Ubicación*: `-en-[ciudad]` → ciudad; `-remoto` → remoto.
    *   *Experiencia*: `-junior`, `-senior`, `-sin-experiencia`.
    *   *Salario*: `-salario-30k-45k` → rango salarial.
    *   *Tipo de contrato*: `-autonomo`, `-practicas`, `-media-jornada`.
    *   *Tecnología/Categoría*: Lo restante se mapea a palabras clave tecnológicas o categorías.
*   **Estructura de Títulos SEO**: Emoji `🔥` ubicado al final del `<title>` para evitar truncamiento por parte del algoritmo de Google.
*   **Estrategia de Fallback (`getFallbackJobs`)**: Si la búsqueda devuelve 0 resultados, aplica cascada: 1) misma tecnología en remoto, 2) misma tecnología a nivel nacional, 3) sector IT general.
*   **FAQ Schema**: Inyecta `FAQPage` JSON-LD dinámico en la parte inferior con datos reales de salarios y volumen de ofertas.
*   **JobPosting Schemas embebidos**: Inyecta microdatos `JobPosting` completos en `ItemList` para las 5 primeras ofertas del listado.
*   **Prefetching Selectivo**: Carga inmediata (`prefetch={true}`) para las 5 primeras ofertas y destacadas; prefetch al hover para el resto de la lista.
*   **Hreflang con subdirectorios**: Las etiquetas `alternates.languages` apuntan a `/en/trabajos/[sector]` (no `?lang=en`) para una indexación internacional limpia.

### 9.2 Sitemaps Dinámicos Segmentados (`app/sitemap.ts` y `/sitemap-news.xml`)
Dividido en 5 sitemaps dinámicos optimizados para ahorrar Crawl Budget:
*   **Optimizador de Crawl Budget**: Las páginas estáticas utilizan una fecha fija constante (`SITE_LAST_STRUCTURAL_UPDATE = '2026-07-01'`) en lugar de `new Date()`, impidiendo re-rastreos innecesarios de Googlebot.
*   **Sitemap 0**: Páginas estáticas (incluye `/precios`, `/publicidad`, `/informe-mercado-it`, `/afiliados-empresa`, `/empresa-dashboard`, `/entrevistas/*`, `/newsletter`), artículos de blog, combinaciones SEO activas calculadas dinámicamente sobre las últimas 8.000 ofertas.
*   **Sitemaps 1 & 2**: Ofertas de empleo indexables (1-8.000 y 8.001-16.000).
*   **Sitemap 3**: Directorio de empresas extraído dinámicamente de la BD.
*   **Sitemap Google News (`sitemap-news.xml`)**: Ruta `/sitemap-news.xml/route.ts` que indexa automáticamente los artículos de blog y publicaciones de las últimas 48 horas (con fallback a las 3 más recientes) para el canal de Google News.

### 9.3 Páginas SEO Especiales Implementadas

| Ruta | Archivo | Descripción |
| :--- | :--- | :--- |
| `/empresas/[slug]` | `app/empresas/[slug]/page.tsx` | Perfil de empresa con listado de vacantes, salario medio local, cuota de teletrabajo y reviews de empleados. Schema JSON-LD: `Organization`, `ItemList`, `JobPosting`. |
| `/empresas/[slug]/[categoria]` | `app/empresas/[slug]/[categoria]/page.tsx` | Subcategoría de empresa por departamento/tecnología (SSG con `generateStaticParams`). |
| `/trabajos/[sector]/empresas` | `app/trabajos/[sector]/empresas/page.tsx` | Ranking de empresas contratantes por stack tecnológico. |
| `/trabajo-[ciudad]` | Rutas individuales → `CityLandingPage.tsx` | Landing editorial por ciudad (Madrid, Barcelona, Valencia, Sevilla, Bilbao, Zaragoza, Málaga). |
| `/trabajo-remoto-[pais]` | `app/trabajo-remoto-{usa,uk,alemania,europa}/page.tsx` | Landings premium de teletrabajo internacional. Reutilizan `RemoteCountryLandingPage.tsx`. |
| `/glosario/[term]` | `app/glosario/[term]/page.tsx` | Definición técnica del término, Schema `DefinedTerm`, salario promedio y 5 vacantes activas relacionadas. |
| `/salarios` | `app/salarios/page.tsx` | Calculadora interactiva de salarios IT con comparativa "cobras vs. mercado" y Schemas `Dataset` y `WebApplication`. |
| `/salarios/[tecnologia]/[ciudad]/[nivel]` | Rutas SSG | Páginas de salario individual SSG (240+ combinaciones) con datos en tiempo real. |
| `/comparar/[slug]` | `app/comparar/[slug]/page.tsx` | Comparativas salariales ampliadas (Rust, Scala, Elixir, Terraform, Docker...). |
| `/empleo-del-dia` | `app/empleo-del-dia/page.tsx` | Landing compartible de la oferta más destacada del día con metadatos OG optimizados. |
| `/talento-premium` | `app/talento-premium/page.tsx` | Pool de candidatos premium para empresas y reclutadores con CTA de registro y CTA B2B. |
| `/publicidad` | `app/publicidad/page.tsx` | Media Kit corporativo con formulario de checkout Stripe para patrocinio de newsletter (49€). |
| `/precios` | `app/precios/page.tsx` | Página pública de precios con los 4 planes de publicación de ofertas + sección Candidato Premium. |
| `/newsletter` | `app/newsletter/page.tsx` | Landing SEO optimizada de captación de suscriptores con propuesta de valor y prueba social. |
| `/entrevistas/[tech]` | `app/entrevistas/[tech]/page.tsx` | Banco de preguntas de entrevista por tecnología con FAQPage + Article schema. |
| `/recursos/guia-entrevistas` | `app/recursos/guia-entrevistas/page.tsx` | Guía de preparación de entrevistas con schema `HowTo`. |
| `/recursos/plantillas-cv` | `app/recursos/plantillas-cv/page.tsx` | Guía de creación de CV técnico con schema `HowTo`. |
| `/tendencias` | `app/tendencias/page.tsx` | Dashboard interactivo de tendencias del mercado IT con datos reales de la BD. |
| `/empresa-dashboard` | `app/empresa-dashboard/page.tsx` | Panel B2B para reclutadores: impresiones, clics, CTR e historial de ofertas (login passwordless). |
| `/mejores-ofertas-semana` | `app/mejores-ofertas-semana/page.tsx` | Vacantes destacadas o >45k€ publicadas en los últimos 7 días. |
| `/ofertas-hoy` | `app/ofertas-hoy/page.tsx` | Vacantes indexadas en las últimas 24 horas. |
| `/informe-mercado-it` | `app/informe-mercado-it/page.tsx` | Landing de descarga de informe de mercado: lead magnet gratuito + versiones de pago. |
| `/afiliados-empresa` | `app/afiliados-empresa/page.tsx` | Programa de afiliados para reclutadores: registro, código `RECR-XXXXXX` y enlace compartible. |
| `/redirect/[id]` | `app/redirect/[id]/page.tsx` | Página de redirección intermedia con contador regresivo y banner publicitario AdSense. |
| `/en/trabajos/[sector]` | `app/en/trabajos/[sector]/page.tsx` | Ruta en inglés limpia (subdirectorio `/en/`) para indexación internacional sin parámetro query. |
| `/not-found` | `app/not-found.tsx` | Página 404 optimizada con retención de leads, buscador integrado y JSON-LD `WebPage`. |

### 9.4 Hreflang y Soporte Bilingüe
Todas las rutas programáticas principales inyectan los encabezados `alternates: { languages: { 'es-ES': ..., 'en': ..., 'x-default': ... } }`. Las rutas en inglés apuntan al subdirectorio `/en/trabajos/[sector]` (en lugar de `?lang=en`), cumpliendo las directrices de Google para indexación SEO internacional sin duplicación de contenido.

### 9.5 Schemas de Datos Estructurados (JSON-LD)
El portal inyecta múltiples schemas de datos estructurados para maximizar los rich snippets en Google:

| Schema | Dónde se inyecta |
| :--- | :--- |
| `JobPosting` + `speakable` | `/job/[id]` |
| `JobPosting` (ItemList primeros 5) | `/trabajos/[sector]` |
| `FAQPage` | `/job/[id]`, `/entrevistas/[tech]`, `/trabajos/[sector]`, `/faq` |
| `Article` + `NewsArticle` | `/blog/[slug]`, `/entrevistas/[tech]` |
| `VideoObject` (condicional) | `/job/[id]` si `last_youtube_posted_at IS NOT NULL` |
| `Organization` (con redes E-E-A-T) | `/` (Home), `/empresas/[slug]` |
| `BreadcrumbList` | Todas las páginas con Breadcrumbs |
| `Dataset` + `WebApplication` | `/salarios` |
| `HowTo` | `/recursos/guia-entrevistas`, `/recursos/plantillas-cv` |
| `WebPage` | `/not-found` (`/404`) |
| `DefinedTerm` | `/glosario/[term]` |

### 9.6 Componentes Frontend Clave

| Componente | Descripción |
| :--- | :--- |
| `JobCard.tsx` | Tarjeta principal de oferta. Construye automáticamente bandas salariales formateadas (ej. "30k - 40k €/año") desde `salary_min` y `salary_max` si la cadena libre es "Consultar". |
| `FeaturedJobCard.tsx` | Tarjeta de oferta destacada premium con lógica de bandas salariales normalizadas. |
| `LoadMoreJobs.tsx` | Componente client-side para scroll infinito y paginación rápida con skeleton loader y formato salarial adaptativo. |
| `AdBanner.tsx` | Anuncios AdSense configurable por variante (`inline`, `sidebar`, `multiplex`). Alturas mínimas fijas estáticas via `style={{ minHeight: '250px' }}` para prevención CLS total. Ad Refresh cada 30s en páginas de alta permanencia. |
| `StickyDesktopAd.tsx` | Banner publicitario sticky flotante en margen derecho, solo visible en `xl+`. Aparece con 2s de retraso y es cerrable. |
| `RedirectClient.tsx` | Contador regresivo (4s) antes de redirigir al candidato a la oferta externa. Incluye AdBanner monetizado. |
| `CourseAffiliate.tsx` | Bloque de afiliados contextual. Usa el diccionario `TECH_COURSE_MAP` para mostrar cursos de Coursera/LinkedIn Learning/Domestika/Platzi específicos al stack de la oferta actual. |
| `RemoteCountryLandingPage.tsx` | Componente genérico reutilizable para landings de teletrabajo internacional. |
| `CompanyLogo.tsx` | Logo de empresa optimizado sin `unoptimized`, delegando el caching y la optimización al Edge CDN de Vercel. |
| `UserStreak.tsx` | Panel gamificado de racha diaria con hitos de 3, 7 y 30 días. Importado con `next/dynamic` + `ssr: false` y skeleton de ancho `w-20` en `Header.tsx` para eliminar el CLS del menú superior. |
| `Footer.tsx` | Pie de página dinámico programático: calcula las 15 combinaciones tecnología-ciudad más frecuentes de las últimas 150 ofertas reales en BD. |
| `PushSubscribe.tsx` | Widget de suscripción a notificaciones push (OneSignal). |
| `SaveJobButton.tsx` | Guardado de ofertas de empleo en el perfil del usuario. |
| `ReactionButton.tsx` | Botones de reacción (👍/👎) por oferta. |
| `SubscribeForm.tsx` | Formulario de suscripción a la newsletter con keywords de interés y preferencia de ciudad. |
| `RecentlyViewedTracker.tsx` | Tracker invisible que registra las últimas ofertas vistas por el usuario en localStorage. |
| `Breadcrumbs.tsx` | Breadcrumbs accesibles con Schema JSON-LD de `BreadcrumbList`. |
| `SalariosCalculator.tsx` | Calculadora de salarios con comparativa interactiva "cobras vs. media del mercado" y termómetro visual. |

### 9.7 Optimización UX, Esqueletos y Prevención CLS
*   **Esqueletos de Carga Generales (`loading.tsx`)**: Implementación de pantallas de carga animadas en `/app/loading.tsx`, `/app/trabajos/[sector]/loading.tsx`, `/app/job/[id]/loading.tsx`, `/app/blog/loading.tsx` y `/app/glosario/loading.tsx` para eliminar el parpadeo en blanco y mejorar métricas FCP/LCP.
*   **Límites de Error (`error.tsx`)**: Error Boundaries de recuperación en la raíz (`/app/error.tsx`), por sector (`/app/trabajos/[sector]/error.tsx`) y por detalle de puesto (`/app/job/[id]/error.tsx`).
*   **Normalización de Tipografía**: Removidas fuentes Geist no instaladas y declaraciones de Arial en `globals.css`, imponiendo Google Font `Inter` a nivel global.
*   **Caché CDN de Imágenes OG**: Inyectado `export const revalidate = 86400;` en los 6 generadores dinámicos de imágenes OpenGraph (`opengraph-image.tsx`) para cachear las portadas durante 24h en el Edge CDN de Vercel.

---

## 📊 10. Plan de Tráfico y Monetización — Estado de Implementación

Todas las categorías del plan han sido **completamente implementadas** y verificadas con compilación de Next.js exitosa.

### Categoría A — SEO Programático Avanzado ✅ COMPLETO

- **A1**: Páginas SSG individuales de salarios: `/salarios/[tecnologia]/[ciudad]/[nivel]` (240+ combinaciones generadas con `generateStaticParams`).
- **A2**: Páginas de empresa + categoría: `/empresas/[slug]/[categoria]` con métricas dinámicas por departamento.
- **A3**: Listados de empresas por tecnología/sector: `/trabajos/[sector]/empresas` con ranking por número de ofertas.
- **A4**: Landings de trabajo remoto internacional: `/trabajo-remoto-usa`, `/trabajo-remoto-uk`, `/trabajo-remoto-alemania`, `/trabajo-remoto-europa`.
- **A5**: Landing "Mejores Ofertas de la Semana" (`/mejores-ofertas-semana`) y "Ofertas de Hoy" (`/ofertas-hoy`).
- **A6**: Comparativas salariales ampliadas a Rust, Scala, Elixir, Terraform, Docker, Haskell, COBOL.
- **A7**: Sitemap segmentado en 5 ficheros con todas las rutas nuevas registradas y revalidación ISR cada 2h.

### Categoría B — Monetización y Optimización de AdSense ✅ COMPLETO

- **B1**: `StickyDesktopAd.tsx` — Banner lateral flotante en `/job/[id]` y `/trabajos/[sector]`.
- **B2**: Ad Refresh activado (`enableRefresh={true}`) en sidebar de listado de sector cada 30s.
- **B3-B6**: Bloques Multiplex, inline y sidebar en blog, glosario, entrevistas y recursos (verificados).
- **B7**: Página de redirección intermedia `/redirect/[id]` con anuncio y contador de 4s antes de redirigir. `ApplyButton` usa `jobId` para redirigir a `/redirect/${jobId}`.

### Categoría C — Contenido Editorial y Blog ✅ COMPLETO

- **C1**: Pillar Pages + cluster content: `blog-clusters.ts` con bloque de artículos relacionados en `/blog/[slug]`.
- **C2**: Dashboard de tendencias `/tendencias` con datos reales de la BD.
- **C3**: Landing SEO de newsletter `/newsletter` con propuesta de valor y formulario de suscripción.
- **C4**: Preguntas de entrevista `/entrevistas/[tech]` con FAQPage + Article schema y banco de 7 tecnologías × 3 niveles.
- **C5**: Calculadora de salarios mejorada en `SalariosCalculator.tsx` con comparativa "cobras vs. mercado" y termómetro visual.

### Categoría D — Distribución Social ✅ COMPLETO (Twitter/X excluido)

- **D1**: `pinterest_bot.py` — Pines en Pinterest vía API v5 con imágenes Open Graph de Next.js.
- **D2**: `youtube_shorts_bot.py` — Shorts verticales (1080×1920px) con Pillow + ffmpeg y upload vía API v3 de YouTube.
- **D3**: Twitter/X — **OMITIDO** por petición explícita del usuario.
- **D4**: `threads_bot.py` — Publicación en Threads (Meta) vía Graph API con fallback a solo texto.
- Todos integrados en `run_all.py` en los pasos 4.8, 4.9 y 4.10.

### Categoría E — Retención, Engagement y Señales SEO ✅ COMPLETO

- **E1**: `send_referral_notifications.py` — Notificaciones de progreso de referidos (1/3, 2/3, 3/3) con deduplicación por `referrals_notified_count`.
- **E2**: `/empresa-dashboard` — Panel B2B passwordless para reclutadores con impresiones, clics y CTR en tiempo real.
- **E3**: Bloque "Lectura Recomendada" mejorado en `/job/[id]`: tarjeta premium con imagen Open Graph del blog, extracto y CTA.
- **E4**: Feed RSS `/feed.xml` enriquecido con anuncios contextuales de texto al final de cada oferta (Calculadora de Salarios, Udemy, Newsletter).

### Categoría F — Core Web Vitals y PageSpeed ✅ COMPLETO

- **F1**: Lazy Loading de `UserStreak` en `Header.tsx` con `next/dynamic` + `ssr: false` y skeleton `w-20` (CLS = 0).
- **F2**: Eliminación de CLS en AdBanner: `style={{ minHeight: '250px' }}` (sidebar) y `style={{ minHeight: '90px' }}` (inline) en todos los variantes.
- **F3**: Precarga del recurso de marca: `<link rel="preload" href="/og-image.png" as="image" />` en `layout.tsx`.

### Categoría G — Monetización B2B Directa ✅ COMPLETO

- **G1**: Plan "Newsletter Sólo" — Checkout Stripe a 49€ en `/publicidad`. Ruta `/api/checkout/newsletter/route.ts`. Webhook activa `status='aprobado'` en tabla `newsletter_sponsors`.
- **G2**: "Bolsa de Trabajo Privada" — Suscripción a 4.99€/mes en `/precios`. Ruta `/api/checkout/premium-candidate/route.ts` en modo `subscription`. Webhook activa `is_premium=TRUE` en `subscribers`.
- **G3**: "Informes de Mercado" — Landing `/informe-mercado-it` con lead magnet gratuito (suscripción newsletter) y checkout Stripe para informe Completo (9.99€) o Empresa (49€) en `/api/checkout/report/route.ts`.
- **G4**: "Programa de Afiliados B2B" — Landing `/afiliados-empresa` + Server Action `registerRecruiterAffiliate`. Código `RECR-XXXXXX`. `PublishForm.tsx` captura `?ref=CODE` y lo envía como `affiliate_code` en el checkout. El webhook registra la comisión al confirmarse el pago de la oferta.

### Categoría H — SEO Internacional y Técnico ✅ COMPLETO

- **H1**: Subdirectorio `/en/trabajos/[sector]` — Ruta física Next.js que hereda `SectorPage` forzando `lang='en'`. Los hreflang en `/trabajos/[sector]` apuntan a `/en/trabajos/${sectorSlug}` en lugar de `?lang=en`.
- **H2**: `robots.ts` — `Google-Extended` no bloqueado (permite AI Overviews de Google). Bots de IA de terceros bloqueados. Schema `SpeakableSpecification` en `/job/[id]` para búsquedas por voz.
- **H3**: Schema `VideoObject` condicional en `/job/[id]` — Se inyecta JSON-LD de `VideoObject` si `job.last_youtube_posted_at` no es nulo, generando rich snippets de vídeo en Google.

---

## 💳 11. Monetización: Stripe, Planes B2B y AdSense

### Estructura de Precios B2B (Precios de Impulso de Lanzamiento)

> [!IMPORTANT]
> Los precios fueron reducidos considerablemente para incentivar la adquisición de primeras empresas anunciantes. Los importes en Stripe están codificados en **centavos de EUR**.

| Plan | Duración | Precio | `unitAmount` Stripe | Beneficios |
| :--- | :--- | :--- | :--- | :--- |
| **Básico** | ∞ | Gratis | N/A | Listado estándar 30 días, sin destaque |
| **Destacado Básico** | 15 días | **9 €** | `900` | Fijada en cabecera + diseño premium + badge dorado |
| **Destacado Pro** | 30 días | **19 €** | `1900` | Todo lo anterior + Inclusión en newsletter semanal + Push alert |
| **Enterprise** | 30 días | **49 €** | `4900` | Todo lo anterior + Newsletter exclusiva + Difusión en Telegram, LinkedIn, Mastodon |

### Nuevos Productos de Monetización (Categoría G)

| Producto | Precio | Ruta de Checkout | Descripción |
| :--- | :--- | :--- | :--- |
| **Newsletter Sólo** | **49€/envío** | `/api/checkout/newsletter` | Bloque editorial exclusivo en el boletín semanal sin publicar oferta. |
| **Candidato Premium** | **4.99€/mes** | `/api/checkout/premium-candidate` | Suscripción recurrente para acceso a la Bolsa de Trabajo Privada. |
| **Informe IT Completo** | **9.99€** | `/api/checkout/report?type=completo` | Descarga del informe completo de mercado IT. |
| **Informe IT Empresa** | **49€** | `/api/checkout/report?type=empresa` | Informe con datos de empresa y asesoría personalizada. |

### Embudo de Publicación Destacada (Stripe)
*   **Creación del Checkout (`/api/checkout/route.ts`)**: El frontend envía los datos y el plan elegido a esta API. La oferta se guarda en la BD con `is_active = FALSE` e `is_featured = FALSE`. Se crea una sesión de pago en Stripe con el importe correspondiente y el UUID de la oferta en `metadata: { jobId: ..., plan: ..., affiliate_code: ... }`.
*   **Webhook de Confirmación (`/api/webhooks/stripe/route.ts`)**: Al completarse el pago, Stripe llama al webhook. El script verifica la firma, recupera el `jobId` y el `plan`, calcula `featured_expires_at` (15 o 30 días) y activa la oferta. Si `affiliate_code` está presente en la metadata, registra la conversión de afiliado en `recruiter_affiliates`.
*   **Tipos de eventos procesados**:
    - `type === 'newsletter_sponsor'` → Activa el patrocinio en `newsletter_sponsors`.
    - `type === 'premium_candidate'` → Activa `is_premium=TRUE` en `subscribers`.
    - Sin `type` → Es una oferta de trabajo destacada estándar.

### AdSense
*   Cargado de forma asíncrona con `@next/third-parties/google`.
*   Componente `AdBanner.tsx` configurable por variante (`inline`, `sidebar`, `multiplex`).
*   Slot IDs leídos de variables de entorno (`NEXT_PUBLIC_ADSENSE_SLOT_INLINE`, `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR`, `NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX`).
*   `StickyDesktopAd` para sidebar derecho fijo en páginas de alta permanencia.
*   `RedirectClient` para impresión publicitaria garantizada en el flujo de candidatura.

---

## ⚙️ 12. Variables de Entorno, Configuración y Despliegues

### Variables del Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/bd   # Leída por el shim
MYSQL_USER=usuario_mysql                                       # Alternativa para cPanel
MYSQL_PASSWORD=contraseña_mysql
MYSQL_DATABASE=nombre_bd
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASSWORD=contraseña-aplicacion-gmail
TELEGRAM_TOKEN=token-de-telegram
TELEGRAM_CHANNEL=@PortalDeTrabajo
TELEGRAM_ADMIN_ID=id-chat-admin
TELEGRAM_CHANNEL_FRONTEND=id-canal-frontend
TELEGRAM_CHANNEL_BACKEND=id-canal-backend
TELEGRAM_CHANNEL_DATA_AI=id-canal-data
TELEGRAM_CHANNEL_CLOUD_DEVOPS=id-canal-cloud
TELEGRAM_CHANNEL_MOBILE=id-canal-mobile
TELEGRAM_CHANNEL_REMOTO=id-canal-remoto
LINKEDIN_ACCESS_TOKEN=token-acceso-linkedin
LINKEDIN_URN=urn:li:organization:xxxxx
MASTODON_ACCESS_TOKEN=token-mastodon
MASTODON_INSTANCE=https://mastodon.social
PINTEREST_ACCESS_TOKEN=token-pinterest          # Nuevo — Bot Pinterest
PINTEREST_BOARD_ID=id-tablero-pinterest         # Nuevo — Bot Pinterest
THREAD_ACCESS_TOKEN=token-threads              # Nuevo — Bot Threads
THREADS_USER_ID=id-usuario-threads              # Nuevo — Bot Threads
YOUTUBE_CREDENTIALS_JSON='{...}'               # Nuevo — Bot YouTube Shorts (OAuth 2.0)
FRONTEND_URL=https://portalempleoit.com
CRON_SECRET=token-secreto-cron
GEMINI_API_KEY=clave-api-gemini                # Para generate_weekly_article.py y generate_trends_post.py
```

### Variables del Frontend (`frontend/.env.local` / Vercel)
```env
DATABASE_URL=postgresql://...              # Solo si se conecta directo (desarrollo local)
DB_PROXY_URL=https://mail.portalempleoit.com/db_proxy.php  # URL del proxy HTTP de producción
DB_PROXY_TOKEN=token-secreto              # Token para comunicarse con db_proxy
GOOGLE_INDEXING_CREDENTIALS='{...}'       # JSON de cuenta de servicio de Google
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...  # ID de cliente de Google AdSense
NEXT_PUBLIC_ADSENSE_SLOT_INLINE=...       # Slot ID del banner inline
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=...      # Slot ID del banner sidebar
NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX=...    # Slot ID del formato multiplex
NEXT_PUBLIC_ADSENSE_SLOT_STICKY_SIDEBAR=... # Nuevo — Slot ID del sticky sidebar
STRIPE_SECRET_KEY=sk_live_...             # Llave privada de Stripe
STRIPE_WEBHOOK_SECRET=whsec_...           # Secreto para validar firmas webhook
NEXT_PUBLIC_AMAZON_TAG=portalempleoit-21  # Tag de afiliado Amazon
NEXT_PUBLIC_COURSERA_AFFILIATE_ID=...     # ID de afiliado Coursera
NEXT_PUBLIC_LINKEDIN_AFFILIATE_ID=...     # ID de afiliado LinkedIn Learning
NEXT_PUBLIC_ONESIGNAL_APP_ID=...          # App ID de OneSignal (push notifications)
CRON_SECRET=token-secreto-cron
```

### Flujo de Despliegue

> [!IMPORTANT]
> **Arquitectura en producción activa: Vercel (Frontend) + Raiola Networks (Backend y Base de Datos).**

1.  **✅ ACTIVO — Arquitectura Distribuida (Vercel + Raiola Networks)**:
    *   *Frontend (Vercel)*: Push a `main` → Deploy automático en Vercel.
    *   *Backend (Raiola)*: GitHub Action `deploy_cpanel.yml` → Genera directorio limpio (sin `venv`, `node_modules`, `.env`) y sube vía FTP seguro a Raiola.
    *   *Base de Datos (Raiola)*: MySQL local persistente, gestionado desde cPanel.

2.  **⚠️ OBSOLETO — Arquitectura VPS Unificada (PM2 + Nginx)**:
    *   Ya **no está en uso**. `deploy.sh` y `nginx.conf.template` son artefactos históricos.

---

## 🧹 13. Limpieza de Deuda Técnica y Estado de Obsolescencia

*   **Unificación de Clientes**: Eliminado por completo el uso directo de Supabase SDK y la librería `pg`. Todo el frontend consulta a través del pool unificado en `frontend/lib/db.ts`.
*   **Limpieza de Archivos**: Eliminados scripts redundantes de duplicación de rutas y componentes huérfanos. Ver reporte completo en [analisis_archivos_obsoletos.md](file:///home/raul/proyecto_empleo/analisis_archivos_obsoletos.md).
*   **Organización de Componentes y APIs**: Reubicados componentes (`ResourceCard.tsx`) y rutas de API (`/api/widget/vacantes-count/route.ts`) al interior de la carpeta `frontend/`.

---

## 📁 14. Estructura de Directorios del Proyecto

```
proyecto_empleo/
├── frontend/                          # Next.js 15 App
│   ├── app/
│   │   ├── (rutas principales)/
│   │   ├── api/
│   │   │   ├── checkout/route.ts            # Crea sesión de Stripe (con affiliate_code)
│   │   │   ├── checkout/newsletter/         # Checkout patrocinio newsletter (49€)
│   │   │   ├── checkout/premium-candidate/  # Checkout suscripción candidato (4.99€/mes)
│   │   │   ├── checkout/report/             # Checkout informe mercado (9.99€ / 49€)
│   │   │   ├── fresh-alerts/                # Endpoint de disparo de alertas de empleo
│   │   │   ├── widget/vacantes-count/       # API de conteo de vacantes por tecnología
│   │   │   ├── webhooks/stripe/             # Confirma pago y activa oferta / sponsor / premium
│   │   │   └── track-open/                  # Pixel de tracking de apertura email
│   │   ├── blog/                      # Blog de empleo tech
│   │   │   ├── [slug]/                # Detalle de artículo del blog + cluster navigation
│   │   │   └── loading.tsx            # Skeleton animado de carga del blog
│   │   ├── comparar/[slug]/           # Comparativas salariales (ampliadas a 15+ techs)
│   │   ├── comparar-ofertas/          # Herramienta de comparación de ofertas guardadas
│   │   ├── empleo-del-dia/            # Landing del empleo del día
│   │   ├── empresa-dashboard/         # Panel B2B de métricas para reclutadores
│   │   ├── empresas/[slug]/           # Perfil de empresa
│   │   ├── empresas/[slug]/[categoria]/ # Subcategoría de empresa SSG
│   │   ├── en/trabajos/[sector]/      # Ruta en inglés limpia (H1)
│   │   ├── entrevistas/               # Índice de preguntas de entrevista
│   │   ├── entrevistas/[tech]/        # Preguntas por tecnología (FAQPage + Article)
│   │   ├── afiliados-empresa/         # Programa de afiliados B2B
│   │   ├── informe-mercado-it/        # Landing de informe descargable
│   │   ├── glosario/                  # Glosario tecnológico IT
│   │   │   ├── [term]/                # Término del glosario
│   │   │   └── loading.tsx            # Skeleton animado de carga del glosario
│   │   ├── job/[id]/                  # Detalle de oferta (VideoObject + Speakable schema)
│   │   │   ├── loading.tsx            # Skeleton de carga de oferta
│   │   │   └── error.tsx              # Boundary de error de oferta
│   │   ├── mejores-ofertas-semana/    # Top vacantes semanales
│   │   ├── newsletter/                # Landing SEO de captación de newsletter
│   │   ├── ofertas-hoy/               # Vacantes indexadas en las últimas 24h
│   │   ├── precios/                   # Página pública de planes + Candidato Premium
│   │   ├── publicar-oferta/           # Formulario de publicación con Stripe (ref capture)
│   │   ├── publicidad/                # Media Kit + checkout newsletter directo
│   │   ├── redirect/[id]/             # Página intermedia con anuncio
│   │   ├── salarios/                  # Calculadora de salarios IT
│   │   ├── salarios/[tecnologia]/[ciudad]/[nivel]/ # Páginas SSG de salario
│   │   ├── talento-premium/           # Pool de candidatos + CTA B2B
│   │   ├── trabajo-[ciudad]/          # Landings editoriales por ciudad
│   │   ├── trabajo-remoto-{usa,uk,alemania,europa}/ # Landings internacionales
│   │   ├── trabajos/[sector]/         # Motor SEO programático (slugs complejos)
│   │   │   ├── empresas/              # Ranking de empresas por stack
│   │   │   ├── loading.tsx            # Skeleton de carga del listado
│   │   │   └── error.tsx              # Boundary de error de sector
│   │   ├── actions.ts                 # Server Actions (subscribeUser, registerRecruiterAffiliate...)
│   │   ├── error.tsx                  # Error boundary raíz global
│   │   ├── loading.tsx                # Skeleton animado raíz
│   │   ├── not-found.tsx              # Página 404 con schema WebPage y retención
│   │   ├── layout.tsx                 # Layout global (AdSense, hreflang, preload LCP)
│   │   ├── robots.ts                  # robots.txt (bloquea IA bots, permite Google-Extended)
│   │   └── sitemap.ts                 # Sitemaps dinámicos (5 ficheros, 60+ páginas estáticas)
│   ├── components/
│   │   ├── AdBanner.tsx               # Anuncios AdSense + ad refresh + minHeight fijo (CLS)
│   │   ├── ApplyButton.tsx            # Botón de aplicar (redirige a /redirect/[jobId])
│   │   ├── Breadcrumbs.tsx            # Breadcrumbs accesibles con JSON-LD
│   │   ├── CityLandingPage.tsx        # Landings editoriales de ciudades
│   │   ├── CompanyLogo.tsx            # Logo de empresa optimizado
│   │   ├── CompareJobButton.tsx       # Botón de comparación de ofertas
│   │   ├── CompareFloatingPill.tsx    # Barra flotante de ofertas comparadas
│   │   ├── CourseAffiliate.tsx        # Bloque de cursos contextual por tecnología
│   │   ├── ExitIntentPopup.tsx        # Popup de captura al intentar salir
│   │   ├── FeaturedJobCard.tsx        # Tarjeta destacada con rango salarial dinámico
│   │   ├── Footer.tsx                 # Pie de página dinámico programático
│   │   ├── Header.tsx                 # Cabecera global (UserStreak via next/dynamic, w-20 skeleton)
│   │   ├── InAppNotification.tsx      # Notificaciones flotantes in-app
│   │   ├── JobCard.tsx                # Tarjeta de oferta con rango salarial dinámico
│   │   ├── JobCardSkeleton.tsx        # Skeleton generico de tarjeta de trabajo
│   │   ├── LoadMoreJobs.tsx           # Scroll infinito con formateador salarial
│   │   ├── PushSubscribe.tsx          # Widget de suscripción push (OneSignal)
│   │   ├── ReactionButton.tsx         # Botones 👍/👎 por oferta
│   │   ├── RecentlyViewed.tsx         # Tracker y panel de vistas recientes
│   │   ├── RedirectClient.tsx         # Contador regresivo + AdBanner en redirección
│   │   ├── RemoteCountryLandingPage.tsx # Template genérico para landings internacionales
│   │   ├── ResourceCard.tsx           # Tarjeta de recurso recomendado
│   │   ├── SalariosCalculator.tsx     # Calculadora salarial con comparativa "cobras vs. mercado"
│   │   ├── SaveJobButton.tsx          # Botón de guardar oferta
│   │   ├── StickyDesktopAd.tsx        # Banner sticky lateral (desktop xl+)
│   │   ├── SubscribeForm.tsx          # Formulario de newsletter
│   │   └── UserStreak.tsx             # Panel gamificado de racha diaria
│   └── lib/
│       ├── blog-clusters.ts           # Definición de clusters de contenido editorial
│       ├── blog.ts                    # Posts estáticos del blog y helpers (envelto en cache())
│       ├── constants.ts               # BASE_URL y constantes globales
│       ├── me.ts                      # Datos estructurados y perfil del proyecto
│       ├── db.ts                      # Pool de conexión a BD (proxy HTTP)
│       ├── entrevistas.ts             # Banco de preguntas de entrevista por tech
│       ├── salarios.ts                # Lógica de cálculo de estadísticas salariales
│       └── slug.ts                    # Generación y parseo de slugs canónicos
│
├── backend/                           # Python 3.10 (ejecutado en Raiola)
│   ├── run_all.py                     # Orquestador maestro (18+ fases)
│   ├── main.py                        # Scrapers internacionales
│   ├── psycopg2.py                    # Shim PostgreSQL → MySQL
│   ├── mailer.py                      # Newsletter semanal + Sponsor automático
│   ├── telegram_bot.py                # Bot de Telegram (multicanal)
│   ├── linkedin_bot.py                # Bot de LinkedIn (con tarjeta gráfica)
│   ├── mastodon_bot.py                # Bot de Mastodon
│   ├── pinterest_bot.py               # Bot de Pinterest (API v5)
│   ├── threads_bot.py                 # Bot de Threads (Meta Graph API)
│   ├── youtube_shorts_bot.py          # Bot de YouTube Shorts (Pillow + ffmpeg)
│   ├── twitter_bot.py                 # Bot de Twitter (INACTIVO)
│   ├── send_custom_alerts.py          # Alertas personalizadas diarias/semanales
│   ├── send_welcome_onboarding.py     # Secuencia de bienvenida (2 emails)
│   ├── send_reactivation.py           # Reactivación de suscriptores inactivos
│   ├── send_instant_featured_alerts.py # Alertas por ofertas destacadas
│   ├── send_push_notifications.py     # Notificaciones push (OneSignal)
│   ├── send_streak_reminder.py        # Recordatorio de racha diaria
│   ├── send_saved_jobs_reminder.py    # Recordatorio de ofertas guardadas (48h)
│   ├── send_referral_notifications.py # Notificaciones de progreso de referidos
│   ├── generate_weekly_article.py     # Generación de artículo SEO con IA (Gemini)
│   ├── generate_trends_post.py        # Post de tendencias tech desde datos BD
│   ├── generate_market_report.py      # Generación de informe de mercado IT descargable
│   ├── index_new_jobs.py              # Envío a Google Indexing API
│   ├── ping_sitemap.py                # Notificación de sitemap a Google
│   ├── deactivate_expired_jobs.py     # Desactivación y purga de expiradas
│   ├── add_b2b_monetization_tables.py # Migración de tablas B2B (G1-G4)
│   ├── add_metrics_columns.py         # Migración: impressions_count, clicks_count en jobs
│   ├── add_company_email_to_jobs.py   # Migración: company_email en jobs
│   ├── add_pinterest_threads_columns.py # Migración: columnas last_*_posted_at
│   ├── add_referrals_notified_count.py  # Migración: referrals_notified_count en subscribers
│   ├── scrapers/                      # Módulos de scraping (remotive, wwr, etc.)
│   └── logic/
│       ├── classifier.py              # Clasificador de categorías
│       ├── translator.py              # Traductor inteligente con protección de términos
│       ├── salary_parser.py           # Parser y normalización de salarios
│       ├── image_generator.py         # Generador de tarjetas gráficas (Pillow)
│       └── slug.py                    # Generación de slugs para URLs de redes sociales
│
├── DEVELOPMENT_CONTEXT.md             # ← ESTE ARCHIVO (fuente de verdad del proyecto)
├── db_proxy.php                       # Puente HTTP para la BD MySQL
├── deploy.sh                          # (OBSOLETO) Script de deploy a VPS
└── .github/
    └── workflows/
        ├── run_scrapers.yml            # GitHub Action: run_all.py cada 6 horas
        ├── mailer.yml                  # GitHub Action: newsletter semanal (lunes)
        └── deploy_cpanel.yml          # GitHub Action: deploy al FTP de Raiola
```

---

## 📅 15. Historial de Mejoras Implementadas

| Categoría | Descripción | Estado |
| :--- | :--- | :--- |
| **A — SEO Programático** | Páginas SSG de salario, empresa+categoría, listados por sector, landings internacionales, top ofertas, comparativas ampliadas | ✅ COMPLETO |
| **B — AdSense y Monetización** | StickyDesktopAd, Ad Refresh, Multiplex en blog, página de redirección con anuncio | ✅ COMPLETO |
| **C — Contenido Editorial** | Cluster content, landing newsletter, preguntas de entrevista, calculadora salarial mejorada | ✅ COMPLETO |
| **D — Distribución Social** | Bots Pinterest, YouTube Shorts, Threads integrados en run_all.py | ✅ COMPLETO (Twitter excluido) |
| **E — Retención y Engagement** | Notificaciones de referidos, dashboard B2B de reclutadores, bloque lectura recomendada, RSS monetizado | ✅ COMPLETO |
| **F — Core Web Vitals** | Lazy loading UserStreak con skeleton `w-20` (CLS=0), minHeight fijo en AdBanner, preload LCP, `loading.tsx` en 5+ secciones | ✅ COMPLETO |
| **G — Monetización B2B Directa** | Newsletter Sólo, Candidato Premium, Informes de Mercado, Programa de Afiliados | ✅ COMPLETO |
| **H — SEO Técnico & Indexación** | Ruta `/en/` limpia, Google-Extended permitido, VideoObject schema, Google News Sitemap (`/sitemap-news.xml`), `WebPage` 404, `NewsArticle` Discover, `HowTo` schemas, `JobPosting` embebidos en ItemList | ✅ COMPLETO |
| **I — UX & Transparencia** | Formateador de rangos salariales `salary_min`/`max` en `JobCard`, `FeaturedJobCard`, `LoadMoreJobs`; boundaries `error.tsx` en rutas críticas | ✅ COMPLETO |
