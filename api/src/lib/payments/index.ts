import { env } from "../../config/env.js";
import { MockPaymentProvider } from "./mock.js";
import { RazorpayPaymentProvider } from "./razorpay.js";
import type { PaymentProvider } from "./types.js";

let provider: PaymentProvider | null = null;

/** Fail fast on incomplete production config instead of silently taking mock payments. */
export function assertPaymentConfig(): void {
  if (env.paymentProvider === "mock") return;

  if (env.paymentProvider !== "razorpay") {
    throw new Error(
      `Unknown PAYMENT_PROVIDER "${env.paymentProvider}". Use "mock" or "razorpay".`
    );
  }
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error(
      "PAYMENT_PROVIDER=razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }
  if (!env.razorpayWebhookSecret) {
    console.warn(
      "[payments] RAZORPAY_WEBHOOK_SECRET is not set. Webhook calls will be rejected; client verification still works."
    );
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  assertPaymentConfig();
  provider =
    env.paymentProvider === "razorpay"
      ? new RazorpayPaymentProvider(
          env.razorpayKeyId,
          env.razorpayKeySecret,
          env.razorpayWebhookSecret
        )
      : new MockPaymentProvider();

  console.log(`[payments] Provider: ${provider.name}`);
  return provider;
}

export type {
  PaymentIntent,
  PaymentProvider,
  PaymentVerificationInput,
  VerifiedPayment,
  WebhookEvent,
} from "./types.js";
