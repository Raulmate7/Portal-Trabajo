import { NextRequest, NextResponse } from 'next/server';
import { companyLogoLimiter, getClientIp } from '@/lib/rate-limit';

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,24}$/;

const MONOGRAM_PALETTE = [
  '#1d4ed8', '#0f766e', '#7c3aed', '#be123c',
  '#b45309', '#0369a1', '#4338ca', '#15803d',
];

function buildDeterministicMonogramSvg(domain: string): NextResponse {
  const labelPart = (domain.split('.')[0] || 'co').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const initials = (labelPart.slice(0, 2) || 'IT').padEnd(1, 'I');
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
  }
  const bg = MONOGRAM_PALETTE[hash % MONOGRAM_PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="${initials}"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-size="24" font-weight="700">${initials}</text></svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function GET(request: NextRequest) {
  const rl = await companyLogoLimiter.limitAsync(getClientIp(request));
  if (!rl.success) {
    return new NextResponse(null, { status: 429 });
  }

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
      return buildDeterministicMonogramSvg(rawDomain);
    }

    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return buildDeterministicMonogramSvg(rawDomain);
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 512 * 1024) {
      return buildDeterministicMonogramSvg(rawDomain);
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
    return buildDeterministicMonogramSvg(rawDomain);
  }
}
