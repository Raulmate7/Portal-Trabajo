# 📌 Contexto de Desarrollo y Arquitectura - Portal Empleo IT

Este documento sirve como la fuente única de verdad para desarrolladores y asistentes de Inteligencia Artificial (como Gemini/Antigravity). Describe exhaustivamente la arquitectura, base de datos, lógica de negocio y automatizaciones del portal.

> [!IMPORTANT]
> **Para el Asistente de IA:** Lee este archivo al inicio de cada conversación para obtener el contexto completo del proyecto de forma rápida, precisa y con bajo consumo de tokens.

---

## 🛠️ 1. Stack Tecnológico y Arquitectura Distribuida

> [!IMPORTANT]
> **Arquitectura activa en producción:** El proyecto opera **exclusivamente** bajo una arquitectura **híbrida distribuida** entre Vercel y Raiola Networks. La alternativa de VPS unificado con PM2/Nginx documentada en la sección 11 está **obsoleta y no se utiliza**.

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
| **Canales Externos** | Telegram, Twitter/X, LinkedIn, Mastodon, Email | Integraciones API | Difusión automatizada de vacantes mediante bots e email SMTP. |

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
*   **Firma del Token**: Cada consulta enviada desde Vercel debe incluir la cabecera `X-Proxy-Token` con un token seguro (`a6f021f1d19d675b8e998a44d187764d`). Si el token es ausente o inválido, devuelve un error `403 Forbidden`.
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

### DDL de las Tablas e Índices de Optimización

1.  **`sectors`**: Almacena los sectores tecnológicos y las palabras clave asociadas para la clasificación interna.
    *   `id`: `INT AUTO_INCREMENT PRIMARY KEY`
    *   `name`: `VARCHAR(255) NOT NULL` (ej. 'Informática y Tecnología')
    *   `slug`: `VARCHAR(255) UNIQUE NOT NULL` (ej. 'informatica-tecnologia')
    *   `keywords`: `JSON NOT NULL` (Lista JSON de términos relacionados para scrapers)
2.  **`jobs`**: Tabla principal de ofertas de empleo.
    *   `id`: `VARCHAR(36) PRIMARY KEY DEFAULT (UUID())`
    *   `sector_id`: `INT`, Llave foránea que referencia a `sectors(id) ON DELETE SET NULL`
    *   `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    *   `is_featured`: `BOOLEAN DEFAULT FALSE` (Indica si es destacada/de pago)
    *   `is_active`: `BOOLEAN DEFAULT TRUE` (Indica si la oferta está visible)
    *   `salary_min` & `salary_max`: `DECIMAL(12, 2)` (Salarios normalizados calculados)
    *   `salary_currency`: `VARCHAR(10) DEFAULT 'EUR'` (Moneda: EUR, USD, GBP)
    *   `title` & `description_snippet`: `TEXT NOT NULL` (Originales de la fuente)
    *   `title_es` & `description_snippet_es`: `VARCHAR(255)` / `TEXT` (Traducciones al español para scrapers internacionales)
    *   `company`: `VARCHAR(255) NOT NULL`
    *   `location`: `VARCHAR(1000) DEFAULT 'España'`
    *   `salary`: `VARCHAR(255)` (Cadena original de salario)
    *   `url_source`: `VARCHAR(700) UNIQUE NOT NULL` (URL origen de la oferta, evita duplicaciones)
    *   `category`: `VARCHAR(255) DEFAULT 'Otros'` (Backend, Frontend, Mobile, Data & AI, Cloud & DevOps, Otros)
    *   *Timestamps de difusión*: `last_tweeted_at`, `last_linkedin_posted_at`, `last_tooted_at`, `last_instant_alert_sent_at` (`TIMESTAMP NULL`)
3.  **`subscribers`**: Usuarios del boletín de empleo.
    *   `id`: `VARCHAR(36) PRIMARY KEY DEFAULT (UUID())`
    *   `email`: `VARCHAR(255) UNIQUE NOT NULL`
    *   `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    *   `last_sent_at`: `TIMESTAMP NULL` (Última vez que se le envió la alerta diaria/semanal)
    *   `onboarding_stage`: `INT DEFAULT 0` (Etapa de bienvenida: 0, 1, 2)
    *   `onboarding_last_sent_at`: `TIMESTAMP NULL` (Último envío de onboarding)
    *   `tech_keywords` & `location_pref`: `TEXT` (Keywords separadas por comas e interés de ciudad)
    *   `frequency`: `VARCHAR(50) DEFAULT 'weekly'` (`daily` o `weekly`)
