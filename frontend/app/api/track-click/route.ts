import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';
  const campaign = searchParams.get('campaign') || '';
  const redirect = searchParams.get('url') || searchParams.get('redirect') || '';

  // Redirigir al destino
  const redirectUrl = redirect ? decodeURIComponent(redirect) : '/';
  
  // Validar redirecciones para mitigar vulnerabilidades de open redirect
  let targetUrl = '/';
  if (redirectUrl.startsWith('/') || redirectUrl.startsWith('http://localhost') || redirectUrl.startsWith('https://') || redirectUrl.startsWith('http://')) {
    targetUrl = redirectUrl;
  }

  if (email && campaign) {
    const client = await pool.connect();
    try {
      // Registrar el click agregando un sufijo ':click' a la campaña y registrando la url cliqueada
      await client.query(
        'INSERT INTO email_tracking (email, campaign, clicked_url) VALUES ($1, $2, $3)',
        [email.trim(), `${campaign.trim()}:click`, targetUrl]
      );
      console.log(`📈 Email click tracked: ${email} in campaign ${campaign} -> ${targetUrl}`);
    } catch (error) {
      console.error('Error logging email track-click:', error);
    } finally {
      client.release();
    }
  }

  return NextResponse.redirect(new URL(targetUrl, request.url));
}
