import { requestGoogleIndexing } from '@/lib/googleIndexing';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Protección opcional por Token para evitar abusos externos
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, type } = body;
    
    if (!url) {
      return new Response(JSON.stringify({ success: false, message: "Falta el parámetro 'url'" }), { 
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
