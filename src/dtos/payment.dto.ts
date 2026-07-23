// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId: string;
  createdAt: Date;
}
