# 📌 Contexto de Desarrollo y Arquitectura - Portal Empleo IT

Este documento sirve como la **fuente única de verdad** para desarrolladores y asistentes de Inteligencia Artificial. Describe exhaustivamente la arquitectura, base de datos, lógica de negocio, automatizaciones y el plan completo de tráfico y monetización implementado en el portal.

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
| **Canales Externos** | Telegram, LinkedIn, Mastodon, Email | Integraciones API | Difusión automatizada de vacantes mediante bots e email SMTP. Twitter/X desactivado por petición del usuario. |

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

---

## 🗄️ 3. Esquema Completo de Base de Datos MySQL

La base de datos MySQL (`ecosier2_PortalEmpleo`) consta de 7 tablas principales con motores InnoDB y codificación de caracteres `utf8mb4_unicode_ci` para soporte total de emojis y caracteres especiales.

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
        timestamp featured_until
        decimal salary_min
        decimal salary_max
        timestamp last_tweeted_at
        timestamp last_linkedin_posted_at
        timestamp last_tooted_at
        timestamp last_instant_alert_sent_at
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
```

### Campos Relevantes Adicionales en `jobs`
- `plan`: Almacena el plan de la oferta destacada: `'basico'`, `'destacado_basico'`, `'destacado_pro'`, `'destacado_enterprise'`.
- `featured_until`: `TIMESTAMP NULL` — Fecha de expiración del destaque. El webhook de Stripe lo calcula como `NOW() + 15 días` (Básico) o `NOW() + 30 días` (Pro/Enterprise).

### Campos Relevantes Adicionales en `subscribers`
- `streak_days`: `INT DEFAULT 0` — Días consecutivos de visitas del usuario (sistema de racha gamificado).
- `streak_last_visit`: `TIMESTAMP NULL` — Última visita registrada para el cálculo de la racha.
- `referred_by`: `VARCHAR(255) NULL` — Email o código del usuario que refirió al suscriptor.

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

### Pipeline de Ejecución Completo (15+ Fases)

```
run_all.py
 ├─► [0]    Migraciones de Base de Datos (add_referred_by_column.py, add_reactions_table.py)
 ├─► [1]    main.py → Scrapers Internacionales (WWR, Remotive, Himalayas, RemoteOK, etc.)
 ├─► [2]    Scrapy (job_spider) → Ingesta de Tecnoempleo (ES)
 ├─► [3]    scraper_infoempleo.py → Ingesta de Stratos (ES)
 ├─► [4]    telegram_bot.py → Publicación multicanal en Telegram
 ├─► [4.1]  telegram_digest.py → Digest diario en Telegram
 ├─► [4.5]  linkedin_bot.py → Tarjeta gráfica + Post en LinkedIn (con imagen JPEG)
 ├─► [4.6]  twitter_bot.py → OMITIDO (desactivado por petición del usuario)
 ├─► [4.7]  mastodon_bot.py → Post de texto en Mastodon (Fediverso)
 ├─► [5]    index_new_jobs.py → Envío a Google Indexing API (Últimas 7h)
 ├─► [5.5]  ping_sitemap.py → Notificación de actualización de sitemap a Google
 ├─► [6]    deactivate_expired_jobs.py → Desactiva (>30 días), desindexa, purga (>90 días)
 ├─► [7]    send_custom_alerts.py → Emails diarios/semanales personalizados
 ├─► [7.1]  send_welcome_onboarding.py → Embudo de bienvenida (Email 1 y Email 2)
 ├─► [7.1.1] send_reactivation.py → Reactivación y limpieza de suscriptores inactivos
 ├─► [7.2]  send_instant_featured_alerts.py → Alertas instantáneas por ofertas destacadas
 ├─► [7.3]  send_push_notifications.py → Notificaciones Push web segmentadas (OneSignal)
 ├─► [7.4]  generate_weekly_article.py → Generación de artículo de blog SEO (IA semanal)
 ├─► [7.5]  generate_trends_post.py → Post de tendencias tecnológicas con datos reales de BD
 ├─► [7.6]  send_streak_reminder.py → Recordatorio de racha diaria de usuario (20:00h)
 └─► [7.7]  send_saved_jobs_reminder.py → Recordatorio de ofertas guardadas (48h)
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
4.  **Twitter/X**: Código existente pero **desactivado** en `run_all.py`.
5.  **Fallback de contenido**: Si no hay vacantes nuevas que difundir, los bots seleccionan un artículo del blog para publicar y mantener los algoritmos de las plataformas activos.

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

