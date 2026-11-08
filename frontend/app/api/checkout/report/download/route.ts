import { NextRequest, NextResponse } from 'next/server';
import { verifyReportToken } from '@/lib/reportToken';
import { calculateSalaryStats, TECH_DETAILS, DISPLAY_CITIES } from '@/lib/salarios';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token de descarga ausente. Acceso no autorizado al informe de mercado.' },
      { status: 401 }
    );
  }

  const verified = verifyReportToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: 'El enlace de descarga es inválido o ha expirado (validez de 24 horas). Por favor, solicita uno nuevo desde tu correo de confirmación.' },
      { status: 403 }
    );
  }

  try {
    const isEnterprise = verified.plan === 'enterprise';
    const stats = await calculateSalaryStats('', '', '');

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

