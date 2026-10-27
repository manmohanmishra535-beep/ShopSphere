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

  const pay = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ order: Order }>("/payments/verify", {
        method: "POST",
        body: {
          orderId: session.order.id,
          providerOrderId: session.payment.providerOrderId,
          method,
        },
      });
      toast.success("Payment successful", `Order ${result.order.orderNumber} is confirmed.`);
      onPaid(result.order);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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

        {error ? <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p> : null}

        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-text">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Demo checkout
          </p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            No money moves and no card details are stored. In production this sheet is Razorpay or Stripe;
            signatures are verified server-side.
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
