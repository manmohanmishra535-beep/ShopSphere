"use client";

import { useState } from "react";
import { Check, CreditCard, Landmark, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import type { CheckoutSession, Order } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Countdown } from "./countdown";

type Method = "upi" | "card" | "netbanking" | "wallet";

const methods: { id: Method; label: string; icon: typeof Smartphone; hint: string }[] = [
  { id: "upi", label: "UPI", icon: Smartphone, hint: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Netbanking", icon: Landmark, hint: "All major banks" },
  { id: "wallet", label: "Wallet", icon: Wallet, hint: "Paytm, Mobikwik" },
];

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let razorpayScript: Promise<boolean> | null = null;

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScript) return razorpayScript;

  razorpayScript = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      razorpayScript = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return razorpayScript;
}

export function PaymentSheet({
  open,
  session,
  initialMethod,
  onClose,
  onPaid,
}: {
  open: boolean;
  session: CheckoutSession | null;
  initialMethod: Method;
  onClose: () => void;
  onPaid: (order: Order) => void;
}) {
  const [method, setMethod] = useState<Method>(initialMethod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upi, setUpi] = useState("riya@okhdfcbank");

  if (!session) return null;

  const verifyPayment = async (payload: { paymentId?: string; signature?: string }) => {
    const result = await api<{ order: Order }>("/payments/verify", {
      method: "POST",
      body: {
        orderId: session.order.id,
        providerOrderId: session.payment.providerOrderId,
        method,
        ...payload,
      },
    });
    toast.success("Payment successful", `Order ${result.order.orderNumber} is confirmed.`);
    onPaid(result.order);
  };

  const payMock = async () => {
    await verifyPayment({});
  };

  const payWithRazorpay = async () => {
    const ready = await loadRazorpay();
    if (!ready || !window.Razorpay) {
      setLoading(false);
      setError("Could not load Razorpay Checkout. Check your connection and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: session.payment.keyId,
      amount: session.payment.amount,
      currency: session.payment.currency,
      name: "ShopSphere",
      description: `Order ${session.order.orderNumber}`,
      order_id: session.payment.providerOrderId,
      prefill: {
        name: session.order.shippingAddress.name,
        contact: session.order.shippingAddress.phone,
      },
      notes: { orderId: session.order.id },
      theme: { color: "#4F46E5" },
      handler: (response) => {
        void verifyPayment({
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        })
          .catch((err) => setError(errorMessage(err)))
          .finally(() => setLoading(false));
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    });

    checkout.on("payment.failed", (response) => {
      setError(response.error?.description ?? "Payment failed. Please try another method.");
      setLoading(false);
    });
    checkout.open();
  };

  const pay = async () => {
    setLoading(true);
    setError("");
    try {
      if (session.payment.provider === "razorpay") await payWithRazorpay();
      else await payMock();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  const isRazorpay = session.payment.provider === "razorpay";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Secure payment"
      description={`Order ${session.order.orderNumber}`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => void pay()} loading={loading}>
            <Lock className="h-3.5 w-3.5" /> Pay {formatINR(session.order.total)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-primary-subtle px-3.5 py-3">
          <div>
            <p className="text-[11px] text-muted">Amount due</p>
            <p className="price-num text-xl font-bold text-primary">{formatINR(session.order.total)}</p>
          </div>
          <div className="text-right text-[11px] text-muted">
            <Countdown target={session.reservationExpiresAt} className="font-medium text-warning" />
            <p className="mt-0.5">Stock is held</p>
          </div>
        </div>

        {isRazorpay ? (
          <div className="rounded-lg border border-border bg-surface/60 p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> Pay with Razorpay
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-muted">
              UPI, cards, netbanking and wallets are available in the Razorpay window. The payment
              signature is verified by ShopSphere before your order is confirmed.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {methods.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMethod(item.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 text-[11px] transition-colors ${
                    method === item.id ? "border-primary bg-primary-subtle font-medium text-primary" : "border-border text-muted hover:border-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>

            {method === "upi" ? (
              <div className="space-y-2">
                <label htmlFor="upi" className="text-[12px] font-medium">UPI ID</label>
                <input
                  id="upi"
                  value={upi}
                  onChange={(event) => setUpi(event.target.value)}
                  className="field-base"
                  placeholder="yourname@bank"
                />
                <p className="text-[11px] text-muted">A collect request would open in your UPI app.</p>
              </div>
            ) : method === "card" ? (
              <div className="space-y-2.5">
                <input placeholder="Card number" className="field-base" defaultValue="4111 1111 1111 1111" aria-label="Card number" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="MM / YY" className="field-base" defaultValue="12 / 28" aria-label="Expiry" />
                  <input placeholder="CVV" className="field-base" defaultValue="123" aria-label="CVV" />
                </div>
              </div>
            ) : method === "netbanking" ? (
              <div className="space-y-2">
                <label htmlFor="bank" className="text-[12px] font-medium">Choose your bank</label>
                <select id="bank" className="field-base">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="wallet" className="text-[12px] font-medium">Choose a wallet</label>
                <select id="wallet" className="field-base">
                  <option>Paytm</option>
                  <option>Mobikwik</option>
                  <option>Freecharge</option>
                </select>
              </div>
            )}
          </>
        )}

        {error ? <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p> : null}

        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-text">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> {isRazorpay ? "Signature verified" : "Demo checkout"}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            {isRazorpay
              ? "Razorpay captures the payment and ShopSphere verifies the HMAC signature and amount before confirming your order."
              : "No money moves and no card details are stored. Set PAYMENT_PROVIDER=razorpay on the API to use live checkout."}
          </p>
        </div>

        <p className="flex items-center justify-center gap-1 text-[10px] text-muted">
          <Lock className="h-3 w-3" /> 256-bit encrypted · PCI DSS compliant provider
        </p>
      </div>
    </Modal>
  );
}

export function PaymentSuccessMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-success/10 text-success">
      <Check className="h-5 w-5" />
    </span>
  );
}
