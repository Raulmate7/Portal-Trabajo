# Playbook de Respuesta a Incidentes y Brechas de Datos Personales (Art. 33–34 RGPD)

> **Ámbito**: Portal Trabajo IT (`portalempleoit.com`) — **Plazo máximo legal de notificación a la AEPD: 72 horas** desde la constancia de la brecha.

## 1. Detección y Triaje Inicial (T+0h a T+2h)
- **Señales monitorizadas**:
  - Eventos `SECURITY_WARN` y `SECURITY_CRITICAL` emitidos por `frontend/lib/securityLogger.ts` (fallos de firma Stripe, bloqueos 429 o intentos reiterados en `/api/admin/auth`).
  - Registros `admin_audit_logs` en BD MySQL y logs de `db_proxy.php` / Nginx.
- **Clasificación**:
  1. Confirmar si afecta a confidencialidad, integridad o disponibilidad de PII (`subscribers`, `company_reviews`, `newsletter_sponsors`, `report_downloads`).
  2. Registrar fecha/hora exacta de detección y preservar evidencias (logs sin PII en claro).

## 2. Contención Inmediata (T+2h a T+6h)
1. **Rotar secretos comprometidos** en Vercel, GitHub Actions y `.env` del servidor (`DB_PROXY_SECRET`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `UNSUBSCRIBE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`).
2. **Revocar todas las sesiones de administrador** ejecutando `revokeAllAdminSessionsAsync()` (incrementa `session_version` en `admin_security_state`).
3. **Bloquear IPs o endpoints afectados** en `nginx.conf.template` / Cloudflare y aplicar mantenimiento temporal si hay exfiltración activa.

## 3. Evaluación de Riesgo y Alcance (T+6h a T+24h)
- Determinar volumen aproximado de registros afectados, categorías de datos (email, preferencias, hash IP, datos de facturación) y si estaban cifrados o pseudonimizados.
- Si existe riesgo para los derechos y libertades de las personas físicas: preparar notificación obligatoria (Art. 33 RGPD).

## 4. Notificación Oficial a la AEPD (< 72 horas, Art. 33 RGPD)
- Presentar mediante sede electrónica de la AEPD (`sedeagpd.gob.es`):
  - Naturaleza de la brecha y categorías/número aproximado de interesados.
  - Datos de contacto del responsable (`LEGAL_CONFIG.email`).
  - Consecuencias probables y medidas técnicas/organizativas adoptadas para mitigarlas.

## 5. Comunicación a los Afectados (Art. 34 RGPD)
- Si la brecha entraña un **alto riesgo**, comunicar directamente por email en lenguaje claro y sencillo a los afectados las medidas de protección recomendadas y el canal de contacto.
