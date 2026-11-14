# 04. Auditoría de Legalidad Digital, RGPD y Cumplimiento Normativo (España y UE)

> **Alcance**: LSSI-CE (Ley 34/2002), RGPD (Reglamento UE 2016/679) y LOPDGDD (LO 3/2018), Directiva ePrivacy y Guía de Cookies AEPD, Propiedad Intelectual y Minería de Textos y Datos (Directiva UE 2019/790 y TRLPI), Reglamento de Servicios Digitales (DSA 2022/2065), AI Act (Reglamento 2024/1689), Directiva de Transparencia Retributiva (2023/970), Ley 11/2023 de Accesibilidad y Defensa de Consumidores (TRLGDCU).  
> **Volumen**: 35 hallazgos (`LEG-001` a `LEG-035`).

---

## Bloque I: LSSI-CE, Aviso Legal, Consumo y Contratación Electrónica

### [LEG-001] Ocultación del NIF/CIF, identidad completa del titular y domicilio físico en Aviso Legal y pies de correo

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: centralizados datos del titular en `frontend/lib/legalConfig.ts` y `backend/logic/legal.py`, eliminando `"Consulte Aviso Legal"` en `mailer.py` y `send_custom_alerts.py`).
- **Ubicación exacta**: `frontend/app/aviso-legal/page.tsx` y `backend/mailer.py` (línea 491)
- **Diagnóstico del Problema**:
  El Art. 10.1 de la **LSSI-CE** (Ley 34/2002) obliga a todo prestador de servicios de la sociedad de la información con actividad económica (el portal incluye publicidad AdSense, enlaces de afiliación y venta B2B/B2C vía Stripe) a ofrecer de forma permanente, fácil, directa y gratuita su nombre o denominación social, **domicilio social completo**, **NIF/CIF**, datos de contacto directo y, en su caso, datos de inscripción registral. Actualmente `frontend/app/aviso-legal/page.tsx` omite la identificación completa exigible y `backend/mailer.py` (línea 491) inserta un texto genérico evasivo: `"NIF: Consulte Aviso Legal · Madrid, España"`.
- **Riesgo o Impacto**:
  Infracción administrativa grave o leve continuada bajo los arts. 38–39 LSSI-CE (sanciones de hasta 30.000 € por infracción leve o hasta 150.000 € si concurre reiteración/relevancia), además de nulidad o invalidez de condiciones generales de contratación y bloqueo por parte de pasarelas de pago o verificaciones KYC de Stripe.
- **Solución Óptima Propuesta**:
  1. Incorporar de manera visible y permanente en `frontend/app/aviso-legal/page.tsx`, `terminos/page.tsx`, `privacy/page.tsx` y en el pie de todas las plantillas de correo (`mailer.py` y `send_*.py`): razón social o nombre completo del titular, NIF/CIF exacto, domicilio completo en España, correo electrónico de contacto y número de Registro Mercantil (si es persona jurídica).

### [LEG-002] Incoherencias jurídicas entre `aviso-legal`, `privacy`, `terminos` y comunicaciones transaccionales

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: unificados `aviso-legal/page.tsx`, `terminos/page.tsx`, `privacy/page.tsx` mediante `LEGAL_CONFIG`, y correos mediante `get_legal_footer_identity()`).
- **Ubicación exacta**: `frontend/app/aviso-legal/page.tsx`, `frontend/app/privacy/page.tsx`, `frontend/app/terminos/page.tsx`, `backend/mailer.py`
- **Diagnóstico del Problema**:
  Los distintos textos legales del portal presentan discrepancias y remisiones circulares en la identificación del responsable del tratamiento, las finalidades exactas de suscripciones gratuitas frente a planes premium, el fuero aplicable y los canales reales de atención de derechos. Asimismo, algunos scripts de envío (`send_welcome_onboarding.py`, `send_custom_alerts.py`, `mailer.py`) mantienen pies legales desalineados entre sí.
- **Riesgo o Impacto**:
  Incumplimiento del principio de transparencia (Art. 12 RGPD: información clara, concisa y coherente) y pérdida de validez de cláusulas de exención de responsabilidad ante consumidores (Art. 80 TRLGDCU).
- **Solución Óptima Propuesta**:
  1. Unificar las constantes legales del titular (denominación, NIF, dirección, email DPO/RGPD, jurisdicción) en un único módulo de configuración legal consumido tanto por las páginas Next.js como por la plantilla base de emails.

### [LEG-003] Referencia obsoleta a la plataforma europea de resolución de litigios en línea (EU ODR) en `terminos/page.tsx`

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: retirada referencia a `ec.europa.eu/consumers/odr` en `terminos/page.tsx` y `aviso-legal/page.tsx`, sustituida por canales propios y ADR Ley 7/2017).
- **Ubicación exacta**: `frontend/app/terminos/page.tsx`
- **Diagnóstico del Problema**:
  Los Términos y Condiciones mantienen el enlace obligatorio antiguo a la plataforma europea de resolución de litigios en línea (`ec.europa.eu/consumers/odr`). Sin embargo, la Comisión Europea procedió al cierre definitivo de dicha plataforma ODR conforme al **Reglamento (UE) 2024/3228**, quedando derogado el Reglamento (UE) 524/2013 y suprimiéndose la obligación de enlazar a una web clausurada.
- **Riesgo o Impacto**:
  Proporcionar información jurídica desactualizada y enlaces rotos o inoperativos a consumidores españoles y europeos como supuesto mecanismo de resolución extrajudicial de conflictos.
- **Solución Óptima Propuesta**:
  1. Retirar el enlace obsoleto a la plataforma EU ODR en `frontend/app/terminos/page.tsx` y sustituirlo por la información actualizada de canales propios de reclamación al consumidor, Juntas Arbitrales de Consumo competentes en España y, cuando corresponda, entidades acreditadas bajo la Directiva ADR (2013/11/UE) / Ley 7/2017.

### [LEG-004] Discrepancia de precios (`990` céntimos vs `"9.99€"`) y ausencia de desglose claro de IVA previo al pago

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: unificado importe a `999` céntimos / `9.99` EUR en `checkout/report/route.ts` y `verify/route.ts`, desglose explícito de IVA en descripciones Stripe y soporte `STRIPE_AUTOMATIC_TAX`).
- **Ubicación exacta**: `frontend/app/api/checkout/report/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/checkout/premium-candidate/route.ts`, `frontend/app/api/checkout/route.ts` y pantallas de precios asociadas
- **Diagnóstico del Problema**:
  Las rutas de checkout muestran inconsistencias entre el importe cobrado realmente en Stripe (`990` céntimos = 9,90 EUR en código frente a textos visibles que anuncian `"9.99€"`) y omiten habilitar recaudación automática transparente de impuestos (`automatic_tax` / desglose explícito de base imponible + 21% IVA español o inversión del sujeto pasivo en empresas UE).
- **Riesgo o Impacto**:
  Infracción del Art. 20.1.c y Art. 60.2 del **TRLGDCU** (obligación de mostrar el precio final completo incluidos todos los impuestos antes de contratar) y del Art. 27 LSSI-CE, además de reclamaciones por diferencias de cargo entre lo ofertado y lo cobrado.
- **Solución Óptima Propuesta**:
  1. Unificar los importes en centavos y las etiquetas visuales desde una única tabla fuente de verdad de productos/tarifas (corrigiendo `990` vs `9,99€` / `9,90€`).
  2. Indicar expresamente si los precios B2C llevan "IVA incluido" y habilitar `automatic_tax` + `tax_id_collection` en Stripe Checkout para B2B.

