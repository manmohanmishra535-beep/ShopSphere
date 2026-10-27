"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import type { CustomerRow } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatDate, formatINR, initials, cn } from "@/lib/format";

export function CustomerTable({ initial, currentUserId }: { initial: CustomerRow[]; currentUserId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const toggleRole = async (row: CustomerRow) => {
    const nextRole = row.role === "admin" ? "customer" : "admin";
    setBusy(row.id);
    try {
      await api(`/admin/users/${row.id}`, { method: "PATCH", body: { role: nextRole } });
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, role: nextRole } : item)));
      toast.success("Role updated", `${row.name} is now ${nextRole === "admin" ? "an administrator" : "a customer"}.`);
      router.refresh();
    } catch (error) {
      toast.error("Could not update role", errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-bg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface/60 text-[10px] uppercase tracking-[0.1em] text-muted">
              <th className="px-4 py-2.5 font-semibold">Customer</th>
              <th className="px-4 py-2.5 font-semibold">City</th>
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="px-4 py-2.5 text-right font-semibold">Orders</th>
              <th className="px-4 py-2.5 text-right font-semibold">Spend</th>
              <th className="px-4 py-2.5 text-right font-semibold">Last order</th>
              <th className="px-4 py-2.5 text-right font-semibold">Joined</th>
              <th className="px-4 py-2.5 text-right font-semibold">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const self = row.id === currentUserId;
              return (
                <tr key={row.id} className="transition-colors hover:bg-primary-subtle/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold", row.role === "admin" ? "bg-primary text-white" : "bg-surface text-muted")}>
                        {initials(row.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium">
                          {row.name}
                          {self ? <span className="ml-1.5 text-[10px] font-normal text-muted">(you)</span> : null}
                        </p>
                        <p className="truncate text-[11px] text-muted">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted">{row.addressCity ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.role === "admin" ? "primary" : "neutral"}>{row.role}</Badge>
                  </td>
                  <td className="price-num px-4 py-3 text-right text-[13px]">{row.orderCount}</td>
                  <td className="price-num px-4 py-3 text-right text-[13px] font-medium">{formatINR(row.totalSpend)}</td>
                  <td className="px-4 py-3 text-right text-[12px] text-muted">{row.lastOrderAt ? formatDate(row.lastOrderAt) : "Never"}</td>
                  <td className="px-4 py-3 text-right text-[12px] text-muted">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={busy === row.id}
                      disabled={self}
                      title={self ? "You cannot change your own role" : undefined}
                      onClick={() => void toggleRole(row)}
                    >
                      {row.role === "admin" ? <UserRound className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {row.role === "admin" ? "Make customer" : "Make admin"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">No customers match this view.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
