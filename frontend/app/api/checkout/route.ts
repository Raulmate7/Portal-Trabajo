import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import pool from '@/lib/db';
import crypto from 'crypto';
import { checkoutLimiter, getClientIp } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/constants';
import { isSafePublicUrl, isValidApiOrigin } from '@/lib/urlSafety';
import { JOB_PRICING_PLANS, VALID_JOB_PLAN_IDS } from '@/lib/pricingPlans';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
    const { title, company, company_email, company_phone, location, salary, description_snippet, url_source, category, plan = 'destacado_pro', affiliate_code } = body;

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

    // VULN-14: Normalización canónica del plan seleccionado con matriz centralizada
    const rawPlan = (plan || 'destacado_pro').toString().trim().toLowerCase();
    const selectedPlan = rawPlan === 'destacado_30d' ? 'destacado_pro' : rawPlan;
    if (!VALID_JOB_PLAN_IDS.has(selectedPlan)) {
      return NextResponse.json({ error: 'Plan seleccionado no válido' }, { status: 400 });
    }
    const planConfig = JOB_PRICING_PLANS[selectedPlan];

    // Validar formato, protocolo y destino seguro de url_source (SSRF y Phishing prevention)
    const cleanUrlSource = url_source.trim();
    if (!isSafePublicUrl(cleanUrlSource)) {
      return NextResponse.json({ error: 'La URL de la oferta no es válida o apunta a una dirección no permitida' }, { status: 400 });
    }

    // Validación de código de afiliado seguro y existencia real en la base de datos (VULN-25)
    let cleanAffiliateCode = '';
    if (affiliate_code && typeof affiliate_code === 'string') {
      const trimmedCode = affiliate_code.trim();
      if (/^RECR-[A-Z0-9]{4,12}$/i.test(trimmedCode)) {
        cleanAffiliateCode = trimmedCode.toUpperCase();
        const checkAffClient = await pool.connect();
        try {
          const affRes = await checkAffClient.query(
            "SELECT 1 FROM recruiter_affiliates WHERE affiliate_code = $1 LIMIT 1",
            [cleanAffiliateCode]
          );
          if (!affRes.rows || affRes.rows.length === 0) {
            cleanAffiliateCode = ''; // Descartar código inexistente
          }
        } catch {
          cleanAffiliateCode = '';
        } finally {
          checkAffClient.release();
        }
      }
    }

    // Validación rigurosa de formato de correo
    const validCustomerEmail = (company_email && typeof company_email === 'string' && EMAIL_REGEX.test(company_email.trim())) 
      ? company_email.trim().toLowerCase() 
      : undefined;

    // 2. Insertar la oferta en la base de datos con is_active = FALSE y is_featured = FALSE (pendiente de pago)
    const jobId = crypto.randomUUID();
    const client = await pool.connect();
    try {
      // VULN-12 & VULN-13: Purga preventiva de registros huérfanos inactivos con más de 24h sin confirmar
      try {
        await client.query(
          "DELETE FROM jobs WHERE is_active = FALSE AND created_at < DATE_SUB(NOW(), INTERVAL $1 HOUR) AND (plan LIKE 'destacado_%' OR plan = 'abandoned')",
          [24]
        );
      } catch (purgeErr) {
        // Purga defensiva tolerante a fallos
      }

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

    // 3. Determinar precio y datos del producto según el plan elegido (VULN-14: Fuente única de verdad)
    const unitAmount = planConfig.unitAmountCents;
    const planName = `${planConfig.name} - Portal Trabajo IT`;
    const planDesc = `${planConfig.description} (Oferta: "${title.trim()}").`;

    // 4. Crear la sesión de checkout en Stripe usando BASE_URL seguro
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
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
        customer_email: validCustomerEmail,
        success_url: `${BASE_URL}/publicar-oferta?success=true&job_id=${jobId}`,
        cancel_url: `${BASE_URL}/publicar-oferta?canceled=true`,
        metadata: {
          jobId: String(jobId),
          plan: String(selectedPlan),
          affiliate_code: cleanAffiliateCode,
          company_email: validCustomerEmail || '',
        },
      });
    } catch (stripeErr) {
      // VULN-13: Limpieza garantizada de registro huérfano si Stripe rechaza la sesión
      const cleanupClient = await pool.connect();
      try {
        await cleanupClient.query("DELETE FROM jobs WHERE id = $1 AND is_active = FALSE", [jobId]);
      } catch (cleanErr) {
        try {
          await cleanupClient.query("UPDATE jobs SET is_active = FALSE, plan = 'abandoned' WHERE id = $1", [jobId]);
        } catch {}
      } finally {
        cleanupClient.release();
      }
      throw stripeErr;
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando Stripe Checkout Session:', error);
    return NextResponse.json({ error: 'No se pudo iniciar la pasarela de pago. Por favor, revisa los datos e inténtalo de nuevo.' }, { status: 500 });
  }
}