### [LEG-005] Falta de consentimiento expreso de renuncia al derecho de desistimiento en contenidos digitales instantáneos (Art. 103.m TRLGDCU)

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: añadido `consent_collection: { terms_of_service: 'required' }` en todas las sesiones Stripe Checkout y validación de `waiver_accepted` en `checkout/report/route.ts`).
- **Ubicación exacta**: Flujos de compra hacia `frontend/app/api/checkout/report/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/checkout/premium-candidate/route.ts`
- **Diagnóstico del Problema**:
  Conforme a los artículos 102 y 103.m) del **TRLGDCU** (Directiva 2011/83/UE sobre derechos de los consumidores), todo consumidor en la UE dispone de 14 días naturales de derecho de desistimiento en compras online, **salvo** en el suministro de contenido digital no prestado en soporte material cuando la ejecución haya comenzado con **previo consentimiento expreso del consumidor y con el conocimiento por su parte de que en consecuencia pierde su derecho de desistimiento**. Ninguno de los flujos de compra de informes descargables o acceso digital instantáneo recaba esa casilla expresa antes de iniciar Stripe/PayPal.
- **Riesgo o Impacto**:
  El comprador puede descargar el informe salarial o disfrutar el servicio durante 13 días y exigir legalmente el reembolso íntegro ejerciendo su derecho de desistimiento (e incluso ampliar el plazo legal a 12 meses adicionales según Art. 105 TRLGDCU por falta de información precontractual).
- **Solución Óptima Propuesta**:
  1. Activar `consent_collection: { terms_of_service: 'required' }` en Stripe Checkout y recabar mediante checkbox no premarcado previo al pago el consentimiento expreso de ejecución inmediata con pérdida explícita del derecho de desistimiento (Art. 103.m TRLGDCU), conservando prueba temporal en BD/Stripe.

### [LEG-006] Ausencia de emisión automática de facturas conformes al RD 1619/2012 en pasarelas de pago

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: habilitado `invoice_creation: { enabled: true }` junto a `billing_address_collection: 'required'` y `tax_id_collection: { enabled: true }` en los checkouts de pago único).
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/checkout/report/route.ts`
- **Diagnóstico del Problema**:
  En sesiones de pago único (`mode: 'payment'`) para ofertas patrocinadas B2B o venta de informes, Stripe no genera factura formal con numeración correlativa, NIF emisor/receptor y desglose de IVA a menos que se habilite explícitamente `invoice_creation: { enabled: true }` junto a la recopilación de datos fiscales del cliente (`tax_id_collection`).
- **Riesgo o Impacto**:
  Incumplimiento de obligaciones tributarias de facturación (RD 1619/2012) en España y obstáculos para empresas contratantes de ofertas patrocinadas que requieren factura deducible.
- **Solución Óptima Propuesta**:
  1. Configurar `invoice_creation: { enabled: true }` y `billing_address_collection: 'required'` + `tax_id_collection: { enabled: true }` en los flujos Stripe de pago único y garantizar el envío automático del justificante/factura PDF al correo de facturación.

### [LEG-007] Afirmaciones cuantitativas falsas o simuladas (`8.700 ingenieros`, `140/110/85/60/75`, `12450`) constituyendo publicidad engañosa

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: eliminados fallbacks y afirmaciones ficticias `12450` y `8.700` en `Footer.tsx`, `publicidad/page.tsx`, `precios/page.tsx`, `PublishForm.tsx`, `pricingPlans.ts`, `page.tsx` y `checkout/newsletter/route.ts`).
- **Ubicación exacta**: `frontend/app/api/checkout/newsletter/route.ts` (`8.700 ingenieros`), `frontend/app/api/widget/vacantes-count/route.ts` (líneas 93–99: `140, 110, 85, 60, 75`) y `frontend/components/Footer.tsx` (`12450`)
- **Diagnóstico del Problema**:
  Diversos componentes orientados a captar suscriptores de pago, anunciantes B2B o sitios terceros muestran cifras estáticas inventadas o simuladas cuando falla la consulta (o de forma fija en el copy promocional de pago) sin corresponderse con métricas auditables reales de la base de datos.
- **Riesgo o Impacto**:
  Vulneración de la **Ley 3/1991 de Competencia Desleal** (Art. 5 actos de engaño) y **Ley 34/1988 General de Publicidad** al inducir la contratación de suscripciones o patrocinios basándose en audiencias o volúmenes de vacantes inexactos.
- **Solución Óptima Propuesta**:
  1. Sustituir todas las cifras promocionales y contadores públicos por agregaciones SQL reales cacheadas con fecha de corte transparente, eliminando cualquier número hardcodeado ficticio tanto en copias comerciales como en fallbacks de API.

### [LEG-008] Falta de identificación inequívoca como publicidad o enlace patrocinado en bloques afiliados (`CourseAffiliate.tsx` y `AdBanner.tsx`)

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: añadido etiquetado visible `"Patrocinado · Enlace de afiliación"` en `CourseAffiliate.tsx` y `AdBanner.tsx`, renombrando `"Mejorar CV"` a `"Ver cursos en Udemy"`).
- **Ubicación exacta**: `frontend/components/CourseAffiliate.tsx` (líneas 1–122) y `frontend/components/AdBanner.tsx` (líneas 1–800)
- **Diagnóstico del Problema**:
  El **Art. 20 de la LSSI-CE** y la Ley General de Publicidad exigen que toda comunicación comercial, enlace de afiliación o contenido patrocinado sea claramente identificable como tal desde el primer vistazo (*"Publicidad"* / *"Enlace afiliado"* / *"Patrocinado"*). `CourseAffiliate.tsx` presenta un botón llamado `"Mejorar CV"` que redirige silenciosamente a una URL afiliada de Udemy (`trk.udemy.com/9VMAEj`) sin etiquetado publicitario claro, y `AdBanner.tsx` mezcla recomendaciones editoriales con afiliación de Coursera (`1164968/14726`).
- **Riesgo o Impacto**:
  Calificación como publicidad encubierta sancionable bajo LSSI-CE y Ley de Competencia Desleal (Art. 26), además de engaño al consumidor sobre la naturaleza del enlace "Mejorar CV".
- **Solución Óptima Propuesta**:
  1. Etiquetar visiblemente cada módulo de `CourseAffiliate.tsx`, `AdBanner.tsx` y toda oferta destacada de pago con distintivo claro (`"Patrocinado"` / `"Enlace de afiliación — podemos recibir comisión sin coste para ti"`) y corregir la etiqueta `"Mejorar CV"` para reflejar exactamente el recurso de formación en Udemy.

### [LEG-009] Traba procesal desproporcionada (PoA / eIDAS) en mecanismo de notificación de contenidos ilícitos (DSA Art. 16)

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.1: simplificado el procedimiento de notificación en `aviso-legal/page.tsx` conforme al Art. 16.2 DSA sin exigir apoderamiento notarial ni eIDAS previo).
- **Ubicación exacta**: `frontend/app/aviso-legal/page.tsx`
- **Diagnóstico del Problema**:
  Las cláusulas de `aviso-legal/page.tsx` imponen requisitos formales excesivos (como poderes de representación formalizados o identificación con certificado electrónico cualificado eIDAS) para que un tercero o empresa solicite la retirada de una oferta, marca o contenido presuntamente ilícito o infractor. Esto contraviene el **Art. 16 del Reglamento (UE) 2022/2065 (Digital Services Act - DSA)**, que exige mecanismos de notificación electrónica de fácil acceso, gratuitos y sin trabas desproporcionadas para intermediarios y plataformas online que alojan información de terceros o reseñas.
- **Riesgo o Impacto**:
  Incumplimiento de obligaciones de diligencia debida de la DSA ante la CNMC (Coordinador de Servicios Digitales en España) y pérdida de protección del puerto seguro de exención de responsabilidad ante demoras provocadas por barreras administrativas al reportar infracciones claras.
- **Solución Óptima Propuesta**:
  1. Simplificar el canal de notificación en `aviso-legal/page.tsx` ofreciendo un formulario web ágil o email directo conforme a los 4 elementos mínimos del Art. 16.2 DSA (explicación motivada, URL exacta, nombre/email salvo delitos graves, declaración de buena fe), enviando acuse de recibo automático y resolución motivada sin exigir eIDAS previo para cualquier aviso ordinario.

---

## Bloque II: Protección de Datos (RGPD, LOPDGDD) y Comunicaciones Comerciales (LSSI Art. 21)

### [LEG-010] Envío masivo de correos y bloques promocionales ignorando `marketing_accepted` y registros sin frecuencia (`NULL`/vacío)

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: `mailer.py` exige `frequency = 'weekly'` y `marketing_accepted = TRUE`; `send_custom_alerts.py` excluye `frequency IS NULL` y condiciona el bloque afiliado a `include_marketing`).
- **Ubicación exacta**: `backend/mailer.py` (líneas 1–542) y `backend/send_custom_alerts.py` (líneas 1–302)
- **Diagnóstico del Problema**:
  `backend/mailer.py` selecciona destinatarios usando `(frequency = 'weekly' OR frequency IS NULL OR frequency = '')` sin comprobar la existencia o estado verdadero del campo `marketing_accepted` antes de incluir publicidad, ofertas patrocinadas o enlaces de afiliación comercial dentro del boletín y alertas. Adicionalmente, en el dump real `ecosier2_PortalEmpleo.sql` ni siquiera existen aún las columnas `marketing_accepted` ni `consent_*`.
- **Riesgo o Impacto**:
  Infracción directa del **Art. 21.1 LSSI-CE** (prohibición de comunicaciones comerciales electrónicas no solicitadas ni autorizadas expresamente) y del **Art. 6.1.a RGPD** (falta de base jurídica válida para fines publicitarios distintos de la alerta solicitada), sancionable por la AEPD con multas relevantes incluso por envíos individuales denunciados.
- **Solución Óptima Propuesta**:
  1. Separar estrictamente los correos estrictamente solicitados (alertas transaccionales de empleo elegidas por el usuario, sin publicidad comercial de terceros) frente a boletines con patrocinios/afiliados, exigiendo `marketing_accepted = 1 AND is_active = 1` de forma verificada antes de despachar cualquier bloque promocional.
  2. Excluir registros con `frequency IS NULL` salvo verificación previa de consentimiento expreso documentado.

### [LEG-011] Exposición de correos electrónicos de candidatos en claro dentro de logs persistentes de GitHub Actions

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: verificado uso de `mask_email()` en los 5 scripts de `backend/send_*.py` y añadido enmascarado en `frontend/app/api/unsubscribe/route.ts`).
- **Ubicación exacta**: `backend/send_welcome_onboarding.py` (línea 279), `backend/send_reactivation.py` (línea 216), `backend/send_streak_reminder.py` (línea 239), `backend/send_saved_jobs_reminder.py` (línea 235), `backend/send_referral_notifications.py` (líneas 209 y 231)
- **Diagnóstico del Problema**:
  Cinco scripts automatizados imprimen en consola (`stdout`) las direcciones de correo electrónico completas de los usuarios durante la ejecución de workflows en GitHub Actions (`.github/workflows/weekly_email.yml`, etc.), almacenando datos personales reales en sistemas de registros operativos externos al control directo mínimo necesario y potencialmente visibles según visibilidad/permisos del repositorio.
- **Riesgo o Impacto**:
  Violación de los principios de **integridad y confidencialidad** (Art. 5.1.f RGPD), **minimización de datos** (Art. 5.1.c RGPD) y obligación de medidas técnicas de seguridad (Art. 32 RGPD), constituyendo potencial brecha de datos personales reportable bajo el Art. 33 RGPD si el repositorio o sus logs fueron accesibles externamente.
- **Solución Óptima Propuesta**:
  1. Enmascarar o pseudonimizar inmediatamente todo dato personal antes de escribir en `stdout`/logs (`u***@dominio.com` o `subscriber_id` UUID opaco) en todos los scripts de `backend/`.
  2. Purgar el historial de logs antiguos de GitHub Actions que contengan PII en claro y evaluar alcance ante posible incidente de confidencialidad.

### [LEG-012] Almacenamiento de dump SQL de producción (`ecosier2_PortalEmpleo.sql`) y JSON de migración con PII real en el repositorio

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: verificado que `ecosier2_PortalEmpleo.sql` y `backend/migration_data/` fueron retirados del árbol de trabajo e incluidos en `.gitignore`).
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` (líneas 41, 9554 y resto del fichero, 3.99 MB) y `backend/migration_data/` (`subscribers.json`, `alerts.json`, `jobs.json`, 7.7 MB)
- **Diagnóstico del Problema**:
  El repositorio contiene volcados completos con correos electrónicos reales de usuarios y suscriptores (`raulmate7@gmail.com` en línea 41, `portaldetrabajo1@gmail.com` en línea 9554, y tablas completas en JSON/SQL) mezclados con el código fuente de desarrollo. El Art. 32 RGPD y las guías de desarrollo seguro de la AEPD prohíben explícitamente mantener datos personales reales en entornos de código/desarrollo sin anonimización irreversible ni cifrado adecuado.
