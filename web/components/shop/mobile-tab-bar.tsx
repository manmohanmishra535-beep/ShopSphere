"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/format";
import { useCartStore } from "@/stores/cart";
import type { User as UserType } from "@/lib/types";

export function MobileTabBar({ user }: { user: UserType | null }) {
  const pathname = usePathname();
  const count = useCartStore((state) => state.count);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const items = [
    { label: "Home", href: "/", icon: Home, match: (path: string) => path === "/" },
    { label: "Shop", href: "/products", icon: Search, match: (path: string) => path.startsWith("/products") },
    { label: "Wishlist", href: "/wishlist", icon: Heart, match: (path: string) => path.startsWith("/wishlist") },
    { label: "Cart", href: "#cart", icon: ShoppingBag, match: () => false },
    {
      label: "Account",
      href: user ? "/account/orders" : "/sign-in",
      icon: User,
      match: (path: string) => path.startsWith("/account"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Mobile tab bar"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          if (item.label === "Cart") {
            return (
              <button
                key={item.label}
                onClick={openDrawer}
                className="relative flex flex-col items-center justify-center gap-1 text-muted"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
                {count > 0 ? (
                  <span className="absolute right-[calc(50%-18px)] top-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white">
                    {count}
                  </span>
                ) : null}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn("relative flex flex-col items-center justify-center gap-1", active ? "text-primary" : "text-muted")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active ? <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-primary" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
