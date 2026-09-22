import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { trackOpenLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Retornar píxel 1x1 siempre
  const pixelBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const pixelBuffer = Buffer.from(pixelBase64, 'base64');
  const response = new NextResponse(pixelBuffer, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });

  const ip = getClientIp(request as any);
  const rateLimit = trackOpenLimiter.limit(ip);
  if (!rateLimit.success) {
    return response; // Si hay abuso, retornamos la imagen en silencio
  }

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim();
  const campaign = (searchParams.get('campaign') || '').trim();

  // Validación estricta
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const campaignValid = /^[a-zA-Z0-9\-_]{1,60}$/.test(campaign);

  if (emailValid && campaignValid) {
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO email_tracking (email, campaign) VALUES ($1, $2)',
        [email.trim(), campaign.trim()]
      );
      console.log(`📈 Email open tracked: ${email} in campaign ${campaign}`);
    } catch (error) {
      console.error('Error logging email track-open:', error);
      // No fallamos la respuesta para no mostrar una imagen rota en el cliente de correo
    } finally {
      client.release();
    }
  }

  return response;
}
