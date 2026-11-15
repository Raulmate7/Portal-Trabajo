import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAdminSessionTokenAsync } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    const isAuthenticated = await verifyAdminSessionTokenAsync(sessionToken);

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const jobId = Number(body?.jobId);
    const action = body?.action;
    const title = typeof body?.title === 'string' ? body.title : '';
    const company = typeof body?.company === 'string' ? body.company : '';

    if (!Number.isInteger(jobId) || jobId <= 0 || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (action === 'approve') {
        const res = await client.query(
          `UPDATE jobs SET is_active = TRUE WHERE id = $1 RETURNING id`,
          [jobId]
        );
        if (res.rowCount === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
        }

        if (title && company) {
          await client.query(
            `UPDATE sponsored_jobs
             SET status = 'aprobado'
             WHERE job_title = $1 AND company_name = $2 AND status = 'pendiente'`,
            [title, company]
          );
        }
      } else {
        const res = await client.query(
          `DELETE FROM jobs WHERE id = $1 AND is_active = FALSE RETURNING id`,
          [jobId]
        );
        if (res.rowCount === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Oferta pendiente no encontrada' }, { status: 404 });
        }

        if (title && company) {
          await client.query(
            `UPDATE sponsored_jobs
             SET status = 'rechazado'
             WHERE job_title = $1 AND company_name = $2 AND status = 'pendiente'`,
            [title, company]
          );
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, action, jobId });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en /api/admin/jobs:', error);
    return NextResponse.json({ error: 'Error interno al moderar la oferta' }, { status: 500 });
  }
}