---

## 🌐 9. Frontend de Next.js: SEO Programático y Estructura

El frontend está desarrollado bajo Next.js 15 y el App Router, altamente optimizado para posicionamiento orgánico.

### 9.1 Lógica de Enrutamiento y SEO Programático (`/trabajos/[sector]`)
La ruta `/trabajos/[sector]/page.tsx` es el motor de indexación masivo del portal.
*   **Parser de Parámetros (`parseSector`)**: Descompone dinámicamente un slug compuesto en variables de búsqueda:
    *   *Modalidad*: `-hibrido` → teletrabajo parcial.
    *   *Ubicación*: `-en-[ciudad]` → ciudad; `-remoto` → remoto.
    *   *Experiencia*: `-junior`, `-senior`, `-sin-experiencia`.
    *   *Salario*: `-salario-30k-45k` → rango salarial.
    *   *Tipo de contrato*: `-autonomo`, `-practicas`, `-media-jornada`.
    *   *Tecnología/Categoría*: Lo restante se mapea a palabras clave tecnológicas o categorías.
*   **Estrategia de Fallback (`getFallbackJobs`)**: Si la búsqueda devuelve 0 resultados, aplica cascada: 1) misma tecnología en remoto, 2) misma tecnología a nivel nacional, 3) sector IT general.
*   **FAQ Schema**: Inyecta `FAQPage` JSON-LD dinámico en la parte inferior con datos reales de salarios y volumen de ofertas.
*   **Prefetching Selectivo**: Carga inmediata (`prefetch={true}`) para las 5 primeras ofertas y destacadas; prefetch al hover para el resto de la lista.

### 9.2 Sitemap Dinámico Segmentado (`app/sitemap.ts`)
Dividido en 4 sitemaps dinámicos con revalidación cada 2h:
*   **Sitemap 0**: Páginas estáticas, artículos de blog, combinaciones SEO activas calculadas dinámicamente sobre las últimas 8.000 ofertas.
*   **Sitemap 1 & 2**: Ofertas de empleo indexables (1-8.000 y 8.001-16.000).
*   **Sitemap 3**: Directorio de empresas extraído dinámicamente de la BD.

### 9.3 Páginas SEO Especiales Implementadas

| Ruta | Archivo | Descripción |
| :--- | :--- | :--- |
| `/empresas/[slug]` | `app/empresas/[slug]/page.tsx` | Perfil de empresa con listado de vacantes, salario medio local, cuota de teletrabajo y reviews de empleados. Schema JSON-LD: `Organization`, `ItemList`, `JobPosting`. |
| `/trabajo-[ciudad]` | Rutas individuales → `CityLandingPage.tsx` | Landing editorial por ciudad (Madrid, Barcelona, Valencia, Sevilla, Bilbao) con textos dinámicos sobre el mercado local. |
| `/glosario/[term]` | `app/glosario/[term]/page.tsx` | Definición técnica del término, Schema `DefinedTerm`, salario promedio y 5 vacantes activas relacionadas. |
| `/salarios` | `app/salarios/page.tsx` | Calculadora interactiva de salarios IT con tabla comparativa (React, Node, Python, Java, TypeScript, DevOps, PHP, SQL) y Schema `Dataset`. |
| `/empleo-del-dia` | `app/empleo-del-dia/page.tsx` | Landing compartible de la oferta más destacada del día con metadatos OG optimizados para viralización. |
| `/talento-premium` | `app/talento-premium/page.tsx` | Pool de candidatos premium para empresas y reclutadores con CTA de registro y CTA B2B para headhunting. |
| `/publicidad` | `app/publicidad/page.tsx` | Media Kit corporativo con estadísticas reales y planes de patrocinio directo. |
| `/precios` | `app/precios/page.tsx` | Página pública de precios con los 4 planes de publicación de ofertas. |

### 9.4 Hreflang y Soporte Bilingüe
Todas las rutas programáticas principales inyectan los encabezados `alternates: { languages: { 'es': ..., 'en': ... } }` para el soporte de hreflang. El parámetro `?lang=en` activa la visualización en inglés y mueve el contenido a los títulos, descripciones y schema en inglés.

### 9.5 Componentes Frontend Clave

