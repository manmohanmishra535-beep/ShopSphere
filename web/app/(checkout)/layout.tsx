import Link from "next/link";
import { Lock } from "lucide-react";
import { StoreInitializer } from "@/components/shop/store-initializer";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <StoreInitializer signedIn />
      <header className="border-b border-border">
        <div className="container-shop flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="ShopSphere home">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8.5" />
                <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
                <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="text-[19px] font-semibold tracking-[-0.03em]">
              Shop<span className="text-primary">Sphere</span>
            </span>
          </Link>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
            <Lock className="h-3.5 w-3.5 text-success" /> Secure checkout
          </p>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border py-6">
        <div className="container-shop flex flex-col items-center justify-between gap-2 text-[10px] text-muted sm:flex-row">
          <p>© 2026 ShopSphere · Prices in INR, inclusive of taxes</p>
          <div className="flex gap-4">
            <Link href="/info/returns" className="hover:text-text">Returns</Link>
            <Link href="/info/privacy" className="hover:text-text">Privacy</Link>
            <Link href="/info/contact" className="hover:text-text">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
