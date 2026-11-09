import { sendGAEvent } from '@next/third-parties/google';

/**
 * Comprueba si el usuario ha otorgado consentimiento explícito para analítica web
 * de conformidad con el Art. 22.2 LSSI-CE y la Guía de Cookies de la AEPD.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('cookies_consent');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.analytics === true;
    }
    return localStorage.getItem('cookies_accepted') === 'true';
  } catch {
    return false;
  }
}

/**
 * Envía eventos a Google Analytics 4 únicamente si existe consentimiento analítico previo.
 * Evita contaminar window.dataLayer o activar rastreadores de terceros sin consentimiento.
 */
export function sendSafeGAEvent(payload: Record<string, any>) {
  if (!hasAnalyticsConsent()) {
    return;
  }
  try {
    sendGAEvent(payload);
  } catch (e) {
    console.warn('Safe GA Event tracking error:', e);
  }
}

