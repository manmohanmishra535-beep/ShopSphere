"use client";

import { create } from "zustand";
import { api, ClientApiError, errorMessage } from "@/lib/client";
import type { WishlistResponse } from "@/lib/types";
import { toast } from "@/components/ui/toast";

interface WishlistState {
  ids: string[];
  loading: boolean;
  signedIn: boolean;
  setSignedIn: (value: boolean) => void;
  refresh: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  loading: false,
  signedIn: false,
  setSignedIn: (value) => set({ signedIn: value }),
  refresh: async () => {
    if (!get().signedIn) return;
    try {
      const data = await api<WishlistResponse>("/wishlist");
      set({ ids: data.ids, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  toggle: async (productId) => {
    if (!get().signedIn) {
      toast.info("Sign in to save favourites", "Your wishlist travels with your account.");
      return;
    }
    const active = get().ids.includes(productId);
    set((state) => ({
      ids: active ? state.ids.filter((id) => id !== productId) : [...state.ids, productId],
    }));
    try {
      const data = await api<{ ids: string[] }>(`/wishlist/${productId}`, {
        method: active ? "DELETE" : "POST",
      });
      set({ ids: data.ids });
      toast.success(active ? "Removed from wishlist" : "Saved to wishlist");
    } catch (error) {
      set({ ids: get().ids });
      if (error instanceof ClientApiError && error.status === 401) {
        toast.info("Sign in to save favourites");
        set({ signedIn: false });
      } else {
        toast.error("Could not update wishlist", errorMessage(error));
      }
    }
  },
  remove: async (productId) => {
    try {
      const data = await api<{ ids: string[] }>(`/wishlist/${productId}`, { method: "DELETE" });
      set({ ids: data.ids });
      toast.info("Removed from wishlist");
    } catch (error) {
      toast.error("Could not remove item", errorMessage(error));
    }
  },
}));
