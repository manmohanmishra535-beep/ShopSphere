import type { Order } from "../../types.js";
import { newId } from "../ids.js";
import type {
  PaymentIntent,
  PaymentProvider,
  PaymentVerificationInput,
  VerifiedPayment,
  WebhookEvent,
} from "./types.js";

/**
 * Zero-config demo provider. It mints a Razorpay-shaped reference and trusts
 * the signed-in customer's verification call; no money moves.
 */
export class MockPaymentProvider implements PaymentProvider {
  name = "mock";

  async createIntent(order: Order): Promise<PaymentIntent> {
    return {
      provider: this.name,
      providerOrderId: `pay_${newId("mock").slice(4, 20)}`,
      amount: order.total,
      currency: "INR",
      keyId: "rzp_test_shopsphere",
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<VerifiedPayment> {
    return {
      paymentId: input.paymentId ?? `pay_${Date.now().toString(36)}`,
      method: input.method ?? "upi",
    };
  }

  verifyWebhook(_rawBody: Buffer | undefined, signature: string | undefined): boolean {
    return signature === "mock-signature";
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    const payload = body as {
      event_id?: string;
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            method?: string;
            amount?: number;
            status?: string;
          };
        };
      };
    };
    const entity = payload?.payload?.payment?.entity;
    if (!entity?.order_id) return null;
    return {
      eventId: String(payload.event_id ?? payload.event ?? ""),
      eventName: payload.event,
      providerOrderId: entity.order_id,
      paymentId: entity.id,
      method: entity.method,
      amount: entity.amount,
      status: entity.status,
    };
  }
}
