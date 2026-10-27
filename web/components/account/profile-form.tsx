"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatDate, initials } from "@/lib/format";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty = name.trim() !== user.name || phone.trim() !== (user.phone ?? "");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/auth/me", {
        method: "PATCH",
        body: { name: name.trim(), phone: phone.trim() || undefined },
      });
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-surface/60 p-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-base font-semibold text-white">
          {initials(user.name)}
        </span>
        <div>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-muted">{user.email}</p>
          <p className="mt-1 text-[11px] text-muted">
            Member since {formatDate(user.createdAt, "long")} · {user.role === "admin" ? "Administrator" : "Customer"}
          </p>
        </div>
      </section>

      <form onSubmit={save} className="max-w-xl space-y-4 rounded-xl border border-border p-4 sm:p-5">
        <div>
          <h2 className="text-sm font-semibold">Personal details</h2>
          <p className="mt-0.5 text-xs text-muted">This name appears on your orders and invoices.</p>
        </div>
        <Input
          label="Full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          minLength={2}
          maxLength={80}
          required
        />
        <Input label="Email" value={user.email} disabled hint="Contact support to change your email address." />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          placeholder="Add a mobile number"
          maxLength={20}
        />
        {error ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p>
        ) : null}
        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}
