import { NextRequest, NextResponse } from 'next/server';
import { decryptReferralCode } from '@/lib/referral';
import { actionsRateLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const rl = await actionsRateLimiter.limitAsync(`ref_${clientIp}`);
    if (!rl.success) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const resolvedParams = await params;
    const { code } = resolvedParams;

    const referrerEmail = decryptReferralCode(code);

    const response = NextResponse.redirect(new URL('/', request.url));

    // Validar si el email decodificado es válido y cumple longitud y formato RFC 5322
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (referrerEmail && referrerEmail.length <= 254 && EMAIL_REGEX.test(referrerEmail)) {
      response.cookies.set('referrer_email', referrerEmail, {
        maxAge: 7 * 24 * 60 * 60, // 7 días (SEC-056)
        path: '/',
        httpOnly: true, // Protegida contra robo o exfiltración por XSS (Vector 10)
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (error) {
    console.error('Error en ruta de referidos:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
