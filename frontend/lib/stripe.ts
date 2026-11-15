import Stripe from 'stripe';

/**
 * VULN-33: Instancia canónica centralizada del cliente Stripe SDK
 * con versión de API estricta e inmutable ('2023-10-16') para garantizar coherencia
 * de tipos y esquemas de eventos entre webhooks y controladores de checkout.
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Portal Trabajo IT',
    version: '1.0.0',
  },
});

export default stripe;

