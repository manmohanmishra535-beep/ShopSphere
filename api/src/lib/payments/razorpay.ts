import crypto from "node:crypto";
import type { Order } from "../../types.js";
import { AppError } from "../errors.js";
import type {
  PaymentIntent,
  PaymentProvider,
  PaymentVerificationInput,
  VerifiedPayment,
  WebhookEvent,
} from "./types.js";

const API_BASE = "https://api.razorpay.com/v1";

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status?: string;
}

interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  method?: string;
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function providerError(message: string, status = 502): AppError {
  return new AppError(status, "PAYMENT_PROVIDER_ERROR", message);
}

export class RazorpayPaymentProvider implements PaymentProvider {
  name = "razorpay";
  private readonly auth: string;

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret: string
  ) {
    this.auth = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
  }

  private async request<T>(pathname: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${pathname}`, {
        ...init,
        headers: {
          authorization: this.auth,
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw providerError(
        `Could not reach Razorpay: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!response.ok) {
      let description = `Razorpay returned HTTP ${response.status}`;
      try {
        const body = (await response.json()) as { error?: { description?: string } };
        if (body.error?.description) description = body.error.description;
      } catch {
        // Keep the status-based message when the error body is not JSON.
      }
      throw providerError(description);
    }

    return (await response.json()) as T;
  }

  async createIntent(order: Order): Promise<PaymentIntent> {
    const remote = await this.request<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: order.total,
        currency: "INR",
        receipt: order.orderNumber,
        notes: { orderId: order.id, userId: order.userId },
        payment_capture: 1,
      }),
    });

    return {
      provider: this.name,
      providerOrderId: remote.id,
      amount: remote.amount,
      currency: remote.currency,
      keyId: this.keyId,
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<VerifiedPayment> {
    if (!input.paymentId || !input.signature) {
      throw new AppError(
        400,
        "PAYMENT_VERIFICATION_FAILED",
        "The Razorpay payment id and signature are required"
      );
    }

    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(`${input.providerOrderId}|${input.paymentId}`)
      .digest("hex");

    if (!timingSafeEqual(expected, input.signature)) {
      throw new AppError(400, "PAYMENT_VERIFICATION_FAILED", "Payment signature is invalid");
    }

    // Signature validity proves authorship; fetch the payment to prove the
    // amount, order and capture status before releasing stock.
    const payment = await this.request<RazorpayPayment>(`/payments/${encodeURIComponent(input.paymentId)}`);
    if (payment.order_id !== input.providerOrderId) {
      throw new AppError(400, "PAYMENT_VERIFICATION_FAILED", "Payment belongs to a different order");
    }
    if (payment.amount !== input.order.total || payment.currency !== "INR") {
      throw new AppError(400, "PAYMENT_VERIFICATION_FAILED", "Payment amount does not match the order");
    }
    if (!["captured", "authorized"].includes(payment.status)) {
      throw new AppError(400, "PAYMENT_VERIFICATION_FAILED", `Payment is ${payment.status}`);
    }

    return {
      paymentId: payment.id,
      method: payment.method ?? input.method ?? "upi",
    };
  }

  verifyWebhook(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    if (!rawBody || !signature || !this.webhookSecret) return false;
    const expected = crypto.createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    return timingSafeEqual(expected, signature);
  }

  parseWebhook(body: unknown): WebhookEvent | null {
    const payload = body as {
      event_id?: string;
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string | null;
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
