# Auditoría de Legalidad, RGPD y Cumplimiento Normativo (España / UE) (`LEG-001` – `LEG-035`)

> **Proyecto**: Portal Empleo IT (España / UE)  
> **Marco Normativo**: RGPD (Reglamento UE 2016/679), LOPDGDD (LO 3/2018), LSSI-CE (Ley 34/2002), Directiva ePrivacy (2002/58/CE) y Guía AEPD sobre Cookies, TRLGDCU (RDL 1/2007), Directiva (UE) 2019/790 (TDM y Derechos de Autor) y LPI (RDL 1/1996), Directiva (UE) 2023/970 (Transparencia Retributiva), Ley 15/2022, Ley 11/2023 (Accesibilidad) y Reglamento (UE) 2024/1689 (AI Act).  
> **Modo**: Auditoría estricta de solo lectura (`AUDIT ONLY`).

---

## Bloque A: Información Legal Obligatoria (LSSI-CE), Consentimiento, Tracking y Derechos ARSOLP (`LEG-001` – `LEG-015`)

### [LEG-001] Ausencia de NIF/CIF y domicilio social completo en textos legales y comunicaciones comerciales

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/lib/legalConfig.ts` (líneas 9-10), `backend/logic/legal.py` (líneas 7-10), `frontend/app/aviso-legal/page.tsx`, `frontend/app/privacy/page.tsx`, `frontend/app/terminos/page.tsx`, `backend/mailer.py` y `backend/send_custom_alerts.py`
- **Diagnóstico del Problema**:
  La configuración jurídica centralizada en frontend (`frontend/lib/legalConfig.ts`) y backend (`backend/logic/legal.py`) utiliza valores de marcador por defecto para los datos de identificación fiscal y sede social del prestador (como `'Pendiente de configuración (LEGAL_NIF)'` y domicilios genéricos incompletos en lugar de dirección física íntegra y NIF/CIF real). Todas las páginas legales (`/aviso-legal`, `/privacy`, `/terminos`) y los pies de los correos electrónicos automáticos heredan dichos marcadores cuando faltan variables de entorno o se sirven en configuración por defecto.
- **Riesgo o Impacto**:
  Infracción directa del artículo 10 de la LSSI-CE (deber de información general del prestador de servicios de la sociedad de la información) y del artículo 13.1.a del RGPD (identidad y datos de contacto del responsable del tratamiento), sancionable como infracción leve o grave por la Secretaría de Estado de Telecomunicaciones e Infraestructuras Digitales y la AEPD.
- **Solución Óptima Propuesta**:
  Configurar de forma obligatoria en producción los valores reales de denominación social o nombre completo del titular, NIF/CIF válido, domicilio completo, correo electrónico de contacto y datos registrales si proceden; añadir una validación de arranque ("fail-fast") que impida servir el portal o enviar correos si persiste la cadena `'Pendiente'` en la configuración legal.

### [LEG-002] Alta de suscriptores sin Double Opt-In en la Server Action `subscribeUser`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/actions.ts` (`subscribeUser`, líneas 384-403) frente a `frontend/app/api/subscribe/route.ts`
- **Diagnóstico del Problema**:
  Mientras el endpoint HTTP `/api/subscribe` implementa verificación de propiedad mediante correo de confirmación (Double Opt-In), la Server Action `subscribeUser` inserta directamente la dirección introducida en la tabla de suscriptores activos sin generar token ni exigir confirmación previa por parte del titular del buzón.
- **Riesgo o Impacto**:
  Vulneración del artículo 21.1 de la LSSI-CE y de los artículos 6.1.a y 7 del RGPD al permitir que terceros maliciosos o bots suscriban direcciones de correo ajenas para enviarles boletines no solicitados ("list bombing"), sin prueba verificable de que el titular real solicitó el servicio.
- **Solución Óptima Propuesta**:
  Suprimir la lógica de inserción directa en `subscribeUser` y unificar todas las suscripciones bajo el flujo Double Opt-In obligatorio: estado inicial pendiente con token firmado de un solo uso, expiración automática si no se confirma en 48 horas y prohibición absoluta de incluir cuentas no confirmadas en envíos comerciales.

### [LEG-003] Pérdida silenciosa de evidencias del consentimiento en fallback de `subscribeUser`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/actions.ts` (`subscribeUser`, líneas 384-403)
- **Diagnóstico del Problema**:
  Cuando la inserción completa en `subscribers` falla por error SQL, la función `subscribeUser` ejecuta un bloque de respaldo que vuelve a intentar la inserción omitiendo las columnas de auditoría jurídica: `consent_timestamp`, `consent_ip_hash`, `consent_policy_version` y `marketing_accepted`.
- **Riesgo o Impacto**:
  Incumplimiento del principio de responsabilidad proactiva y carga de la prueba del consentimiento (artículo 7.1 RGPD y artículo 6.1 LOPDGDD): ante una inspección o reclamación ante la AEPD, el responsable no podrá acreditar cuándo, cómo ni bajo qué versión informativa otorgó su consentimiento el interesado.
- **Solución Óptima Propuesta**:
  Eliminar por completo el `INSERT` degradado sin campos de consentimiento; garantizar que la tabla `subscribers` y `consent_audit_log` exijan `NOT NULL` en marca temporal, versión de política e indicador de finalidad, abortando el alta con error controlado si falla el registro probatorio.

### [LEG-004] Envío de comunicaciones a suscriptores sin `confirmed_at IS NOT NULL` ni estado activo verificado

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/mailer.py` y scripts `backend/send_*.py` (`send_custom_alerts.py`, `send_instant_featured_alerts.py`, `send_reactivation.py`, `send_referral_notifications.py`, `send_saved_jobs_reminder.py`, `send_streak_reminder.py`, `send_welcome_onboarding.py`)
- **Diagnóstico del Problema**:
  Las consultas de selección de destinatarios en los scripts de correo de `backend/` omiten el filtro obligatorio `confirmed_at IS NOT NULL`, y al menos cuatro módulos permiten valores nulos mediante condiciones `(is_active IS NULL OR is_active = TRUE)`. De ese modo, registros que nunca completaron Double Opt-In o filas heredadas sin estado explícito reciben boletines periódicos.
- **Riesgo o Impacto**:
  Envío ilícito de comunicaciones comerciales por vía electrónica sin consentimiento previo expreso (infracción del artículo 21 de la LSSI-CE sancionable hasta con `30.000 EUR` en grado leve y `150.000 EUR` en grado grave, además de sanción RGPD por falta de base legitimadora del Art. 6.1).
- **Solución Óptima Propuesta**:
  Crear una vista SQL o repositorio único `active_verified_recipients` que exija de forma estricta `is_active = TRUE AND confirmed_at IS NOT NULL` en cada consulta saliente y bloquear mediante migración los valores `NULL` en `is_active`.

### [LEG-005] Incumplimiento transversal de `email_suppression_list` en los 8 scripts de envío de correo

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/mailer.py`, `backend/send_custom_alerts.py`, `backend/send_instant_featured_alerts.py`, `backend/send_reactivation.py`, `backend/send_referral_notifications.py`, `backend/send_saved_jobs_reminder.py`, `backend/send_streak_reminder.py` y `backend/send_welcome_onboarding.py`
- **Diagnóstico del Problema**:
  Aunque el esquema consolidado define la tabla `email_suppression_list` para bloquear envíos futuros tras bajas, rebotes o solicitudes de oposición/supresión, ninguno de los 8 programas Python de mailing consulta dicha tabla antes de componer y despachar los correos electrónicos.