4.  **`alerts`**: Correos registrados de alertas rápidas (almacenamiento básico complementario).
5.  **`sponsored_jobs`**: Ofertas patrocinadas recibidas pendientes de aprobación/pago.
6.  **`email_tracking`**: Registro de aperturas de emails.
    *   `id`: `INT AUTO_INCREMENT PRIMARY KEY`
    *   `email`: `VARCHAR(255) NOT NULL`
    *   `campaign`: `VARCHAR(255) NOT NULL` (Nombre de la campaña, ej. `weekly_newsletter_2026-06-16`)
    *   `opened_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
7.  **`premium_leads`**: Profesionales inscritos en el canal premium.
    *   `id`: `INT AUTO_INCREMENT PRIMARY KEY`
    *   `name`, `email`, `stack`, `experience` (ej. Mid, Senior), `linkedin`, `created_at`.

### Índices Físicos en MySQL
Para acelerar los filtros complejos de SEO y la paginación del frontend, se aplican los siguientes índices:
*   `idx_jobs_created_at` en `jobs (created_at DESC)` (Ordenación global por novedades).
*   `idx_jobs_is_featured` en `jobs (is_featured)` (Priorización de ofertas patrocinadas).
*   `idx_jobs_is_active` en `jobs (is_active)` (Exclusión rápida de expiradas).
*   `idx_jobs_category` en `jobs (category)` (Filtros por categoría).
*   `idx_jobs_search` (`FULLTEXT INDEX`) en `jobs (title, company, location)` (Búsquedas dinámicas del usuario en la barra de navegación).

---

## 🐍 4. Shim de Base de Datos en Python (psycopg2.py)

El backend en Python fue desarrollado inicialmente usando PostgreSQL (Supabase). Al migrar a MySQL en Raiola Networks, para evitar tener que reescribir docenas de scripts del backend y adaptarlos a las librerías `pymysql` o `mysql-connector`, se diseñó un **shim local transparente**.

### Funcionamiento del Patch de Importación
Al colocar un archivo llamado `psycopg2.py` en la raíz de la carpeta `backend/` (que está en el `sys.path` de ejecución de Python), cuando cualquier script ejecuta `import psycopg2`, el intérprete carga este archivo local en lugar de la librería compilada de Postgres.

El shim intercepta y redirige el flujo de datos:
1.  **Conexión**: `psycopg2.connect()` analiza la URL de conexión (DSN). Si es un formato de Postgres (`postgresql://`), extrae las credenciales y las traduce a parámetros de conexión TCP de MySQL mediante la librería `pymysql`.
2.  **Mapeo de Variables de cPanel**: Si la conexión se ejecuta localmente (`localhost`), prioriza las variables individuales del hosting de Raiola (`MYSQL_USER`, `MYSQL_DATABASE`, `MYSQL_PASSWORD`) si están definidas.
3.  **Traducción de Consultas al Vuelo**: El `CursorWrapper` intercepta la consulta SQL antes de enviarla a MySQL y realiza sustituciones mediante expresiones regulares:
    *   **Case-Insensitive (`ILIKE` a `LIKE`)**: MySQL es case-insensitive por defecto con colaciones `unicode_ci`. El shim reemplaza `ILIKE` por `LIKE` automáticamente.
    *   **Inserciones Únicas (`ON CONFLICT` a `INSERT IGNORE`)**: Traduce sentencias del tipo `INSERT INTO ... ON CONFLICT (col) DO NOTHING` al formato de MySQL `INSERT IGNORE INTO ...`.
    *   **Filtros de Arrays (`= ANY(%s)` a `IN (%s)`)**: Traduce comprobaciones de listas del tipo `title = ANY(%s)` a la sintaxis estándar `title IN (%s, %s, ...)`, expandiendo dinámicamente la tupla de parámetros.
    *   **Intervalos de Tiempo**: Traduce expresiones de tiempo Postgres como `INTERVAL '48 hours'` o `INTERVAL '6 days'` a la sintaxis de MySQL `INTERVAL 48 HOUR` y `INTERVAL 6 DAY`.

