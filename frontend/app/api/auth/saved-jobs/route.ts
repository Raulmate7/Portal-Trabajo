import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import pool from '@/lib/db';
import { ensureUserAuthTables, getCurrentUser } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

const syncSchema = z.object({
  jobIds: z.array(z.string().trim().min(1).max(255)).max(100),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }

  await ensureUserAuthTables();
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT u.job_id, u.saved_at, j.title, j.title_es, j.company, j.location, j.salary, j.is_active, j.created_at
       FROM user_saved_jobs u
       LEFT JOIN jobs j ON CAST(j.id AS CHAR) = u.job_id
       WHERE u.user_id = $1
       ORDER BY u.saved_at DESC
       LIMIT 100`,
      [user.id]
    );
    const nowMs = Date.now();
    const savedJobs = (res.rows || []).map((row: any) => {
      const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : nowMs;
      const ageDays = Math.max(0, (nowMs - createdAtMs) / (1000 * 60 * 60 * 24));
      const isExpired = !row.is_active || ageDays >= 100;
      const daysRemaining = isExpired ? Math.max(0, Math.ceil(110 - ageDays)) : null;
      return {
        ...row,
        isExpired,
        daysRemaining,
      };
    });
    return NextResponse.json({ success: true, savedJobs });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsed = syncSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Lista de ofertas inválida.' }, { status: 400 });
  }

  await ensureUserAuthTables();
  const client = await pool.connect();
  try {
    for (const jobId of parsed.data.jobIds) {
      await client.query(
        'INSERT IGNORE INTO user_saved_jobs (user_id, job_id, saved_at) VALUES ($1, $2, NOW())',
        [user.id, jobId]
      );
    }
    return NextResponse.json({ success: true, synced: parsed.data.jobIds.length });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get('jobId') || '';
  if (!jobId) {
    return NextResponse.json({ success: false, error: 'Falta jobId.' }, { status: 400 });
  }

  await ensureUserAuthTables();
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM user_saved_jobs WHERE user_id = $1 AND job_id = $2', [
      user.id,
      jobId.slice(0, 255),
    ]);
    return NextResponse.json({ success: true });
  } finally {
    client.release();
  }
}