- **Riesgo o Impacto**:
  Exposición masiva ante cualquier copia local, acceso de desarrollador externo, sincronización en despliegues o fuga del repositorio, acarreando sanciones graves de la AEPD bajo los arts. 5.1.f, 25 y 32 RGPD y obligación de notificación de brecha a todos los afectados (Art. 34 RGPD).
- **Solución Óptima Propuesta**:
  1. Eliminar inmediatamente `ecosier2_PortalEmpleo.sql` y `backend/migration_data/` del repositorio y su historial Git, manteniendo únicamente un archivo `schema_only.sql` (DDL puro sin `INSERT` de usuarios) más seeds sintéticos (`ejemplo1@test.invalid`) para pruebas locales.

### [LEG-013] Proceso de baja (`/api/unsubscribe` y `/darse-de-baja`) incompleto frente a tablas derivadas, Stripe y LSSI Art. 21.2

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: baja integral multi-tabla en `api/unsubscribe/route.ts`, registro en `email_suppression_list`/`consent_audit_log` y ejecución automática en 1 clic en `darse-de-baja/page.tsx`).
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` y `frontend/app/darse-de-baja/page.tsx`
- **Diagnóstico del Problema**:
  La revocación del consentimiento y oposición a envíos presenta cinco brechas legales y operativas graves: (1) al darse de baja en `/api/unsubscribe`, no desactiva registros asociados en `alerts`, `saved_jobs_reminders`, `streak_reminders` ni `premium_leads`; (2) no cancela ni marca para cancelación suscripciones recurrentes activas en Stripe; (3) exige en `/darse-de-baja` confirmación manual adicional en dos pasos en lugar de revocación tan sencilla como el alta; (4) el endpoint `request_link` carece de rate limiting anti-spam; y (5) emplea clave HMAC fallback hardcodeada vulnerable a bajas forzosas por terceros.
- **Riesgo o Impacto**:
  Infracción del **Art. 7.3 RGPD** (*"Será tan fácil retirar el consentimiento como darlo"*), **Art. 21 RGPD** (derecho de oposición) y **Art. 21.2 LSSI-CE** (obligación de ofrecer un procedimiento sencillo y gratuito en cada envío para oponerse eficazmente): si un usuario se da de baja del boletín pero sigue recibiendo `send_custom_alerts.py` o `send_streak_reminder.py`, se expone a denuncia directa ante la AEPD.
- **Solución Óptima Propuesta**:
  1. Implementar baja centralizada atómica que actualice `subscribers.is_active = 0`, `marketing_accepted = 0`, `unsubscribed_at = NOW()`, y desactive simultáneamente todas las filas por email en `alerts`, `saved_jobs_reminders`, `streak_reminders` y `premium_leads` (ofreciendo además enlace claro para cancelar suscripción de pago en Stripe si existiera).
  2. Hacer efectiva la baja en un solo clic directo cuando el token HMAC firmado sea válido, manteniendo un historial mínimo de supresión (hash o email bloqueado en lista Robinson interna) para impedir futuras re-altas accidentales.

### [LEG-014] Borrado físico de registros en `send_reactivation.py` destruyendo listas de supresión (opt-out) y cuentas de pago

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: sustituido `DELETE` por baja lógica `status = 'inactive_sunset', is_active = FALSE` preservando `is_premium` y registros de supresión en `backend/send_reactivation.py`).
- **Ubicación exacta**: `backend/send_reactivation.py` (líneas 45–52)
- **Diagnóstico del Problema**:
  `backend/send_reactivation.py` ejecuta `DELETE` directo sobre registros con >45 días sin aperturas registradas. Paradójicamente, borrar físicamente la fila de un usuario en lugar de anonimizar o marcar `is_active = 0` conlleva tres violaciones normativas graves: (a) elimina el registro de usuarios que previamente **se habían dado de baja u opuesto** (perdiendo la prueba de oposición y permitiendo que vuelvan a ser importados o suscritos en el futuro sin bloqueo); (b) borra pruebas históricas de cuándo y cómo se recabó el consentimiento ante una eventual inspección AEPD; y (c) elimina registros de clientes de pago (`is_premium`) por usar lectores con bloqueo de píxeles (como Apple Mail), causando incumplimiento contractual.
- **Riesgo o Impacto**:
  Envíos ilícitos posteriores a usuarios que ya ejercieron su oposición (sanción agravada AEPD), imposibilidad de acreditar consentimiento pasado (Art. 7.1 RGPD) y reclamaciones contractuales por cancelar el servicio a usuarios de pago activos.
- **Solución Óptima Propuesta**:
  1. Sustituir `DELETE` por baja lógica `status = 'inactive_sunset', is_active = 0` conservando en tabla separada de **supresión** (`email_suppression_list`, preferiblemente con hash + marca temporal de oposición) y guardando el registro de consentimiento/facturación de clientes `is_premium` durante los plazos legales de prescripción (fiscal 4–6 años, LOPDGDD 3 años).

### [LEG-015] Ausencia de verificación de titularidad (*Double Opt-In*) y falsos positivos silenciosos en altas de suscripción

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: añadido soporte Double Opt-In en `api/subscribe/route.ts` con confirmación HMAC en `api/subscribe/confirm/route.ts` y propagación estricta de errores BD).
- **Ubicación exacta**: `frontend/app/api/subscribe/route.ts` y `frontend/app/actions.ts` (`subscribeUser`, `submitPremiumLead`)
- **Diagnóstico del Problema**:
  El **Art. 7.1 RGPD** exige al responsable **ser capaz de demostrar** que el interesado consintió el tratamiento de sus datos personales. El alta actual permite introducir cualquier dirección de correo electrónico de terceros sin verificación *Double Opt-In* (envío de enlace único de confirmación al buzón antes de activar el tratamiento) ni registro seguro de prueba de consentimiento, y `api/subscribe/route.ts` incluso devuelve `{ success: true }` cuando falla la escritura en BD.
- **Riesgo o Impacto**:
  Imposibilidad jurídica de demostrar ante la AEPD que el propietario real del buzón otorgó consentimiento cuando un tercero introdujo su email maliciosamente o por error, dando lugar a correos no solicitados ilegales bajo Art. 21 LSSI-CE.
- **Solución Óptima Propuesta**:
  1. Exigir **Double Opt-In** obligatorio: no habilitar ningún boletín ni alerta hasta que el titular pulse el token de verificación recibido en su correo, registrando `confirmed_at`, IP pseudonimizada/truncada, `user_agent` y versión exacta de la cláusula informativa aceptada.

### [LEG-016] Carencia en producción de columnas de trazabilidad de consentimiento (`consent_*`, `marketing_accepted`) y sobrecarga en `tech_keywords`

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: añadidas columnas `consent_alerts_at`, `consent_marketing_at`, `confirmed_at`, `unsubscribed_at`, `status` y tablas `email_suppression_list`/`consent_audit_log` en `consolidate_production_schema.py`, usando columna `source` dedicada en `api/subscribe/route.ts`).
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` (tabla `subscribers`), `frontend/app/api/subscribe/route.ts` (líneas 77 y 85) y `backend/consolidate_production_schema.py`
- **Diagnóstico del Problema**:
  La tabla `subscribers` volcada en `ecosier2_PortalEmpleo.sql` no contiene las columnas de consentimiento granular (`consent_*`, `marketing_accepted`, `source`) ni la versión aceptada de política de privacidad, pese a que parte del código las asume, y `api/subscribe/route.ts` mezcla el origen en `tech_keywords` dejando `source` nulo.