| Componente | Descripción |
| :--- | :--- |
| `AdBanner.tsx` | Anuncios AdSense configurable por variante (`inline`, `sidebar`, `multiplex`). Reserva alturas mínimas fijas (CLS prevention): `min-h-[50px]` y `min-h-[90px]` (inline) y `min-h-[250px]` (sidebar). Lee Slot IDs reales desde variables de entorno. |
| `CourseAffiliate.tsx` | Bloque de afiliados contextual. Usa el diccionario `TECH_COURSE_MAP` para mostrar cursos de Coursera/LinkedIn Learning/Domestika/Platzi específicos al stack de la oferta actual. |
| `CompanyLogo.tsx` | Logo de empresa optimizado sin `unoptimized`, delegando el caching y la optimización al Edge CDN de Vercel. |
| `UserStreak.tsx` | Panel gamificado de racha diaria con hitos de 3, 7 y 30 días de visitas consecutivas. |
| `PushSubscribe.tsx` | Widget de suscripción a notificaciones push (OneSignal). |
| `SaveJobButton.tsx` | Guardado de ofertas de empleo en el perfil del usuario. |
| `ReactionButton.tsx` | Botones de reacción (👍/👎) por oferta. |
| `SubscribeForm.tsx` | Formulario de suscripción a la newsletter con keywords de interés y preferencia de ciudad. |
| `RecentlyViewedTracker.tsx` | Tracker invisible que registra las últimas ofertas vistas por el usuario en localStorage. |
| `Breadcrumbs.tsx` | Breadcrumbs accesibles con Schema JSON-LD de `BreadcrumbList`. |

---

## 📊 10. Categorías de Mejoras Implementadas (Plan de Tráfico y Monetización)

Todas las categorías del plan de tráfico y monetización han sido implementadas. Estado: **✅ COMPLETO** (excepto Pinterest y YouTube Shorts de la Categoría 6).

### Categoría 1 — SEO Programático ✅
- **1.1 Slugs expandidos**: Filtros por salario, contrato, modalidad híbrida y experiencia en la misma URL.
- **1.2 Páginas de empresa**: `/empresas/[slug]` con estadísticas locales, reviews y JSON-LD.
- **1.3 Páginas de ciudad**: Landings editoriales dinámicas para Madrid, Barcelona, Valencia, Sevilla, Bilbao.
- **1.4 Glosario tecnológico**: `/glosario/[term]` con Schema `DefinedTerm` y vacantes activas.
- **1.5 Hreflang bilingüe**: `?lang=en` con alternates en todas las rutas principales.
- **1.6 FAQ Schema**: `FAQPage` JSON-LD dinámico al pie de las páginas de sector.
- **1.7 Sitemap segmentado**: 4 sitemaps dinámicos con ISR cada 2h + pings automáticos a Google.

### Categoría 2 — Blog y Contenido Editorial ✅
- **2.1 Cadencia automatizada**: `generate_weekly_article.py` genera posts SEO con IA semanalmente.
- **2.2 AdBanners en el blog**: Banners horizontales a los 3 párrafos, al final y sidebar sticky.
- **2.3 Post de tendencias**: `generate_trends_post.py` analiza crecimiento de vacantes por tecnología y publica un artículo de datos en la BD.
- **2.4 Calculadora de salarios**: Datos en tiempo real por tecnología/ciudad con Schema `Dataset`.

### Categoría 3 — Optimización de AdSense ✅
- **3.1 Slots reales**: Variables de entorno para IDs de slot (`NEXT_PUBLIC_ADSENSE_SLOT_*`).
- **3.2 Detalle de oferta**: Banners inline arriba de la descripción, sidebar sticky, multiplex al final.
- **3.3 Cobertura amplia**: Banners en herramientas, glosario, tendencias, calculadora de salarios y blog.
- **3.4 CLS Prevention**: Alturas mínimas fijas en todos los contenedores de `AdBanner.tsx`.

### Categoría 4 — Afiliados ✅
- **4.1 IDs reales**: Leídos de variables de entorno (`NEXT_PUBLIC_COURSERA_AFFILIATE_ID`, `NEXT_PUBLIC_LINKEDIN_AFFILIATE_ID`, `NEXT_PUBLIC_AMAZON_TAG`).
- **4.2 Programas activos**: Coursera, LinkedIn Learning, Domestika, Platzi en el pool rotativo.
- **4.3 Contextualización**: Diccionario `TECH_COURSE_MAP` en `CourseAffiliate.tsx` para mostrar el curso idóneo al stack de la oferta.
- **4.4 Afiliados en newsletter**: Cursos de Udemy integrados con UTM trackers dinámicos en onboarding y boletín semanal.

