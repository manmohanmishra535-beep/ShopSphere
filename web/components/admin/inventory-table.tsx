"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, SlidersHorizontal } from "lucide-react";
import type { InventoryRow } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatDateTime, cn } from "@/lib/format";

interface Movement {
  id: string;
  sku: string;
  delta: number;
  reason: string;
  note?: string;
  actor: string;
  at: string;
}

export function InventoryTable({ initial }: { initial: InventoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState("10");
  const [reason, setReason] = useState<"restock" | "damage" | "correction">("restock");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Movement[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const open = async (row: InventoryRow) => {
    setSelected(row);
    setMode("add");
    setQuantity("10");
    setReason("restock");
    setNote("");
    setError("");
    setHistory(null);
    setHistoryLoading(true);
    try {
      const data = await api<{ data: Movement[] }>(`/admin/inventory/${encodeURIComponent(row.sku)}/history`);
      setHistory(data.data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const data = await api<{ onHand: number; reserved: number; available: number; delta: number; history: Movement[] }>(
        `/admin/inventory/${encodeURIComponent(selected.sku)}`,
        {
          method: "PATCH",
          body: {
            mode,
            quantity: Math.max(0, Number(quantity) || 0),
            reason,
            note: note.trim() || undefined,
          },
        }
      );
      setRows((current) =>
        current.map((row) =>
          row.sku === selected.sku
            ? {
                ...row,
                onHand: data.onHand,
                reserved: data.reserved,
                available: data.available,
                low: data.available > 0 && data.available <= row.lowStockThreshold,
                out: data.available === 0,
              }
            : row
        )
      );
      setHistory(data.history);
      toast.success("Stock updated", `${selected.sku}: ${data.delta > 0 ? "+" : ""}${data.delta} units.`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-bg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface/60 text-[10px] uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-2.5 font-semibold">Product</th>
                <th className="px-4 py-2.5 font-semibold">SKU / options</th>
                <th className="px-4 py-2.5 text-right font-semibold">On hand</th>
                <th className="px-4 py-2.5 text-right font-semibold">Reserved</th>
                <th className="px-4 py-2.5 text-right font-semibold">Available</th>
                <th className="px-4 py-2.5 text-right font-semibold">State</th>
                <th className="px-4 py-2.5 text-right font-semibold">Updated</th>
                <th className="px-4 py-2.5 text-right font-semibold">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.sku} className="transition-colors hover:bg-primary-subtle/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={row.image} alt="" className="h-10 w-8 rounded border border-border object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[13px] font-medium">{row.productTitle}</p>
                        <p className="text-[10px] capitalize text-muted">{row.status}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[11px] text-text">{row.sku}</p>
                    <p className="text-[10px] text-muted">{Object.values(row.options).filter(Boolean).join(" / ") || "Standard"}</p>
                  </td>
                  <td className="price-num px-4 py-3 text-right text-[13px]">{row.onHand}</td>
                  <td className="price-num px-4 py-3 text-right text-[13px] text-muted">{row.reserved}</td>
                  <td className={cn("price-num px-4 py-3 text-right text-[13px] font-semibold", row.out ? "text-danger" : row.low ? "text-warning" : "text-text")}>
                    {row.available}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.out ? <Badge tone="danger">Out</Badge> : row.low ? <Badge tone="warning">Low</Badge> : <Badge tone="success">Healthy</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right text-[11px] text-muted">{formatDateTime(row.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => void open(row)}>
                      <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">No variants match this view.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Adjust ${selected.sku}` : "Adjust stock"}
        description={selected ? `${selected.productTitle} · ${Object.values(selected.options).filter(Boolean).join(" / ") || "Standard"}` : undefined}
        size="lg"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-surface/50 p-3 text-center">
              {[
                { label: "On hand", value: selected.onHand },
                { label: "Reserved", value: selected.reserved },
                { label: "Available", value: selected.available },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="price-num text-lg font-semibold">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Adjustment" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                <option value="add">Add stock</option>
                <option value="remove">Remove stock</option>
                <option value="set">Set on hand to</option>
              </Select>
              <Input label="Quantity" type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Reason" value={reason} onChange={(event) => setReason(event.target.value as typeof reason)}>
                <option value="restock">Restock / new stock</option>
                <option value="damage">Damage or loss</option>
                <option value="correction">Stock correction</option>
              </Select>
              <Input label="Note" hint="Optional" value={note} onChange={(event) => setNote(event.target.value)} placeholder="PO-1042 received" />
            </div>

            {error ? <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p> : null}

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-[11px] text-muted">
                {mode === "add" && `New on hand: ${selected.onHand + (Number(quantity) || 0)}`}
                {mode === "remove" && `New on hand: ${selected.onHand - (Number(quantity) || 0)}`}
                {mode === "set" && `New on hand: ${Number(quantity) || 0}`}
              </p>
              <Button size="sm" loading={saving} onClick={() => void save()}>
                Save adjustment
              </Button>
            </div>

            <div className="border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <History className="h-3.5 w-3.5" /> Recent movements
              </p>
              {historyLoading ? (
                <p className="mt-2 text-xs text-muted">Loading…</p>
              ) : history && history.length > 0 ? (
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                  {history.slice(0, 8).map((movement) => (
                    <li key={movement.id} className="flex items-center justify-between gap-3 rounded-md bg-surface/60 px-2.5 py-1.5 text-[11px]">
                      <span className={cn("price-num font-semibold", movement.delta > 0 ? "text-success" : "text-danger")}>
                        {movement.delta > 0 ? "+" : ""}{movement.delta}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-muted">
                        {movement.reason}{movement.note ? ` · ${movement.note}` : ""}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted/70">{formatDateTime(movement.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">No movements recorded yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
