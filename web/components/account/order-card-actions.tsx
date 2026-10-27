"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import type { Order } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

export function OrderCardActions({ order }: { order: Order }) {
  const router = useRouter();
  const add = useCartStore((state) => state.add);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const [buying, setBuying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const buyAgain = async () => {
    setBuying(true);
    let added = 0;
    for (const item of order.items) {
      const ok = await add(item.productId, item.sku, item.qty, { silent: true, openDrawer: false });
      if (ok) added += item.qty;
    }
    setBuying(false);
    if (added > 0) {
      openDrawer();
      toast.success("Added to your bag", `${added} item${added === 1 ? "" : "s"} from order ${order.orderNumber}.`);
    } else {
      toast.error("Nothing available", "The items from this order are currently out of stock.");
    }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      await api(`/orders/${order.id}/cancel`, { method: "POST", body: { reason: "Changed my mind" } });
      toast.success("Order cancelled", "Any payment will be refunded within 3–5 working days.");
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Could not cancel order", errorMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void buyAgain()} loading={buying}>
          <RotateCcw className="h-3.5 w-3.5" /> Buy again
        </Button>
        {order.canCancel ? (
          <Button variant="ghost" size="sm" className="text-muted" onClick={() => setConfirmOpen(true)}>
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void cancel()}
        loading={cancelling}
        title="Cancel this order?"
        description={`Order ${order.orderNumber} will be cancelled and reserved stock released. This cannot be undone.`}
        confirmLabel="Cancel order"
      />
    </>
  );
}
