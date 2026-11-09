import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, number>();

function checkRateLimit(key: string, limitMs: number = 30000): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(key);
  if (lastRequest && now - lastRequest < limitMs) {
    return false;
  }
  if (rateLimitMap.size >= 5000) {
    for (const [k, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > 120000) rateLimitMap.delete(k);
      if (rateLimitMap.size < 4000) break;
    }
  }
  rateLimitMap.set(key, now);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';

    if (!checkRateLimit(`sub_ip_${clientIp}`, 10000)) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Espera unos segundos.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = (body.email as string || '').trim().toLowerCase();
    const source = (body.source as string || 'web').trim().slice(0, 50);
    const privacyAccepted = body.privacy_accepted === true || body.privacy_accepted === 'true';
    const marketingAccepted = body.marketing_accepted === true || body.marketing_accepted === 'true';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Por favor, proporciona un correo electrónico válido.' },
        { status: 400 }
      );
    }

    // RGPD Art. 6.1.a y Art. 7: Consentimiento expreso obligatorio
    if (!privacyAccepted) {
      return NextResponse.json(
        { success: false, error: 'Debes aceptar la Política de Privacidad para activar el servicio.' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const checkRes = await client.query(
        "SELECT id FROM subscribers WHERE email = $1 LIMIT 1",
        [email]
      );

      if (checkRes.rows && checkRes.rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Recordatorio registrado correctamente.'
        });
      }

      // Guardar con frecuencia puntual para recordatorios de guardado o racha
      const frequency = source.includes('reminder') ? 'once' : 'weekly';
      const techKeywords = `origen:${source}`;

      // RGPD Art. 7.1: Trazabilidad del consentimiento
      const consentIpHash = crypto.createHash('sha256').update(clientIp + (process.env.APP_SECRET || 'consent_salt_v1')).digest('hex');
      const consentPolicyVersion = 'v2026.11';

      try {
        await client.query(
          `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, created_at, consent_timestamp, consent_ip_hash, consent_policy_version, marketing_accepted)
           VALUES ($1, $2, 'Remoto/España', $3, NOW(), NOW(), $4, $5, $6)`,
          [email, techKeywords, frequency, consentIpHash, consentPolicyVersion, marketingAccepted]
        );
      } catch (insertErr) {
        try {
          await client.query(
            `INSERT INTO subscribers (email, tech_keywords, location_pref, frequency, created_at)
             VALUES ($1, $2, 'Remoto/España', $3, NOW())`,
            [email, techKeywords, frequency]
          );
        } catch (innerErr) {
          console.warn('Error en inserción directa de suscriptor puntual:', innerErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Recordatorio registrado con éxito.'
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error en /api/subscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

