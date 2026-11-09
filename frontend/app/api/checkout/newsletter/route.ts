import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import pool from '@/lib/db';
import crypto from 'crypto';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/constants';
import { isValidApiOrigin } from '@/lib/urlSafety';

export async function POST(request: Request) {
  // VULN-30: Validación estricta de origen permitido (CORS/CSRF prevention)
  if (!isValidApiOrigin(request, BASE_URL)) {
    return NextResponse.json({ error: 'Origen de petición no autorizado' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkoutLimiter.limit(ip);
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { company_name, company_email, plan = 'newsletter_sponsorship', privacy_accepted } = body;

    if (!company_name || !company_email) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (privacy_accepted !== true && privacy_accepted !== 'true') {
      return NextResponse.json({ error: 'Debes aceptar las Condiciones y la Política de Privacidad' }, { status: 400 });
    }

    const cleanName = (company_name || '').toString().trim().slice(0, 150);
    const cleanEmail = (company_email || '').toString().trim().toLowerCase().slice(0, 120);

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanName || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Nombre de empresa o correo electrónico inválido' }, { status: 400 });
    }

    // VULN-16: Validación estricta contra lista blanca para plan de patrocinio
    const ALLOWED_NEWSLETTER_PLANS = new Set(['newsletter_sponsorship', 'newsletter_edition_sponsor']);
    const safePlan = (plan && ALLOWED_NEWSLETTER_PLANS.has(plan)) ? plan : 'newsletter_sponsorship';

    // 1. Insertar registro pendiente en newsletter_sponsors con ref única
    const client = await pool.connect();
    let sponsorId: number;
    const clientRef = `pending_${crypto.randomUUID()}`;
    try {
      await client.query(
        `INSERT INTO newsletter_sponsors (company_name, company_email, plan, status, stripe_session_id, created_at)
         VALUES ($1, $2, $3, 'pendiente', $4, NOW())`,
        [cleanName, cleanEmail, safePlan, clientRef]
      );
      const res = await client.query(
        `SELECT id FROM newsletter_sponsors WHERE stripe_session_id = $1 LIMIT 1`,
        [clientRef]
      );
      if (!res.rows || res.rows.length === 0) {
        throw new Error('No se pudo recuperar el ID del patrocinador recién creado');
      }
      sponsorId = Number(res.rows[0].id);
    } finally {
      client.release();
    }

    // 2. Determinar precio y datos del producto
    const unitAmount = 4900; // 49€ por patrocinio de newsletter
    const planName = 'Patrocinio de Newsletter - Portal Trabajo IT';
    const planDesc = `Inclusión destacada de tu empresa/producto/oferta en el boletín semanal enviado a más de 8.700 ingenieros.`;

    // 3. Crear sesión de Stripe Checkout usando BASE_URL seguro y vinculación garantizada
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: cleanEmail, // VULN-17: Vincular obligatoriamente el email de la empresa en la sesión
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
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
        success_url: `${BASE_URL}/publicidad?success=true&sponsor_id=${sponsorId}`,
        cancel_url: `${BASE_URL}/publicidad?canceled=true`,
        metadata: {
          sponsorId: String(sponsorId),
          company_email: cleanEmail,
          type: 'newsletter_sponsor',
        },
      });
    } catch (stripeErr) {
      // VULN-15: Limpieza defensiva inmediata del registro huérfano si Stripe rechaza la sesión
      const cleanupClient = await pool.connect();
      try {
        await cleanupClient.query("DELETE FROM newsletter_sponsors WHERE id = $1 AND status = 'pendiente'", [sponsorId]);
      } catch {} finally {
        cleanupClient.release();
      }
      throw stripeErr;
    }

    // Actualizar session_id en la BD para rastrear
    const updateClient = await pool.connect();
    try {
      await updateClient.query(
        "UPDATE newsletter_sponsors SET stripe_session_id = $1 WHERE id = $2",
        [session.id, sponsorId]
      );
    } finally {
      updateClient.release();
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Newsletter Checkout Session:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de patrocinio' }, { status: 500 });
  }
}
