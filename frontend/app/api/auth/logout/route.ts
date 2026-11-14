import { NextRequest, NextResponse } from 'next/server';
import { revokeUserSession, USER_SESSION_COOKIE_NAME } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
  await revokeUserSession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set(USER_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
