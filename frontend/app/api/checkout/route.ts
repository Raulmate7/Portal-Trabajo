import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, company, location, salary, description_snippet, url_source, category } = body;

    if (!title || !company || !url_source) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Insertar la oferta en la base de datos con is_active = FALSE y is_featured = FALSE (pendiente de pago)
    const client = await pool.connect();
    let jobId: number;
    try {
      const query = `
        INSERT INTO jobs (title, company, location, salary, description_snippet, url_source, category, is_active, is_featured, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, FALSE, NOW())
        RETURNING id
      `;
      const result = await client.query(query, [
        title,
        company,
        location || 'Remoto',
        salary || 'Consultar',
        description_snippet || '',
        url_source,
        category || 'Otros'
      ]);
      jobId = result.rows[0].id;
    } finally {
      client.release();
    }

    // 2. Crear la sesión de checkout en Stripe referenciando el jobId
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
              name: 'Publicación de Oferta Destacada - Portal Trabajo IT',
              description: `Destaca tu oferta "${title}" en la parte superior y búsquedas del portal durante 30 días.`,
            },
            unit_amount: 3900, // 39.00 EUR en céntimos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/publicar-oferta?success=true&job_id=${jobId}`,
      cancel_url: `${baseUrl}/publicar-oferta?canceled=true`,
      metadata: {
        jobId: String(jobId),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Checkout Session:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
