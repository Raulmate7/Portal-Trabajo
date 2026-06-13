import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';
  const campaign = searchParams.get('campaign') || '';

  if (email && campaign) {
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

  // Buffer de imagen GIF transparente de 1x1 píxeles
  const pixelBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const pixelBuffer = Buffer.from(pixelBase64, 'base64');

  return new NextResponse(pixelBuffer, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
