# 🔍 Análisis Completo del Proyecto - Portal Empleo IT

## Resumen Ejecutivo

El proyecto está compuesto por un **frontend en Next.js** (desplegado en Vercel) y un **backend en Python** (ejecutado via GitHub Actions). Tras revisar todos los archivos, he identificado **varias capas de código obsoleto** producto de diferentes iteraciones y experimentos durante el desarrollo.

---

## 🚨 ARCHIVOS OBSOLETOS / SIN USO

### Categoría 1 — Duplicados Críticos (ELIMINAR con seguridad)

Estos archivos duplican funcionalidad que ya existe en una versión más nueva y activa.

| Archivo | Problema | Reemplazado por |
|---|---|---|
| `src/scraper.py` | Scraper antiguo que usa **Supabase SDK**. El backend migró a **psycopg2 + PostgreSQL directo**. No lo llama nadie en el flujo actual. | `backend/scrapers/tecnoempleo.py` + `backend/scraper_spain.py` |
| `frontend/app/oferta/[id]/page.tsx` | Ruta `/oferta/[id]` duplicada. El proyecto usa `/job/[id]` como ruta canónica definitiva. Esta versión usa Supabase SDK (abandonado en el frontend) y no está en el sitemap. | `frontend/app/job/[id]/page.tsx` |
| `frontend/app/privacidad/page.tsx` | Página de privacidad mínima (13 líneas) y desactualizada. La versión completa y funcional está en `/privacy`. | `frontend/app/privacy/page.tsx` |

---

### Categoría 2 — Componentes Huérfanos (no se importan en ningún sitio)

| Archivo | Problema |
|---|---|
| `frontend/components/Newsletter.tsx` | **Nunca se importa ni usa** en ninguna página. Existe `SubscribeForm.tsx` que cubre la misma función y sí está en uso. |
| `frontend/components/Footer.tsx` | **Nunca se importa**. No está en `layout.tsx` ni en ninguna página. El footer del proyecto está hardcodeado en la ruta `/trabajos/informatica-tecnologia`. |

---

### Categoría 3 — Scrapers sin llamar (Backend)

El `backend/main.py` importa solo 5 scrapers: `wwr`, `remotive`, `jobfluent`, `remoteok`, `workingnomads`. El resto de la carpeta `backend/scrapers/` no se llama desde ningún sitio activo:

| Archivo | Estado |
|---|---|
| `backend/scrapers/tecnoempleo.py` | ❌ **No se importa en `main.py`**. Hay 2 versiones alternativas de este scraper (`scraper_spain.py` en raíz y `job_spider.py` en Scrapy). |
| `backend/scrapers/getonboard.py` | ❌ **No se importa en ningún script activo**. |
| `backend/scrapers/manfred.py` | ❌ **No se importa en ningún script activo**. |
| `backend/scrapers/ticjob.py` | ❌ **No se importa en ningún script activo**. |

---

### Categoría 4 — Workflows de GitHub Actions Duplicados

Hay **6 workflows** para tareas que en la práctica son 2 o 3. Hay conflictos graves:

| Archivo | Problema |
|---|---|
| `.github/workflows/update_jobs.yml` | Ejecuta `src/scraper.py` (el scraper obsoleto de Supabase de la Categoría 1). Dependencias distintas, no instala `requirements.txt`. **Obsoleto.** |
| `.github/workflows/daily_scrape.yml` | Ejecuta `python main.py` (scraper sin Telegram). Duplica lo que hace `newsletter.yml`. |
| `.github/workflows/newsletter.yml` | Ejecuta `main.py` + `telegram_bot.py`. Solapa con `scrape_cron.yml`. |
| `.github/workflows/scrape_cron.yml` | Ejecuta `run_all.py` (el más completo: tecnoempleo + infoempleo + telegram). Solapa con los anteriores. |
| `.github/workflows/cron.yaml` | Usa **Scrapy** (`scrapy crawl job_spider`) + `mailer.py`. Es un tercer sistema paralelo e independiente. |
| `.github/workflows/newsletter_cron.yml` | ⚠️ Llama a `python email_sender.py` que **NO EXISTE** en el backend. Fallará siempre. |

> **Consecuencia**: Si todos los workflows están activos, el scraper se lanza múltiples veces en las mismas horas, insertando duplicados y consumiendo minutos de Actions innecesariamente.

---

### Categoría 5 — Scripts de Utilidad / One-Shot (no son código de producción)

Estos scripts se usan manualmente para depurar o configurar. No son parte del flujo productivo, pero tampoco son un problema si se dejan. Lo menciono para que seas consciente:

| Archivo | Propósito |
|---|---|
| `backend/check_db.py` | Script de diagnóstico para ver columnas de la BD. Solo para depuración. |
| `backend/check_subscribers.py` | Muestra la lista de suscriptores. Solo para depuración. |
| `backend/setup_newsletter.py` | Crea la tabla `subscribers` en la BD. One-shot de setup inicial. |

---

### Categoría 6 — Archivos Huérfanos del Frontend (`public/`)

| Archivo | Problema |
|---|---|
| `frontend/public/next.svg` | Imagen por defecto del scaffold de Next.js. No se usa en ninguna página. |
| `frontend/public/vercel.svg` | Ídem. |
| `frontend/public/file.svg` | Ídem. |
| `frontend/public/globe.svg` | Ídem. |
| `frontend/public/window.svg` | Ídem. |

---

### Categoría 7 — Directorios Vacíos / Estructura Fantasma

| Ruta | Problema |
|---|---|
| `backend/frontend/` | Carpeta `frontend` **dentro del backend** con solo `app/api/subscribe/` vacío. No tiene ningún archivo de código. Probablemente un experimento abandonado. |
| `frontend/app/sitemap.xml/` | Directorio vacío. Next.js genera el sitemap automáticamente desde `sitemap.ts`. Esta carpeta no tiene ningún archivo ni propósito. |

---

### Categoría 8 — Archivos de Texto Grandes (Probable basura de exportación)

| Archivo | Tamaño | Problema |
|---|---|---|
| `frontend_completo.txt` | **7.97 MB** | Parece un volcado completo del frontend. No tiene ningún uso funcional en el proyecto. |
| `backend_completo.txt` | 5.3 KB | Ídem para el backend. |

---

## 📊 Mapa de Flujos Activos (lo que SÍ funciona)

Para entender qué es obsoleto, aquí está lo que **sí se usa**:

```
GitHub Actions (scrape_cron.yml o newsletter.yml)
  └─> backend/run_all.py
        ├─> backend/main.py (scrapers: wwr, remotive, jobfluent, remoteok, workingnomads)
        ├─> backend/scraper_spain.py (tecnoempleo)
        ├─> backend/scraper_infoempleo.py (stratos RSS)
        └─> backend/telegram_bot.py

GitHub Actions (newsletter_cron.yml) → ⚠️ ROTO (llama a email_sender.py que no existe)
GitHub Actions (cron.yaml) → backend/job_aggregator (Scrapy) + backend/mailer.py

Frontend (Vercel - Next.js):
  / → app/page.tsx (lista de trabajos, usa pg directo)
  /job/[id] → app/job/[id]/page.tsx (detalle, usa pg directo) ← RUTA CANÓNICA
  /trabajos/informatica-tecnologia → page.tsx (usa supabase SDK)
  /trabajos/[sector] → page.tsx (usa supabase SDK)
  /privacy → app/privacy/page.tsx ← PÁGINA COMPLETA
  /cookies → app/cookies/page.tsx
  /api/subscribe → API route (usa pg directo)
  actions.ts → subscribeUser (usa supabase SDK)
```

> ⚠️ **Inconsistencia de cliente de BD**: El frontend usa tanto `pg` (PostgreSQL directo) como el SDK de Supabase en distintas páginas. Esto no es obsolescencia, pero es una deuda técnica.

---

## ✅ Resumen de Acciones Recomendadas

| Prioridad | Acción | Archivos afectados |
|---|---|---|
| 🔴 Alta | Eliminar | `src/scraper.py`, `frontend_completo.txt`, `backend_completo.txt` |
| 🔴 Alta | Eliminar | `frontend/app/oferta/[id]/page.tsx`, `frontend/app/privacidad/page.tsx` |
| 🟠 Media | Eliminar | `frontend/components/Newsletter.tsx`, `frontend/components/Footer.tsx` |
| 🟠 Media | Eliminar o consolidar | `backend/scrapers/tecnoempleo.py`, `getonboard.py`, `manfred.py`, `ticjob.py` |
| 🟠 Media | Eliminar | `.github/workflows/update_jobs.yml`, `daily_scrape.yml` |
| 🟠 Media | Corregir o eliminar | `.github/workflows/newsletter_cron.yml` (llama a `email_sender.py` que no existe) |
| 🟡 Baja | Eliminar | `frontend/public/*.svg` (5 SVGs por defecto de Next.js) |
| 🟡 Baja | Eliminar | `backend/frontend/` (directorio fantasma), `frontend/app/sitemap.xml/` (directorio vacío) |
| 🟡 Baja | Decidir | `backend/check_db.py`, `check_subscribers.py`, `setup_newsletter.py` (scripts de utilidad) |

---

*Análisis realizado el 15 de Abril de 2026*