- **Riesgo o Impacto**:
  Incapacidad técnica de registrar y segmentar lícitamente qué usuarios aceptaron únicamente alertas laborales frente a quienes aceptaron comunicaciones comerciales o promociones de terceros.
- **Solución Óptima Propuesta**:
  1. Migrar e indexar formalmente la tabla `subscribers` (y tabla inmutable `consent_audit_log`) guardando `privacy_policy_version`, `consent_alerts_at`, `marketing_accepted`, `consent_marketing_at` y `unsubscribed_at` con historial de cambios.

### [LEG-017] Deber de información por capas incompleto en formularios de captación (Art. 13 RGPD y Art. 11 LOPDGDD)

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: creado componente reutilizable `RgpdFirstLayerNotice.tsx` con primera capa Art. 11 LOPDGDD y checkbox opcional separado, integrado en `SubscribeForm.tsx`).
- **Ubicación exacta**: `frontend/components/SubscribeForm.tsx`, formularios de reclutadores/reseñas en `frontend/app/actions.ts`, `frontend/app/privacy/page.tsx`
- **Diagnóstico del Problema**:
  El Art. 11 de la **LOPDGDD** establece el deber de informar por capas en todo punto de recogida de datos personales: la primera capa visible junto a cada botón de envío debe resumir de forma clara (1) identidad del responsable, (2) finalidad principal del tratamiento y (3) enlace directo a la segunda capa de información adicional (base legitimadora, destinatarios/transferencias, plazos de conservación y derechos). Varios formularios del sitio (como captación rápida en alertas, rachas, reseñas o leads B2B) carecen de la primera capa completa y checkbox explícito independiente para fines comerciales adicionales.
- **Riesgo o Impacto**:
  Recogida de datos sin información previa suficiente sancionable conforme al Art. 13 RGPD / Art. 72–74 LOPDGDD y nulidad del consentimiento obtenido mediante cláusulas genéricas o consentimiento tácito.
- **Solución Óptima Propuesta**:
  1. Crear un componente reutilizable `<RgpdFirstLayerNotice purpose="..." includeMarketingCheckbox />` e integrarlo obligatoriamente en todo formulario público (`SubscribeForm`, formulario de reseñas, patrocinio de ofertas y descargas), con casillas desmarcadas por defecto.

### [LEG-018] Implementación incompleta de cabeceras `List-Unsubscribe` (`mailto:` y RFC 8058 One-Click) en envíos automatizados

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: añadido `<mailto:...>` junto a `<https://...>` y `List-Unsubscribe-Post: List-Unsubscribe=One-Click` en todos los scripts `backend/send_*.py` + helper `build_unsubscribe_headers` en `backend/logic/legal.py`).
- **Ubicación exacta**: `backend/send_instant_featured_alerts.py` (línea 201), `backend/mailer.py` y demás scripts `backend/send_*.py`
- **Diagnóstico del Problema**:
  En `send_instant_featured_alerts.py` (línea 201), la cabecera `List-Unsubscribe` omite la opción `<mailto:...>` exigida por varios clientes y estándares de entregabilidad/baja ágil, y la suite de scripts carece de implementación integral del estándar **RFC 8058** (`List-Unsubscribe-Post: List-Unsubscribe=One-Click` respaldado por un endpoint `POST /api/unsubscribe` que ejecute la baja silenciosa inmediata sin pantalla intermedia).
