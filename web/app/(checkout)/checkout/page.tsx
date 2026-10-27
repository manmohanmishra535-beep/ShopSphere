import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout at ShopSphere.",
};

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  return <CheckoutFlow user={user} />;
}
