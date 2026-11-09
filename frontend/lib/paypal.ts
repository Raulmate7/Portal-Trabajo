/**
 * Configuración centralizada de pasarela de cobro directa a cuenta de PayPal.
 * Permite recibir fondos directamente en el saldo de PayPal del titular
 * sin necesidad de vincular cuentas bancarias europeas en pasarelas intermedias.
 */

export const PAYPAL_DESTINATION_EMAIL =
  process.env.NEXT_PUBLIC_PAYPAL_EMAIL ||
  process.env.PAYPAL_EMAIL ||
  'contacto@portalempleoit.com';

export interface PayPalCheckoutParams {
  amount: number | string;
  itemName: string;
  returnUrl: string;
  cancelUrl: string;
  custom?: string;
  buyerEmail?: string;
  applyVat21?: boolean;
  requireBillingAddress?: boolean;
}

export function buildPayPalCheckoutUrl({
  amount,
  itemName,
  returnUrl,
  cancelUrl,
  custom,
  buyerEmail,
  applyVat21 = false,
  requireBillingAddress = true,
}: PayPalCheckoutParams): string {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: PAYPAL_DESTINATION_EMAIL,
    currency_code: 'EUR',
    amount: numericAmount.toFixed(2),
    item_name: itemName,
    // no_shipping=2 exige dirección postal en PayPal para cumplir con facturación RD 1619/2012
    no_shipping: requireBillingAddress ? '2' : '1',
    no_note: '0',
    return: returnUrl,
    cancel_return: cancelUrl,
  });

  if (applyVat21) {
    const vatAmount = (numericAmount * 0.21).toFixed(2);
    params.set('tax', vatAmount);
  }

  if (custom) {
    params.set('custom', custom);
  }

  if (buyerEmail) {
    params.set('email', buyerEmail);
  }

  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

