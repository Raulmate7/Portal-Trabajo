import { NextRequest, NextResponse } from 'next/server';
import { verifyReportToken } from '@/lib/reportToken';
import { calculateSalaryStats, TECH_DETAILS, DISPLAY_CITIES } from '@/lib/salarios';
import pool from '@/lib/db';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// VULN-27: Caché en memoria para evitar recálculos salariales masivos y saturación de memoria (OOM)
interface CachedReportBase {
  stats: any;
  cachedAt: number;
}
let cachedReportBase: CachedReportBase | null = null;
const CACHE_REPORT_TTL = 15 * 60 * 1000; // 15 minutos

async function getOrComputeSalaryStats() {
  const now = Date.now();
  if (cachedReportBase && (now - cachedReportBase.cachedAt < CACHE_REPORT_TTL)) {
    return cachedReportBase.stats;
  }
  const stats = await calculateSalaryStats('', '', '');
  cachedReportBase = { stats, cachedAt: now };
  return stats;
}

export async function GET(request: NextRequest) {
  // VULN-29: Rate limiting por IP para mitigar saturación de descargas y abuso de ancho de banda
  const ip = getClientIp(request);
  const rateLimit = checkoutLimiter.limit(`download_${ip}`);
  if (!rateLimit.success) {
    return new NextResponse('Demasiadas solicitudes de descarga. Por favor, espera unos momentos.', { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token de descarga ausente. Acceso no autorizado al informe de mercado.' },
      { status: 401 }
    );
  }

  const verified = verifyReportToken(token);
  if (!verified.valid || !verified.sessionId) {
    return NextResponse.json(
      { error: 'El enlace de descarga es inválido o ha expirado (validez de 24 horas). Por favor, solicita uno nuevo desde tu correo de confirmación.' },
      { status: 403 }
    );
  }

  // VULN-10: Mitigación de Replay y descarga infinita no autorizada
  // Se restringe y audita el número de descargas permitidas por transacción (máximo 5 descargas por compra)
  const client = await pool.connect();
  try {
    const checkRes = await client.query(
      "SELECT download_count, max_downloads FROM report_downloads WHERE session_id = $1 LIMIT 1",
      [verified.sessionId]
    );

    if (checkRes.rows && checkRes.rows.length > 0) {
      const { download_count, max_downloads } = checkRes.rows[0];
      if (download_count >= (max_downloads || 5)) {
        return NextResponse.json(
          { error: 'Has alcanzado el límite máximo de descargas (5 descargas) para esta compra. Contacta con soporte si requieres un duplicado adicional.' },
          { status: 403 }
        );
      }
      await client.query(
        "UPDATE report_downloads SET download_count = download_count + 1, last_downloaded_at = NOW() WHERE session_id = $1",
        [verified.sessionId]
      );
    } else {
      // Registrar primera descarga para esta compra
      try {
        await client.query(
          "INSERT INTO report_downloads (session_id, email, plan, download_count, max_downloads, last_downloaded_at) VALUES ($1, $2, $3, 1, 5, NOW())",
          [verified.sessionId, verified.email || '', verified.plan || 'full']
        );
      } catch (insertErr: any) {
        if ((insertErr?.message || '').toLowerCase().includes("doesn't exist")) {
          await client.query(`
            CREATE TABLE IF NOT EXISTS report_downloads (
              session_id VARCHAR(255) PRIMARY KEY,
              email VARCHAR(255) NOT NULL,
              plan VARCHAR(50) NOT NULL,
              download_count INT DEFAULT 1,
              max_downloads INT DEFAULT 5,
              last_downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `);
          await client.query(
            "INSERT INTO report_downloads (session_id, email, plan, download_count, max_downloads, last_downloaded_at) VALUES ($1, $2, $3, 1, 5, NOW())",
            [verified.sessionId, verified.email || '', verified.plan || 'full']
          );
        }
      }
    }
  } finally {
    client.release();
  }

  try {
    const isEnterprise = verified.plan === 'enterprise';
    const stats = await getOrComputeSalaryStats();

    const reportData = {
      titulo: `Informe de Mercado IT España 2026 — ${isEnterprise ? 'Edición Enterprise / Empresas' : 'Edición Completa'}`,
      licencia: {
        titular: verified.email,
        tipo_plan: verified.plan,
        fecha_emision: new Date().toISOString(),
        id_transaccion: verified.sessionId,
      },
      resumen_ejecutivo: {
        total_ofertas_analizadas: stats.count || 0,
        mediana_salarial_general: stats.median || 0,
        salario_promedio: stats.average || 0,
        percentil_25: stats.p25 || 0,
        percentil_75: stats.p75 || 0,
        salario_minimo_registrado: stats.min || 0,
        salario_maximo_registrado: stats.max || 0,
      },
      tablas_de_referencia: {
        tecnologias: TECH_DETAILS,
        ciudades: DISPLAY_CITIES,
      },
      aviso_confidencialidad: 'Este informe es para uso exclusivo del titular registrado y no puede ser redistribuido públicamente sin autorización previa.'
    };

    const filename = `informe_mercado_it_2026_${verified.plan}.json`;

    return new NextResponse(JSON.stringify(reportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Error al generar la descarga del informe IT:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al compilar los datos del informe.' },
      { status: 500 }
    );
  }
}

