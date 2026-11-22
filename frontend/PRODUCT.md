# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Candidatos IT (Primario):** Desarrolladores de software (Frontend, Backend, Fullstack, Mobile), ingenieros de datos/IA, DevOps/SRE y especialistas en ciberseguridad en España y Latinoamérica que buscan empleo tecnológico verificado en España o 100% remoto.
- **Reclutadores Técnicos y Empresas (Secundario B2B):** Startups, consultoras y departamentos de ingeniería que publican vacantes, patrocinan ofertas destacadas y consultan métricas de impresiones/clics en su panel.

## Product Purpose
Agregador e infraestructura de inteligencia laboral tecnológica en España. Indexa, limpia, deduplica y clasifica automáticamente cada 6 horas ofertas de empleo IT, extrayendo stack tecnológico, modalidad (remoto/híbrido/presencial), nivel de experiencia y horquillas salariales para ofrecer búsqueda sin ruido y transparencia retributiva.

## Positioning
A diferencia de los portales generalistas (InfoJobs, LinkedIn) donde las ofertas tecnológicas se mezclan con roles no técnicos y carecen de contexto salarial, Portal Trabajo IT es 100% específico para ingeniería informática y cruza cada vacante en tiempo real con percentiles salariales (P25/P50/P75), comparativas entre stacks y distribución geográfica por comunidad autónoma.

## Operating Context
Consultado diariamente en sesiones rápidas de escaneo (desde escritorio con atajos de teclado `/` o desde móvil vía alertas de Telegram, newsletter y push web) y en sesiones profundas de investigación salarial antes de entrevistas o negociaciones de sueldo.

## Capabilities and Constraints
- **Stack Técnico:** Next.js 15 (App Router, React 19, Server Components + ISR), Tailwind CSS v4, PostgreSQL/MySQL (`pool`), Stripe Checkout para planes B2B/B2C.
- **Restricciones SEO Innegociables:** Mantener intactas todas las URLs canónicas, rutas programáticas pSEO (`/trabajos/[sector]`, `/trabajo-[ciudad]`, `/salarios/[tecnologia]/[ciudad]`, `/comparar/[slug]`), schemas JSON-LD (`JobPosting`, `Occupation`, `Dataset`, `FAQPage`, `BreadcrumbList`, `BlogPosting`), sitemaps XML y soporte multi-idioma (`es`, `en`, `ca`, `eu`).
- **Cumplimiento Legal (RGPD / AEPD / LSSI / TRLGDCU):** Google Consent Mode v2 denegado por defecto; carga diferida de AdSense/GA4/OneSignal condicionada al consentimiento; avisos de primera capa RGPD y transparencia retributiva (Directiva UE 2023/970).

## Brand Commitments
- **Nombre:** Portal Trabajo IT.
- **Voz (`copy-voice.md`):** `technical-dry` — exacta, directa, basada en datos reales de la base de datos, sin hipérboles corporativas, sin emojis decorativos en titulares y con admisión honesta cuando una oferta no publica salario ("Consultar con la empresa").

## Evidence on Hand
- Base de datos en tiempo real de vacantes activas (`jobs`), empresas (`companies`), reseñas (`company_reviews`) y suscriptores (`subscribers`).
- Estadísticas calculadas en vivo: conteo total de vacantes, distribución por CCAA, percentiles salariales P10–P90 por tecnología y ciudad, tasa de teletrabajo y artículos editoriales en `lib/blog.ts`.

## Product Principles
1. **El salario y el stack mandan:** En toda tarjeta o vista de oferta, las tecnologías detectadas, la modalidad y la banda salarial (o su percentil de mercado) tienen prioridad visual absoluta.
2. **Velocidad de herramienta para desarrolladores:** Los flujos de búsqueda, filtrado y navegación por teclado responden al instante (0ms de animación en acciones repetitivas).
3. **Monetización honesta e integrada:** Los anuncios y recomendaciones formativas comparten la cuadrícula y la sobriedad tipográfica del portal, etiquetados siempre con precisión (`Patrocinado`) y con reserva de espacio estático (`CLS = 0`).
4. **Resiliencia ante datos sucios del mundo real:** Títulos importados de 140 caracteres, ubicaciones múltiples, empresas sin logo o salarios nulos nunca rompen la retícula.

## Accessibility & Inclusion
WCAG 2.1 AA como suelo obligatorio (contraste ≥ 7:1 en texto de lectura y ≥ 4.5:1 en metadatos `--text-muted`, navegación completa por teclado con `:focus-visible` inmediato de 2px, objetivos táctiles ≥ 44×44px, soporte `prefers-reduced-motion: reduce`).