- **Riesgo o Impacto**:
  Si un usuario ejerció su derecho de oposición o supresión (artículos 17 y 21 RGPD y 23 LOPDGDD) y su correo figura en `email_suppression_list` —o reaparece por otro flujo como alta gratuita, referido o reactivación—, el portal vuelve a enviarle publicidad vulnerando su derecho de exclusión (equivalente a las listas Robinson internas).
- **Solución Óptima Propuesta**:
  Incorporar `AND NOT EXISTS (SELECT 1 FROM email_suppression_list es WHERE es.email_hash = SHA2(LOWER(TRIM(email)), 256))` (o por email normalizado según diseño del índice) en una función común obligatoria `EmailGuard.filter_recipients()` antes de cualquier envío SMTP.

### [LEG-006] Desacato a `users.email_notifications_enabled = FALSE` en campañas de onboarding y retención

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/send_welcome_onboarding.py`, `backend/send_reactivation.py`, `backend/send_referral_notifications.py`, `backend/send_saved_jobs_reminder.py` y `backend/send_streak_reminder.py`
- **Diagnóstico del Problema**:
  Los usuarios registrados disponen del control `users.email_notifications_enabled` para desactivar los avisos automáticos por correo desde su cuenta. Sin embargo, los scripts de onboarding, reactivación, notificaciones de referidos, recordatorios de ofertas guardadas y rachas ignoran por completo esta preferencia en sus consultas SQL.
- **Riesgo o Impacto**:
  Continuación de envíos promocionales o de fidelización tras la retirada expresa del consentimiento por el usuario dentro de su propio panel, vulnerando el artículo 7.3 RGPD ("será tan fácil retirar el consentimiento como darlo") y el artículo 21.2 LSSI-CE.
- **Solución Óptima Propuesta**:
  Unificar la selección de usuarios con `WHERE u.email_notifications_enabled = TRUE` como cláusula ineludible en todos los scripts dirigidos a cuentas registradas, separando estrictamente los mensajes de seguridad esenciales (recuperación de contraseña) de cualquier correo de retención o marketing.

### [LEG-007] Ausencia de bloqueo frente a `email_suppression_list` en el endpoint/acción de alta `subscribeUser`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/actions.ts` (`subscribeUser`, líneas 384-403)
- **Diagnóstico del Problema**:
  Al procesar una nueva petición de alta mediante `subscribeUser`, el sistema no consulta previamente `email_suppression_list` para comprobar si la dirección estuvo sujeta a una orden de supresión definitiva RGPD, una baja permanente o bloqueo administrativo por abuso/queja previa.
- **Riesgo o Impacto**:
  Posibilidad de reactivar ilícitamente a un interesado que ejerció oposición absoluta o fue dado de baja por reclamación ante proveedor/autoridad de control mediante un formulario automatizado o inyección de terceros.
- **Solución Óptima Propuesta**:
  Consultar `email_suppression_list` al inicio de `/api/subscribe` y de cualquier alta equivalente: si el correo está suprimido por supresión RGPD o queja ("complaint"), denegar el alta automatizada o exigir doble confirmación reforzada con registro explícito de re-opt-in voluntario en `consent_audit_log`.

### [LEG-008] Exposición de correos electrónicos PII en URLs de seguimiento en texto plano o Base64 reversible

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/logic/tracking.py` (líneas 21-59), `backend/send_custom_alerts.py` (líneas 75-98), `backend/send_reactivation.py` (líneas 146, 158 y 201) y `backend/send_welcome_onboarding.py` (líneas 77-154 y 215)
- **Diagnóstico del Problema**:
  Los enlaces incrustados en los correos electrónicos para seguimiento de aperturas, clics o acciones de baja exponen la dirección de correo electrónico directamente en el parámetro query `?email=...` o codificada trivialmente en Base64 sin cifrado dentro del parámetro `t=`.
- **Riesgo o Impacto**:
  Violación del principio de integridad y confidencialidad y falta de medidas técnicas adecuadas de seguridad (artículos 5.1.f y 32 RGPD): la dirección de email personal queda registrada en texto legible o trivialmente decodificable en logs de Nginx, históricos del navegador, proxies corporativos y cabeceras HTTP `Referer` al hacer clic hacia sitios externos de las empresas ofertantes.
- **Solución Óptima Propuesta**:
  Sustituir cualquier email o token Base64 en URLs por identificadores opacos firmados mediante HMAC-SHA256 con clave de servidor (`token_id` aleatorio vinculado a la campaña/destinatario en base de datos o payload cifrado autenticado AES-GCM) y añadir `rel="noreferrer"` / política `Referrer-Policy: no-referrer` en redirecciones salientes.

### [LEG-009] Seguimiento individualizado de aperturas y clics sin base legitimadora granular ni exclusión en envíos operativos

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/logic/tracking.py` (líneas 21-59), `frontend/app/api/track-open` y `frontend/app/api/track-click`
- **Diagnóstico del Problema**:
  El sistema inserta píxeles de apertura (`track-open`) y reescritura de enlaces de clic (`track-click`) vinculados de forma nominal al correo/suscriptor para registrar exactamente cuándo y qué lee o pulsa cada persona, sin requerir consentimiento separado para analítica/perfilado por email ni desactivar el tracking en comunicaciones meramente operativas o de onboarding.
