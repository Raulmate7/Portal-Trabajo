import { NextRequest, NextResponse } from 'next/server';
import { getJobs } from '@/lib/jobs';
import { jobsApiLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = await jobsApiLimiter.limitAsync(clientIp);

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit, 'Demasiadas solicitudes. Por favor, espera un momento.');
  }

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q');
  const q = rawQ ? rawQ.slice(0, 100).trim() : undefined;

  const rawLocation = searchParams.get('location');
  const location = rawLocation ? rawLocation.slice(0, 100).trim() : undefined;
  
  const minSalaryStr = searchParams.get('min_salary');
  const parsedSalary = minSalaryStr ? parseInt(minSalaryStr, 10) : undefined;
  const minSalary = (parsedSalary && !isNaN(parsedSalary) && parsedSalary >= 0 && parsedSalary <= 1000000) 
    ? parsedSalary 
    : undefined;
  
  const rawModality = searchParams.get('modality');
  const modality = rawModality ? rawModality.slice(0, 50).trim() : undefined;

  const rawDateRange = searchParams.get('date_range');
  const dateRange = rawDateRange ? rawDateRange.slice(0, 20).trim() : undefined;

  const rawExperience = searchParams.get('experience');
  const experience = rawExperience ? rawExperience.slice(0, 50).trim() : undefined;

  const withSalary = searchParams.get('with_salary') === '1';
  const sort = searchParams.get('sort') === 'salary' ? 'salary' : 'recent';
  
  const pageStr = searchParams.get('page');
  let page = pageStr ? parseInt(pageStr, 10) : 1;
  if (isNaN(page) || page < 1) page = 1;
  if (page > 50) page = 50; // SEC-029: Cota máxima defensiva contra OFFSET profundo

  const rawCursorDate = searchParams.get('before_created_at');
  const beforeCreatedAt = rawCursorDate && /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(rawCursorDate)
    ? rawCursorDate.slice(0, 32)
    : undefined;
  const rawCursorId = searchParams.get('before_id');
  const beforeId = rawCursorId ? rawCursorId.slice(0, 64).trim() : undefined;

  try {
    const jobs = await getJobs({
      query: q,
      location,
      minSalary,
      withSalary,
      sort,
      modality,
      dateRange,
      experience,
      beforeCreatedAt,
      beforeId
    }, page);
    
    return NextResponse.json(jobs, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/jobs:', error);
    return NextResponse.json({ error: 'Error al consultar las ofertas' }, { status: 500 });
  }
}