### Categoría 5 — Retención y Engagement ✅
- **5.1 Push segmentadas**: `send_push_notifications.py` filtra por stack tecnológico y usa la API de OneSignal (variable `NEXT_PUBLIC_ONESIGNAL_APP_ID`).
- **5.2 Recordatorios de guardadas**: `send_saved_jobs_reminder.py` a las 48h de guardar una oferta.
- **5.3 Racha (Streak)**: Panel `UserStreak.tsx` con hitos gamificados y `send_streak_reminder.py` a las 20:00h.
- **5.4 Empleo del día**: Landing `/empleo-del-dia` compartible con metadatos OG y widgets.

### Categoría 6 — Distribución y Redes Sociales (Parcial)
- ✅ **6.1 Frecuencia automatizada**: `run_all.py` ejecuta Telegram, LinkedIn y Mastodon en cada ciclo.
- ✅ **6.2 LinkedIn con tarjetas gráficas**: Imágenes JPEG generadas con Pillow y subidas al flujo de assets de LinkedIn.
- ⏳ **6.3 Pinterest**: No implementado (pendiente de crear `pinterest_bot.py`).
- ⏳ **6.4 YouTube Shorts**: No implementado (pendiente de crear `youtube_shorts_bot.py`).

### Categoría 7 — Core Web Vitals y PageSpeed ✅
- **7.1 Logos optimizados**: `CompanyLogo.tsx` sin `unoptimized`, delegando al Edge CDN de Vercel.
- **7.2 Prefetching selectivo**: Carga inmediata para las 5 primeras y destacadas; hover-based para el resto.
- **7.3 CLS en AdSense**: Alturas mínimas fijas en `AdBanner.tsx` para evitar saltos de layout.

### Categoría 8 — Monetización Directa B2B ✅
- **8.1 Media Kit**: `/publicidad` con estadísticas reales (+8.700 suscriptores, +35.000 páginas vistas/mes, 42% apertura).
- **8.2 Planes de pago**: Checkout Stripe para 3 planes de destaque (ver precios actuales abajo).
- **8.3 Sponsors en newsletter**: `mailer.py` inyecta automáticamente el bloque "Patrocinador de la Semana" si hay activos Pro/Enterprise.
- **8.4 Sourcing B2B**: CTA en `/talento-premium` para reclutadores y CTOs.

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

### Patrocinios Directos (Media Kit)

| Formato | Precio | Descripción |
| :--- | :--- | :--- |
| **Newsletter Patrocinada** | **49€/envío** | Bloque editorial exclusivo (Texto + Botón CTA) al inicio del boletín semanal |
| **Banners Nativos Web** | **79€/mes** | Banner estático en sidebar o inline en páginas de alto tráfico (sin ad-blockers) |

### Embudo de Publicación Destacada (Stripe)
*   **Creación del Checkout (`/api/checkout/route.ts`)**: El frontend envía los datos y el plan elegido a esta API. La oferta se guarda en la BD con `is_active = FALSE` e `is_featured = FALSE`. Se crea una sesión de pago en Stripe con el importe correspondiente y el UUID de la oferta en `metadata: { jobId: ..., plan: ... }`.
*   **Webhook de Confirmación (`/api/webhooks/stripe/route.ts`)**: Al completarse el pago, Stripe llama al webhook. El script verifica la firma, recupera el `jobId` y el `plan`, calcula `featured_until` (15 o 30 días) y activa la oferta:
    ```sql
    UPDATE jobs
    SET is_active = TRUE,
        is_featured = TRUE,
        plan = 'destacado_pro',
        featured_until = DATE_ADD(NOW(), INTERVAL 30 DAY)
    WHERE id = 'jobId'
    ```
*   También notifica al canal de Telegram de administración con los datos del pago completado.

### AdSense
*   Cargado de forma asíncrona con `@next/third-parties/google`.
*   Componente `AdBanner.tsx` configurable por variante (`inline`, `sidebar`, `multiplex`).
*   Slot IDs leídos de variables de entorno (`NEXT_PUBLIC_ADSENSE_SLOT_INLINE`, `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR`, `NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX`).

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
FRONTEND_URL=https://portalempleoit.com
CRON_SECRET=token-secreto-cron
GEMINI_API_KEY=clave-api-gemini            # Para generate_weekly_article.py y generate_trends_post.py
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

---

## 📁 14. Estructura de Directorios del Proyecto

