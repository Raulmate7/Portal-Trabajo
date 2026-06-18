import { NextRequest, NextResponse } from 'next/server';
import { getJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || undefined;
  const location = searchParams.get('location') || undefined;
  
  const minSalaryStr = searchParams.get('min_salary');
  const minSalary = minSalaryStr ? parseInt(minSalaryStr, 10) : undefined;
  
  const modality = searchParams.get('modality') || undefined;
  const dateRange = searchParams.get('date_range') || undefined;
  const experience = searchParams.get('experience') || undefined;
  
  const pageStr = searchParams.get('page');
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  try {
    const jobs = await getJobs({
      query: q,
      location,
      minSalary: isNaN(minSalary as number) ? undefined : minSalary,
      modality,
      dateRange,
      experience
    }, page);
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    return NextResponse.json({ error: 'Error al consultar las ofertas' }, { status: 500 });
  }
}
