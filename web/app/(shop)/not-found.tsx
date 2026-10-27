import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export default function ShopNotFound() {
  return (
    <div className="container-shop flex flex-col items-center justify-center py-20 text-center md:py-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Error 404</p>
      <h1 className="mt-4 text-[40px] font-semibold leading-none tracking-[-0.05em] sm:text-[56px]">Off the map.</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted">
        This page has moved, sold out, or never existed. Let&apos;s find you something else worth keeping.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonStyles("primary")}>
          <Home className="h-4 w-4" /> Back home
        </Link>
        <Link href="/products" className={buttonStyles("outline")}>
          <Compass className="h-4 w-4" /> Browse products
        </Link>
      </div>
    </div>
  );
}
