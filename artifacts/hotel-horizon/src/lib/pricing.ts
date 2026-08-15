// Regras de negócio de precificação usadas no motor de reservas.
// Mantidas centralizadas para que o cálculo exibido no front-end
// acompanhe exatamente a regra aplicada pela API (ver
// artifacts/api-server/src/routes/reservations.ts -> lengthOfStayDiscountPercent).

export function nightsBetween(checkin: string, checkout: string): number {
  if (!checkin || !checkout) return 0;
  const diff = new Date(`${checkout}T00:00:00`).getTime() - new Date(`${checkin}T00:00:00`).getTime();
  return Math.max(Math.round(diff / 86_400_000), 0);
}

/**
 * Desconto progressivo por tempo de permanência:
 * - 7 noites ou mais: 10% de desconto
 * - 3 noites ou mais: 5% de desconto
 * - abaixo disso: sem desconto
 */
export function lengthOfStayDiscountPercent(nights: number): number {
  if (nights >= 7) return 10;
  if (nights >= 3) return 5;
  return 0;
}

/** Desconto automático para pagamento via Pix. */
export const PIX_DISCOUNT_PERCENT = 10;

export function applyDiscount(amount: number, percent: number): number {
  return Math.round(amount * (1 - percent / 100));
}

export type PaymentMethod = 'pix' | 'credit_card';

/** Taxa de juros mensal aplicada a partir da 7ª parcela (simples, para fins de exibição). */
const INTEREST_FREE_INSTALLMENTS = 6;
const MONTHLY_INTEREST_RATE = 0.0199; // 1,99% a.m.

export type Installment = {
  count: number;
  amountPerInstallment: number;
  totalAmount: number;
  hasInterest: boolean;
};

/** Gera as opções de parcelamento de 1x até 12x para o cartão de crédito. */
export function buildInstallments(totalAmount: number): Installment[] {
  const options: Installment[] = [];
  for (let count = 1; count <= 12; count++) {
    const hasInterest = count > INTEREST_FREE_INSTALLMENTS;
    const total = hasInterest
      ? Math.round(totalAmount * Math.pow(1 + MONTHLY_INTEREST_RATE, count))
      : totalAmount;
    options.push({ count, amountPerInstallment: Math.round(total / count), totalAmount: total, hasInterest });
  }
  return options;
}
