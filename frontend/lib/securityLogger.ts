/**
 * SEC-065: Telemetría estructurada de seguridad y alertas operativas tempranas.
 */
export type SecurityLevel = 'SECURITY_INFO' | 'SECURITY_WARN' | 'SECURITY_CRITICAL';

export async function logSecurityEvent(
  level: SecurityLevel,
  event: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...details,
  };

  if (level === 'SECURITY_CRITICAL') {
    console.error(JSON.stringify(payload));
  } else {
    console.warn(JSON.stringify(payload));
  }

  if (level === 'SECURITY_CRITICAL') {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_ID;
    if (token && chatId) {
      const text = `🚨 [SECURITY_CRITICAL] ${event}\n${JSON.stringify(details).slice(0, 500)}`;
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }
  }
}
