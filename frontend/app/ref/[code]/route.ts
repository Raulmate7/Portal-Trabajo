import { NextResponse } from 'next/server';
import { decryptReferralCode } from '@/lib/referral';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;

    const referrerEmail = decryptReferralCode(code);

    const response = NextResponse.redirect(new URL('/', request.url));

    // Validar si el email decodificado es válido y cumple longitud y formato RFC 5322
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (referrerEmail && referrerEmail.length <= 254 && EMAIL_REGEX.test(referrerEmail)) {
      response.cookies.set('referrer_email', referrerEmail, {
        maxAge: 30 * 24 * 60 * 60, // 30 días
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
