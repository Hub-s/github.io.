// GymHub Stripe Products and Prices Configuration
// These are the gym membership plans available for purchase

export const GYMHUB_PRODUCTS = {
  MONTHLY: {
    id: 'monthly_plan',
    name: 'Plano Mensal',
    description: 'Acesso completo à academia por 1 mês',
    price: 9900, // R$ 99,00 in cents
    currency: 'brl',
    interval: 'month' as const,
    intervalCount: 1,
  },
  QUARTERLY: {
    id: 'quarterly_plan',
    name: 'Plano Trimestral',
    description: 'Acesso completo à academia por 3 meses',
    price: 26700, // R$ 267,00 in cents (R$ 89/mês)
    currency: 'brl',
    interval: 'month' as const,
    intervalCount: 3,
  },
  SEMIANNUAL: {
    id: 'semiannual_plan',
    name: 'Plano Semestral',
    description: 'Acesso completo à academia por 6 meses',
    price: 47400, // R$ 474,00 in cents (R$ 79/mês)
    currency: 'brl',
    interval: 'month' as const,
    intervalCount: 6,
  },
  ANNUAL: {
    id: 'annual_plan',
    name: 'Plano Anual',
    description: 'Acesso completo à academia por 12 meses',
    price: 82800, // R$ 828,00 in cents (R$ 69/mês)
    currency: 'brl',
    interval: 'year' as const,
    intervalCount: 1,
  },
} as const;

export type PlanType = keyof typeof GYMHUB_PRODUCTS;

export function getPlanByType(type: string): typeof GYMHUB_PRODUCTS[PlanType] | undefined {
  const planMap: Record<string, PlanType> = {
    monthly: 'MONTHLY',
    quarterly: 'QUARTERLY',
    semiannual: 'SEMIANNUAL',
    annual: 'ANNUAL',
  };
  const key = planMap[type];
  return key ? GYMHUB_PRODUCTS[key] : undefined;
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInCents / 100);
}