- **Riesgo o Impacto**:
  Incumplimiento práctico de facilidad de baja (Art. 21.2 LSSI-CE), aumento de reportes de spam manuales en Gmail/Yahoo (que exigen RFC 8058 obligatorio desde 2024 para remitentes masivos) y caída de entregabilidad en bandeja principal.
- **Solución Óptima Propuesta**:
  1. Centralizar la construcción de cabeceras SMTP en un helper común de `backend/` añadiendo siempre:
     `List-Unsubscribe: <mailto:bajas@dominio?subject=unsubscribe>, <https://dominio/api/unsubscribe?token=...>` y `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, soportado por `POST` en `/api/unsubscribe/route.ts`.

### [LEG-019] Ausencia de plazos técnicos de conservación y supresión automática (*Data Retention*, Art. 5.1.e RGPD)

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: creado `backend/cleanup_retention.py` y actualizados los plazos exactos de conservación en `frontend/app/privacy/page.tsx`).
- **Ubicación exacta**: `ecosier2_PortalEmpleo.sql` (`email_tracking`, `subscribers`, `review_reports`, `report_downloads`), `frontend/app/privacy/page.tsx`
- **Diagnóstico del Problema**:
  La base de datos conserva indefinidamente registros granulares de aperturas y clics vinculados a emails (`email_tracking`), tokens/descargas, reportes de reseñas y leads antiguos sin tareas automatizadas que anonimicen o supriman datos personales una vez cumplida la finalidad o transcurrido el plazo máximo declarado en la política de privacidad.
- **Riesgo o Impacto**:
  Infracción del principio de **limitación del plazo de conservación** (Art. 5.1.e RGPD) y mayor impacto ante cualquier incidente de seguridad por acumular datos históricos innecesarios.
- **Solución Óptima Propuesta**:
  1. Definir plazos concretos en `privacy/page.tsx` y en una tarea cron mensual de limpieza: p. ej., anonimización de `email_tracking` a métricas agregadas sin PII a los 6–12 meses, borrado/bloqueo de tokens expirados >30 días y conservación bloqueada de registros fiscales únicamente durante 5–6 años legales.

### [LEG-020] Fuga pasiva de direcciones de correo en URLs GET (`/api/track-open`, `/api/track-click`, `/darse-de-baja`)

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.2 / Fase 1 SEC-041: tokens opacos HMAC `?t=<b64url>.<sig>` en `track-open`, `track-click` y enlaces de envío).
- **Ubicación exacta**: `frontend/app/api/track-open/route.ts`, `frontend/app/api/track-click/route.ts`, `frontend/app/darse-de-baja/page.tsx`, `backend/mailer.py` (línea 405), `backend/send_instant_featured_alerts.py` (líneas 40 y 93)
- **Diagnóstico del Problema**:
  Transportar correos electrónicos sin cifrar en query strings (`?email=usuario@ejemplo.com`) expone PII directamente en registros HTTP de Nginx/Vercel, analítica web cliente (GA4 registra URLs visitadas incluyendo parámetros) y cabeceras HTTP `Referer` enviadas a destinos externos al navegar tras hacer clic.
- **Riesgo o Impacto**:
  Cesión involuntaria y no consentida de datos personales (direcciones de email) hacia Google Analytics u otros terceros, contraviniendo los principios de minimización y **protección de datos desde el diseño** (Art. 25 RGPD).
- **Solución Óptima Propuesta**:
  1. Reemplazar el parámetro `email` en todas las URLs de tracking y baja por un token opaco cifrado o identificador `subscriber_id` UUID firmado con HMAC que nunca revele la dirección de correo electrónico en la barra de direcciones ni en analítica.

### [LEG-021] Carencia de flujo operativo eficiente para derechos ARSOLP y moderación RGPD de reseñas (`company_reviews` / `review_reports`)

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: creado endpoint protegido `frontend/app/api/admin/gdpr/route.ts` para exportación ARSOLP JSON, supresión en 1 clic y resolución de `review_reports`).
- **Ubicación exacta**: `frontend/app/actions.ts` (`submitCompanyReview`, `reportCompanyReview`, `getCompanyReviews`), `frontend/app/admin/page.tsx`, `frontend/app/privacy/page.tsx`
- **Diagnóstico del Problema**:
  La plataforma permite publicar reseñas sobre empresas y reportarlas (`review_reports`), pero `/admin` es de solo lectura sin cola de resolución y no existe un flujo automatizado de exportación/portabilidad o supresión verificable en plazo máximo de 1 mes (Art. 12.3 RGPD) ni protocolo documentado de retirada cautelar ante reportes fundados por difamación o revelación de datos personales de empleados concretos dentro de una reseña.
- **Riesgo o Impacto**:
  Vencimiento del plazo legal de 1 mes para responder derechos RGPD y responsabilidad civil/administrativa si una reseña expone nombres o datos personales de terceros sin moderación ágil tras recibir aviso.
- **Solución Óptima Propuesta**:
  1. Añadir en `/admin` una bandeja prioritaria para `review_reports` (con ocultación cautelar automática tras X reportes independientes mientras se revisa) y habilitar exportación JSON / eliminación en un clic por email en panel administrativo para cumplir en <48h con cualquier solicitud RGPD.

### [LEG-022] Transferencias internacionales y ausencia de inventario verificado de subprocesadores (Capítulo V RGPD)

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.2: añadido inventario completo de encargados y garantías EU-US DPF / SCCs en `frontend/app/privacy/page.tsx`).
- **Ubicación exacta**: `frontend/app/privacy/page.tsx`, `frontend/app/layout.tsx`, integraciones con Vercel, Upstash, Stripe, Google Analytics/Gemini, OneSignal, Clearbit y Cloudflare
- **Diagnóstico del Problema**:
  El stack técnico envía datos personales (IPs, identificadores de dispositivo, correos electrónicos, datos de pago y prompts/textos) a múltiples proveedores radicados o con infraestructuras en EE.UU. y terceros países sin un listado exhaustivo, exacto y actualizado en `privacy/page.tsx` que especifique las garantías aplicables (certificación **EU-US Data Privacy Framework** o Cláusulas Contractuales Tipo - SCCs y evaluación de impacto de transferencias). Además, el uso no declarado de servicios como Clearbit en `CompanyLogo.tsx` introduce transferencias invisibles al interesado.
- **Riesgo o Impacto**:
  Incumplimiento de los arts. 13.1.f y 44–46 RGPD (transferencias internacionales ilícitas o no informadas al interesado).
- **Solución Óptima Propuesta**:
  1. Inventariar todos los encargados/subencargados reales activos, suscribir los respectivos DPAs (Data Processing Agreements) con SCCs o verificar su adhesión activa al EU-US DPF, eliminar transferencias innecesarias (como Clearbit en navegador) y reflejar fielmente la lista en `frontend/app/privacy/page.tsx`.

---

## Bloque III: Cookies, ePrivacy y Cumplimiento de la Guía AEPD

### [LEG-023] Carga automática de OneSignal SDK (`OneSignalSDKWorker.js`) sin consentimiento previo de `cookies_consent`

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.3: condicionada la carga e inicialización de OneSignal en `frontend/app/layout.tsx` a consentimiento explícito en `cookies_consent` además de `Notification.permission === 'granted'`).
- **Ubicación exacta**: `frontend/app/layout.tsx` y `frontend/public/OneSignalSDKWorker.js`
- **Diagnóstico del Problema**:
  Mientras `AdBanner.tsx` sí comprueba `cookies_consent`, el script y worker de OneSignal se cargan e inicializan en `layout.tsx` sin estar bloqueados estrictamente hasta obtener el consentimiento afirmativo específico para cookies/almacenamiento no necesario (funcionalidad de seguimiento y push SDK de tercero que lee/escribe en `IndexedDB`/`localStorage`/cookies y contacta servidores externos).
- **Riesgo o Impacto**:
  Infracción del **Art. 22.2 LSSI-CE** y Directiva **ePrivacy** (almacenamiento o acceso a información en el equipo terminal del usuario antes de obtener consentimiento informado previo), motivo habitual de expedientes sancionadores de la AEPD.
- **Solución Óptima Propuesta**:
  1. Condicionar la inyección del script de inicialización de OneSignal estrictamente a que exista preferencia explícita positiva en el gestor de consentimiento (`consent.notifications === true || consent.analytics === true`), sin cargar el SDK en la primera visita antes de decidir.

### [LEG-024] Transmisión automática de IP y Referer hacia Clearbit desde `CompanyLogo.tsx` sin consentimiento previo

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.3 / Fase 1 SEC-040: `CompanyLogo.tsx` sirve logotipos exclusivamente mediante el proxy interno `/api/company-logo?domain=...` sin peticiones directas cliente->Clearbit).
- **Ubicación exacta**: `frontend/components/CompanyLogo.tsx`
- **Diagnóstico del Problema**:
  Al renderizar listados o fichas de ofertas, el navegador del visitante solicita directamente logotipos externos a los servidores de Clearbit (`logo.clearbit.com` / API de terceros). Esta llamada directa cliente->tercero transmite obligatoriamente la dirección IP del usuario, su `User-Agent`, cookies de ese dominio tercero si existieran y el `Referer` de la página de empleo consultada, **sin consentimiento previo** y sin base contractual informada en la política de privacidad/cookies.
- **Riesgo o Impacto**:
  Precedente europeo consolidado (jurisprudencia TJUE *Fashion ID* y resoluciones alemanas/AEPD similares a Google Fonts remotas): conexión no consentida hacia un tercero estadounidense revelando datos personales (IP + intereses profesionales del candidato) desde el primer cargado de página.
- **Solución Óptima Propuesta**:
  1. Eliminar inmediatamente las peticiones directas del navegador del visitante a Clearbit: servir los logotipos corporativos pre-cacheados desde el propio servidor/CDN (`/_next/image` o `/api/company-logo/[slug]` descargado y cacheado en servidor en ingesta), manteniendo el anonimato absoluto de la IP del visitante.

### [LEG-025] Inserción de píxeles de seguimiento de aperturas (`/api/track-open`) en correos electrónicos sin transparencia ni opt-out granular

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.3: transparencia explícita en `cookies/page.tsx`, `privacy/page.tsx` y pies legales de correos sobre `track-open` 1x1 y cómo bloquearlo o darse de baja en 1 clic).
- **Ubicación exacta**: `frontend/app/api/track-open/route.ts`, `backend/mailer.py`, `backend/send_*.py`, `frontend/app/privacy/page.tsx`
- **Diagnóstico del Problema**:
  Las plantillas HTML de los correos automáticos insertan píxeles ocultos de seguimiento `1x1` apuntando a `/api/track-open` para registrar cuándo y qué usuarios abren cada correo (dato utilizado posteriormente incluso para borrar usuarios en `send_reactivation.py`), sin informar específicamente de esta tecnología de rastreo en la primera capa del formulario ni ofrecer opción de recibir alertas sin rastreo individual.
- **Riesgo o Impacto**:
  Fricción directa con el Art. 5.3 Directiva ePrivacy / Art. 22.2 LSSI-CE (acceso a información del terminal mediante balizas web ocultas) y principios de transparencia del RGPD respecto a elaboración de perfiles de interacción individual.
- **Solución Óptima Propuesta**:
  1. Declarar explícitamente el uso de métricas de apertura y clics tanto en la política de privacidad como de manera resumida en el pie del formulario/emails, evaluar la eliminación del rastreo nominal individual por píxel sustituyéndolo por métricas agregadas anónimas y permitir el opt-out específico en `/preferencias`.

### [LEG-026] Persistencia residual de cookies `_ga_*` y almacenamiento cliente tras rechazar o retirar el consentimiento

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.3: ampliada la limpieza en `CookieBanner.tsx` para purgar cookies `_ga*`, `__os_*`, `localStorage` de OneSignal/streak e `IndexedDB` `ONE_SIGNAL_SDK_DB`, además de actualizar Consent Mode v2).
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx`, `frontend/app/cookies/page.tsx`, `frontend/app/layout.tsx`, `frontend/components/UserStreak.tsx`
- **Diagnóstico del Problema**:
  Si un usuario acepta cookies inicialmente y posteriormente pulsa "Rechazar" o modifica sus preferencias mediante el panel de configuración, la lógica cliente no purga sistemáticamente todas las cookies analíticas ya creadas (`_ga`, `_ga_*`, `_gid`) con variaciones de dominio (`.dominio.com` vs `dominio.com`), ni limpia entradas de `localStorage` / `IndexedDB` de SDKs externos ni datos no estrictamente técnicos como los de `UserStreak.tsx`.