---

## 🚀 5. Orquestador de Backend (run_all.py)

El script `backend/run_all.py` es el orquestador maestro que ejecuta periódicamente todas las fases de sincronización, ingesta y automatizaciones del portal. Se invoca cada 6 horas mediante GitHub Actions.

### Pipeline de Ejecución de 13 Fases

```
run_all.py
 ├─► [1/13] main.py ➔ Scrapers Internacionales (WWR, Remotive, Himalayas, etc.)
 ├─► [2/13] Scrapy (job_spider) ➔ Ingesta de Tecnoempleo (ES)
 ├─► [3/13] scraper_infoempleo.py ➔ Ingesta de Stratos (ES)
 ├─► [4/13] telegram_bot.py ➔ Publicación multicanal en Telegram
 ├─► [5/13] linkedin_bot.py ➔ Tarjeta gráfica + Post en LinkedIn
 ├─► [6/13] twitter_bot.py ➔ Tarjeta gráfica + Post en Twitter/X
 ├─► [7/13] mastodon_bot.py ➔ Post de texto en Mastodon (Fediverso)
 ├─► [8/13] index_new_jobs.py ➔ Envío a Google Indexing API (Últimas 7h)
 ├─► [9/13] ping_sitemap.py ➔ Notificación de actualización de sitemap a Google
 ├─► [10/13] deactivate_expired_jobs.py ➔ Desactiva (>30 días), desindexa y purga (>90 días)
 ├─► [11/13] send_custom_alerts.py ➔ Envío de correos diarios/semanales personalizados
 ├─► [12/13] send_welcome_onboarding.py ➔ Procesa el embudo de onboarding de emails
 └─► [13/13] send_instant_featured_alerts.py ➔ Alertas inmediatas para empleos destacados
```

---

## 🔍 6. Scrapers y Procesamiento de Datos del Backend

El backend incluye múltiples robots especializados en capturar ofertas tecnológicas de calidad de diferentes fuentes.

### Fuentes de Ofertas Activas
1.  **Scrapers de API (main.py)**:
    *   `scrapers/remotive.py`: Consulta la API JSON pública de Remotive (`https://remotive.com/api/remote-jobs`).
    *   `scrapers/himalayas.py`: Consulta la API de Himalayas (`https://himalayas.app/jobs/api`).
    *   `scrapers/wwr.py`: Descarga y parsea el feed RSS de WeWorkRemotely (`https://weworkremotely.com/categories/remote-programming-jobs.rss`).
    *   `scrapers/remoteok.py`: Parsea el feed RSS de RemoteOK.
    *   `scrapers/workingnomads.py`: Consume el JSON de Working Nomads.
    *   `scrapers/jobfluent.py` & `scrapers/pythonorg.py`: Consumen feeds locales y específicos de Python.
2.  **Scrapy Crawler (job_spider.py)**:
    *   Parsea de forma recursiva (hasta 5 páginas) el listado de `https://www.tecnoempleo.com/ofertas-trabajo/`.
    *   Cuenta con una lógica avanzada de normalización de ubicaciones: limpia textos largos y detecta ciudades populares de España (Madrid, Barcelona, Valencia, etc.) para catalogarlas como "Remoto (Ciudad)" o "[Ciudad], España".
3.  **BeautifulSoup Stratos Parser (scraper_infoempleo.py)**:
    *   Aunque el archivo se llama `scraper_infoempleo.py` por razones de compatibilidad histórica, actualmente scrapea directamente el listado HTML de la web de la comunidad de videojuegos Stratos (`https://www.stratos-ad.com/trabajo`), parseando las tablas de ofertas mediante BeautifulSoup.