```
proyecto_empleo/
├── frontend/                          # Next.js 15 App
│   ├── app/
│   │   ├── (rutas principales)/
│   │   ├── api/
│   │   │   ├── checkout/route.ts      # Crea sesión de Stripe
│   │   │   ├── webhooks/stripe/       # Confirma pago y activa oferta
│   │   │   └── track-open/            # Pixel de tracking de apertura email
│   │   ├── blog/[slug]/               # Detalle de artículo del blog
│   │   ├── empresas/[slug]/           # Perfil de empresa
│   │   ├── glosario/[term]/           # Término del glosario tecnológico
│   │   ├── job/[id]/                  # Detalle de oferta de empleo
│   │   ├── precios/                   # Página pública de planes
│   │   ├── publicar-oferta/           # Formulario de publicación con Stripe
│   │   ├── publicidad/                # Media Kit para anunciantes B2B
│   │   ├── salarios/                  # Calculadora de salarios IT
│   │   ├── talento-premium/           # Pool de candidatos + CTA B2B
│   │   ├── trabajo-[ciudad]/          # Landings editoriales por ciudad
│   │   ├── trabajos/[sector]/         # Motor SEO programático (slugs complejos)
│   │   ├── empleo-del-dia/            # Landing del empleo del día
│   │   ├── actions.ts                 # Server Actions de Next.js
│   │   ├── layout.tsx                 # Layout global (AdSense, hreflang)
│   │   └── sitemap.ts                 # Sitemaps dinámicos (4 ficheros)
│   ├── components/
│   │   ├── AdBanner.tsx               # Anuncios AdSense + afiliados contextual
│   │   ├── CityLandingPage.tsx        # Landings editoriales de ciudades
│   │   ├── CompanyLogo.tsx            # Logo de empresa optimizado
│   │   ├── CourseAffiliate.tsx        # Bloque de cursos contextual por tecnología
│   │   ├── UserStreak.tsx             # Panel gamificado de racha diaria
│   │   ├── PushSubscribe.tsx          # Widget de suscripción push (OneSignal)
│   │   ├── SaveJobButton.tsx          # Botón de guardar oferta
│   │   ├── ReactionButton.tsx         # Botones 👍/👎 por oferta
│   │   ├── SubscribeForm.tsx          # Formulario de newsletter
│   │   ├── RecentlyViewed.tsx         # Tracker y panel de vistas recientes
│   │   └── Breadcrumbs.tsx            # Breadcrumbs accesibles con JSON-LD
│   └── lib/
│       ├── db.ts                      # Pool de conexión a BD (proxy HTTP)
│       ├── blog.ts                    # Posts estáticos del blog y helpers
│       ├── salarios.ts                # Lógica de cálculo de estadísticas salariales
│       ├── slug.ts                    # Generación y parseo de slugs canónicos
│       └── constants.ts               # BASE_URL y constantes globales
│
├── backend/                           # Python 3.10 (ejecutado en Raiola)
│   ├── run_all.py                     # Orquestador maestro
│   ├── main.py                        # Scrapers internacionales
│   ├── psycopg2.py                    # Shim PostgreSQL → MySQL
│   ├── mailer.py                      # Newsletter semanal + Sponsor automático
│   ├── telegram_bot.py                # Bot de Telegram (multicanal)
│   ├── linkedin_bot.py                # Bot de LinkedIn (con tarjeta gráfica)
│   ├── mastodon_bot.py                # Bot de Mastodon
│   ├── twitter_bot.py                 # Bot de Twitter (INACTIVO)
│   ├── send_custom_alerts.py          # Alertas personalizadas diarias/semanales
│   ├── send_welcome_onboarding.py     # Secuencia de bienvenida (2 emails)
│   ├── send_reactivation.py           # Reactivación de suscriptores inactivos
│   ├── send_instant_featured_alerts.py # Alertas por ofertas destacadas
│   ├── send_push_notifications.py     # Notificaciones push (OneSignal)
│   ├── send_streak_reminder.py        # Recordatorio de racha diaria
│   ├── send_saved_jobs_reminder.py    # Recordatorio de ofertas guardadas (48h)
│   ├── generate_weekly_article.py     # Generación de artículo SEO con IA (Gemini)
│   ├── generate_trends_post.py        # Post de tendencias tech desde datos BD
│   ├── index_new_jobs.py              # Envío a Google Indexing API
│   ├── ping_sitemap.py                # Notificación de sitemap a Google
│   ├── deactivate_expired_jobs.py     # Desactivación y purga de expiradas
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
