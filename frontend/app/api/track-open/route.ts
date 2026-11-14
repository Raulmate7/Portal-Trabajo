import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { trackOpenLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyOpaqueTrackingToken, verifyTrackingSignature } from '@/lib/trackingAuth';

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
  const rateLimit = await trackOpenLimiter.limitAsync(ip);
  if (!rateLimit.success) {
    return response; // Si hay abuso, retornamos la imagen en silencio
  }

  // RGPD Art. 25 (Privacidad desde el diseño): Respetar señales DNT (Do Not Track) y Sec-GPC
  const dnt = request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1';
  if (dnt) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const opaqueToken = (searchParams.get('t') || '').trim();

  let email = '';
  let campaign = '';
  let isAuthorized = false;

  if (opaqueToken) {
    const payload = verifyOpaqueTrackingToken(opaqueToken);
    if (payload) {
      email = payload.email;
      campaign = payload.campaign;
      isAuthorized = true;
    }
  } else {
    email = (searchParams.get('email') || '').trim().toLowerCase();
    campaign = (searchParams.get('campaign') || '').trim();
    const sig = (searchParams.get('sig') || '').trim();
    const exp = (searchParams.get('exp') || '').trim();
    isAuthorized = verifyTrackingSignature(email, campaign, sig, '', exp);
  }

  // Validación estricta + firma HMAC obligatoria (SEC-042)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const campaignValid = /^[a-zA-Z0-9\-_]{1,60}$/.test(campaign);

  if (isAuthorized && emailValid && campaignValid) {
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO email_tracking (email, campaign) VALUES ($1, $2)',
        [email, campaign]
      );
      const safeLogCamp = campaign.replace(/[\r\n\x00-\x1f]/g, '');
      console.log(`📈 Email open tracked in campaign ${safeLogCamp}`);
    } catch (error) {
      console.error('Error logging email track-open:', error);
    } finally {
      client.release();
    }
  }

  return response;
}
