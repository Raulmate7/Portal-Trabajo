import { NextRequest, NextResponse } from 'next/server';
import { calculateSalaryStats } from '@/lib/salarios';
import { salariosLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = await salariosLimiter.limitAsync(clientIp);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Demasiadas consultas de salarios. Por favor, espera un minuto.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tech = (searchParams.get('tech') || '').slice(0, 50).trim();
  const location = (searchParams.get('location') || '').slice(0, 50).trim();
  const experience = (searchParams.get('experience') || '').slice(0, 50).trim();

  try {
    const stats = await calculateSalaryStats(tech, location, experience);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/salarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
