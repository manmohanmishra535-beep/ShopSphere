import type { Order } from "../../types.js";

export interface PaymentIntent {
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface PaymentVerificationInput {
  order: Order;
  providerOrderId: string;
  paymentId?: string;
  signature?: string;
  method?: string;
}

export interface VerifiedPayment {
  paymentId: string;
  method: string;
}

export interface WebhookEvent {
  eventId: string;
  eventName?: string;
  providerOrderId?: string;
  paymentId?: string;
  method?: string;
  amount?: number;
  status?: string;
}

export interface PaymentProvider {
  name: string;
  /** Create the provider-side order/intent that the browser pays against. */
  createIntent(order: Order): Promise<PaymentIntent>;
  /** Verify a client-side payment result before committing the sale. */
  verifyPayment(input: PaymentVerificationInput): Promise<VerifiedPayment>;
  /** Verify the raw webhook body against the provider signature. */
  verifyWebhook(rawBody: Buffer | undefined, signature: string | undefined): boolean;
  /** Extract the fields the order pipeline understands. */
  parseWebhook(body: unknown): WebhookEvent | null;
}
