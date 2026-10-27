"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Settings } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input, Switch } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [shippingFee, setShippingFee] = useState(String(settings.shippingFee / 100));
  const [threshold, setThreshold] = useState(String(settings.freeShippingThreshold / 100));
  const [expressFee, setExpressFee] = useState(String(settings.expressFee / 100));
  const [taxRate, setTaxRate] = useState(String(settings.taxRatePercent));
  const [lowStockEmail, setLowStockEmail] = useState(settings.lowStockEmail);
  const [orderEmail, setOrderEmail] = useState(settings.orderEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/admin/settings", {
        method: "PATCH",
        body: {
          storeName: storeName.trim(),
          supportEmail: supportEmail.trim(),
          shippingFee: Math.round(Number(shippingFee) * 100),
          freeShippingThreshold: Math.round(Number(threshold) * 100),
          expressFee: Math.round(Number(expressFee) * 100),
          taxRatePercent: Number(taxRate),
          lowStockEmail,
          orderEmail,
        },
      });
      toast.success("Settings saved", "New orders will use these rates.");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Store details</h2>
        <p className="text-[11px] text-muted">Shown on invoices and customer emails.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Store name" value={storeName} onChange={(event) => setStoreName(event.target.value)} required minLength={2} maxLength={80} />
          <Input label="Support email" type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} required />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Shipping & tax</h2>
        <p className="text-[11px] text-muted">Amounts are in rupees. Tax applies to the cart subtotal.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Standard shipping (₹)" type="number" min="0" step="1" value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} prefix="₹" />
          <Input label="Free shipping over (₹)" type="number" min="0" step="1" value={threshold} onChange={(event) => setThreshold(event.target.value)} prefix="₹" />
          <Input label="Express shipping (₹)" type="number" min="0" step="1" value={expressFee} onChange={(event) => setExpressFee(event.target.value)} prefix="₹" />
          <Input label="Tax rate (%)" type="number" min="0" max="28" step="0.5" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} suffix="%" />
        </div>
        <p className="mt-3 rounded-md bg-surface px-3 py-2 text-[11px] leading-5 text-muted">
          Preview: a ₹1,000 cart attracts {taxRate || 0}% tax and{" "}
          {Number(threshold) > 0 ? `free shipping above ₹${threshold}` : "shipping as charged"}.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <p className="text-[11px] text-muted">Email delivery is mocked in this demo and logged to the API console.</p>
        <div className="mt-4 space-y-3">
          <Switch checked={orderEmail} onChange={setOrderEmail} label="Send order confirmation and status emails" />
          <Switch checked={lowStockEmail} onChange={setLowStockEmail} label="Alert me when a variant drops below its threshold" />
        </div>
      </section>

      {error ? <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2.5 text-xs text-danger" role="alert">{error}</p> : null}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-3">
        <p className="text-[11px] text-muted">Changes apply to new carts and orders immediately.</p>
        <Button type="submit" size="sm" loading={saving}>
          <Save className="h-4 w-4" /> Save settings
        </Button>
      </div>
    </form>
  );
}
