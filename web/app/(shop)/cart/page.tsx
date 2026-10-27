import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/cart-page-client";

export const metadata: Metadata = {
  title: "Shopping cart",
  description: "Review your bag and continue to secure checkout.",
};

export default function CartPage() {
  return <CartPageClient />;
}
