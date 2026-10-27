"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Package, UserRound } from "lucide-react";
import { cn } from "@/lib/format";

const links = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
              active ? "bg-primary-subtle text-primary" : "text-muted hover:bg-surface hover:text-text"
            )}
          >
            <link.icon className="h-4 w-4" strokeWidth={1.8} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
