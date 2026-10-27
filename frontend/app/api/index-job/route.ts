import { requestGoogleIndexing } from '@/lib/googleIndexing';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Fail-closed estricto: requiere CRON_SECRET y cabecera Authorization válida
  if (!cronSecret || !authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  const isMatch = authHeader.length === expectedAuth.length &&
    crypto.timingSafeEqual(Buffer.from(authHeader, 'utf-8'), Buffer.from(expectedAuth, 'utf-8'));

  if (!isMatch) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, type } = body;
    
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, message: "Falta el parámetro 'url' válido" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return new Response(JSON.stringify({ success: false, message: "Protocolo de URL inválido" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch {
      return new Response(JSON.stringify({ success: false, message: "URL malformada" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await requestGoogleIndexing(url, type || 'URL_UPDATED');
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message || "Error procesando petición" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
