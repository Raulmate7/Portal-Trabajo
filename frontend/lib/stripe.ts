import Stripe from 'stripe';

/**
 * VULN-33: Instancia canónica centralizada del cliente Stripe SDK
 * con versión de API estricta e inmutable ('2023-10-16') para garantizar coherencia
 * de tipos y esquemas de eventos entre webhooks y controladores de checkout.
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Alerta: STRIPE_SECRET_KEY no está definida en las variables de entorno de producción.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Portal Trabajo IT',
    version: '1.0.0',
  },
});

export default stripe;

