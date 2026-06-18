import { NextRequest, NextResponse } from 'next/server';
import { calculateSalaryStats } from '@/lib/salarios';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tech = searchParams.get('tech') || '';
  const location = searchParams.get('location') || '';
  const experience = searchParams.get('experience') || '';

  try {
    const stats = await calculateSalaryStats(tech, location, experience);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/salarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
