import Link from "next/link";
import { Compass, Home, Package, Search } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16 text-center">
      <Link href="/" className="mb-10 inline-flex items-center gap-2.5" aria-label="ShopSphere home">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="8.5" />
            <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
            <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="text-xl font-semibold tracking-[-0.03em]">
          Shop<span className="text-primary">Sphere</span>
        </span>
      </Link>

      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Error 404</p>
      <h1 className="mt-4 text-[44px] font-semibold leading-none tracking-[-0.05em] sm:text-[64px]">Off the map.</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted">
        The page you&apos;re looking for has moved, sold out, or never existed. Let&apos;s get you back to something worth
        keeping.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonStyles("primary")}>
          <Home className="h-4 w-4" /> Back home
        </Link>
        <Link href="/products" className={buttonStyles("outline")}>
          <Compass className="h-4 w-4" /> Browse products
        </Link>
        <Link href="/account/orders" className={buttonStyles("ghost")}>
          <Package className="h-4 w-4" /> Your orders
        </Link>
      </div>

      <div className="mt-12 flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs text-muted">
        <Search className="h-3.5 w-3.5" />
        Looking for something specific? Use search in the header.
      </div>
    </div>
  );
}
