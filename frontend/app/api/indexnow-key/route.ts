import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const configuredKey = (process.env.INDEXNOW_KEY || '').trim();
  const requestedKey = (new URL(request.url).searchParams.get('key') || '').trim();

  if (!configuredKey || !requestedKey || configuredKey.length !== requestedKey.length) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const a = Buffer.from(configuredKey, 'utf8');
  const b = Buffer.from(requestedKey, 'utf8');
  if (!crypto.timingSafeEqual(a, b)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return new NextResponse(configuredKey, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
