import { NextRequest, NextResponse } from 'next/server';

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,24}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDomain = (searchParams.get('domain') || '').trim().toLowerCase();

  if (!rawDomain || rawDomain.length > 120 || !DOMAIN_REGEX.test(rawDomain)) {
    return new NextResponse(null, { status: 400 });
  }

  if (
    rawDomain === 'localhost' ||
    rawDomain.endsWith('.local') ||
    rawDomain.endsWith('.internal') ||
    rawDomain.endsWith('.localhost')
  ) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    const upstream = await fetch(`https://logo.clearbit.com/${encodeURIComponent(rawDomain)}`, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 604800 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return new NextResponse(null, { status: 415 });
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 512 * 1024) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
