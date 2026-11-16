import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import pool from '@/lib/db';
import { verifyAdminSessionTokenAsync, recordAdminAuditLog } from '@/lib/adminAuth';
import { adminActionLimiter, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ipLimit = await adminActionLimiter.limitKeyAsync(`admin_jobs_list:${getClientIp(req)}`);
    if (!ipLimit.success) {
      return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
    }
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    const isAuthenticated = await verifyAdminSessionTokenAsync(sessionToken);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().slice(0, 100);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const params: any[] = [];
    let whereClause = 'WHERE is_active = FALSE';
    if (q) {
      whereClause += ' AND (LOWER(title) LIKE LOWER($1) OR LOWER(company) LIKE LOWER($2))';
      const pattern = `%${q}%`;
      params.push(pattern, pattern);
    }

    const countRes = await pool.query(`SELECT COUNT(*) AS count FROM jobs ${whereClause}`, params);
    const total = parseInt(countRes.rows?.[0]?.count || '0', 10);

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const listRes = await pool.query(
      `SELECT id, title, company, location, salary, url_source, description_snippet, created_at
       FROM jobs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      jobs: (listRes.rows || []).map((row: any) => ({
        id: String(row.id),
        title: String(row.title || ''),
        company: String(row.company || ''),
        location: row.location ? String(row.location) : null,
        salary: row.salary ? String(row.salary) : null,
        url_source: row.url_source ? String(row.url_source) : null,
        description_snippet: row.description_snippet ? String(row.description_snippet) : null,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Error en GET /api/admin/jobs:', error);
    return NextResponse.json({ error: 'Error interno al listar ofertas pendientes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ipLimit = await adminActionLimiter.limitKeyAsync(`admin_jobs:${getClientIp(req)}`);
    if (!ipLimit.success) {
      return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
    }
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    const isAuthenticated = await verifyAdminSessionTokenAsync(sessionToken);

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    // BUG-003: jobs.id es un identificador de texto (UUID), no un entero.
    const jobId = typeof body?.jobId === 'string' ? body.jobId.trim() : '';
    const action = body?.action;
    const title = typeof body?.title === 'string' ? body.title : '';
    const company = typeof body?.company === 'string' ? body.company : '';

    if (!/^[a-zA-Z0-9_-]{1,255}$/.test(jobId) || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // BUG-004: sin RETURNING (no soportado por MySQL). Se comprueba la existencia con un
    // SELECT previo, fuera de la transaccion (compatible tambien con db_proxy.php).
    const existsRes = await pool.query(
      action === 'approve'
        ? `SELECT id FROM jobs WHERE id = $1`
        : `SELECT id FROM jobs WHERE id = $1 AND is_active = FALSE`,
      [jobId]
    );
    if (!existsRes.rows || existsRes.rows.length === 0) {
      return NextResponse.json(
        { error: action === 'approve' ? 'Oferta no encontrada' : 'Oferta pendiente no encontrada' },
        { status: 404 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (action === 'approve') {
        await client.query(`UPDATE jobs SET is_active = TRUE WHERE id = $1`, [jobId]);

        if (title && company) {
          await client.query(
            `UPDATE sponsored_jobs
             SET status = 'aprobado'
             WHERE job_title = $1 AND company_name = $2 AND status = 'pendiente'`,
            [title, company]
          );
        }
      } else {
        await client.query(`DELETE FROM jobs WHERE id = $1 AND is_active = FALSE`, [jobId]);

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
      try {
        revalidateTag('jobs:list');
        revalidateTag('salaries:stats');
        revalidatePath('/');
      } catch {}
      await recordAdminAuditLog({
        eventType: action === 'approve' ? 'job_approved' : 'job_rejected',
        clientIp: getClientIp(req),
        userAgent: req.headers.get('user-agent'),
        success: true,
        details: `Admin ${action} sobre job_id=${jobId}`,
      });
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