### Procesamiento de Lógica Interna
*   **Clasificador de Categorías (`logic/classifier.py`)**: Asigna una de las 6 categorías (`Backend`, `Frontend`, `Data & AI`, `Cloud & DevOps`, `Mobile`, `Otros`) evaluando un sistema de puntuación con expresiones regulares sobre el título y descripción. Los títulos tienen una ponderación x3 respecto a la descripción.
*   **Traducción Inteligente (`logic/translator.py`)**: Utiliza `deep-translator` (Google Translate gratis) para traducir títulos y resúmenes de ofertas internacionales. Posee un diccionario de protección (`protected_words`) que reemplaza tecnologías clave (como React, Spring, Node.js, AWS) por tokens (`PROTTECH0ZZ`) antes de enviar a traducir, restaurándolos posteriormente para evitar traducciones literales como "Reaccionar" o "Primavera".
*   **Parser de Salarios (`logic/salary_parser.py`)**: Extrae salarios mínimos y máximos normalizados y detecta la moneda. Si encuentra términos como "mes" o valores inferiores a 5000, los multiplica por 12 para convertirlos en salarios anuales. Descarta valores atípicos (anualidades <5k o >500k).
*   **Control de Duplicados**:
    *   **Duplicados Físicos**: Comprueba que la `url_source` no exista en la BD.
    *   **Duplicados Semánticos**: Evita registrar ofertas idénticas (mismo título y empresa) publicadas en una ventana de **48 horas**.

---

## 📢 7. Bots de Difusión en Redes Sociales y Generador Gráfica

Una de las principales vías de captación de tráfico del portal es su automatización en redes sociales.

### Generador Dinámico de Tarjetas Gráficas (image_generator.py)
Para los bots de Twitter/X y LinkedIn, el script `logic/image_generator.py` utiliza la librería **Pillow (PIL)** para generar en tiempo de ejecución una imagen publicitaria de 1200x630px en formato PNG.

```
+-------------------------------------------------------------+
|  🚀  PORTAL TRABAJO IT  |  EMPLEO TECNOLÓGICO             | (Cabecera dorada)
|  ---------------------------------------------------------  | (Línea de acento)
|                                                             |
|  Senior React Developer (Teletrabajo 100%)                  | (Título adaptado,
|  con inglés fluido                                          |  hasta 3 líneas)
|                                                             |
|  🏢 Stark Industries                                        |
|  📍 Remoto (España)   •   💰 45.000€ - 55.000€ brutos/año  | (Detalles)
|                                                             |
|  +---------------------------------+                        |
|  | Postularse en portalempleoit.es |                        | (Botón Indigo)
|  +---------------------------------+                        |
+-------------------------------------------------------------+
```

*   **Estética Visual**: Fondo degradado oscuro (azul cobalto a morado oscuro) con un resplandor circular índigo semi-transparente en la esquina superior derecha.
*   **Ajuste de Texto**: El título de la vacante se divide automáticamente en líneas (`wrap_text`) en función de su longitud en píxeles usando la tipografía *NotoSans-Bold* cargada del sistema.
*   **Llamada a la Acción**: Dibuja un botón redondeado en el pie con el texto "Postularse en portalempleoit.es" centrado matemáticamente.

### Canales de Difusión
1.  **Telegram (`telegram_bot.py`)**: Filtra las ofertas creadas en las últimas 7 horas. Envía un mensaje en bloque consolidado al canal principal (`@PortalDeTrabajo`) con botones de teclado en línea. Si las variables de entorno están activas, envía las ofertas segmentadas a canales temáticos (`TELEGRAM_CHANNEL_FRONTEND`, `TELEGRAM_CHANNEL_BACKEND`, `TELEGRAM_CHANNEL_DATA_AI`, `TELEGRAM_CHANNEL_CLOUD_DEVOPS`, `TELEGRAM_CHANNEL_MOBILE`, `TELEGRAM_CHANNEL_REMOTO`).
2.  **Twitter/X (`twitter_bot.py`)**: Selecciona hasta 3 ofertas recientes sin publicar. Genera la tarjeta publicitaria, la sube mediante la API v1.1 (`api.media_upload`), publica el tweet con hashtags calculados usando la API v2 y marca `last_tweeted_at = NOW()`.
3.  **LinkedIn (`linkedin_bot.py`)**: Idéntico flujo. Sube la tarjeta y publica a través de la API de UGC Posts de LinkedIn (`https://api.linkedin.com/v2/ugcPosts`) para páginas de empresa o perfiles personales.
4.  **Mastodon (`mastodon_bot.py`)**: Toot de texto directo a la instancia especificada (por defecto `mastodon.social`).
5.  **Fallback de Contenido**: Si no hay ofertas nuevas que difundir, los bots de Twitter, LinkedIn y Mastodon seleccionan al azar un artículo formativo del blog (ej. *"Guía de salarios para programadores en España (2026)"*) y lo publican con su respectivo enlace para mantener el algoritmo de las plataformas activo.