- **Riesgo o Impacto**:
  Incumplimiento de la Guía de Cookies de la AEPD ("Si el usuario retira el consentimiento previamente otorgado, las cookies instaladas deberán dejar de utilizarse / eliminarse efectivamente") y permanencia de identificadores persistentes sin base legal.
- **Solución Óptima Propuesta**:
  1. Implementar en `CookieBanner.tsx` una rutina integral de limpieza al revocar/rechazar que expire activamente todas las cookies no esenciales iterando por dominio raíz y subdominio, limpie entradas no esenciales de `localStorage` / `IndexedDB` y actualice Google Consent Mode v2 (`gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })`).

### [LEG-027] Ausencia de caducidad máxima de 24 meses en la elección de cookies y desajuste lingüístico en el banner

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.3: añadida caducidad `updatedAt` de 12 meses <= 24 meses en `CookieBanner.tsx` y `layout.tsx`, y localización del banner en `es`/`en`/`ca`/`eu` según ruta).
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` y rutas multi-idioma (`/en/`, `/ca/`, `/eu/`)
- **Diagnóstico del Problema**:
  La Guía sobre el uso de las cookies de la AEPD establece que la validez del consentimiento prestado (o del rechazo almacenado) no debe superar los **24 meses**, debiendo volver a solicitarse transcurrido ese plazo. Además, cuando el usuario accede a páginas en inglés, catalán o euskera (`/en/trabajos/[sector]`, `/ca/trabajo-barcelona`, `/eu/trabajo-bilbao`), el banner y la configuración de cookies deben presentarse de forma comprensible acorde al idioma de navegación elegido.
- **Riesgo o Impacto**:
  Consentimiento inválido por duración indefinida o por incomprensión idiomática para visitantes internacionales/regionales que usan esas versiones del sitio.
- **Solución Óptima Propuesta**:
  1. Guardar el registro del consentimiento con timestamp `updatedAt` fijando expiración estricta <= 365–730 días (`max-age` <= 24 meses, ideal 12 meses) y re-solicitarlo al caducar o al cambiar significativamente de proveedores.
  2. Localizar `CookieBanner.tsx` y los enlaces hacia `/cookies` según el `locale` activo de la ruta.

### [LEG-028] Inventario desactualizado de cookies y almacenamientos reales en `frontend/app/cookies/page.tsx`

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.3: actualizada la tabla de `frontend/app/cookies/page.tsx` con `referrer_email`, `admin_session`, `user_streak / streak_sig` y almacenamiento real de OneSignal).
- **Ubicación exacta**: `frontend/app/cookies/page.tsx`, `frontend/app/ref/[code]/route.ts`, `frontend/app/api/admin/auth/route.ts`, `frontend/components/UserStreak.tsx`
- **Diagnóstico del Problema**:
  La tabla declarativa de cookies en `frontend/app/cookies/page.tsx` no refleja de manera completa y exacta la totalidad de cookies, duraciones y claves `localStorage`/`IndexedDB` efectivamente establecidas por la aplicación en tiempo real (como la cookie `referrer_email` de 30 días en `/ref/[code]`, claves de `UserStreak` o proveedores dinámicos de AdSense/OneSignal).
- **Riesgo o Impacto**:
  Incumplimiento del requisito de información completa y específica sobre finalidad, titularidad y plazo de conservación de cada cookie utilizado en la segunda capa (Art. 22.2 LSSI-CE).
- **Solución Óptima Propuesta**:
  1. Auditar mediante Chrome DevTools todas las cookies y entries de Storage generadas en flujos reales (visita anónima, referido `/ref/`, aceptación total, admin) y actualizar con precisión la tabla viva en `frontend/app/cookies/page.tsx` incluyendo finalidad, tercero, duración exacta y tipo.

---

## Bloque IV: Propiedad Intelectual (Scraping TDM), AI Act, Transparencia Salarial y Accesibilidad

### [LEG-029] Contradicción directa entre `frontend/app/bot/page.tsx` y la conducta real de scrapers en `backend/`

- **Nivel de Criticidad**: P0 - Crítico
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: implementado `backend/logic/tdm.py` con `is_scraping_allowed` y `truncate_snippet(..., 200)` en `scraper_infoempleo.py` y `backend/scrapers/`, y actualizada `frontend/app/bot/page.tsx` con descripción técnica veraz).
- **Ubicación exacta**: `frontend/app/bot/page.tsx` frente a `backend/main.py`, `backend/scraper_infoempleo.py` y `backend/scrapers/{remoteok,remotive,wwr,jobfluent,workingnomads}.py`
- **Diagnóstico del Problema**:
  La página pública de transparencia del rastreador (`frontend/app/bot/page.tsx`) afirma categóricamente ante editores de empleo y autoridades que `PortalTrabajoITBot`: (a) respeta escrupulosamente `robots.txt` en todas las extracciones y (b) extrae fragmentos muy breves no sustanciales inferiores a 200 caracteres. Sin embargo, únicamente Scrapy (`backend/job_aggregator/settings.py`) implementa obediencia a `robots.txt`: los scrapers directos de `backend/main.py`, `scraper_infoempleo.py` (`stratos-ad.com`), `jobfluent.py`, `remoteok.py` y `workingnomads.py` **no consultan ni respetan `robots.txt`**, y múltiples scrapers (`remoteok.py`, `remotive.py`, `wwr.py`, etc.) almacenan descripciones HTML extensas muy superiores a 200 caracteres.
- **Riesgo o Impacto**:
  Declaraciones públicas objetivamente falsas ante titulares de portales terceros (agravante de mala fe / competencia desleal y engaño), vulneración contractual/técnica de exclusiones de rastreo y pérdida inmediata de defensa ante reclamaciones por *scraping* masivo o copia sistemática de bases de datos.
- **Solución Óptima Propuesta**:
  1. Hacer cumplir estrictamente la política prometida en **todos** los scrapers sin excepción: implementar verificación obligatoria `urllib.robotparser` / parser equivalente previa en `backend/main.py` y `scraper_infoempleo.py`, respetar cabeceras `X-Robots-Tag` / etiquetas TDM y truncar/resumir descripciones almacenadas para evitar reproducción íntegra no autorizada (o limitarse exclusivamente a APIs/feeds RSS públicos con licencia de agregación expresa).
  2. Actualizar `frontend/app/bot/page.tsx` describiendo con veracidad exacta el funcionamiento real verificado.

### [LEG-030] Riesgo legal por Directiva (UE) 2019/790 (TDM Art. 4) y Derecho *Sui Generis* de Bases de Datos (Directiva 96/9/CE)

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: añadido motor TDM Compliance Gate en `backend/logic/tdm.py` que verifica `robots.txt`, `TDM-Reservation: 1` y `X-Robots-Tag`, limitando extractos a <= 200 caracteres).
- **Ubicación exacta**: `backend/main.py`, `backend/scraper_infoempleo.py`, `backend/scrapers/*.py`, `backend/job_aggregator/`
- **Diagnóstico del Problema**:
  El raspado automatizado comercial de portales de empleo de terceros en la UE (como `stratos-ad.com`, `tecnoempleo`, `jobfluent`, etc.) está sujeto al **Art. 4 de la Directiva (UE) 2019/790** (transpuesto en España mediante el Real Decreto-ley 24/2021, Art. 67) sobre Minería de Textos y Datos (TDM) con fines comerciales —el cual queda **excluido cuando el titular reserva expresamente sus derechos mediante medios legibles por máquina**, incluidos metadatos, `robots.txt` o Términos de Servicio publicados— y al **derecho *sui generis* sobre bases de datos** (Art. 133 TRLPI / Directiva 96/9/CE), que prohíbe la extracción y reutilización sistemática de partes sustanciales o insubstanciales repetidas cuando perjudica la explotación normal de la base de datos origen.
- **Riesgo o Impacto**:
  Demandas civiles por infracción de derechos *sui generis* sobre bases de datos, acciones de cesación y reclamaciones de daños y perjuicios por competidores o portales españoles/europeos afectados, así como posible responsabilidad por actos de competencia desleal (imitación/aprovechamiento indebido del esfuerzo ajeno).
- **Solución Óptima Propuesta**:
  1. Clasificar formalmente cada fuente antes de ingerirla: priorizar acuerdos, programas de afiliados/partners y APIs/feeds abiertos con permiso explícito (`Remotive API`, `Himalayas`, feeds públicos autorizados).
  2. Implementar un motor de cumplimiento **TDM Compliance Gate** antes de cada descarga en Python que verifique `robots.txt`, cabeceras `TDM-Reservation: 1` (protocolo W3C TDMRep) y bloqueos contractuales conocidos, absteniéndose de raspar contenido completo allí donde exista reserva expresa de derechos.

### [LEG-031] Incumplimiento de obligaciones de transparencia del Reglamento de IA de la UE (**AI Act** Art. 50) en noticias y blog

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: añadida nota visible de transparencia AI Act Art. 50 en los artículos generados por `backend/generate_news_post.py` y `backend/generate_blog_post.py`).
- **Ubicación exacta**: `backend/generate_news_post.py` (líneas 1–119) y `backend/generate_blog_post.py` (líneas 1–138)
- **Diagnóstico del Problema**:
  El portal genera y publica automáticamente artículos informativos y de actualidad tecnológica mediante llamadas al modelo LLM `gemini-2.5-flash` sin añadir ninguna marca visible al lector indicando que el texto ha sido generado o asistido mediante Inteligencia Artificial, ni incorporar metadatos legibles por máquina que identifiquen el origen sintético del texto cuando trata asuntos de interés público sin revisión humana editorial efectiva (**Art. 50.4 del Reglamento (UE) 2024/1689 - AI Act**).
- **Riesgo o Impacto**:
  Incumplimiento de obligaciones de transparencia exigibles a desplegadores (*deployers*) de sistemas de IA generativa en la UE (régimen sancionador del Art. 99 AI Act con aplicación escalonada vigente hasta agosto de 2026), además de riesgo de publicación automática de desinformación o alucinaciones sin supervisión editorial.
- **Solución Óptima Propuesta**:
  1. Añadir una columna booleana `is_ai_assisted` en noticias/blog y renderizar de forma clara y visible una insignia y nota al inicio/pie del artículo (`"Artículo generado/asistido por IA a partir de datos agregados del mercado — revisado por el equipo editorial"`), junto con cola de aprobación (`status = 'pending_review'`) previo a publicar o tras fallback.

### [LEG-032] Declaración infundada de cumplimiento total WCAG 2.1 AA en `/accesibilidad` vulnerando Ley 11/2023 y EAA

- **Nivel de Criticidad**: P1 - Alto
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: actualizada `frontend/app/accesibilidad/page.tsx` a declaración honesta `"parcialmente conforme"` con soporte `dark:` y limitaciones conocidas).
- **Ubicación exacta**: `frontend/app/accesibilidad/page.tsx`, `frontend/app/globals.css`, `frontend/components/AdBanner.tsx`, `frontend/app/components/SearchFilters.tsx`
- **Diagnóstico del Problema**:
  La página `/accesibilidad` declara explícitamente conformidad plena con **WCAG 2.1 Nivel AA** y la normativa derivada del **Acta Europea de Accesibilidad (Directiva UE 2019/882 / Ley 11/2023 en España)**. Sin embargo, el propio código contiene infracciones verificables contra dichos estándares: la página `/accesibilidad` está forzada en modo claro sobre un sitio con modo oscuro, emplea clases rotas Tailwind v4 (`text-indigo-650`, `text-gray-650`, `dark:text-slate-350`, `dark:border-slate-850`) que anulan colores/contrastes y bordes de foco/separación, los banners causan desplazamientos bruscos (`AdBanner.tsx`) y existen controles sin auditoría real de contraste y teclado completo.
- **Riesgo o Impacto**:
  Declaración de accesibilidad materialmente inexacta frente a consumidores con discapacidad y autoridades supervisoras bajo Ley 11/2023 (aplicable plenamente desde junio de 2025 para servicios digitales de comercio electrónico y consumo afectados) y barreras reales para lectores de pantalla y baja visión.
- **Solución Óptima Propuesta**:
  1. Corregir todas las clases rotas de `globals.css`, verificar contraste >= 4.5:1 en modo claro y oscuro, auditar navegación por teclado (`Tab`, foco visible, `aria-live` en resultados filtrados y modales/banners) mediante `axe-core` / Lighthouse CI.
  2. Actualizar `frontend/app/accesibilidad/page.tsx` pasando a una declaración honesta de **"Parcialmente conforme"** mientras persistan puntos pendientes, detallando con transparencia excepciones conocidas, fecha real de última revisión y canal efectivo de quejas/solicitud accesible.

### [LEG-033] Brecha ante la Directiva (UE) 2023/970 de Transparencia Retributiva en publicaciones patrocinadas por empresas

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: añadidos campos opcionales `salary_min`/`salary_max` en `sponsoredJobSchema` de `frontend/app/actions.ts` junto al aviso de Directiva UE 2023/970 en `PublishForm.tsx`).
- **Ubicación exacta**: `frontend/app/actions.ts` (`submitSponsoredJob`) y formularios/esquemas de publicación de empleo
- **Diagnóstico del Problema**:
  La **Directiva (UE) 2023/970 de Transparencia Retributiva** (plazo de transposición hasta junio de 2026 en Estados miembros como España) exige en su Art. 5 que los solicitantes de empleo reciban información sobre la **retribución inicial o banda salarial** del puesto antes de la entrevista (habitualmente en el propio anuncio de vacante) y que tanto los anuncios como denominaciones de puestos sean neutros respecto al género y procesos no discriminatorios. Actualmente `submitSponsoredJob` no exige banda salarial mínima/máxima ni advierte al anunciante sobre estas obligaciones europeas en España.
- **Riesgo o Impacto**:
  Desajuste competitivo y regulatorio inmediato conforme entre en vigor la transposición española para ofertas publicadas directamente por empresas empleadoras a través del portal.
- **Solución Óptima Propuesta**:
  1. Incorporar campos estructurados recomendados/obligatorios de `salary_min` y `salary_max` (o justificación estructurada) en el formulario `submitSponsoredJob` junto a un aviso informativo sobre transparencia salarial y redacción inclusiva/neutra según Directiva 2023/970.

### [LEG-034] Riesgo por derecho conexo de editores de prensa (Art. 15 Directiva 2019/790) en generación automática de noticias

- **Nivel de Criticidad**: P2 - Medio
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: reforzadas las reglas editoriales en `backend/generate_news_post.py` exigiendo síntesis original basada en hechos agregados y cita a fuente primaria).
- **Ubicación exacta**: `backend/generate_news_post.py` (líneas 1–119)
- **Diagnóstico del Problema**:
  El script de generación automática de noticias procesa actualidad de fuentes externas mediante `gemini-2.5-flash` sin controles técnicos estrictos que aseguren que el texto generado sea una creación transformadora original basada en hechos puros/datos del portal en lugar de reproducir o parafrasear extensamente artículos de prensa española o europea protegidos por el derecho conexo de editores de publicaciones de prensa (**Art. 15 Directiva 2019/790** / Art. 129 bis TRLPI, salvo usos de palabras aisladas o extractos muy breves).
- **Riesgo o Impacto**:
  Posibles reclamaciones de editores de prensa tecnológica o entidades de gestión (CEDRO) si el modelo reproduce estructura o fragmentos sustanciales de noticias fuente sin licencia previa.
- **Solución Óptima Propuesta**:
  1. Alimentar los prompts exclusivamente con hechos agregados propios (vacantes, tendencias salariales de la BD, comunicados oficiales públicos) e imponer comprobación automática de similitud/solapamiento de texto respecto a fuentes antes de pasar a borrador para revisión humana, añadiendo atribución clara a la fuente primaria original.

### [LEG-035] Ausencia de plan técnico y operativo de respuesta a incidentes y notificación de brechas en 72 horas (Art. 33–34 RGPD)

- **Nivel de Criticidad**: P3 - Mejora/Bajo
- **Estado de Remediación**: [x] Resuelto (Lote 2.4: creado `docs/PLAYBOOK_BRECHAS_RGPD.md` con el procedimiento operativo de detección, contención, rotación y notificación a la AEPD en <72h).
- **Ubicación exacta**: Todo el stack operativo (`db_proxy.php`, `scripts/backup_mysql.sh`, `ecosier2_PortalEmpleo.sql`, `.github/workflows/`, `frontend/app/admin/`)
- **Diagnóstico del Problema**:
  Pese a gestionar datos personales reales de miles de suscriptores y existir superficies críticas expuestas (credencial hardcodeada en `backup_mysql.sh`, dump con emails en el workspace, logs de cronjobs con emails en claro y falta de alertas en `db_proxy.php` / `/api/admin/auth`), no consta procedimiento operativo documentado ni registros forenses mínimos centralizados para evaluar el alcance y notificar a la AEPD en menos de **72 horas** (Art. 33 RGPD) y a los interesados (Art. 34 RGPD) en caso de brecha de seguridad.
- **Riesgo o Impacto**:
  Incapacidad para determinar si un atacante extrajo la tabla `subscribers` vía `db_proxy.php` o credenciales expuestas, agravando drásticamente la responsabilidad y sanción ante la AEPD por notificación tardía o inexistente.
- **Solución Óptima Propuesta**:
  1. Implementar retención centralizada e inmutable de logs de acceso/auditoría en `db_proxy.php` y panel `/admin` (sin PII en claro) y redactar un Playbook conciso de Respuesta a Brechas RGPD (detección, contención —rotación inmediata de secretos y `db_proxy.php`—, evaluación de riesgo y plantilla oficial de notificación AEPD en <72h).
