import { NextRequest, NextResponse } from 'next/server';
import { getJobs } from '@/lib/jobs';
import { jobsApiLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = jobsApiLimiter.limit(clientIp);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, espera un momento.' },
      { status: 429 }
    );
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
  
  const pageStr = searchParams.get('page');
  let page = pageStr ? parseInt(pageStr, 10) : 1;
  if (isNaN(page) || page < 1) page = 1;
  if (page > 500) page = 500; // Cota superior defensiva contra consultas de offset destructivas

  try {
    const jobs = await getJobs({
      query: q,
      location,
      minSalary,
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