- **Riesgo o Impacto**:
  De acuerdo con las directrices del CEPD/EDPB y la AEPD relativas al artículo 5.3 de la Directiva ePrivacy, los píxeles de seguimiento en correos electrónicos requieren consentimiento previo o base analítica estrictamente informada y disociable; el perfilado comportamental oculto infringe los artículos 6.1, 13 y 21 del RGPD.
- **Solución Óptima Propuesta**:
  Solicitar casilla/preferencia informada diferenciada para personalización y métricas de envío en la suscripción, ofrecer enlace de desactivación del rastreo individual en el panel de preferencias y usar agregación anónima por campaña y puesto (sin vinculación nominal por usuario) cuando no exista consentimiento de perfilado.

### [LEG-010] Error estructural y ausencia de atomicidad en el endpoint de revocación `POST /api/unsubscribe`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (líneas 43-55) y `frontend/app/darse-de-baja/page.tsx` (líneas 1-251)
- **Diagnóstico del Problema**:
  Cuando un ciudadano intenta darse de baja mediante `POST /api/unsubscribe`, la ruta intenta actualizar tablas y columnas que no existen en el esquema (`alerts`, `saved_jobs_reminders.is_active`, `streak_reminders.is_active`), y ejecuta múltiples sentencias fuera de una transacción atómica garantizada.
- **Riesgo o Impacto**:
  Fallo parcial o total del procedimiento de baja: el usuario visualiza error o confía en haberse dado de baja mientras parte de sus alertas activas permanecen habilitadas en la base de datos, constituyendo una infracción directa del artículo 7.3 del RGPD y del artículo 21.2 de la LSSI-CE.
- **Solución Óptima Propuesta**:
  Corregir todas las consultas de `/api/unsubscribe` adaptándolas al esquema real (`subscribers`, `users`, `email_suppression_list`, tablas reales de recordatorios), envolver todo el proceso en una única transacción atómica que inserte además de forma incondicional la dirección en `email_suppression_list` y devuelva confirmación verificable con marca temporal.

### [LEG-011] Desajuste operativo en flujo One-Click Unsubscribe RFC 8058 frente a redirección con JavaScript

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/unsubscribe/route.ts` (líneas 43-55), `frontend/app/darse-de-baja/page.tsx` (líneas 1-251) y cabeceras `List-Unsubscribe` de `backend/mailer.py`
- **Diagnóstico del Problema**:
  El flujo `GET /api/unsubscribe` redirige a `/darse-de-baja` donde JavaScript dispara automáticamente un `POST` (medida útil para mitigar precargas de antivirus en clientes web), mientras que clientes conformes al estándar RFC 8058 (`List-Unsubscribe-Post: List-Unsubscribe=One-Click`) envían directamente `POST` automático desde el botón nativo de Gmail/Yahoo. Debido a los errores SQL del `POST` señalados y a posibles diferencias en formato `application/x-www-form-urlencoded` frente a JSON, las bajas automáticas desde cliente de correo fallan.
- **Riesgo o Impacto**:
  Botón nativo "Cancelar suscripción" de Gmail y Yahoo inoperante o fallido en segundo plano, incrementando reportes manuales de spam por parte de usuarios españoles/europeos e incumpliendo la facilidad equivalente de retirada exigida por el artículo 7.3 RGPD.
- **Solución Óptima Propuesta**:
  Garantizar en `POST /api/unsubscribe` la aceptación tanto de `application/x-www-form-urlencoded` (`List-Unsubscribe=One-Click`, RFC 8058) como de `application/json`, validando únicamente token firmado HMAC para ejecutar la baja inmediata en `subscribers` y `email_suppression_list` con código HTTP `200`/`204`.

### [LEG-012] Incapacidad operativa para atender el Derecho de Acceso y Portabilidad por consultas rotas en `/api/admin/gdpr`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/admin/gdpr/route.ts` (líneas 45-95)
- **Diagnóstico del Problema**:
  La herramienta administrativa de exportación RGPD (`/api/admin/gdpr`) falla al intentar recopilar los datos del interesado porque consulta la tabla inexistente `alerts` y columnas inexistentes `company_reviews.company_name` / `company_reviews.reviewer_email`. Además, deja fuera otras tablas donde consta el historial personal del ciudadano.
- **Riesgo o Impacto**:
  Incapacidad técnica de responder en el plazo máximo legal de un mes a las solicitudes de Acceso (Art. 15 RGPD) y Portabilidad en formato estructurado (Art. 20 RGPD), exponiendo al titular del portal a reclamaciones ante la AEPD y sanciones graves del Art. 83.5 RGPD.
- **Solución Óptima Propuesta**:
  Reconstruir el exportador `/api/admin/gdpr` consultando todas las tablas personales vigentes (`users`, `subscribers`, `consent_audit_log`, `user_saved_jobs`, `email_tracking`, `company_reviews`, `review_reports`, `premium_leads`, `sponsored_jobs`, `newsletter_sponsors`) mediante esquema verificado, entregando un paquete JSON estructurado acompañado de test automatizado contra el esquema real.

### [LEG-013] Derecho de Supresión ("derecho al olvido") severamente incompleto en `/api/admin/gdpr`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/admin/gdpr/route.ts` (líneas 45-95)
- **Diagnóstico del Problema**:
  La acción de borrado (`erase`) en `/api/admin/gdpr` únicamente actúa sobre `subscribers`, `email_tracking` y la tabla inexistente `alerts`. Permanece intacta toda la información identificativa personal almacenada en `users`, `user_sessions`, `user_password_resets`, `user_saved_jobs`, `premium_leads`, `sponsored_jobs`, `newsletter_sponsors` y `review_reports`.
- **Riesgo o Impacto**:
  Infracción grave del artículo 17 del RGPD (Derecho de supresión) y artículo 15 LOPDGDD: aunque el administrador ejecute la herramienta interna de borrado creyendo haber eliminado al ciudadano, sus datos personales, credenciales, sesiones e historial continúan almacenados indefinidamente.
- **Solución Óptima Propuesta**:
  Ejecutar una transacción integral de supresión/bloqueo que elimine registros no sujetos a retención legal en `users`, `user_sessions`, `user_password_resets`, `user_saved_jobs`, `subscribers`, `email_tracking` y `premium_leads`; pseudonimice datos estrictamente requeridos por obligación tributaria (facturación 4-6 años según LGT/Código de Comercio conservando bloqueo del Art. 32 LOPDGDD); y añada el hash irreversible a `email_suppression_list`.

