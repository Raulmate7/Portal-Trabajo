import crypto from 'crypto';

interface SyncEmailParams {
  client: { query: (sql: string, params?: any[]) => Promise<{ rows: any[] }> };
  userId: number;
  email: string;
  enabled: boolean;
  clientIp: string;
  action: string;
  techKeywords?: string;
  locationPref?: string;
  frequency?: string;
  techKeywordsJson?: string | null;
}

/**
 * Sincroniza la preferencia de recepción de correos electrónicos del usuario
 * entre `users`, `subscribers`, `email_suppression_list` y `consent_audit_log`.
 */
export async function syncEmailNotificationPreference(params: SyncEmailParams): Promise<void> {
  const cleanEmail = params.email.trim().toLowerCase();
  const emailHash = crypto.createHash('sha256').update(cleanEmail).digest('hex');
  const ipSalt = process.env.APP_SECRET || 'consent_salt_v1';
  const ipHash = crypto.createHash('sha256').update(`${params.clientIp}:${ipSalt}`).digest('hex');
  const policyVersion = 'v2026.11';

  const cleanTech = (params.techKeywords || 'todas').trim().slice(0, 500) || 'todas';
  const cleanLoc = (params.locationPref || 'Remoto/España').trim().slice(0, 255) || 'Remoto/España';
  const cleanFreq = ['daily', 'weekly', 'biweekly', 'monthly'].includes(params.frequency || '')
    ? (params.frequency as string)
    : 'weekly';

  if (params.enabled) {
    // 1. Retirar de la lista de supresión si se había dado de baja previamente
    try {
      await params.client.query('DELETE FROM email_suppression_list WHERE email_hash = $1', [emailHash]);
    } catch {}

    // 2. Insertar o reactivar en subscribers
    const existing = await params.client.query('SELECT id FROM subscribers WHERE email = $1 LIMIT 1', [cleanEmail]);

    if (existing.rows && existing.rows.length > 0) {
      try {
        await params.client.query(
          `UPDATE subscribers
           SET is_active = TRUE,
               status = 'active',
               marketing_accepted = TRUE,
               consent_marketing_at = NOW(),
               consent_alerts_at = COALESCE(consent_alerts_at, NOW()),
               unsubscribed_at = NULL,
               user_id = $1,
               tech_keywords = COALESCE(NULLIF($2, ''), tech_keywords),
               location_pref = COALESCE(NULLIF($3, ''), location_pref),
               frequency = COALESCE(NULLIF($4, ''), frequency),
               tech_keywords_json = COALESCE($5, tech_keywords_json)
           WHERE email = $6`,
          [
            params.userId,
            params.techKeywords ? cleanTech : '',
            params.locationPref ? cleanLoc : '',
            params.frequency ? cleanFreq : '',
            params.techKeywordsJson ?? null,
            cleanEmail,
          ]
        );
      } catch {
        await params.client.query(
          `UPDATE subscribers
           SET is_active = TRUE,
               status = 'active',
               marketing_accepted = TRUE,
               unsubscribed_at = NULL
           WHERE email = $1`,
          [cleanEmail]
        );
      }
    } else {
      try {
        await params.client.query(
          `INSERT INTO subscribers (
             email, user_id, tech_keywords, tech_keywords_json, location_pref, frequency,
             source, is_active, status, created_at, consent_timestamp, consent_ip_hash,
             consent_policy_version, marketing_accepted, consent_alerts_at, consent_marketing_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, 'account_register', TRUE, 'active', NOW(), NOW(), $7, $8, TRUE, NOW(), NOW())`,
          [
            cleanEmail,
            params.userId,
            cleanTech,
            params.techKeywordsJson ?? null,
            cleanLoc,
            cleanFreq,
            ipHash,
            policyVersion,
          ]
        );
      } catch {
        await params.client.query(
          `INSERT INTO subscribers (
             email, tech_keywords, location_pref, frequency, source, is_active, status,
             created_at, consent_timestamp, consent_ip_hash, consent_policy_version, marketing_accepted
           )
           VALUES ($1, $2, $3, $4, 'account_register', TRUE, 'active', NOW(), NOW(), $5, $6, TRUE)`,
          [cleanEmail, cleanTech, cleanLoc, cleanFreq, ipHash, policyVersion]
        );
      }
    }

    // 3. Registrar evidencia de consentimiento
    try {
      await params.client.query(
        `INSERT INTO consent_audit_log (email_hash, action, policy_version, marketing_accepted, ip_hash, created_at)
         VALUES ($1, $2, $3, TRUE, $4, NOW())`,
        [emailHash, params.action, policyVersion, ipHash]
      );
    } catch {}
  } else {
    // El usuario desactiva los correos electrónicos (o se registra sin querer recibirlos)
    try {
      await params.client.query(
        `UPDATE subscribers
         SET is_active = FALSE,
             marketing_accepted = FALSE,
             status = 'unsubscribed_by_profile',
             unsubscribed_at = NOW(),
             user_id = COALESCE(user_id, $1)
         WHERE email = $2`,
        [params.userId, cleanEmail]
      );
    } catch {
      try {
        await params.client.query(
          `UPDATE subscribers
           SET is_active = FALSE,
               marketing_accepted = FALSE,
               status = 'unsubscribed_by_profile',
               unsubscribed_at = NOW()
           WHERE email = $1`,
          [cleanEmail]
        );
      } catch {}
    }

    try {
      await params.client.query(
        `INSERT INTO consent_audit_log (email_hash, action, policy_version, marketing_accepted, ip_hash, created_at)
         VALUES ($1, $2, $3, FALSE, $4, NOW())`,
        [emailHash, params.action, policyVersion, ipHash]
      );
    } catch {}
  }
}
