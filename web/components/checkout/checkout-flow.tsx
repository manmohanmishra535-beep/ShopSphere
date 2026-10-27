"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Landmark,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import type { Address, CheckoutSession, Order, User } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { deliveryEstimate, formatINR } from "@/lib/format";
import { useCartStore } from "@/stores/cart";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Countdown } from "./countdown";
import { PaymentSheet } from "./payment-sheet";

type Method = "upi" | "card" | "netbanking" | "wallet";
type Step = 1 | 2 | 3;

const PIN_MAP: Record<string, [string, string]> = {
  "110": ["New Delhi", "Delhi"],
  "400": ["Mumbai", "Maharashtra"],
  "411": ["Pune", "Maharashtra"],
  "500": ["Hyderabad", "Telangana"],
  "560": ["Bengaluru", "Karnataka"],
  "600": ["Chennai", "Tamil Nadu"],
  "700": ["Kolkata", "West Bengal"],
  "380": ["Ahmedabad", "Gujarat"],
  "302": ["Jaipur", "Rajasthan"],
  "226": ["Lucknow", "Uttar Pradesh"],
};

const payMethods: { id: Method; label: string; copy: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", copy: "Google Pay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Credit / debit card", copy: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", copy: "All major Indian banks", icon: Landmark },
  { id: "wallet", label: "Wallet", copy: "Paytm, Mobikwik", icon: Wallet },
];

