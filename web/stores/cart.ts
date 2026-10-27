"use client";

import { create } from "zustand";
import { api, errorMessage } from "@/lib/client";
import type { CartResponse } from "@/lib/types";
import { toast } from "@/components/ui/toast";

interface CartState extends CartResponse {
  loading: boolean;
  initialized: boolean;
  drawerOpen: boolean;
  refresh: () => Promise<void>;
  add: (productId: string, sku: string, qty?: number, options?: { openDrawer?: boolean; silent?: boolean }) => Promise<boolean>;
  setQty: (sku: string, qty: number) => Promise<void>;
  remove: (sku: string) => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  reset: () => void;
}

const empty: CartResponse = { items: [], count: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };

let inflight: Promise<void> | null = null;

export const useCartStore = create<CartState>((set, get) => ({
  ...empty,
  loading: false,
  initialized: false,
  drawerOpen: false,

  refresh: async () => {
    if (inflight) return inflight;
    set({ loading: true });
    inflight = (async () => {
      try {
        const cart = await api<CartResponse>("/cart");
        set({ ...cart, loading: false, initialized: true });
      } catch {
        set({ loading: false, initialized: true });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },

  add: async (productId, sku, qty = 1, options) => {
    try {
      const cart = await api<CartResponse>("/cart/items", {
        method: "PUT",
        body: { productId, sku, qty },
      });
      set({ ...cart, drawerOpen: options?.openDrawer ?? true });
      if (!options?.silent) toast.success("Added to cart", "Your bag is up to date.");
      return true;
    } catch (error) {
      toast.error("Could not add to cart", errorMessage(error));
      return false;
    }
  },

  setQty: async (sku, qty) => {
    const current = get();
    const item = current.items.find((i) => i.sku === sku);
    if (!item) return;
    if (qty > item.available) {
      toast.error("Not enough stock", `Only ${item.available} available in this option.`);
    }
    const capped = Math.min(qty, item.available);
    const optimisticItems = current.items.map((i) =>
      i.sku === sku ? { ...i, qty: capped, lineTotal: i.price * capped } : i
    );
    const subtotal = optimisticItems.reduce((sum, i) => sum + i.lineTotal, 0);
    set({
      items: optimisticItems,
      subtotal,
      count: optimisticItems.reduce((sum, i) => sum + i.qty, 0),
      total: subtotal + current.shipping,
    });

    try {
      const cart = await api<CartResponse>("/cart/items", {
        method: "PUT",
        body: { productId: item.productId, sku, qty: capped },
      });
      set({ ...cart });
    } catch (error) {
      toast.error("Could not update quantity", errorMessage(error));
      await get().refresh();
    }
  },

  remove: async (sku) => {
    try {
      const cart = await api<CartResponse>(`/cart/items/${encodeURIComponent(sku)}`, { method: "DELETE" });
      set({ ...cart });
      toast.info("Removed from cart");
    } catch (error) {
      toast.error("Could not remove item", errorMessage(error));
    }
  },

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  reset: () => set({ ...empty, initialized: true }),
}));