---

## 📧 8. Correo Electrónico: Alertas, Onboarding y Newsletter

El subsistema de correo electrónico utiliza la conexión SMTP segura de Gmail (`smtp.gmail.com:587`) para gestionar el ciclo de vida del suscriptor.

### 1. Onboarding de Nuevos Suscriptores (`send_welcome_onboarding.py`)
Cuando un usuario se suscribe, entra en un flujo de bienvenida automatizado de 2 etapas:
*   **Etapa 0 (Inmediata)**: Se le envía el **Email 1** de bienvenida ("¡Te damos la bienvenida a Portal Trabajo IT! 🚀") que incluye hasta 3 ofertas actuales personalizadas de acuerdo a sus tecnologías de interés. El estado en la BD cambia a `onboarding_stage = 1`.
*   **Etapa 1 (A los 4 días)**: Si pasaron al menos 96 horas desde el Email 1, se le envía el **Email 2** ("Recursos recomendados y calculadora de salarios"), el cual contiene enlaces para medir su salario medio y plantillas de CV optimizadas contra filtros ATS. El estado en la BD cambia a `onboarding_stage = 2` (completado).

### 2. Alertas Diarias/Semanales Personalizadas (`send_custom_alerts.py`)
*   Se ejecuta de forma periódica en busca de suscriptores con `frequency = 'daily'` (con más de 23 horas desde la última alerta) o `frequency = 'weekly'` (con más de 6 días).
*   Realiza una consulta a la BD cruzando las keywords de interés (`tech_keywords` y `location_pref`) del usuario contra las ofertas indexadas en las últimas 24h (para diarias) o 7 días (para semanales). Si hay vacantes coincidentes, envía un correo personalizado con la lista de ofertas (hasta 8).

### 3. Alertas Destacadas Instantáneas (`send_instant_featured_alerts.py`)
*   Si una empresa publica una oferta destacada de pago (`is_featured = TRUE` y `last_instant_alert_sent_at IS NULL`), este script se despierta, busca todos los suscriptores cuyas keywords coincidan con el título del empleo destacado y les envía una alerta urgente inmediata.

### 4. Newsletter Resumen Semanal (`mailer.py`)
*   Se ejecuta todos los lunes por la mañana.
*   Agrupa las vacantes creadas en los últimos 7 días clasificadas por bloques temáticos con un límite de 6 ofertas por categoría.
*   **Estructura del Email**:
    1.  *Bloque Personalizado*: Muestra primero hasta 3 ofertas específicas para el usuario según sus keywords registradas.
    2.  *Bloques Generales*: Listado ordenado por tecnologías (Backend, Frontend, etc.).
    3.  *Enlaces de Monetización/Afiliados*: Cursos recomendados de Udemy (Bootcamp), plantillas de CV de afiliado y redirecciones a la calculadora de salarios.
    4.  *Pixel de Tracking*: Inyecta una imagen invisible `<img src=".../api/track-open?email=...&campaign=..." width="1" height="1" style="display:none;" />` que registra la apertura en la tabla `email_tracking`.

---

## 🌐 9. Frontend de Next.js y SEO Programático

El frontend está desarrollado bajo Next.js 15 y el App Router. Está altamente optimizado para el posicionamiento orgánico en buscadores (SEO).

### Lógica de Enrutamiento y SEO Programático (`/trabajos/[sector]`)
La ruta `/trabajos/[sector]/page.tsx` es el motor de indexación masivo del portal.
*   **Parser de Parámetros (`parseSector`)**: Descompone dinámicamente un slug compuesto en sus variables de búsqueda:
    *   *Modalidad*: Si contiene `-hibrido` (ej. `react-hibrido`), activa el filtro de teletrabajo parcial.
    *   *Ubicación*: Busca el delimitador `-en-` para extraer la ciudad (ej. `python-en-madrid` ➔ ciudad: `madrid`) o el sufijo `-remoto` (ej. `vue-remoto` ➔ ciudad: `remoto`).
    *   *Experiencia*: Compara el final del slug con sufijos clave: `-junior`, `-senior`, `-sin-experiencia`.
    *   *Tecnología/Categoría*: Lo restante se mapea a palabras clave tecnológicas (React, Node, Java...) o categorías globales de la base de datos (Backend, Frontend, Data...).