### [LEG-014] Contradicción entre los plazos de conservación declarados en `/privacy` y el script `cleanup_retention.py`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/privacy/page.tsx` (líneas 108-111) y `backend/cleanup_retention.py` (líneas 1-69, especialmente línea 46)
- **Diagnóstico del Problema**:
  La Política de Privacidad (`/privacy`, líneas 108-111) informa públicamente a los usuarios de que las solicitudes Double Opt-In no confirmadas se suprimen a los 30 días, el seguimiento `email_tracking` se anonimiza a los 12 meses y las denuncias `review_reports` se eliminan 12 meses tras su resolución. En la práctica, `backend/cleanup_retention.py` falla en la línea 46 al consultar una columna inexistente (`double_opt_in_token`), omite el estado `'resolved_hidden'` en `review_reports` y deja sin purga `user_sessions` y `user_password_resets`.
- **Riesgo o Impacto**:
  Incumplimiento del principio de limitación del plazo de conservación (Art. 5.1.e RGPD) y falta de transparencia/información veraz (Art. 13.2.a RGPD) al conservar indefinidamente datos personales cuya eliminación fue prometida contractual e informativamente al interesado.
- **Solución Óptima Propuesta**:
  Corregir las consultas de `backend/cleanup_retention.py` alineándolas con las columnas reales del esquema y cubriendo `resolved_hidden`, `user_sessions`, `user_password_resets` y `email_tracking`; programar su ejecución diaria verificada y registrar un informe periódico de retención aplicada.

