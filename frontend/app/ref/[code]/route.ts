import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;

    let referrerEmail = '';
    try {
      referrerEmail = Buffer.from(code, 'base64').toString('utf-8').trim().toLowerCase();
    } catch (e) {
      console.warn('Fallo al decodificar código de referido Base64:', code);
    }

    const response = NextResponse.redirect(new URL('/', request.url));

    // Validar si el email decodificado es válido
    if (referrerEmail && referrerEmail.includes('@') && referrerEmail.includes('.')) {
      response.cookies.set('referrer_email', referrerEmail, {
        maxAge: 30 * 24 * 60 * 60, // 30 días
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    console.error('Error en ruta de referidos:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
