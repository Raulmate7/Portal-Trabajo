import { BASE_URL } from './constants';

export async function submitUrlsToIndexNow(
  urls: string[]
): Promise<{ success: boolean; submitted: number; status?: number; message?: string }> {
  const cleanUrls = Array.from(
    new Set(
      urls
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http://') || u.startsWith('https://'))
    )
  ).slice(0, 10000);

  if (cleanUrls.length === 0) {
    return { success: true, submitted: 0 };
  }

  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    console.warn('⚠️ IndexNow: INDEXNOW_KEY no está definida. Saltando envío.');
    return { success: false, submitted: 0, message: 'INDEXNOW_KEY not configured' };
  }

  try {
    const parsedBase = new URL(BASE_URL);
    const payload = {
      host: parsedBase.hostname,
      key,
      keyLocation: `${BASE_URL}/${key}.txt`,
      urlList: cleanUrls,
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 200 || res.status === 202) {
      return { success: true, submitted: cleanUrls.length, status: res.status };
    }

    const text = await res.text().catch(() => '');
    console.warn(`⚠️ IndexNow HTTP ${res.status}: ${text}`);
    return {
      success: false,
      submitted: 0,
      status: res.status,
      message: text || `HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ IndexNow error:', msg);
    return { success: false, submitted: 0, message: msg };
  }
}