*   **Estrategia de Fallback en Casos Vacíos (`getFallbackJobs`)**:
    Si una combinación muy específica no arroja resultados (ej. *Angular Junior en Sevilla* tiene 0 ofertas), el sistema ejecuta una estrategia de cascada para no mostrar una pantalla vacía (lo cual daña el rebote y la indexación):
    1.  Muestra ofertas de la misma tecnología en modalidad 100% remota.
    2.  Si no hay, muestra ofertas de esa tecnología a nivel nacional (otras ciudades).
    3.  Si no hay, muestra ofertas generales del sector IT más recientes.
    *   *Visual*: Muestra un banner de color ámbar alertando al usuario de que se está aplicando una búsqueda alternativa recomendada.
*   **Generación Dinámica de Sitemap (`app/sitemap.ts`)**:
    Debido a que el portal cuenta con miles de empleos activos e infinitas combinaciones de SEO programático, el archivo `sitemap.ts` divide las URLs en 4 sitemaps dinámicos usando la capacidad nativa de Next.js:
    *   `sitemap 0`: Páginas estáticas base, artículos del blog y combinaciones activas calculadas sobre las últimas 8,000 ofertas (ej. si hay ofertas reales de React en Madrid, añade `/trabajos/react-en-madrid` al sitemap automáticamente).
    *   `sitemap 1` & `sitemap 2`: Ofertas de empleo indexables (Sitemap 1: ofertas 1-8000; Sitemap 2: ofertas 8001-16000).
    *   `sitemap 3`: Directorio indexable de empresas extraídas dinámicamente de la base de datos (`SELECT DISTINCT company`).
*   **Redirección Permanente (`permanentRedirect`)**:
    La ruta canónica de cada oferta es `/job/[slug]-[id]`. Si el usuario o un rastreador web intenta ingresar a una URL antigua o con slug incorrecto (ej. `/job/[id]`), la página `JobPage` calcula el slug canónico actual y efectúa un redireccionamiento HTTP 301 (`permanentRedirect`), unificando la fuerza del enlace (Link Juice).
*   **Enlazado Interno Automático (`autoLinkDescription`)**:
    Al renderizar la descripción del puesto, el frontend busca palabras clave tecnológicas populares (como React, AWS, TypeScript) y les añade dinámicamente un enlace `<a>` hacia su respectiva página programática de `/trabajos/[slug]`. Esto distribuye la autoridad de PageRank de forma interna automáticamente.
*   **Desindexación Automática de Ofertas Expiradas**:
    Si una oferta de empleo tiene más de 30 días de antigüedad o su columna `is_active` es `0`, el componente de la página inyecta la directiva de cabecera `robots: { index: false }` para que Google la desindexe. Adicionalmente, muestra un banner superior recomendando al usuario buscar alternativas activas.

---

## 💳 10. Monetización: Stripe y AdSense

El portal se monetiza mediante ofertas patrocinadas de empresas y anuncios automáticos de AdSense.

### Embudo de Publicación Destacada (Stripe)
*   **Creación del Checkout (`/api/checkout/route.ts`)**: Cuando un reclutador crea una oferta destacada, el frontend envía los datos a esta API. La oferta se guarda temporalmente en la BD con `is_active = FALSE` y `is_featured = FALSE`. A continuación, se crea una sesión de pago en Stripe por valor de **39.00 EUR**, inyectando el UUID de la oferta en la clave `metadata: { jobId: ... }`. La API responde con la URL del Checkout de Stripe.
*   **Webhook de Confirmación (`/api/webhooks/stripe/route.ts`)**: Al completarse el pago, Stripe realiza una llamada POST segura al webhook. El script verifica la firma con el `STRIPE_WEBHOOK_SECRET`, recupera el `jobId` de la metadata y activa la oferta destacándola con:
    ```sql
    UPDATE jobs SET is_active = TRUE, is_featured = TRUE WHERE id = $1
    ```

