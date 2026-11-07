import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';
import crypto from 'crypto';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const VALID_PLANS = new Set(['destacado_basico', 'destacado_30d', 'destacado_pro', 'destacado_enterprise']);

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkoutLimiter.limit(ip);
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { title, company, location, salary, description_snippet, url_source, category, plan = 'destacado_30d', affiliate_code } = body;

    if (!title || !company || !url_source) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Validación de longitudes y tipos (Vector 24: Prevenir buffer flooding / DOS)
    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 150) {
      return NextResponse.json({ error: 'El título es inválido o supera los 150 caracteres' }, { status: 400 });
    }
    if (typeof company !== 'string' || company.trim().length === 0 || company.length > 100) {
      return NextResponse.json({ error: 'La empresa es inválida o supera los 100 caracteres' }, { status: 400 });
    }
    if (typeof url_source !== 'string' || url_source.trim().length === 0 || url_source.length > 500) {
      return NextResponse.json({ error: 'La URL es inválida o supera los 500 caracteres' }, { status: 400 });
    }

    const selectedPlan = (plan || 'destacado_30d').toString().trim().toLowerCase();
    if (!VALID_PLANS.has(selectedPlan)) {
      return NextResponse.json({ error: 'Plan seleccionado no válido' }, { status: 400 });
    }

    // Validar formato y protocolo seguro de url_source (solo http y https)
    const cleanUrlSource = url_source.trim();
    try {
      const parsedUrl = new URL(cleanUrlSource);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'La URL de la oferta debe comenzar por http:// o https://' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'La URL proporcionada no es válida' }, { status: 400 });
    }

    // Validación de código de afiliado seguro
    let cleanAffiliateCode = '';
    if (affiliate_code && typeof affiliate_code === 'string') {
      const trimmedCode = affiliate_code.trim();
      if (/^RECR-[A-Z0-9]{4,12}$/i.test(trimmedCode)) {
        cleanAffiliateCode = trimmedCode.toUpperCase();
      }
    }

    // 2. Insertar la oferta en la base de datos con is_active = FALSE y is_featured = FALSE (pendiente de pago)
    const jobId = crypto.randomUUID();
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO jobs (id, title, company, location, salary, description_snippet, url_source, category, is_active, is_featured, created_at, plan)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, FALSE, NOW(), $9)
      `;
      await client.query(query, [
        jobId,
        title.trim(),
        company.trim(),
        (location || 'Remoto').toString().slice(0, 100),
        (salary || 'Consultar').toString().slice(0, 60),
        (description_snippet || '').toString().slice(0, 2000),
        cleanUrlSource,
        (category || 'Otros').toString().slice(0, 50),
        selectedPlan
      ]);
    } finally {
      client.release();
    }

    // 3. Determinar precio y datos del producto según el plan elegido
    let unitAmount = 1900; // Por defecto 19€ (Destacado Pro 30 días)
    let planName = 'Oferta Destacada Pro - Portal Trabajo IT';
    let planDesc = `Destaca tu oferta "${title}" durante 30 días + Inclusión en la newsletter semanal.`;

    if (selectedPlan === 'destacado_basico') {
      unitAmount = 900; // 9€ (Básico 15 días)
      planName = 'Oferta Destacada Básica - Portal Trabajo IT';
      planDesc = `Destaca tu oferta "${title}" en la parte superior y búsquedas del portal durante 15 días.`;
    } else if (selectedPlan === 'destacado_enterprise') {
      unitAmount = 4900; // 49€ (Enterprise 30 días + newsletter + Telegram + redes)
      planName = 'Oferta Destacada Enterprise - Portal Trabajo IT';
      planDesc = `Destaca tu oferta "${title}" durante 30 días + Boletín exclusivo + Difusión en Telegram y Redes Sociales.`;
    }

    // 4. Crear la sesión de checkout en Stripe usando BASE_URL seguro
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: planName,
                description: planDesc,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${BASE_URL}/publicar-oferta?success=true&job_id=${jobId}`,
        cancel_url: `${BASE_URL}/publicar-oferta?canceled=true`,
        metadata: {
          jobId: String(jobId),
          plan: String(selectedPlan),
          affiliate_code: cleanAffiliateCode,
        },
      });
    } catch (stripeErr) {
      // Limpieza defensiva de registro huérfano si Stripe rechaza la sesión (Vector 24)
      const cleanupClient = await pool.connect();
      try {
        await cleanupClient.query("DELETE FROM jobs WHERE id = $1 AND is_active = FALSE", [jobId]);
      } catch {} finally {
        cleanupClient.release();
      }
      throw stripeErr;
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Checkout Session:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
