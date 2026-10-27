"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, PackageCheck, RotateCcw, Truck } from "lucide-react";
import type { Order } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { formatINR } from "@/lib/format";

export function AdminOrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [carrier, setCarrier] = useState(order.tracking?.carrier ?? "Delhivery");
  const [awb, setAwb] = useState(order.tracking?.awb ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking?.url ?? "");
  const [amount, setAmount] = useState(String(order.total / 100));
  const [reason, setReason] = useState("Customer return approved");
  const [error, setError] = useState("");

  const setStatus = async (status: "packed" | "shipped" | "delivered", tracking?: { carrier: string; awb: string; url?: string }) => {
    setLoading(status);
    setError("");
    try {
      await api(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: { status, tracking },
      });
      toast.success("Order updated", `Now marked as ${status}.`);
      setShipOpen(false);
      router.refresh();
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      if (!shipOpen) toast.error("Could not update order", message);
    } finally {
      setLoading(null);
    }
  };

  const cancel = async () => {
    setLoading("cancelled");
    try {
      await api(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: { status: "cancelled", note: "Cancelled by admin" },
      });
      toast.success("Order cancelled", "Reserved stock has been released.");
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Could not cancel order", errorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const refund = async () => {
    setLoading("refund");
    setError("");
    try {
      await api(`/orders/${order.id}/refund`, {
        method: "POST",
        body: { amount: Math.round(Number(amount) * 100), reason },
      });
      toast.success("Refund issued", "The payment has been marked refunded.");
      setRefundOpen(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const canAdvance = order.status !== "cancelled" && order.payment.status === "paid";
  const canCancel = ["pending", "paid", "packed"].includes(order.status);

  return (
    <div className="space-y-2">
      {canAdvance && order.status === "paid" ? (
        <Button className="w-full" size="sm" loading={loading === "packed"} onClick={() => void setStatus("packed")}>
          <PackageCheck className="h-4 w-4" /> Mark as packed
        </Button>
      ) : null}

      {canAdvance && order.status === "packed" ? (
        <Button className="w-full" size="sm" onClick={() => setShipOpen(true)}>
          <Truck className="h-4 w-4" /> Add tracking & ship
        </Button>
      ) : null}

      {canAdvance && order.status === "shipped" ? (
        <Button className="w-full" size="sm" loading={loading === "delivered"} onClick={() => void setStatus("delivered")}>
          <CheckCircle2 className="h-4 w-4" /> Mark as delivered
        </Button>
      ) : null}

      {order.payment.status === "paid" ? (
        <Button variant="outline" className="w-full" size="sm" onClick={() => setRefundOpen(true)}>
          <RotateCcw className="h-4 w-4" /> Issue refund
        </Button>
      ) : null}

      {canCancel ? (
        <Button variant="ghost" className="w-full text-danger hover:bg-danger/5" size="sm" onClick={() => setCancelOpen(true)}>
          <Ban className="h-4 w-4" /> Cancel order
        </Button>
      ) : null}

      {!canAdvance && order.status !== "cancelled" ? (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-[11px] leading-5 text-warning">
          Payment is {order.payment.status}. Fulfilment actions unlock once payment is captured.
        </p>
      ) : null}

      <Modal
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        title="Add tracking details"
        description="Required before an order can be marked shipped."
        size="sm"
      >
        <div className="space-y-3.5">
          <Input label="Carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="Delhivery" required />
          <Input label="AWB / tracking number" value={awb} onChange={(event) => setAwb(event.target.value)} placeholder="1234567890" required />
          <Input label="Tracking URL" hint="Optional" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://…" type="url" />
          {error ? <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setShipOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              loading={loading === "shipped"}
              disabled={!carrier.trim() || !awb.trim()}
              onClick={() =>
                void setStatus("shipped", {
                  carrier: carrier.trim(),
                  awb: awb.trim(),
                  url: trackingUrl.trim() || undefined,
                })
              }
            >
              Mark shipped
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Issue a refund"
        description={`Order total ${formatINR(order.total)}. Partial refunds are supported.`}
        size="sm"
      >
        <div className="space-y-3.5">
          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            max={order.total / 100}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Textarea label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} minLength={3} />
          {error ? <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button size="sm" loading={loading === "refund"} onClick={() => void refund()} disabled={!amount || Number(amount) <= 0 || reason.trim().length < 3}>
              Refund {formatINR(Math.round(Number(amount || 0) * 100))}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => void cancel()}
        loading={loading === "cancelled"}
        title="Cancel this order?"
        description={`Order ${order.orderNumber} will be cancelled, stock restocked and any captured payment refunded.`}
        confirmLabel="Cancel order"
      />
    </div>
  );
}
