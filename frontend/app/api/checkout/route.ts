import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, company, location, salary, description_snippet, url_source, category, plan = 'destacado_30d' } = body;

    if (!title || !company || !url_source) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Insertar la oferta en la base de datos con is_active = FALSE y is_featured = FALSE (pendiente de pago)
    const jobId = crypto.randomUUID();
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO jobs (id, title, company, location, salary, description_snippet, url_source, category, is_active, is_featured, created_at, plan)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, FALSE, NOW(), $9)
      `;
      await client.query(query, [
        jobId,
        title,
        company,
        location || 'Remoto',
        salary || 'Consultar',
        description_snippet || '',
        url_source,
        category || 'Otros',
        plan
      ]);
    } finally {
      client.release();
    }

    // 2. Determinar precio y datos del producto según el plan elegido
    let unitAmount = 1900; // Por defecto 19€ (Destacado Pro 30 días)
    let planName = 'Oferta Destacada Pro - Portal Trabajo IT';
    let planDesc = `Destaca tu oferta "${title}" durante 30 días + Inclusión en la newsletter semanal.`;

    if (plan === 'destacado_basico') {
      unitAmount = 900; // 9€ (Básico 15 días)
      planName = 'Oferta Destacada Básica - Portal Trabajo IT';
      planDesc = `Destaca tu oferta "${title}" en la parte superior y búsquedas del portal durante 15 días.`;
    } else if (plan === 'destacado_enterprise') {
      unitAmount = 4900; // 49€ (Enterprise 30 días + newsletter + Telegram + redes)
      planName = 'Oferta Destacada Enterprise - Portal Trabajo IT';
      planDesc = `Destaca tu oferta "${title}" durante 30 días + Boletín exclusivo + Difusión en Telegram y Redes Sociales.`;
    }

    // 3. Crear la sesión de checkout en Stripe referenciando el jobId
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
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
      success_url: `${baseUrl}/publicar-oferta?success=true&job_id=${jobId}`,
      cancel_url: `${baseUrl}/publicar-oferta?canceled=true`,
      metadata: {
        jobId: String(jobId),
        plan: String(plan),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Checkout Session:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
