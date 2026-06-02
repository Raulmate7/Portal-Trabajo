import crypto from 'crypto';

interface IndexingResponse {
  success: boolean;
  message: string;
}

/**
 * Envía una notificación a la Google Indexing API para indexar o desindexar una URL en minutos.
 * Requiere la variable de entorno GOOGLE_INDEXING_CREDENTIALS con el JSON de la cuenta de servicio de Google.
 * 
 * @param url - La URL completa a indexar (ej: https://portal-trabajo.vercel.app/job/123)
 * @param type - Tipo de notificación: 'URL_UPDATED' (añadir/actualizar) o 'URL_DELETED' (eliminar)
 */
export async function requestGoogleIndexing(
  url: string, 
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<IndexingResponse> {
  const credentialsJson = process.env.GOOGLE_INDEXING_CREDENTIALS;
  
  if (!credentialsJson) {
    console.warn("⚠️ Google Indexing API: La variable de entorno GOOGLE_INDEXING_CREDENTIALS no está definida. Saltando indexación instantánea.");
    return { success: false, message: "Credentials not configured in environment" };
  }

  try {
    const creds = JSON.parse(credentialsJson);
    const privateKey = creds.private_key;
    const clientEmail = creds.client_email;

    if (!privateKey || !clientEmail) {
      throw new Error("Formato de credenciales inválido. Faltan private_key o client_email.");
    }

    // 1. Generar el JWT para la autenticación de Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const base64UrlEncode = (str: string) => {
      return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwtToken = `${unsignedToken}.${signature}`;

    // 2. Solicitar el token de acceso OAuth2 a Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Google OAuth error: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    // 3. Enviar la URL a la Google Indexing API
    const publishResponse = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        url: url,
        type: type
      })
    });

    const publishData = await publishResponse.json();
    if (!publishResponse.ok) {
      throw new Error(`Google Indexing error: ${JSON.stringify(publishData)}`);
    }

    console.log(`✅ Google Indexing API: Notificación enviada con éxito (${type}) para ${url}`);
    return { success: true, message: "URL successfully notified" };

  } catch (error: any) {
    console.error("❌ Google Indexing API Error:", error.message || error);
    return { success: false, message: error.message || "Unknown error" };
  }
}