export function CheckoutFlow({ user }: { user: User }) {
  const router = useRouter();
  const { items, count, subtotal, initialized, refresh } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>(user.addresses);
  const [addressId, setAddressId] = useState(
    user.addresses.find((address) => address.isDefault)?.id ?? user.addresses[0]?.id ?? ""
  );
  const [step, setStep] = useState<Step>(1);
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [method, setMethod] = useState<Method>("upi");
  const [showAddressForm, setShowAddressForm] = useState(user.addresses.length === 0);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const keyRef = useRef<string | null>(null);

  const shipping = useMemo(() => {
    if (delivery === "express") return 9900;
    return subtotal >= 99900 ? 0 : 4900;
  }, [delivery, subtotal]);

  const total = subtotal + shipping;
  const selectedAddress = addresses.find((address) => address.id === addressId);

  if (!initialized) {
    return (
      <div className="container-shop py-10">
        <Skeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !session) {
    return (
      <div className="container-shop py-16">
        <div className="mx-auto max-w-lg">
          <EmptyState
            icon={<Lock className="h-5 w-5" />}
            title="Your cart is empty"
            description="Add something to your bag before heading to checkout."
            action={<Link href="/products" className={buttonStyles("primary")}>Browse the shop</Link>}
          />
        </div>
      </div>
    );
  }

  const continueToDelivery = () => {
    if (!selectedAddress) {
      setError("Add a delivery address to continue.");
      setShowAddressForm(true);
      return;
    }
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startPayment = async () => {
    setError("");
    if (!selectedAddress) {
      setStep(1);
      setError("Add a delivery address to continue.");
      return;
    }

    if (session) {
      const stillValid = new Date(session.reservationExpiresAt).getTime() > Date.now();
      if (stillValid) {
        setSheetOpen(true);
        return;
      }
      // Expired hold: release the old order before starting a new one.
      await api(`/orders/${session.order.id}/cancel`, { method: "POST", body: { reason: "Reservation expired" } }).catch(() => null);
      setSession(null);
      setExpired(false);
    }

    setCreating(true);
    try {
      if (!keyRef.current) keyRef.current = crypto.randomUUID();
      const data = await api<CheckoutSession>("/checkout/session", {
        method: "POST",
        headers: { "Idempotency-Key": keyRef.current },
        body: { addressId, deliveryMethod: delivery, paymentMethod: method },
      });
      setSession(data);
      setSheetOpen(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const onPaid = (order: Order) => {
    setSheetOpen(false);
    setSession(null);
    router.push(`/account/orders/${order.id}?placed=1`);
    void refresh();
  };

  const addAddress = async (address: Omit<Address, "id">) => {
    const result = await api<{ address: Address }>("/me/addresses", { method: "POST", body: address });
    setAddresses((current) => [...current, result.address]);
    setAddressId(result.address.id);
    setShowAddressForm(false);
    toast.success("Address saved");
  };

  return (
    <div className="container-shop py-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Checkout progress" className="mb-8">
          <ol className="flex items-center">
            {[
              { number: 1, label: "Address" },
              { number: 2, label: "Delivery" },
              { number: 3, label: "Payment" },
            ].map((item, index) => {
              const current = step === item.number;
              const complete = step > item.number;
              return (
                <li key={item.number} className={`flex items-center ${index < 2 ? "flex-1" : ""}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.number < step) setStep(item.number as Step);
                    }}
                    className="flex items-center gap-2"
                    aria-current={current ? "step" : undefined}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full border text-[11px] font-semibold ${
                        complete
                          ? "border-primary bg-primary text-white"
                          : current
                            ? "border-primary bg-primary-subtle text-primary"
                            : "border-border bg-bg text-muted"
                      }`}
                    >
                      {complete ? <Check className="h-3.5 w-3.5" /> : item.number}
                    </span>
                    <span className={`text-[12px] font-medium ${current || complete ? "text-text" : "text-muted"}`}>{item.label}</span>
                  </button>
                  {index < 2 ? <span className={`mx-3 h-px flex-1 ${step > item.number ? "bg-primary" : "bg-border"}`} /> : null}
                </li>
              );
            })}
          </ol>
        </nav>

        {expired ? (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
            Your stock reservation expired. Start the payment again to hold your items.
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className="space-y-4">
            <section className={`rounded-xl border p-5 transition-colors ${step === 1 ? "border-border bg-bg" : "border-border bg-surface/40"}`}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary">1</span>
                  Shipping address
                </h2>
                {step !== 1 ? (
                  <button onClick={() => setStep(1)} className="text-[11px] font-medium text-primary hover:underline">Change</button>
                ) : null}
              </div>

              {step === 1 ? (
                <div className="mt-4 space-y-2.5">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                        addressId === address.id ? "border-primary bg-primary-subtle/40" : "border-border bg-bg hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === address.id}
                        onChange={() => setAddressId(address.id)}
                        className="mt-1 h-4 w-4 accent-[var(--primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[13px] font-medium">
                          {address.label}
                          {address.isDefault ? <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted">Default</span> : null}
                        </span>
                        <span className="mt-1 block text-[12px] leading-5 text-muted">
                          {address.name} · {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">{address.phone}</span>
                      </span>
                    </label>
                  ))}

                  {showAddressForm ? (
                    <AddressForm user={user} onSave={addAddress} onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined} />
                  ) : (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-3 text-xs font-medium text-muted transition-colors hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add a new address
                    </button>
                  )}

                  {error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}

                  <Button className="mt-2 w-full sm:w-auto" onClick={continueToDelivery} disabled={!addressId}>
                    Save and continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : selectedAddress ? (
                <p className="mt-3 text-[12px] leading-5 text-muted">
                  <span className="font-medium text-text">{selectedAddress.name}</span> · {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                </p>
              ) : null}
            </section>

            <section className={`rounded-xl border p-5 ${step === 2 ? "border-border bg-bg" : "border-border bg-surface/40"}`}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${step >= 2 ? "bg-primary-subtle text-primary" : "bg-surface text-muted"}`}>2</span>
                  Delivery method
                </h2>
                {step > 2 ? <button onClick={() => setStep(2)} className="text-[11px] font-medium text-primary hover:underline">Change</button> : null}
              </div>

              {step === 2 ? (
                <div className="mt-4 space-y-2.5">
                  {[
                    { id: "standard" as const, title: "Standard delivery", eta: `${deliveryEstimate(4)} – ${deliveryEstimate(5)}`, price: subtotal >= 99900 ? 0 : 4900, icon: Truck },
                    { id: "express" as const, title: "Express delivery", eta: `${deliveryEstimate(1)} – ${deliveryEstimate(2)}`, price: 9900, icon: Zap },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors ${
                        delivery === option.id ? "border-primary bg-primary-subtle/40" : "border-border bg-bg hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={delivery === option.id}
                        onChange={() => setDelivery(option.id)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <option.icon className="h-4 w-4 text-muted" />
                      <span className="flex-1">
                        <span className="block text-[13px] font-medium">{option.title}</span>
                        <span className="block text-[11px] text-muted">Arrives {option.eta}</span>
                      </span>
                      <span className={`price-num text-[13px] font-semibold ${option.price === 0 ? "text-success" : ""}`}>
                        {option.price === 0 ? "Free" : formatINR(option.price)}
                      </span>
                    </label>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={() => { setStep(3); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      Continue to payment <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-muted">
                  {delivery === "express" ? "Express" : "Standard"} · {delivery === "express" ? formatINR(9900) : shipping === 0 ? "Free" : formatINR(shipping)}
                </p>
              )}
            </section>

            <section className={`rounded-xl border p-5 ${step === 3 ? "border-border bg-bg" : "border-border bg-surface/40"}`}>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${step >= 3 ? "bg-primary-subtle text-primary" : "bg-surface text-muted"}`}>3</span>
                Payment
              </h2>

              {step === 3 ? (
                <div className="mt-4 space-y-2.5">
                  {payMethods.map((item) => (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        method === item.id ? "border-primary bg-primary-subtle/40" : "border-border bg-bg hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={method === item.id}
                        onChange={() => setMethod(item.id)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <item.icon className="h-4 w-4 text-muted" />
                      <span className="flex-1">
                        <span className="block text-[13px] font-medium">{item.label}</span>
                        <span className="block text-[11px] text-muted">{item.copy}</span>
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-border bg-surface/50 p-3 opacity-60">
                    <input type="radio" disabled className="h-4 w-4" />
                    <span className="text-[13px] font-medium">Cash on delivery</span>
                    <span className="ml-auto text-[10px] text-muted">Unavailable in demo</span>
                  </label>

                  {session ? (
                    <div className="rounded-lg border border-info/30 bg-info/5 p-3.5">
                      <p className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium">
                        <span>Order {session.order.orderNumber} is waiting for payment</span>
                        <Countdown
                          target={session.reservationExpiresAt}
                          className="text-[11px] font-medium text-warning"
                          onExpire={() => setExpired(true)}
                        />
                      </p>
                      <p className="mt-1 text-[11px] text-muted">Your items are held while you pay.</p>
                      <Button className="mt-3 w-full" onClick={startPayment} loading={creating}>
                        <Lock className="h-3.5 w-3.5" /> Complete payment · {formatINR(session.order.total)}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}
                      <Button className="mt-2 w-full" size="lg" onClick={startPayment} loading={creating}>
                        <Lock className="h-4 w-4" /> Pay {formatINR(total)} securely
                      </Button>
                      <p className="text-center text-[10px] text-muted">
                        You will be taken to a secure payment sheet. Card details never touch our servers.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-muted">Choose how you would like to pay.</p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-[96px] lg:self-start">
            <div className="rounded-xl border border-border bg-surface/50 p-5">
              <h2 className="text-sm font-semibold">Order summary <span className="font-normal text-muted">({count})</span></h2>
              <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={item.sku} className="flex gap-3">
                    <div className="relative shrink-0">
                      <img src={item.image} alt="" className="h-16 w-14 rounded-md bg-surface object-cover" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-text px-1 text-[9px] font-semibold text-bg">{item.qty}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[12px] font-medium leading-4">{item.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{[item.options.colour, item.options.size].filter(Boolean).join(" · ")}</p>
                      <p className="price-num mt-1 text-[12px] font-semibold">{formatINR(item.lineTotal)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[12px]">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="price-num">{formatINR(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className={`price-num ${shipping === 0 ? "text-success" : ""}`}>{shipping === 0 ? "Free" : formatINR(shipping)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="text-muted">Included</dd></div>
                <div className="flex items-baseline justify-between border-t border-border pt-2.5">
                  <dt className="text-[13px] font-semibold">Total</dt>
                  <dd className="price-num text-lg font-bold">{formatINR(total)}</dd>
                </div>
              </dl>
              {session ? (
                <div className="mt-3 rounded-lg bg-bg px-3 py-2 text-center text-[10px] text-muted">
                  Reservation <Countdown target={session.reservationExpiresAt} className="font-medium text-warning" onExpire={() => setExpired(true)} />
                </div>
              ) : null}
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-[10px] text-muted">
                <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Secure checkout · no card details stored</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Delivering to {selectedAddress?.city ?? "—"}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <PaymentSheet
        open={sheetOpen}
        session={session}
        initialMethod={method}
        onClose={() => setSheetOpen(false)}
        onPaid={onPaid}
      />
    </div>
  );
}

function AddressForm({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (address: Omit<Address, "id">) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    label: "Home",
    name: user.name,
    phone: user.phone ?? "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "pincode" && typeof value === "string" && value.length === 6) {
        const match = PIN_MAP[value.slice(0, 3)];
        if (match) {
          if (!next.city) next.city = match[0];
          if (!next.state) next.state = match[1];
        }
      }
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        phone: form.phone.startsWith("+91") ? form.phone : `+91 ${form.phone}`,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-bg p-4">
      <p className="text-[12px] font-semibold">New address</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input label="Full name" value={form.name} onChange={(event) => set("name", event.target.value)} required />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) => set("phone", event.target.value.replace(/^\+91\s?/, ""))}
          prefix="+91"
          inputMode="tel"
          required
        />
        <Input label="PIN code" value={form.pincode} onChange={(event) => set("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" required className="sm:col-span-2 sm:max-w-[200px]" hint="City and state fill in automatically" />
        <Input label="Address" value={form.line1} onChange={(event) => set("line1", event.target.value)} required className="sm:col-span-2" placeholder="House number, street, area" />
        <Input label="Landmark (optional)" value={form.line2} onChange={(event) => set("line2", event.target.value)} className="sm:col-span-2" />
        <Input label="City" value={form.city} onChange={(event) => set("city", event.target.value)} required />
        <Input label="State" value={form.state} onChange={(event) => set("state", event.target.value)} required />
        <Input label="Label" value={form.label} onChange={(event) => set("label", event.target.value)} placeholder="Home, Office…" />
      </div>
      {error ? <p className="mt-2 text-xs text-danger" role="alert">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <Button type="submit" size="sm" loading={saving}>Save address</Button>
        {onCancel ? <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  );
}
