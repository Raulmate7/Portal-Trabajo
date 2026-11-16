# Documentación Orgánica RGPD — Portal Trabajo IT

> Marco normativo: Reglamento (UE) 2016/679 (RGPD), Ley Orgánica 3/2018 (LOPDGDD), LSSI-CE (Ley 34/2002).

## 1. Registro de Actividades de Tratamiento (RAT — Art. 30 RGPD)

| Actividad | Finalidad | Base Jurídica (Art. 6 RGPD) | Categoría de Interesados | Categoría de Datos | Plazo de Conservación |
|---|---|---|---|---|---|
| **Cuentas de Candidatos / Usuarios** | Autenticación, ofertas guardadas y panel de preferencias | Art. 6.1.b (ejecución de servicio) | Usuarios registrados | Email, nombre, hash de contraseña (`scrypt`), `ip_hash` | Hasta solicitud de supresión o inactividad prolongada |
| **Alertas de Empleo y Newsletter** | Envío de boletines diarios/semanales y alertas personalizadas | Art. 6.1.a (consentimiento expreso Double Opt-In) | Suscriptores | Email, keywords técnicas, ubicación, versión de política, `ip_hash` | Hasta revocación (`unsubscribe`) o 30 días si DOI no confirmado |
| **Facturación B2B/B2C y Ofertas Destacadas** | Publicación de vacantes patrocinadas, patrocinio newsletter e informes | Art. 6.1.b (contrato) y Art. 6.1.c (obligación fiscal) | Empresas anunciantes y compradores | Email corporativo, datos Stripe (sin PAN), metadatos de oferta | 4–6 años (LGT / Código de Comercio para registros contables) |
| **Moderación de Reseñas y Notice-and-Takedown** | Prevención de fraude, abuso y retirada ilícita (DSA / LSSI-CE) | Art. 6.1.c (obligación legal) y Art. 6.1.f (interés legítimo) | Denunciantes y revisores | Motivo de denuncia, `ip_hash`, estado de resolución | 12 meses tras resolución (`cleanup_retention.py`) |
| **Lista de Supresión RGPD (`email_suppression_list`)** | Garantizar el bloqueo efectivo tras baja u oposición | Art. 6.1.c (cumplimiento Art. 17/21 RGPD) | Ex-suscriptores / opositores | Hash SHA-256 del correo electrónico | Indefinido (mínimo imprescindible para bloqueo) |

## 2. Evaluación de Impacto en Protección de Datos (EIPD — Art. 35 RGPD)

- **Conclusión de cribado**: No se realizan decisiones automatizadas con efectos jurídicos (Art. 22 RGPD) ni tratamiento de categorías especiales (Art. 9 RGPD).
- **Mitigación de riesgo de perfilado en tracking**: El seguimiento nominal de aperturas/clics utiliza tokens cifrados **AES-256-GCM** (`v2.`) sin PII en URLs, con rotación/expiración a 12 meses en `cleanup_retention.py` y bandera `DISABLE_INDIVIDUAL_EMAIL_TRACKING=true` para operar sin rastreo individualizado.

## 3. Protocolo de Gestión y Notificación de Brechas de Seguridad (Arts. 33–34 RGPD)

1. **Detección y Contención (< 2h)**:
   - Revocar credenciales afectadas (`ADMIN_SESSION_SECRET`, `USER_SESSION_SECRET`, `DB_PROXY_TOKEN`, `TRACKING_HMAC_SECRET`, `STRIPE_WEBHOOK_SECRET`).
   - Incrementar `session_version` o purgar `user_sessions` / `admin_audit_logs`.
   - Aislar `db_proxy.php` o activar bloqueo WAF en Nginx / Cloudflare.
2. **Evaluación de Riesgo (< 24h)**:
   - Determinar si afecta a datos personales (`subscribers`, `users`) y si los datos estaban cifrados o hasheados (`scrypt`, `SHA-256`, `AES-256-GCM`).
3. **Notificación ante la AEPD (< 72h, Art. 33 RGPD)**:
   - Si existe riesgo para derechos y libertades, notificar a través de la Sede Electrónica de la **Agencia Española de Protección de Datos (AEPD)** adjuntando naturaleza de la brecha, categorías aproximadas de interesados, contacto del responsable y medidas correctoras adoptadas.
4. **Comunicación a los Interesados (Art. 34 RGPD)**:
   - Si el riesgo es **alto**, notificar sin dilación indebida a los usuarios afectados en lenguaje claro indicando recomendaciones (p. ej., cambio de contraseña).
