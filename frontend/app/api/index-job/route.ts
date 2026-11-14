import { requestGoogleIndexing } from '@/lib/googleIndexing';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { indexJobLimiter, getClientIp } from '@/lib/rate-limit';
import { isSafePublicUrl } from '@/lib/urlSafety';
import { z } from 'zod';

const indexJobSchema = z.object({
  url: z.string().trim().min(1).max(1000),
  type: z.enum(['URL_UPDATED', 'URL_DELETED']).default('URL_UPDATED'),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = await indexJobLimiter.limitAsync(clientIp);
  if (!rateLimit.success) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { 
      status: 429, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Fail-closed estricto: requiere CRON_SECRET de longitud adecuada y cabecera Authorization válida
  if (!cronSecret || cronSecret.length < 16 || !authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  const isMatch = authHeader.length === expectedAuth.length &&
    crypto.timingSafeEqual(Buffer.from(authHeader, 'utf-8'), Buffer.from(expectedAuth, 'utf-8'));

  if (!isMatch) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const parsedBody = indexJobSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ success: false, message: "Parámetros inválidos (se requiere 'url' y 'type' en ['URL_UPDATED', 'URL_DELETED'])" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { url, type } = parsedBody.data;
    
    if (!isSafePublicUrl(url)) {
      return new Response(JSON.stringify({ success: false, message: "Falta el parámetro 'url' válido o apunta a un destino no permitido" }), { 
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

      // Vector 29: Restricción estricta al dominio oficial para prevenir abuso de cuota y Search Console spam
      const allowedHostnames = new Set(['portalempleoit.com', 'www.portalempleoit.com', 'localhost']);
      if (!allowedHostnames.has(parsed.hostname.toLowerCase())) {
        return new Response(JSON.stringify({ success: false, message: "Dominio no autorizado para indexación en este portal" }), {
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

    const result = await requestGoogleIndexing(url, type);
    
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
