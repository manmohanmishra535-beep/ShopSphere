import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage the addresses saved to your ShopSphere account.",
};

export default async function AddressesPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <header>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em]">Addresses</h1>
        <p className="mt-1 text-sm text-muted">Keep your delivery details up to date.</p>
      </header>
      <section className="mt-6">
        <AddressManager initial={user?.addresses ?? []} />
      </section>
    </div>
  );
}
