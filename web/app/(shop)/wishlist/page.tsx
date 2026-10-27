import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser, getWishlist } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { WishlistGrid } from "@/components/shop/wishlist-grid";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Pieces you've saved for later.",
};

export default async function WishlistPage() {
  const [user, wishlist] = await Promise.all([getCurrentUser(), getWishlist()]);

  return (
    <div className="container-shop py-8 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.03em]">Wishlist</h1>
          <p className="mt-1 text-sm text-muted">
            {wishlist && wishlist.data.length > 0
              ? `${wishlist.data.length} ${wishlist.data.length === 1 ? "piece" : "pieces"} you're keeping an eye on.`
              : "The things you love, all in one place."}
          </p>
        </div>
        <Link href="/products" className={buttonStyles("outline", "sm")}>
          Continue shopping
        </Link>
      </header>

      {!user ? (
        <EmptyState
          className="mt-8"
          icon={<Heart className="h-5 w-5" />}
          title="Sign in to see your wishlist"
          description="Your saved pieces travel with your account, across every device."
          action={
            <div className="flex gap-2">
              <Link href="/sign-in?next=/wishlist" className={buttonStyles("primary")}>Sign in</Link>
              <Link href="/sign-up?next=/wishlist" className={buttonStyles("outline")}>Create account</Link>
            </div>
          }
        />
      ) : wishlist && wishlist.data.length > 0 ? (
        <WishlistGrid products={wishlist.data} />
      ) : (
        <EmptyState
          className="mt-8"
          icon={<Heart className="h-5 w-5" />}
          title="Nothing saved yet"
          description="Tap the heart on any product and it will wait for you here."
          action={
            <Link href="/products" className={buttonStyles("primary")}>
              Browse the collection
            </Link>
          }
        />
      )}
    </div>
  );
}
