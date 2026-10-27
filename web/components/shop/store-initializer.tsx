"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";

export function StoreInitializer({ signedIn }: { signedIn: boolean }) {
  const refreshCart = useCartStore((state) => state.refresh);
  const refreshWishlist = useWishlistStore((state) => state.refresh);
  const setSignedIn = useWishlistStore((state) => state.setSignedIn);

  useEffect(() => {
    setSignedIn(signedIn);
    void refreshCart();
    if (signedIn) void refreshWishlist();
  }, [signedIn, refreshCart, refreshWishlist, setSignedIn]);

  return null;
}
