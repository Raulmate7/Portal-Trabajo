import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { actionsRateLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const STREAK_COOKIE = 'portal_streak_sig';

interface ServerStreakState {
  lastVisitDate: string;
  count: number;
}

function getStreakSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    'local_streak_fallback_key'
  );
}

function signState(state: ServerStreakState): string {
  const payload = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getStreakSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyState(raw: string | undefined): ServerStreakState | null {
  if (!raw || !raw.includes('.')) return null;
  const [payload, sig] = raw.split('.', 2);
  if (!payload || !sig) return null;

  const expected = crypto.createHmac('sha256', getStreakSecret()).update(payload).digest('hex');
  if (sig.length !== expected.length || !/^[0-9a-f]+$/i.test(sig)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      parsed &&
      typeof parsed.lastVisitDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastVisitDate) &&
      typeof parsed.count === 'number' &&
      parsed.count >= 1 &&
      parsed.count <= 3650
    ) {
      return { lastVisitDate: parsed.lastVisitDate, count: Math.floor(parsed.count) };
    }
  } catch {}
  return null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await actionsRateLimiter.limitAsync(`streak_${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const existing = verifyState(request.cookies.get(STREAK_COOKIE)?.value);

  let nextState: ServerStreakState = { lastVisitDate: todayStr, count: 1 };
  let milestoneReached = false;

  if (existing) {
    const lastMs = Date.parse(`${existing.lastVisitDate}T00:00:00Z`);
    const todayMs = Date.parse(`${todayStr}T00:00:00Z`);
    const diffDays = Math.floor((todayMs - lastMs) / 86400000);

    if (diffDays <= 0) {
      nextState = existing;
    } else if (diffDays === 1) {
      nextState = { lastVisitDate: todayStr, count: existing.count + 1 };
      milestoneReached = [3, 7, 30].includes(nextState.count);
    } else {
      nextState = { lastVisitDate: todayStr, count: 1 };
    }
  }

  const response = NextResponse.json({
    count: nextState.count,
    lastVisitDate: nextState.lastVisitDate,
    milestoneReached,
  });

  response.cookies.set(STREAK_COOKIE, signState(nextState), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 90 * 24 * 60 * 60,
  });

  return response;
}