### [LEG-015] Declaración falsa sobre PayPal Europe como procesador de pagos en `/privacy` y `/aviso-legal`

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/privacy/page.tsx` (línea 83), `frontend/app/aviso-legal/page.tsx` (línea 126) y rutas `frontend/app/api/checkout/*.ts`
- **Diagnóstico del Problema**:
  Tanto la Política de Privacidad como el Aviso Legal enumeran expresamente a **PayPal Europe S.à r.l. et Cie, S.C.A.** entre los destinatarios y pasarelas de pago que reciben datos personales, cuando la totalidad de los flujos de contratación del sitio utilizan únicamente `Stripe` con método de pago con tarjeta (`card`).
- **Riesgo o Impacto**:
  Inexactitud en el deber de información transparente sobre destinatarios o categorías de destinatarios (Art. 13.1.e RGPD) e información engañosa en condiciones legales de contratación frente a consumidores y empresas.
- **Solución Óptima Propuesta**:
  Auditar el listado de encargados y subencargados reales en `/privacy` y `/aviso-legal`, eliminando la referencia errónea a PayPal Europe e identificando con exactitud la entidad jurídica de Stripe aplicable en el EEE (Stripe Payments Europe, Ltd., Irlanda) junto a su finalidad y base jurídica.

---

## Bloque B: Cookies, ePrivacy, Transferencias Internacionales y Trazabilidad (`LEG-016` – `LEG-020`)

### [LEG-016] Transferencias y exposición de metadatos hacia Clearbit y servicios externos sin transparencia RGPD completa

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/company-logo`, `frontend/app/privacy/page.tsx` y `frontend/app/cookies/page.tsx`
- **Diagnóstico del Problema**:
  El servicio de resolución de logotipos corporativos realiza llamadas salientes hacia `logo.clearbit.com` (infraestructura sujeta a jurisdicción de EE. UU.), y el portal integra servicios externos estadounidenses (Google Fonts/Servicios de Google y OneSignal) sin detallar en la Política de Privacidad y Cookies el mecanismo jurídico completo de transferencia internacional aplicable a cada proveedor conforme a los artículos 44 a 49 del RGPD ni aislar completamente Clearbit como llamada proxy backend libre de cookies y PII de visitantes.
- **Riesgo o Impacto**:
  Transferencia o comunicación no informada de datos de conexión (como dirección IP o identificadores push) hacia terceros países sin informar de las garantías adecuadas (EU-US Data Privacy Framework o Cláusulas Contractuales Tipo, Art. 13.1.f y Arts. 44-46 RGPD).
- **Solución Óptima Propuesta**:
  Asegurar que ninguna petición de logos hacia Clearbit u otros APIs de terceros se ejecute directamente desde el navegador del usuario sino cacheada de forma anónima en backend, actualizar `/privacy` detallando cada proveedor en terceros países con su mecanismo vigente (DPF / SCCs) y enlazar sus políticas de privacidad oficiales.

### [LEG-017] Retrocompatibilidad permisiva con `cookies_accepted === 'true'` que concede acceso global sin granularidad

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 1-290) y `frontend/app/layout.tsx` (líneas 181 y 250)
- **Diagnóstico del Problema**:
  La lógica de lectura del consentimiento de cookies interpreta el valor heredado plano `cookies_accepted === 'true'` en `localStorage` como autorización simultánea para todas las categorías no esenciales (analítica, publicidad y notificaciones), otorgando consentimiento en bloque para finalidades heterogéneas sin desglose específico previo.
- **Riesgo o Impacto**:
  Vulneración directa de los artículos 4.11, 6.1.a y 7 del RGPD, del artículo 22.2 de la LSSI-CE y de la Guía sobre el uso de las cookies de la AEPD, que prohíbe expresamente el consentimiento agrupado ("bundled consent") para finalidades distintas sin aceptación granular por categoría.
- **Solución Óptima Propuesta**:
  Invalidar cualquier bandera heredada genérica `cookies_accepted === 'true'` para categorías no esenciales, migrar a un esquema JSON versionado por categoría donde cualquier estado heredado no granular requiera nueva confirmación explícita del usuario y cargue cero scripts de analítica/publicidad hasta recibir opt-in granular.

### [LEG-018] Elevación indebida del consentimiento en `handleSaveCustom` de `CookieBanner`

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 1-290)
- **Diagnóstico del Problema**:
  Al guardar preferencias personalizadas mediante `handleSaveCustom`, el componente asigna la clave `cookies_accepted = 'true'` siempre que analítica O publicidad sea verdadera. Si otro script o fallback de carga consulta esa clave ante un error de parseo del JSON detallado, el usuario que únicamente aceptó analítica queda tratado legalmente como si hubiera aceptado cookies publicitarias y perfilado de anuncios.
- **Riesgo o Impacto**:
  Activación sin consentimiento específico de etiquetas de publicidad o personalización tras una decisión explícita de rechazo de esa categoría, generando una infracción grave del artículo 22.2 de la LSSI-CE y el artículo 6.1.a del RGPD.
- **Solución Óptima Propuesta**:
  Eliminar por completo la escritura y lectura de `cookies_accepted = 'true'`, leer cada finalidad estrictamente desde su booleano específico (`preferences.analytics === true`, `preferences.advertising === true`, `preferences.notifications === true`) y ante cualquier error de parseo adoptar por defecto el estado más restrictivo (`false` en todas las categorías opcionales).

### [LEG-019] Revocación inoperante en `purgeNonEssentialStorage()` para OneSignal y cookies persistentes

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 1-290)
- **Diagnóstico del Problema**:
  Cuando el usuario abre el panel de configuración para retirar el consentimiento previamente aceptado, la rutina de limpieza `purgeNonEssentialStorage()` no invoca la API oficial de cancelación de OneSignal (`OneSignal.User.PushSubscription.optOut()`) ni puede borrar cookies de terceros o con atributo `HttpOnly` ya depositadas en sesiones previas.
- **Riesgo o Impacto**:
  Incumplimiento del artículo 7.3 del RGPD y de las directrices de la AEPD: la retirada del consentimiento se convierte en un mero cambio visual en `localStorage` mientras la suscripción push o rastreadores externos continúan activos en el navegador del ciudadano.
- **Solución Óptima Propuesta**:
  Integrar `OneSignal.User.PushSubscription.optOut()` y limpieza explícita de IndexedDB/ServiceWorker de notificaciones en la función de revocación, bloquear el disparo posterior de cualquier SDK mediante guardas reactivas en memoria y notificar mediante endpoint backend la revocación de cookies técnicas si alguna fuese emitida por el servidor.

### [LEG-020] Declaraciones inexactas en la Política de Cookies (`/cookies`) frente al comportamiento real del código

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/cookies/page.tsx` (líneas 1-120), `frontend/app/layout.tsx` (líneas 199-201) y `frontend/components/SaveJobButton.tsx` (líneas 1-150)
- **Diagnóstico del Problema**:
  La página informativa `/cookies` afirma al usuario que la clave `theme` persiste su preferencia durante 1 año y que `saved_jobs` guarda sus ofertas localmente en `localStorage` sin requerir cuenta. En realidad, `layout.tsx` ejecuta `localStorage.removeItem('theme')` destruyendo la primera en cada carga, y `SaveJobButton.tsx` impide guardar ofertas de forma anónima redirigiendo forzosamente a `/login`. Asimismo, el inventario de terceros no refleja con exactitud los scripts efectivamente activados.
- **Riesgo o Impacto**:
  Incumplimiento del principio de transparencia y del deber de información clara y completa de la segunda capa de cookies exigida por el artículo 22.2 de la LSSI-CE y el artículo 13 del RGPD.
- **Solución Óptima Propuesta**:
  Alinear íntegramente el comportamiento técnico del frontend con lo informado en `/cookies` (restaurando la persistencia funcional de `theme` y `saved_jobs` locales) y actualizar la tabla de la Política de Cookies detallando nombre exacto, proveedor, finalidad, tipo de almacenamiento y duración real de cada cookie o clave `localStorage`.

### [LEG-021] Ausencia de registro probatorio en servidor (`consent_audit_log`) para elecciones del banner de cookies

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/components/CookieBanner.tsx` (líneas 1-290) y `backend/consolidate_production_schema.py`
- **Diagnóstico del Problema**:
  El historial de aceptaciones, rechazos y cambios granulares de preferencias en el banner de cookies se guarda únicamente en el navegador del visitante (`localStorage`) sin enviar o registrar una traza seudonimizada (con versión del texto informativo, fecha y marca de preferencia) en la tabla `consent_audit_log` del servidor o con plazo máximo de renovación de 24 meses conforme a las directrices de la AEPD.
- **Riesgo o Impacto**:
  Dificultad probatoria para demostrar la validez histórica de un consentimiento en caso de auditoría de cumplimiento (Art. 7.1 RGPD) y ausencia de revalidación forzosa al actualizar la lista de proveedores o tras transcurrir 24 meses.
- **Solución Óptima Propuesta**:
  Incluir un campo `version` y `updatedAt` en el registro de consentimiento en `localStorage`/cookie técnica forzando re-solicitud cuando cambie la versión de política o exceda 24 meses, y emitir registro seudonimizado opcional hacia `/api/consent/log` en `consent_audit_log`.

### [LEG-022] Omisión de trazabilidad de versión de Política de Privacidad en registros de cuentas de usuario

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/api/auth/register` y `frontend/app/actions.ts`
- **Diagnóstico del Problema**:
  Los flujos de registro de cuenta de candidatos y captación de formularios secundarios no consolidan de manera uniforme el registro de `consent_policy_version`, marca temporal e IP hasheada en `consent_audit_log` con el mismo rigor que un alta auditada, dificultando saber qué versión exacta de las cláusulas aceptó cada cuenta histórica.
- **Riesgo o Impacto**:
  Laguna probatoria ante eventuales cambios sustanciales en el tratamiento de datos personales o reclamaciones sobre condiciones informadas en el momento de creación de cuenta (Art. 7.1 y Art. 13 RGPD).
- **Solución Óptima Propuesta**:
  Centralizar una utilidad de auditoría `recordConsentEvent(tx, { subjectHash, eventType, policyVersion, accepted })` invocada de forma obligatoria en `/api/auth/register`, `/api/subscribe`, `/api/checkout` y en la acción gratuita de publicación de ofertas.

---

## Bloque C: Propiedad Intelectual, Web Scraping (Directiva TDM 2019/790) y Bases de Datos (`LEG-023` – `LEG-027`)

### [LEG-023] Configuración "fail-open" del verificador `robots.txt` / TDM ante errores de red o timeouts

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `backend/logic/tdm.py` (líneas 39-41)
- **Diagnóstico del Problema**:
  Al consultar `robots.txt` y comprobar directivas de exclusión para minería de textos y datos (TDM), los bloques de manejo de excepciones en `backend/logic/tdm.py` devuelven permiso afirmativo ("fail-open") cuando falla la conexión, vence el timeout o se recibe una respuesta inesperada.
- **Riesgo o Impacto**:
  En caso de caída momentánea, bloqueo temporal o limitación de tasa en `robots.txt`, el sistema procede a extraer masivamente ofertas de un tercero sin haber verificado si existe una reserva expresa de derechos legible por máquina en virtud del artículo 4.3 de la Directiva (UE) 2019/790 y el artículo 67.3 del Real Decreto-ley 24/2021 español.
- **Solución Óptima Propuesta**:
  Invertir inmediatamente el comportamiento a modo estricto "fail-closed": ante error de red, timeout o código distinto de `200`/`404` al leer `robots.txt` o evaluar cabeceras `TDM-Reservation`, abortar la extracción sobre ese dominio, cachear resultados `200`/`404` durante un máximo de 24 horas y registrar el incidente.

### [LEG-024] Cobertura parcial e incoherente de la comprobación TDM entre adaptadores de scraping

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/scrapers/himalayas.py` (líneas 1-86), `backend/scrapers/` (`jobfluent.py`, `pythonorg.py`, `remoteok.py`, `remotive.py`, `workingnomads.py`, `wwr.py`) y `backend/logic/tdm.py`
- **Diagnóstico del Problema**:
  La comprobación centralizada `backend/logic/tdm.py` no es invocada de manera homogénea por todos los scrapers del proyecto; en particular, `backend/scrapers/himalayas.py` nunca importa ni llama a `tdm.is_scraping_allowed()`, y varios módulos consumen feeds o páginas sin comprobar de forma sistemática exclusiones TDM o `robots.txt` por cada endpoint.
- **Riesgo o Impacto**:
  Riesgo de violación del artículo 4.3 de la Directiva (UE) 2019/790 (excepción comercial de minería de textos y datos condicionada a ausencia de reserva expresa opt-out) y posible vulneración contractual de términos de servicio de fuentes externas.
- **Solución Óptima Propuesta**:
  Integrar la verificación obligatoria de `tdm.is_scraping_allowed()` y lectura de cabeceras TDM directamente en el cliente HTTP compartido `backend/logic/scraper_http.py`, impidiendo que ningún scraper pueda realizar peticiones fuera de una puerta única de cumplimiento.

### [LEG-025] Identificación de bot ficticia (`yourwebsite.com`) en el `USER_AGENT` de Scrapy

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `backend/job_aggregator/settings.py` (línea 22)
- **Diagnóstico del Problema**:
  La constante `USER_AGENT` declarada en `backend/job_aggregator/settings.py` mantiene el texto plantilla de ejemplo `'yourwebsite.com'` en lugar de identificar de forma transparente al portal responsable (`PortalEmpleoITBot`), un dominio real verificable y una URL o dirección de correo de contacto para solicitudes de exclusión.
- **Riesgo o Impacto**:
  Falta de transparencia técnica frente a los titulares de sitios web rastreados, facilitando el bloqueo automático de IP por firewalls WAF y dificultando que editores legítimos ejerzan su opt-out técnico con el responsable.
- **Solución Óptima Propuesta**:
  Definir un `USER_AGENT` oficial y verificable (`PortalEmpleoITBot/1.0 (+https://portalempleoit.com/bot-info; contacto@...)`), publicar la página informativa `/bot-info` detallando propósito, frecuencia y canal de exclusión inmediata (`User-agent: PortalEmpleoITBot / Disallow: /`), y configurar el mismo encabezado en `scraper_http.py`.

### [LEG-026] Riesgo sobre el derecho *sui generis* de bases de datos (Directiva 96/9/CE y Art. 133 LPI) en agregación sistemática

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/job_aggregator/spiders/job_spider.py` (líneas 19-102), `backend/scraper_infoempleo.py` (líneas 1-118) y `backend/scrapers/` (`himalayas.py`, `jobfluent.py`, `pythonorg.py`, `remoteok.py`, `remotive.py`, `workingnomads.py`, `wwr.py`)
- **Diagnóstico del Problema**:
  El sistema extrae de manera recurrente y automatizada partes sustanciales o sistemáticas del contenido de listados de empleo y APIs de terceros sin mantener un registro verificado de autorización contractual, licencia expresa de redistribución por fuente ni limitación técnica estricta a metadatos factuales mínimos (título, empresa, ubicación y enlace profundo de atribución) en lugar de replicar descripciones íntegras protegidas.
- **Riesgo o Impacto**:
  Exposición a reclamaciones civiles o medidas cautelares por extracción y reutilización sistemática contraria al artículo 7 de la Directiva 96/9/CE sobre protección jurídica de las bases de datos y los artículos 133 y siguientes del Texto Refundido de la Ley de Propiedad Intelectual (RDL 1/1996), además de infracción de condiciones de uso de cada agregador.
- **Solución Óptima Propuesta**:
  Mantener una matriz documentada de licencias y acuerdos por origen (`sources_registry`: feeds RSS/API abiertos con atribución permitida frente a fuentes sujetas a opt-in/acuerdo escrito), limitar el almacenamiento público estrictamente a ficha factual breve con enlace directo `rel="nofollow"` a la fuente original y retirar las fuentes sin base autorizada clara.

### [LEG-027] Ausencia de canal formal de Notice-and-Takedown conforme al Art. 16 LSSI-CE y Reglamento DSA

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/aviso-legal/page.tsx`, `frontend/app/terminos/page.tsx` y flujo operativo `/admin`
- **Diagnóstico del Problema**:
  El portal actúa como agregador de vacantes de terceros y publica ofertas remitidas por usuarios/empresas, pero carece en su Aviso Legal y arquitectura de un procedimiento estructurado de notificación y retirada ágil ("Notice-and-Takedown") para titulares de derechos, empresas que soliciten retirar una oferta ya cubierta o denuncias de vacantes fraudulentas conforme al artículo 16 de la LSSI-CE y los artículos 16 y siguientes del Reglamento (UE) 2022/2065 (Digital Services Act).
- **Riesgo o Impacto**:
  Pérdida de la exención de responsabilidad como prestador de servicios de alojamiento/enlaces por no acreditar conocimiento efectivo ni actuación diligente en la retirada, además de incumplimiento de obligaciones de punto de contacto único y mecanismo de notificación exigidas por el DSA.
- **Solución Óptima Propuesta**:
  Habilitar un formulario web específico de denuncia/solicitud de retirada vinculado desde cada oferta y desde `/aviso-legal`, registrar la solicitud en base de datos con marca de tiempo, y añadir en `/admin` una lista de exclusión persistente (`blocked_external_urls` / `blocked_dedup_hashes`) para evitar que el scraper vuelva a importar una vacante retirada.

---

## Bloque D: Consumo (TRLGDCU / LSSI-CE), Transparencia Salarial, Igualdad, Accesibilidad y AI Act (`LEG-028` – `LEG-035`)

### [LEG-028] Bypass en la renuncia expresa al derecho de desistimiento en informes digitales (`TRLGDCU Art. 103.m`)

- **Nivel de Criticidad**: P0 - Crítico
- **Ubicación exacta**: `frontend/app/api/checkout/report/route.ts` (línea 23)
- **Diagnóstico del Problema**:
  La comprobación de aceptación de la pérdida del derecho de desistimiento para suministro inmediato de contenido digital está programada como `if (waiver_accepted === false)` en la línea 23. Si un cliente o script envía una petición omitiendo el campo (`undefined`) o con valor `null`, la condición evalúa a falso y permite iniciar el checkout sin haber recabado la confirmación expresa obligatoria.
- **Riesgo o Impacto**:
  Infracción del artículo 103.m del Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios (RDL 1/2007): en ausencia de consentimiento previo expreso y conocimiento de pérdida del derecho de desistimiento debidamente acreditado, el consumidor conservaría el derecho legal de desistimiento durante 14 días (o ampliado hasta 12 meses según Art. 105 TRLGDCU) aún después de haber descargado el informe.
- **Solución Óptima Propuesta**:
  Cambiar la validación a comprobación estricta positiva (`if (waiver_accepted !== true)`), exigir casilla desmarcada por defecto en la interfaz antes del pago y persistir la confirmación junto con sello temporal en los metadatos del pedido y del email de confirmación en soporte duradero.

### [LEG-029] Deficiencias de información precontractual, acuse de recibo y facturación en contratación electrónica

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/app/api/checkout/route.ts`, `frontend/app/api/checkout/newsletter/route.ts`, `frontend/app/api/checkout/premium-candidate/route.ts`, `frontend/app/api/checkout/report/route.ts` y `frontend/app/terminos/page.tsx` (líneas 1-99)
- **Diagnóstico del Problema**:
  Los flujos de pago y las Condiciones Generales (`/terminos`) no estructuran de forma completa y diferenciada por producto B2B/B2C el desglose obligatorio del precio final con impuestos incluidos (IVA aplicable o inversión del sujeto pasivo intracomunitario con validación VIES), los trámites técnicos paso a paso, las condiciones de cancelación de suscripciones recurrentes ni el envío automático en soporte duradero del contrato/factura reglamentaria (RD 1619/2012) en las 24 horas posteriores a la contratación.
- **Riesgo o Impacto**:
  Incumplimiento de los artículos 27 y 28 de la LSSI-CE (información previa y confirmación documental en contratación electrónica), artículos 97 y 98 del TRLGDCU y normativa fiscal española sobre facturación electrónica y registro de operaciones B2B.
- **Solución Óptima Propuesta**:
  Configurar Stripe Tax / Stripe Invoicing para calcular IVA aplicable según NIF-IVA/país y emitir facturas conformes al RD 1619/2012, enviar correo de confirmación contractual en soporte duradero desde el webhook `checkout.session.completed` incluyendo términos vigentes y detalle de renuncia cuando proceda, y actualizar `/terminos` con el procedimiento completo de contratación y hoja de reclamaciones/plataforma ODR aplicable.

### [LEG-030] Prácticas comerciales potencialmente engañosas por datos simulados (`9197` / `MOCK_JOBS`) y plan Enterprise no diferenciado

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `frontend/lib/jobs.ts` (líneas 174-235), `frontend/app/api/checkout/report/route.ts` (línea 46) y `frontend/app/api/checkout/report/download/route.ts` (líneas 140-156)
- **Diagnóstico del Problema**:
  Por un lado, el portal llega a presentar vacantes ficticias (`MOCK_JOBS`) o un conteo simulado (`9197`) al candidato cuando fallan o resultan vacías determinadas consultas. Por otro lado, comercializa un plan de informe `enterprise` prometiendo insights personalizados por stack y competencia en `/api/checkout/report` (línea 46), entregando después el mismo PDF genérico de 10 líneas que el resto de niveles.
- **Riesgo o Impacto**:
  Posible calificación como práctica comercial engañosa o falta de conformidad de los servicios digitales (artículos 5 y 7 de la Ley 3/1991 de Competencia Desleal y artículos 115 bis y siguientes del TRLGDCU sobre conformidad de contenidos y servicios digitales), con obligación legal de resolución contractual, devolución íntegra del precio e eventual sanción administrativa de consumo.
- **Solución Óptima Propuesta**:
  Retirar inmediatamente `MOCK_JOBS` y cualquier cifra ficticia en producción, y bloquear la venta de la modalidad `enterprise` (o cualquier funcionalidad parametrizada) mientras el generador PDF no produzca efectivamente las analíticas personalizadas descritas en la oferta comercial.

### [LEG-031] Falta de preparación estructural para la Directiva (UE) 2023/970 de Transparencia Retributiva

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/publicar-oferta/PublishForm.tsx` (líneas 270-493), `frontend/app/api/checkout/route.ts` y `backend/job_aggregator/spiders/job_spider.py` (líneas 19-102)
- **Diagnóstico del Problema**:
  La Directiva (UE) 2023/970 (de aplicación obligatoria en Estados miembros a más tardar el 7 de junio de 2026) establece en su artículo 5 el derecho de los candidatos a recibir información de las empresas empleadoras sobre la retribución inicial o su banda salarial antes de la entrevista o directamente en el anuncio de vacante, prohibiendo además recabar historial salarial previo. Actualmente tanto el formulario de publicación de empresas (`PublishForm.tsx`) como los flujos de checkout permiten publicar ofertas sin banda retributiva, y `job_spider.py` asigna por defecto `"Consultar"`.
- **Riesgo o Impacto**:
  Obsolescencia normativa inminente del flujo B2B de publicación de empleo en España y la UE, pérdida de competitividad frente a portales que exigen transparencia retributiva y exposición a incidencias si las empresas clientes utilizan plantillas sin banda salarial obligatoria.
- **Solución Óptima Propuesta**:
  Incorporar en `PublishForm.tsx` y en el modelo de publicación B2B campos estructurados de `banda salarial mínima`, `banda salarial máxima`, `divisa` y `periodicidad` con indicación normativa para empleadores en la UE y badge visible de transparencia retributiva en tarjetas y filtros.

### [LEG-032] Ausencia de control preventivo automatizado contra ofertas discriminatorias (Ley 15/2022 y Art. 17 ET)

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/publicar-oferta/PublishForm.tsx` (líneas 270-493) y `frontend/app/actions.ts` (línea 637)
- **Diagnóstico del Problema**:
  La publicación directa de ofertas gratuitas y de pago confía exclusivamente en el marcado declarativo de condiciones por el usuario sin ejecutar ninguna regla automática de detección o advertencia ante términos prohibidos o indiciariamente discriminatorios por razón de edad ("menor de 30", "recién titulado joven"), sexo/género excluyente, origen nacional o discapacidad (Art. 14 CE, Art. 17.1 Estatuto de los Trabajadores y Ley 15/2022 integral para la igualdad de trato y la no discriminación).
- **Riesgo o Impacto**:
  Publicación e indexación bajo el dominio del portal de anuncios contrarios a la normativa laboral y antidiscriminatoria española, con riesgo reputacional e imposición de medidas de retirada por la Inspección de Trabajo y Seguridad Social o Autoridad Independiente para la Igualdad de Trato.
- **Solución Óptima Propuesta**:
  Implementar un validador léxico-contextual en el backend antes de aceptar ofertas propias en `PublishForm.tsx` / `actions.ts` (y durante la ingesta para alertas de moderación) que detecte expresiones de edadismo, género excluyente o nacionalidad no justificada, bloqueando o enviando a revisión humana manual en `/admin` antes de su publicación.

### [LEG-033] Ausencia de divulgación obligatoria de contenido generado por IA conforme al Art. 50 del Reglamento (UE) 2024/1689 (AI Act)

- **Nivel de Criticidad**: P1 - Alto
- **Ubicación exacta**: `backend/generate_news_post.py`, `backend/generate_weekly_article.py`, `backend/generate_podcast_script.py`, `backend/generate_blog_post.py`, `backend/generate_market_report.py`, `backend/generate_trends_post.py` y `frontend/app/noticias/[slug]/page.tsx`
- **Diagnóstico del Problema**:
  Los artículos, noticias del sector, análisis de tendencias y guiones de podcast generados íntegramente mediante modelos de lenguaje se publican en el portal atribuidos a la firma editorial humana `'Redacción Portal IT'` sin incluir etiqueta visible para el usuario final que advierta de su creación artificial ni metadatos técnicos de origen, en contraste con las obligaciones de transparencia del artículo 50 del Reglamento (UE) 2024/1689 (AI Act, plenamente exigible desde agosto de 2026) aplicables a sistemas de IA interactivos (`AISearchBar`) y texto informativo generado por IA de interés público cuando no medie control editorial humano efectivo.
- **Riesgo o Impacto**:
  Incumplimiento de las obligaciones de transparencia para proveedores y responsables del despliegue bajo el Reglamento europeo de Inteligencia Artificial (sancionable conforme al Art. 99 AI Act) y erosión de confianza de lectores al descubrir contenido sintético encubierto como redacción periodística tradicional.
- **Solución Óptima Propuesta**:
  Añadir una columna booleana `is_ai_generated` y campo `reviewed_by` en las tablas editoriales; mostrar de forma clara e inequívoca un distintivo de transparencia ("Contenido elaborado con asistencia de IA bajo revisión editorial") en `noticias/[slug]`, blog, informes y resultados de `AISearchBar`, e incluir metadatos estructurales trazables.

### [LEG-034] Riesgos de cumplimiento en accesibilidad digital bajo la Ley 11/2023 (European Accessibility Act) y EN 301 549

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `frontend/app/layout.tsx` (líneas 199-201), `frontend/components/AISearchBar.tsx`, `frontend/components/CookieBanner.tsx` y `frontend/app/publicar-oferta/PublishForm.tsx`
- **Diagnóstico del Problema**:
  La Ley 11/2023 (transposición de la Directiva UE 2019/882 sobre requisitos de accesibilidad de servicios de comercio electrónico y consumo) exige conformidad con la norma europea EN 301 549 / WCAG 2.1 nivel AA en plataformas digitales de servicios y contratación electrónica. El portal carece de Declaración de Accesibilidad pública, destruye las preferencias manuales de contraste/tema mediante `localStorage.removeItem('theme')` en `layout.tsx` y no incorpora auditoría continua de atributos ARIA, foco por teclado ni contraste en componentes interactivos clave (`CookieBanner`, `AISearchBar`, `PublishForm`).
- **Riesgo o Impacto**:
  Exclusión de candidatos y anunciantes con discapacidad visual o motora en el uso del buscador y formularios de contratación, incumplimiento de los requisitos exigibles bajo la Ley 11/2023 y exposición a expedientes sancionadores en materia de consumo y derechos de personas con discapacidad.
- **Solución Óptima Propuesta**:
  Integrar `@axe-core/playwright` en la suite de pruebas CI sobre las rutas críticas, garantizar navegación completa por teclado, foco visible, gestión de diálogo modal ARIA en `CookieBanner` y persistencia real de tema accesible, y publicar la página oficial de Declaración de Accesibilidad y canal de incidencias en el footer.

### [LEG-035] Carencia de trazabilidad formal de Registro de Actividades de Tratamiento (RAT), EIPD y protocolo de brechas RGPD

- **Nivel de Criticidad**: P2 - Medio
- **Ubicación exacta**: `docs/`, `frontend/app/privacy/page.tsx` y arquitectura operativa (`backend/send_custom_alerts.py`, `backend/logic/tracking.py`, `frontend/lib/userAuth.ts`)
- **Diagnóstico del Problema**:
  El tratamiento conjunto de perfiles profesionales de candidatos, alertas segmentadas por tecnología/ubicación, seguimiento conductual de clics/aperturas (`tracking.py`), autenticación con sesiones/reseteos (`userAuth.ts`) y reseñas moderadas carece en el repositorio de documentación operativa técnica asociada al cumplimiento orgánico del RGPD: Registro de Actividades de Tratamiento (Art. 30 RGPD), análisis de necesidad de Evaluación de Impacto (EIPD, Art. 35 RGPD para perfilado sistemático) y un protocolo técnico formal de detección y notificación de brechas de seguridad en el plazo máximo de 72 horas ante la AEPD (Arts. 33 y 34 RGPD).
- **Riesgo o Impacto**:
  Ante un incidente de seguridad en `db_proxy.php`, fuga de credenciales de base de datos o inspección de la AEPD, la organización carece de documentación de responsabilidad proactiva (Art. 5.2 y Art. 24 RGPD) y procedimiento accionable de respuesta y notificación en 72 horas.
- **Solución Óptima Propuesta**:
  Redactar y mantener junto a la arquitectura del proyecto el Registro de Actividades de Tratamiento actualizado, evaluar la supresión o minimización del perfilado de tracking para evitar evaluaciones de alto riesgo innecesarias, e implementar un runbook técnico de gestión de brechas con logs auditables inmutables y contactos de notificación a la AEPD.
