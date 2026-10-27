"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Address } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/format";

type FormState = {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const emptyForm: FormState = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function toForm(address: Address): FormState {
  return {
    label: address.label,
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: Boolean(address.isDefault),
  };
}

export function AddressManager({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      name: addresses[0]?.name ?? "",
      phone: addresses[0]?.phone ?? "",
      isDefault: addresses.length === 0,
    });
    setError("");
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setForm(toForm(address));
    setError("");
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      line2: form.line2.trim() || undefined,
    };
    try {
      if (editing) {
        const data = await api<{ address: Address }>(`/me/addresses/${editing.id}`, {
          method: "PATCH",
          body: payload,
        });
        setAddresses((current) =>
          current.map((address) =>
            address.id === editing.id
              ? data.address
              : data.address.isDefault
                ? { ...address, isDefault: false }
                : address
          )
        );
        toast.success("Address updated");
      } else {
        const data = await api<{ address: Address }>("/me/addresses", { method: "POST", body: payload });
        setAddresses((current) =>
          data.address.isDefault
            ? [...current.map((address) => ({ ...address, isDefault: false })), data.address]
            : [...current, data.address]
        );
        toast.success("Address added");
      }
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address: Address) => {
    try {
      const data = await api<{ address: Address }>(`/me/addresses/${address.id}`, {
        method: "PATCH",
        body: { isDefault: true },
      });
      setAddresses((current) =>
        current.map((item) => (item.id === data.address.id ? data.address : { ...item, isDefault: false }))
      );
      toast.success("Default address updated");
    } catch (err) {
      toast.error("Could not update address", errorMessage(err));
    }
  };

  const remove = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await api(`/me/addresses/${removing.id}`, { method: "DELETE" });
      setAddresses((current) => {
        const next = current.filter((address) => address.id !== removing.id);
        if (removing.isDefault && next[0]) next[0] = { ...next[0], isDefault: true };
        return next;
      });
      toast.success("Address removed");
      setRemoving(null);
    } catch (err) {
      toast.error("Could not remove address", errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Saved addresses</h2>
          <p className="mt-0.5 text-xs text-muted">Used at checkout to speed things up.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-bg text-muted shadow-sm">
            <MapPin className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold">No addresses yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted">Add a home or work address to make checkout faster.</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add your first address
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address.id}
              className={cn(
                "flex flex-col rounded-xl border bg-bg p-4",
                address.isDefault ? "border-primary/40 ring-1 ring-primary/15" : "border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {address.label}
                </span>
                {address.isDefault ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <Star className="h-3 w-3 fill-current" /> Default
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold">{address.name}</p>
              <address className="mt-1 flex-1 text-xs not-italic leading-5 text-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.pincode}
                <br />
                {address.phone}
              </address>
              <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(address)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {!address.isDefault ? (
                  <Button variant="ghost" size="sm" className="text-muted" onClick={() => void makeDefault(address)}>
                    <Star className="h-3.5 w-3.5" /> Set default
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted hover:text-danger"
                  onClick={() => setRemoving(address)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit address" : "Add a new address"}
        description="We only use this to deliver your orders."
        size="lg"
      >
        <form onSubmit={save} className="space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input
              label="Label"
              value={form.label}
              onChange={(event) => set("label", event.target.value)}
              placeholder="Home, Work…"
              maxLength={30}
              required
            />
            <Input
              label="Full name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              autoComplete="name"
              minLength={2}
              required
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
              autoComplete="tel"
              placeholder="10-digit mobile"
              pattern="[0-9+\-\s]{10,20}"
              required
            />
            <Input
              label="PIN code"
              value={form.pincode}
              onChange={(event) => set("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="postal-code"
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="560038"
              required
            />
          </div>
          <Input
            label="Address line 1"
            value={form.line1}
            onChange={(event) => set("line1", event.target.value)}
            autoComplete="address-line1"
            placeholder="Flat, house no., building, street"
            minLength={3}
            required
          />
          <Input
            label="Address line 2"
            hint="Optional — area, landmark"
            value={form.line2}
            onChange={(event) => set("line2", event.target.value)}
            autoComplete="address-line2"
            placeholder="Indiranagar"
          />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input
              label="City"
              value={form.city}
              onChange={(event) => set("city", event.target.value)}
              autoComplete="address-level2"
              required
            />
            <Input
              label="State"
              value={form.state}
              onChange={(event) => set("state", event.target.value)}
              autoComplete="address-level1"
              required
            />
          </div>
          <Checkbox
            label="Make this my default address"
            checked={form.isDefault}
            onChange={(checked) => set("isDefault", checked)}
          />
          {error ? (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Add address"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        loading={deleting}
        title="Remove this address?"
        description={removing ? `${removing.label} · ${removing.line1}, ${removing.city}` : ""}
        confirmLabel="Remove address"
      />
    </div>
  );
}