### Optimización de AdSense
*   Los anuncios automáticos de AdSense están configurados en Next.js usando la librería oficial `@next/third-parties/google` para cargarlos de forma asíncrona sin bloquear el hilo principal (minimizando penalizaciones en PageSpeed / Core Web Vitals).
*   Los anuncios de banner se cargan dinámicamente mediante el componente `AdBanner.tsx` y se sitúan de manera estratégica en el listado de inicio (después de las ofertas 3 y 15) y en la barra lateral del detalle del puesto.

---

## ⚙️ 11. Variables de Entorno, Configuración y Despliegues

### Variables del Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/bd   # Leída por el shim
EMAIL_USER=tu-correo@gmail.com                              # Cuenta SMTP
EMAIL_PASSWORD=contraseña-aplicacion-gmail                   # Contraseña segura app
TELEGRAM_TOKEN=token-de-telegram                            # Token de API Bot
TELEGRAM_CHANNEL=@PortalDeTrabajo                           # Canal general
FRONTEND_URL=https://portalempleoit.com                     # URL para generar enlaces
CRON_SECRET=token-secreto-cron                              # Para autorizar desindexaciones
```

### Variables del Frontend (`frontend/.env.local`)
```env
DATABASE_URL=postgresql://...                      # Solo si se conecta directo (desarrollo local)
DB_PROXY_URL=https://dominio.com/db_proxy.php     # URL del proxy HTTP de producción
DB_PROXY_TOKEN=a6f021f1d19d675b8e998a44d187764d    # Token para comunicarse con db_proxy
GOOGLE_INDEXING_CREDENTIALS='{"type": ...}'        # JSON de cuenta de servicio de Google
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...           # Cliente ID de Google AdSense
STRIPE_SECRET_KEY=sk_live_...                      # Llave privada de Stripe
STRIPE_WEBHOOK_SECRET=whsec_...                    # Secreto para validar firmas webhook
CRON_SECRET=token-secreto-cron                     # Firma de autorización para bots python
```

### Flujo de Despliegue (Deployments)

> [!IMPORTANT]
> **Arquitectura en producción activa: Vercel (Frontend) + Raiola Networks (Backend y Base de Datos).** Esta es la única metodología de despliegue vigente.

1.  **✅ ACTIVO — Arquitectura Distribuida (Vercel + Raiola Networks)**:
    *   *Frontend (Vercel)*: Sincronizado automáticamente con Vercel al hacer push en la rama `main`. No requiere intervención manual.
    *   *Backend (Raiola)*: La GitHub Action `deploy_cpanel.yml` se dispara al hacer push. Genera un directorio de distribución limpio, eliminando entornos virtuales (`venv`), módulos de node (`node_modules`) y archivos `.env` de desarrollo, y lo sube al servidor Raiola mediante FTP seguro.
    *   *Base de Datos (Raiola)*: MySQL local en el servidor Raiola. No se despliega; es persistente y se gestiona desde cPanel.

2.  **⚠️ OBSOLETO — Arquitectura VPS Unificada (PM2 + Nginx)**:
    *   Esta opción ya **no está en uso**. Se documenta únicamente por razones históricas.
    *   El script de shell `deploy.sh` y la plantilla `nginx.conf.template` en el root del proyecto son artefactos de esta arquitectura descartada. No deben utilizarse en el flujo de trabajo actual.

---

## 🧹 12. Limpieza de Deuda Técnica y Estado de Obsolescencia

El proyecto ha completado una limpieza intensiva de componentes y dependencias obsoletas:
*   **Unificación de Clientes**: Se eliminó por completo el uso directo de Supabase SDK y la librería `pg` del frontend. Todo el frontend consulta a través del pool de conexiones unificado en `frontend/lib/db.ts` (que se conecta a MySQL directamente o vía `db_proxy.php`).
*   **Limpieza de Archivos**: Se eliminaron los scripts redundantes de duplicación de rutas y componentes huérfanos. Para conocer la lista de archivos purgados e inactivos, consulte el reporte técnico completo en [analisis_archivos_obsoletos.md](file:///home/raul/proyecto_empleo/analisis_archivos_obsoletos.md).
