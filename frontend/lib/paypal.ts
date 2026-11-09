/**
 * Configuración centralizada de pasarela de cobro directa a cuenta de PayPal.
 * Permite recibir fondos directamente en el saldo de PayPal del titular
 * sin necesidad de vincular cuentas bancarias europeas en pasarelas intermedias.
 */

export const PAYPAL_DESTINATION_EMAIL =
  process.env.NEXT_PUBLIC_PAYPAL_EMAIL ||
  process.env.PAYPAL_EMAIL ||
  'raulmate7@gmail.com';

export interface PayPalCheckoutParams {
  amount: number | string;
  itemName: string;
  returnUrl: string;
  cancelUrl: string;
  custom?: string;
  buyerEmail?: string;
}

export function buildPayPalCheckoutUrl({
  amount,
  itemName,
  returnUrl,
  cancelUrl,
  custom,
  buyerEmail,
}: PayPalCheckoutParams): string {
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: PAYPAL_DESTINATION_EMAIL,
    currency_code: 'EUR',
    amount: typeof amount === 'number' ? amount.toFixed(2) : amount,
    item_name: itemName,
    no_shipping: '1',
    no_note: '0',
    return: returnUrl,
    cancel_return: cancelUrl,
  });

  if (custom) {
    params.set('custom', custom);
  }

  if (buyerEmail) {
    params.set('email', buyerEmail);
  }

  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

