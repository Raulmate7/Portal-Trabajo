/**
 * Definición canónica centralizada de planes y tarifas para ofertas de empleo B2B.
 * Fuente única de verdad para prevenir desajustes entre la UI pública y la pasarela de pagos (VULN-14).
 */
export interface JobPlanConfig {
  id: 'destacado_basico' | 'destacado_pro' | 'destacado_enterprise';
  name: string;
  priceEur: number;
  unitAmountCents: number;
  durationDays: number;
  description: string;
  badge: string;
}

export const JOB_PRICING_PLANS: Record<string, JobPlanConfig> = {
  destacado_basico: {
    id: 'destacado_basico',
    name: 'Destacado Básico',
    priceEur: 9,
    unitAmountCents: 900,
    durationDays: 15,
    description: 'Fijada arriba en el buscador por 15 días con diseño premium dorado.',
    badge: '⭐ Destacada (15 días)',
  },
  destacado_pro: {
    id: 'destacado_pro',
    name: 'Destacado Pro',
    priceEur: 19,
    unitAmountCents: 1900,
    durationDays: 30,
    description: 'Fijada arriba 30 días + Inclusión destacada en Newsletter semanal (8.700+ programadores).',
    badge: '⭐ Destacada Pro (30 días)',
  },
  destacado_enterprise: {
    id: 'destacado_enterprise',
    name: 'Destacado Enterprise',
    priceEur: 49,
    unitAmountCents: 4900,
    durationDays: 30,
    description: 'Cobertura total 30 días: Newsletter exclusiva + Difusión multicanal en Telegram y Redes Sociales.',
    badge: '🚀 Enterprise (30 días)',
  },
};

export const VALID_JOB_PLAN_IDS = new Set(Object.keys(JOB_PRICING_PLANS));

